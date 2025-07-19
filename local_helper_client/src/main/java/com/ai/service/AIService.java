package com.ai.service;

import com.ai.model.po.ChatDetail;

public interface AIService {

    void sendToUser(String message);


    String getSystemPrompt(String modelName);
}
