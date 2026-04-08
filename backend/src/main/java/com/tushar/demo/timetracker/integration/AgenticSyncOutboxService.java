package com.tushar.demo.timetracker.integration;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tushar.demo.timetracker.model.AgenticSyncOutboxEvent;
import com.tushar.demo.timetracker.model.AgenticSyncOutboxStatus;
import com.tushar.demo.timetracker.model.Project;
import com.tushar.demo.timetracker.model.TimeEntry;
import com.tushar.demo.timetracker.model.Users;
import com.tushar.demo.timetracker.repository.AgenticSyncOutboxRepository;
import com.tushar.demo.timetracker.repository.TimeEntryRepository;
import com.tushar.demo.timetracker.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AgenticSyncOutboxService {
    private static final Logger logger = LoggerFactory.getLogger(AgenticSyncOutboxService.class);
    private static final int BACKFILL_PAGE_SIZE = 250;

    private static final String EVENT_TIME_ENTRY_SYNC = "TIME_ENTRY_SYNC";
    private static final String EVENT_TIME_ENTRY_DELETION = "TIME_ENTRY_DELETION";
    private static final String EVENT_TIME_ENTRY_CONTINUATION = "TIME_ENTRY_CONTINUATION";
    private static final String EVENT_HABIT_SNAPSHOT = "HABIT_SNAPSHOT_SYNC";

    private final AgenticSyncOutboxRepository outboxRepository;
    private final AgenticKnowledgeSyncService syncService;
    private final UserRepository userRepository;
    private final TimeEntryRepository timeEntryRepository;
    private final ObjectMapper objectMapper;

    private final boolean outboxEnabled;
    private final int workerBatchSize;
    private final int defaultMaxAttempts;
    private final long baseRetrySeconds;
    private final long maxRetrySeconds;

    public record EnqueueResult(
            boolean accepted,
            boolean queued,
            Long eventId,
            String correlationId,
            String message
    ) {
        static EnqueueResult acceptedQueued(AgenticSyncOutboxEvent event) {
            return new EnqueueResult(true, true, event.getId(), event.getCorrelationId(), "queued");
        }

        static EnqueueResult rejected(String message) {
            return new EnqueueResult(false, false, null, null, message);
        }
    }

    public record BackfillQueueResult(
            boolean configured,
            int requested,
            int scanned,
            int queued,
            int enqueueFailed,
            int skippedActive
    ) {}

    public record QueueMetrics(
            boolean enabled,
            boolean configured,
            long pending,
            long retry,
            long processing,
            long failed,
            long success,
            long cooldownRemainingSeconds,
            String nextAttemptAt
    ) {}

    private record DispatchOutcome(boolean success, boolean retryable, String message) {
        static DispatchOutcome successful() {
            return new DispatchOutcome(true, false, "success");
        }

        static DispatchOutcome retryableFailure(String message) {
            return new DispatchOutcome(false, true, message);
        }

        static DispatchOutcome permanentFailure(String message) {
            return new DispatchOutcome(false, false, message);
        }
    }

    public AgenticSyncOutboxService(
            AgenticSyncOutboxRepository outboxRepository,
            AgenticKnowledgeSyncService syncService,
            UserRepository userRepository,
            TimeEntryRepository timeEntryRepository,
            @Value("${agentic.sync.outbox.enabled:true}") boolean outboxEnabled,
            @Value("${agentic.sync.outbox.batch-size:25}") int workerBatchSize,
            @Value("${agentic.sync.outbox.max-attempts:8}") int defaultMaxAttempts,
            @Value("${agentic.sync.outbox.base-retry-seconds:30}") long baseRetrySeconds,
            @Value("${agentic.sync.outbox.max-retry-seconds:900}") long maxRetrySeconds) {
        this.outboxRepository = outboxRepository;
        this.syncService = syncService;
        this.userRepository = userRepository;
        this.timeEntryRepository = timeEntryRepository;
        this.objectMapper = new ObjectMapper();
        this.outboxEnabled = outboxEnabled;
        this.workerBatchSize = Math.max(1, workerBatchSize);
        this.defaultMaxAttempts = Math.max(1, defaultMaxAttempts);
        this.baseRetrySeconds = Math.max(1L, baseRetrySeconds);
        this.maxRetrySeconds = Math.max(this.baseRetrySeconds, maxRetrySeconds);
    }

    public EnqueueResult enqueueTimeEntrySync(TimeEntry entry, Users user, String sourceAction) {
        if (!isQueueConfigured()) {
            return EnqueueResult.rejected("Agentic sync is not configured");
        }

        if (entry == null || entry.getId() == null || user == null || user.getId() == null) {
            return EnqueueResult.rejected("Time entry event is missing required identifiers");
        }

        if (entry.getEndTime() == null) {
            return EnqueueResult.rejected("Running timers are not queued for Agentic sync");
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("timeEntryId", entry.getId());
        payload.put("sourceAction", normalizeSourceAction(sourceAction));

        return enqueueEvent(EVENT_TIME_ENTRY_SYNC, payload, user);
    }

    public EnqueueResult enqueueTimeEntryDeletion(TimeEntry entry, Users user, String sourceAction) {
        if (!isQueueConfigured()) {
            return EnqueueResult.rejected("Agentic sync is not configured");
        }

        if (entry == null || entry.getId() == null || user == null || user.getId() == null) {
            return EnqueueResult.rejected("Time entry deletion event is missing required identifiers");
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("sourceAction", normalizeSourceAction(sourceAction));
        payload.put("entry", serializeTimeEntrySnapshot(entry));

        return enqueueEvent(EVENT_TIME_ENTRY_DELETION, payload, user);
    }

    public EnqueueResult enqueueTimeEntryContinuation(TimeEntry sourceEntry, TimeEntry continuedEntry, Users user, String sourceAction) {
        if (!isQueueConfigured()) {
            return EnqueueResult.rejected("Agentic sync is not configured");
        }

        if (sourceEntry == null || sourceEntry.getId() == null || continuedEntry == null || continuedEntry.getId() == null) {
            return EnqueueResult.rejected("Continuation event is missing source or continued entry identifiers");
        }

        if (user == null || user.getId() == null) {
            return EnqueueResult.rejected("Continuation event is missing user identity");
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("sourceEntryId", sourceEntry.getId());
        payload.put("continuedEntryId", continuedEntry.getId());
        payload.put("sourceAction", normalizeSourceAction(sourceAction));

        return enqueueEvent(EVENT_TIME_ENTRY_CONTINUATION, payload, user);
    }

    public EnqueueResult enqueueHabitSnapshot(Map<String, Object> habitSnapshot, Users user, String sourceAction) {
        if (!isQueueConfigured()) {
            return EnqueueResult.rejected("Agentic sync is not configured");
        }

        if (habitSnapshot == null || habitSnapshot.isEmpty() || user == null || user.getId() == null) {
            return EnqueueResult.rejected("Habit snapshot payload is empty or missing user context");
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("snapshot", habitSnapshot);
        payload.put("sourceAction", normalizeSourceAction(sourceAction));

        return enqueueEvent(EVENT_HABIT_SNAPSHOT, payload, user);
    }

    public BackfillQueueResult enqueueHistoricalTimeEntries(Users user, int maxEntries) {
        if (!isQueueConfigured() || user == null || user.getId() == null) {
            return new BackfillQueueResult(false, Math.max(0, maxEntries), 0, 0, 0, 0);
        }

        int requested = resolveRequestedEntries(user, maxEntries);
        int scanned = 0;
        int queued = 0;
        int enqueueFailed = 0;
        int skippedActive = 0;
        int offset = 0;

        while (scanned < requested) {
            int remaining = requested - scanned;
            int batchLimit = Math.min(BACKFILL_PAGE_SIZE, remaining);

            List<TimeEntry> batch = timeEntryRepository.findByUserIdOrderByStartTimeDescPaged(
                    user.getId(),
                    batchLimit,
                    offset
            );
            if (batch.isEmpty()) {
                break;
            }

            for (TimeEntry entry : batch) {
                scanned += 1;
                if (entry.getEndTime() == null) {
                    skippedActive += 1;
                    continue;
                }

                EnqueueResult enqueueResult = enqueueTimeEntrySync(entry, user, "backfill_time_entry");
                if (enqueueResult.accepted()) {
                    queued += 1;
                } else {
                    enqueueFailed += 1;
                }
            }

            offset += batch.size();
            if (batch.size() < batchLimit) {
                break;
            }
        }

        logger.info(
                "Queued Agentic backfill for user={} requested={} scanned={} queued={} failed={} skipped_active={}",
                user.getEmail(),
                requested,
                scanned,
                queued,
                enqueueFailed,
                skippedActive
        );

        return new BackfillQueueResult(true, requested, scanned, queued, enqueueFailed, skippedActive);
    }

    @Scheduled(fixedDelayString = "${agentic.sync.outbox.poll-interval-ms:3000}")
    public void processPendingEvents() {
        if (!outboxEnabled || !syncService.isConfiguredForSync()) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        List<AgenticSyncOutboxEvent> dueEvents = outboxRepository
                .findByStatusInAndNextAttemptAtLessThanEqualOrderByNextAttemptAtAsc(
                        List.of(AgenticSyncOutboxStatus.PENDING, AgenticSyncOutboxStatus.RETRY),
                        now,
                        PageRequest.of(0, workerBatchSize)
                );

        if (dueEvents.isEmpty()) {
            return;
        }

        for (AgenticSyncOutboxEvent event : dueEvents) {
            processEvent(event);
        }
    }

    public QueueMetrics getQueueMetrics() {
        Optional<AgenticSyncOutboxEvent> nextPending = outboxRepository.findFirstByStatusInOrderByNextAttemptAtAsc(
                List.of(AgenticSyncOutboxStatus.PENDING, AgenticSyncOutboxStatus.RETRY, AgenticSyncOutboxStatus.PROCESSING)
        );

        return new QueueMetrics(
                outboxEnabled,
                syncService.isConfiguredForSync(),
                outboxRepository.countByStatus(AgenticSyncOutboxStatus.PENDING),
                outboxRepository.countByStatus(AgenticSyncOutboxStatus.RETRY),
                outboxRepository.countByStatus(AgenticSyncOutboxStatus.PROCESSING),
                outboxRepository.countByStatus(AgenticSyncOutboxStatus.FAILED),
                outboxRepository.countByStatus(AgenticSyncOutboxStatus.SUCCESS),
                syncService.getUpstreamCooldownRemainingSeconds(),
                nextPending.map(event -> event.getNextAttemptAt().toString()).orElse(null)
        );
    }

    public int retryFailedEvents(int limit) {
        int boundedLimit = Math.max(1, limit);
        List<AgenticSyncOutboxEvent> failedEvents = outboxRepository.findByStatusOrderByUpdatedAtDesc(
                AgenticSyncOutboxStatus.FAILED,
                PageRequest.of(0, boundedLimit)
        );

        if (failedEvents.isEmpty()) {
            return 0;
        }

        LocalDateTime now = LocalDateTime.now();
        for (AgenticSyncOutboxEvent event : failedEvents) {
            event.setStatus(AgenticSyncOutboxStatus.RETRY);
            event.setAttemptCount(0);
            event.setLastError(null);
            event.setNextAttemptAt(now);
        }

        outboxRepository.saveAll(failedEvents);
        return failedEvents.size();
    }

    private EnqueueResult enqueueEvent(String eventType, Map<String, Object> payload, Users user) {
        if (!outboxEnabled) {
            DispatchOutcome immediateOutcome = dispatch(eventType, payload, user);
            if (immediateOutcome.success()) {
                return new EnqueueResult(true, false, null, null, "dispatched-inline");
            }
            return EnqueueResult.rejected(immediateOutcome.message());
        }

        try {
            AgenticSyncOutboxEvent event = new AgenticSyncOutboxEvent();
            event.setUserId(user.getId());
            event.setEventType(eventType);
            event.setPayloadJson(objectMapper.writeValueAsString(payload));
            event.setCorrelationId(buildCorrelationId(eventType, user.getId()));
            event.setStatus(AgenticSyncOutboxStatus.PENDING);
            event.setAttemptCount(0);
            event.setMaxAttempts(defaultMaxAttempts);
            event.setNextAttemptAt(LocalDateTime.now());

            AgenticSyncOutboxEvent savedEvent = outboxRepository.save(event);
            logger.info(
                    "Queued Agentic sync event type={} eventId={} correlationId={} userId={}",
                    eventType,
                    savedEvent.getId(),
                    savedEvent.getCorrelationId(),
                    user.getId()
            );
            return EnqueueResult.acceptedQueued(savedEvent);
        } catch (Exception e) {
            logger.error("Failed to enqueue Agentic outbox event type={} userId={}: {}", eventType, user.getId(), e.getMessage(), e);
            return EnqueueResult.rejected("Failed to enqueue Agentic sync event");
        }
    }

    private void processEvent(AgenticSyncOutboxEvent event) {
        LocalDateTime now = LocalDateTime.now();
        int nextAttempt = event.getAttemptCount() + 1;

        event.setStatus(AgenticSyncOutboxStatus.PROCESSING);
        event.setAttemptCount(nextAttempt);
        event.setLastAttemptAt(now);
        outboxRepository.save(event);

        Optional<Users> userOpt = userRepository.findById(event.getUserId());
        if (userOpt.isEmpty()) {
            markFailed(event, "User not found for queued event");
            return;
        }

        Map<String, Object> payload;
        try {
            payload = objectMapper.readValue(event.getPayloadJson(), new TypeReference<>() {});
        } catch (Exception e) {
            markFailed(event, "Payload parse error: " + e.getMessage());
            return;
        }

        DispatchOutcome outcome = dispatch(event.getEventType(), payload, userOpt.get());
        if (outcome.success()) {
            event.setStatus(AgenticSyncOutboxStatus.SUCCESS);
            event.setLastError(null);
            outboxRepository.save(event);
            return;
        }

        int maxAttempts = Math.max(1, event.getMaxAttempts());
        if (!outcome.retryable() || nextAttempt >= maxAttempts) {
            markFailed(event, outcome.message());
            return;
        }

        long retryDelaySeconds = computeRetryDelaySeconds(nextAttempt);
        long cooldownRemaining = syncService.getUpstreamCooldownRemainingSeconds();
        retryDelaySeconds = Math.max(retryDelaySeconds, cooldownRemaining);

        event.setStatus(AgenticSyncOutboxStatus.RETRY);
        event.setLastError(outcome.message());
        event.setNextAttemptAt(LocalDateTime.now().plusSeconds(retryDelaySeconds));
        outboxRepository.save(event);

        logger.warn(
                "Agentic outbox retry scheduled eventId={} correlationId={} attempt={} nextIn={}s reason={}",
                event.getId(),
                event.getCorrelationId(),
                nextAttempt,
                retryDelaySeconds,
                outcome.message()
        );
    }

    private DispatchOutcome dispatch(String eventType, Map<String, Object> payload, Users user) {
        try {
            return switch (eventType) {
                case EVENT_TIME_ENTRY_SYNC -> dispatchTimeEntrySync(payload, user);
                case EVENT_TIME_ENTRY_DELETION -> dispatchTimeEntryDeletion(payload, user);
                case EVENT_TIME_ENTRY_CONTINUATION -> dispatchTimeEntryContinuation(payload, user);
                case EVENT_HABIT_SNAPSHOT -> dispatchHabitSnapshot(payload, user);
                default -> DispatchOutcome.permanentFailure("Unsupported outbox event type: " + eventType);
            };
        } catch (Exception e) {
            return DispatchOutcome.retryableFailure("Dispatch exception: " + e.getMessage());
        }
    }

    private DispatchOutcome dispatchTimeEntrySync(Map<String, Object> payload, Users user) {
        Long timeEntryId = toLong(payload.get("timeEntryId"));
        if (timeEntryId == null) {
            return DispatchOutcome.permanentFailure("timeEntryId is missing");
        }

        Optional<TimeEntry> entryOpt = timeEntryRepository.findById(timeEntryId);
        if (entryOpt.isEmpty()) {
            return DispatchOutcome.permanentFailure("Time entry " + timeEntryId + " no longer exists");
        }

        String sourceAction = asText(payload.get("sourceAction"), "outbox_time_entry");
        boolean synced = syncService.syncTimeEntry(entryOpt.get(), user, sourceAction);
        return synced
                ? DispatchOutcome.successful()
                : DispatchOutcome.retryableFailure("syncTimeEntry returned false");
    }

    private DispatchOutcome dispatchTimeEntryDeletion(Map<String, Object> payload, Users user) {
        Map<String, Object> snapshot = asMap(payload.get("entry"));
        if (snapshot.isEmpty()) {
            return DispatchOutcome.permanentFailure("Deletion snapshot is missing");
        }

        TimeEntry entry = deserializeTimeEntrySnapshot(snapshot);
        String sourceAction = asText(payload.get("sourceAction"), "outbox_delete_time_entry");
        boolean synced = syncService.syncTimeEntryDeletion(entry, user, sourceAction);
        return synced
            ? DispatchOutcome.successful()
            : DispatchOutcome.retryableFailure("syncTimeEntryDeletion returned false");
    }

    private DispatchOutcome dispatchTimeEntryContinuation(Map<String, Object> payload, Users user) {
        Long sourceEntryId = toLong(payload.get("sourceEntryId"));
        Long continuedEntryId = toLong(payload.get("continuedEntryId"));
        if (sourceEntryId == null || continuedEntryId == null) {
            return DispatchOutcome.permanentFailure("Continuation payload is missing source or continued entry ids");
        }

        Optional<TimeEntry> sourceOpt = timeEntryRepository.findById(sourceEntryId);
        Optional<TimeEntry> continuedOpt = timeEntryRepository.findById(continuedEntryId);

        if (sourceOpt.isEmpty() || continuedOpt.isEmpty()) {
            return DispatchOutcome.permanentFailure("Continuation entries no longer exist");
        }

        String sourceAction = asText(payload.get("sourceAction"), "outbox_continue_time_entry");
        boolean synced = syncService.syncTimeEntryContinuation(sourceOpt.get(), continuedOpt.get(), user, sourceAction);
        return synced
            ? DispatchOutcome.successful()
            : DispatchOutcome.retryableFailure("syncTimeEntryContinuation returned false");
    }

    private DispatchOutcome dispatchHabitSnapshot(Map<String, Object> payload, Users user) {
        Map<String, Object> snapshot = asMap(payload.get("snapshot"));
        if (snapshot.isEmpty()) {
            return DispatchOutcome.permanentFailure("Habit snapshot payload is empty");
        }

        String sourceAction = asText(payload.get("sourceAction"), "outbox_habit_snapshot");
        boolean synced = syncService.syncHabitSnapshot(snapshot, user, sourceAction);
        return synced
            ? DispatchOutcome.successful()
            : DispatchOutcome.retryableFailure("syncHabitSnapshot returned false");
    }

    private void markFailed(AgenticSyncOutboxEvent event, String reason) {
        event.setStatus(AgenticSyncOutboxStatus.FAILED);
        event.setLastError(reason);
        outboxRepository.save(event);

        logger.error(
                "Agentic outbox event failed eventId={} correlationId={} attempts={} reason={}",
                event.getId(),
                event.getCorrelationId(),
                event.getAttemptCount(),
                reason
        );
    }

    private String normalizeSourceAction(String sourceAction) {
        String normalized = asText(sourceAction, "unknown_action");
        return normalized.isBlank() ? "unknown_action" : normalized;
    }

    private String buildCorrelationId(String eventType, Long userId) {
        return eventType + ":" + userId + ":" + System.currentTimeMillis();
    }

    private long computeRetryDelaySeconds(int attempt) {
        long exponential = baseRetrySeconds * (1L << Math.min(10, Math.max(0, attempt - 1)));
        return Math.max(baseRetrySeconds, Math.min(maxRetrySeconds, exponential));
    }

    private int resolveRequestedEntries(Users user, int maxEntries) {
        if (maxEntries > 0) {
            return maxEntries;
        }

        long totalEntries = timeEntryRepository.countByUserId(user.getId());
        if (totalEntries <= 0) {
            return 0;
        }

        if (totalEntries > Integer.MAX_VALUE) {
            return Integer.MAX_VALUE;
        }

        return (int) totalEntries;
    }

    private boolean isQueueConfigured() {
        return syncService.isConfiguredForSync();
    }

    private Map<String, Object> serializeTimeEntrySnapshot(TimeEntry entry) {
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("id", entry.getId());
        snapshot.put("description", entry.getDescription());
        snapshot.put("startTime", entry.getStartTime() != null ? entry.getStartTime().toString() : null);
        snapshot.put("endTime", entry.getEndTime() != null ? entry.getEndTime().toString() : null);
        snapshot.put("duration", entry.getDuration());
        snapshot.put("tagIds", entry.getTagIds() != null ? new ArrayList<>(entry.getTagIds()) : List.of());
        snapshot.put("billable", entry.isBillable());
        snapshot.put("positionTop", entry.getPositionTop());
        snapshot.put("positionLeft", entry.getPositionLeft());
        if (entry.getProject() != null) {
            snapshot.put("projectId", entry.getProject().getId());
            snapshot.put("projectName", entry.getProject().getName());
        }
        return snapshot;
    }

    private TimeEntry deserializeTimeEntrySnapshot(Map<String, Object> snapshot) {
        TimeEntry entry = new TimeEntry();
        entry.setDescription(asText(snapshot.get("description"), "Untitled task"));
        entry.setDuration(toLong(snapshot.get("duration")) != null ? toLong(snapshot.get("duration")) : 0L);
        entry.setBillable(Boolean.TRUE.equals(snapshot.get("billable")) || "true".equalsIgnoreCase(asText(snapshot.get("billable"), "false")));
        entry.setPositionTop(asText(snapshot.get("positionTop"), null));
        entry.setPositionLeft(asText(snapshot.get("positionLeft"), null));

        List<Long> tagIds = new ArrayList<>();
        Object rawTagIds = snapshot.get("tagIds");
        if (rawTagIds instanceof List<?> list) {
            for (Object rawTagId : list) {
                Long tagId = toLong(rawTagId);
                if (tagId != null) {
                    tagIds.add(tagId);
                }
            }
        }
        entry.setTagIds(tagIds);

        Project project = new Project();
        project.setId(toLong(snapshot.get("projectId")));
        project.setName(asText(snapshot.get("projectName"), null));
        if (project.getId() != null || (project.getName() != null && !project.getName().isBlank())) {
            entry.setProject(project);
        }

        return entry;
    }

    private Map<String, Object> asMap(Object value) {
        if (!(value instanceof Map<?, ?> rawMap)) {
            return Map.of();
        }

        Map<String, Object> normalized = new LinkedHashMap<>();
        rawMap.forEach((key, mapValue) -> normalized.put(String.valueOf(key), mapValue));
        return normalized;
    }

    private String asText(Object value, String fallback) {
        if (value == null) {
            return fallback;
        }

        String text = String.valueOf(value).trim();
        return text.isEmpty() ? fallback : text;
    }

    private Long toLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        if (value instanceof String text) {
            try {
                return Long.parseLong(text.trim());
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }
}
