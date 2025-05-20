package com.ai.mcpserver.model.baiduWeather;

import lombok.Data;

import java.util.List;

@Data
    public  class Result {
        /**
         * 地理位置信息
         */
        private Location location;
        
        /**
         * 实时天气数据
         */
        private Now now;
        
        /**
         * 天气预报列表（最多5天）
         */
        private List<Forecast> forecasts;
    }