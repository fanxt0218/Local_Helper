package com.ai.controller;

import com.ai.model.po.McpDo;
import com.ai.model.po.Settings;
import com.ai.service.SettingsService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;

@RestController
@RequestMapping("/ai/settings")
public class SettingsController {

    @Autowired
    private SettingsService settingsService;
    @Autowired
    private ObjectMapper  objectMapper;

    //获取设置信息
    @GetMapping("/getsettings")
    public Settings getSettings() {
        return settingsService.getSettings();
    }

    //更新设置信息
    @PostMapping("/updatesettings")
    public void updateSettings(@RequestBody Settings settings) throws IOException {
        settingsService.updateSettings(settings);
    }

    //获取MCP服务器信息
    @GetMapping("/getmcp")
    public List<McpDo> getMcp() {
        return settingsService.getMcp();
    }

    //添加MCP服务器信息
    @PostMapping("/addmcp")
    public String addMcp(@RequestBody McpDo mcpDo) throws JsonProcessingException {
        settingsService.addMcp(mcpDo);
        return objectMapper.writeValueAsString(new HashMap<Integer,String>().put(200,"添加成功"));
    }

    //启用/禁用MCP服务器
    @PostMapping("/mcpstatus")
    public String mcpStatus(@RequestBody McpDo mcpDo) throws IOException {
        settingsService.mcpStatus(mcpDo);
        return objectMapper.writeValueAsString(new HashMap<Integer,String>().put(200,"添加成功"));
    }

    //删除MCP服务器
    @DeleteMapping("/deletemcp")
    public String deleteMcp(@RequestParam Integer id) throws IOException {
        McpDo mcpDo = new McpDo();
        mcpDo.setId(id);
        settingsService.deleteMcp(mcpDo);
        return objectMapper.writeValueAsString(new HashMap<Integer,String>().put(200,"删除成功"));
    }
}
