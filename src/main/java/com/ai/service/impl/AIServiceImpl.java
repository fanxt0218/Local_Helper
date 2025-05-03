package com.ai.service.impl;

import com.ai.service.AIService;
import com.ai.socket.WebSocketServer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class AIServiceImpl implements AIService {

    @Autowired // 直接注入Spring管理的ObjectMapper（线程安全）
    private ObjectMapper objectMapper;

    @Autowired
    private WebSocketServer webSocketServer;

    @Override
    public void sendToUser(String message) {
        Map map = new HashMap<>();
        map.put("chat",message);
        try {
            webSocketServer.sendToAllClient(objectMapper.writeValueAsString(map));
        } catch (JsonProcessingException e) {
            System.err.println("JSON序列化失败: " + e);
        }
    }
}
