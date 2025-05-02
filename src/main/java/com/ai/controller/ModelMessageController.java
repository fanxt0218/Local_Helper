package com.ai.controller;

import com.alibaba.fastjson.JSON;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Controller
@RequestMapping("/ai")
public class ModelMessageController {

    @Value("${spring.ai.ollama.chat.model}")
    private String modelName;

    //获取模型名称
    @GetMapping("/getmodelname")
    @ResponseBody
    public String getModelName() {
        Map<String, String> map = new HashMap<>();
        map.put("modelName", modelName);
        return JSON.toJSONString(map);
    }

}
