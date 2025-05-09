package com.ai.controller;

import com.ai.model.vo.ChatHistoryMessage;
import com.ai.service.ChatHistoryService;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.InMemoryChatMemory;
import org.springframework.ai.chat.messages.Message;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/ai/history")
public class ChatHistoryController {

    @Autowired
    private ChatHistoryService chatHistoryService;


    //获取会话历史
    @GetMapping("/{type}")
    public List<String> getChatIds(@PathVariable("type") String type){
        return chatHistoryService.getChatIds(type);
    }

    //保存会话历史
    @PostMapping("/{type}/{chatId}")
    public void saveChatId(@PathVariable("type") String type,@PathVariable("chatId") String chatId){
        chatHistoryService.save(type, chatId);
    }




}
