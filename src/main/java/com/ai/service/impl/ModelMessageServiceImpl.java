package com.ai.service.impl;

import com.ai.config.ActuatorConfig;
import com.ai.service.ModelMessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class ModelMessageServiceImpl implements ModelMessageService {

    @Autowired
    private RestTemplate actuatorRestTemplate;

    @Autowired
    private ActuatorConfig actuatorConfig;

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
        } catch (Exception e) {
            System.err.println("刷新配置失败：" + e.getMessage());
        }
    }
}
