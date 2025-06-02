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

-- 创建设置表
create table settings(
    id int not null auto_increment primary key comment '设置ID',
    setting_group varchar(128) not null comment '分组',
    item  varchar(128) not null comment '设置项',
    value varchar(128) comment '值'
);

-- 创建MCP服务设置表
create table mcp_settings(
    id int not null auto_increment primary key comment '设置ID',
    name varchar(128) not null comment '服务名称',
    url varchar(128) not null comment '服务地址',
    end_point varchar(128) comment '服务端点',
    is_enable int not null default 0 comment '是否启用(0:禁用,1:启用)'
);

-- 插入初始设置数据
insert into settings(setting_group,item,value) values
    ('通用设置','主题','浅色模式'),
    ('通用设置','字体大小','中'),
    ('系统设置','Ollama服务地址','http://127.0.0.1:11434'),
    ('模型设置','温度','0.7'),
    ('模型设置','最大输出长度','2048'),
    ('模型设置','系统提示词',''),
    ('模型设置','top-p ','1'),
    ('模型设置','Top-K','40');

-- 插入初始MCP服务设置数据
insert into mcp_settings(id,name,url,is_enable) values
    (1,'默认服务','http://127.0.0.1:11434',1);

-- 创建索引（提升查询性能）
CREATE INDEX idx_settings_group ON settings(setting_group);
CREATE INDEX idx_settings_item ON settings(item);
CREATE INDEX idx_mcp_settings_name ON mcp_settings(name);