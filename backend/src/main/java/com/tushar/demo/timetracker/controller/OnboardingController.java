package com.tushar.demo.timetracker.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tushar.demo.timetracker.dto.request.OnboardingRequestDTO;
import com.tushar.demo.timetracker.exception.ResourceNotFoundException;
import com.tushar.demo.timetracker.integration.AgenticKnowledgeSyncService;
import com.tushar.demo.timetracker.model.MentorEntity;
import com.tushar.demo.timetracker.model.OnboardingEntity;
import com.tushar.demo.timetracker.model.SmartCriteriaEntity;
import com.tushar.demo.timetracker.model.Users;
import com.tushar.demo.timetracker.repository.OnboardingRepository;
import com.tushar.demo.timetracker.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/onboarding")
public class OnboardingController {

	private final UserRepository userRepo;
	private final OnboardingRepository onboardingRepository;
    private final AgenticKnowledgeSyncService agenticKnowledgeSyncService;
    private final ObjectMapper objectMapper;

    public OnboardingController(UserRepository userRepo,
            OnboardingRepository onboardingRepository,
            AgenticKnowledgeSyncService agenticKnowledgeSyncService) {
		this.userRepo = userRepo;
		this.onboardingRepository = onboardingRepository;
        this.agenticKnowledgeSyncService = agenticKnowledgeSyncService;
		this.objectMapper = new ObjectMapper();
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
        onboardingRepository.findByUser(user).ifPresent(existing -> entity.setId(existing.getId()));
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

                Map<String, Object> payload = new HashMap<>();
                payload.put("name", onboarding.getName());
                payload.put("preferredTone", onboarding.getPreferredTone());
                payload.put("coachAvatar", onboarding.getCoachAvatar());
                payload.put("role", onboarding.getRole());
                if (onboarding.getMentor() != null) {
                    Map<String, Object> mentorPayload = new HashMap<>();
                    mentorPayload.put("archetype", onboarding.getMentor().getArchetype());
                    mentorPayload.put("style", onboarding.getMentor().getStyle());
                    mentorPayload.put("name", onboarding.getMentor().getName());
                    mentorPayload.put("avatar", onboarding.getMentor().getAvatar());
                    payload.put("mentor", mentorPayload);
                }
                payload.put(
                    "goals",
                    onboarding.getGoals() == null
                        ? List.of()
                            : onboarding.getGoals().stream().map(goal -> {
                            Map<String, Object> goalPayload = new HashMap<>();
                            goalPayload.put("id", goal.getId());
                            goalPayload.put("title", goal.getTitle());
                            goalPayload.put("description", goal.getDescription());
                            goalPayload.put("category", goal.getCategory());
                            goalPayload.put("priority", goal.getPriority());
                            goalPayload.put("milestones", goal.getMilestones() == null ? List.of() : goal.getMilestones());
                            goalPayload.put("endDate", goal.getEndDate());
                            goalPayload.put("estimatedEffortHours", goal.getEstimatedEffortHours());
                            goalPayload.put("whyItMatters", goal.getWhyItMatters());

                            SmartCriteriaEntity smartCriteria = goal.getSmartCriteria();
                            Map<String, Object> smartCriteriaPayload = new HashMap<>();
                            smartCriteriaPayload.put(
                                "specific",
                                Map.of(
                                    "checked", smartCriteria != null && smartCriteria.isSpecificChecked(),
                                    "note", smartCriteria != null && smartCriteria.getSpecificNote() != null ? smartCriteria.getSpecificNote() : ""
                                )
                            );
                            smartCriteriaPayload.put(
                                "measurable",
                                Map.of(
                                    "checked", smartCriteria != null && smartCriteria.isMeasurableChecked(),
                                    "note", smartCriteria != null && smartCriteria.getMeasurableNote() != null ? smartCriteria.getMeasurableNote() : ""
                                )
                            );
                            smartCriteriaPayload.put(
                                "achievable",
                                Map.of(
                                    "checked", smartCriteria != null && smartCriteria.isAchievableChecked(),
                                    "note", smartCriteria != null && smartCriteria.getAchievableNote() != null ? smartCriteria.getAchievableNote() : ""
                                )
                            );
                            smartCriteriaPayload.put(
                                "relevant",
                                Map.of(
                                    "checked", smartCriteria != null && smartCriteria.isRelevantChecked(),
                                    "note", smartCriteria != null && smartCriteria.getRelevantNote() != null ? smartCriteria.getRelevantNote() : ""
                                )
                            );
                            smartCriteriaPayload.put(
                                "timeBound",
                                Map.of(
                                    "checked", smartCriteria != null && smartCriteria.isTimeBoundChecked(),
                                    "note", smartCriteria != null && smartCriteria.getTimeBoundNote() != null ? smartCriteria.getTimeBoundNote() : ""
                                )
                            );
                            goalPayload.put("smartCriteria", smartCriteriaPayload);
                            return goalPayload;
                            }).toList()
                );

                payload.put("answers", parseAnswersFromPriorities(onboarding.getPriorities()));

                if (onboarding.getPlanner() != null && onboarding.getPlanner().getAvailability() != null) {
                    Map<String, Object> workHours = new HashMap<>();
                    workHours.put("start", onboarding.getPlanner().getAvailability().getWorkHoursStart());
                    workHours.put("end", onboarding.getPlanner().getAvailability().getWorkHoursEnd());

                    Map<String, Object> dndHours = new HashMap<>();
                    dndHours.put("start", onboarding.getPlanner().getAvailability().getDndHoursStart());
                    dndHours.put("end", onboarding.getPlanner().getAvailability().getDndHoursEnd());

                    Map<String, Object> checkIn = new HashMap<>();
                    checkIn.put("preferredTime", onboarding.getPlanner().getAvailability().getCheckInPreferredTime());
                    checkIn.put("frequency", onboarding.getPlanner().getAvailability().getCheckInFrequency());

                    Map<String, Object> availability = new HashMap<>();
                    availability.put("workHours", workHours);
                    availability.put("dndHours", dndHours);
                    availability.put("checkIn", checkIn);
                    availability.put("timezone", onboarding.getPlanner().getAvailability().getTimezone());

                    Map<String, Object> notifications = new HashMap<>();
                    notifications.put("remindersEnabled", onboarding.getPlanner().isRemindersEnabled());

                    Map<String, Object> integrations = new HashMap<>();
                    integrations.put("calendarSync", onboarding.getPlanner().isCalendarSync());
                    integrations.put("taskManagementSync", onboarding.getPlanner().isTaskManagementSync());

                    Map<String, Object> plannerPayload = new HashMap<>();
                    plannerPayload.put("goals", payload.get("goals"));
                    plannerPayload.put("availability", availability);
                    plannerPayload.put("notifications", notifications);
                    plannerPayload.put("integrations", integrations);

                    payload.put("schedule", availability);
                    payload.put("planner", plannerPayload);
                }

                return ResponseEntity.ok(payload);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Not found", "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Processing failed", "message", e.getMessage()));
        }
    }

    @PutMapping("updateOnboardingData")
    public ResponseEntity<?> updateOnboardingData(@RequestBody OnboardingRequestDTO request,
            Authentication authentication) {
        try {
            Users user = userRepo.findByEmail(authentication.getName())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));

            if (request.getRole() == null || request.getMentor() == null || request.getPlanner() == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Invalid data", "message", "Role, mentor, and planner are required"));
            }

            OnboardingEntity entity = OnboardingEntity.fromRequestDTO(request, user);
            onboardingRepository.findByUser(user).ifPresent(existing -> entity.setId(existing.getId()));
            OnboardingEntity savedEntity = onboardingRepository.save(entity);

            user.setOnboardingCompleted(true);
            userRepo.save(user);
            agenticKnowledgeSyncService.syncOnboarding(request, user);

            return ResponseEntity.ok(savedEntity.toResponseDTO());
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Not found", "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Processing failed", "message", e.getMessage()));
        }
    }

    @PatchMapping("redo")
    public ResponseEntity<?> markForOnboardingRedo(Authentication authentication) {
        try {
            Users user = userRepo.findByEmail(authentication.getName())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));

            user.setOnboardingCompleted(false);
            userRepo.save(user);

            return ResponseEntity.ok(Map.of("message", "User marked for onboarding redo"));
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

    private List<Map<String, Object>> parseAnswersFromPriorities(String prioritiesJson) {
        if (prioritiesJson == null || prioritiesJson.isBlank()) {
            return List.of();
        }

        try {
            return objectMapper.readValue(prioritiesJson, new TypeReference<List<Map<String, Object>>>() {
            });
        } catch (Exception ignored) {
            return List.of();
        }
    }
	
}