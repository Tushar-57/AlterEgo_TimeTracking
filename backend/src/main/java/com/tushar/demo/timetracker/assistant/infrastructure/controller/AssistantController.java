package com.tushar.demo.timetracker.assistant.infrastructure.controller;

import com.tushar.demo.timetracker.assistant.domain.agent.AgentSociety;
import com.tushar.demo.timetracker.assistant.domain.conversation.Conversation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class AssistantController {

    private final AgentSociety agentSociety;

    @Autowired
    public AssistantController(AgentSociety agentSociety) {
        this.agentSociety = agentSociety;
    }

    @PostMapping("/api/ai/chat")
    public ResponseEntity<Map<String, Object>> chat(@RequestBody Map<String, String> request, Authentication authentication) {
        String userId = authentication.getName();
        String command = request.get("command");
        String tone = request.getOrDefault("tone", "Inspirational");
        String archetype = request.getOrDefault("archetype", "Guide");

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