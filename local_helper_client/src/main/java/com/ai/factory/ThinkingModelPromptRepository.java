package com.ai.factory;

public class ThinkingModelPromptRepository extends SystemPromptFactory{

    private static final String prompt = "";

    public String getPrompt() {
        return super.defaultPrompt + "/n" + prompt;
    }
}
