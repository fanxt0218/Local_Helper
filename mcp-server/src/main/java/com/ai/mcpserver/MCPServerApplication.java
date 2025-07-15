package com.ai.mcpserver;

import com.ai.mcpserver.tools.*;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.ai.tool.ToolCallback;
import org.springframework.ai.tool.ToolCallbackProvider;
import org.springframework.ai.tool.method.MethodToolCallbackProvider;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.ComponentScans;

import java.util.List;

@SpringBootApplication
@MapperScan("com.ai.mapper")
public class MCPServerApplication {
    public static void main(String[] args) {
        org.springframework.boot.SpringApplication.run(MCPServerApplication.class, args);
    }

    @Bean
    public ToolCallbackProvider getToolCallbacks(
            ToolsService toolsService,
            WebSearchTool webSearchTool,
            WeatherTool weatherTool,
            LocationTool locationTool,
            SystemTool systemTool,
            ModelMessageTool modelMessageTool){
        return MethodToolCallbackProvider.builder().toolObjects(toolsService,weatherTool,locationTool,systemTool,modelMessageTool).build();
    }
}
