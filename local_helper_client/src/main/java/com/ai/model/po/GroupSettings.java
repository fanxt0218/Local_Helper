package com.ai.model.po;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GroupSettings {

    //设置分组名称
    private String settingGroup;

    //设置项
    private List<Item> items;
}
