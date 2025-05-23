package com.ai.controller;

//import com.ai.mapper.ChatDetailMapper;
//import com.ai.mapper.ChatMapper;
import com.ai.mapper.ChatDetailMapper;
import com.ai.model.dto.ButtonStatusDto;
import com.ai.model.po.ChatDetail;
import com.ai.model.po.GetRequest;
import com.ai.model.vo.ChatDetailVo;
import com.ai.service.ChatHistoryService;
import com.ai.service.ModelMessageService;
import com.ai.utils.MessageFilter;
import com.ai.utils.MemoryStorage;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import io.modelcontextprotocol.client.McpAsyncClient;
import org.reactivestreams.Subscription;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.InMemoryChatMemory;
import org.springframework.ai.chat.messages.*;
import org.springframework.ai.mcp.AsyncMcpToolCallbackProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.util.Collections;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

import static org.springframework.ai.chat.client.advisor.AbstractChatMemoryAdvisor.CHAT_MEMORY_CONVERSATION_ID_KEY;


@Component
@RefreshScope // 添加此注解，表示热更新
//@RequiredArgsConstructor
@RestController
public class AiController {

    @Value("${spring.ai.ollama.chat.model}")
    public String modelName;
    // 用于存储每个会话的订阅关系
    private final ConcurrentHashMap<String, Subscription> activeSubscriptions = new ConcurrentHashMap<>();

    private final ChatClient chatClient;
//    private final ChatClient unSupportToolChatClient;
    ChatMemory chatMemory = new InMemoryChatMemory();
    List<McpAsyncClient> mcpASyncClients;

