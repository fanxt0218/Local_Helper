package com.ai.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.context.annotation.Configuration;

@RefreshScope
@Configuration
public class OllamaConfig {

    @Value("${spring.ai.ollama.chat.model}")
    private String model;

    // Getter/业务逻辑代码
}