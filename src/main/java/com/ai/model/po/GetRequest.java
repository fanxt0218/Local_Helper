package com.ai.model.po;

import lombok.Data;

@Data
public class GetRequest {

    //消息
    private String message;

    //用户id
    private String sid;

    //会话id
    private String chatId;
}
