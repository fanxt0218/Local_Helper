package com.ai.utils;

public class FilterResponse {

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

}
