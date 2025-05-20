package com.ai.mcpserver.model.location;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
    public class AddressDetail {
        /**
         * 行政区划代码（6位数字）
         */
        private String adcode;
        
        /**
         * 省级行政区名称
         */
        private String province;
        
        /**
         * 地级市名称
         */
        private String city;
        
        /**
         * 市级行政区划代码
         */
        @JsonProperty("city_code")
        private Integer cityCode;
        
        /**
         * 区/县级行政区名称（可能为空）
         */
        private String district;
        
        /**
         * 街道名称（可能为空）
         */
        private String street;
        
        /**
         * 门牌号（可能为空）
         */
        @JsonProperty("street_number")
        private String streetNumber;
    }