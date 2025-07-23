package com.ai.sseConnect;

import com.ai.exception.CommonError;
import com.ai.exception.LocalHelperException;
import com.ai.mapper.ErrorMapper;
import com.ai.mapper.McpDoMapper;
import com.ai.model.po.McpDo;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.experimental.Accessors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.Disposable;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class CreateSSE {

    private final WebClient webClient = WebClient.create();
    //SSE连接池
    private final Map<String, Disposable> connections = new ConcurrentHashMap<>();

    @Autowired
    private McpDoMapper mcpDoMapper;

    //自动连接
    @PostConstruct
    public void init() {
        System.out.println("🔌 自动连接 MCP SSE 服务...");
        List<McpDo> mcpDos = mcpDoMapper.selectList(new LambdaQueryWrapper<McpDo>().eq(McpDo::getIsEnable, 1));
        mcpDos.forEach(mcp -> {
            String endpoint = mcp.getEndPoint().isEmpty() ? "/sse" : mcp.getEndPoint();
            connectToMCPSSE(mcp.getUrl() + endpoint);
        });
    }


    public void connectToMCPSSE(String uri) {
        System.out.println("⌛ Connecting to SSE endpoint: " + uri);
        Flux<String> eventStream = webClient.get()
                .uri(uri)
                .retrieve()
                .bodyToFlux(String.class);
        // 订阅事件流并保存 Disposable 引用
        Disposable subscription = eventStream.subscribe(
                this::handleEvent,   // 处理事件
                this::handleError,   // 处理错误
                () -> handleComplete(uri) // 传递 URI 供重连
        );
        connections.put(uri,subscription);
        System.out.println("✅ SSE connection established: " + uri);
    }

    private void handleEvent(String event) {
        System.out.println("Received SSE event: " + event);
        // 解析并更新配置
    }

    private void handleError(Throwable error) {
        System.err.println("SSE connection error: " + error.getMessage());
        LocalHelperException.cast(error.getMessage(), CommonError.MCP_ERROR);
    }

    private void handleComplete(String uri) {
        System.out.println("SSE connection completed");
        // 重新连接
        connectToMCPSSE(uri);
    }

    // 精确断开指定连接
    public void disconnect(String uri) {
        Disposable subscription = connections.get(uri);
        if (subscription != null && !subscription.isDisposed()) {
            subscription.dispose();
            connections.remove(uri);
            System.out.println("♻️ Disconnected SSE [" + uri + "]");
        }
    }

    @PreDestroy
    public void cleanup() {
        connections.forEach((id, sub) -> {
            if (!sub.isDisposed()) sub.dispose();
            System.out.println("♻️ Cleaned up SSE [" + id + "]");
        });
        connections.clear();
    }
}
