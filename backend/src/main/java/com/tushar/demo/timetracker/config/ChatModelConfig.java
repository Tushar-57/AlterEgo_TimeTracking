package com.tushar.demo.timetracker.config;

import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.model.openai.OpenAiChatModelName;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import dev.langchain4j.http.client.jdk.JdkHttpClientBuilder;

@Configuration
public class ChatModelConfig {

    @Value("${openai.api.key}")
    private String openAiApiKey;

    @Bean
    public ChatLanguageModel chatLanguageModel() {
        return OpenAiChatModel.builder()
                .apiKey(openAiApiKey)
                .httpClientBuilder(new JdkHttpClientBuilder())
                .modelName(OpenAiChatModelName.GPT_3_5_TURBO_16K)
                .build();
    }
}