package com.ai.model.po;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("chat")
public class Chat {
    //会话id
    @TableId
    private String id;

    //用户id
    private Integer userId;

    //模型名称
    private String modelName;

    //创建时间
    private LocalDateTime createTime;

}
