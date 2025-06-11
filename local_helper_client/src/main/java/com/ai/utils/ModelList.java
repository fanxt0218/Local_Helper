package com.ai.utils;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import com.ai.model.dto.OllamaModel;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.ai.ollama.api.OllamaApi;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.client.RestClient;

public class ModelList {

    private static final String OLLAMA_API_URL = "http://localhost:11434/api/tags";

    private static final ObjectMapper mapper = new ObjectMapper();

    private static final RestClient restClient = RestClient.builder().baseUrl("http://localhost:11434").build();

//    public ModelList(RestClient.Builder restClient){
//        ModelList.restClient = restClient.baseUrl("http://localhost/11434").build();
//    }

    public static List<String> getModels() {
        List<String> models = null;
        try {
//            models = fetchOllamaModels();
            models = listModels();
//            System.out.println("可用模型名称:");
//            models.forEach(System.out::println);
        } catch (Exception e) {
            System.err.println("Error fetching models: " + e.getMessage());
        }
        return models;
    }

    public static List<String> fetchOllamaModels() throws Exception {
        // 1. 创建HttpClient
        HttpClient client = HttpClient.newHttpClient();

        // 2. 构建GET请求
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(OLLAMA_API_URL))
                .GET()
                .build();

        // 3. 发送请求并获取响应
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

        // 4. 检查HTTP状态码
        if (response.statusCode() != 200) {
            throw new RuntimeException("HTTP Error: " + response.statusCode());
        }
//        System.out.println("完整响应JSON：\n" + response.body());
//        System.out.println("---------------------------------");


        // 5. 解析JSON响应
        // 创建ObjectMapper实例
        JsonNode root = mapper.readTree(response.body()); // 解析整个JSON响应体
        JsonNode modelsNode = root.get("models");         // 提取"models"字段对应的节点

//        System.out.println("modelsNode结构：\n" + modelsNode.toPrettyString());

        List<OllamaModel> models = mapper.readValue(
            modelsNode.traverse(),
            mapper.getTypeFactory().constructCollectionType(List.class, OllamaModel.class)
        );

        // 提取名称列表
        return models.stream()
            .map(OllamaModel::getModel)
            .collect(Collectors.toList());


    }

    //获取ollama模型列表（最新方法）
    public static List<String> listModels() {
        OllamaApi.ListModelResponse response = restClient.get().uri("/api/tags").retrieve().body(OllamaApi.ListModelResponse.class);
        if (response == null){
            System.out.println("可用模型为空");
            return null;
        }
        ArrayList<String> modelList = new ArrayList<>();
        List<OllamaApi.Model> models = response.models();
        System.out.println("可用模型名称:");
        for (OllamaApi.Model model : models) {
            modelList.add(model.name());
            System.out.println("• "+model.name());
        }
        return modelList;
    }
}
