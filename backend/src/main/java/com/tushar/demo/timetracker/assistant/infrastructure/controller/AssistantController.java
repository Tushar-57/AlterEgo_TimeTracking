package com.tushar.demo.timetracker.assistant.infrastructure.controller;

import com.tushar.demo.timetracker.assistant.domain.agent.AgentSociety;
import com.tushar.demo.timetracker.assistant.domain.conversation.Conversation;
import com.tushar.demo.timetracker.exception.ResourceNotFoundException;
import com.tushar.demo.timetracker.model.OnboardingEntity;
import com.tushar.demo.timetracker.model.Users;
import com.tushar.demo.timetracker.repository.OnboardingRepository;
import com.tushar.demo.timetracker.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.Optional;

@RestController
public class AssistantController {

    private final AgentSociety agentSociety;
    private final OnboardingRepository onboardingRepository;
    private final UserRepository userRepo;

    @Autowired
    public AssistantController(AgentSociety agentSociety, OnboardingRepository onboardingRepository, UserRepository userRepo) {
        this.agentSociety = agentSociety;
        this.onboardingRepository = onboardingRepository;
        this.userRepo = userRepo;
    }

    @PostMapping("/api/ai/chat")
    public ResponseEntity<Map<String, Object>> chat(@RequestBody Map<String, String> request, Authentication authentication) {
    	Users user = userRepo.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    	String userId = authentication.getName();
        String command = request.get("command");
        Optional<OnboardingEntity> onboardUserDetails = onboardingRepository.findByUser(user); 
        String tone = onboardUserDetails.map(entity -> entity.getMentor().getStyle()).orElse("Patient");
        String archetype = onboardUserDetails.map(entity -> entity.getMentor().getArchetype()).orElse("Guide");

        if (command == null || command.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Command is required"));
        }

        Conversation conversation = agentSociety.processCommand(userId, command, tone, archetype);
        Map<String, Object> response = new java.util.HashMap<>();
        response.put("message", conversation.response());
        response.put("intent", conversation.intent());
        if (conversation.requiresAction()) {
            response.put("requiresAction", true);
            response.put("actionDetails", conversation.actionDetails());
        }
        return ResponseEntity.ok(response);
    }
}