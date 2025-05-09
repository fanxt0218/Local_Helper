package com.ai.service.impl;

import com.ai.service.ChatHistoryService;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class InMemoryChatHistoryServiceImpl implements ChatHistoryService {

    //会话列表
    private final Map<String, List<String>> chatHistory = new HashMap<>();

    @Override
    public void save(String type, String chatId) {
        //如果会话列表中没有这个会话类型，则创建一个空的列表
        if (!chatHistory.containsKey(type)){
            chatHistory.put(type,new ArrayList<>());
        }
        List<String> chatIds = chatHistory.get(type);
        //如果会话列表中已经存在这个会话ID，则不进行添加
        if (chatIds.contains(chatId)){
            return;
        }
        chatIds.add(chatId);
    }

    @Override
    public List<String> getChatIds(String type) {
        return chatHistory.getOrDefault(type, new ArrayList<>());
    }

    @Override
    public void deleteChatId(String type, String chatId) {
        if (chatHistory.containsKey(type)){
            List<String> chatIds = chatHistory.get(type);
            if (chatIds.isEmpty()) {
                chatHistory.remove(type);
            }
            chatIds.remove(chatId);
        }

    }
}
