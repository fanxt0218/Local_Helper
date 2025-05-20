package com.ai.model.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ChatListVo {
    //会话id
    private String chatId;
    //会话名称
    private String chatName;
    //会话创建时间
    private LocalDateTime createTime;
    //模型名称
    private String modelName;
}
