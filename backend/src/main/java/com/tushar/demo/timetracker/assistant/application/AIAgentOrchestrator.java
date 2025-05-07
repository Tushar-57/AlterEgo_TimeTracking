package com.tushar.demo.timetracker.assistant.application;

import com.tushar.demo.timetracker.assistant.domain.agent.CheckerAgent;
import com.tushar.demo.timetracker.assistant.domain.agent.GeneralChatAgent;
import com.tushar.demo.timetracker.assistant.domain.agent.Intent;
import com.tushar.demo.timetracker.assistant.domain.agent.IntentAgent;
import com.tushar.demo.timetracker.assistant.domain.agent.ProjectAgent;
import com.tushar.demo.timetracker.assistant.domain.agent.SchedulerAgent;
import com.tushar.demo.timetracker.assistant.domain.agent.AnalyticsAgent;
import com.tushar.demo.timetracker.assistant.domain.analytics.TimeSummary;
import com.tushar.demo.timetracker.model.Project;
import com.tushar.demo.timetracker.model.TimeEntry;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class AIAgentOrchestrator {

    private final IntentAgent intentAgent;
    private final SchedulerAgent schedulerAgent;
    private final ProjectAgent projectAgent;
    private final AnalyticsAgent analyticsAgent;
    private final GeneralChatAgent generalChatAgent;
    private final CheckerAgent checkerAgent;

    public AIAgentOrchestrator(
            IntentAgent intentAgent,
            SchedulerAgent schedulerAgent,
            ProjectAgent projectAgent,
            AnalyticsAgent analyticsAgent,
            GeneralChatAgent generalChatAgent,
            CheckerAgent checkerAgent) {
        this.intentAgent = intentAgent;
        this.schedulerAgent = schedulerAgent;
        this.projectAgent = projectAgent;
        this.analyticsAgent = analyticsAgent;
        this.generalChatAgent = generalChatAgent;
        this.checkerAgent = checkerAgent;
    }

    public String processCommand(String userId, String command, String tone, String archetype) {
        Intent intent = intentAgent.classifyIntent(command, ""); // Empty context for simplicity

        CheckerAgent.ValidationResult validationResult = checkerAgent.validateQuery(userId, command, intent, tone, archetype);
        if (!validationResult.isValid()) {
            String response = validationResult.getMessage();
            if (validationResult.getSuggestedAction() != null) {
                response += " Suggested action: " + formatSuggestedAction(validationResult.getSuggestedAction());
            }
            return response;
        }

        switch (intent) {
            case CREATE_TIME_ENTRY:
                TimeEntry timeEntry = schedulerAgent.processTimeEntryCommand(userId, command);
                return formatResponse("Time entry created: " + timeEntry.getDescription(), tone, archetype);
            case MANAGE_PROJECT:
                Project project = projectAgent.processProjectCommand(userId, command);
                return formatResponse("Project created: " + project.getName(), tone, archetype);
            case ANALYZE_TIME:
                TimeSummary summary = analyticsAgent.processAnalyticsCommand(command);
                return formatResponse("Time summary: " + summary.totalMinutes() + " minutes on " + summary.projectName(), tone, archetype);
            case GENERAL_CHAT:
            case UNKNOWN:
            default:
                return formatResponse(generalChatAgent.processQuery(userId, command).response(), tone, archetype);
        }
    }

    private String formatSuggestedAction(Map<String, Object> suggestedAction) {
        String action = (String) suggestedAction.get("action");
        switch (action) {
            case "createProject":
                return "Create a new project named '" + suggestedAction.get("projectName") + "'.";
            case "createTag":
                return "Create a new tag named '" + suggestedAction.get("tagName") + "'.";
            case "stopTimer":
                return "Stop the active timer (ID: " + suggestedAction.get("timerId") + ").";
            case "updateProject":
                return "Update the existing project named '" + suggestedAction.get("projectName") + "'.";
            case "adjustDuration":
                return "Adjust the duration to be within 24 hours (1440 minutes).";
            default:
                return "Resolve the issue and try again.";
        }
    }

    private String formatResponse(String baseMessage, String tone, String archetype) {
        if ("Inspirational".equalsIgnoreCase(tone) && "Guide".equalsIgnoreCase(archetype)) {
            return "You're making great progress! " + baseMessage + " Keep shining!";
        }
        return baseMessage;
    }
}