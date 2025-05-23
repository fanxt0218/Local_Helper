package com.ai.model.po;

import lombok.Data;

import java.util.List;

@Data
public class GetRequest {

    //消息
    private String message;

    //用户id
    private Integer sid;

    //会话id
    private String chatId;

    //  深度思考按钮状态
    private String deepThinkButtonStatus;

    //  联网搜索按钮状态
    private String webButtonStatus;

    //  MCP按钮状态
    private String mcpButtonStatus;

    //文件列表
    private List<String> fileIds;

}
