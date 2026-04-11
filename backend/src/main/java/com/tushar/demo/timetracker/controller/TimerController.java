package com.tushar.demo.timetracker.controller;

import com.tushar.demo.timetracker.dto.request.ApiResponse;
import com.tushar.demo.timetracker.dto.request.PositionUpdateRequest;
import com.tushar.demo.timetracker.dto.request.StartTimeEntryRequest;
import com.tushar.demo.timetracker.dto.request.StopTimeEntryRequest;
import com.tushar.demo.timetracker.dto.request.addTimeEntryRequest;
import com.tushar.demo.timetracker.exception.ConflictException;
import com.tushar.demo.timetracker.exception.NoActiveTimerException;
import com.tushar.demo.timetracker.exception.ResourceNotFoundException;
import com.tushar.demo.timetracker.integration.AgenticKnowledgeSyncService;
import com.tushar.demo.timetracker.integration.AgenticSyncOutboxService;
import com.tushar.demo.timetracker.model.Project;
import com.tushar.demo.timetracker.model.TimeEntry;
import com.tushar.demo.timetracker.model.Users;
import com.tushar.demo.timetracker.repository.ProjectRepository;
import com.tushar.demo.timetracker.repository.TimeEntryRepository;
import com.tushar.demo.timetracker.service.TimeEntryService;
import com.tushar.demo.timetracker.service.impl.UserDetailsServiceImpl;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/timers")
public class TimerController {
    private static final Logger logger = LoggerFactory.getLogger(TimerController.class);

    // Rate limiting for backfill to prevent concurrent requests flooding the outbox
    private static final long BACKFILL_RATE_LIMIT_MS = 60_000; // 1 minute between backfills per user
    private static final ConcurrentHashMap<Long, Long> lastBackfillByUser = new ConcurrentHashMap<>();

    private final TimeEntryService timeEntryService;
    private final UserDetailsServiceImpl userDetailsService;
    private final ProjectRepository projectRepository;
    private final TimeEntryRepository timeEntryRepository;
    private final AgenticKnowledgeSyncService agenticKnowledgeSyncService;
    private final AgenticSyncOutboxService agenticSyncOutboxService;

    public TimerController(TimeEntryService timeEntryService, 
                           UserDetailsServiceImpl userDetailsService,
                           ProjectRepository projectRepository,
                           TimeEntryRepository timeEntryRepository,
                           AgenticKnowledgeSyncService agenticKnowledgeSyncService,
                           AgenticSyncOutboxService agenticSyncOutboxService) {
        this.timeEntryService = timeEntryService;
        this.userDetailsService = userDetailsService;
        this.projectRepository = projectRepository;
        this.timeEntryRepository = timeEntryRepository;
        this.agenticKnowledgeSyncService = agenticKnowledgeSyncService;
        this.agenticSyncOutboxService = agenticSyncOutboxService;
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleAllExceptions(Exception ex) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", LocalDateTime.now());
        errorResponse.put("error", "An error occurred");
        errorResponse.put("message", ex.getMessage());
        errorResponse.put("path", "/api/timers");

        HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;
        String errorCode = "GENERAL_ERROR";

        if (ex instanceof NoActiveTimerException) {
            status = HttpStatus.NOT_FOUND;
            errorCode = "NO_ACTIVE_TIMER";
            errorResponse.put("message", "No active timer found for the user.");
        } else if (ex instanceof ConflictException) {
            status = HttpStatus.CONFLICT;
            errorCode = "TIMER_CONFLICT";
            errorResponse.put("message", "A timer is already running for this user.");
        } else if (ex instanceof ResourceNotFoundException) {
            status = HttpStatus.NOT_FOUND;
            errorCode = "RESOURCE_NOT_FOUND";
            errorResponse.put("message", "Requested resource not found.");
        }

        errorResponse.put("code", errorCode);
        return new ResponseEntity<>(errorResponse, status);
    }

