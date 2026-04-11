package com.tushar.demo.timetracker.controller;

import com.tushar.demo.timetracker.dto.request.ApiResponse;
import com.tushar.demo.timetracker.integration.AgenticKnowledgeSyncService;
import com.tushar.demo.timetracker.integration.AgenticSyncOutboxService;
import com.tushar.demo.timetracker.model.Users;
import com.tushar.demo.timetracker.service.impl.UserDetailsServiceImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/agentic")
public class AgenticSyncController {
    private static final Logger logger = LoggerFactory.getLogger(AgenticSyncController.class);

    private final UserDetailsServiceImpl userDetailsService;
    private final AgenticKnowledgeSyncService agenticKnowledgeSyncService;
    private final AgenticSyncOutboxService agenticSyncOutboxService;

    public AgenticSyncController(UserDetailsServiceImpl userDetailsService,
                                 AgenticKnowledgeSyncService agenticKnowledgeSyncService,
                                 AgenticSyncOutboxService agenticSyncOutboxService) {
        this.userDetailsService = userDetailsService;
        this.agenticKnowledgeSyncService = agenticKnowledgeSyncService;
        this.agenticSyncOutboxService = agenticSyncOutboxService;
    }

    @PostMapping("/habits/snapshot")
    public ResponseEntity<ApiResponse<Map<String, Object>>> syncHabitSnapshot(
            @RequestBody(required = false) Map<String, Object> payload,
            Authentication authentication) {
        if (!isAuthenticatedUser(authentication)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Unauthorized", Map.of("code", "UNAUTHORIZED")));
        }

        if (payload == null || payload.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Habit snapshot payload is required", Map.of("code", "VALIDATION_FAILED")));
        }

        try {
            Users user = userDetailsService.getCurrentUser(authentication);
            AgenticSyncOutboxService.EnqueueResult queueResult =
                    agenticSyncOutboxService.enqueueHabitSnapshot(payload, user, "habit_snapshot");

            Map<String, Object> responsePayload = new LinkedHashMap<>();
            responsePayload.put("queued", queueResult.accepted());
            responsePayload.put("eventId", queueResult.eventId());
            responsePayload.put("correlationId", queueResult.correlationId());
            responsePayload.put("queueMessage", queueResult.message());
            responsePayload.put("habitCount", collectionSize(payload.get("habits")));
            responsePayload.put("dailyPoints", mapSize(payload.get("dailyCompletionCounts")));

            if (!queueResult.accepted()) {
                logger.debug("Habit snapshot accepted but Agentic sync queue unavailable for user {}", user.getEmail());
                return ResponseEntity.status(HttpStatus.PRECONDITION_FAILED)
                        .body(ApiResponse.error(
                                "Habit snapshot saved locally, Agentic queue unavailable",
                                Map.of("code", "AGENTIC_QUEUE_UNAVAILABLE", "message", queueResult.message())
                        ));
            }

            return ResponseEntity.status(HttpStatus.ACCEPTED)
                    .body(ApiResponse.success(responsePayload, "Habit snapshot queued for Agentic sync"));
        } catch (Exception e) {
            logger.error("Failed to sync habit snapshot for user {}", authName(authentication), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Habit sync failed", Map.of("message", e.getMessage())));
        }
    }

    @GetMapping("/sync/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSyncStatus(Authentication authentication) {
        if (!isAuthenticatedUser(authentication)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Unauthorized", Map.of("code", "UNAUTHORIZED")));
        }

        AgenticSyncOutboxService.QueueMetrics metrics = agenticSyncOutboxService.getQueueMetrics();
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("enabled", metrics.enabled());
        payload.put("configured", metrics.configured());
        payload.put("pending", metrics.pending());
        payload.put("retry", metrics.retry());
        payload.put("processing", metrics.processing());
        payload.put("failed", metrics.failed());
        payload.put("success", metrics.success());
        payload.put("cooldownRemainingSeconds", metrics.cooldownRemainingSeconds());
        payload.put("nextAttemptAt", metrics.nextAttemptAt());
        boolean hasBacklog = metrics.pending() > 0 || metrics.retry() > 0 || metrics.processing() > 0;
        boolean isDegraded = metrics.cooldownRemainingSeconds() > 0 || hasBacklog;
        payload.put("hasFailures", metrics.failed() > 0);
        payload.put("degraded", isDegraded);

        return ResponseEntity.ok(ApiResponse.success(payload, "Agentic sync status retrieved"));
    }

    @PostMapping("/sync/retry-failed")
    public ResponseEntity<ApiResponse<Map<String, Object>>> retryFailedEvents(
            Authentication authentication,
            @RequestParam(name = "limit", defaultValue = "50") int limit) {
        if (!isAuthenticatedUser(authentication)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Unauthorized", Map.of("code", "UNAUTHORIZED")));
        }

        int retried = agenticSyncOutboxService.retryFailedEvents(limit);
        return ResponseEntity.ok(ApiResponse.success(
                Map.of("retried", retried),
                "Queued failed events for retry"
        ));
    }

    @PostMapping("/sync/process-now")
    public ResponseEntity<ApiResponse<Map<String, Object>>> processQueueNow(Authentication authentication) {
        if (!isAuthenticatedUser(authentication)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Unauthorized", Map.of("code", "UNAUTHORIZED")));
        }

        agenticSyncOutboxService.processPendingEvents();
        return ResponseEntity.accepted().body(ApiResponse.success(
                Map.of("triggered", true),
                "Agentic sync queue processing triggered"
        ));
    }

    private int collectionSize(Object value) {
        if (value instanceof Collection<?> collection) {
            return collection.size();
        }
        return 0;
    }

    private int mapSize(Object value) {
        if (value instanceof Map<?, ?> map) {
            return map.size();
        }
        return 0;
    }

    private boolean isAuthenticatedUser(Authentication authentication) {
        return authentication != null
                && authentication.isAuthenticated()
                && !"anonymousUser".equalsIgnoreCase(authentication.getName());
    }

    private String authName(Authentication authentication) {
        return authentication != null ? authentication.getName() : "anonymous";
    }
}
