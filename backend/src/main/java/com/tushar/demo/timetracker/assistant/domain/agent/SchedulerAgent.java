package com.tushar.demo.timetracker.assistant.domain.agent;

import com.tushar.demo.timetracker.model.TimeEntry;
import com.tushar.demo.timetracker.model.Users;
import com.tushar.demo.timetracker.repository.UserRepository;
import com.tushar.demo.timetracker.assistant.infrastructure.service.AI_TimeEntryService;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.service.AiServices;
import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@Component
interface TimeEntryExtractor {
    @SystemMessage("""
        Your role is to extract time entry details from the user's command.
        Extract the following:
        - description: The task description (e.g., "Coding"). Set to null if not mentioned.
        - projectName: The project name, if mentioned (e.g., "Project X"). Set to null if not mentioned.
        - startTime: The start time in ISO format (e.g., "2025-05-03T10:00:00Z"). For relative terms like "yesterday", use the start of the previous day at 00:00 UTC. Use current time if not specified.
        - duration: The duration in minutes, if specified (e.g., 60). Set to 0 if not specified. Cap at 1440 minutes (24 hours) for single-day entries.
        - action: The action to perform ("create" for new entries, "stop" for stopping an active timer).
        - endTime: The end time in ISO format, if specified (e.g., "2025-05-03T12:00:00Z"). Set to null if not mentioned.
        Return a JSON object with these fields.
        Example:
        {
          "description": "Project meeting",
          "projectName": "Sprint 5",
          "startTime": "2025-05-03T14:00:00Z",
          "duration": 90,
          "action": "create",
          "endTime": "2025-05-03T15:30:00Z"
        }
        """)
    Map<String, Object> extractTimeEntry(@UserMessage String command);
}

@Component
public class SchedulerAgent {
    private final TimeEntryExtractor extractor;
    private final AI_TimeEntryService timeEntryService;
    private final UserRepository userRepository;

    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_ZONED_DATE_TIME;

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
                ? ZonedDateTime.parse((String) details.get("startTime"), ISO_FORMATTER).toLocalDateTime()
                : LocalDateTime.now());
        timeEntry.setEndTime(details.get("endTime") != null
                ? ZonedDateTime.parse((String) details.get("endTime"), ISO_FORMATTER).toLocalDateTime()
                : null);
        timeEntry.setDuration(details.get("duration") != null
                ? Long.parseLong(details.get("duration").toString())
                : 0);
        timeEntry.setUser(user);

        String action = (String) details.get("action");
        if ("stop".equalsIgnoreCase(action)) {
            throw new IllegalStateException("Stop action requires confirmation");
        }

        return timeEntryService.createTimeEntryFromCommand(timeEntry);
    }
}