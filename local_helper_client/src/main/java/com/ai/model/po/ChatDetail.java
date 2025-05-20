package com.ai.model.po;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("chatdetail")
public class ChatDetail {

    //会话详情id
    @TableId(type = IdType.AUTO)
    private String id;

    //会话id
    private String chatId;

    //内容类型
    private String messageType;

    //内容
    private String content;
}
