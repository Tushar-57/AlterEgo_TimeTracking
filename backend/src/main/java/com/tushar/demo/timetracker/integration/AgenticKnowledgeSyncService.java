package com.tushar.demo.timetracker.integration;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tushar.demo.timetracker.config.JwtUtils;
import com.tushar.demo.timetracker.dto.request.OnboardingRequestDTO;
import com.tushar.demo.timetracker.model.TimeEntry;
import com.tushar.demo.timetracker.model.Users;
import com.tushar.demo.timetracker.repository.TimeEntryDetailRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class AgenticKnowledgeSyncService {
    private static final Logger logger = LoggerFactory.getLogger(AgenticKnowledgeSyncService.class);

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final boolean enabled;
    private final String baseUrl;
    private final Duration requestTimeout;
    private final TimeEntryDetailRepository timeEntryDetailRepository;
    private final JwtUtils jwtUtils;
    private final long bridgeTokenTtlSeconds;

    public AgenticKnowledgeSyncService(
            TimeEntryDetailRepository timeEntryDetailRepository,
            JwtUtils jwtUtils,
            @Value("${agentic.sync.enabled:false}") boolean enabled,
            @Value("${agentic.sync.base-url:}") String baseUrl,
            @Value("${agentic.sync.bridge-token-ttl-seconds:180}") long bridgeTokenTtlSeconds,
            @Value("${agentic.sync.connect-timeout-ms:5000}") long connectTimeoutMs,
            @Value("${agentic.sync.request-timeout-ms:8000}") long requestTimeoutMs) {
        this.timeEntryDetailRepository = timeEntryDetailRepository;
        this.jwtUtils = jwtUtils;
        this.enabled = enabled;
        this.baseUrl = normalizeBaseUrl(baseUrl);
        this.bridgeTokenTtlSeconds = bridgeTokenTtlSeconds;
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

    public void syncTimeEntry(TimeEntry entry, Users user, String sourceAction) {
        if (!isConfigured() || entry == null) {
            return;
        }

        if (entry.getEndTime() == null) {
            logger.debug("Skipping Agentic time-entry sync for running entry {} (sourceAction={})", entry.getId(), sourceAction);
            return;
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

            postJson("/api/knowledge/interactions", payload, "time_entry", user);
        } catch (Exception e) {
            logger.warn("Agentic time-entry sync skipped due to payload error: {}", e.getMessage());
        }
    }

    private void postJson(String path, Map<String, Object> payload, String syncType, Users user) {
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

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                logger.info("Agentic {} sync successful for user {}", syncType, user != null ? user.getEmail() : "unknown");
                return;
            }

            logger.warn("Agentic {} sync failed with status {} and body {}", syncType, response.statusCode(), response.body());
        } catch (Exception e) {
            logger.warn("Agentic {} sync request failed: {}", syncType, e.getMessage());
        }
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
