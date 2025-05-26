package com.ai.service.impl;

import com.ai.service.FileParseService;
import com.ai.utils.ExcelFileParser;
import com.ai.utils.PDFFileParser;
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
            //不支持的文件类型
            throw new RuntimeException("不支持的文件类型");
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
