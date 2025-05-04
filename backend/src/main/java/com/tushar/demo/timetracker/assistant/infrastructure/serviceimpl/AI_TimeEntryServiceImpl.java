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
        String promptTemplate = """
                Extract the following details from the user's command:
                - description: The task description (e.g., "Coding").
                - projectName: The project name, if mentioned (e.g., "Project X").
                - startTime: The start time, if specified, in ISO format (e.g., "2025-05-03T10:00:00Z"). Use current time if not specified.
                - duration: The duration in minutes, if specified (e.g., 60). Set to 0 if not specified.
                
                Command: {{command}}
                
                Return a JSON object with the extracted details.
                """;
        Prompt prompt = PromptTemplate.from(promptTemplate)
                .apply(Map.of("command", command));
        String response = chatLanguageModel.chat(prompt.text());

        try {
            Map<String, Object> details = objectMapper.readValue(response, Map.class);
            TimeEntry timeEntry = new TimeEntry();
            timeEntry.setDescription((String) details.get("description"));
            timeEntry.setStartTime(details.get("startTime") != null
                    ? LocalDateTime.parse((String) details.get("startTime"))
                    : LocalDateTime.now());
            timeEntry.setDuration(details.get("duration") != null
                    ? Long.parseLong(details.get("duration").toString())
                    : 0);

            String projectName = (String) details.get("projectName");
            if (projectName != null && !projectName.isEmpty()) {
                // User lookup should be handled by the controller or service caller
                Users user = userRepository.findByEmail("current_user_email")
                        .orElseThrow(() -> new RuntimeException("User not found"));
                Project project = projectRepository.findByNameAndUser(projectName, user)
                        .orElseThrow(() -> new RuntimeException("Project not found: " + projectName));
                timeEntry.setProject(project);
            }

            return createTimeEntryFromCommand(timeEntry);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse time entry command: " + e.getMessage());
        }
    }

    @Override
    public TimeEntry createTimeEntryFromCommand(TimeEntry timeEntry) {
        if (timeEntry.getDescription() == null || timeEntry.getDescription().isEmpty()) {
            throw new IllegalArgumentException("Time entry description is required");
        }
        if (timeEntry.getStartTime() == null) {
            timeEntry.setStartTime(LocalDateTime.now());
        }
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
}