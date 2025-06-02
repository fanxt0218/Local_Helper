package com.ai.service;

import com.ai.model.po.McpDo;
import com.ai.model.po.Settings;

import java.io.IOException;
import java.util.List;

public interface SettingsService {

    Settings  getSettings();

    void updateSettings(Settings settings) throws IOException;

    List<McpDo> getMcp();

    String addMcp(McpDo mcpDo) throws IOException;

    void mcpStatus(McpDo mcpDo) throws IOException;

    void deleteMcp(McpDo mcpDo) throws IOException;
}
