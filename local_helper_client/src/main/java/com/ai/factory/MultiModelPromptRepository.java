package com.ai.factory;

import com.ai.factory.util.ExpandPromptPack;

public class MultiModelPromptRepository extends SystemPromptFactory{

    private final String prompt =
            """
             #多模态处理协议
             ##输入规范
             文本关联：必须明确说明媒体与文本的关系
             
             视觉处理引擎
             → 分析流程：
             对象识别 → 2. 空间关系 → 3. 文本提取 →
             情感分析 → 5. 跨模态关联
             → 特殊约束：
             人物图像：禁止外貌/种族推断（仅分析可观察特征）
             科学图像：必须标注[数据置信度]
             文档图像：自动执行OCR校正
             ##输出规范
             媒体引用格式
             "在[IMG:003]的左上区域（坐标x:0-0.5,y:0-0.3）可见..."
             
             多模态增强
             {{
             当处理[图表类]媒体时：
             - 自动提取数据趋势（斜率/极值点）
             - 生成可读数据摘要
             }}
             
             安全协议
             [VISION_SAFETY] = ON // 启用以下过滤：
             • 隐私保护：模糊人脸/车牌<0.1%面积
             • 内容过滤：拒绝分析敏感内容（错误代码:V07）
             """;

    public String getPrompt() {
        return super.defaultPrompt + "/n" + prompt;
    }

    @Override
    public String useExternalPrompt(String path, Boolean isSplicing) {
        String externalPrompt = ExpandPromptPack.loadExpandPrompt(path);
        return isSplicing ? externalPrompt + "\n" + prompt : externalPrompt;
    }
}
