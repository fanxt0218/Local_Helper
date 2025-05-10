package com.ai.service;

import com.ai.model.vo.ChatListVo;

import java.util.List;

public interface ChatHistoryService {

    //保存会话记录
    void save(String type, String chatId, Integer sid);

    //获取会话id列表
    List<ChatListVo> getChatIds(String type);

    //删除会话记录
    void deleteChatId(String type, String chatId);

}
