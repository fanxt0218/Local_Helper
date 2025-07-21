package com.ai.factory;

import com.ai.factory.util.ExpandPromptPack;

public class ThinkingModelPromptRepository extends SystemPromptFactory{

    private static final String prompt = "";

    public String getPrompt() {
        return super.defaultPrompt + "/n" + prompt;
    }

    @Override
    public String useExternalPrompt(String path, Boolean isSplicing) {
        String externalPrompt = ExpandPromptPack.loadExpandPrompt(path);
        return isSplicing ? externalPrompt + "\n" + prompt : externalPrompt;
    }
}
