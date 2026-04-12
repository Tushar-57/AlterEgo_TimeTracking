package com.tushar.demo.timetracker.assistant.infrastructure.repository;

import com.tushar.demo.timetracker.assistant.domain.conversation.Conversation;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Repository
public class ConversationRepository {

    private final Map<String, List<Conversation>> conversationsByUserId = new ConcurrentHashMap<>();

    public void save(Conversation conversation) {
        if (conversation == null || conversation.userId() == null) {
            throw new IllegalArgumentException("Conversation and userId must not be null");
        }
        conversationsByUserId
                .computeIfAbsent(conversation.userId(), k -> new CopyOnWriteArrayList<>())
                .add(conversation);
    }

    public List<Conversation> findByUserId(String userId) {
        if (userId == null) {
            return List.of();
        }
        List<Conversation> conversations = conversationsByUserId.get(userId);
        return conversations != null ? List.copyOf(conversations) : List.of();
    }
}