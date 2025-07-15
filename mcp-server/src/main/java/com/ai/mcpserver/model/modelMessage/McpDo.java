package com.ai.mcpserver.model.modelMessage;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("mcp_settings")
public class McpDo {
    //id
    @TableId(type = IdType.AUTO)
    private Integer id;

    //服务名称
    private String name;

    //服务url
    private String url;

    //服务节点
    private String endPoint;

    //状态(0:禁用,1:启用)
    private Integer isEnable;
}
