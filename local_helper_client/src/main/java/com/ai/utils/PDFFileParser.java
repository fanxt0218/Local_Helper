package com.ai.utils;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import java.io.InputStream;

@Component
public class PDFFileParser {

    public String parse(MultipartFile file) throws Exception {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("文件不能为空");
        }

        try (InputStream inputStream = file.getInputStream();
             // 使用 Loader 类加载 PDF
             PDDocument document = Loader.loadPDF(inputStream.readAllBytes())) {

            PDFTextStripper stripper = new PDFTextStripper();
            System.out.println("解析成功PDF "+ stripper.getText(document));
            return stripper.getText(document);
        } catch (Exception e) {
            throw new Exception("解析失败: " + e.getMessage());
        }
    }
}