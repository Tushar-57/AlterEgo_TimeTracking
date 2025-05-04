package com.tushar.demo.timetracker.assistant.domain.agent;

import com.tushar.demo.timetracker.assistant.domain.analytics.TimeSummary;
import com.tushar.demo.timetracker.assistant.domain.conversation.Conversation;
import com.tushar.demo.timetracker.assistant.infrastructure.repository.ConversationRepository;
import com.tushar.demo.timetracker.model.Project;
import com.tushar.demo.timetracker.model.TimeEntry;
import com.tushar.demo.timetracker.model.Users;
import com.tushar.demo.timetracker.repository.ProjectRepository;
import com.tushar.demo.timetracker.repository.UserRepository;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.input.Prompt;
import dev.langchain4j.model.input.PromptTemplate;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class AgentSociety {

    private final ChatLanguageModel chatLanguageModel;
    private final ConversationRepository conversationRepository;
    private final IntentAgent intentAgent;
    private final SchedulerAgent schedulerAgent;
    private final ProjectAgent projectAgent;
    private final AnalyticsAgent analyticsAgent;
    private final GeneralChatAgent generalChatAgent;
    private final CheckerAgent checkerAgent;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public AgentSociety(
            ChatLanguageModel chatLanguageModel,
            ConversationRepository conversationRepository,
            IntentAgent intentAgent,
            SchedulerAgent schedulerAgent,
            ProjectAgent projectAgent,
            AnalyticsAgent analyticsAgent,
            GeneralChatAgent generalChatAgent,
            CheckerAgent checkerAgent,
            ProjectRepository projectRepository,
            UserRepository userRepository) {
        this.chatLanguageModel = chatLanguageModel;
        this.conversationRepository = conversationRepository;
        this.intentAgent = intentAgent;
        this.schedulerAgent = schedulerAgent;
        this.projectAgent = projectAgent;
        this.analyticsAgent = analyticsAgent;
        this.generalChatAgent = generalChatAgent;
        this.checkerAgent = checkerAgent;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
    }

    public Conversation processCommand(String userId, String command, String tone, String archetype) {
        Intent intent = intentAgent.classifyIntent(command);

        CheckerAgent.ValidationResult validationResult = checkerAgent.validateQuery(userId, command, intent, tone, archetype);
        if (!validationResult.isValid()) {
            Map<String, Object> suggestedAction = validationResult.getSuggestedAction();
            Conversation conversation = new Conversation(
                    UUID.randomUUID().toString(),
                    userId,
                    command,
                    validationResult.getMessage(),
                    intent.name(),
                    Instant.now().toEpochMilli(),
                    command,
                    suggestedAction != null && !suggestedAction.isEmpty(),
                    suggestedAction
            );
            conversationRepository.save(conversation);
            return conversation;
        }

        String context = buildConversationContext(userId);
        String response;

        switch (intent) {
            case CREATE_TIME_ENTRY:
                TimeEntry timeEntry = schedulerAgent.processTimeEntryCommand(userId, command);
                response = formatTimeEntryResponse(timeEntry, tone, archetype);
                break;
            case MANAGE_PROJECT:
                Project project = projectAgent.processProjectCommand(userId, command);
                response = formatProjectResponse(project, tone, archetype);
                break;
            case LIST_PROJECTS:
                Users user = userRepository.findByEmail(userId)
                        .orElseThrow(() -> new RuntimeException("User not found: " + userId));
                List<Project> projects = projectRepository.findByUser(user);
                response = formatProjectListResponse(projects, tone, archetype);
                break;
            case ANALYZE_TIME:
                TimeSummary summary = analyticsAgent.processAnalyticsCommand(command);
                response = formatAnalyticsResponse(summary, tone, archetype);
                break;
            case GENERAL_CHAT:
            case UNKNOWN:
            default:
                response = processGeneralChat(userId, command, context, tone, archetype);
                intent = Intent.GENERAL_CHAT;
                break;
        }

        Conversation conversation = new Conversation(
                UUID.randomUUID().toString(),
                userId,
                command,
                response,
                intent.name(),
                Instant.now().toEpochMilli(),
                command
        );
        conversationRepository.save(conversation);

        return conversation;
    }

    private String buildConversationContext(String userId) {
        return conversationRepository.findByUserId(userId)
                .stream()
                .limit(5)
                .map(c -> "User: " + c.query() + "\nAssistant: " + c.response())
                .reduce((a, b) -> a + "\n" + b)
                .orElse("");
    }

    private String processGeneralChat(String userId, String command, String context, String tone, String archetype) {
        String promptTemplate = """
                You are a helpful assistant with an {{tone}} tone, acting as a {{archetype}}. Use the following conversation history for context:
                {{context}}
                
                User command: {{command}}
                
                Provide a concise and relevant response, staying in character. For time-tracking queries, suggest actions like creating time entries or reviewing projects.
                """;
        Prompt prompt = PromptTemplate.from(promptTemplate)
                .apply(Map.of("context", context, "command", command, "tone", tone, "archetype", archetype));
        String response = chatLanguageModel.chat(prompt.text());
        return formatMessage(response, tone, archetype, 1);
    }

    private String formatTimeEntryResponse(TimeEntry timeEntry, String tone, String archetype) {
        String baseMessage = String.format(
                "Time entry created: %s for project %s, started at %s, duration %d minutes",
                timeEntry.getDescription(),
                timeEntry.getProject() != null ? timeEntry.getProject().getName() : "None",
                timeEntry.getStartTime(),
                timeEntry.getDuration()
        );
        return formatMessage(baseMessage, tone, archetype, 2);
    }

    private String formatProjectResponse(Project project, String tone, String archetype) {
        String baseMessage = String.format(
                "Project created: %s (Description: %s)",
                project.getName(),
                project.getClient() != null ? project.getClient() : "None"
        );
        return formatMessage(baseMessage, tone, archetype, 3);
    }

    private String formatProjectListResponse(List<Project> projects, String tone, String archetype) {
        String baseMessage;
        if (projects.isEmpty()) {
            baseMessage = "You don't have any projects yet. Ready to create one to kickstart your journey?";
        } else {
            baseMessage = "Here are your projects:\n" + projects.stream()
                    .map(p -> "- " + p.getName() + " (Client: " + (p.getClient() != null ? p.getClient() : "None") + ")")
                    .collect(Collectors.joining("\n"));
        }
        return formatMessage(baseMessage, tone, archetype, 4);
    }

    private String formatAnalyticsResponse(TimeSummary summary, String tone, String archetype) {
        String baseMessage = String.format(
                "Time summary for %s: %d minutes spent on %s",
                summary.period(),
                summary.totalMinutes(),
                summary.projectName()
        );
        return formatMessage(baseMessage, tone, archetype, 5);
    }

    private String formatMessage(String baseMessage, String tone, String archetype, int variant) {
        if ("Inspirational".equalsIgnoreCase(tone) && "Guide".equalsIgnoreCase(archetype)) {
            String[] prefixes = {
                    "You're blazing a trail!",
                    "Your momentum is unstoppable!",
                    "You're crushing it!",
                    "Keep pushing the boundaries!",
                    "Your progress is inspiring!"
            };
            String[] suffixes = {
                    "Keep shining bright!",
                    "Stay on this incredible path!",
                    "You're destined for greatness!",
                    "Keep soaring to new heights!",
                    "Your journey is amazing!"
            };
            return prefixes[variant % prefixes.length] + " " + baseMessage + " " + suffixes[variant % suffixes.length];
        }
        return baseMessage;
    }
}