    @PostMapping("/start")
    public ResponseEntity<ApiResponse<TimeEntry>> startTimeEntry(
            @Valid @RequestBody StartTimeEntryRequest request,
            Authentication authentication) {
        logger.info("Starting time entry for user: {}", authName(authentication));
        try {
            if (!isAuthenticatedUser(authentication)) {
                logger.warn("Unauthorized attempt to start timer");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Unauthorized", Map.of("code", "UNAUTHORIZED")));
            }
            Users user = userDetailsService.getCurrentUser(authentication);
            TimeEntry entry = timeEntryService.startTimeEntry(request, user);
            logger.info("Timer started successfully for user: {}", user.getName());
            return ResponseEntity.ok(ApiResponse.success(entry, "Timer started successfully"));
            } catch (ConflictException e) {
                logger.warn("Timer conflict for user: {}", authName(authentication));
                return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error("A timer is already running", Map.of("message", e.getMessage(), "code", "TIMER_CONFLICT")));
            } catch (ResourceNotFoundException e) {
                logger.warn("Timer start referenced missing resource for user: {}", authName(authentication));
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Related resource not found", Map.of("message", e.getMessage(), "code", "RESOURCE_NOT_FOUND")));
        } catch (Exception e) {
            logger.error("Failed to start timer for user: {}", authName(authentication), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Creation failed", Map.of("message", e.getMessage())));
        }
    }

