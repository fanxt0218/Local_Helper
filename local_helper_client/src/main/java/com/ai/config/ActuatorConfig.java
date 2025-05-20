package com.ai.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class ActuatorConfig {
    @Value("${server.port:8080}")
    private int serverPort;

    // 创建RestTemplate Bean
    @Bean
    public RestTemplate actuatorRestTemplate() {
        return new RestTemplate();
    }

    // 获取刷新URL
    public String getRefreshUrl() {
        return "http://localhost:" + serverPort + "/actuator/refresh";
    }
}
