package com.ai.service.impl;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class FileStorageServiceImpl {

    private final Map<String, Path> fileMap = new ConcurrentHashMap<>();

    @Scheduled(fixedRate = 3600000) // 每小时清理一次
    public void cleanExpiredFiles() {
        fileMap.entrySet().removeIf(entry -> {
            try {
                return Files.getLastModifiedTime(entry.getValue()).toMillis()
                        < System.currentTimeMillis() - 3600000; // 保留1小时
            } catch (IOException e) {
                return true;
            }
        });
    }

    public void save(String fileId, Path filePath) {
        fileMap.put(fileId, filePath);
    }

    public Path get(String fileId) {
        return fileMap.get(fileId);
    }
}
