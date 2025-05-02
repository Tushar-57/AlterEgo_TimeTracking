package com.tushar.demo.timetracker.assistant.domain.conversation;

public record Conversation(
    String id,
    String userId,
    String sender,
    String message,
    String response,
    long timestamp, 
    String additionalContent
) {}
