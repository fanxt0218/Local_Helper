package com.ai.exception;
/**
 * 通过全参构造以及枚举类型的静态方法抛出异常才能记录到异常类型
 */
public class LocalHelperException extends RuntimeException{

    private String errMessage;

    private Enum<CommonError> errorType;

    public LocalHelperException(){}

    public LocalHelperException(String errMessage){
        super(errMessage);
        this.errMessage = errMessage;
    }

    public LocalHelperException(String errMessage, Enum<CommonError> errorType){
        super(errMessage);
        this.errMessage = errMessage;
        this.errorType = errorType;
    }

    public String getErrMessage(){
        return errMessage;
    }

    public String getSuperMessage(){
        return super.getMessage();
    }

    public void setErrMessage(String errMessage){
        this.errMessage = errMessage;
    }

    public Enum<CommonError> getErrorType() {
        return errorType;
    }

    public static void cast(String message){
        throw new LocalHelperException(message);
    }

    public static void cast(CommonError error){
        throw new LocalHelperException(error.getErrMessage(), error);
    }
}
