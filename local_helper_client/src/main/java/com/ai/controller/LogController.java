package com.ai.controller;

import com.ai.service.LogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.File;
import java.io.IOException;

@RestController
@RequestMapping("/log")
public class LogController {

    @Autowired
    private LogService logService;

    //导出错误日志
    @GetMapping("/download/errLog")
    public ResponseEntity<Resource> downloadErrLog() throws IOException {
        File errLog = logService.downloadErrLog();

        //创建资源
        FileSystemResource errLogResource = new FileSystemResource(errLog);
        // 3. 设置响应头
        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename="+errLog.getName());
        headers.add(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate");
        headers.add(HttpHeaders.PRAGMA, "no-cache");
        headers.add(HttpHeaders.EXPIRES, "0");

        // 4. 返回响应
        return ResponseEntity.ok()
                .headers(headers)
                .contentLength(errLog.length())
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(errLogResource);
    }
}
