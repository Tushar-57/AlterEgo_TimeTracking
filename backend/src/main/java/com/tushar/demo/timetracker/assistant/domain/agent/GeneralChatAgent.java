package com.tushar.demo.timetracker.assistant.domain.agent;

import com.tushar.demo.timetracker.assistant.domain.conversation.Conversation;
import com.tushar.demo.timetracker.assistant.infrastructure.repository.ConversationRepository;
import dev.langchain4j.model.chat.ChatLanguageModel;
import org.springframework.stereotype.Component;

@Component
public class GeneralChatAgent {

    private final ChatLanguageModel chatModel;
    private final ConversationRepository conversationRepository;

    public GeneralChatAgent(ChatLanguageModel chatModel, ConversationRepository conversationRepository) {
        this.chatModel = chatModel;
        this.conversationRepository = conversationRepository;
    }

    public Conversation processQuery(String userId, String query) {
        String prompt = """
            You are a helpful assistant for a time tracking application. Your role is to assist users with general queries about time tracking, such as creating time entries, managing projects, or understanding their schedules. Respond concisely and professionally.
            User query: %s
            Provide a clear and relevant response.
            """.formatted(query);

        String response = chatModel.chat(prompt);
        
        Conversation conversation = new Conversation(
            generateId(),
            userId,
            query,
            response,
            response,
            System.currentTimeMillis(),
            response
        );

        conversationRepository.save(conversation);
        
        return conversation;
    }

    private String generateId() {
        return java.util.UUID.randomUUID().toString();
    }
}