package com.ai.mcpserver.model.weather;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class Result {
    private Location location;
    private List<Daily> daily;
    
    @JsonProperty("last_update")
    private String lastUpdate;
}