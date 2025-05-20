package com.ai.mcpserver.model.baiduWeather;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
public class BaiduWeatherResponse {
    /**
     * 状态码（0表示成功）
     */
    private Integer status;
    
    /**
     * 实际天气数据
     */
    private Result result;
    
    /**
     * 响应消息
     */
    private String message;

}