package com.tushar.demo.timetracker.assistant.domain.agent;

import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.service.AiServices;
import dev.langchain4j.service.SystemMessage;
import org.springframework.stereotype.Component;

interface IntentExtractor {
    @SystemMessage("""
        Your role is to classify the user's command into one of the following intents:
        - CREATE_TIME_ENTRY: Commands to start, stop, or log a time entry (e.g., "Start a timer for coding", "Stop the same task", "Log 2 hours for meeting").
        - ANALYZE_TIME: Commands to summarize or analyze time entries (e.g., "How much time did I spend this week?").
        - MANAGE_PROJECT: Commands to create or manage projects/tags (e.g., "Create a project named Sprint 5").
        - LIST_PROJECTS: Commands to list all projects (e.g., "What are all of my projects?", "Tell me my projects").
        - SUGGEST_TASK: Commands requesting task or tag suggestions (e.g., "What should I work on next?").
        - GENERAL_CHAT: General conversation (e.g., "How are you?").
        - UNKNOWN: Unclear or unrelated commands.
        Return the intent as an enum value.
        """)
    Intent classifyIntent(String command);
}

@Component
public class IntentAgent {
    private final IntentExtractor extractor;

    public IntentAgent(ChatLanguageModel chatLanguageModel) {
        this.extractor = AiServices.create(IntentExtractor.class, chatLanguageModel);
    }

    public Intent classifyIntent(String command) {
        return extractor.classifyIntent(command);
    }
}