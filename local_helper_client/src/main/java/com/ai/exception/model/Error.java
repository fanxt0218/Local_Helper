package com.ai.exception.model;

import com.ai.exception.CommonError;
import com.baomidou.mybatisplus.annotation.EnumValue;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@TableName("error_log")
public class Error {

    @TableId
    //异常id
    private Long id;

    //异常信息
    private String errorMessage;

    @EnumValue
    //异常类型
    private Enum<CommonError> errorType;

    //触发异常时间
    private LocalDateTime errorTime;

    public Error(String errorMessage, Enum<CommonError> errorType) {
        this.errorMessage = errorMessage;
        this.errorType = errorType;
        this.errorTime = LocalDateTime.now();
    }

}
