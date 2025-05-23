package com.ai.utils;

import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.function.ToDoubleBiFunction;

@Component
public class TxtFileParser {
    public String parse(MultipartFile file) throws Exception {
        StringBuilder Totalline;
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            Totalline = new StringBuilder();
            Totalline.append("文件【").append(file.getOriginalFilename()).append("】:\n");
            String line;
            while ((line = reader.readLine()) != null) {
                Totalline.append(line);
            }
        }
        return Totalline.toString();
    }
}