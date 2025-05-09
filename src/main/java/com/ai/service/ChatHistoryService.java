package com.ai.service;

import java.util.List;

public interface ChatHistoryService {

    //保存会话记录
    void save(String type, String chatId);

    //获取会话id列表
    List<String> getChatIds(String type);

    //删除会话记录
    void deleteChatId(String type, String chatId);

}
