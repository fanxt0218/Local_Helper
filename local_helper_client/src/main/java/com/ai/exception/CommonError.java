package com.ai.exception;

public enum CommonError {

    UNKNOWN_ERROR("未知错误"),
    FILETYPE_UNSUPPORT_ERROR("不支持的文件类型");

    private String errMessage;

    public String getErrMessage() {
        return errMessage;
    }

    private CommonError( String errMessage) {
        this.errMessage = errMessage;
    }
}
