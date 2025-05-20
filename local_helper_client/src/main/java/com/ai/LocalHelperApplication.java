package com.ai;


import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.ai.mapper")
public class LocalHelperApplication {

    public static void main(String[] args) {
        SpringApplication.run(LocalHelperApplication.class, args);
    }

}
