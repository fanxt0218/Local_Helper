package com.ai.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.ResponseStatus;

@Slf4j
@ControllerAdvice
public class GlobalExceptionHandler {

    //自定义异常
    @ResponseBody
    @ExceptionHandler(value = LocalHelperException.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public RestErrorResponse customException(LocalHelperException e){
        log.error("【系统异常】",e);
        return new RestErrorResponse(e.getErrMessage());
    }

    //全局异常
    @ResponseBody
    @ExceptionHandler(value = Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public RestErrorResponse exception(Exception e){
        log.error("【系统异常】",e);
        return new RestErrorResponse(CommonError.UNKNOWN_ERROR.getErrMessage());
    }
}
