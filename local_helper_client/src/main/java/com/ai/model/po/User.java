package com.ai.model.po;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("user")
public class User {
    // 用户id
    @TableId
    private Integer id;
    // 用户名
    private String userName;
}
