package com.ai.mcpserver.model.baiduWeather;

import lombok.Data;

@Data
    public class Location {
        /**
         * 国家名称
         */
        private String country;
        
        /**
         * 省级行政区名称
         */
        private String province;
        
        /**
         * 地级市名称
         */
        private String city;
        
        /**
         * 地点名称
         */
        private String name;
        
        /**
         * 行政区划代码
         */
        private String id;
    }