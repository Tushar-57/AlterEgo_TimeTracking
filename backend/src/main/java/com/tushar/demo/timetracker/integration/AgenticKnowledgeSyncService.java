package com.tushar.demo.timetracker.integration;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tushar.demo.timetracker.config.JwtUtils;
import com.tushar.demo.timetracker.dto.request.OnboardingRequestDTO;
import com.tushar.demo.timetracker.model.Project;
import com.tushar.demo.timetracker.model.Tags;
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
            @Value("${agentic.sync.max-attempts:2}") int maxAttempts,
            @Value("${agentic.sync.retry-backoff-ms:750}") long retryBackoffMs,
            @Value("${agentic.sync.connect-timeout-ms:5000}") long connectTimeoutMs,
            @Value("${agentic.sync.request-timeout-ms:15000}") long requestTimeoutMs) {
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
            Map<String, Object> mentorMap = toMapOrEmpty(request.getMentor());
            Map<String, Object> coachPreferences = sanitizeMap(request.getCoachPreferences());
            Map<String, Object> domainPreferences = sanitizeMap(request.getDomainPreferences());

            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("role", request.getRole());
            payload.put("goals", goals);
            payload.put("preferences", preferences);
            payload.put("mentor", mentorMap);
            payload.put("preferredTone", request.getPreferredTone());
            payload.put("coach_preferences", coachPreferences);
            payload.put("domain_preferences", domainPreferences);

            Map<String, Object> plannerMap = toMapOrEmpty(request.getPlanner());
            if (!plannerMap.containsKey("goals")) {
                plannerMap.put("goals", goals);
            }
            if (!plannerMap.containsKey("availability") && request.getSchedule() != null) {
                plannerMap.put("availability", toMapOrEmpty(request.getSchedule()));
            }
            payload.put("planner", plannerMap);
            payload.put(
                    "preference_profile",
                    buildPreferenceProfile(
                            request.getRole(),
                            request.getPreferredTone(),
                            preferences,
                            goals,
                            plannerMap,
                            mentorMap,
                            coachPreferences,
                            domainPreferences
                    )
            );

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
            context.put("tag_ids", safeTagIds(entry, "sync_time_entry"));
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

    public boolean syncProject(Project project, Users user, String sourceAction) {
        if (!isConfigured() || project == null || project.getId() == null) {
            return false;
        }

        Map<String, Object> context = new LinkedHashMap<>();
        context.put("source", "alterego_projects");
        context.put("source_action", sourceAction);
        context.put("category", "project_catalog");
        context.put("sync_event_key", "alterego:project:" + project.getId());
        context.put("project_id", project.getId());
        context.put("project_name", safeText(project.getName(), "Untitled Project"));
        context.put("project_color", safeText(project.getColor(), ""));
        context.put("project_client", safeText(project.getClient(), ""));
        context.put("project_default", project.isDefault());
        context.put("deleted", false);
        context.put("user_id", user != null ? user.getId() : null);
        context.put("user_email", user != null ? user.getEmail() : null);

        String projectName = safeText(project.getName(), "Untitled Project");
        String responseText = "Project \"" + projectName + "\" synced.";
        return syncInteractionEvent("project_catalog", "Project update: " + projectName, responseText, context, user);
    }

    public boolean syncProjectDeletion(Long projectId, String projectName, Users user, String sourceAction) {
        if (!isConfigured() || projectId == null) {
            return false;
        }

        String safeProjectName = safeText(projectName, "Deleted project");
        Map<String, Object> context = new LinkedHashMap<>();
        context.put("source", "alterego_projects");
        context.put("source_action", sourceAction);
        context.put("category", "project_catalog");
        context.put("sync_event_key", "alterego:project:" + projectId);
        context.put("project_id", projectId);
        context.put("project_name", safeProjectName);
        context.put("deleted", true);
        context.put("user_id", user != null ? user.getId() : null);
        context.put("user_email", user != null ? user.getEmail() : null);

        String responseText = "Project \"" + safeProjectName + "\" was deleted.";
        return syncInteractionEvent("project_catalog", "Delete project: " + safeProjectName, responseText, context, user);
    }

    public boolean syncTag(Tags tag, Users user, String sourceAction) {
        if (!isConfigured() || tag == null || tag.getId() == null) {
            return false;
        }

        String tagName = safeText(tag.getName(), "Untitled Tag");
        Map<String, Object> context = new LinkedHashMap<>();
        context.put("source", "alterego_tags");
        context.put("source_action", sourceAction);
        context.put("category", "tag_catalog");
        context.put("sync_event_key", "alterego:tag:" + tag.getId());
        context.put("tag_id", tag.getId());
        context.put("tag_name", tagName);
        context.put("tag_color", safeText(tag.getColor(), ""));
        context.put("deleted", false);
        context.put("user_id", user != null ? user.getId() : null);
        context.put("user_email", user != null ? user.getEmail() : null);

        String responseText = "Tag \"" + tagName + "\" synced.";
        return syncInteractionEvent("tag_catalog", "Tag update: " + tagName, responseText, context, user);
    }

    public boolean syncTagDeletion(Long tagId, String tagName, Users user, String sourceAction) {
        if (!isConfigured() || tagId == null) {
            return false;
        }

        String safeTagName = safeText(tagName, "Deleted tag");
        Map<String, Object> context = new LinkedHashMap<>();
        context.put("source", "alterego_tags");
        context.put("source_action", sourceAction);
        context.put("category", "tag_catalog");
        context.put("sync_event_key", "alterego:tag:" + tagId);
        context.put("tag_id", tagId);
        context.put("tag_name", safeTagName);
        context.put("deleted", true);
        context.put("user_id", user != null ? user.getId() : null);
        context.put("user_email", user != null ? user.getEmail() : null);

        String responseText = "Tag \"" + safeTagName + "\" was deleted.";
        return syncInteractionEvent("tag_catalog", "Delete tag: " + safeTagName, responseText, context, user);
    }

    public boolean syncTimeEntryDeletion(TimeEntry entry, Users user, String sourceAction) {
        if (!isConfigured() || entry == null || entry.getId() == null) {
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
            context.put("sync_event_key", "alterego:time_entry:" + entry.getId());
            context.put("description", description);
            context.put("start_time", entry.getStartTime() != null ? entry.getStartTime().toString() : null);
            context.put("end_time", entry.getEndTime() != null ? entry.getEndTime().toString() : null);
            context.put("duration_seconds", durationSeconds);
            context.put("duration_minutes", durationMinutes);
            context.put("project_id", entry.getProject() != null ? entry.getProject().getId() : null);
            context.put("project_name", entry.getProject() != null ? entry.getProject().getName() : null);
            context.put("tag_ids", safeTagIds(entry, "sync_time_entry_deletion"));
            context.put("billable", entry.isBillable());
            context.put("deleted", true);
            context.put("user_id", user != null ? user.getId() : null);
            context.put("user_email", user != null ? user.getEmail() : null);

            String responseText = "Time entry \"" + description + "\" was deleted.";
            return syncInteractionEvent("time_entry", "Delete time entry: " + description, responseText, context, user);
        } catch (Exception e) {
            logger.warn("Agentic time-entry deletion sync skipped due to payload error: {}", e.getMessage());
            return false;
        }
    }

    public boolean syncTimeEntryContinuation(TimeEntry sourceEntry, TimeEntry continuedEntry, Users user, String sourceAction) {
        if (!isConfigured() || sourceEntry == null || continuedEntry == null || continuedEntry.getId() == null) {
            return false;
        }

        try {
            String description = safeText(continuedEntry.getDescription(), "Untitled task");

            Map<String, Object> context = new LinkedHashMap<>();
            context.put("source", "alterego_timetracker");
            context.put("source_action", sourceAction);
            context.put("category", "time_entry");
            context.put("time_entry_id", continuedEntry.getId());
            context.put("sync_event_key", "alterego:time_entry:" + continuedEntry.getId());
            context.put("continued_from_time_entry_id", sourceEntry.getId());
            context.put("description", description);
            context.put("start_time", continuedEntry.getStartTime() != null ? continuedEntry.getStartTime().toString() : null);
            context.put("end_time", null);
            context.put("duration_seconds", 0L);
            context.put("duration_minutes", 0L);
            context.put("project_id", continuedEntry.getProject() != null ? continuedEntry.getProject().getId() : null);
            context.put("project_name", continuedEntry.getProject() != null ? continuedEntry.getProject().getName() : null);
            context.put("tag_ids", safeTagIds(continuedEntry, "sync_time_entry_continuation"));
            context.put("billable", continuedEntry.isBillable());
            context.put("active", true);
            context.put("continued", true);
            context.put("user_id", user != null ? user.getId() : null);
            context.put("user_email", user != null ? user.getEmail() : null);

            String responseText = "Continued timer for \"" + description + "\" as an active session.";
            return syncInteractionEvent("time_entry", "Continue time entry: " + description, responseText, context, user);
        } catch (Exception e) {
            logger.warn("Agentic time-entry continuation sync skipped due to payload error: {}", e.getMessage());
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
        return runDailyCheckup(user, checkupType, date, note, Map.of(), Map.of());
    }

    public Map<String, Object> runDailyCheckup(
            Users user,
            String checkupType,
            String date,
            String note,
            Map<String, Object> perspective,
            Map<String, Object> contextSnapshot) {
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
        if (perspective != null && !perspective.isEmpty()) {
            payload.put("perspective", perspective);
        }
        if (contextSnapshot != null && !contextSnapshot.isEmpty()) {
            payload.put("context_snapshot", contextSnapshot);
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

    private Map<String, Object> buildPreferenceProfile(
            String role,
            String preferredTone,
            List<String> priorities,
            List<Map<String, Object>> goals,
            Map<String, Object> planner,
            Map<String, Object> mentor,
            Map<String, Object> coachPreferences,
            Map<String, Object> domainPreferences) {
        Map<String, Object> profile = new LinkedHashMap<>();

        Map<String, Object> availability = asMap(planner.get("availability"));
        Map<String, Object> workHours = asMap(availability.get("workHours"));
        Map<String, Object> checkIn = asMap(availability.get("checkIn"));

        String workHoursValue = safeText(asString(workHours.get("start")), "09:00")
                + "-"
                + safeText(asString(workHours.get("end")), "17:00");
        String timezone = safeText(asString(availability.get("timezone")), "UTC");
        String checkInTime = safeText(asString(checkIn.get("preferredTime")), "09:00");
        String checkInFrequency = safeText(asString(checkIn.get("frequency")), "daily");

        List<String> productivityGoals = filterGoalTitlesByCategory(goals, List.of("career", "work", "productivity"));
        List<String> healthGoals = filterGoalTitlesByCategory(goals, List.of("health", "wellness"));
        List<String> financeGoals = filterGoalTitlesByCategory(goals, List.of("finance", "financial", "money"));

        Map<String, Object> productivity = new LinkedHashMap<>();
        productivity.put("work_hours", workHoursValue);
        productivity.put("check_in_time", checkInTime);
        productivity.put("check_in_frequency", checkInFrequency);
        productivity.put("priority_signals", priorities != null ? priorities : List.of());
        productivity.put("goals", productivityGoals);

        Map<String, Object> health = new LinkedHashMap<>();
        health.put("goals", healthGoals);
        health.put("wellness_focus", coachPreferences.getOrDefault("wellnessFocus", "balanced"));

        Map<String, Object> finance = new LinkedHashMap<>();
        finance.put("goals", financeGoals);
        finance.put("planning_priority", coachPreferences.getOrDefault("financialFocus", "budgeting"));

        Map<String, Object> journal = new LinkedHashMap<>();
        journal.put("reflection_frequency", checkInFrequency);
        journal.put("check_in_time", checkInTime);
        journal.put("coach_tone", safeText(preferredTone, "friendly"));

        Map<String, Object> general = new LinkedHashMap<>();
        general.put("role", safeText(role, "professional"));
        general.put("timezone", timezone);
        general.put("priorities", priorities != null ? priorities : List.of());
        general.put("mentor", mentor);
        general.put("preferred_tone", safeText(preferredTone, "Friendly"));
        general.put("coach_preferences", coachPreferences);

        mergeSectionOverrides(productivity, extractNestedMap(domainPreferences, "productivity"));
        mergeSectionOverrides(health, extractNestedMap(domainPreferences, "health"));
        mergeSectionOverrides(finance, extractNestedMap(domainPreferences, "finance"));
        mergeSectionOverrides(journal, extractNestedMap(domainPreferences, "journal"));
        mergeSectionOverrides(general, extractNestedMap(domainPreferences, "general"));

        profile.put("productivity", productivity);
        profile.put("health", health);
        profile.put("finance", finance);
        profile.put("journal", journal);
        profile.put("general", general);
        return profile;
    }

    private List<String> filterGoalTitlesByCategory(List<Map<String, Object>> goals, List<String> supportedCategories) {
        if (goals == null || goals.isEmpty()) {
            return List.of();
        }

        List<String> normalizedCategories = supportedCategories.stream().map(String::toLowerCase).toList();
        List<String> selected = new ArrayList<>();
        for (Map<String, Object> goal : goals) {
            String category = asString(goal.get("category")).trim().toLowerCase();
            if (!normalizedCategories.contains(category)) {
                continue;
            }
            String title = asString(goal.get("title")).trim();
            if (!title.isBlank()) {
                selected.add(title);
            }
        }
        return selected;
    }

    private void mergeSectionOverrides(Map<String, Object> target, Map<String, Object> overrides) {
        if (overrides == null || overrides.isEmpty()) {
            return;
        }
        overrides.forEach((key, value) -> {
            if (key == null || key.isBlank() || value == null) {
                return;
            }
            target.put(key, value);
        });
    }

    private Map<String, Object> extractNestedMap(Map<String, Object> source, String key) {
        if (source == null || source.isEmpty()) {
            return new LinkedHashMap<>();
        }
        return asMap(source.get(key));
    }

    private Map<String, Object> sanitizeMap(Map<String, Object> rawMap) {
        if (rawMap == null || rawMap.isEmpty()) {
            return new LinkedHashMap<>();
        }

        Map<String, Object> sanitized = new LinkedHashMap<>();
        rawMap.forEach((key, value) -> {
            if (key == null || key.isBlank() || value == null) {
                return;
            }
            sanitized.put(key, value);
        });
        return sanitized;
    }

    private boolean syncInteractionEvent(
            String agentType,
            String userInput,
            String agentResponse,
            Map<String, Object> context,
            Users user) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("agent_type", agentType);
        payload.put("user_input", userInput);
        payload.put("agent_response", agentResponse);
        payload.put("context", context != null ? context : Map.of());

        return postJson("/api/knowledge/interactions", payload, agentType, user);
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

    private List<Long> safeTagIds(TimeEntry entry, String syncAction) {
        if (entry == null) {
            return List.of();
        }

        try {
            List<Long> tagIds = entry.getTagIds();
            if (tagIds == null || tagIds.isEmpty()) {
                return List.of();
            }
            return new ArrayList<>(tagIds);
        } catch (RuntimeException ex) {
            logger.debug(
                    "Unable to extract tag_ids for time entry {} during {} sync: {}",
                    entry.getId(),
                    syncAction,
                    ex.getMessage()
            );
            return List.of();
        }
    }
}
