// WebSearchTool.java
package com.ai.mcpserver.tools;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Mono;

import java.util.List;

@Service
public class WebSearchTool {
    
    @Value("${spring.ai.mcp.web-search.api-key}")
    private String apiKey;
    
    @Value("${spring.ai.mcp.web-search.endpoint}")
    private String searchEndpoint;

    private final WebClient webClient = WebClient.builder().build();

    @Tool(description = "联网搜索实时信息")
    public String webSearch(
            @ToolParam(description = "搜索关键词") String query,
//            @ToolParam(description = "时间范围,d1代表24小时内,w1代表7天内,m1代表1月内,y1代表1年内,以此类推") String timeRange,
            @ToolParam(description = "返回结果数量（1-10）") Integer numResults
    ) {
        UriComponentsBuilder uriBuilder = UriComponentsBuilder.fromHttpUrl(searchEndpoint)
                .queryParam("q", query)
                .queryParam("num", numResults != null ? numResults : 3)
                .queryParam("api_key", apiKey);

        // 条件式添加时间参数
//        if (timeRange != null && !timeRange.isEmpty()) {
//            uriBuilder.queryParam("tbs", "qdr:" + timeRange);
//        }
        System.err.println("调用联网搜索传入的参数: "+"查询: "+query+",\n时间范围: "+",\n结果数: "+numResults);

        return webClient.get()
                .uri(uriBuilder.build().toUri())
                .retrieve()
                .bodyToMono(SearchResult.class)
                .map(this::formatResults)
                .block();
    }

    private String formatResults(SearchResult result) {
        StringBuilder sb = new StringBuilder();
        for (SearchResult.Item item : result.items) {
            sb.append("标题：").append(item.title)
              .append("\n链接：").append(item.link)
              .append("\n摘要：").append(item.snippet).append("\n\n");
        }
        return sb.toString();
    }

    // 定义搜索结果结构
    public static class SearchResult {
        @JsonProperty("organic_results") // 匹配实际API字段
        List<Item> items;

        public static class Item {
            String title;
            String link;
            String snippet;
            String date;
        }
    }
}
