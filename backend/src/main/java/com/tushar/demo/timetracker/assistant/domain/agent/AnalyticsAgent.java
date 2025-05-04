package com.tushar.demo.timetracker.assistant.domain.agent;

import com.tushar.demo.timetracker.assistant.domain.analytics.TimeSummary;
import com.tushar.demo.timetracker.assistant.infrastructure.adapter.TimeSummaryExtractor;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.service.AiServices;
import org.springframework.stereotype.Component;

@Component
public class AnalyticsAgent {
    private final TimeSummaryExtractor extractor;

    public AnalyticsAgent(ChatLanguageModel chatLanguageModel) {
        this.extractor = AiServices.create(TimeSummaryExtractor.class, chatLanguageModel);
    }

    public TimeSummary processAnalyticsCommand(String command) {
        return extractor.extractSummary(command);
    }
}