    @Autowired
    private ChatHistoryService  chatHistoryService;
    @Autowired
    private ChatDetailMapper chatDetailMapper;

//    需要构造器注入
    public AiController(ChatClient.Builder chatClient, List<McpAsyncClient> mcpASyncClients) {
        this.chatClient = chatClient.clone()
                .defaultAdvisors(new MessageChatMemoryAdvisor(chatMemory))
//                .defaultTools(new AsyncMcpToolCallbackProvider(mcpASyncClients))
                .build();
        this.mcpASyncClients  = mcpASyncClients;
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
            "【工具调用要求】" +
            "1. 当需要多工具协作时，你需要首先思考并构建工具的调用流程，确保A工具的输出中包含B工具的输入" +
            "2. 你可以尝试通过使用工具来帮助用户回答问题，请求时请严格按照json格式请求，如果工具响应为json格式，则进行解析" +
            "3. 当用户的问题涉及到实时性信息时，你可以尝试调用联网搜索工具" +
            "4. 对调用工具后的响应结果进行处理，处理为规范的格式和语言回复给用户" +
            "5. 当调用查询天气的工具时，如果用户未提供地理位置，你需要先调用获取地理位置的工具，再选择使用哪一个天气查询工具，不同的天气查询工具需要的参数和格式不一致，你需要严格遵守" +
            "【历史对话处理要求】" +
            "1. 若发现上一次提问只有用户提问而没有回答，这表示回答被中断" +
            "2. 遇到中断情况时：" +
            "- 不主动延续未完成内容" +
            "- 等待用户明确续问需求" +
            "- 新回答需保持独立完整性";

    public Flux<String> chat(@RequestBody GetRequest request) {
        //用户消息
        String userMessage = request.getMessage();
        //文件内容->将用户消息和文件内容进行拼接
        if (request.getFileIds() != null){
            userMessage = formatFile(request.getFileIds()) + "【用户消息】:\n"+userMessage;
        }
        //保存会话id
        chatHistoryService.save("chat",request.getChatId(),request.getSid());
        //构建提示词，用户提示词，调用模型，取出响应
        //流式响应
        // 创建响应收集器,不断加载响应内容，用于在中断时保存已生成内容
        StringBuilder assistantResponse = new StringBuilder();
        System.out.println("调用"+modelName+"模型进行响应");
        Flux<String> response;
        //如果请求中使用工具，则配置工具
        if (request.getMcpButtonStatus().equals("1")||request.getWebButtonStatus().equals("1")) {
            response = chatClient.prompt()
                    .system(System_Prompt) // 设置系统提示词
                    .user(userMessage)   // 设置用户提示词
                    .tools(new AsyncMcpToolCallbackProvider(mcpASyncClients))
                    .advisors(a -> a.param(CHAT_MEMORY_CONVERSATION_ID_KEY, request.getChatId()))  //  设置会话ID
                    .stream()        //流式响应
                    .content();  //获取响应内容
        }else {
            response = chatClient.prompt()
                    .system(System_Prompt) // 设置系统提示词
                    .user(userMessage)   // 设置用户提示词
                    .advisors(a -> a.param(CHAT_MEMORY_CONVERSATION_ID_KEY, request.getChatId()))  //  设置会话ID
                    .stream()        //流式响应
                    .content();  //获取响应内容
        }

        String finalUserMessage = userMessage;
        return response.doOnNext(assistantResponse::append) // 追加到响应收集器中
//                .doOnSubscribe(sub -> activeSubscriptions.put(request.getChatId(), sub)) // 直接存储Subscription
                .doFinally(Message->{
                    //将响应信息存储到数据库
                    String type = "assistant"; //后续寻找如何获取响应类型
                    //将用户信息保存到数据库
                    saveChatHistory(request.getChatId(),"user", finalUserMessage);
                    //将响应信息存储到数据库
                    saveChatHistory(request.getChatId(),type, assistantResponse.toString());
                });
    }

    //获取会话详情
    @GetMapping("/ai/history/{type}/{chatId}")
    public List<ChatDetailVo> getChatHistory(@PathVariable("type") String type, @PathVariable("chatId") String chatId){
//        List<Message> messages = chatMemory.get(chatId, Integer.MAX_VALUE);
//        if (messages == null){
//            return null;
//        }
//        return messages.stream().map(ChatHistoryMessage::new).toList();
        //从数据库中查询会话详情
        List<ChatDetail> chatDetails;
        LambdaQueryWrapper<ChatDetail> wrapper = new LambdaQueryWrapper<ChatDetail>().eq(ChatDetail::getChatId, chatId);
        //深度思考模型做出限制
        if (modelName.contains("deepseek")){
                wrapper
                 .orderByDesc(ChatDetail::getId)
                 .last("LIMIT 50");
            chatDetails = chatDetailMapper.selectList(wrapper);
            Collections.reverse(chatDetails);
        }else {
            chatDetails = chatDetailMapper.selectList(wrapper);
        }
        //将当前会话的信息保存到模型记忆上下文
        //清除其他会话记忆
        chatHistoryService.getChatIds(type).forEach(chat->chatMemory.clear(chat.getChatId()));
        activeSubscriptions.clear(); // 同时清理订阅关系
        System.out.println("--------》清除了模型记忆《----------");
        //加入当前会话记忆
        if (!chatDetails.isEmpty()) {
            chatDetails.forEach(c -> {
                if (c.getMessageType().equals("user")) {
                    chatMemory.add(chatId, new UserMessage(MessageFilter.filterUserMessage(c.getContent())));     //用户信息
                } else if (c.getMessageType().equals("assistant")&& !c.getContent().equals("服务繁忙,请稍后再试")) {
                    chatMemory.add(chatId, new AssistantMessage(c.getContent())); //模型回复信息
                }
            });
            System.err.println("当前模型记忆为:"+chatMemory.get(chatId,  Integer.MAX_VALUE));
        }
        return chatDetails.stream().map(c->new ChatDetailVo(c.getMessageType(),MessageFilter.filterUserMessage(c.getContent()))).toList();
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
        //删除内存记忆
        chatMemory.clear(chatId);
    }


    //将会话信息存储到数据库
    public void saveChatHistory(String chatId, String type,  String content) {
        ChatDetail chatDetail = new ChatDetail();
        chatDetail.setChatId(chatId);
        chatDetail.setMessageType(type);
        chatDetail.setContent(content);
        chatDetailMapper.insert(chatDetail);
    }


    @Autowired
    private ModelMessageService modelMessageService;


    //校验模型是否兼容工具
    @PostMapping("/ai/checkmodel/button")
    @ResponseBody
    public String checkButton(@RequestBody ButtonStatusDto buttonStatusDto){
        //先刷新状态
        modelMessageService.asyncRefreshConfig1();
        return modelMessageService.checkButton(buttonStatusDto,modelName);
    }

    @Autowired
    private MemoryStorage memoryStorage;
    public String formatFile(List<String> fileIds){
        if (fileIds == null){
            return null;
        }
        StringBuilder fileContent = new StringBuilder();
        for (String fileId : fileIds){
            String content = memoryStorage.get(fileId);
            fileContent.append(content).append("\n");
        }
        return fileContent.toString();
    }
}
