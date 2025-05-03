package com.ai.controller;

import com.ai.model.po.GetRequest;
import com.ai.service.AIService;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.ollama.api.OllamaApi;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.context.annotation.Lazy;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

@Component
@RefreshScope // 添加此注解
public class AiController {

    @Value("${spring.ai.ollama.chat.model}")
    private String modelName;

    ChatClient chatClient;

    //需要构造器注入
    public AiController(ChatClient.Builder chatClient) {
        this.chatClient = chatClient.build();
    }

    String System_Prompt =
            "你是一个AI助手，善于帮助用户回答问题，你需要按照以下要求进行响应" +
            "【响应格式】" +
            "1. 根据回答的内容，在合适的位置进行换行，也就是输出换行符\\n" +
            "2. 以简体中文进行回答" +
            "3. 在不得输出无意义的标签或符号" +
            "4. 避免Markdown格式" +
            "5. 流式响应时保持语义连贯" +
            "【响应内容】" +
            "1. 严格按照用户的问题进行输出，不得回答不相关的问题" +
            "2. 禁止输出乱码内容，保证输出内容的合理性、合法性，符合常规语言的构成";

    public Flux<String> chat(@RequestBody GetRequest request) {
        //用户消息
        String message = request.getMessage();
        //构建提示词，用户提示词，调用模型，取出响应

        //流式响应
        System.out.println("调用"+modelName+"模型进行响应");
        Flux<String> response = chatClient.prompt()
                .system(System_Prompt) // 设置系统提示词
                .user(message)   // 设置用户提示词
                .stream()        //流式响应
                .content();  //获取响应内容
        return response;
    }
}
