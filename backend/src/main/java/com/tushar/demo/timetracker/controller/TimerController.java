package com.tushar.demo.timetracker.controller;

import com.tushar.demo.timetracker.config.JwtUtils;
import com.tushar.demo.timetracker.dto.LoginRequest;
import com.tushar.demo.timetracker.dto.SignupRequest;
import com.tushar.demo.timetracker.dto.addTimeEntryRequest;
import com.tushar.demo.timetracker.exception.ConflictException;
import com.tushar.demo.timetracker.exception.NoActiveTimerException;
import com.tushar.demo.timetracker.exception.ResourceNotFoundException;
import com.tushar.demo.timetracker.model.TimeEntry;
import com.tushar.demo.timetracker.model.Users;
import com.tushar.demo.timetracker.repository.UserRepository;
import com.tushar.demo.timetracker.service.TimeEntryService;
import com.tushar.demo.timetracker.service.UserDetailsServiceImpl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.hibernate.query.Page;
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

	private final TimeEntryService timeEntryService;
	private final UserDetailsServiceImpl userDetailsService;
	
	
	@ExceptionHandler(Exception.class)
	public ResponseEntity<Map<String, String>> handleAllExceptions(Exception ex) {
	    Map<String, String> errorResponse = new HashMap<>();
	    errorResponse.put("error", "An error occurred");
	    errorResponse.put("message", ex.getMessage());
	    
	    HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;
	    
	    if (ex instanceof NoActiveTimerException) {
	        status = HttpStatus.NOT_FOUND;
	    } else if (ex instanceof ConflictException) {
	        status = HttpStatus.CONFLICT;
	    } else if (ex instanceof ResourceNotFoundException) {
	        status = HttpStatus.NOT_FOUND;
	    }
	    
	    return new ResponseEntity<>(errorResponse, status);
	}

	public TimerController(TimeEntryService timeEntryService, UserDetailsServiceImpl userDetailsService) {
		this.timeEntryService = timeEntryService;
		this.userDetailsService = userDetailsService;
	}

	@PostMapping
	public ResponseEntity<?> createTimeEntry(@Valid @RequestBody addTimeEntryRequest request,
			Authentication authentication){
		try {
	        Users user = userDetailsService.getCurrentUser(authentication);
	        TimeEntry entry = timeEntryService.createTimeEntry(request, user);
	        return ResponseEntity.ok(entry);
	    } 
		catch (Exception e) {
	        return ResponseEntity.internalServerError().body(Map.of("error", "Creation failed", "message", e.getMessage()));
	    }
	}

	@GetMapping
	public ResponseEntity<List<TimeEntry>> getTimeEntries(@RequestParam LocalDate start, @RequestParam LocalDate end,
			Authentication authentication) {

		Users user = userDetailsService.getCurrentUser(authentication);
		LocalDateTime startDateTime = start.atStartOfDay();
		LocalDateTime endDateTime = end.atTime(23, 59, 59);

		List<TimeEntry> entries = timeEntryService.getTimeEntriesBetweenDates(user, startDateTime, endDateTime);
		return ResponseEntity.ok(entries);
	}
//	@GetMapping
//	public ResponseEntity<org.springframework.data.domain.Page<TimeEntry>> getTimeEntries(
//	    @RequestParam LocalDate start,
//	    @RequestParam LocalDate end,
//	    @PageableDefault(size = 20) Pageable pageable,
//	    Authentication authentication
//	) {
//		Users user = userDetailsService.getCurrentUser(authentication);
//		LocalDateTime startDateTime = start.atStartOfDay();
//		LocalDateTime endDateTime = end.atTime(23, 59, 59);
//		org.springframework.data.domain.Page<TimeEntry> entries = timeEntryService.getPaginatedEntries(user, startDateTime, endDateTime, pageable);
//	    return ResponseEntity.ok(entries);
//	}

	
	@GetMapping("/active")
	public ResponseEntity<TimeEntry> getActiveTimer(Authentication auth) {
	    Users user = userDetailsService.getCurrentUser(auth);
	    return ResponseEntity.ok(timeEntryService.getActiveTimer(user));
	}

	@PostMapping("/{id}/stop")
	public ResponseEntity<TimeEntry> stopTimer(
	    @PathVariable Long id,
	    @RequestParam(required = false) LocalDateTime manualEnd,
	    Authentication auth
	) {
	    Users user = userDetailsService.getCurrentUser(auth);
	    return ResponseEntity.ok(timeEntryService.stopTimer(id, user, manualEnd));
	}
	
	
//	@PatchMapping("/bulk")
//	public ResponseEntity<?> bulkUpdateTimers(@RequestBody List<TimeEntryUpdateRequest> updates, Authentication auth) {
//		Users user = userDetailsService.getCurrentUser(auth);
//		timeEntryService.bulkUpdate(updates, user);
//		return ResponseEntity.ok().build();
//	}

	// Add time entry suggestions
	@GetMapping("/suggestions")
	public ResponseEntity<List<String>> getSuggestions(@RequestParam String query, Authentication auth) {
		Users user = userDetailsService.getCurrentUser(auth);
		return ResponseEntity.ok(timeEntryService.getDescriptionSuggestions(query, user));
	}
}