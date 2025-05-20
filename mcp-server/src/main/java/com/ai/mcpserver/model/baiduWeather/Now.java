package com.ai.mcpserver.model.baiduWeather;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
    public class Now {
        /**
         * 天气现象文字
         */
        private String text;
        
        /**
         * 温度（摄氏度）
         */
        private Integer temp;
        
        /**
         * 体感温度
         */
        @JsonProperty("feels_like")
        private Integer feelsLike;
        
        /**
         * 相对湿度（百分比）
         */
        private Integer rh;
        
        /**
         * 风力等级
         */
        @JsonProperty("wind_class")
        private String windClass;
        
        /**
         * 风向描述
         */
        @JsonProperty("wind_dir")
        private String windDir;
        
        /**
         * 数据更新时间（格式：yyyyMMddHHmmss）
         */
        private String uptime;
    }