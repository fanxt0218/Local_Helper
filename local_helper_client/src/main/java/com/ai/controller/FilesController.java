package com.ai.controller;

import com.ai.model.dto.UploadFileResultDto;
import com.ai.service.FileParseService;
import com.ai.utils.MemoryStorage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
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
        InputStream in = multipartFile.getInputStream();
        //解析文件
        String content = fileParseService.parse(multipartFile);
        //唯一id
        String fileId = UUID.randomUUID().toString();
        //存储文件
        memoryStorage.save(fileId, content);
        //存储原始文件
        String originalFilename = multipartFile.getOriginalFilename();
        String fileExtension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            // 提取最后一个点之后的部分作为后缀
            fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
        } else {
            // 如果没有后缀，使用默认后缀
            fileExtension = ".tmp";
        }
        Path tempFile = Files.createTempFile("upload-", fileExtension);
        Files.copy(in, tempFile, StandardCopyOption.REPLACE_EXISTING);
        memoryStorage.saveOriginalFile(fileId, tempFile.toAbsolutePath().toString());
        in.close();
        //返回文件id
        UploadFileResultDto uploadFileResultDto = new UploadFileResultDto();
        uploadFileResultDto.setFileId(fileId);
        return uploadFileResultDto;
    }

    //删除文件
    @DeleteMapping("/{fileId}")
    public void deleteFile(@PathVariable String fileId) throws IOException {
        String originalPath = memoryStorage.getOriginalFile(fileId);
        if (originalPath != null) {
            // 删除临时文件
            Files.deleteIfExists(Paths.get(originalPath));
        }
        memoryStorage.removeOriginalFile(fileId);
        memoryStorage.remove(fileId);
    }

    //下载文件
    @GetMapping("/download/{fileId}")
    public ResponseEntity<org.springframework.core.io.Resource> downloadFile(@PathVariable String fileId) throws URISyntaxException {
        // 从存储中获取文件信息
        String fileInfo = memoryStorage.getOriginalFile(fileId);
        if (fileInfo == null) {
            return ResponseEntity.notFound().build();
        }

        Path filePath = Paths.get(fileInfo);
        File file = filePath.toFile();
        if (!file.exists()) {
            return ResponseEntity.notFound().build();
        }

        // 创建Resource对象
//        Resource resource =
        FileSystemResource fileSystemResource = new FileSystemResource(file);
        // 设置响应头
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getName() + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(fileSystemResource);
    }

    //获取解析内容
    @GetMapping("/preview/{fileId}")
    public ResponseEntity<String> getParsedContent(@PathVariable String fileId) {
        // 从存储中获取解析内容
        String content = memoryStorage.get(fileId);
        if (content == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_PLAIN)
                .body(content);
    }

    //清理缓存
    @PostMapping("/clearMemory")
    public ResponseEntity<String> clearMemory() {
        memoryStorage.clear();
        return ResponseEntity.ok("{\"message\":\"缓存清理成功\"}");
    }
}
