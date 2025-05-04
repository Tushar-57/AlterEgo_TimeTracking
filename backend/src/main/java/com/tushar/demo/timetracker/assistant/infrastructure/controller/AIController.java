package com.tushar.demo.timetracker.assistant.infrastructure.controller;

import com.tushar.demo.timetracker.assistant.domain.agent.SchedulerAgent;
import com.tushar.demo.timetracker.assistant.domain.conversation.AI_CommandRequest;
import com.tushar.demo.timetracker.assistant.infrastructure.service.AI_TimeEntryService;
import com.tushar.demo.timetracker.exception.NoActiveTimerException;
import com.tushar.demo.timetracker.exception.ResourceNotFoundException;
import com.tushar.demo.timetracker.model.TimeEntry;
import com.tushar.demo.timetracker.model.Users;
import com.tushar.demo.timetracker.repository.ProjectRepository;
import com.tushar.demo.timetracker.repository.TimeEntryRepository;
import com.tushar.demo.timetracker.repository.UserRepository;
import com.tushar.demo.timetracker.model.Project;
import dev.langchain4j.model.chat.ChatLanguageModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/ai")
public class AIController {

    private final AI_TimeEntryService aiService;
    private final UserRepository userRepo;
    private final ChatLanguageModel chatLangModel;
    private final TimeEntryRepository timeEntryRepo;
    private final ProjectRepository projectRepository;
    private final SchedulerAgent schedulerAgent;

    @Autowired
    public AIController(
            AI_TimeEntryService aiService,
            ChatLanguageModel chatModel,
            UserRepository userRepo,
            TimeEntryRepository timeEntryRepo,
            ProjectRepository projectRepository,
            SchedulerAgent schedulerAgent) {
        this.aiService = aiService;
        this.userRepo = userRepo;
        this.chatLangModel = chatModel;
        this.timeEntryRepo = timeEntryRepo;
        this.projectRepository = projectRepository;
        this.schedulerAgent = schedulerAgent;
    }

    @PostMapping("/testt")
    public ResponseEntity<?> testEndpoint(@RequestBody AI_CommandRequest request, Authentication authentication) {
        try {
            Users user = userRepo.findByEmail(authentication.getName())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            TimeEntry entry = aiService.createTimeEntryFromCommand(request.command());
            if (entry == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Time entry creation failed", "message", "AI service returned null"));
            }
            return ResponseEntity.ok(Map.of(
                    "task", entry.getDescription() != null ? entry.getDescription() : "",
                    "start", entry.getStartTime() != null ? entry.getStartTime().toString() : "",
                    "end", entry.getEndTime() != null ? entry.getEndTime().toString() : "",
                    "duration", entry.getDuration() != null ? entry.getDuration() : 0
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Processing failed", "message", e.getMessage()));
        }
    }

    @PostMapping("/parseCommand")
    public ResponseEntity<?> parseCommand(@RequestBody AI_CommandRequest request, Authentication authentication) {
        try {
            Users user = userRepo.findByEmail(authentication.getName())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));

            TimeEntry entry = aiService.createTimeEntryFromCommand(request.command());

            if (entry.getProject() != null) {
                Optional<Project> project = projectRepository.findByNameAndUser(entry.getProject().getName(), user);
                if (project.isEmpty()) {
                    return ResponseEntity.ok(Map.of(
                            "requiresProjectCreation", true,
                            "projectName", entry.getProject().getName(),
                            "originalCommand", request.command()
                    ));
                }
            }

            return ResponseEntity.ok(Map.of(
                    "action", "createEntry",
                    "payload", entry,
                    "confirmationText", "Entry created successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}