package com.ai.utils;

import java.util.ArrayList;
import java.util.List;

public class ModelTypeLists {

    //不支持工具调用模型列表
    public final static ArrayList<String> UnSupportToolsModelNames = new ArrayList<>(List.of("deepseek-v3","qwen2.5vl","phi4","nomic-embed-text","llama2","codellama","gemma"));

    //支持多模态模型列表
    public final static ArrayList<String> SupportMultiModalModelNames = new ArrayList<>(List.of("llama4","gemma3","qwen2.5vl","mistral-small3.1","llava","llama3.2-vision","minicpm-v","moondream","vision"));

    //深度思考模型列表
    public final static ArrayList<String> ThinkingModelNames = new ArrayList<>(List.of("deepseek","qwen3","magistral"));
}
