package com.tushar.demo.timetracker.controller;

import com.tushar.demo.timetracker.assistant.domain.conversation.AI_CommandRequest;
import com.tushar.demo.timetracker.assistant.infrastructure.service.AI_TimeEntryService;
import com.tushar.demo.timetracker.dto.request.OnboardingRequestDTO;
import com.tushar.demo.timetracker.exception.NoActiveTimerException;
import com.tushar.demo.timetracker.exception.ResourceNotFoundException;
import com.tushar.demo.timetracker.model.AvailabilityEntity;
import com.tushar.demo.timetracker.model.GoalEntity;
import com.tushar.demo.timetracker.model.MentorEntity;
import com.tushar.demo.timetracker.model.OnboardingEntity;
import com.tushar.demo.timetracker.model.OnboardingEntity;
import com.tushar.demo.timetracker.model.PlannerEntity;
import com.tushar.demo.timetracker.model.TimeEntry;
import com.tushar.demo.timetracker.model.Users;
import com.tushar.demo.timetracker.repository.OnboardingRepository;
import com.tushar.demo.timetracker.repository.ProjectRepository;
import com.tushar.demo.timetracker.repository.TimeEntryRepository;
import com.tushar.demo.timetracker.repository.UserRepository;
import dev.langchain4j.model.chat.ChatLanguageModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/onboarding")
public class OnboardingController {

	private final AI_TimeEntryService aiService;
	private final UserRepository userRepo;
	private final ChatLanguageModel chatLangModel;
	private final TimeEntryRepository timeEntryRepo;
	private final ProjectRepository projectRepository;
	private final OnboardingRepository onboardingRepository;

	@Autowired
	public OnboardingController(AI_TimeEntryService aiService, ChatLanguageModel chatModel, UserRepository userRepo,
			TimeEntryRepository timeEntryRepo, ProjectRepository projectRepository,
			OnboardingRepository onboardingRepository) {
		this.aiService = aiService;
		this.userRepo = userRepo;
		this.timeEntryRepo = timeEntryRepo;
		this.chatLangModel = chatModel;
		this.projectRepository = projectRepository;
		this.onboardingRepository = onboardingRepository;
	}

	@PostMapping("/onboardNewUser")
	public ResponseEntity<?> saveOnboardingData(@RequestBody OnboardingRequestDTO request,
			Authentication authentication) {
		System.out.println("Received payload: " + request);
		try {
			// Validate authenticated user
			Users user = userRepo.findByEmail(authentication.getName())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            if (request.getRole() == null || request.getMentor() == null || request.getPlanner() == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Invalid data", "message", "Role, mentor, and planner are required"));
            }
            OnboardingEntity entity = OnboardingEntity.fromRequestDTO(request, user);
            OnboardingEntity savedEntity = onboardingRepository.save(entity);
            return ResponseEntity.ok(savedEntity.toResponseDTO());
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "User not found", "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Processing failed", "message", e.getMessage()));
        }
    }
	
	@GetMapping("getOnboardingData")
    public ResponseEntity<?> getOnboarding(Authentication authentication) {
        try {
            Users user = userRepo.findByEmail(authentication.getName())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            OnboardingEntity onboarding = onboardingRepository.findByUser(user)
                    .orElseThrow(() -> new ResourceNotFoundException("Onboarding not found for user: " + user.getEmail()));
            
            return ResponseEntity.ok(Map.of(
                "name", onboarding.getName(),
                "preferredTone", onboarding.getPreferredTone(),
                "coachAvatar", onboarding.getCoachAvatar()
            ));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Not found", "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Processing failed", "message", e.getMessage()));
        }
    }

    @PatchMapping("updateStyle")
    public ResponseEntity<?> updateStyle(@RequestBody Map<String, String> request, Authentication authentication) {
        try {
            Users user = userRepo.findByEmail(authentication.getName())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            String style = request.get("style");

            if (style == null || style.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Style is required"));
            }

            OnboardingEntity onboarding = onboardingRepository.findByUser(user)
                    .orElseThrow(() -> new ResourceNotFoundException("Onboarding not found for user: " + user.getEmail()));
            
            onboarding.setMentor(new MentorEntity(onboarding.getMentor().getArchetype(),style,onboarding.getMentor().getName(),onboarding.getCoachAvatar()));
//            setStyle(style);
            onboardingRepository.save(onboarding);

            return ResponseEntity.ok(Map.of("message", "Style updated successfully"));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Not found", "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Processing failed", "message", e.getMessage()));
        }
    }
	
}