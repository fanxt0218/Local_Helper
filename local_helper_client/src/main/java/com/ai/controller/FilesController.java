package com.ai.controller;

import com.ai.model.dto.UploadFileResultDto;
import com.ai.service.FileParseService;
import com.ai.utils.MemoryStorage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/files")
public class FilesController {

    @Autowired
    private FileParseService fileParseService; // 自定义文件存储服务
    @Autowired
    private MemoryStorage memoryStorage;

    // 上传文件
    @RequestMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UploadFileResultDto upload(@RequestPart("filedata") MultipartFile multipartFile) throws IOException {
        if (multipartFile.getSize() > 1024 * 1024 * 10){
            throw new RuntimeException("文件大小不能超过10M");
        }

        //解析文件
        String content = fileParseService.parse(multipartFile);
        //唯一id
        String fileId = UUID.randomUUID().toString();
        //存储文件
        memoryStorage.save(fileId, content);

        UploadFileResultDto uploadFileResultDto = new UploadFileResultDto();
        uploadFileResultDto.setFileId(fileId);
        return uploadFileResultDto;
    }

    //删除文件
    @DeleteMapping("/{fileId}")
    public void deleteFile(@PathVariable String fileId) {
        memoryStorage.remove(fileId);
    }
}
