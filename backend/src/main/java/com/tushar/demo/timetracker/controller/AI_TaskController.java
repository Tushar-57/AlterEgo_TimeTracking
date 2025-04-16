package com.tushar.demo.timetracker.controller;

import com.tushar.demo.timetracker.dto.AI_CommandRequest;
import com.tushar.demo.timetracker.exception.NoActiveTimerException;
import com.tushar.demo.timetracker.exception.ResourceNotFoundException;
import com.tushar.demo.timetracker.model.TimeEntry;
import com.tushar.demo.timetracker.model.Users;
import com.tushar.demo.timetracker.repository.TimeEntryRepository;
import com.tushar.demo.timetracker.repository.UserRepository;
import com.tushar.demo.timetracker.service.AI_TimeEntryService;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.input.structured.StructuredPrompt;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AI_TaskController {
	
//	private final Users UserRepository;
	
	@PostMapping("/testt")
	public ResponseEntity<?> testEndpoint(@RequestBody AI_CommandRequest request) {
		try {
			TimeEntry entry = aiService.createTimeEntryFromCommand(request.command());
			if (entry == null) {
				return ResponseEntity.badRequest()
						.body(Map.of("error", "Time entry creation failed", "message", "AI service returned null"));
			}
			return ResponseEntity
					.ok(Map.of("task", entry.getTaskDescription() != null ? entry.getTaskDescription() : "", "start",
							entry.getStartTime() != null ? entry.getStartTime().toString() : "", "end",
							entry.getEndTime() != null ? entry.getEndTime().toString() : "", "duration",
							entry.getDuration() != null ? entry.getDuration() : 0));
		} catch (Exception e) {
			return ResponseEntity.internalServerError()
					.body(Map.of("error", "Processing failed", "message", e.getMessage()));
		}
	}

	private final AI_TimeEntryService aiService;
	private final UserRepository userRepo;
	private final ChatLanguageModel chatLangModel;
	private final TimeEntryRepository timeEntryRepo;

	@Autowired
	public AI_TaskController(AI_TimeEntryService aiService, ChatLanguageModel chatModel, UserRepository userRepo, TimeEntryRepository timeEntryRepo) 
	{
		this.aiService = aiService;
		this.userRepo = userRepo;
		this.timeEntryRepo = timeEntryRepo;
		this.chatLangModel = chatModel;
	}

	@GetMapping("/taskC")
	public ResponseEntity<?> createTaskFromCommand(@RequestBody AI_CommandRequest request) {
		try {
			TimeEntry entry = aiService.createTimeEntryFromCommand(request.command());
			return ResponseEntity.ok(entry);
		} catch (Exception e) {
			return ResponseEntity.badRequest().body(Map.of("error", "Task creation failed", "message", e.getMessage()));
		}
	}

	@GetMapping("/suggestions")
	public ResponseEntity<?> getSuggestions(@RequestParam(required = false) String query,
			Authentication authentication) {
		System.out.print("Authentication object: "+ authentication);
		if (query == null)
			query = "";
		// Authentication check
		if (authentication == null || !authentication.isAuthenticated()) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
		}

		try {
			List<String> suggestions = aiService.getDescriptionSuggestions(query, authentication);
			return ResponseEntity.ok(suggestions);
		} catch (SecurityException e) {
			// Handle token expiration explicitly
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
					.body(Map.of("error", "Unauthorized", "message", "Token expired"));
		} catch (Exception e) {
			// General server errors
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body(Map.of("error", "Server Error", "message", e.getMessage()));
		}
	}
	@GetMapping("/timers/active")
	public ResponseEntity<TimeEntry> getActiveTimer(Authentication authentication) {
	    String email = authentication.getName();
	    Users user= null;
		try {
			user = userRepo.findByEmail(email)
					.orElseThrow(() -> new ResourceNotFoundException("User not found"));
		} catch (Exception e) {

			e.printStackTrace();
		}
	    if(user != null) {
	    	TimeEntry activeTimer = timeEntryRepo.findByUserAndEndTimeIsNull(user)
	    	        .orElseThrow(() -> new NoActiveTimerException());
	    	    
	    	    return ResponseEntity.ok(activeTimer);
	    }
		return null;
	    
	    
	}
}