package com.ai.utils;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

@Component("ollamaHealthIndicator") // 指定 Bean 名称
public class OllamaHealthIndicator implements HealthIndicator {
    
    @Override
    public Health health() {
        // 实现 Ollama 服务健康检查逻辑
        boolean isHealthy = checkOllamaService();
        if (isHealthy) {
            return Health.up().withDetail("message", "Ollama 服务正常").build();
        } else {
            return Health.down().withDetail("error", "无法连接 Ollama 服务").build();
        }
    }

    //TODO 模型健康检查
    private boolean checkOllamaService() {
        // 实际检查逻辑，发送 HTTP 请求到 Ollama 的健康端点
        return true; // 示例返回值
    }
}
