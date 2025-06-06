package com.ai.mcpserver.util;

public class getOperatingSystemType {

    public static String getOperatingSystem() {
        String os = System.getProperty("os.name").toLowerCase();
        if (os.contains("win")) {
            return "Windows";
        } else if (os.contains("mac")) {
            return "MacOS";
        } else if (os.contains("nix") || os.contains("nux") || os.contains("aix")) {
            return "Linux/Unix";
        }
        return "Unknown";
    }
}
