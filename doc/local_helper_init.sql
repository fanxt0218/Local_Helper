/*该执行脚本用于初始化项目*/
-- 创建数据库
CREATE DATABASE IF NOT EXISTS local_helper
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_0900_ai_ci;

USE local_helper;

-- 用户表（逻辑外键关联）
CREATE TABLE IF NOT EXISTS user (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
    user_name VARCHAR(255) NOT NULL UNIQUE COMMENT '用户名'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 会话表（逻辑外键关联）
CREATE TABLE IF NOT EXISTS chat (
    id char(32)  PRIMARY KEY COMMENT '会话ID',
    user_id INT NOT NULL COMMENT '用户ID（逻辑关联user.id）',
    model_name VARCHAR(50) NOT NULL COMMENT '模型名称',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 会话详情表（逻辑外键关联）
CREATE TABLE IF NOT EXISTS chatdetail (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '详情ID',
    chat_id char(32) NOT NULL COMMENT '会话ID（逻辑关联chat.id）',
    message_type ENUM('user', 'assistant', 'system','tool') NOT NULL COMMENT '内容类型',
    content TEXT NOT NULL COMMENT '会话内容'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 创建索引（提升查询性能）
CREATE INDEX idx_chat_user ON chat(user_id);
CREATE INDEX idx_chatdetail_chat ON chatdetail(chat_id);