package com.ai.controller;

import com.ai.mapper.ChatDetailMapper;
import com.ai.mapper.SettingsMapper;
import com.ai.model.dto.ButtonStatusDto;
import com.ai.model.po.*;
import com.ai.model.vo.ChatDetailVo;
import com.ai.model.vo.ChatListVo;
import com.ai.service.AIService;
import com.ai.service.ChatHistoryService;
import com.ai.service.ModelMessageService;
import com.ai.utils.MemoryFilter;
import com.ai.utils.MessageFilter;
import com.ai.utils.MemoryStorage;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import io.modelcontextprotocol.client.McpAsyncClient;
import org.apache.poi.ss.formula.functions.T;
import org.reactivestreams.Subscription;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.ChatClientResponse;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.ai.chat.messages.*;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.Generation;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.content.Media;
import org.springframework.ai.mcp.AsyncMcpToolCallbackProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import org.springframework.util.MimeTypeUtils;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

//import static org.springframework.ai.chat.client.advisor.AbstractChatMemoryAdvisor.CHAT_MEMORY_CONVERSATION_ID_KEY;

@Component
@RefreshScope // 添加此注解，表示热更新
//@RequiredArgsConstructor
@RestController
public class AiController {

    @Value("${spring.ai.ollama.chat.model}")
    public String modelName;
    // 用于存储每个会话的订阅关系
    private final ConcurrentHashMap<String, Subscription> activeSubscriptions = new ConcurrentHashMap<>();

    private  ChatClient chatClient;
    private  List<McpAsyncClient> mcpASyncClients;
    private  ChatMemory chatMemory = MessageWindowChatMemory.builder().maxMessages(50).build();

    public AiController(ChatClient.Builder chatClient, List<McpAsyncClient> mcpASyncClients) {
        this.chatClient = chatClient
                .defaultAdvisors(MessageChatMemoryAdvisor.builder(chatMemory).build())
                .build();
        this.mcpASyncClients = mcpASyncClients;
    }

    @Autowired
    private ChatHistoryService  chatHistoryService;
    @Autowired
    private ChatDetailMapper chatDetailMapper;
    @Autowired
    private SettingsMapper settingsMapper;
    @Autowired
    private AIService aiService;

//    需要构造器注入
//    public AiController(ChatClient.Builder chatClient, List<McpAsyncClient> mcpASyncClients) {
//        this.chatClient = chatClient
//                .defaultAdvisors()
//                .defaultTools(new AsyncMcpToolCallbackProvider(mcpASyncClients))
//                .build();
//        this.mcpASyncClients  = mcpASyncClients;
//    }

    public Flux<String> chat(@RequestBody GetRequest request) {
        //用户消息
        String userMessage = request.getMessage();
        //系统提示词
        String System_Prompt = aiService.getSystemPrompt(modelName);
        //是否开启深度思考
        if (!request.getDeepThinkButtonStatus().equals("1")){
            userMessage = userMessage + "/no_think";       //暂时硬编码，等待Spring AI更新支持配置
            System_Prompt = "【重要】不要输出<think>等思考标签，省略思考过程，直接进行响应" + System_Prompt;
        }
        //文件内容->将用户消息和文件内容进行拼接
        if (request.getFileIds() != null){
            userMessage = formatFile(request.getFileIds()) + "【用户消息】:\n"+userMessage;
        }
        String defaultPrompt = settingsMapper.selectOne(new LambdaQueryWrapper<>(SettingDO.class).eq(SettingDO::getItem, "系统提示词")).getValue();
        if (!defaultPrompt.isBlank()){
            System_Prompt = defaultPrompt + System_Prompt;
        }
        //保存会话id
        chatHistoryService.save("chat",request.getChatId(),request.getSid());
        //构建提示词，用户提示词，调用模型，取出响应
        //流式响应
        // 创建响应收集器,不断加载响应内容，用于在中断时保存已生成内容
        StringBuilder assistantResponse = new StringBuilder();
        System.out.println("调用"+modelName+"模型进行响应");
        //更新会话模型名称
        ChatListVo chatVo = chatHistoryService.getChatId(request.getChatId());
        if (!chatVo.getModelName().equals(modelName)){
            chatVo.setModelName(modelName);
            chatHistoryService.updateChatId(chatVo);
        }
        Flux<String> response;
        //多模态文件
        Prompt multiModalFile = new Prompt();
        //检查模型是否支持多模态
        if (checkMultiModal(modelName)){
            multiModalFile = getMultiModalFile(request.getFileIds());
        }
        //如果请求中使用工具，则配置工具
        if (request.getMcpButtonStatus().equals("1")||request.getWebButtonStatus().equals("1")) {
            response = chatClient.prompt(multiModalFile)
                    .system(System_Prompt) // 设置系统提示词
                    .user(userMessage)   // 设置用户提示词
                    .toolCallbacks(new AsyncMcpToolCallbackProvider(mcpASyncClients))
                    .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, request.getChatId()))  //  设置会话ID
                    .stream() //流式响应
                    .content();  //获取响应内容
        }else {
            response = chatClient.prompt(multiModalFile)
                    .system(System_Prompt) // 设置系统提示词
                    .user(userMessage)   // 设置用户提示词
                    .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, request.getChatId()))  //  设置会话ID
                    .stream()        //流式响应
                    .content();  //获取响应内容
        }
