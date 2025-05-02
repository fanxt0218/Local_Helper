package com.ai.service.impl;

import com.ai.service.AIService;
import com.ai.socket.WebSocketServer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.alibaba.fastjson.JSON;
import java.util.HashMap;
import java.util.Map;

@Service
public class AIServiceImpl implements AIService {

    @Autowired
    private WebSocketServer webSocketServer;

    @Override
    public void sendToUser(String message) {
        Map map = new HashMap<>();
        map.put("chat",message);
        webSocketServer.sendToAllClient(JSON.toJSONString(map));
    }
}
