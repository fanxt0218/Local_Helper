package com.ai.utils;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class MemoryStorage {

    //文件存储
    private static final ConcurrentHashMap<String,String> storage = new ConcurrentHashMap<>();
    //原始文件
    private static final ConcurrentHashMap<String,String> originalFile = new ConcurrentHashMap<>();

    //存储文件
    public void save(String fileId, String content) {
        storage.put(fileId, content);
        System.out.println("文件存储成功"+fileId);
        System.out.println("文件内容"+content);
    }

    //获取文件
    public String get(String fileId) {
        return storage.get(fileId);
    }

    //删除文件
    public void remove(String fileId) {
        storage.remove(fileId);
        System.out.println("文件删除成功"+fileId);
    }

    //清空所有文件
    public void clear() {
        storage.clear();
        originalFile.clear();
        System.out.println("文件缓存清空成功");
    }

    //存储原始文件
    public void saveOriginalFile(String fileId, String path) {
        originalFile.put(fileId, path);
        System.out.println("原始文件存储成功"+fileId);
        System.out.println("原始文件路径"+path);
    }

    //获取原始文件
    public String getOriginalFile(String fileId) {
        return originalFile.get(fileId);
    }

    //删除原始文件
    public void removeOriginalFile(String fileId) {
        originalFile.remove(fileId);
        System.out.println("原始文件删除成功"+fileId);
    }
}
