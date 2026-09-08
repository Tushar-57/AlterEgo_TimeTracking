package com.tushar.demo.timetracker.assistant.infrastructure.serviceimpl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tushar.demo.timetracker.assistant.infrastructure.service.AI_TimeEntryService;
import com.tushar.demo.timetracker.model.Project;
import com.tushar.demo.timetracker.model.TimeEntry;
import com.tushar.demo.timetracker.model.Users;
import com.tushar.demo.timetracker.repository.ProjectRepository;
import com.tushar.demo.timetracker.repository.TimeEntryRepository;
import com.tushar.demo.timetracker.repository.UserRepository;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.input.Prompt;
import dev.langchain4j.model.input.PromptTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZonedDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;

@Service
public class AI_TimeEntryServiceImpl implements AI_TimeEntryService {

    private final ChatLanguageModel chatLanguageModel;
    private final TimeEntryRepository timeEntryRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public AI_TimeEntryServiceImpl(
            ChatLanguageModel chatLanguageModel,
            TimeEntryRepository timeEntryRepository,
            ProjectRepository projectRepository,
            UserRepository userRepository) {
        this.chatLanguageModel = chatLanguageModel;
        this.timeEntryRepository = timeEntryRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public TimeEntry createTimeEntryFromCommand(String command) {
        throw new UnsupportedOperationException("Use createTimeEntryFromCommand(String command, Users user) instead");
    }

    public TimeEntry createTimeEntryFromCommand(String command, Users user) {
        if (user == null || user.getEmail() == null) {
            throw new IllegalArgumentException("User must be provided and have a valid email");
        }

        String promptTemplate = """
                Extract the following details from the user's command:
                - description: The task description (e.g., "Coding").
                - projectName: The project name, if mentioned (e.g., "Project X").
                - startTime: The start time, if specified, in ISO-8601 local format WITHOUT a timezone (e.g., "2025-05-03T10:00:00"). Omit if not specified.
                - duration: The duration in minutes, if specified (e.g., 60). Omit if not specified.

                Command: {{command}}

                Return ONLY a raw JSON object with the extracted details, no markdown, no commentary.
                """;
        Prompt prompt = PromptTemplate.from(promptTemplate)
                .apply(Map.of("command", command));
        String response = chatLanguageModel.chat(prompt.text());

        try {
            Map<String, Object> details = objectMapper.readValue(stripToJson(response), Map.class);

            String description = asTrimmedString(details.get("description"));
            if (description == null) {
                throw new IllegalArgumentException("Could not determine a task description from the command");
            }

            TimeEntry timeEntry = new TimeEntry();
            // Own the entry — an AI-created entry with a null user_id never shows up
            // in the user's history and silently vanishes.
            timeEntry.setUser(user);
            timeEntry.setDescription(description);

            LocalDateTime startTime = parseFlexibleDateTime(details.get("startTime"));
            if (startTime == null) {
                startTime = LocalDateTime.now();
            }
            timeEntry.setStartTime(startTime);

            Long durationMinutes = parseDurationMinutes(details.get("duration"));
            if (durationMinutes != null && durationMinutes > 0) {
                // Materialise a completed entry. Without an endTime the row looks
                // like a running timer and blocks the user from starting a new one.
                timeEntry.setEndTime(startTime.plusMinutes(durationMinutes));
            }
            timeEntry.setIsActive(timeEntry.getEndTime() == null);

            String projectName = asTrimmedString(details.get("projectName"));
            if (projectName != null) {
                Project project = projectRepository.findByNameAndUser(projectName, user)
                        .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectName));
                timeEntry.setProject(project);
            }

            return createTimeEntryFromCommand(timeEntry);
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse time entry command: " + e.getMessage(), e);
        }
    }

    @Override
    public TimeEntry createTimeEntryFromCommand(TimeEntry timeEntry) {
        if (timeEntry.getDescription() == null || timeEntry.getDescription().isBlank()) {
            throw new IllegalArgumentException("Time entry description is required");
        }
        if (timeEntry.getUser() == null) {
            throw new IllegalArgumentException("Time entry must be associated with a user");
        }
        if (timeEntry.getStartTime() == null) {
            timeEntry.setStartTime(LocalDateTime.now());
        }
        if (timeEntry.getEndTime() != null && !timeEntry.getEndTime().isAfter(timeEntry.getStartTime())) {
            throw new IllegalArgumentException("Time entry end time must be after start time");
        }
        timeEntry.setIsActive(timeEntry.getEndTime() == null);
        return timeEntryRepository.save(timeEntry);
    }

    @Override
    public String chat(String message) {
        return chatLanguageModel.chat(message);
    }

    @Override
    public List<String> getDescriptionSuggestions(String query, Authentication authentication) {
        // Implement suggestion logic if needed
        return List.of();
    }

    /**
     * LLMs frequently wrap JSON in ```json fences or add a sentence before/after.
     * Pull out the first {...} block so Jackson has a fighting chance.
     */
    private String stripToJson(String raw) {
        if (raw == null) {
            return "{}";
        }
        String trimmed = raw.trim();
        int firstBrace = trimmed.indexOf('{');
        int lastBrace = trimmed.lastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace) {
            return trimmed.substring(firstBrace, lastBrace + 1);
        }
        return trimmed;
    }

    private String asTrimmedString(Object value) {
        if (value == null) {
            return null;
        }
        String text = String.valueOf(value).trim();
        return text.isEmpty() ? null : text;
    }

    private Long parseDurationMinutes(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return number.longValue();
        }
        try {
            return Long.parseLong(String.valueOf(value).trim());
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    /**
     * Accepts a bare local date-time ("2025-05-03T10:00:00"), or one carrying a
     * "Z" / offset / zone ("2025-05-03T10:00:00Z"). Plain LocalDateTime.parse
     * blows up on anything with a zone, which is exactly what the old prompt
     * asked the model to produce.
     */
    private LocalDateTime parseFlexibleDateTime(Object value) {
        String text = asTrimmedString(value);
        if (text == null) {
            return null;
        }
        try {
            return LocalDateTime.parse(text);
        } catch (DateTimeParseException ignored) {
            // fall through
        }
        try {
            return OffsetDateTime.parse(text).toLocalDateTime();
        } catch (DateTimeParseException ignored) {
            // fall through
        }
        try {
            return ZonedDateTime.parse(text).toLocalDateTime();
        } catch (DateTimeParseException ignored) {
            return null;
        }
    }
}
