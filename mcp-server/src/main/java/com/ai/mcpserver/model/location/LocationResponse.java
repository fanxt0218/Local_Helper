package com.ai.mcpserver.model.location;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class LocationResponse {
    /**
     * 状态码（0表示成功）
     */
    private Integer status;

    /**
     * 结构化地址（竖线分割）
     * 格式：国家|省份|城市|区县|街道|经度|纬度|精度
     */
    private String address;

    /**
     * 详细地址信息
     */
    private Content content;
}