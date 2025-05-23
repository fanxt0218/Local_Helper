package com.ai.service;

import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.util.Map;

public interface FileParseService {


    String parse(MultipartFile file);
}
