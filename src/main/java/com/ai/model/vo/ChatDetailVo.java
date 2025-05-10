package com.ai.model.vo;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ChatDetailVo {

    //会话类型
    private String messageType;
    //消息内容
    private String content;

    public ChatDetailVo(String messageType, String content) {
        this.messageType = messageType;
        this.content = content;
    }
}
