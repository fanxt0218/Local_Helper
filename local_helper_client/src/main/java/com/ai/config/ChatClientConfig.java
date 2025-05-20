package com.ai.config;

import io.modelcontextprotocol.client.McpAsyncClient;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.InMemoryChatMemory;
import org.springframework.ai.mcp.AsyncMcpToolCallbackProvider;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class ChatClientConfig {

//    @Bean
//    @Qualifier("toolEnabledClient")
//    public ChatClient toolEnabledClient(
//            ChatClient.Builder builder,
//            List<McpAsyncClient> mcpAsyncClients
//    ) {
//        return builder
//                .defaultAdvisors(new MessageChatMemoryAdvisor(new InMemoryChatMemory()))
//                .defaultTools(new AsyncMcpToolCallbackProvider(mcpAsyncClients))
//                .build();
//    }
//
//    @Bean
//    @Qualifier("toolDisabledClient")
//    public ChatClient toolDisabledClient(
//            ChatClient.Builder builder
//    ) {
//        return builder
//                .defaultAdvisors(new MessageChatMemoryAdvisor(new InMemoryChatMemory()))
//                .build();
//    }
}