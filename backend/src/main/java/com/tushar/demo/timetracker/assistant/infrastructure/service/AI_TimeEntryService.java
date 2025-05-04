package com.tushar.demo.timetracker.assistant.infrastructure.service;

import com.tushar.demo.timetracker.model.TimeEntry;
import org.springframework.security.core.Authentication;

import java.util.List;

public interface AI_TimeEntryService {
    TimeEntry createTimeEntryFromCommand(String command);
    TimeEntry createTimeEntryFromCommand(TimeEntry timeEntry);
    String chat(String message);
    List<String> getDescriptionSuggestions(String query, Authentication authentication);
}