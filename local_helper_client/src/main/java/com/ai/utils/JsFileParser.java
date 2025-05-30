package com.ai.utils;

import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.io.InputStream;
import java.util.Scanner;

public class JsFileParser {

    //js文件解析
    public String parse(MultipartFile file) throws IOException {
        try (InputStream inputStream = file.getInputStream();
             Scanner scanner = new Scanner(inputStream, "UTF-8")) {
            return scanner.useDelimiter("\\A").next();
        }
    }
}