//        System.err.println("----------------》模型的记忆《----------------------\n"+chatMemory.get(request.getChatId()));

        String finalUserMessage = userMessage;
        return response.doOnNext(assistantResponse::append) // 追加到响应收集器中
//                .doOnSubscribe(sub -> activeSubscriptions.put(request.getChatId(), sub)) // 直接存储Subscription
                .doFinally(Message->{
                    //TODO 从响应中获取AssistantMessage以及ToolResponseMessage并存储
                    //将响应信息存储到数据库
                    String type = "assistant"; //后续寻找如何获取响应类型
                    //将用户信息保存到数据库
                    saveChatHistory(request.getChatId(),"user", new UserMessage(finalUserMessage));
                    //将响应信息存储到数据库
//                    saveChatHistory(request.getChatId(),type, new AssistantMessage(assistantResponse.toString()));
//                    List<ToolResponseMessage> toolMessage = chatMemory.get(request.getChatId()).stream().filter(message -> message.getMessageType().equals(MessageType.TOOL)).filter(message -> message instanceof ToolResponseMessage).map(message -> (ToolResponseMessage)message).toList();
//                    saveChatHistory(request.getChatId(),"tool", toolMessage);
//                    Flux<AssistantMessage> assistantMessageFlux = chatClient.prompt().stream().chatClientResponse().map(chatClientResponse -> chatClientResponse.chatResponse().getResult().getOutput());
//                    assistantMessageFlux.collectList();
                });
    }

    //获取会话详情
    @GetMapping("/ai/history/{type}/{chatId}")
    public List<ChatDetailVo> getChatHistory(@PathVariable("type") String type, @PathVariable("chatId") String chatId){
        //从数据库中查询会话详情
        List<ChatDetail> chatDetails;
        LambdaQueryWrapper<ChatDetail> wrapper = new LambdaQueryWrapper<ChatDetail>().eq(ChatDetail::getChatId, chatId);
        //深度思考模型做出限制
        chatDetails = MemoryFilter.filterMemory(chatDetailMapper, wrapper, modelName);
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
            System.err.println("当前模型记忆为:"+chatMemory.get(chatId));
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
    public void saveChatHistory(String chatId, String type, Message content) {
        chatHistoryService.saveChatDetail(chatId, type, content);
    }

    public void saveChatHistory(String chatId, String type,  List<? extends Message> content) {
        for (Message message : content) {
            this.saveChatHistory(chatId, type, message);
        }
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

    //获取多模态文件
    public Prompt getMultiModalFile(List<String> fileIds){
        if (fileIds == null){
            return new Prompt();
        }
        List<Media> media = new ArrayList<>();
        for (String fileId : fileIds){
            String content = memoryStorage.get(fileId);
            //TODO 采用更安全的校验方式
            if (content != null && content.contains("type=") && content.contains("&path=")){
                String[] split = content.split("&");
                String type = split[0].split("=")[1];
                String path = split[1].split("=")[1];
                //获取文件资源
                Resource resource = new FileSystemResource(path);

                if (MimeTypeUtils.IMAGE_JPEG_VALUE.equals(type)) {
                    media.add(new Media(MimeTypeUtils.IMAGE_JPEG, resource));     //图片文件jpeg
                } else if (MimeTypeUtils.IMAGE_PNG_VALUE.equals(type)) {
                    media.add(new Media(MimeTypeUtils.IMAGE_PNG, resource));      //图片文件png
                } else if (MimeTypeUtils.IMAGE_GIF_VALUE.equals(type)) {
                    media.add(new Media(MimeTypeUtils.IMAGE_GIF, resource));      //图片文件gif
                } else if (MimeTypeUtils.parseMimeType(type).toString().startsWith("audio")) {
                    media.add(new Media(MimeTypeUtils.parseMimeType(type), resource)); //音频文件
                }else {
                    throw new RuntimeException("不支持的文件类型");
                }
            }
        }
       return new Prompt(UserMessage.builder().media(media).text("识别这个文件").build());
    }

    //检查模型是否支持多模态
    public boolean checkMultiModal(String modelName){
        return modelMessageService.checkMultiModal(modelName);
    }
}
