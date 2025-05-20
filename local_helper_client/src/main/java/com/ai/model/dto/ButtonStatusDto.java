package com.ai.model.dto;

import lombok.Data;

@Data
public class ButtonStatusDto {

    //  深度思考按钮状态
    private String deepThinkButtonStatus;

    //  联网搜索按钮状态
    private String webButtonStatus;

    //  MCP按钮状态
    private String mcpButtonStatus;

}
