package com.ai.model.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true) // 添加这行
public class OllamaModel {
    //模型名
    @JsonProperty("model")
    private String model;

    //模型修改时间
    @JsonProperty("modified_at")
    private String modifiedAt;

    //模型大小
    @JsonProperty("size")
    private long size;

    // 可添加业务逻辑方法
    public String getFormattedSize() {
        return String.format("%.2f GB", size / 1024.0 / 1024.0 / 1024.0);
    }
}
