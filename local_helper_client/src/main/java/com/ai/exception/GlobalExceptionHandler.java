package com.ai.exception;

import com.ai.exception.model.Error;
import com.ai.mapper.ErrorMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.ResponseStatus;

@Slf4j
@ControllerAdvice
public class GlobalExceptionHandler {

    @Autowired
    private ErrorMapper errorMapper;

    //自定义异常
    @ResponseBody
    @ExceptionHandler(value = LocalHelperException.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public RestErrorResponse customException(LocalHelperException e){
        log.error("【系统异常】",e);
        Error error = new Error(e.getSuperMessage(), e.getErrorType());
        errorMapper.insert(error);
        return new RestErrorResponse(e.getErrMessage());
    }

    //全局异常
    @ResponseBody
    @ExceptionHandler(value = Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public RestErrorResponse exception(Exception e){
        log.error("【系统异常】",e);
        Error error = new Error(e.getMessage(), CommonError.RUNTIME_ERROR);
        errorMapper.insert(error);
        return new RestErrorResponse(CommonError.UNKNOWN_ERROR.getErrMessage());
    }

}
