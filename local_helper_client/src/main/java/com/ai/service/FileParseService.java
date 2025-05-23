package com.ai.service;

import java.nio.file.Path;

public interface FileStorageService {


    void save(String fileId, Path path);
}
