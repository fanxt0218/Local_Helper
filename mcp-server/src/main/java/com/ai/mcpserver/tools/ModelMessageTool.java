package com.ai.mcpserver.tools;

import com.ai.mapper.McpDoMapper;
import com.ai.mapper.SettingsMapper;
import com.ai.model.po.McpDo;
import com.ai.model.po.SettingDO;
import com.ai.service.SettingsService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ModelMessageTool {

    @Autowired
    private SettingsMapper settingsMapper;
    @Autowired
    private McpDoMapper mcpDoMapper;
    @Autowired
    private ObjectMapper objectMapper;

    @Tool(description = "获取当前大模型配置信息")
    public String getModelConfig() throws JsonProcessingException {
        //查询数据库获取模型参数信息
        List<SettingDO> settingList = settingsMapper.selectList(null);
        return objectMapper.writeValueAsString(settingList);
    }

    @Tool(description = "获取MCP服务信息")
    public String getMcpServerInfo() throws JsonProcessingException {
        //查询数据库获取模型参数信息
        List<McpDo> mcpList = mcpDoMapper.selectList(null);
        return objectMapper.writeValueAsString(mcpList);
    }
}
