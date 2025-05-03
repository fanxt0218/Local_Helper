package com.ai.service.impl;

import com.ai.config.ActuatorConfig;
import com.ai.service.ModelMessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.boot.actuate.health.Status;
import org.springframework.cloud.context.refresh.ContextRefresher;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executors;

@Service
public class ModelMessageServiceImpl implements ModelMessageService {

    @Autowired
    private RestTemplate actuatorRestTemplate;

    @Autowired
    private ActuatorConfig actuatorConfig;

    @Autowired
    @Qualifier("ollamaHealthIndicator") // 匹配自定义组件的名称
    private HealthIndicator ollamaHealthIndicator;


    @Override
    @Async
    public void asyncRefreshConfig() {
        try {
            // 添加请求头
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<String> request = new HttpEntity<>(null, headers); // 空请求体

            ResponseEntity<String> response = actuatorRestTemplate.postForEntity(
                    actuatorConfig.getRefreshUrl(), request, String.class);
            System.out.println("异步刷新结果：" + response.getBody());
            // 添加健康检查
            Health health = ollamaHealthIndicator.health();
            if (health.getStatus() != Status.UP) {
                System.err.println("配置刷新后模型不可用: " + health.getDetails());
            }
            asyncRefreshConfig1();
        } catch (Exception e) {
            System.err.println("刷新配置失败：" + e.getMessage());
        }
    }

    // 在ModelMessageService中实现：
    @Autowired
    private ContextRefresher contextRefresher;

    public void asyncRefreshConfig1() {
        CompletableFuture.runAsync(() -> {
            contextRefresher.refresh();
        }, Executors.newCachedThreadPool()); // 使用独立线程池

    }

}