    @PostMapping("/{id}/stop")
    public ResponseEntity<ApiResponse<TimeEntry>> stopTimer(
            @PathVariable Long id,
            @Valid @RequestBody StopTimeEntryRequest request,
            Authentication authentication) {
        logger.info("Stopping timer with id: {} for user: {}", id, authName(authentication));
        try {
            if (!isAuthenticatedUser(authentication)) {
                logger.warn("Unauthorized attempt to stop timer");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Unauthorized", Map.of("code", "UNAUTHORIZED")));
            }
            Users user = userDetailsService.getCurrentUser(authentication);
            TimeEntry entry = timeEntryService.stopTimer(id, user, request.endTime());
            entry.setDescription(request.getDescription());
            if (request.getTagIds() != null) {
                entry.setTagIds(request.getTagIds());
            }
            if (request.getProjectId() != null) {
                Project project = projectRepository.findById(request.getProjectId())
                        .orElseThrow(() -> {
                            logger.error("Project with ID {} not found for user: {}", request.getProjectId(), user.getEmail());
                            return new ResourceNotFoundException("Project not found with ID: " + request.getProjectId());
                        });
                entry.setProject(project);
            }
            entry.setBillable(request.billable());
            TimeEntry updatedEntry = timeEntryRepository.save(entry);
            AgenticSyncOutboxService.EnqueueResult queueResult =
                    agenticSyncOutboxService.enqueueTimeEntrySync(updatedEntry, user, "stop_timer");
            if (!queueResult.accepted()) {
                logger.warn("Failed to queue stop_timer sync for user {}: {}", user.getEmail(), queueResult.message());
            }
            logger.info("Timer stopped successfully for user: {}", user.getName());
            return ResponseEntity.ok(ApiResponse.success(updatedEntry, "Timer stopped successfully"));
            } catch (ResourceNotFoundException e) {
                logger.warn("Stop timer referenced missing resource for user {}: {}", authName(authentication), e.getMessage());
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Related resource not found", Map.of("message", e.getMessage(), "code", "RESOURCE_NOT_FOUND")));
            } catch (IllegalArgumentException e) {
                logger.warn("Invalid stop timer request for user {}: {}", authName(authentication), e.getMessage());
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Validation failed", Map.of("message", e.getMessage(), "code", "VALIDATION_ERROR")));
            } catch (ConflictException e) {
                logger.warn("Stop timer conflict for user {}: {}", authName(authentication), e.getMessage());
                return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error("Timer conflict", Map.of("message", e.getMessage(), "code", "TIMER_CONFLICT")));
        } catch (Exception e) {
            logger.error("Failed to stop timer for user: {}", authName(authentication), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Stop failed", Map.of("message", e.getMessage())));
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TimeEntry>>> getTimeEntries(
            Authentication authentication,
            @RequestParam(required = false) LocalDateTime start,
            @RequestParam(required = false) LocalDateTime end,
            @RequestParam(required = false, defaultValue = "10") int limit) {
        try {
            if (!isAuthenticatedUser(authentication)) {
                logger.warn("Unauthorized attempt to fetch time entries");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Unauthorized", Map.of("code", "UNAUTHORIZED")));
            }
            Users user = userDetailsService.getCurrentUser(authentication);
            List<TimeEntry> timeEntries;
            if (start != null && end != null) {
                logger.info("Fetching time entries for user: {} from {} to {}", user.getEmail(), start, end);
                timeEntries = timeEntryService.getTimeEntriesBetweenDates(user, start, end);
            } else {
                logger.info("Fetching recent time entries for user: {} with limit: {}", user.getEmail(), limit);
                timeEntries = timeEntryService.getRecentTimeEntries(user, limit);
            }
            return ResponseEntity.ok(new ApiResponse<>(true, "Time entries retrieved successfully", timeEntries, null));
        } catch (IllegalArgumentException e) {
            logger.error("Invalid request parameters: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null, null));
        } catch (Exception e) {
            logger.error("Error retrieving time entries: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Failed to retrieve time entries", null, null));
        }
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<TimeEntry>> getActiveTimer(Authentication authentication) {
        logger.info("Fetching active timer for user: {}", authName(authentication));
        try {
            if (!isAuthenticatedUser(authentication)) {
                logger.warn("Unauthorized attempt to fetch active timer");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Unauthorized", Map.of("code", "UNAUTHORIZED")));
            }
            Users user = userDetailsService.getCurrentUser(authentication);
            TimeEntry activeTimer = timeEntryService.getActiveTimer(user);
            logger.info("Active timer fetched for user: {}", user.getName());
            return ResponseEntity.ok(ApiResponse.success(activeTimer, "Active timer fetched successfully"));
        } catch (NoActiveTimerException e) {
            logger.info("No active timer found for user: {}", authName(authentication));
            return ResponseEntity.status(HttpStatus.NO_CONTENT)
                    .body(ApiResponse.success(null, "No active timer found"));
        } catch (Exception e) {
            logger.error("Failed to fetch active timer for user: {}", authName(authentication), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Fetch failed", Map.of("message", e.getMessage())));
        }
    }

    @PutMapping("/{id}/position")
    public ResponseEntity<ApiResponse<TimeEntry>> updateTimerPosition(
            @PathVariable Long id,
            @RequestBody PositionUpdateRequest position,
            Authentication authentication) {
        logger.info("Updating position for timer with id: {} for user: {}", id, authName(authentication));
        try {
            if (!isAuthenticatedUser(authentication)) {
                logger.warn("Unauthorized attempt to update timer position");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Unauthorized", Map.of("code", "UNAUTHORIZED")));
            }
            Users user = userDetailsService.getCurrentUser(authentication);
            TimeEntry entry = timeEntryService.updateTimerPosition(id, user, position.positionTop(), position.positionLeft());
            AgenticSyncOutboxService.EnqueueResult queueResult =
                    agenticSyncOutboxService.enqueueTimeEntrySync(entry, user, "move_time_entry");
            if (!queueResult.accepted()) {
                logger.warn("Failed to queue move_time_entry sync for user {}: {}", user.getEmail(), queueResult.message());
            }
            logger.info("Timer position updated successfully for user: {}", user.getName());
            return ResponseEntity.ok(ApiResponse.success(entry, "Timer position updated successfully"));
        } catch (Exception e) {
            logger.error("Failed to update timer position for user: {}", authName(authentication), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Update failed", Map.of("message", e.getMessage())));
        }
    }

    @PostMapping("/addTimer")
    public ResponseEntity<ApiResponse<TimeEntry>> addTimeEntry(
            @Valid @RequestBody addTimeEntryRequest request,
            Authentication authentication) {
        logger.info("Adding time entry for user: {}", authName(authentication));
        try {
            if (!isAuthenticatedUser(authentication)) {
                logger.warn("Unauthorized attempt to start timer");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Unauthorized", Map.of("code", "UNAUTHORIZED")));
            }
            Users user = userDetailsService.getCurrentUser(authentication);
            TimeEntry entry = timeEntryService.addTimeEntry(request, user);
            AgenticSyncOutboxService.EnqueueResult queueResult =
                    agenticSyncOutboxService.enqueueTimeEntrySync(entry, user, "create_time_entry");
            if (!queueResult.accepted()) {
                logger.warn("Failed to queue create_time_entry sync for user {}: {}", user.getEmail(), queueResult.message());
            }
            logger.info("Popup - Timer added successfully for user: {}", user.getName());
            return ResponseEntity.ok(ApiResponse.success(entry, "Timer started successfully"));
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid time entry request for user {}: {}", authName(authentication), e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Validation failed", Map.of("message", e.getMessage())));
        } catch (Exception e) {
            logger.error("Failed to add time entry for user: {}", authName(authentication), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Creation failed", Map.of("message", e.getMessage())));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TimeEntry>> updateTimeEntry(
            @PathVariable Long id,
            @Valid @RequestBody addTimeEntryRequest request,
            Authentication authentication) {
        logger.info("Updating time entry {} for user: {}", id, authName(authentication));
        try {
            if (!isAuthenticatedUser(authentication)) {
                logger.warn("Unauthorized attempt to update timer");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Unauthorized", Map.of("code", "UNAUTHORIZED")));
            }

            Users user = userDetailsService.getCurrentUser(authentication);
            TimeEntry updatedEntry = timeEntryService.updateTimeEntry(id, request, user);
            AgenticSyncOutboxService.EnqueueResult queueResult =
                    agenticSyncOutboxService.enqueueTimeEntrySync(updatedEntry, user, "update_time_entry");
            if (!queueResult.accepted()) {
                logger.warn("Failed to queue update_time_entry sync for user {}: {}", user.getEmail(), queueResult.message());
            }

            logger.info("Time entry {} updated successfully for user: {}", id, user.getName());
            return ResponseEntity.ok(ApiResponse.success(updatedEntry, "Time entry updated successfully"));
        } catch (ResourceNotFoundException e) {
            logger.warn("Time entry update target missing for user {}: {}", authName(authentication), e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Resource not found", Map.of("message", e.getMessage(), "code", "RESOURCE_NOT_FOUND")));
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid update payload for user {}: {}", authName(authentication), e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Validation failed", Map.of("message", e.getMessage(), "code", "VALIDATION_FAILED")));
        } catch (Exception e) {
            logger.error("Failed to update time entry {} for user: {}", id, authName(authentication), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Update failed", Map.of("message", e.getMessage())));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTimeEntry(
            @PathVariable Long id,
            Authentication authentication) {
        logger.info("Deleting time entry {} for user: {}", id, authName(authentication));
        try {
            if (!isAuthenticatedUser(authentication)) {
                logger.warn("Unauthorized attempt to delete timer");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Unauthorized", Map.of("code", "UNAUTHORIZED")));
            }

            Users user = userDetailsService.getCurrentUser(authentication);
            TimeEntry existingEntry = timeEntryRepository.findByIdAndUser(id, user)
                    .orElseThrow(() -> new ResourceNotFoundException("Time entry not found with ID: " + id));

            AgenticSyncOutboxService.EnqueueResult queueResult =
                    agenticSyncOutboxService.enqueueTimeEntryDeletion(existingEntry, user, "delete_time_entry");
            if (!queueResult.accepted()) {
                logger.warn("Failed to queue delete_time_entry sync for user {}: {}", user.getEmail(), queueResult.message());
            }

            timeEntryService.deleteTimeEntry(id, user);

            logger.info("Time entry {} deleted successfully for user: {}", id, user.getName());
            return ResponseEntity.ok(ApiResponse.success(null, "Time entry deleted successfully"));
        } catch (ResourceNotFoundException e) {
            logger.warn("Time entry delete target missing for user {}: {}", authName(authentication), e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Resource not found", Map.of("message", e.getMessage(), "code", "RESOURCE_NOT_FOUND")));
        } catch (Exception e) {
            logger.error("Failed to delete time entry {} for user: {}", id, authName(authentication), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Delete failed", Map.of("message", e.getMessage())));
        }
    }

    @PostMapping("/{id}/continue")
    public ResponseEntity<ApiResponse<TimeEntry>> continueTimeEntry(
            @PathVariable Long id,
            Authentication authentication) {
        logger.info("Continuing time entry {} as active timer for user: {}", id, authName(authentication));

        try {
            if (!isAuthenticatedUser(authentication)) {
                logger.warn("Unauthorized attempt to continue timer");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Unauthorized", Map.of("code", "UNAUTHORIZED")));
            }

            Users user = userDetailsService.getCurrentUser(authentication);
            TimeEntry sourceEntry = timeEntryRepository.findByIdAndUser(id, user)
                    .orElseThrow(() -> new ResourceNotFoundException("Time entry not found with ID: " + id));
            TimeEntry continuedEntry = timeEntryService.continueTimeEntry(id, user);
            AgenticSyncOutboxService.EnqueueResult queueResult =
                    agenticSyncOutboxService.enqueueTimeEntryContinuation(sourceEntry, continuedEntry, user, "continue_time_entry");
            if (!queueResult.accepted()) {
                logger.warn("Failed to queue continue_time_entry sync for user {}: {}", user.getEmail(), queueResult.message());
            }

            logger.info("Time entry {} continued successfully as timer {} for user: {}", id, continuedEntry.getId(), user.getName());
            return ResponseEntity.ok(ApiResponse.success(continuedEntry, "Time entry continued successfully"));
        } catch (ConflictException e) {
            logger.warn("Continue timer conflict for user: {}", authName(authentication));
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error("A timer is already running", Map.of("message", e.getMessage(), "code", "TIMER_CONFLICT")));
        } catch (ResourceNotFoundException e) {
            logger.warn("Continue timer target missing for user {}: {}", authName(authentication), e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Resource not found", Map.of("message", e.getMessage(), "code", "RESOURCE_NOT_FOUND")));
        } catch (Exception e) {
            logger.error("Failed to continue timer for user: {}", authName(authentication), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Continue failed", Map.of("message", e.getMessage())));
        }
    }

    @PostMapping("/sync/agentic/backfill")
    public ResponseEntity<ApiResponse<Map<String, Object>>> backfillAgenticTimeEntries(
            Authentication authentication,
            @RequestParam(name = "limit", required = false) Integer limit) {
        logger.info("Backfilling Agentic time entries for user: {}", authName(authentication));

        try {
            if (!isAuthenticatedUser(authentication)) {
                logger.warn("Unauthorized attempt to backfill Agentic time entries");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Unauthorized", Map.of("code", "UNAUTHORIZED")));
            }

            Users user = userDetailsService.getCurrentUser(authentication);
            Long userId = user.getId();

            // Rate limiting: prevent concurrent backfill requests from same user
            long now = System.currentTimeMillis();
            Long lastBackfill = lastBackfillByUser.get(userId);
            if (lastBackfill != null && (now - lastBackfill) < BACKFILL_RATE_LIMIT_MS) {
                long remainingSeconds = (BACKFILL_RATE_LIMIT_MS - (now - lastBackfill)) / 1000;
                logger.warn("Backfill rate limited for user {} - last request {} seconds ago", userId, remainingSeconds);
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                        .body(ApiResponse.error("Rate limited", Map.of(
                                "code", "BACKFILL_RATE_LIMITED",
                                "message", "Backfill already in progress or recently completed. Retry in " + remainingSeconds + " seconds."
                        )));
            }
            lastBackfillByUser.put(userId, now);

            if (limit != null && limit < 1) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Validation failed", Map.of(
                                "code", "VALIDATION_FAILED",
                                "message", "limit must be a positive integer when provided"
                        )));
            }

            int requestedLimit = limit != null ? limit : 0;
            long cooldownRemainingSeconds = agenticKnowledgeSyncService.getUpstreamCooldownRemainingSeconds();
            if (cooldownRemainingSeconds > 0) {
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                        .body(ApiResponse.error(
                                "Agentic upstream unavailable",
                                Map.of(
                                        "code", "AGENTIC_UPSTREAM_UNAVAILABLE",
                                        "cooldownSeconds", String.valueOf(cooldownRemainingSeconds)
                                )
                        ));
            }

            AgenticSyncOutboxService.BackfillQueueResult result =
                    agenticSyncOutboxService.enqueueHistoricalTimeEntries(user, requestedLimit);

            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("configured", result.configured());
            payload.put("requested", result.requested());
            payload.put("scanned", result.scanned());
            payload.put("queued", result.queued());
            payload.put("enqueueFailed", result.enqueueFailed());
            payload.put("skippedActive", result.skippedActive());

            if (!result.configured()) {
                return ResponseEntity.status(HttpStatus.PRECONDITION_FAILED)
                        .body(ApiResponse.error(
                                "Agentic sync is not configured",
                                Map.of("code", "AGENTIC_SYNC_NOT_CONFIGURED")
                        ));
            }

            return ResponseEntity.status(HttpStatus.ACCEPTED)
                    .body(ApiResponse.success(payload, "Agentic backfill queued"));
        } catch (Exception e) {
            logger.error("Failed to backfill Agentic time entries for user: {}", authName(authentication), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Backfill failed", Map.of("message", e.getMessage())));
        }
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