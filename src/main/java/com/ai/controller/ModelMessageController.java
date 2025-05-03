package com.ai.controller;

import com.ai.model.po.Model;
import com.ai.service.ModelMessageService;
import com.ai.utils.ModelList;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Controller
@RequestMapping("/ai")
public class ModelMessageController {

    @Value("${spring.ai.ollama.chat.model}")
    private String modelName;

    @Autowired
    private ObjectMapper mapper;

    @Autowired
    private ModelMessageService modelMessageService;

    //获取模型名称
    @GetMapping("/getmodelname")
    @ResponseBody
    public String getModelName() {
        Map<String, String> map = new HashMap<>();
        map.put("modelName", modelName);
        String modelName = null;
        try {
            modelName = mapper.writeValueAsString(map);
        }catch (Exception e){
            throw new RuntimeException("获取模型名称失败");
        }
        return modelName;
    }

    //获取模型列表
    @GetMapping("/getmodellist")
    @ResponseBody
    public String getModelList() {
        String models = null;
        try {
            models = mapper.writeValueAsString(ModelList.getModels());
            System.out.println("当前模型列表:"+models);
        }catch (Exception e){
            throw new RuntimeException("获取模型列表失败");
        }
        return models;
    }


    @Value("${spring.config.location:classpath}")
    private Resource configResource;

    //切换模型
    @PostMapping("/switchmodel")
    @ResponseBody
    public ResponseEntity<String> updateModel(@RequestBody Model model) throws IOException {
        if (model == null || model.getModelName().equals(modelName)){
            return ResponseEntity.ok("");
        }
        // 修改配置文件
        // 获取项目根目录路径
        Path configPath = Paths.get(
                System.getProperty("user.dir"),
                "config",
                "application.properties"
        ).normalize().toAbsolutePath();
        System.out.println("操作配置文件路径：" + configPath);
        // 如果外部配置文件不存在则创建
        if (!Files.exists(configPath)) {
            Files.createDirectories(configPath.getParent());
            try (InputStream inputStream = getClass().getClassLoader().getResourceAsStream("application.properties");) {
                Files.copy(inputStream, configPath);
            }
        }

        List<String> lines = Files.readAllLines(configPath);

        lines = lines.stream()
                .map(line -> line.startsWith("spring.ai.ollama.chat.model") ?
                        "spring.ai.ollama.chat.model=" + model.getModelName() : line)
                .collect(Collectors.toList());

        Files.write(configPath, lines);

        List<String> writtenLines = Files.readAllLines(configPath);
        System.out.println("写入后的文件内容：" + writtenLines);
        //执行刷新
        modelMessageService.asyncRefreshConfig();
        return ResponseEntity.ok("切换成功");
    }

}
