package com.ai.model.dto;

import lombok.Data;
import lombok.ToString;

@Data
@ToString
public class UploadFileResultDto {

    private String fileId;

    private String filePath;
}
