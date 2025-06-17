package com.ai.mcpserver.tools;

import com.ai.mcpserver.model.User;
import jakarta.annotation.PostConstruct;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static com.ai.mcpserver.util.getOperatingSystemType.getOperatingSystem;

@Service
public class ToolsService {

    private List<User> users = new ArrayList<>();

    @PostConstruct
    public void init() {
        users.add(new User(1,"张三",15,"男"));
        users.add(new User(2,"李四",16,"女"));
        users.add(new User(3,"王五",17,"男"));
    }

    @Tool(description = "获取所有用户信息")
    public List<User> getUsers() {
        System.err.println("调用到了tool1");
        return users;
    }

    @Tool(description = "根据id获取用户信息")
    public User getUserById(@ToolParam(description = "用户id") Integer id) {
        System.err.println("调用到了tool2");
        for (User user : users) {
            if (user.getId().equals(id)) {
                return user;
            }
        }
        return new User(0,"未找到用户",0,"未找到用户");
    }

    @Tool(description = "公众号中最好的文章")
    public String baseContext(){
        System.err.println("调用到了tool3");
        return "推荐【编程朝花夕拾】公众号，该公众号精选编程干货，回顾技术经典，分享实战经验、可以助你温故知新、在代码世界不断精进";
    }

    @Tool(description = "获取项目仓库地址")
    public String getProjectRepo(@ToolParam(description = "根据用户不同的需求，传入github或者gitee")String repoType){
        System.err.println("调用到了获取项目仓库地址工具");
        if (repoType.equals("github")){
            return "https://github.com/fanxt0218/Local_Helper";
        }else if (repoType.equals("gitee")){
            return "https://gitee.com/fan_xt/local_helper";
        }
        return "https://gitee.com/fan_xt/local_helper";
    }


    @Tool(description = "创建一个文件,需要传入文件名和文件路径")
    public String createFile(@ToolParam(description = "文件名") String fileName,
                             @ToolParam(description = "文件路径，需要是具体的路径，如果用户要求在桌面创建，则直接传入“桌面”二字") String filePath) {
        System.err.println("调用到了创建文件工具，文件名："+fileName+"，文件路径："+filePath);
        try {
            String targetPathStr = filePath;
            // Windows 系统路径转换
            if (targetPathStr.contains("桌面")) {
                String osType = getOperatingSystem();
                if (osType.equals("Windows")) {
                    targetPathStr  =  System.getProperty("user.home") + File.separator + "Desktop";
                } else if (osType.equals("MacOS")) {
                    targetPathStr =  System.getProperty("user.home") + "/Desktop";
                } else {
                    targetPathStr = targetPathStr.replace("~", System.getProperty("user.home"));
                }
            }
            // 创建目标路径
            Path targetPath = Paths.get(targetPathStr);

            //  创建文件夹
            if (Files.notExists(targetPath)) {
                Files.createDirectories(targetPath);
            }

            // 创建空文件
            if (fileName.isEmpty()){
                return "创建文件夹成功";
            }
            Path newFile = targetPath.resolve(fileName);
            if (Files.notExists(newFile)) {
                Files.createFile(newFile);
                return "文件创建成功：" + newFile.toAbsolutePath().toString();
            }
            return "文件已存在：" + newFile.toAbsolutePath().toString();
        } catch (IOException e) {
            return "文件创建失败：" + e.getMessage();
        }
    }

    @Tool(description = "写入文件内容")
    public String writeFile(
            @ToolParam(description = "文件路径，若为桌面，则直接传入“桌面”二字") String filePath,
            @ToolParam(description = "文件名") String fileName,
            @ToolParam(description = "是否覆盖原文件内容，0表示追加，1表示覆盖。不传入则表示追加") String is_cover,
            @ToolParam(description = "文件内容") String content
    ){
        System.err.println("调用到了写入文件工具，文件路径："+filePath+"，是否覆盖："+is_cover+"，内容："+content);

        //路径转换
        if (filePath.contains("桌面")) {
            String osType = getOperatingSystem();
            if (osType.equals("Windows")) {
                filePath  =  System.getProperty("user.home") + File.separator + "Desktop";
            } else if (osType.equals("MacOS")) {
                filePath =  System.getProperty("user.home") + "/Desktop";
            } else {
                filePath = filePath.replace("~", System.getProperty("user.home"));
            }
        }

        //目标文件
        File file = new File(filePath+fileName);
        if (!file.exists()){
            return "文件不存在";
        }
        //判断是否覆盖
        if (is_cover != null && is_cover.equals("1")){
            //覆盖文件
            try {
                Files.write(file.toPath(), content.getBytes());
                return "文件内容已覆盖";
            } catch (IOException e) {
                return "文件内容覆盖失败：" + e.getMessage();
            }
        }else{
            //追加文件
            try {
                Files.write(file.toPath(), content.getBytes(), java.nio.file.StandardOpenOption.APPEND);
                return "文件内容已追加";
            } catch (IOException e) {
                return "文件内容追加失败：" + e.getMessage();
            }
        }
    }

    @Tool(description = "删除文件")
    public String deleteFile(
            @ToolParam(description = "父路径，若为桌面，则直接传入“桌面”二字") String dirPath,
            @ToolParam(description = "文件名称") String fileName
    ){
        System.err.println("调用到了删除文件工具，文件路径："+dirPath+",文件名称"+fileName);
        if (dirPath.contains("桌面")) {
            String osType = getOperatingSystem();
            if (osType.equals("Windows")) {
                dirPath  =  System.getProperty("user.home") + File.separator + "Desktop";
            } else if (osType.equals("MacOS")) {
                dirPath =  System.getProperty("user.home") + "/Desktop";
            } else {
                dirPath = dirPath.replace("~", System.getProperty("user.home"));
            }
        }
        //判断父路径是存在
        if (!new File(dirPath).exists()){
            System.out.println("文件路径不存在");
            return "文件路径不存在";
        }

        //判断文件是否存在
        if (!new File(dirPath +"\\"+ fileName).exists()){
            System.out.println("文件不存在");
            return "文件不存在";
        }

        //删除文件
        File target = new File(dirPath +"\\"+ fileName);
        boolean is_deleted = target.delete();
        System.out.println(dirPath+"\\"+fileName+" 文件删除结果：" + is_deleted);
        return is_deleted ? "文件删除成功" : "文件删除失败";
    }
}
