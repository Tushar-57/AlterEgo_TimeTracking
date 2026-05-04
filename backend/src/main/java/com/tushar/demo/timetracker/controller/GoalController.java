package com.tushar.demo.timetracker.controller;

import com.tushar.demo.timetracker.dto.request.ApiResponse;
import com.tushar.demo.timetracker.exception.ResourceNotFoundException;
import com.tushar.demo.timetracker.integration.AgenticSyncOutboxService;
import com.tushar.demo.timetracker.model.GoalEntity;
import com.tushar.demo.timetracker.model.Users;
import com.tushar.demo.timetracker.repository.GoalRepository;
import com.tushar.demo.timetracker.service.impl.UserDetailsServiceImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/goals")
public class GoalController {
    private static final Logger logger = LoggerFactory.getLogger(GoalController.class);

    private static final Set<String> ALLOWED_STATUSES = Set.of("ACTIVE", "COMPLETED", "PAUSED");

    private final GoalRepository goalRepository;
    private final UserDetailsServiceImpl userDetailsService;
    private final AgenticSyncOutboxService agenticSyncOutboxService;

    public GoalController(GoalRepository goalRepository,
                          UserDetailsServiceImpl userDetailsService,
                          AgenticSyncOutboxService agenticSyncOutboxService) {
        this.goalRepository = goalRepository;
        this.userDetailsService = userDetailsService;
        this.agenticSyncOutboxService = agenticSyncOutboxService;
    }

    @PutMapping("/{goalId}/progress")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateGoalProgress(
            @PathVariable String goalId,
            @RequestBody(required = false) Map<String, Object> body,
            Authentication authentication) {
        if (!isAuthenticatedUser(authentication)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Unauthorized", Map.of("code", "UNAUTHORIZED")));
        }

        if (goalId == null || goalId.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Validation failed", Map.of("code", "VALIDATION_FAILED", "message", "goalId is required")));
        }

        try {
            Users user = userDetailsService.getCurrentUser(authentication);
            List<GoalEntity> matches = goalRepository.findByExternalIdForUser(goalId, user.getId());
            if (matches.isEmpty()) {
                throw new ResourceNotFoundException("Goal not found with id: " + goalId);
            }
            // Pick the most recent (highest goalId) — handles users who re-onboarded.
            GoalEntity goal = matches.get(0);
            for (GoalEntity candidate : matches) {
                if (candidate.getGoalId() != null
                        && (goal.getGoalId() == null || candidate.getGoalId() > goal.getGoalId())) {
                    goal = candidate;
                }
            }

            Integer progressPercent = parseProgressPercent(body != null ? body.get("progressPercent") : null);
            String status = parseStatus(body != null ? body.get("status") : null);
            Object milestonesCompleted = body != null ? body.get("milestonesCompleted") : null;

            if (progressPercent != null) {
                goal.setProgressPercent(progressPercent);
            }
            if (status != null) {
                goal.setStatus(status);
            }
            goal.setLastUpdatedAt(Instant.now());

            GoalEntity saved = goalRepository.save(goal);

            Map<String, Object> goalSnapshot = new LinkedHashMap<>();
            goalSnapshot.put("goalId", saved.getId());
            goalSnapshot.put("title", saved.getTitle());
            goalSnapshot.put("category", saved.getCategory());
            goalSnapshot.put("priority", saved.getPriority());
            goalSnapshot.put("endDate", saved.getEndDate());
            goalSnapshot.put("progressPercent", saved.getProgressPercent());
            goalSnapshot.put("status", saved.getStatus());
            if (milestonesCompleted != null) {
                goalSnapshot.put("milestonesCompleted", milestonesCompleted);
            }

            try {
                AgenticSyncOutboxService.EnqueueResult queueResult =
                        agenticSyncOutboxService.enqueueGoalProgressSync(goalSnapshot, user, "update_goal_progress");
                if (!queueResult.accepted()) {
                    logger.debug("Goal progress sync not queued for user {}: {}", user.getEmail(), queueResult.message());
                }
            } catch (Exception syncError) {
                logger.warn("Goal progress Agentic enqueue failed for user {}: {}", user.getEmail(), syncError.getMessage());
            }

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("goalId", saved.getId());
            response.put("progressPercent", saved.getProgressPercent());
            response.put("status", saved.getStatus());
            response.put("lastUpdatedAt", saved.getLastUpdatedAt() != null ? saved.getLastUpdatedAt().toString() : null);
            return ResponseEntity.ok(ApiResponse.success(response, "Goal progress updated"));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Goal not found", Map.of("code", "RESOURCE_NOT_FOUND", "message", e.getMessage())));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Validation failed", Map.of("code", "VALIDATION_FAILED", "message", e.getMessage())));
        } catch (Exception e) {
            logger.error("Failed to update goal progress for user {}", authName(authentication), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Update failed", Map.of("message", e.getMessage())));
        }
    }

    private Integer parseProgressPercent(Object value) {
        if (value == null) {
            return null;
        }
        int parsed;
        if (value instanceof Number number) {
            parsed = number.intValue();
        } else {
            try {
                parsed = Integer.parseInt(String.valueOf(value).trim());
            } catch (NumberFormatException ex) {
                throw new IllegalArgumentException("progressPercent must be an integer");
            }
        }
        if (parsed < 0 || parsed > 100) {
            throw new IllegalArgumentException("progressPercent must be between 0 and 100");
        }
        return parsed;
    }

    private String parseStatus(Object value) {
        if (value == null) {
            return null;
        }
        String normalized = String.valueOf(value).trim().toUpperCase();
        if (normalized.isEmpty()) {
            return null;
        }
        if (!ALLOWED_STATUSES.contains(normalized)) {
            throw new IllegalArgumentException("status must be one of " + ALLOWED_STATUSES);
        }
        return normalized;
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
