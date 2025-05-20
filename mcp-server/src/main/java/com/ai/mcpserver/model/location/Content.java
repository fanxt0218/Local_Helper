package com.ai.mcpserver.model.location;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
    public  class Content {
        /**
         * 简化地址（省市组合）
         */
        private String address;
        
        /**
         * 行政详情
         */
        @JsonProperty("address_detail")
        private AddressDetail addressDetail;
        
        /**
         * 坐标点
         */
        private Point point;
    }
