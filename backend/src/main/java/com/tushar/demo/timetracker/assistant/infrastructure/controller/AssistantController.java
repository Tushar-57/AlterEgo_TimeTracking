package com.tushar.demo.timetracker.assistant.infrastructure.controller;

import com.tushar.demo.timetracker.assistant.domain.agent.GeneralChatAgent;
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

    private final GeneralChatAgent generalChatAgent;

    @Autowired
    public AssistantController(GeneralChatAgent generalChatAgent) {
        this.generalChatAgent = generalChatAgent;
    }

    @PostMapping("/api/ai/chat")
    public ResponseEntity<Map<String, String>> chat(@RequestBody Map<String, String> request, Authentication authentication) {
        String userId = authentication.getName(); // Extract user ID from JWT
        String command = request.get("command");

        if (command == null || command.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Command is required"));
        }

        Conversation conversation = generalChatAgent.processQuery(userId, command);
        return ResponseEntity.ok(Map.of("message", conversation.response()));
    }
}