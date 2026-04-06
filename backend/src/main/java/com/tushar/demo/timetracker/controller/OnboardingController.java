package com.tushar.demo.timetracker.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tushar.demo.timetracker.dto.request.ApiResponse;
import com.tushar.demo.timetracker.dto.request.OnboardingRequestDTO;
import com.tushar.demo.timetracker.exception.ResourceNotFoundException;
import com.tushar.demo.timetracker.integration.AgenticKnowledgeSyncService;
import com.tushar.demo.timetracker.model.MentorEntity;
import com.tushar.demo.timetracker.model.OnboardingEntity;
import com.tushar.demo.timetracker.model.SmartCriteriaEntity;
import com.tushar.demo.timetracker.model.Users;
import com.tushar.demo.timetracker.repository.OnboardingRepository;
import com.tushar.demo.timetracker.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;

@RestController
@RequestMapping("/api/onboarding")
public class OnboardingController {

    private static final Logger logger = LoggerFactory.getLogger(OnboardingController.class);

	private final UserRepository userRepo;
	private final OnboardingRepository onboardingRepository;
    private final AgenticKnowledgeSyncService agenticKnowledgeSyncService;
    private final ObjectMapper objectMapper;

    @Value("${agentic.sync.onboarding-read-sync-enabled:true}")
    private boolean onboardingReadSyncEnabled;

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
        onboardingRepository.findTopByUserOrderByIdDesc(user).ifPresent(existing -> entity.setId(existing.getId()));
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
            OnboardingEntity onboarding = onboardingRepository.findTopByUserOrderByIdDesc(user)
                    .orElseThrow(() -> new ResourceNotFoundException("Onboarding not found for user: " + user.getEmail()));

                Map<String, Object> payload = new HashMap<>();
                payload.put("name", firstNonBlank(onboarding.getName(), user.getName(), "Your Alter Ego"));
                payload.put("preferredTone", onboarding.getPreferredTone());
                payload.put("coachAvatar", onboarding.getCoachAvatar());
                payload.put("coachPreferences", onboarding.getCoachPreferencesAsMap());
                payload.put("domainPreferences", onboarding.getDomainPreferencesAsMap());
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

                if (onboardingReadSyncEnabled) {
                    syncOnboardingSnapshot(onboarding, user);
                } else {
                    logger.debug("Skipping onboarding read-sync for user {} because onboardingReadSyncEnabled=false", user.getEmail());
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
            onboardingRepository.findTopByUserOrderByIdDesc(user).ifPresent(existing -> entity.setId(existing.getId()));
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

            @PostMapping("checkups/{checkupType}")
            public ResponseEntity<ApiResponse<Map<String, Object>>> runDailyCheckup(
                @PathVariable String checkupType,
                @RequestBody(required = false) Map<String, Object> request,
                Authentication authentication) {
            try {
                Users user = userRepo.findByEmail(authentication.getName())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));

                String normalizedType = checkupType == null ? "" : checkupType.trim().toLowerCase();
                if (!"morning".equals(normalizedType) && !"evening".equals(normalizedType)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(
                        "Invalid checkup type",
                        Map.of("code", "INVALID_CHECKUP_TYPE", "message", "Use 'morning' or 'evening'")
                    ));
                }

                String date = request != null && request.get("date") != null
                    ? String.valueOf(request.get("date"))
                    : null;
                String note = request != null && request.get("note") != null
                    ? String.valueOf(request.get("note"))
                    : null;

                Map<String, Object> perspective = request != null
                    ? toStringObjectMap(request.get("perspective"))
                    : Map.of();
                Map<String, Object> contextSnapshot = request != null
                    ? toStringObjectMap(request.get("contextSnapshot"))
                    : Map.of();
                if (contextSnapshot.isEmpty() && request != null) {
                    contextSnapshot = toStringObjectMap(request.get("context_snapshot"));
                }

