package com.tushar.demo.timetracker.assistant.domain.agent;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tushar.demo.timetracker.model.Project;
import com.tushar.demo.timetracker.model.Tags;
import com.tushar.demo.timetracker.model.TimeEntry;
import com.tushar.demo.timetracker.model.Users;
import com.tushar.demo.timetracker.repository.ProjectRepository;
import com.tushar.demo.timetracker.repository.TagsRepository;
import com.tushar.demo.timetracker.repository.UserRepository;
import com.tushar.demo.timetracker.repository.TimeEntryRepository;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.input.Prompt;
import dev.langchain4j.model.input.PromptTemplate;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
public class CheckerAgent {

    private final ChatLanguageModel chatLanguageModel;
    private final ProjectRepository projectRepository;
    private final TagsRepository tagsRepository;
    private final TimeEntryRepository timeEntryRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public CheckerAgent(
            ChatLanguageModel chatLanguageModel,
            ProjectRepository projectRepository,
            TagsRepository tagsRepository,
            TimeEntryRepository timeEntryRepository,
            UserRepository userRepository) {
        this.chatLanguageModel = chatLanguageModel;
        this.projectRepository = projectRepository;
        this.tagsRepository = tagsRepository;
        this.timeEntryRepository = timeEntryRepository;
        this.userRepository = userRepository;
        this.objectMapper = new ObjectMapper();
    }

    public static class ValidationResult {
        private final boolean isValid;
        private final String message;
        private final Map<String, Object> suggestedAction;

        public ValidationResult(boolean isValid, String message, Map<String, Object> suggestedAction) {
            this.isValid = isValid;
            this.message = message;
            this.suggestedAction = suggestedAction;
        }

        public boolean isValid() {
            return isValid;
        }

        public String getMessage() {
            return message;
        }

        public Map<String, Object> getSuggestedAction() {
            return suggestedAction;
        }
    }

