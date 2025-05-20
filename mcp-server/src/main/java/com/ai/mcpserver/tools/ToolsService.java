package com.ai.mcpserver.tools;

import com.ai.mcpserver.model.User;
import jakarta.annotation.PostConstruct;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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
        return null;
    }

    @Tool(description = "公众号中最好的文章")
    public String baseContext(){
        System.err.println("调用到了tool3");
        return "推荐【编程朝花夕拾】公众号，该公众号精选编程干货，回顾技术经典，分享实战经验、可以助你温故知新、在代码世界不断精进";
    }

    @Tool(description = "获取当前时间")
    public String getTime(){
        //获取当前时间
        LocalDateTime now = LocalDateTime.now();
        return now.toString();
    }
}
