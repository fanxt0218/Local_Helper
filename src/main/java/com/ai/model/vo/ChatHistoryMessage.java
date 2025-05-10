package com.ai.model.vo;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.ai.chat.messages.Message;

@Data
@NoArgsConstructor
public class ChatHistoryMessage {

    private String role;

    private String content;

    //通过构造渲染对话消息
    public ChatHistoryMessage(Message message) {
        switch (message.getMessageType()){
            case USER:
                role = "user";
                break;
            case ASSISTANT:
                role = "assistant";
                break;
            default:
                role = "";
                break;
        }
        this.role = role;
        this.content = message.getText();
    }
}
