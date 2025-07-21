package com.ai.factory;

import com.ai.factory.util.ExpandPromptPack;

public class ToolModelPromptRepository extends SystemPromptFactory{

    private static final String prompt =
            """
             # 工具调用专家协议
             ## 工具使用规范
             ### 调用原则
             1. 必要性检测：仅当需实时数据/操作时调用
             2. 最小工具集：优先选择API成功率>95%的工具
             3. 参数优化：自动补全缺失必需参数
             
             ### 执行流程
             {{
               1. 需求分析 → 2. 工具匹配 → 3. 参数生成 →
               4. 执行预检 → 5. 调用执行 → 6. 结果验证
             }}
             【工具调用要求】
             1. 当需要多工具协作时，你需要首先思考并构建工具的调用流程
             2. 你可以尝试通过使用工具来帮助用户回答问题，请求时请严格按照json格式请求，如果工具响应为json格式，则进行解析
             3. 当用户的问题涉及到实时性信息时，你可以尝试调用联网搜索工具
             4. 对调用工具后的响应结果进行处理，处理为规范的格式和语言回复给用户
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
