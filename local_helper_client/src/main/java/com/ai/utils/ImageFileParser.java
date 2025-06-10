package com.ai.utils;

import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;

@Component
public class ImageFileParser {

    public String parse(MultipartFile file) throws IOException {
        File tempFile = File.createTempFile("md5", ".temp");
        file.transferTo(tempFile);
        //文件路径
        String absolutePath = tempFile.getAbsolutePath();
        return "type="+file.getContentType()+"&path="+absolutePath;
    }
}
