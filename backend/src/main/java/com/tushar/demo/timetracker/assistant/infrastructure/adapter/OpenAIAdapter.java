package com.tushar.demo.timetracker.assistant.infrastructure.adapter;

import dev.langchain4j.model.chat.ChatLanguageModel;
import org.springframework.stereotype.Component;

@Component
public class OpenAIAdapter {

    private final ChatLanguageModel chatModel;

    public OpenAIAdapter(ChatLanguageModel chatModel) {
        this.chatModel = chatModel;
    }

    public String generateResponse(String prompt) {
        return chatModel.chat(prompt);
    }
}