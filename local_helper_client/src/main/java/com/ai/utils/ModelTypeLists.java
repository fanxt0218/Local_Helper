package com.ai.utils;

import java.util.ArrayList;
import java.util.List;

public class ModelTypeLists {

    //支持工具调用模型列表
    public final static ArrayList<String> SupportToolsModelNames = new ArrayList<>(List.of("qwen3","llama3.1","llama3.2","mistral","qwen2.5","qwen2.5-coder","qwen2","llama3.3","mistral-nemo","qwq","mistral-small","smollm2","mixtral","llama4","command-r","hermes3"
                                                                                               ,"phi4-mini","granite3.3","devstral","magstral","mistral-small3.1","cogito","mistral-large","granite3.2-vision","command-a","command-r7b-arabic"
                                                                                               ,"command-r-plus","granite3.2","granite3-dense","nemotron-mini","sthene-v2","nemotron","llama3-groq-tool-use","aya-expanse","granite3-moe","command-r7b","mistral-small3.2","firefunction-v2"));

    //支持多模态模型列表
    public final static ArrayList<String> SupportMultiModalModelNames = new ArrayList<>(List.of("llama4","gemma3","qwen2.5vl","mistral-small3.1","llava","llama3.2-vision","minicpm-v","moondream","vision"));

    //深度思考模型列表
    public final static ArrayList<String> ThinkingModelNames = new ArrayList<>(List.of("deepseek","qwen3","magistral"));
}
