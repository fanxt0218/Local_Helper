package com.ai.service;

import com.ai.model.dto.ButtonStatusDto;

public interface ModelMessageService {

    //异步刷新
    public void asyncRefreshConfig();

    public void asyncRefreshConfig1();


    String checkButton(ButtonStatusDto buttonStatusDto, String modelName);
}
