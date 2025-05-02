package com.tushar.demo.timetracker.assistant.infrastructure.repository;

import com.tushar.demo.timetracker.assistant.domain.conversation.Conversation;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

@Repository
public class ConversationRepository {

    private final List<Conversation> conversations = new ArrayList<>();

    public void save(Conversation conversation) {
        conversations.add(conversation);
    }

    public List<Conversation> findByUserId(String userId) {
        return conversations.stream()
                .filter(c -> c.userId().equals(userId))
                .toList();
    }
}