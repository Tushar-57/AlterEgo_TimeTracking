package com.tushar.demo.timetracker.controller;

import com.tushar.demo.timetracker.config.JwtUtils;
import com.tushar.demo.timetracker.dto.request.ApiResponse;
import com.tushar.demo.timetracker.dto.request.LoginRequest;
import com.tushar.demo.timetracker.dto.request.SignupRequest;
import com.tushar.demo.timetracker.dto.request.StartTimeEntryRequest;
import com.tushar.demo.timetracker.dto.request.addTimeEntryRequest;
import com.tushar.demo.timetracker.exception.ConflictException;
import com.tushar.demo.timetracker.exception.NoActiveTimerException;
import com.tushar.demo.timetracker.exception.ResourceNotFoundException;
import com.tushar.demo.timetracker.model.Project;
import com.tushar.demo.timetracker.model.TimeEntry;
import com.tushar.demo.timetracker.model.Users;
import com.tushar.demo.timetracker.repository.ProjectRepository;
import com.tushar.demo.timetracker.repository.UserRepository;
import com.tushar.demo.timetracker.service.TimeEntryService;
import com.tushar.demo.timetracker.service.impl.UserDetailsServiceImpl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.hibernate.query.Page;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import org.springframework.security.core.userdetails.UserDetails;

@RestController
@RequestMapping("/api/timers")
public class TimerController {
    private static final Logger logger = LoggerFactory.getLogger(TimerController.class);
    private final TimeEntryService timeEntryService;
    private final UserDetailsServiceImpl userDetailsService;

    public TimerController(TimeEntryService timeEntryService, UserDetailsServiceImpl userDetailsService) {
        this.timeEntryService = timeEntryService;
        this.userDetailsService = userDetailsService;
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
        logger.info("Starting time entry for user: {}", authentication.getName());
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                logger.warn("Unauthorized attempt to start timer");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Unauthorized", Map.of("code", "UNAUTHORIZED")));
            }
            Users user = userDetailsService.getCurrentUser(authentication);
            TimeEntry entry = timeEntryService.startTimeEntry(request, user);
            logger.info("Timer started successfully for user: {}", user.getName());
            return ResponseEntity.ok(ApiResponse.success(entry, "Timer started successfully"));
        } catch (Exception e) {
            logger.error("Failed to start timer for user: {}", authentication.getName(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Creation failed", Map.of("message", e.getMessage())));
        }
    }

    @PostMapping("/{id}/stop")
    public ResponseEntity<ApiResponse<TimeEntry>> stopTimer(
            @PathVariable Long id,
            @RequestParam(required = false) LocalDateTime manualEnd,
            Authentication authentication) {
        logger.info("Stopping timer with id: {} for user: {}", id, authentication.getName());
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                logger.warn("Unauthorized attempt to stop timer");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Unauthorized", Map.of("code", "UNAUTHORIZED")));
            }
            Users user = userDetailsService.getCurrentUser(authentication);
            TimeEntry entry = timeEntryService.stopTimer(id, user, manualEnd);
            logger.info("Timer stopped successfully for user: {}", user.getName());
            return ResponseEntity.ok(ApiResponse.success(entry, "Timer stopped successfully"));
        } catch (Exception e) {
            logger.error("Failed to stop timer for user: {}", authentication.getName(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Stop failed", Map.of("message", e.getMessage())));
        }
    }

//    @GetMapping
//    public ResponseEntity<ApiResponse<List<TimeEntry>>> getTimeEntries(
//            @RequestParam LocalDate start,
//            @RequestParam LocalDate end,
//            Authentication authentication) {
//        logger.info("Fetching time entries for user: {} from {} to {}", authentication.getName(), start, end);
//        try {
//            Users user = userDetailsService.getCurrentUser(authentication);
//            LocalDateTime startDateTime = start.atStartOfDay();
//            LocalDateTime endDateTime = end.atTime(23, 59, 59);
//            List<TimeEntry> entries = timeEntryService.getTimeEntriesBetweenDates(user, startDateTime, endDateTime);
//            logger.info("Successfully fetched {} time entries for user: {}", entries.size(), user.getName());
//            return ResponseEntity.ok(ApiResponse.success(entries, "Time entries fetched successfully"));
//        } catch (Exception e) {
//            logger.error("Failed to fetch time entries for user: {}", authentication.getName(), e);
//            return ResponseEntity.internalServerError()
//                    .body(ApiResponse.error("Fetch failed", Map.of("message", e.getMessage())));
//        }
//    }
    @GetMapping
	public ResponseEntity<ApiResponse<List<TimeEntry>>> getTimeEntries(@RequestParam(required = false) LocalDate start,
			@RequestParam(required = false) LocalDate end,
			@RequestParam(required = false, defaultValue = "5") int limit, Authentication authentication) {
		logger.info("Fetching time entries for user: {} from {} to {} with limit {}", authentication.getName(), start,
				end, limit);
		try {
			if (authentication == null || !authentication.isAuthenticated()) {
				logger.warn("Unauthorized attempt to fetch time entries");
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
						.body(ApiResponse.error("Unauthorized", Map.of("code", "UNAUTHORIZED")));
			}
			Users user = userDetailsService.getCurrentUser(authentication);
			List<TimeEntry> entries;
			if (start != null && end != null) {
				LocalDateTime startDateTime = start.atStartOfDay();
				LocalDateTime endDateTime = end.atTime(23, 59, 59);
				entries = timeEntryService.getTimeEntriesBetweenDates(user, startDateTime, endDateTime);
			} else {
				entries = timeEntryService.getRecentTimeEntries(user, limit);
			}
			logger.info("Successfully fetched {} time entries for user: {}", entries.size(), user.getName());
			return ResponseEntity.ok(ApiResponse.success(entries, "Time entries fetched successfully"));
		} catch (Exception e) {
			logger.error("Failed to fetch time entries for user: {}", authentication.getName(), e);
			return ResponseEntity.internalServerError()
					.body(ApiResponse.error("Fetch failed", Map.of("message", e.getMessage())));
		}
	}
    @GetMapping("/active")
    public ResponseEntity<ApiResponse<TimeEntry>> getActiveTimer(Authentication authentication) {
        logger.info("Fetching active timer for user: {}", authentication.getName());
        try {
            Users user = userDetailsService.getCurrentUser(authentication);
            TimeEntry activeTimer = timeEntryService.getActiveTimer(user);
            logger.info("Active timer fetched for user: {}", user.getName());
            return ResponseEntity.ok(ApiResponse.success(activeTimer, "Active timer fetched successfully"));
        } catch (NoActiveTimerException e) {
            logger.info("No active timer found for user: {}", authentication.getName());
            return ResponseEntity.status(HttpStatus.NO_CONTENT)
                    .body(ApiResponse.success(null, "No active timer found"));
        } catch (Exception e) {
            logger.error("Failed to fetch active timer for user: {}", authentication.getName(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Fetch failed", Map.of("message", e.getMessage())));
        }
    }
    
}