    public ValidationResult validateQuery(String userId, String command, Intent intent, String tone, String archetype) {
        Users user = userRepository.findByEmail(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        switch (intent) {
            case CREATE_TIME_ENTRY:
                return validateTimeEntryCommand(user, command, tone, archetype);
            case MANAGE_PROJECT:
                return validateProjectCommand(user, command, tone, archetype);
            case ANALYZE_TIME:
                return validateAnalyticsCommand(user, command, tone, archetype);
            case SUGGEST_TASK:
            case GENERAL_CHAT:
            case UNKNOWN:
            default:
                return new ValidationResult(true, "No validation required for this intent", null);
        }
    }

    private ValidationResult validateTimeEntryCommand(Users user, String command, String tone, String archetype) {
        Map<String, Object> extracted = extractTimeEntryDetails(command);
        String projectName = (String) extracted.get("projectName");
        List<String> tagNames = (List<String>) extracted.get("tags");
        String action = (String) extracted.get("action");
        Long duration = extracted.get("duration") != null ? Long.parseLong(extracted.get("duration").toString()) : 0L;

        List<String> errors = new ArrayList<>();
        Map<String, Object> suggestedAction = new HashMap<>();

        if (projectName != null && !projectName.isEmpty()) {
            Optional<Project> project = projectRepository.findByNameAndUser(projectName, user);
            if (project.isEmpty()) {
                errors.add("Project '" + projectName + "' does not exist.");
                suggestedAction.put("action", "createProject");
                suggestedAction.put("projectName", projectName);
            }
        }

        if (tagNames != null && !tagNames.isEmpty()) {
            for (String tagName : tagNames) {
                Optional<Tags> tag = tagsRepository.findByNameAndUser(tagName, user);
                if (tag.isEmpty()) {
                    errors.add("Tag '" + tagName + "' does not exist.");
                    suggestedAction.put("action", "createTag");
                    suggestedAction.put("tagName", tagName);
                }
            }
        }

        if (duration > 1440) {
            errors.add("Duration exceeds 24 hours. Please specify a duration up to 1440 minutes.");
            suggestedAction.put("action", "adjustDuration");
            suggestedAction.put("duration", duration);
        }

        Optional<TimeEntry> activeTimer = timeEntryRepository.findByUserIdAndEndTimeIsNull(user.getId());
        if ("stop".equalsIgnoreCase(action)) {
            if (activeTimer.isEmpty()) {
                errors.add("No active timer to stop.");
            } else {
                suggestedAction.put("action", "stopTimer");
                suggestedAction.put("timerId", activeTimer.get().getId());
                return new ValidationResult(
                        false,
                        formatMessage("Please confirm: Stop the active timer for '" + activeTimer.get().getDescription() + "'?", tone, archetype),
                        suggestedAction
                );
            }
        } else if (activeTimer.isPresent()) {
            errors.add("An active timer is already running.");
            suggestedAction.put("action", "stopTimer");
            suggestedAction.put("timerId", activeTimer.get().getId());
        }

        if (errors.isEmpty()) {
            return new ValidationResult(true, "All dependencies validated successfully", null);
        } else {
            return new ValidationResult(
                    false,
                    formatMessage(String.join(" ", errors), tone, archetype),
                    suggestedAction
            );
        }
    }

    private ValidationResult validateProjectCommand(Users user, String command, String tone, String archetype) {
        String projectName = extractProjectName(command);
        if (projectName != null && !projectName.isEmpty()) {
            Optional<Project> project = projectRepository.findByNameAndUser(projectName, user);
            if (project.isPresent()) {
                return new ValidationResult(
                        false,
                        formatMessage("Project '" + projectName + "' already exists.", tone, archetype),
                        Map.of("action", "updateProject", "projectName", projectName)
                );
            }
        }
        return new ValidationResult(true, "Project creation is valid", null);
    }

    private ValidationResult validateAnalyticsCommand(Users user, String command, String tone, String archetype) {
        String projectName = extractProjectName(command);
        if (projectName != null && !projectName.isEmpty() && !projectName.equals("All Projects")) {
            Optional<Project> project = projectRepository.findByNameAndUser(projectName, user);
            if (project.isEmpty()) {
                return new ValidationResult(
                        false,
                        formatMessage("Project '" + projectName + "' does not exist for time analysis.", tone, archetype),
                        Map.of("action", "createProject", "projectName", projectName)
                );
            }
        }
        return new ValidationResult(true, "Analytics query is valid", null);
    }

    private Map<String, Object> extractTimeEntryDetails(String command) {
        String promptTemplate = """
                Extract the following details from the user's command:
                - projectName: The project name, if mentioned (e.g., "Project X"). Set to null if not mentioned.
                - tags: A list of tag names, if mentioned (e.g., ["coding", "urgent"]). Set to empty list if not mentioned.
                - action: The action to perform ("create" for new entries, "stop" for stopping an active timer).
                - duration: The duration in minutes, if specified (e.g., 60). Set to 0 if not specified.
                
                Command: {{command}}
                
                Return a JSON object with the extracted details.
                """;
        Prompt prompt = PromptTemplate.from(promptTemplate)
                .apply(Map.of("command", command));
        String response = chatLanguageModel.chat(prompt.text());
        try {
            return objectMapper.readValue(response, Map.class);
        } catch (Exception e) {
            return Map.of("projectName", null, "tags", List.of(), "action", "create", "duration", 0);
        }
    }

    private String extractProjectName(String command) {
        String promptTemplate = """
                Extract the project name from the user's command, if mentioned (e.g., "Sprint 5").
                Return the project name as a string, or null if not mentioned.
                
                Command: {{command}}
                """;
        Prompt prompt = PromptTemplate.from(promptTemplate)
                .apply(Map.of("command", command));
        String response = chatLanguageModel.chat(prompt.text());
        return response.trim().equals("null") ? null : response.trim();
    }

    private String formatMessage(String baseMessage, String tone, String archetype) {
        if ("Inspirational".equalsIgnoreCase(tone) && "Guide".equalsIgnoreCase(archetype)) {
            return "Let's keep moving forward! " + baseMessage + " You're doing great—let's resolve this together!";
        }
        return baseMessage; // Default tone
    }
}