package com.ai.utils;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class MemoryStorage {

    //文件存储
    private static final ConcurrentHashMap<String,String> storage = new ConcurrentHashMap<>();

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
        System.out.println("文件清空成功");
    }
}
