package com.tushar.demo.timetracker.assistant.domain.analytics;

public record TimeSummary(
        String projectName,
        int totalMinutes,
        String period
) {}