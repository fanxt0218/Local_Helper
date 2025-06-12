package com.ai.service.impl;

import com.ai.service.FileParseService;
import com.ai.utils.*;
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
            //文本文件
            if (Objects.equals(file.getContentType(), "text/plain")){
                return new TxtFileParser().parse(file);
            }
            //PDF文件
            if (Objects.equals(file.getContentType(), "application/pdf")){
                return new PDFFileParser().parse(file);
            }
            //Excel文件
            if (Objects.equals(file.getContentType(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")|| Objects.equals(file.getContentType(), "application/vnd.ms-excel")){
                return new ExcelFileParser().parse(file);
            }
            //HTML文件
            if (Objects.equals(file.getContentType(), "text/html")) {
                return new HtmlFileParser().parse(file);
            }
            //CSS文件
            if (Objects.equals(file.getContentType(), "text/css")){
                return new CssFileParser().parse(file);
            }
            //JS文件
            if (Objects.equals(file.getContentType(), "application/javascript") || Objects.equals(file.getContentType(),"text/javascript")){
                return new JsFileParser().parse(file);
            }
            //图片文件
            if (Objects.equals(file.getContentType(), "image/jpeg") || Objects.equals(file.getContentType(), "image/png") || Objects.equals(file.getContentType(), "image/gif")){
                return new ImageFileParser().parse(file);
            }
            //音频文件
            if (file.getContentType().startsWith("audio/")) {
                return new AudioFileParser().parse(file); // 需实现音频解析器
            }
            //不支持的文件类型
            throw new RuntimeException("不支持的文件类型");
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
