package com.tushar.demo.timetracker.assistant.domain.conversation;

import java.util.Map;

public record Conversation(
        String id,
        String userId,
        String query,
        String response,
        String intent,
        long timestamp,
        String originalQuery,
        boolean requiresAction,
        Map<String, Object> actionDetails
) {
    public Conversation(
            String id,
            String userId,
            String query,
            String response,
            String intent,
            long timestamp,
            String originalQuery
    ) {
        this(id, userId, query, response, intent, timestamp, originalQuery, false, null);
    }
}