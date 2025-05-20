package com.ai.service.impl;

//import com.ai.mapper.ChatMapper;
import com.ai.mapper.ChatDetailMapper;
import com.ai.mapper.ChatMapper;
import com.ai.model.po.Chat;
import com.ai.model.po.ChatDetail;
import com.ai.model.vo.ChatListVo;
import com.ai.service.ChatHistoryService;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.conditions.query.LambdaQueryChainWrapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class InMemoryChatHistoryServiceImpl implements ChatHistoryService {

    //会话列表
    private final Map<String, List<String>> chatHistory = new HashMap<>();

    @Autowired
    private ChatMapper chatMapper;

    @Autowired
    private ChatDetailMapper  chatDetailMapper;

    @Value("${spring.ai.ollama.chat.model}")
    private String modelName;

    @Autowired
    private Environment env;  // 获取实时配置文件

    //TODO 改造为存储到数据库
    @Override
    public void save(String type, String chatId, Integer sid) {
//        //如果会话列表中没有这个会话类型，则创建一个空的列表
//        if (!chatHistory.containsKey(type)){
//            chatHistory.put(type,new ArrayList<>());
//        }
//        List<String> chatIds = chatHistory.get(type);
//        //如果会话列表中已经存在这个会话ID，则不进行添加
//        if (chatIds.contains(chatId)){
//            return;
//        }
//        chatIds.add(chatId);

        //保存到数据库
        //判断是否存在
        if (chatMapper.selectOne(new LambdaQueryWrapper<Chat>().eq(Chat::getId,chatId)) != null){
            //已存在则跳过
            return;
        }
        Chat chat = new Chat();
        chat.setId(chatId);
        chat.setUserId(sid);
        chat.setModelName(env.getProperty("spring.ai.ollama.chat.model"));
        chat.setCreateTime(LocalDateTime.now());
        chatMapper.insert(chat);
    }

    @Override
    public List<ChatListVo> getChatIds(String type) {
        List<ChatListVo> chatListVos = new ArrayList<>();
        //获取会话id、创建时间、模型名
        List<Chat> chats = chatMapper.selectList(null);
        //获取会话首次提问的内容
        for (Chat chat : chats) {
            ChatListVo chatListVo = new ChatListVo();
            ChatDetail chatDetail = chatDetailMapper.selectOne(new LambdaQueryWrapper<ChatDetail>()
                    .eq(ChatDetail::getChatId, chat.getId()) // 根据chatId查询chatDetail
                    .eq(ChatDetail::getMessageType,"user")  //  只查询user类型的消息
                    .orderBy(true, true, ChatDetail::getId)  // 根据id升序排序
                    .last("LIMIT 1"));  // 只取一条数据
            //没有数据表示新会话
            if (chatDetail == null){
                chatListVo.setChatId(chat.getId());
                chatListVo.setChatName("新会话");
                chatListVo.setCreateTime(chat.getCreateTime());
                chatListVo.setModelName(chat.getModelName());
                chatListVos.add(chatListVo);
                continue;
            }
            chatListVo.setChatId(chat.getId());
            chatListVo.setChatName(chatDetail.getContent());
            chatListVo.setCreateTime(chat.getCreateTime());
            chatListVo.setModelName(chat.getModelName());
            chatListVos.add(chatListVo);
        }
        return chatListVos;
//        return chatHistory.getOrDefault(type, new ArrayList<>());
    }

    @Override
    public void deleteChatId(String type, String chatId) {
//        if (chatHistory.containsKey(type)){
//            List<String> chatIds = chatHistory.get(type);
//            if (chatIds.isEmpty()) {
//                chatHistory.remove(type);
//            }
//            chatIds.remove(chatId);
//        }
        //删除会话表
        chatMapper.deleteById(chatId);
        //删除会话信息表
        chatDetailMapper.delete(new LambdaQueryWrapper<ChatDetail>().eq(ChatDetail::getChatId,chatId));
    }

    @Override
    public void updateChatId(ChatListVo chatListVo) {
        if (chatListVo == null || chatListVo.getChatId() == null){
            return;
        }
        //根据请求体中具有的信息更新
        Chat chat = new Chat();
        chat.setId(chatListVo.getChatId());
        //模型名称
        if (chatListVo.getModelName() != null){
            chat.setModelName(chatListVo.getModelName());
            chatMapper.updateById(chat);
        }
        //创建时间
        if (chatListVo.getCreateTime() != null){
            chat.setCreateTime(chatListVo.getCreateTime());
            chatMapper.updateById(chat);
        }
    }
}
