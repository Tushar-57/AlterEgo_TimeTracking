package com.tushar.demo.timetracker.controller;

import com.tushar.demo.timetracker.dto.request.ApiResponse;
import com.tushar.demo.timetracker.integration.AgenticKnowledgeSyncService;
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

import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/agentic")
public class AgenticSyncController {
    private static final Logger logger = LoggerFactory.getLogger(AgenticSyncController.class);

    private final UserDetailsServiceImpl userDetailsService;
    private final AgenticKnowledgeSyncService agenticKnowledgeSyncService;

    public AgenticSyncController(UserDetailsServiceImpl userDetailsService,
                                 AgenticKnowledgeSyncService agenticKnowledgeSyncService) {
        this.userDetailsService = userDetailsService;
        this.agenticKnowledgeSyncService = agenticKnowledgeSyncService;
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
            boolean synced = agenticKnowledgeSyncService.syncHabitSnapshot(payload, user, "habit_snapshot");

            Map<String, Object> responsePayload = new LinkedHashMap<>();
            responsePayload.put("synced", synced);
            responsePayload.put("habitCount", collectionSize(payload.get("habits")));
            responsePayload.put("dailyPoints", mapSize(payload.get("dailyCompletionCounts")));

            if (!synced) {
                logger.debug("Habit snapshot accepted but Agentic sync unavailable for user {}", user.getEmail());
                return ResponseEntity.status(HttpStatus.ACCEPTED)
                        .body(ApiResponse.success(responsePayload, "Habit snapshot accepted, Agentic sync unavailable"));
            }

            return ResponseEntity.ok(ApiResponse.success(responsePayload, "Habit snapshot synced to Agentic"));
        } catch (Exception e) {
            logger.error("Failed to sync habit snapshot for user {}", authName(authentication), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Habit sync failed", Map.of("message", e.getMessage())));
        }
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
