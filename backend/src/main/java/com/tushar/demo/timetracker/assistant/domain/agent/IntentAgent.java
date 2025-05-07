package com.tushar.demo.timetracker.assistant.domain.agent;

import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.service.AiServices;
import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import dev.langchain4j.service.V;
import org.springframework.stereotype.Component;

interface IntentExtractor {
    @SystemMessage("""
        Your role is to classify the user's command into one of the following intents, considering the conversation context:
        - CREATE_TIME_ENTRY: Commands to manage time entries. Subintents:
          - Start Timer: e.g., "Start a timer for coding", "Track work now".
          - Stop Timer: e.g., "Stop the same task", "End timer".
          - Log Time Entry: e.g., "Log 2 hours for meeting", "Track work from 2pm to 4pm yesterday".
          - Edit Time Entry: e.g., "Change yesterday’s coding to 3 hours".
          - Delete Time Entry: e.g., "Delete my last timer".
        - ANALYZE_TIME: Commands to summarize time entries. Subintents:
          - Summary by Period: e.g., "How much time did I spend this week?".
          - Summary by Project: e.g., "Show my hours on Project X".
          - Summary by Tag: e.g., "How much time on urgent tasks?".
        - MANAGE_PROJECT: Commands to manage projects/tags. Subintents:
          - Create Project: e.g., "Create a project named Sprint 5".
          - Update Project: e.g., "Update project X client to Tushar".
          - Delete Project: e.g., "Delete project Y".
          - Create Tag: e.g., "Add tag urgent".
          - Update Tag: e.g., "Change tag urgent to critical".
          - Delete Tag: e.g., "Remove tag urgent".
        - LIST_PROJECTS: Commands to list projects/tags. Subintents:
          - List All Projects: e.g., "What are all of my projects?".
          - List All Tags: e.g., "Show my tags".
        - SUGGEST_TASK: Commands requesting task suggestions. Subintents:
          - Suggest Task by Goal: e.g., "What should I work on next?".
          - Suggest Task by Schedule: e.g., "What can I do this afternoon?".
        - GENERAL_CHAT: General conversation. Subintents:
          - Motivational Chat: e.g., "How am I doing?".
          - Onboarding Info: e.g., "Who are you?".
        - UNKNOWN: Unclear commands. Subintents:
          - Incomplete Command: e.g., "Start timer".
          - Misspelled Command: e.g., "Creat projct".

        Context: {{context}}
        Command: {{command}}

        Prioritize CREATE_TIME_ENTRY for commands involving timers, then MANAGE_PROJECT. Use context to resolve ambiguity (e.g., recent timer creation implies stop). Return the intent as an enum value.
        """)
    Intent classifyIntent(@UserMessage String command, @V("context") String context);
}

@Component
public class IntentAgent {
    private final IntentExtractor extractor;

    public IntentAgent(ChatLanguageModel chatLanguageModel) {
        this.extractor = AiServices.create(IntentExtractor.class, chatLanguageModel);
    }

    public Intent classifyIntent(String command, String context) {
        return extractor.classifyIntent(command, context);
    }
}