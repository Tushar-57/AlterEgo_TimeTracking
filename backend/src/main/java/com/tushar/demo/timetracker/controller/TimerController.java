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
import com.tushar.demo.timetracker.model.Project;
import com.tushar.demo.timetracker.model.TimeEntry;
import com.tushar.demo.timetracker.model.Users;
import com.tushar.demo.timetracker.repository.ProjectRepository;
import com.tushar.demo.timetracker.repository.TimeEntryRepository;
import com.tushar.demo.timetracker.service.TimeEntryService;
import com.tushar.demo.timetracker.service.impl.UserDetailsServiceImpl;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
    private final TimeEntryService timeEntryService;
    private final UserDetailsServiceImpl userDetailsService;
    private final ProjectRepository projectRepository;
    private final TimeEntryRepository timeEntryRepository;
    private final AgenticKnowledgeSyncService agenticKnowledgeSyncService;

    public TimerController(TimeEntryService timeEntryService, 
                           UserDetailsServiceImpl userDetailsService,
                           ProjectRepository projectRepository,
                           TimeEntryRepository timeEntryRepository,
                           AgenticKnowledgeSyncService agenticKnowledgeSyncService) {
        this.timeEntryService = timeEntryService;
        this.userDetailsService = userDetailsService;
        this.projectRepository = projectRepository;
        this.timeEntryRepository = timeEntryRepository;
        this.agenticKnowledgeSyncService = agenticKnowledgeSyncService;
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
            entry.setTagIds(request.getTagIds() != null ? request.getTagIds() : entry.getTagIds());
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
            agenticKnowledgeSyncService.syncTimeEntry(updatedEntry, user, "stop_timer");
            logger.info("Timer stopped successfully for user: {}", user.getName());
            return ResponseEntity.ok(ApiResponse.success(updatedEntry, "Timer stopped successfully"));
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
            agenticKnowledgeSyncService.syncTimeEntry(entry, user, "create_time_entry");
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

    private boolean isAuthenticatedUser(Authentication authentication) {
        return authentication != null
                && authentication.isAuthenticated()
                && !"anonymousUser".equalsIgnoreCase(authentication.getName());
    }

    private String authName(Authentication authentication) {
        return authentication != null ? authentication.getName() : "anonymous";
    }
}