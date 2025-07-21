package com.ai.factory.util;

import java.io.*;
import java.nio.file.Path;

public class ExpandPromptPack {

    public static String loadExpandPrompt(String path){
        File file = new File(path);
        //校验是否为文件
        if (!file.isFile()){
            return "";
        }
        //校验类型
        if (!file.getName().endsWith(".txt")){
            return "";
        }
        //读取文件
        try (BufferedReader bufferedReader = new BufferedReader(new FileReader(file))){
            StringBuilder content = new StringBuilder();
            String line;

            while ((line = bufferedReader.readLine()) != null){
                content.append(line).append("\n");
            }
            return content.toString();
        } catch (IOException e) {
            e.printStackTrace();
            return "";
        }
    }

}
