<div align="center">

<h1>✨Local_Helper</h1>

</div>
<span align="center">
  <h2 align="center">🎉 欢迎下载项目 🎉</h2>
</span>

<div align="center">

<a href="https://github.com/fanxt0218/Local_Helper" style="text-decoration: none">
  <img height="23" src="https://img.shields.io/badge/_-GitHub-blue?logo=github&labelColor=grey" alt="GitHub">
</a>
<a href="https://gitee.com/fan_xt/local_helper" style="text-decoration: none">
  <img height="23" src="https://img.shields.io/badge/_-Gitee-red?logo=gitee&labelColor=grey" alt="Gitee">
</a>
<br>

![license](https://img.shields.io/github/license/fanxt0218/Local_Helper?)
![code_size](https://img.shields.io/github/languages/code-size/fanxt0218/Local_Helper)
![code_size](https://img.shields.io/github/repo-size/fanxt0218/Local_Helper)
![version](https://img.shields.io/github/v/release/fanxt0218/Local_Helper)
![last_commit](https://img.shields.io/github/last-commit/fanxt0218/Local_Helper)

<hr>
</div>

#### 介绍
<h5>🎉支持本地大模型的可视化应用</h5>
<h6>在这里，您的数据和隐私将绝对安全且隐蔽</h6>
---> 我们在将大模型部署到本地后，是否会因为命令行界面而感到不方便呢？<br>
---> 💻本项目作为一个轻量级本地大模型调用框架搭建的可视化本地对话应用，<br>
---> 🚀从此大家只需要拉取模型，或者将训练后的模型导入到ollama，直接使用该应用即可实现本地模型的调用，从此告别排队！<br>
---> 🍰项目已经开源至gitee、github👇<br>

![Github](https://img.shields.io/badge/_GitHub-blue?logo=github&labelColor=grey&link=https://gitee.com/fan_xt/Local_Helper)
<span font-size="40px">
https://github.com/fanxt0218/Local_Helper
</span><br>
<hr style="border: none; height: 0.2px">
<h5>● 如果您觉得该开源项目对您有帮助，请给该项目点个star，谢谢！🌟</h5>
<hr style="border: none; height: 0.2px">

更详细的发开介绍 -->👉 <a href="https://blog.csdn.net/2402_84949062?spm=1011.2266.3001.5343">CSDN:Fanxt_Ja</a>  <--请访问我的主页

#### 更新日志
请关注更新日志: <a href="https://gitee.com/fan_xt/local_helper/blob/local_helper-v2.0.0/update_log.txt">Local_Helper更新日志</a>

#### 软件架构◪
Java语言基于Springboot框架进行开发，软件集成Spring AI框架，持久层框架mybatis- plus
#### 界面效果

<img alt="img_3.png" height="350" src="local_helper_client/src/main/resources/static/imgs/主界面.png" width="700"/>

#### 安装教程〄

1.  <h6>将项目克隆到本地</h6>
    github:  `git clone https://github.com/fanxt0218/Local_Helper.git`<br>
    gitee:  `git clone https://gitee.com/fan_xt/Local_Helper.git` 
2.  <h6>启动ollama服务</h6>
    `ollama serve #默认启动`
3.  <h6>点击启动即可</h6>
    <span color="red">须确保JDK版本>=17.0.5</span>

#### 快速演示 ⚡
<div align="center">

![功能演示](local_helper_client/src/main/resources/static/imgs/local_helper使用教程1.gif)
![功能演示](local_helper_client/src/main/resources/static/imgs/local_helper使用教程2.gif)


</div>

#### 使用说明☼🎁

* 首次运行
  * 确保JDK版本>=17<br>
    `java -version`
  * 编译项目<br>
    `mvn clean install`
  * 更改数据库配置<br>
    - 将数据路连接信息改为你的数据库信息
    [../local_helper_client/src/main/resources/application.properties]<br>
    [../mcp-server/src/main/resources/application.properties]
  * 执行SQL脚本
    [../doc/local_helper_init.sql]
  * 启动项目
    - 先启动MCP-Server
    - 再启动Local_Helper_Client
    - 访问地址: http://localhost:1618
* 切换模型
  * 点击界面右上角的模型名称(首次启动为:please choice model)<br>
    点击不同的模型即可实现切换
* 会话
  * 新建会话
    * 界面左侧侧边栏右上角有一个加号<br>
          点击即可新建会话
    * 刷新界面直接发送消息同样可以实现新建会话
  * 切换会话
    * 点击界面左侧侧边栏的会话框即可切换
  * 删除会话
    * 点击界面左侧侧边栏会话框中的删除按钮即可删除
* 发送消息
  * 点击界面输入框并输入内容<br>
    --点击发送--
* 上传附件
  * 点击输入框中的回形针图标
    弹出文件资源管理器后，点击文件即可上传附件
  * 粘贴文件同样能实现上传
    * 文件预览
      * 点击已经上传的文件，会自动预览文件
      * 不支持预览的文件会提供下载按钮
  * 注意
    * 仅支持常见的文件格式(请关注提示)
    * 单个文件大小不能超过10M
    * 多模态文件(例如图片、视频、音频文件)需要确保你的模型支持多模态，否则无法正常响应
* 可选功能
  * 深度思考(think)
    * 点击界面中“深度思考”按钮
    * 【所有模型均支持】
    * 可能会影响模型响应质量(建议开启)
  * 联网搜索(search)
    * 点击界面中“联网搜索”按钮
    * 【特定模型支持(tools)】
    * 需要手动配置MCP服务中的密钥，默认不配置，请手动开启--mcp-server/src/main/java/com/ai/MCPServerApplication.java
  * 工具调用(MCP)
    * 点击界面中“MCP”按钮
    * 【特定模型支持(tools)】
    * 系统自带的工具服务，目前支持天气查询、IP查询，如果需要使用，请自行配置密钥(已经配置的密钥为作者本人所有,可以替换)
* 设置
  * 点击侧栏右下角的设置按钮打开设置弹窗
  * 通用设置
    * 主题模式
      * 浅色模式(颜色更亮，适合白天)
      * 夜间模式(夜间使用，保护眼睛)
    * 字体大小
      * 分为[大、中、小]三种，点击即可切换
    * 清理缓存
      * 点击即可清理缓存(清理已经上传的文件，不影响会话以及模型的记忆)
  * 系统设置
    * Ollama服务地址
      * 在这里可以切换Ollama服务地址，默认为http://127.0.0.1:11434
  * 模型设置
    * 温度(Temperature)
      * 温度值越高，模型的输出就越随机，适合创作类任务，反之则越确定，适合技术文档生成。 
      * 默认值: 0.7  
    * 最大生成长度(Max Tokens)
      * 模型一次生成的最大长度，单位为 token，一个中文字符对应 2 个 token。
      * 默认值: 2048
    * 系统提示词(System Prompt)
      * 系统提示词是模型的初始提示词，影响模型的行为和输出风格。可以根据需要进行调整。
    * top-p
      * top-p 采样是另一种控制生成文本多样性的方法。它通过限制模型选择的词汇范围来实现。Nucleus 采样，从累积概率超过阈值的候选词中随机选择。与 temperature 配合，控制候选词范围。
      * 默认值: 1.0
    * top-k
      * top-k 采样通过限制模型每次生成时考虑的候选词数量来控制输出的多样性。较高的 top-k 值会使输出更具创造性，较低的值则会使输出更具确定性。仅从概率最高的前 K 个词中采样，减少随机性，提高稳定性。
      * 默认值: 40
  * MCP设置
    * 这个设置项可以实现连接自定义MCP Server并使用 
    * 添加MCP
      * 点击添加按钮
      * 填写MCP服务地址以及可能存在的endpoint(一般是用于配置密钥)
      * 点击添加
      * 注意
        * url+endpoint请保证为完整的路径，系统不会自动补全“/” 
        * 添加成功后，请重新启动项目
    * 删除MCP
      * 点击删除按钮
      * 删除成功后，请重新启动项目
    * 启/禁用MCP
      * 点击滑动控件即可实现启/禁用MCP
* 自定义扩展
  * 你可以尝试自己增加MCP工具
  * 你可以尝试更改项目代码以支持其他的服务商
* 一些特性
  * 在单个会话中你可以频繁地切换不同的模型，新的模型会继承该会话历史

[//]: # (    <img alt="img_1.png" height="350" src="local_helper_client/src/main/resources/static/imgs/模型设置.png" width="500"/>)


### 注意 📍
<h5>● 所有的上传的文件全部在本地处理，我们不会存储任何文件</h5>
<h5>● 如果要使用mcp服务请先在mcp-server模块中配置相关配置</h5>
<h5>● 通过转发端口使用ollama服务速度可能较慢，尤其是参数较大的模型</h5>
<h5>● 在启用mcp发送请求时，控制台可能会出现Bad Request错误，这是因为您使用的模型比较冷门并且不支持tools，关于这点您可以联系我们或者自行修改项目对应位置</h5>
<h5>● 调用mcp工具时，请尽量选择参数稍大的模型，避免不佳的使用体验</h5>
<h5>● 如果在使用过程中修改了服务地址，那么请先重启服务</h5>
<h5>● 模型参数设置等能够在客户端进行修改的设置项，请尽量不要直接在配置文件中进行修改，以免造成数据不一致的情况</h5>
<h5>● 由于项目仍在初期阶段，许多功能仍未完善</h5>
<hr style="border: none; height: 0.2px">
♥项目会不断改进和维护，希望大家多多支持♥
<hr style="border: none; height: 0.2px">

#### 🤝参与贡献✉

1.  **该项目由gitee快乐哦呜所属**
2.  **如若在使用过程中遇到bug，请在gitee或github提出您的建议**
3.  **想要参与对项目的开发和完善，请联系我，或以PR的方式贡献代码**
4.  **作者学生党,望大家多多支持**
5.  **开发者CSDN账号：Fanxt_Ja**
<div align="center">
<a href="https://blog.csdn.net/2402_84949062?type=blog" style="text-decoration: none">
  <img height="23" src="https://img.shields.io/badge/_CSDN-blue?logo=csdn&labelColor=black&link=https://blog.csdn.net/2402_84949062?type=blog" alt="GitHub">
</a>
<a href="https://github.com/fanxt0218/Local_Helper" style="text-decoration: none">
  <img height="23" src="https://img.shields.io/badge/_-GitHub-blue?logo=github&labelColor=grey" alt="GitHub">
</a>
<a href="https://gitee.com/fan_xt/Local_Helper" style="text-decoration: none">
  <img height="23" src="https://img.shields.io/badge/_-Gitee-red?logo=gitee&labelColor=grey" alt="Gitee">
</a>
</div>
<hr>

[//]: # (<img alt="img.png" height="400" src="local_helper_client/src/main/resources/static/imgs/关于我们.png" width="550"/>)
