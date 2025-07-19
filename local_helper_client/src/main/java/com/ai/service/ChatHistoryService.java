package com.ai.service;

import com.ai.model.po.Chat;
import com.ai.model.vo.ChatListVo;
import org.springframework.ai.chat.messages.Message;

import java.util.List;

public interface ChatHistoryService {

    //保存会话记录
    void save(String type, String chatId, Integer sid);

    //获取会话id列表
    List<ChatListVo> getChatIds(String type);

    //获取会话
    ChatListVo getChatId(String chatId);

    //删除会话记录
    void deleteChatId(String type, String chatId);

    //更新会话信息
    void updateChatId(ChatListVo chatListVo);

    //保存会话详情
    void saveChatDetail(String chatId, String type, Message content);
}
