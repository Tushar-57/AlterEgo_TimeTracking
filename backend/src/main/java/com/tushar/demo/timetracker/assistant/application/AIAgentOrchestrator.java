package com.tushar.demo.timetracker.assistant.application;

import com.tushar.demo.timetracker.assistant.domain.conversation.Conversation;
import com.tushar.demo.timetracker.assistant.domain.agent.GeneralChatAgent;
import com.tushar.demo.timetracker.service.AI_TimeEntryService;
import org.springframework.stereotype.Service;

@Service
public class AIAgentOrchestrator {

    private final GeneralChatAgent generalAgent;
    private final AI_TimeEntryService timeEntryService;

    public AIAgentOrchestrator(GeneralChatAgent generalAgent, AI_TimeEntryService timeEntryService) {
        this.generalAgent = generalAgent;
        this.timeEntryService = timeEntryService;
    }

    public Conversation handleChatRequest(String userId, String command) {
        // Check if the command is time-entry related
        if (isTimeEntryCommand(command)) {
            timeEntryService.createTimeEntryFromCommand(command);
            return new Conversation(
                java.util.UUID.randomUUID().toString(),
                userId,
                command,
                "Time entry created successfully.",
                command, 
                System.currentTimeMillis(), 
                command
            );
        }

        // Delegate to general agent for other queries
        return generalAgent.processQuery(userId, command);
    }

    private boolean isTimeEntryCommand(String command) {
        // Simple heuristic for demo; can be enhanced with NLP
        return command.toLowerCase().contains("start timer") || 
               command.toLowerCase().contains("create time entry") ||
               command.toLowerCase().contains("log time");
    }
}