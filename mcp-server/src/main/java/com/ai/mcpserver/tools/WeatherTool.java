package com.ai.mcpserver.tools;

import com.ai.mcpserver.model.baiduWeather.BaiduWeatherResponse;
import com.ai.mcpserver.model.weather.WeatherResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
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
import java.util.regex.Pattern;

@Service
public class WeatherTool {

    @Value("${spring.ai.mcp.weather-search.endpoint}")
    private String endPoint;
    @Value("${spring.ai.mcp.weather-search.api-key}")
    private String API_KEY;

    private static final ObjectMapper objectMapper = new ObjectMapper();


    @Tool(description = "根据城市名获取3天内天气信息,如果用户未提供城市名，需要先调用地理位置工具")
    public WeatherResponse getWeather(
            @ToolParam(description = "城市名称,转为完整拼音传入，例如“北京”则传入“beijing”") String city,
            @ToolParam(description = "查询天数,只查询今天则传入1，以此类推，最多查询未来三天") String days) throws Exception {
        System.err.println("调用查询天气工具,"+"城市:"+city+",查询天数:"+days);
        String urlStr = endPoint+"key="+API_KEY+"&location="+city+"&days="+days;

        //构建请求
        String jsonStr = sendRequest(urlStr);
        return parseWeather(jsonStr);
    }

    public static WeatherResponse parseWeather(String json) throws Exception {
        return objectMapper.readValue(json, WeatherResponse.class);
    }

    @Value("${spring.ai.mcp.weather-search-baidu.endpoint}")
    private String endPointBaidu;
    @Value("${spring.ai.mcp.location-search.api-key}")
    private String API_KEY_Baidu;

    @Tool(description = "根据行政区划编码或者经纬度获取天气信息，两个参数可二选其一，如果用户未提供相关位置信息，需要先调用地理位置工具")
    public BaiduWeatherResponse getWeatherByLocation(
            @ToolParam(description = "行政区划编码，和location二选一") String adCode,
            @ToolParam(description = "经纬度，经度在前纬度在后，逗号分隔。支持类型：bd09mc/bd09ll/wgs84/gcj02格式。") String location) throws Exception {
        // 参数校验
        boolean validAdCode = validateAdCode(adCode);
        boolean validLocation = validateLocation(location);
        System.err.println("调用查询天气工具,"+"adCode:"+adCode+",location:"+location);


        if (!validAdCode && !validLocation) {
            throw new IllegalArgumentException("参数格式错误：adCode应为数字，location应为经度,纬度格式");
        }

        // 构建请求URL
        StringBuilder urlBuilder = new StringBuilder(endPointBaidu)
                .append("?ak=").append(API_KEY_Baidu).append("&data_type=all");

        if (validAdCode) {
            urlBuilder.append("&district_id=").append(adCode);
        }
        if (validLocation) {
            urlBuilder.append("&location=").append(location);
        }

        String urlStr = urlBuilder.toString();

        //构建请求
        String jsonStr = sendRequest(urlStr);
        return parseBaiduWeather(jsonStr);
    }

    // 校验行政区划编码（6位数字）
    private boolean validateAdCode(String adCode) {
        if (adCode == null || adCode.isEmpty()) return false;
        return Pattern.matches("^\\d{6}$", adCode);
    }

    // 校验经纬度格式（经度,纬度）
    private boolean validateLocation(String location) {
        if (location == null || location.isEmpty()) return false;
        return Pattern.matches("^[-+]?\\d{1,3}(\\.\\d+)?,[-+]?\\d{1,2}(\\.\\d+)?$", location);
    }

    //封装响应
    public BaiduWeatherResponse  parseBaiduWeather(String json) throws Exception {
        return objectMapper.readValue(json, BaiduWeatherResponse.class);
    }

    //构建请求
    private String sendRequest(String urlStr) throws IOException {
        URL url = new URL(urlStr);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");

        try {
            BufferedReader reader = new BufferedReader(
                    new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
            StringBuilder response = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                response.append(line);
            }
            reader.close();
            return response.toString();
        }catch (Exception e){
            throw new RuntimeException("获取天气服务异常");
        }finally {
            conn.disconnect();
        }
    }

}
