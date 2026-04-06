package com.tushar.demo.timetracker.integration;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tushar.demo.timetracker.config.JwtUtils;
import com.tushar.demo.timetracker.dto.request.OnboardingRequestDTO;
import com.tushar.demo.timetracker.model.TimeEntry;
import com.tushar.demo.timetracker.model.Users;
import com.tushar.demo.timetracker.repository.TimeEntryRepository;
import com.tushar.demo.timetracker.repository.TimeEntryDetailRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.ConnectException;
import java.net.SocketException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpTimeoutException;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class AgenticKnowledgeSyncService {
    private static final Logger logger = LoggerFactory.getLogger(AgenticKnowledgeSyncService.class);
    private static final int BACKFILL_PAGE_SIZE = 250;

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final boolean enabled;
    private final String baseUrl;
    private final Duration requestTimeout;
    private final TimeEntryRepository timeEntryRepository;
    private final TimeEntryDetailRepository timeEntryDetailRepository;
    private final JwtUtils jwtUtils;
    private final long bridgeTokenTtlSeconds;
    private final int maxAttempts;
    private final long retryBackoffMs;

    public static final class SyncBackfillResult {
        private final boolean configured;
        private final int requested;
        private final int scanned;
        private final int synced;
        private final int failed;
        private final int skippedActive;

        public SyncBackfillResult(
                boolean configured,
                int requested,
                int scanned,
                int synced,
                int failed,
                int skippedActive) {
            this.configured = configured;
            this.requested = requested;
            this.scanned = scanned;
            this.synced = synced;
            this.failed = failed;
            this.skippedActive = skippedActive;
        }

        public boolean isConfigured() {
            return configured;
        }

        public int getRequested() {
            return requested;
        }

        public int getScanned() {
            return scanned;
        }

        public int getSynced() {
            return synced;
        }

        public int getFailed() {
            return failed;
        }

        public int getSkippedActive() {
            return skippedActive;
        }
    }

    public AgenticKnowledgeSyncService(
            TimeEntryRepository timeEntryRepository,
            TimeEntryDetailRepository timeEntryDetailRepository,
            JwtUtils jwtUtils,
            @Value("${agentic.sync.enabled:false}") boolean enabled,
            @Value("${agentic.sync.base-url:}") String baseUrl,
            @Value("${agentic.sync.bridge-token-ttl-seconds:180}") long bridgeTokenTtlSeconds,
            @Value("${agentic.sync.max-attempts:3}") int maxAttempts,
            @Value("${agentic.sync.retry-backoff-ms:350}") long retryBackoffMs,
            @Value("${agentic.sync.connect-timeout-ms:5000}") long connectTimeoutMs,
            @Value("${agentic.sync.request-timeout-ms:8000}") long requestTimeoutMs) {
        this.timeEntryRepository = timeEntryRepository;
        this.timeEntryDetailRepository = timeEntryDetailRepository;
        this.jwtUtils = jwtUtils;
        this.enabled = enabled;
        this.baseUrl = normalizeBaseUrl(baseUrl);
        this.bridgeTokenTtlSeconds = bridgeTokenTtlSeconds;
        this.maxAttempts = Math.max(1, maxAttempts);
        this.retryBackoffMs = Math.max(0L, retryBackoffMs);
        this.requestTimeout = Duration.ofMillis(requestTimeoutMs);
        this.objectMapper = new ObjectMapper();
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(connectTimeoutMs))
                .build();
    }

    public void syncOnboarding(OnboardingRequestDTO request, Users user) {
        if (!isConfigured()) {
            return;
        }

        try {
            List<Map<String, Object>> goals = mapGoals(request.getGoals());
            List<String> preferences = mapPreferences(request.getAnswers());

            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("role", request.getRole());
            payload.put("goals", goals);
            payload.put("preferences", preferences);
            payload.put("mentor", toMapOrEmpty(request.getMentor()));
            payload.put("preferredTone", request.getPreferredTone());

            Map<String, Object> plannerMap = toMapOrEmpty(request.getPlanner());
            if (!plannerMap.containsKey("goals")) {
                plannerMap.put("goals", goals);
            }
            if (!plannerMap.containsKey("availability") && request.getSchedule() != null) {
                plannerMap.put("availability", toMapOrEmpty(request.getSchedule()));
            }
            payload.put("planner", plannerMap);

            postJson("/api/knowledge/onboarding", payload, "onboarding", user);
        } catch (Exception e) {
            logger.warn("Agentic onboarding sync skipped due to payload error: {}", e.getMessage());
        }
    }

    public boolean syncTimeEntry(TimeEntry entry, Users user, String sourceAction) {
        if (!isConfigured() || entry == null) {
            return false;
        }

        if (entry.getEndTime() == null) {
            logger.debug("Skipping Agentic time-entry sync for running entry {} (sourceAction={})", entry.getId(), sourceAction);
            return false;
        }

        try {
            String description = safeText(entry.getDescription(), "Untitled task");
            Long durationSeconds = entry.getDuration() != null ? entry.getDuration() : 0L;
            long durationMinutes = Math.max(0L, Math.round(durationSeconds / 60.0));

            Map<String, Object> context = new LinkedHashMap<>();
            context.put("source", "alterego_timetracker");
            context.put("source_action", sourceAction);
            context.put("category", "time_entry");
            context.put("time_entry_id", entry.getId());
            if (entry.getId() != null) {
                context.put("sync_event_key", "alterego:time_entry:" + entry.getId());
            }
            context.put("description", description);
            context.put("start_time", entry.getStartTime() != null ? entry.getStartTime().toString() : null);
            context.put("end_time", entry.getEndTime().toString());
            context.put("duration_seconds", durationSeconds);
            context.put("duration_minutes", durationMinutes);
            context.put("project_id", entry.getProject() != null ? entry.getProject().getId() : null);
            context.put("project_name", entry.getProject() != null ? entry.getProject().getName() : null);
            context.put("tag_ids", entry.getTagIds() != null ? entry.getTagIds() : List.of());
            context.put("billable", entry.isBillable());
            context.put("position_top", entry.getPositionTop());
            context.put("position_left", entry.getPositionLeft());
            context.put("weekday", entry.getStartTime() != null ? entry.getStartTime().getDayOfWeek().toString() : null);
            context.put("hour_of_day", entry.getStartTime() != null ? entry.getStartTime().getHour() : null);
            context.put("user_id", user != null ? user.getId() : null);
            context.put("user_email", user != null ? user.getEmail() : null);

            timeEntryDetailRepository.findByTimeEntryId(entry.getId()).ifPresent(detail -> {
                context.put("linked_goal", safeText(detail.getLinkedGoal(), null));
                context.put("focus_score", detail.getFocusScore());
                context.put("energy_score", detail.getEnergyScore());
                context.put("blockers", safeText(detail.getBlockers(), null));
                context.put("context_notes", safeText(detail.getContextNotes(), null));
                context.put("ai_detail", safeText(detail.getAiDetail(), null));
            });

            String responseText = "Recorded " + durationMinutes + " minutes for \"" + description + "\""
                    + (entry.getProject() != null ? " under project \"" + safeText(entry.getProject().getName(), "") + "\"." : ".");

            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("agent_type", "time_entry");
            payload.put("user_input", "Log time entry: " + description);
            payload.put("agent_response", responseText);
            payload.put("context", context);

            return postJson("/api/knowledge/interactions", payload, "time_entry", user);
        } catch (Exception e) {
            logger.warn("Agentic time-entry sync skipped due to payload error: {}", e.getMessage());
            return false;
        }
    }

    public SyncBackfillResult syncHistoricalTimeEntries(Users user, int maxEntries) {
        if (!isConfigured() || user == null || user.getId() == null) {
            int requestedWhenUnavailable = Math.max(0, maxEntries);
            return new SyncBackfillResult(false, requestedWhenUnavailable, 0, 0, 0, 0);
        }

        int requested = resolveRequestedEntries(user, maxEntries);

        int scanned = 0;
        int synced = 0;
        int failed = 0;
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

                boolean success = syncTimeEntry(entry, user, "backfill_time_entry");
                if (success) {
                    synced += 1;
                } else {
                    failed += 1;
                }
            }

            offset += batch.size();
            if (batch.size() < batchLimit) {
                break;
            }
        }

        logger.info(
                "Agentic backfill completed for user={} requested={} scanned={} synced={} failed={} skipped_active={}",
                user.getEmail(),
                requested,
                scanned,
                synced,
                failed,
                skippedActive
        );

        return new SyncBackfillResult(true, requested, scanned, synced, failed, skippedActive);
    }

    public SyncBackfillResult syncHistoricalTimeEntries(Users user) {
        return syncHistoricalTimeEntries(user, 0);
    }

    public boolean syncHabitSnapshot(Map<String, Object> habitSnapshot, Users user, String sourceAction) {
        if (!isConfigured() || habitSnapshot == null || habitSnapshot.isEmpty()) {
            return false;
        }

        try {
            Map<String, Object> summary = asMap(habitSnapshot.get("summary"));
            Map<String, Object> dailyCompletionCounts = asMap(habitSnapshot.get("dailyCompletionCounts"));
            List<Object> habits = asList(habitSnapshot.get("habits"));

            Map<String, Object> context = new LinkedHashMap<>();
            context.put("source", "alterego_task_manager");
            context.put("source_action", sourceAction);
            context.put("category", "habit_snapshot");
            context.put("captured_at", asString(habitSnapshot.get("capturedAt")));
            context.put("summary", summary);
            context.put("daily_completion_counts", dailyCompletionCounts);
            context.put("habits", habits);
            context.put("user_id", user != null ? user.getId() : null);
            context.put("user_email", user != null ? user.getEmail() : null);
            context.put("total_habits", toInt(summary.get("totalHabits")));
            context.put("total_completion_events", toInt(summary.get("totalCompletionEvents")));
            context.put("active_days", toInt(summary.get("activeDays")));
            context.put("current_run", toInt(summary.get("currentRun")));
            context.put("longest_run", toInt(summary.get("longestRun")));

            String responseText = String.format(
                    "Captured habit snapshot with %d habits and %d completion events.",
                    habits.size(),
                    toInt(summary.get("totalCompletionEvents"))
            );

            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("agent_type", "habit_progress");
            payload.put("user_input", "Habit progress snapshot update");
            payload.put("agent_response", responseText);
            payload.put("context", context);

            return postJson("/api/knowledge/interactions", payload, "habit_progress", user);
        } catch (Exception e) {
            logger.warn("Agentic habit snapshot sync skipped due to payload error: {}", e.getMessage());
            return false;
        }
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

    public Map<String, Object> runDailyCheckup(Users user, String checkupType, String date, String note) {
        if (!isConfigured()) {
            throw new IllegalStateException("Agentic sync is not configured");
        }
        if (user == null || user.getId() == null) {
            throw new IllegalArgumentException("Authenticated user context is required");
        }

        String normalizedType = safeText(checkupType, "").trim().toLowerCase();
        if (!"morning".equals(normalizedType) && !"evening".equals(normalizedType)) {
            throw new IllegalArgumentException("checkupType must be either 'morning' or 'evening'");
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        if (date != null && !date.isBlank()) {
            payload.put("date", date.trim());
        }
        if (note != null && !note.isBlank()) {
            payload.put("note", note.trim());
        }

        return postJsonForResponse(
                "/api/knowledge/checkups/" + normalizedType,
                payload,
                "daily_checkup_" + normalizedType,
                user
        );
    }

    private boolean postJson(String path, Map<String, Object> payload, String syncType, Users user) {
        try {
            String body = objectMapper.writeValueAsString(payload);
            HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + path))
                    .timeout(requestTimeout)
                    .header("Content-Type", "application/json")
                .header("Accept", "application/json");

            if (user != null) {
            String bridgeToken = jwtUtils.generateAgenticBridgeToken(user, bridgeTokenTtlSeconds);
            requestBuilder.header("X-Agentic-Bridge-Token", bridgeToken);
            requestBuilder.header("X-Agentic-User-Id", user.getId() != null ? user.getId().toString() : user.getEmail());
            }

            HttpRequest request = requestBuilder
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

            HttpResponse<String> response = sendWithRetry(request, syncType);
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                logger.info("Agentic {} sync successful for user {}", syncType, user != null ? user.getEmail() : "unknown");
                return true;
            }

            logger.warn("Agentic {} sync failed with status {} and body {}", syncType, response.statusCode(), response.body());
            return false;
        } catch (Exception e) {
            logger.warn("Agentic {} sync request failed: {}", syncType, e.getMessage());
            return false;
        }
    }

    private Map<String, Object> postJsonForResponse(String path, Map<String, Object> payload, String syncType, Users user) {
        try {
            String body = objectMapper.writeValueAsString(payload != null ? payload : Collections.emptyMap());
            HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + path))
                    .timeout(requestTimeout)
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json");

            if (user != null) {
                String bridgeToken = jwtUtils.generateAgenticBridgeToken(user, bridgeTokenTtlSeconds);
                requestBuilder.header("X-Agentic-Bridge-Token", bridgeToken);
                requestBuilder.header("X-Agentic-User-Id", user.getId() != null ? user.getId().toString() : user.getEmail());
            }

            HttpRequest request = requestBuilder
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response = sendWithRetry(request, syncType);
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                logger.info("Agentic {} request successful for user {}", syncType, user != null ? user.getEmail() : "unknown");
                try {
                    return objectMapper.readValue(response.body(), new TypeReference<>() {});
                } catch (Exception parseError) {
                    logger.warn(
                            "Agentic {} response parse failed, returning raw payload: {}",
                            syncType,
                            parseError.getMessage()
                    );
                    Map<String, Object> fallback = new LinkedHashMap<>();
                    fallback.put("raw", response.body());
                    return fallback;
                }
            }

            String errorMessage = String.format(
                    "Agentic %s request failed with status %d",
                    syncType,
                    response.statusCode()
            );
            logger.warn("{} and body {}", errorMessage, response.body());
            throw new IllegalStateException(errorMessage + ": " + response.body());
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            logger.warn("Agentic {} request failed: {}", syncType, e.getMessage());
            throw new IllegalStateException("Agentic " + syncType + " request failed", e);
        }
    }

    private HttpResponse<String> sendWithRetry(HttpRequest request, String syncType) throws Exception {
        HttpResponse<String> lastResponse = null;
        Exception lastException = null;

        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                if (!isRetryableStatus(response.statusCode()) || attempt == maxAttempts) {
                    return response;
                }

                lastResponse = response;
                logger.warn(
                        "Agentic {} attempt {}/{} returned retryable status {}",
                        syncType,
                        attempt,
                        maxAttempts,
                        response.statusCode()
                );
            } catch (Exception e) {
                if (e instanceof InterruptedException) {
                    Thread.currentThread().interrupt();
                    throw e;
                }

                if (!isRetryableException(e) || attempt == maxAttempts) {
                    throw e;
                }

                lastException = e;
                logger.warn(
                        "Agentic {} attempt {}/{} failed with retryable transport error: {}",
                        syncType,
                        attempt,
                        maxAttempts,
                        e.getMessage()
                );
            }

            if (attempt < maxAttempts) {
                sleepBackoff(attempt);
            }
        }

        if (lastResponse != null) {
            return lastResponse;
        }
        if (lastException != null) {
            throw lastException;
        }

        throw new IllegalStateException("Agentic sync failed without response details");
    }

    private boolean isRetryableStatus(int statusCode) {
        return statusCode == 408 || statusCode == 429 || statusCode >= 500;
    }

    private boolean isRetryableException(Exception exception) {
        Throwable root = rootCause(exception);
        return root instanceof HttpTimeoutException
                || root instanceof ConnectException
                || root instanceof SocketException
                || root instanceof IOException;
    }

    private Throwable rootCause(Throwable throwable) {
        Throwable current = throwable;
        while (current.getCause() != null && current.getCause() != current) {
            current = current.getCause();
        }
        return current;
    }

    private void sleepBackoff(int attempt) throws InterruptedException {
        if (retryBackoffMs <= 0) {
            return;
        }
        long delayMs = retryBackoffMs * attempt;
        Thread.sleep(delayMs);
    }

    private boolean isConfigured() {
        if (!enabled) {
            return false;
        }
        if (baseUrl.isBlank()) {
            logger.debug("Agentic sync enabled but AGENTIC_SYNC_BASE_URL is empty; skipping sync.");
            return false;
        }
        return true;
    }

    private String normalizeBaseUrl(String rawBaseUrl) {
        if (rawBaseUrl == null) {
            return "";
        }
        return rawBaseUrl.trim().replaceAll("/+$", "");
    }

    private Map<String, Object> asMap(Object value) {
        if (!(value instanceof Map<?, ?> rawMap)) {
            return new LinkedHashMap<>();
        }

        Map<String, Object> normalized = new LinkedHashMap<>();
        rawMap.forEach((key, mapValue) -> normalized.put(String.valueOf(key), mapValue));
        return normalized;
    }

    private List<Object> asList(Object value) {
        if (!(value instanceof List<?> rawList)) {
            return List.of();
        }
        return new ArrayList<>(rawList);
    }

    private int toInt(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }

        if (value instanceof String text) {
            try {
                return Integer.parseInt(text.trim());
            } catch (NumberFormatException ignored) {
                return 0;
            }
        }

        return 0;
    }

    private String asString(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private List<Map<String, Object>> mapGoals(List<OnboardingRequestDTO.Goal> goals) {
        if (goals == null || goals.isEmpty()) {
            return List.of();
        }

        List<Map<String, Object>> mapped = new ArrayList<>();
        for (OnboardingRequestDTO.Goal goal : goals) {
            Map<String, Object> goalMap = new LinkedHashMap<>();
            goalMap.put("id", goal.getId());
            goalMap.put("title", goal.getTitle());
            goalMap.put("description", goal.getDescription());
            goalMap.put("category", goal.getCategory());
            goalMap.put("priority", goal.getPriority());
            goalMap.put("milestones", goal.getMilestones() != null ? goal.getMilestones() : List.of());
            goalMap.put("endDate", goal.getEndDate());
            goalMap.put("estimatedEffortHours", goal.getEstimatedEffortHours());
            goalMap.put("whyItMatters", goal.getWhyItMatters());
            if (goal.getSmartCriteria() != null) {
                goalMap.put("smartCriteria", toMapOrEmpty(goal.getSmartCriteria()));
            }
            mapped.add(goalMap);
        }

        return mapped;
    }

    private List<String> mapPreferences(List<OnboardingRequestDTO.AnswerDTO> answers) {
        if (answers == null || answers.isEmpty()) {
            return List.of();
        }

        return answers.stream()
                .map(answer -> safeText(answer.getAnswer(), answer.getDescription()))
                .filter(value -> value != null && !value.isBlank())
                .toList();
    }

    private Map<String, Object> toMapOrEmpty(Object source) {
        if (source == null) {
            return new LinkedHashMap<>();
        }
        return objectMapper.convertValue(source, new TypeReference<>() {});
    }

    private String safeText(String preferred, String fallback) {
        if (preferred != null && !preferred.isBlank()) {
            return preferred;
        }
        return Objects.requireNonNullElse(fallback, "");
    }
}
