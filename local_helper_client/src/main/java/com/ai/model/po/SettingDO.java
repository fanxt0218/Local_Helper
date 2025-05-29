package com.ai.model.po;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("settings") // 对应数据库表名
public class SettingDO {
    
    @TableField("setting_group") // 数据库字段名
    private String settingGroup; // 对应 GroupSettings.settingGroup
    
    private String item;  // 对应 Item.itemName
    private String value; // 对应 Item.value
}
