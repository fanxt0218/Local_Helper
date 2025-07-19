package com.ai.service.impl;


import com.ai.factory.MultiModelPromptRepository;
import com.ai.factory.SystemPromptFactory;
import com.ai.factory.TextualModelPromptRepository;
import com.ai.factory.ToolModelPromptRepository;
import com.ai.model.po.ChatDetail;
import com.ai.service.AIService;
import com.ai.socket.WebSocketServer;
import com.ai.utils.ModelTypeLists;
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

    @Override
    public String getSystemPrompt(String modelName) {
        //判断模型类型
        boolean isSupportToolsModel = ModelTypeLists.SupportToolsModelNames.contains(modelName);
        boolean isSupportMultiModalModel = ModelTypeLists.SupportMultiModalModelNames.contains(modelName);
        //文本非工具模型
        if (!isSupportToolsModel && !isSupportMultiModalModel){
            return new TextualModelPromptRepository().getPrompt();
        }
        //工具模型
        if (isSupportToolsModel && !isSupportMultiModalModel){
            return new ToolModelPromptRepository().getPrompt();
        }
        //多模态模型
        if (isSupportMultiModalModel){
            return new MultiModelPromptRepository().getPrompt();
        }

        return new SystemPromptFactory().getDefaultPrompt();
    }

}
