package com.ai.socket;

import com.ai.controller.AiController;
import com.ai.model.po.GetRequest;
import com.ai.service.AIService;
import com.ai.utils.FilterResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.websocket.OnClose;
import jakarta.websocket.OnMessage;
import jakarta.websocket.OnOpen;
import jakarta.websocket.Session;
import jakarta.websocket.server.PathParam;
import jakarta.websocket.server.ServerEndpoint;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;

import java.io.IOException;
import java.time.Duration;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.TimeoutException;

@Component
@ServerEndpoint("/ai/response/{sid}")
public class WebSocketServer {

    //存放会话对象
    private static Map<String, Session> sessionMap = new HashMap();

    private static ApplicationContext context;


    //注入ChatClient构造器后需要手动指定无参构造
//    public WebSocketServer() {}

    @Autowired
    private AiController aiController;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    public void setApplicationContext(ApplicationContext context) {
        WebSocketServer.context = context;
    }



    /**
     * 连接建立成功调用的方法
     */
    @OnOpen
    public void onOpen(Session session, @PathParam("sid") Integer sid) {
        System.out.println("客户端：" + sid + "建立连接");
        sessionMap.put(sid.toString(), session);
        aiController = context.getBean(AiController.class);
        objectMapper = context.getBean(ObjectMapper.class);
    }

    /**
     * 收到客户端消息后调用的方法
     *
     * @param message 客户端发送过来的消息
     */
    @OnMessage
    public void onMessage(String message,@PathParam("sid") Integer sid) throws IOException, InterruptedException {
        Session session = sessionMap.get(sid.toString());
        if (message.isEmpty()){
            throw new RuntimeException("不能发送空白内容");
        }
        // 解析 JSON 字符串
        GetRequest request = objectMapper.readValue(message, GetRequest.class);
        System.out.println("收到客户端消息：" + request);

        // 获取流式响应
        Flux<String> responseFlux = aiController.chat(request);
//                .timeout(Duration.ofMinutes(3))// 设置超时时间3分钟;
//                .onErrorResume(TimeoutException.class, e -> {
//            return Flux.just("{\"chat\":\"服务响应超时，请稍后再试，或检查ollama是否可达\"}\n" +
//                    "<end>");
//        });  //默认超时消息

        // 订阅响应流
        responseFlux
                .onBackpressureBuffer(50) // 缓存50个元素
                .buffer(Duration.ofMillis(200)) // 每200ms批量发送
//                .doOnNext(chunk -> System.out.println("Processing chunk: " + chunk))
                .map(chunks -> String.join("", chunks)).subscribe(
                        chunk -> {
                            try {
                                Map<String, String> map = new HashMap<>();
                                map.put("chat", FilterResponse.filterLeadingTag(chunk));
                                session.getBasicRemote().sendText(objectMapper.writeValueAsString(map));
                            } catch (IOException e) {
                                throw new RuntimeException(e);
                            }
                        },
                        error -> {
                            try {
                                error.printStackTrace();
                                session.getBasicRemote().sendText("{\"chat\":\"服务繁忙,请稍后再试\"}");
                                session.getBasicRemote().sendText("<end>");
                                //每次响应完成后，调用方法将消息保存到数据库中
                                aiController.saveChatHistory(request.getChatId(), "assistant", "服务繁忙,请稍后再试");
                            } catch (IOException e) {
                                e.printStackTrace();
                            }
                        },
                        () -> {
                            try {
                                session.getBasicRemote().sendText("<end>");
                            } catch (IOException e) {
                                e.printStackTrace();
                            }
                        }
                );

    }


    /**
     * 连接关闭调用的方法
     *
     * @param sid
     */
    @OnClose
    public void onClose(@PathParam("sid") Integer sid) {
        System.out.println("连接断开:" + sid);
        sessionMap.remove(sid.toString());
    }

    /**
     * 群发
     *
     * @param message
     */
    //TODO 改为根据不同对象发送不同响应
    public void sendToAllClient(String message) {
        Collection<Session> sessions = sessionMap.values();
        for (Session session : sessions) {
            try {
                //服务器向客户端发送消息
                session.getBasicRemote().sendText(message);
                //System.out.println("转发了消息");
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }


}

