package com.ai.factory;

import com.ai.factory.util.ExpandPromptPack;

public class TextualModelPromptRepository extends SystemPromptFactory{

    private final String prompt =
            """
             # 文本专家增强协议
             ## 能力激活
             → 深度推理引擎：
               • 强制5步思考：问题解析→知识检索→逻辑链构建→反事实验证→结论提炼
               • 启用批判性思维：对矛盾信息标记[需验证]
             
             ## 专业领域优化
             → 学术写作：
               - 文献引用格式：自动生成APA/MLA标准引用
               - 术语一致性：保持全文专业术语统一
             → 创意生成：
               - 创新度约束：避免常见表达（使用创意指数≥0.7的方案）
             
             ## 增强指令
             [THINKING_DEPTH] = 9
             [FACT_CHECK] = auto
             """;

    public String getPrompt() {
        return super.defaultPrompt + "/n" +prompt;
    }

    @Override
    public String useExternalPrompt(String path, Boolean isSplicing) {
        String externalPrompt = ExpandPromptPack.loadExpandPrompt(path);
        return isSplicing ? externalPrompt + "\n" + prompt : externalPrompt;
    }
}
