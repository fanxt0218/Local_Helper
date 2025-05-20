package com.ai.mcpserver.model.baiduWeather;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
    public class Forecast {
        /**
         * 白天天气现象
         */
        @JsonProperty("text_day")
        private String textDay;
        
        /**
         * 夜间天气现象
         */
        @JsonProperty("text_night")
        private String textNight;
        
        /**
         * 最高气温
         */
        private Integer high;
        
        /**
         * 最低气温
         */
        private Integer low;
        
        /**
         * 白天风力等级
         */
        @JsonProperty("wc_day")
        private String windClassDay;
        
        /**
         * 白天风向
         */
        @JsonProperty("wd_day")
        private String windDirectionDay;
        
        /**
         * 夜间风力等级
         */
        @JsonProperty("wc_night")
        private String windClassNight;
        
        /**
         * 夜间风向
         */
        @JsonProperty("wd_night")
        private String windDirectionNight;
        
        /**
         * 日期（格式：yyyy-MM-dd）
         */
        private String date;
        
        /**
         * 星期信息
         */
        private String week;
    }