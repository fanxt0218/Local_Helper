package com.ai.controller;

import com.ai.model.po.GetRequest;
import com.ai.model.vo.ChatHistoryMessage;
import com.ai.service.ChatHistoryService;
import org.reactivestreams.Subscription;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.InMemoryChatMemory;
import org.springframework.ai.chat.messages.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.*;
import reactor.core.Disposable;
import reactor.core.publisher.Flux;
import reactor.core.publisher.SignalType;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Flow;

import static org.springframework.ai.chat.client.advisor.AbstractChatMemoryAdvisor.CHAT_MEMORY_CONVERSATION_ID_KEY;


@Component
@RefreshScope // 添加此注解，表示热更新
//@RequiredArgsConstructor
@RestController
public class AiController {

    @Value("${spring.ai.ollama.chat.model}")
    private String modelName;
    // 用于存储每个会话的订阅关系
    private final ConcurrentHashMap<String, Subscription> activeSubscriptions = new ConcurrentHashMap<>();


    ChatClient chatClient;
    ChatMemory chatMemory = new InMemoryChatMemory();

    @Autowired
    private ChatHistoryService  chatHistoryService;

//    需要构造器注入
    public AiController(ChatClient.Builder chatClient) {
        this.chatClient = chatClient
                .defaultAdvisors(new MessageChatMemoryAdvisor(chatMemory))
                .build();
    }

    String System_Prompt =
            "你是一个AI助手，善于帮助用户回答问题，你需要按照以下要求进行响应" +
            "【响应格式】" +
            "1. 根据回答的内容，在合适的位置进行换行，保证格式的美观" +
            "2. 以简体中文进行回答" +
            "3. 在不得输出无意义的标签或符号" +
            "4. 避免Markdown格式" +
            "5. 流式响应时保持语义连贯" +
            "【响应内容】" +
            "1. 严格按照用户的问题进行输出，不得回答不相关的问题" +
            "2. 禁止输出乱码内容，保证输出内容的合理性、合法性，符合常规语言的构成" +
            "3. 如果用户以中文进行提问，在正常对话中请保持中文回复,需要用到其他语言场景时除外" +
            "【历史对话处理要求】" +
            "1. 若发现上一条回答标记了[INTERRUPTED]，表示回答被中断" +
            "2. 遇到中断标记时：" +
            "- 不主动延续未完成内容" +
            "- 等待用户明确续问需求" +
            "- 新回答需保持独立完整性";

    public Flux<String> chat(@RequestBody GetRequest request) {
        //用户消息
        String userMessage = request.getMessage();
        //保存会话id
        chatHistoryService.save("chat",request.getChatId());
        //构建提示词，用户提示词，调用模型，取出响应
        //流式响应
        // 创建响应收集器,不断加载响应内容，用于在中断时保存已生成内容
        StringBuilder assistantResponse = new StringBuilder();
        System.out.println("调用"+modelName+"模型进行响应");
        Flux<String> response = chatClient.prompt()
                .system(System_Prompt) // 设置系统提示词
                .user(userMessage)   // 设置用户提示词
                .advisors(a -> a.param(CHAT_MEMORY_CONVERSATION_ID_KEY,request.getChatId()))  //  设置会话ID
                .stream()        //流式响应
                .content();  //获取响应内容
//                .doOnNext(assistantResponse::append) // 追加到响应收集器中
//                .doOnSubscribe(sub -> activeSubscriptions.put(request.getChatId(), sub)) // 直接存储Subscription
//                .doFinally(signal -> {
//                    // 无论是否中断都保存已生成内容
//                    if (!assistantResponse.isEmpty()) {
//                        boolean isInterrupted = signal == SignalType.CANCEL;
//
//                        Message message = new AssistantMessage(
//                                assistantResponse.toString(),
//                                Map.of(CHAT_MEMORY_CONVERSATION_ID_KEY, request.getChatId(),
//                                        "INTERRUPTED", isInterrupted  //中断标记
//                                )
//                        );
//                        chatMemory.add(request.getChatId(), message); // 手动保存到记忆
//                    }
//                    activeSubscriptions.remove(request.getChatId());
//                });
        return response;
    }

    //获取会话详情
    @GetMapping("/ai/history/{type}/{chatId}")
    public List<ChatHistoryMessage> getChatHistory(@PathVariable("type") String type, @PathVariable("chatId") String chatId){
        //TODO 临时写法，被中断的内容直接清除，后续考虑如何保存到 chatMemory
        List<Message> messages = chatMemory.get(chatId, Integer.MAX_VALUE);
        if (messages == null){
            return null;
        }
        return messages.stream().map(ChatHistoryMessage::new).toList();
    }

    @PostMapping("/ai/stopresponse/{currentChatId}")
    public void stopResponse(@PathVariable String currentChatId){
        Subscription subscription = activeSubscriptions.get(currentChatId);
        if (subscription != null) {
            subscription.cancel(); // 终止流式响应
            System.out.println("已终止流式响应:"+currentChatId);
        }
    }
    /*中断信号存储：使用ConcurrentHashMap存储chatId与Disposable的映射
      订阅管理：
      doOnSubscribe：捕获订阅对象
      doFinally：确保资源清理
      线程安全：使用ConcurrentHashMap保证多线程安全
      [ 前端 ] -- 发送中断请求 --> [ /ai/stopresponse/{chatId} ]
                           ↓
      [ Controller ] --> 查找Subscription → 执行cancel()
                                 ↓
      [ Flux流 ] -- 接收cancel信号 → 终止数据流
    */

    // 删除会话
    @DeleteMapping("/ai/deleteChatId/{type}/{chatId}")
    public void deleteChatId(@PathVariable("type") String type,@PathVariable("chatId") String chatId){
        //删除会话历史
        chatHistoryService.deleteChatId(type, chatId);
        System.out.println("删除会话id:"+chatId);
        //删除会话详情
        chatMemory.clear(chatId);
        System.out.println("删除会话详情:"+chatId);
    }


}
