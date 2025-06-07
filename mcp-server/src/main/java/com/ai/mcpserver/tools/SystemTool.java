package com.ai.mcpserver.tools;

import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Service;

import java.io.File;
import java.lang.management.ManagementFactory;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.time.LocalDateTime;

@Service
public class SystemTool {

    @Tool(description = "获取当前时间")
    public String getTime(){
        //获取当前时间
        LocalDateTime now = LocalDateTime.now();
        return now.toString();
    }

    @Tool(description = "获取当前操作系统及版本")
    public String getOSInfo() {
        return System.getProperty("os.name") + " " + System.getProperty("os.version");
    }

    @Tool(description = "获取CPU核心数")
    public int getCPUCores() {
        return Runtime.getRuntime().availableProcessors();
    }

    @Tool(description = "获取系统内存信息（单位：MB）")
    public String getMemoryInfo() {
        long maxMemory = Runtime.getRuntime().maxMemory() / (1024 * 1024);
        long totalMemory = Runtime.getRuntime().totalMemory() / (1024 * 1024);
        return String.format("最大内存: %dMB, 已分配内存: %dMB", maxMemory, totalMemory);
    }

    @Tool(description = "获取JVM版本")
    public String getJVMVersion() {
        return System.getProperty("java.version");
    }

    @Tool(description = "获取系统运行时间（单位：分钟）")
    public long getSystemUptime() {
        return ManagementFactory.getRuntimeMXBean().getUptime() / (1000 * 60);
    }

    @Tool(description = "获取本机IP地址")
    public String getLocalIP() {
        try {
            return InetAddress.getLocalHost().getHostAddress();
        } catch (UnknownHostException e) {
            return "无法获取IP地址";
        }
    }

    @Tool(description = "获取磁盘空间信息")
    public String getDiskSpace(@ToolParam(description = "磁盘路径，例如 C: 或 /") String path) {
        File root = new File(path);
        return String.format("总空间: %.2fGB, 可用空间: %.2fGB",
                root.getTotalSpace()/1e9,
                root.getFreeSpace()/1e9);
    }
}
