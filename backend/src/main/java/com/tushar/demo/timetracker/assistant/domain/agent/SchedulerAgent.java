package com.tushar.demo.timetracker.assistant.domain.agent;

import com.tushar.demo.timetracker.model.TimeEntry;
import com.tushar.demo.timetracker.model.Users;
import com.tushar.demo.timetracker.repository.UserRepository;
import com.tushar.demo.timetracker.assistant.infrastructure.service.AI_TimeEntryService;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.service.AiServices;
import dev.langchain4j.service.SystemMessage;

import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.stereotype.Component;

interface TimeEntryExtractor {
    @SystemMessage("""
        Your role is to extract time entry details from the user's command.
        Extract the following:
        - description: The task description (e.g., "Coding").
        - projectName: The project name, if mentioned (e.g., "Project X"). Set to null if not mentioned.
        - startTime: The start time in ISO format (e.g., "2025-05-03T10:00:00Z"). For relative terms like "yesterday", use the start of the previous day at 00:00. Use current time if not specified.
        - duration: The duration in minutes, if specified (e.g., 60). Set to 0 if not specified. Cap at 1440 minutes (24 hours) for single-day entries.
        - action: The action to perform ("create" for new entries, "stop" for stopping an active timer).
        Return a JSON object with these fields.
        Example:
        {
          "description": "Project meeting",
          "projectName": "Sprint 5",
          "startTime": "2025-05-03T14:00:00Z",
          "duration": 90,
          "action": "create"
        }
        """)
    Map<String, Object> extractTimeEntry(String command);
}

@Component
public class SchedulerAgent {
    private final TimeEntryExtractor extractor;
    private final AI_TimeEntryService timeEntryService;
    private final UserRepository userRepository;

    public SchedulerAgent(ChatLanguageModel chatLanguageModel, AI_TimeEntryService timeEntryService, UserRepository userRepository) {
        this.extractor = AiServices.create(TimeEntryExtractor.class, chatLanguageModel);
        this.timeEntryService = timeEntryService;
        this.userRepository = userRepository;
    }

    public TimeEntry processTimeEntryCommand(String userId, String command) {
        Map<String, Object> details = extractor.extractTimeEntry(command);
        Users user = userRepository.findByEmail(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        TimeEntry timeEntry = new TimeEntry();
        timeEntry.setDescription((String) details.get("description"));
        timeEntry.setStartTime(details.get("startTime") != null
                ? LocalDateTime.parse((String) details.get("startTime"))
                : LocalDateTime.now());
        timeEntry.setDuration(details.get("duration") != null
                ? Long.parseLong(details.get("duration").toString())
                : 0);
        timeEntry.setUser(user);

        String action = (String) details.get("action");
        if ("stop".equalsIgnoreCase(action)) {
            // Stopping logic will be handled by CheckerAgent confirmation
            throw new IllegalStateException("Stop action requires confirmation");
        }

        return timeEntryService.createTimeEntryFromCommand(timeEntry);
    }
}