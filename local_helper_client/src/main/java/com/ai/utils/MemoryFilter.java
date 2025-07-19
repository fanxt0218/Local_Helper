package com.ai.utils;

import com.ai.mapper.ChatDetailMapper;
import com.ai.model.po.ChatDetail;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

public class MemoryFilter {

    //过滤记忆
    public static List<ChatDetail> filterMemory(ChatDetailMapper chatDetailMapper, LambdaQueryWrapper<ChatDetail> wrapper, String modelName) {
        List<ChatDetail> chatDetails = null;
        for (String thinkingModel : ModelTypeLists.ThinkingModelNames){
            if (modelName.contains(thinkingModel)){
                wrapper
                        .orderByDesc(ChatDetail::getId)
                        .last("LIMIT 50");    //TODO 根据不同参数量模型设置不同的阈值
                chatDetails = chatDetailMapper.selectList(wrapper);
                Collections.reverse(chatDetails);
                break;
            }
        }
        if (null == chatDetails){
            chatDetails = chatDetailMapper.selectList(wrapper);
        }
        return chatDetails;
    }
}
