package com.ai.service.impl;

import com.ai.mapper.McpDoMapper;
import com.ai.mapper.SettingsMapper;
import com.ai.model.po.*;
import com.ai.service.ModelMessageService;
import com.ai.service.SettingsService;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.BufferedWriter;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class SettingsServiceImpl implements SettingsService {

    @Value("${my.config.path}")
    private String configPathStr;

    @Autowired
    private SettingsMapper  settingsMapper;
    @Autowired
    private McpDoMapper mcpDoMapper;
    @Autowired
    private ModelMessageService  modelMessageService;
    @Autowired
    private ObjectMapper objectMapper;

    @Override
    public Settings getSettings() {
        // 1. 获取所有设置项（单次查询）
        List<SettingDO> allSettings = settingsMapper.selectList(
                new LambdaQueryWrapper<SettingDO>()
                        .orderByDesc(SettingDO::getSettingGroup)
        );

        // 2. 按分组名称进行内存分组
        Map<String, List<SettingDO>> groupedMap = allSettings.stream()
                .collect(Collectors.groupingBy(SettingDO::getSettingGroup));

        // 3. 构建返回结构
        List<GroupSettings> groupSettingsList = groupedMap.entrySet().stream()
                .map(entry -> new GroupSettings(
                        entry.getKey(), // 分组名称
                        entry.getValue().stream()
                                .map(setting -> new Item(
                                        setting.getItem(), // item → itemName
                                        setting.getValue() // value → value
                                ))
                                .collect(Collectors.toList())
                ))
                .collect(Collectors.toList());

        // 4. 包装最终结果
        Settings settings = new Settings();
        settings.setGroupSettings(groupSettingsList);
        return settings;
    }

    @Override
    public void updateSettings(Settings settings) throws IOException {
        //更新数据库
        //设置分类列表
        List<GroupSettings> groupSettings = settings.getGroupSettings();
        List<SettingDO> settingDOS = new ArrayList<>();  //记录更新项
        for (GroupSettings groupSetting : groupSettings) {
            //分类名称
            String groupName = groupSetting.getSettingGroup();
            //每个分类项
            for (Item item : groupSetting.getItems()) {
                String itemName = item.getItemName();
                String value = item.getValue();
                //更新设置项
                SettingDO settingDO = new SettingDO();
                settingDO.setSettingGroup(groupName);
                settingDO.setItem(itemName);
                settingDO.setValue(value);
                settingsMapper.update(settingDO, new LambdaQueryWrapper<SettingDO>().eq(SettingDO::getSettingGroup, groupName).eq(SettingDO::getItem, itemName));
                if (settingDO.getItem().equals("系统提示词")){continue;} // 跳过系统提示词
                settingDOS.add(settingDO);
            }
        }
        //更新配置
        updateApplicationConfig(settingDOS);
    }

    @Override
    public List<McpDo> getMcp() {
        return mcpDoMapper.selectList(null);
    }

    @Override
    public String addMcp(McpDo mcpDo) throws IOException {
        HashMap<String, Object> result = new HashMap<>();

        //判断是否已存在相同或同名的MCP服务
        if ( mcpDoMapper.selectCount(new LambdaQueryWrapper<McpDo>().eq(McpDo::getName, mcpDo.getName())) > 0){
            result.put( "code",400);
            result.put( "message","名称不能重复");
            return objectMapper.writeValueAsString(result);
        }
        if (mcpDoMapper.selectCount(new LambdaQueryWrapper<McpDo>().eq(McpDo::getUrl, mcpDo.getUrl()).eq(McpDo::getEndPoint, mcpDo.getEndPoint())) > 0){
            result.put( "code",400);
            result.put("message","sse不能重复");
            return objectMapper.writeValueAsString(result);
        }
        //系统默认补全/sse的情况
        if (mcpDo.getEndPoint().isEmpty() && mcpDoMapper.selectCount( new LambdaQueryWrapper<McpDo>().eq(McpDo::getUrl, mcpDo.getUrl()).eq(McpDo::getEndPoint, "/sse"))>0){
            result.put( "code",400);
            result.put("message","不填写endpoint情况下。系统默认补全/sse，请注意避免sse重复");
        }
         if (mcpDo.getEndPoint().equals("/sse") && mcpDoMapper.selectCount( new LambdaQueryWrapper<McpDo>().eq(McpDo::getUrl, mcpDo.getUrl()).eq(McpDo::getEndPoint, null))>0){
            result.put( "code",400);
            result.put("message","endpoint为“/sse”的情况下，会与相同url但未手动填写endpoint的sse产生冲突，请注意避免sse重复");
        }
        mcpDoMapper.insert(mcpDo);
        //向配置文件添加MCP服务，默认注释掉
        addMCPServer(mcpDo);

        result.put( "code",200);
        result.put( "message","添加成功");
        return objectMapper.writeValueAsString(result);
    }

    @Override
    public void mcpStatus(McpDo mcpDo) throws IOException {
        mcpDoMapper.updateById(mcpDo);
        //根据状态修改MCP服务配置文件
        updateMCPServer( mcpDo);
    }

    @Override
    public void deleteMcp(McpDo mcpDo) throws IOException {
        if (mcpDo.getId() == null){
            return;
        }
        McpDo mcpDo1 = mcpDoMapper.selectById(mcpDo.getId());
        mcpDoMapper.deleteById(mcpDo);
        //删除配置文件中的MCP服务
        deleteMcpServer(mcpDo1);
    }


    // 修改配置文件,
    // 加锁确保线程安全
    synchronized public void updateApplicationConfig(List<SettingDO> settingDOS) throws IOException {
        System.out.println("执行到修改配置方法");
        // 修改配置文件
        // 获取项目根目录路径
        Path configPath = Paths.get(
                configPathStr,
                "application.properties"
        ).normalize().toAbsolutePath();
        System.out.println("操作配置文件路径：" + configPath);
        // 如果外部配置文件不存在则创建
        if (!Files.exists(configPath)) {
            Files.createDirectories(configPath.getParent());
            try (InputStream inputStream = getClass().getClassLoader().getResourceAsStream("application.properties")) {
                Files.copy(inputStream, configPath);
            }
        }

        //读取配置文件
        List<String> lines = Files.readAllLines(configPath);

        for (SettingDO settingDO : settingDOS) {
            String itemName = settingDO.getItem();
            if (settingDO.getSettingGroup().equals("通用设置")){continue;}
            String preConfigStr = settingDO.getSettingGroup().equals("模型设置")?"spring.ai.ollama.chat.options.":"spring.ai.ollama.";
            //判断设置名称，转换为对应的配置项
            String endConfigStr = switch (itemName) {
                case "温度" -> "temperature";
                case "最大生成长度" -> "max-tokens";
                case "top-p" -> "top-p";
                case "top-k" -> "top-k";
                case "Ollama服务地址" -> "base-url";
                default -> throw new RuntimeException("未知的设置项");
            };
            lines = lines.stream()
                    .map(line -> line.startsWith(preConfigStr+endConfigStr) ?
                            preConfigStr+endConfigStr+"=" + settingDO.getValue() : line)
                    .collect(Collectors.toList());
        }
        //写入配置文件
        try (BufferedWriter writer = Files.newBufferedWriter(configPath)) {
            writer.write(String.join("\n", lines));
        }

        List<String> writtenLines = Files.readAllLines(configPath);
        System.out.println("新的配置信息:" + writtenLines);
        //执行刷新
        modelMessageService.asyncRefreshConfig1();
    }

    public void addMCPServer(McpDo mcpDo) throws IOException {
        System.out.println("执行到添加MCP服务方法");
        // 修改配置文件
        // 获取项目根目录路径
        Path configPath = Paths.get(
                configPathStr,
                "application.properties"
        ).normalize().toAbsolutePath();
        System.out.println("操作配置文件路径：" + configPath);
        // 如果外部配置文件不存在则创建
        if (!Files.exists(configPath)) {
            Files.createDirectories(configPath.getParent());
            try (InputStream inputStream = getClass().getClassLoader().getResourceAsStream("application.properties")) {
                Files.copy(inputStream, configPath);
            }
        }

        //读取配置文件
        List<String> lines = Files.readAllLines(configPath);

        //添加 MCP服务
        String newMcpUrl = "# spring.ai.mcp.client.sse.connections."+mcpDo.getName()+".url="+mcpDo.getUrl();
        String newMcpEndpoint = "# spring.ai.mcp.client.sse.connections."+mcpDo.getName()+".sse-endpoint="+mcpDo.getEndPoint();
        lines.add(newMcpUrl);
        if (!mcpDo.getEndPoint().isBlank()){
             lines.add(newMcpEndpoint);
        }

        //写入配置文件
        try (BufferedWriter writer = Files.newBufferedWriter(configPath)) {
            writer.write(String.join("\n", lines));
        }

        List<String> writtenLines = Files.readAllLines(configPath);
        System.out.println("新的配置信息:" + writtenLines);
        //执行刷新
        modelMessageService.asyncRefreshConfig1();
    }

    public void updateMCPServer(McpDo mcpDo) throws IOException {
        System.out.println("执行到启用/禁用MCP服务方法");
        // 修改配置文件
        // 获取项目根目录路径
        Path configPath = Paths.get(
                configPathStr,
                "application.properties"
        ).normalize().toAbsolutePath();
        System.out.println("操作配置文件路径：" + configPath);
        // 如果外部配置文件不存在则创建
        if (!Files.exists(configPath)) {
            Files.createDirectories(configPath.getParent());
            try (InputStream inputStream = getClass().getClassLoader().getResourceAsStream("application.properties")) {
                Files.copy(inputStream, configPath);
            }
        }

        //读取配置文件
        List<String> lines = Files.readAllLines(configPath);
        //配置前缀
        String preConfigStr = "spring.ai.mcp.client.sse.connections.";
        //判断启用或禁用
        if ( mcpDo.getIsEnable() == 1) {
            //启用
            lines = lines.stream().map(line -> line.contains(preConfigStr + mcpDo.getName()+".") ?
                    line.split("#")[1].trim() : line).collect(Collectors.toList());
        }else{
            //禁用
            for (int i = 0; i < lines.size(); i++) {
                String line = lines.get(i);
                if (line.contains(preConfigStr + mcpDo.getName()+".")) {
                    if (line.startsWith("#")) {
                        lines.set(i, "# " + line.substring(1).trim());
                    } else {
                        lines.set(i, "# " + line);
                    }
                }
            }

            }

        //写入配置文件
        try (BufferedWriter writer = Files.newBufferedWriter(configPath)) {
            writer.write(String.join("\n", lines));
        }

        List<String> writtenLines = Files.readAllLines(configPath);
        System.out.println("新的配置信息:" + writtenLines);
        //执行刷新
        modelMessageService.asyncRefreshConfig1();
    }

    //删除MCP服务器于配置文件
     public void deleteMcpServer(McpDo mcpDo) throws IOException {
         System.out.println("执行到删除MCP服务方法");
         // 修改配置文件
         // 获取项目根目录路径
         Path configPath = Paths.get(
                 configPathStr,
                 "application.properties"
         ).normalize().toAbsolutePath();
         System.out.println("操作配置文件路径：" + configPath);
         // 如果外部配置文件不存在则创建
         if (!Files.exists(configPath)) {
             Files.createDirectories(configPath.getParent());
             try (InputStream inputStream = getClass().getClassLoader().getResourceAsStream("application.properties")) {
                 Files.copy(inputStream, configPath);
             }
         }

         //读取配置文件
         List<String> lines = Files.readAllLines(configPath);
         //配置前缀
         String preConfigStr = "spring.ai.mcp.client.sse.connections.";
         //删除逻辑
         lines = lines.stream().filter(line -> !line.contains(preConfigStr + mcpDo.getName()+".")).collect(Collectors.toList());

         //写入配置文件
         try (BufferedWriter writer = Files.newBufferedWriter(configPath)) {
             writer.write(String.join("\n", lines));
         }

         List<String> writtenLines = Files.readAllLines(configPath);
         System.out.println("新的配置信息:" + writtenLines);
         //执行刷新
         modelMessageService.asyncRefreshConfig1();
     }
}