                Map<String, Object> checkupPayload = agenticKnowledgeSyncService.runDailyCheckup(
                    user,
                    normalizedType,
                    date,
                    note,
                    perspective,
                    contextSnapshot
                );
                return ResponseEntity.ok(ApiResponse.success(checkupPayload, "Checkup generated successfully"));
            } catch (ResourceNotFoundException e) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Not found", Map.of("message", e.getMessage(), "code", "NOT_FOUND")));
            } catch (IllegalArgumentException e) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Validation failed", Map.of("message", e.getMessage(), "code", "VALIDATION_ERROR")));
            } catch (IllegalStateException e) {
                return ResponseEntity.status(HttpStatus.PRECONDITION_FAILED)
                    .body(ApiResponse.error("Checkup unavailable", Map.of("message", e.getMessage(), "code", "CHECKUP_UNAVAILABLE")));
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Processing failed", Map.of("message", e.getMessage(), "code", "CHECKUP_FAILED")));
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

                OnboardingEntity onboarding = onboardingRepository.findTopByUserOrderByIdDesc(user)
                    .orElseThrow(() -> new ResourceNotFoundException("Onboarding not found for user: " + user.getEmail()));

                MentorEntity currentMentor = onboarding.getMentor();
                String archetype = currentMentor != null ? currentMentor.getArchetype() : "Guide";
                String mentorName = currentMentor != null ? currentMentor.getName() : user.getName();
                String avatar = firstNonBlank(
                    onboarding.getCoachAvatar(),
                    currentMentor != null ? currentMentor.getAvatar() : null,
                    "/avatars/default.svg"
                );

                onboarding.setMentor(new MentorEntity(archetype, style.trim(), mentorName, avatar));
                onboarding.setPreferredTone(style.trim());
                onboarding.setCoachAvatar(avatar);
                OnboardingEntity saved = onboardingRepository.save(onboarding);
                syncOnboardingSnapshot(saved, user);

            return ResponseEntity.ok(Map.of("message", "Style updated successfully"));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Not found", "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Processing failed", "message", e.getMessage()));
        }
    }

                @PatchMapping("updateTone")
                public ResponseEntity<?> updateTone(@RequestBody Map<String, String> request, Authentication authentication) {
                try {
                    Users user = userRepo.findByEmail(authentication.getName())
                        .orElseThrow(() -> new ResourceNotFoundException("User not found"));

                    String tone = request.get("tone");
                    if (tone == null || tone.trim().isEmpty()) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Tone is required"));
                    }

                    OnboardingEntity onboarding = onboardingRepository.findTopByUserOrderByIdDesc(user)
                        .orElseThrow(() -> new ResourceNotFoundException("Onboarding not found for user: " + user.getEmail()));

                    onboarding.setPreferredTone(tone.trim());
                    if (onboarding.getMentor() != null) {
                    onboarding.setMentor(new MentorEntity(
                        onboarding.getMentor().getArchetype(),
                        tone.trim(),
                        onboarding.getMentor().getName(),
                        firstNonBlank(onboarding.getMentor().getAvatar(), onboarding.getCoachAvatar(), "/avatars/default.svg")
                    ));
                    }

                    OnboardingEntity saved = onboardingRepository.save(onboarding);
                    syncOnboardingSnapshot(saved, user);
                    return ResponseEntity.ok(Map.of("message", "Tone updated successfully"));
                } catch (ResourceNotFoundException e) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Not found", "message", e.getMessage()));
                } catch (Exception e) {
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "Processing failed", "message", e.getMessage()));
                }
                }

                @PatchMapping("updateMentor")
                public ResponseEntity<?> updateMentor(@RequestBody Map<String, Object> request, Authentication authentication) {
                try {
                    Users user = userRepo.findByEmail(authentication.getName())
                        .orElseThrow(() -> new ResourceNotFoundException("User not found"));

                    Map<String, Object> mentorPayload = toStringObjectMap(request.get("mentor"));
                    String coachAvatar = asString(request.get("coachAvatar"));

                    if (mentorPayload.isEmpty() && coachAvatar.isBlank()) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Mentor payload is required"));
                    }

                    OnboardingEntity onboarding = onboardingRepository.findTopByUserOrderByIdDesc(user)
                        .orElseThrow(() -> new ResourceNotFoundException("Onboarding not found for user: " + user.getEmail()));

                    MentorEntity existingMentor = onboarding.getMentor();
                    String nextArchetype = firstNonBlank(
                        asString(mentorPayload.get("archetype")),
                        existingMentor != null ? existingMentor.getArchetype() : null,
                        "Guide"
                    );
                    String nextStyle = firstNonBlank(
                        asString(mentorPayload.get("style")),
                        onboarding.getPreferredTone(),
                        existingMentor != null ? existingMentor.getStyle() : null,
                        "Friendly"
                    );
                    String nextName = firstNonBlank(
                        asString(mentorPayload.get("name")),
                        existingMentor != null ? existingMentor.getName() : null,
                        user.getName(),
                        "Your Alter Ego"
                    );
                    String nextAvatar = firstNonBlank(
                        asString(mentorPayload.get("avatar")),
                        coachAvatar,
                        onboarding.getCoachAvatar(),
                        existingMentor != null ? existingMentor.getAvatar() : null,
                        "/avatars/default.svg"
                    );

                    onboarding.setMentor(new MentorEntity(nextArchetype, nextStyle, nextName, nextAvatar));
                    onboarding.setCoachAvatar(nextAvatar);
                    onboarding.setPreferredTone(nextStyle);

                    OnboardingEntity saved = onboardingRepository.save(onboarding);
                    syncOnboardingSnapshot(saved, user);
                    return ResponseEntity.ok(Map.of("message", "Mentor updated successfully"));
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
            Object parsedPayload = objectMapper.readValue(prioritiesJson, Object.class);
            List<Map<String, Object>> normalized = normalizePrioritiesPayload(parsedPayload);
            if (!normalized.isEmpty()) {
            return normalized;
            }

            if (parsedPayload instanceof List<?>) {
            return objectMapper.convertValue(parsedPayload, new TypeReference<List<Map<String, Object>>>() {
            });
            }
        } catch (Exception ignored) {
            // Fall back to legacy parser before giving up.
        }

        try {
            return objectMapper.readValue(prioritiesJson, new TypeReference<List<Map<String, Object>>>() {
            });
        } catch (Exception ignored) {
            return List.of();
        }
    }

    private void syncOnboardingSnapshot(OnboardingEntity onboarding, Users user) {
        try {
            OnboardingRequestDTO syncRequest = new OnboardingRequestDTO();
            String preferredTone = firstNonBlank(onboarding.getPreferredTone(), "Friendly");

            syncRequest.setRole(firstNonBlank(onboarding.getRole(), "professional"));
            syncRequest.setPreferredTone(preferredTone);
            syncRequest.setCoachAvatar(firstNonBlank(
                onboarding.getCoachAvatar(),
                onboarding.getMentor() != null ? onboarding.getMentor().getAvatar() : null,
                "/avatars/default.svg"
            ));
            syncRequest.setCoachPreferences(onboarding.getCoachPreferencesAsMap());
            syncRequest.setDomainPreferences(onboarding.getDomainPreferencesAsMap());

            syncRequest.setMentor(buildMentorForSync(onboarding, user, preferredTone));

            List<OnboardingRequestDTO.Goal> goals = mapGoalsForSync(onboarding);
            syncRequest.setGoals(goals);
            List<OnboardingRequestDTO.AnswerDTO> answers = mapAnswersForSync(onboarding.getPriorities());
            syncRequest.setAnswers(answers);

            OnboardingRequestDTO.Planner planner = buildPlannerForSync(onboarding, goals);
            syncRequest.setPlanner(planner);
            syncRequest.setSchedule(planner.getAvailability());

            agenticKnowledgeSyncService.syncOnboarding(syncRequest, user);
            logger.debug(
                "Triggered onboarding snapshot sync for user {} (goals={}, answers={})",
                user != null ? user.getEmail() : "unknown",
                goals.size(),
                answers.size()
            );
        } catch (Exception e) {
            // Do not block onboarding reads if best-effort sync fails.
            logger.warn(
                "Onboarding snapshot sync failed for user {}: {}",
                user != null ? user.getEmail() : "unknown",
                e.getMessage()
            );
        }
    }

        private OnboardingRequestDTO.Mentor buildMentorForSync(OnboardingEntity onboarding, Users user, String preferredTone) {
        OnboardingRequestDTO.Mentor mentor = new OnboardingRequestDTO.Mentor();
        mentor.setArchetype(firstNonBlank(
            onboarding.getMentor() != null ? onboarding.getMentor().getArchetype() : null,
            "Guide"
        ));
        mentor.setStyle(firstNonBlank(
            onboarding.getMentor() != null ? onboarding.getMentor().getStyle() : null,
            preferredTone,
            "Friendly"
        ));
        mentor.setName(firstNonBlank(
            onboarding.getMentor() != null ? onboarding.getMentor().getName() : null,
            user != null ? user.getName() : null,
            "Your Alter Ego"
        ));
        mentor.setAvatar(firstNonBlank(
            onboarding.getCoachAvatar(),
            onboarding.getMentor() != null ? onboarding.getMentor().getAvatar() : null,
            "/avatars/default.svg"
        ));
        return mentor;
        }

        private OnboardingRequestDTO.Planner buildPlannerForSync(
            OnboardingEntity onboarding,
            List<OnboardingRequestDTO.Goal> goals) {
        String workHoursStart = firstNonBlank(
            onboarding.getPlanner() != null && onboarding.getPlanner().getAvailability() != null
                ? onboarding.getPlanner().getAvailability().getWorkHoursStart()
                : null,
            onboarding.getSchedule() != null ? onboarding.getSchedule().getWorkHoursStart() : null,
            "09:00"
        );
        String workHoursEnd = firstNonBlank(
            onboarding.getPlanner() != null && onboarding.getPlanner().getAvailability() != null
                ? onboarding.getPlanner().getAvailability().getWorkHoursEnd()
                : null,
            onboarding.getSchedule() != null ? onboarding.getSchedule().getWorkHoursEnd() : null,
            "17:00"
        );
        String dndHoursStart = firstNonBlank(
            onboarding.getPlanner() != null && onboarding.getPlanner().getAvailability() != null
                ? onboarding.getPlanner().getAvailability().getDndHoursStart()
                : null,
            onboarding.getSchedule() != null ? onboarding.getSchedule().getDndHoursStart() : null,
            "12:00"
        );
        String dndHoursEnd = firstNonBlank(
            onboarding.getPlanner() != null && onboarding.getPlanner().getAvailability() != null
                ? onboarding.getPlanner().getAvailability().getDndHoursEnd()
                : null,
            onboarding.getSchedule() != null ? onboarding.getSchedule().getDndHoursEnd() : null,
            "13:00"
        );
        String checkInPreferredTime = firstNonBlank(
            onboarding.getPlanner() != null && onboarding.getPlanner().getAvailability() != null
                ? onboarding.getPlanner().getAvailability().getCheckInPreferredTime()
                : null,
            onboarding.getSchedule() != null ? onboarding.getSchedule().getCheckInPreferredTime() : null,
            "09:00"
        );
        String checkInFrequency = firstNonBlank(
            onboarding.getPlanner() != null && onboarding.getPlanner().getAvailability() != null
                ? onboarding.getPlanner().getAvailability().getCheckInFrequency()
                : null,
            onboarding.getSchedule() != null ? onboarding.getSchedule().getCheckInFrequency() : null,
            "daily"
        );
        String timezone = firstNonBlank(
            onboarding.getPlanner() != null && onboarding.getPlanner().getAvailability() != null
                ? onboarding.getPlanner().getAvailability().getTimezone()
                : null,
            onboarding.getSchedule() != null ? onboarding.getSchedule().getTimezone() : null,
            "UTC"
        );

        OnboardingRequestDTO.WorkHours workHours = new OnboardingRequestDTO.WorkHours();
        workHours.setStart(workHoursStart);
        workHours.setEnd(workHoursEnd);

        OnboardingRequestDTO.DndHours dndHours = new OnboardingRequestDTO.DndHours();
        dndHours.setStart(dndHoursStart);
        dndHours.setEnd(dndHoursEnd);

        OnboardingRequestDTO.CheckIn checkIn = new OnboardingRequestDTO.CheckIn();
        checkIn.setPreferredTime(checkInPreferredTime);
        checkIn.setFrequency(checkInFrequency);

        OnboardingRequestDTO.Availability availability = new OnboardingRequestDTO.Availability();
        availability.setWorkHours(workHours);
        availability.setDndHours(dndHours);
        availability.setCheckIn(checkIn);
        availability.setTimezone(timezone);

        OnboardingRequestDTO.Notifications notifications = new OnboardingRequestDTO.Notifications();
        notifications.setRemindersEnabled(onboarding.getPlanner() != null && onboarding.getPlanner().isRemindersEnabled());

        OnboardingRequestDTO.Integrations integrations = new OnboardingRequestDTO.Integrations();
        integrations.setCalendarSync(onboarding.getPlanner() != null && onboarding.getPlanner().isCalendarSync());
        integrations.setTaskManagementSync(onboarding.getPlanner() != null && onboarding.getPlanner().isTaskManagementSync());

        OnboardingRequestDTO.Planner planner = new OnboardingRequestDTO.Planner();
        planner.setGoals(goals != null ? goals : List.of());
        planner.setAvailability(availability);
        planner.setNotifications(notifications);
        planner.setIntegrations(integrations);
        return planner;
        }

    private List<OnboardingRequestDTO.Goal> mapGoalsForSync(OnboardingEntity onboarding) {
        if (onboarding.getGoals() == null || onboarding.getGoals().isEmpty()) {
            return List.of();
        }

        List<OnboardingRequestDTO.Goal> mappedGoals = new ArrayList<>();
        onboarding.getGoals().forEach(goalEntity -> {
            OnboardingRequestDTO.Goal goal = new OnboardingRequestDTO.Goal();
            goal.setId(goalEntity.getId());
            goal.setTitle(goalEntity.getTitle());
            goal.setDescription(goalEntity.getDescription());
            goal.setCategory(goalEntity.getCategory());
            goal.setPriority(goalEntity.getPriority());
            goal.setMilestones(goalEntity.getMilestones() == null ? List.of() : goalEntity.getMilestones());
            goal.setEndDate(goalEntity.getEndDate());
            goal.setEstimatedEffortHours(goalEntity.getEstimatedEffortHours());
            goal.setWhyItMatters(goalEntity.getWhyItMatters());

            SmartCriteriaEntity smartCriteriaEntity = goalEntity.getSmartCriteria();
            if (smartCriteriaEntity != null) {
                OnboardingRequestDTO.SmartCriteria smartCriteria = new OnboardingRequestDTO.SmartCriteria();
                smartCriteria.setSpecific(toSmartCriteriaField(smartCriteriaEntity.isSpecificChecked(), smartCriteriaEntity.getSpecificNote()));
                smartCriteria.setMeasurable(toSmartCriteriaField(smartCriteriaEntity.isMeasurableChecked(), smartCriteriaEntity.getMeasurableNote()));
                smartCriteria.setAchievable(toSmartCriteriaField(smartCriteriaEntity.isAchievableChecked(), smartCriteriaEntity.getAchievableNote()));
                smartCriteria.setRelevant(toSmartCriteriaField(smartCriteriaEntity.isRelevantChecked(), smartCriteriaEntity.getRelevantNote()));
                smartCriteria.setTimeBound(toSmartCriteriaField(smartCriteriaEntity.isTimeBoundChecked(), smartCriteriaEntity.getTimeBoundNote()));
                goal.setSmartCriteria(smartCriteria);
            }

            mappedGoals.add(goal);
        });

        return mappedGoals;
    }

    private OnboardingRequestDTO.SmartCriteriaField toSmartCriteriaField(boolean checked, String note) {
        OnboardingRequestDTO.SmartCriteriaField field = new OnboardingRequestDTO.SmartCriteriaField();
        field.setChecked(checked);
        field.setNote(note != null ? note : "");
        return field;
    }

    private List<OnboardingRequestDTO.AnswerDTO> mapAnswersForSync(String prioritiesJson) {
        List<Map<String, Object>> parsedAnswers = parseAnswersFromPriorities(prioritiesJson);
        if (parsedAnswers.isEmpty()) {
            return List.of();
        }

        List<OnboardingRequestDTO.AnswerDTO> answers = new ArrayList<>();
        for (Map<String, Object> parsedAnswer : parsedAnswers) {
            String answerValue = firstNonBlank(
                    asString(parsedAnswer.get("answer")),
                    asString(parsedAnswer.get("title")),
                    asString(parsedAnswer.get("value")),
                    asString(parsedAnswer.get("priority"))
            );
            String descriptionValue = firstNonBlank(
                    asString(parsedAnswer.get("description")),
                    asString(parsedAnswer.get("detail")),
                    asString(parsedAnswer.get("note")),
                    asString(parsedAnswer.get("context"))
            );
            if (answerValue.isBlank() && descriptionValue.isBlank()) {
                continue;
            }

            OnboardingRequestDTO.AnswerDTO answer = new OnboardingRequestDTO.AnswerDTO();
            answer.setId(firstNonBlank(asString(parsedAnswer.get("id")), "priority_" + answers.size()));
            answer.setAnswer(answerValue);
            answer.setDescription(descriptionValue);
            answers.add(answer);
        }

        return answers;
    }

    private List<Map<String, Object>> normalizePrioritiesPayload(Object payload) {
        if (payload instanceof List<?> rawAnswers) {
            List<Map<String, Object>> normalized = new ArrayList<>();
            for (Object rawAnswer : rawAnswers) {
                Map<String, Object> answerPayload = normalizeAnswerPayload(rawAnswer, normalized.size());
                if (!answerPayload.isEmpty()) {
                    normalized.add(answerPayload);
                }
            }
            return normalized;
        }

        if (payload instanceof Map<?, ?> rawMap) {
            Object nestedAnswers = rawMap.get("answers");
            if (!(nestedAnswers instanceof List<?>)) {
                nestedAnswers = rawMap.get("priorities");
            }

            if (nestedAnswers instanceof List<?>) {
                return normalizePrioritiesPayload(nestedAnswers);
            }
        }

        return List.of();
    }

    private Map<String, Object> normalizeAnswerPayload(Object rawAnswer, int index) {
        if (rawAnswer instanceof Map<?, ?> rawMap) {
            Map<String, Object> normalized = new LinkedHashMap<>();
            String answerValue = firstNonBlank(
                    asString(rawMap.get("answer")),
                    asString(rawMap.get("title")),
                    asString(rawMap.get("value")),
                    asString(rawMap.get("priority"))
            );
            String descriptionValue = firstNonBlank(
                    asString(rawMap.get("description")),
                    asString(rawMap.get("detail")),
                    asString(rawMap.get("note")),
                    asString(rawMap.get("context"))
            );

            if (answerValue.isBlank() && descriptionValue.isBlank()) {
                return Map.of();
            }

            normalized.put("id", firstNonBlank(asString(rawMap.get("id")), "priority_" + index));
            normalized.put("answer", answerValue);
            normalized.put("description", descriptionValue);
            return normalized;
        }

        String answerValue = asString(rawAnswer).trim();
        if (answerValue.isBlank()) {
            return Map.of();
        }

        Map<String, Object> normalized = new LinkedHashMap<>();
        normalized.put("id", "priority_" + index);
        normalized.put("answer", answerValue);
        normalized.put("description", "");
        return normalized;
    }

    private String asString(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private Map<String, Object> toStringObjectMap(Object value) {
        if (!(value instanceof Map<?, ?> rawMap)) {
            return new LinkedHashMap<>();
        }

        Map<String, Object> normalized = new LinkedHashMap<>();
        rawMap.forEach((key, rawValue) -> normalized.put(String.valueOf(key), rawValue));
        return normalized;
    }

    private String firstNonBlank(String... values) {
        if (values == null) {
            return "";
        }

        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return "";
    }
	
}