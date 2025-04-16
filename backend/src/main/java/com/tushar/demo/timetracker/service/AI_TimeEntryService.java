package com.tushar.demo.timetracker.service;

import java.util.List;

import org.springframework.security.core.Authentication;

import com.tushar.demo.timetracker.model.TimeEntry;
import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import dev.langchain4j.service.spring.AiService;

@AiService
public interface AI_TimeEntryService {
	
    @SystemMessage("""
        You are a time tracking assistant. Convert user commands into time entries.
        Extract the following fields from natural language:
        - taskDescription (required)
        - startTime (ISO 8601 format)
        - endTime (ISO 8601 format)
        - category (optional)
        - tags (up to 3 keywords)
        
        Example format:
        {
          "taskDescription": "Project meeting",
          "startTime": "2024-02-20T14:00:00",
          "endTime": "2024-02-20T15:30:00",
          "category": "meeting",
          "tags": ["project", "planning"]
        }
        """)
    @UserMessage("""
        Convert the following time entry command:
        {{command}}
        
        Respond ONLY with valid JSON matching the TimeEntry class structure.
        """)
    TimeEntry createTimeEntryFromCommand(String command);

    
    @SystemMessage("You are a polite time tracking assistant.")
    String chat(String message);


	List<String> getDescriptionSuggestions(String query, Authentication authentication);
}