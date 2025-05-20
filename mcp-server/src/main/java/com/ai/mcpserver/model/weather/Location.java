package com.ai.mcpserver.model.weather;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class Location {
    private String id;
    private String name;
    private String country;
    private String path;
    private String timezone;
    
    @JsonProperty("timezone_offset")
    private String timezoneOffset;
}