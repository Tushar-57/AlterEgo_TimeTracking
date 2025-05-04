package com.tushar.demo.timetracker.assistant.infrastructure.adapter;

import com.tushar.demo.timetracker.assistant.domain.analytics.TimeSummary;
import dev.langchain4j.service.SystemMessage;

public interface TimeSummaryExtractor {
    @SystemMessage("""
        Your role is to summarize time entry data based on the user's command.
        Extract:
        - projectName: The project name, if specified (e.g., "Project X").
        - totalMinutes: Total time spent in minutes (estimate based on command or assume 0 if unclear).
        - period: The time period (e.g., "this week", "today").
        Return a TimeSummary object.
        If projectName is not mentioned, set it to "All Projects".
        """)
    TimeSummary extractSummary(String command);
}