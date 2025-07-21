package com.ai.exception;

public class LocalHelperException extends RuntimeException{

    private String errMessage;

    public LocalHelperException(){}

    public LocalHelperException(String errMessage){
        super(errMessage);
        this.errMessage = errMessage;
    }

    public String getErrMessage(){
        return errMessage;
    }

    public void setErrMessage(String errMessage){
        this.errMessage = errMessage;
    }

    public static void cast(String message){
        throw new LocalHelperException(message);
    }

    public static void cast(CommonError error){
        throw new LocalHelperException(error.getErrMessage());
    }
}
