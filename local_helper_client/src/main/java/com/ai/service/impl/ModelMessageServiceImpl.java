package com.ai.service.impl;

import com.ai.config.ActuatorConfig;
import com.ai.model.dto.ButtonStatusDto;
import com.ai.service.ModelMessageService;
import com.ai.utils.ModelTypeLists;
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

import java.util.ArrayList;
import java.util.List;
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

    // 异步刷新：
    @Autowired
    private ContextRefresher contextRefresher;

    //刷新配置
    public void asyncRefreshConfig1() {
        CompletableFuture.runAsync(() -> {
            contextRefresher.refresh();
        }, Executors.newCachedThreadPool()); // 使用独立线程池

    }


    @Override
    public String checkButton(ButtonStatusDto buttonStatusDto,String modelName) {
        //按钮状态
        String deepThinkButtonStatus = buttonStatusDto.getDeepThinkButtonStatus();
        String webButtonStatus = buttonStatusDto.getWebButtonStatus();
        String mcpButtonStatus = buttonStatusDto.getMcpButtonStatus();
        //判断是否支持工具
        if (webButtonStatus.equals("1") || mcpButtonStatus.equals("1")) {
            if (!ModelTypeLists.SupportToolsModelNames.contains(modelName.split(":")[0])){
                return webButtonStatus.equals("1") ? "该模型不支持联网搜索" : "该模型不支持工具调用";
            }
        }
        return "OK";
    }

    @Override
    public Boolean checkMultiModal(String modelName) {
        for (String e : ModelTypeLists.SupportMultiModalModelNames){
            if (modelName.contains(e)){
                return true;
            }
        }
        return false;
    }

}
