package com.tushar.demo.timetracker.controller;

import com.tushar.demo.timetracker.dto.request.OnboardingRequestDTO;
import com.tushar.demo.timetracker.exception.ResourceNotFoundException;
import com.tushar.demo.timetracker.integration.AgenticKnowledgeSyncService;
import com.tushar.demo.timetracker.model.MentorEntity;
import com.tushar.demo.timetracker.model.OnboardingEntity;
import com.tushar.demo.timetracker.model.Users;
import com.tushar.demo.timetracker.repository.OnboardingRepository;
import com.tushar.demo.timetracker.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/onboarding")
public class OnboardingController {

	private final UserRepository userRepo;
	private final OnboardingRepository onboardingRepository;
    private final AgenticKnowledgeSyncService agenticKnowledgeSyncService;

    public OnboardingController(UserRepository userRepo,
            OnboardingRepository onboardingRepository,
            AgenticKnowledgeSyncService agenticKnowledgeSyncService) {
		this.userRepo = userRepo;
		this.onboardingRepository = onboardingRepository;
        this.agenticKnowledgeSyncService = agenticKnowledgeSyncService;
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
            user.setOnboardingCompleted(true);
            userRepo.save(user);
            agenticKnowledgeSyncService.syncOnboarding(request, user);
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