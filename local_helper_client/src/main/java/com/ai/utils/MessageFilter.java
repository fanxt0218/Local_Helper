package com.ai.utils;

import org.springframework.stereotype.Component;

@Component
public class MessageFilter {

        /**
         * 过滤掉响应中最前面的 #tag 类型标签
         * @param response 原始响应文本
         * @return 过滤后的响应文本
         */
        public static String filterLeadingTag(String response) {
            if (response == null || response.isEmpty()) {
                return response;
            }

            // 使用正则表达式匹配开头的 #tag 格式内容
            return response.replaceAll("^<think>[\\s\\S]*?<\\/think>\\s*","");

        }

        //  过滤用户消息
        public static String filterUserMessage(String input) {
            final String MARKER = "【用户消息】:";
            int index = input.indexOf(MARKER);

            if (index != -1) {
                // 截取标识符后的内容（包含处理换行符）
                return input.substring(index + MARKER.length()).trim();
            }
            return input;
        }

}
