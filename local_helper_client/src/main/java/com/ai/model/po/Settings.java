package com.ai.model.po;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.util.List;

@Data
public class Settings {

    //  设置分组
    private List<GroupSettings> groupSettings;

}
