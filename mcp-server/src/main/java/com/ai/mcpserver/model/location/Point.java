package com.ai.mcpserver.model.location;

import lombok.Data;

@Data
    public class Point {
        /**
         * 经度（WGS84坐标系）
         */
        private String x;
        
        /**
         * 纬度（WGS84坐标系）
         */
        private String y;
    }