package com.ai.mcpserver.tools;

import com.ai.mcpserver.model.location.LocationResponse;
import com.ai.mcpserver.model.location.Point;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.ProtocolException;
import java.net.URL;
import java.nio.charset.StandardCharsets;

@Service
public class LocationTool {

    @Value("${spring.ai.mcp.location-search.endpoint}")
    private String endPoint;
    @Value("${spring.ai.mcp.location-search.api-key}")
    private String API_KEY;

    private static final ObjectMapper mapper = new ObjectMapper();


    @Tool(description = "获取当前地理信息(当用户的请求需要明确地理位置而用户并未提供时，则先调用该工具)")
    public LocationResponse getLocation() throws IOException {
        String urlStr = endPoint+API_KEY;
        System.err.println("调用地理信息工具");

        URL url = new URL(urlStr);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
            StringBuilder response = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                response.append(line);
            }
            return parseCoordinates(response.toString());
        }catch (Exception e){
            throw new RuntimeException("获取地理服务异常");
        }
        finally {
            conn.disconnect();
        }
    }

    // 添加坐标转换方法
    public static LocationResponse parseCoordinates(String json) throws IOException {
        return mapper.readValue(json, LocationResponse.class);
    }
}
