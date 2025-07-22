package com.ai.service.impl;

import com.ai.exception.model.Error;
import com.ai.mapper.ErrorMapper;
import com.ai.service.LogService;
import org.apache.commons.io.FileUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;

@Service
public class LogServiceImpl implements LogService {

    @Autowired
    private ErrorMapper errorMapper;

    @Override
    public File downloadErrLog() throws IOException {
        List<Error> errorsLogs = errorMapper.selectList(null);
        //错误日志
        StringBuilder errLogs = new StringBuilder();
        errLogs.append("          Time                                 Type                         Message"+"\n");
        errLogs.append("=========================================================================================="+"\n");
        for (Error error : errorsLogs) {
            errLogs.append(error.getErrorTime()).append("         ").append(error.getErrorType()).append("          ").append(error.getErrorMessage()).append("\n");
        }
        //创建临时文件
        File tempFile = File.createTempFile("errLog_" + new Date().getTime(), ".txt");
        FileUtils.writeStringToFile(tempFile,errLogs.toString(), StandardCharsets.UTF_8);
        return tempFile;
    }
}
