package com.ai.service.impl;

import com.ai.service.FileParseService;
import com.ai.utils.TxtFileParser;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

@Service
public class FileParseServiceImpl implements FileParseService {


    @Override
    public String parse(MultipartFile file) {
        //根据文件类型解析文件
        try {
            if (Objects.equals(file.getContentType(), "text/plain")){
                return new TxtFileParser().parse(file);
            }
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        return null;
    }
}
