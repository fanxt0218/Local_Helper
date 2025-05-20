package com.ai.controller;

import com.ai.model.dto.ButtonStatusDto;
import com.ai.model.po.Model;
import com.ai.service.ModelMessageService;
import com.ai.utils.ModelList;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.core.env.Environment;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.io.BufferedWriter;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Controller
@RequestMapping("/ai")
public class ModelMessageController {

    @Value("${spring.ai.ollama.chat.model}")
    private String modelName;

    @Autowired
    private Environment env;  // 获取实时配置文件

    @Autowired
    private ObjectMapper mapper;   // json转换

    @Autowired
    private ModelMessageService modelMessageService;  // 模型服务层
    @Autowired
    private AiController aiController;

    //获取模型名称
    @GetMapping("/getmodelname")
    @ResponseBody
    public String getModelName() {
        Map<String, String> map = new HashMap<>();
        String modelName = env.getProperty("spring.ai.ollama.chat.model");
        map.put("modelName",modelName);
        System.out.println("模型名称："+modelName);
        String model = null;
        try {
            model = mapper.writeValueAsString(map);
            System.out.println("当前模型名称:"+modelName);
        }catch (Exception e){
            throw new RuntimeException("获取模型名称失败");
        }
        return model;
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


    @Value("${my.config.path}")
    private String configPathStr;

    //切换模型
    @PostMapping("/switchmodel")
    @ResponseBody
    public String updateModel(@RequestBody Model model) throws IOException {
        System.out.println("执行到修改模型方法");
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
            try (InputStream inputStream = getClass().getClassLoader().getResourceAsStream("application.properties");) {
                Files.copy(inputStream, configPath);
            }
        }

        //读取配置文件
        List<String> lines = Files.readAllLines(configPath);

        lines = lines.stream()
                .map(line -> line.startsWith("spring.ai.ollama.chat.model") ?
                        "spring.ai.ollama.chat.model=" + model.getModelName() : line)
                .collect(Collectors.toList());

        //写入配置文件
        try (BufferedWriter writer = Files.newBufferedWriter(configPath)) {
            writer.write(String.join("\n", lines));
        }

        List<String> writtenLines = Files.readAllLines(configPath);
        System.out.println("新的配置信息:" + writtenLines);
        //执行刷新
        modelMessageService.asyncRefreshConfig1();
        //更改工具配置
//        aiController.updateToolConfig(model.getModelName());
        return "切换成功";
    }

}
