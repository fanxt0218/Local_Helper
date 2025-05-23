// 流式响应的js文件

const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const chatMessages = document.getElementById('chatMessages');
const connectionStatus = document.getElementById('connectionStatus');
const modelName = document.getElementById('modelName');
const modelDropdown = document.getElementById('modelDropdown');
let websocket;
let currentStreamingMessage = null;

let buffer = ''; // 用于处理跨分块的缓冲区
let isInThink = false; // 是否在思考块中
let thinkContainer = null; // 当前思考内容容器
let isResponsePending = false; // 新增响应状态标志
let sid = null; // 用户id


// 建立 WebSocket 连接
function connectWebSocket(sid) {
    const wsUrl = `ws://localhost:1618/ai/response/${sid}`;
    websocket = new WebSocket(wsUrl);

    websocket.onopen = function(event) {
        console.log('WebSocket 连接已建立');
        connectionStatus.textContent = '连接状态：已连接';
        connectionStatus.className = 'status connected';
    };

    websocket.onmessage = function(event) {
        const data = event.data;
    
        if (data === '<end>') {
            // 处理缓冲区剩余内容
            processBuffer(buffer, true);
            isResponsePending = false; // 新增状态标记
            buffer = '';
            clearLoading();
            currentStreamingMessage = null;
            return;
        }

        try {
            const response = JSON.parse(data);
            if (response.chat) {
                totalMessages += 1; // AI回复计数+1
                totalChars += response.chat.length; // AI回复字符数累加
                // // 实时检测
                // if (totalMessages >= 50 || totalChars >= 40) {
                //     document.getElementById('contextWarning').style.display = 'flex';
                // }

                buffer += response.chat;
                buffer = processBuffer(buffer, false);

                // 简化滚动判断逻辑
                requestAnimationFrame(() => {
                    const isNearBottom = chatMessages.scrollHeight - chatMessages.clientHeight 
                        <= chatMessages.scrollTop + 150;

                    if (isNearBottom) {
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                    }
                });
            }
        } catch (error) {
            isResponsePending = false;
            console.error('消息处理失败:', error);
        }
    };
    
    websocket.onerror = function(error) {
        isResponsePending = false; // 新增错误处理
        console.error('WebSocket 错误:', error);
        connectionStatus.textContent = '连接状态：错误';
        connectionStatus.className = 'status disconnected';
    };

    websocket.onclose = function(event) {
        isResponsePending = false; // 新增错误处理
        console.log('WebSocket 连接已关闭', event);
        connectionStatus.textContent = '连接状态：已断开';
        connectionStatus.className = 'status disconnected';
        // 可以在这里实现自动重连逻辑
        setTimeout(() => {
            connectWebSocket(sid); // 5秒后尝试重连
        }, 5000);
    };

    // 新增缓冲区处理函数
    function processBuffer(str, isFinal) {
        let remaining = str;

        while (remaining.length > 0) {
            if (!isInThink) {
                // 查找思考开始标签
                const thinkStart = remaining.indexOf('<think>');
                if (thinkStart === -1) {
                    // 没有思考标签，直接输出全部内容
                    appendToMainContent(remaining);
                    remaining = '';
                } else {
                    // 输出思考标签前的内容
                    if (thinkStart > 0) {
                        appendToMainContent(remaining.substring(0, thinkStart));
                    }
                    // 进入思考模式
                    isInThink = true;
                    createThinkContainer();
                    remaining = remaining.substring(thinkStart + 7); // 7是<think>的长度
                }
            } else {
                // 查找思考结束标签
                const thinkEnd = remaining.indexOf('</think>');
                if (thinkEnd === -1) {
                    // 没有结束标签，全部作为思考内容
                    appendToThinkContent(remaining);
                    remaining = '';
                } else {
                    // 添加结束标签前的内容
                    appendToThinkContent(remaining.substring(0, thinkEnd));
                    // 关闭思考容器
                    closeThinkContainer();
                    remaining = remaining.substring(thinkEnd + 8); // 8是</think>的长度
                    isInThink = false;
                }
            }
        }

        // 如果是最终块但仍有未关闭的思考标签
        if (isFinal && isInThink) {
            closeThinkContainer();
            isInThink = false;
        }

        return remaining; // 返回未处理的内容（用于跨分块情况）
    }

    // 创建思考内容容器
    function createThinkContainer() {
        thinkContainer = document.createElement('div');
        thinkContainer.className = 'think-message';
        if (currentStreamingMessage) {
            currentStreamingMessage.appendChild(thinkContainer);
        } else {
            createNewMessageContainer();
            currentStreamingMessage.appendChild(thinkContainer);
        }
    }

    // 关闭思考容器并创建新消息容器
    function closeThinkContainer() {
        thinkContainer = null;
        // 创建新的消息容器用于后续内容
        if (!currentStreamingMessage) {
            createNewMessageContainer();
        }
    }

    // 追加内容到正文
    function appendToMainContent(text) {
        if (!text) return;

        if (!currentStreamingMessage) {
            createNewMessageContainer();
        }

        // 如果当前在思考容器中但收到正文内容，需要关闭思考容器
        if (thinkContainer) {
            closeThinkContainer();
            isInThink = false;
        }

        const content = document.createElement('span');
        content.innerHTML = formatContent(text); // 使用格式化函数处理内容
        currentStreamingMessage.appendChild(content);
    }

    // 追加内容到思考容器
    function appendToThinkContent(text) {
        if (!text || !thinkContainer) return;

        const content = document.createElement('span');
        content.innerHTML = formatContent(text); // 调用格式转换
        thinkContainer.appendChild(content);
    }

    // 创建新消息容器
    function createNewMessageContainer() {
        currentStreamingMessage = document.createElement('div');
        currentStreamingMessage.classList.add('message', 'ai-message');
        chatMessages.appendChild(currentStreamingMessage);
    }
}

// 在全局变量区域新增会话id
let currentChatId = null;
let isSending = false;
let currentMessage = []; // 新增当前消息变量
async function sendMessage() {
    if (!currentChatId) {
        // 自动创建新会话
        currentChatId = 'chat_'+ Math.random().toString(36).substr(2, 9);
        await fetch(`http://localhost:1618/ai/history/chat/${currentChatId}/${sid}`, {
            method: 'POST'
        });
        loadChatHistory(); // 刷新会话列表
    }
    if (isSending) return;
    
    currentStreamingMessage = null; // 重置引用
    createLoadingMessage(); // 创建加载动画

    const message = messageInput.value.trim();
    if (!message || !message.replace(/\s/g, '').length) {
        alert('不能发送空白内容');
        clearLoading();
        return;
    }


    isSending = true;
    isResponsePending = true; // 新增状态标记
    sendButton.disabled = true;

    addMessage(message, 'user-message');
    messageInput.value = '';

    try {
        if (websocket?.readyState === WebSocket.OPEN) {
            // 发送包含会话ID的消息结构
            websocket.send(JSON.stringify({
                chatId: currentChatId,
                message: message,
                sid: sid,
                // 三个按钮状态字段
                deepThinkButtonStatus: buttonStates.deepThinkButtonStatus,
                webButtonStatus: buttonStates.webButtonStatus,
                mcpButtonStatus: buttonStates.mcpButtonStatus,
                fileIds: uploadedFileIds, // 文件ID列表    
            }));

            uploadedFileIds = [];
            uploadedFiles.forEach(file => file.element.remove());
            uploadedFiles = [];
            document.getElementById('fileList').innerHTML = '';
        }
        //立即检测并显示警告
        const contextWarning = document.getElementById('contextWarning');
        if (totalMessages >= 50 || totalChars >= 4000) {
            contextWarning.style.display = 'flex';
        }
    } catch (error) {
        console.error('发送失败:', error);
        addMessage('消息发送失败', 'ai-message');
        isResponsePending = false; // 新增错误处理
        clearLoading();
    }

    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 新增清除加载状态方法
function clearLoading() {
    const loadingMessages = chatMessages.getElementsByClassName('loading-message');
    while (loadingMessages.length > 0) {
        loadingMessages[0].remove();
    }
    isSending = false;
    sendButton.disabled = false;
}

// 添加消息到聊天窗口
function addMessage(text, className) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', className);
    
    // 仅转换AI消息，用户消息保持原样
    messageElement.innerHTML = className === 'ai-message' 
        ? formatContent(text) 
        : text.replace(/\n/g, '<br>');
    
    chatMessages.appendChild(messageElement);
}

// 绑定发送按钮点击事件
sendButton.addEventListener('click', sendMessage);

// 绑定输入框回车键事件
messageInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
});

// 页面加载时连接 WebSocket
document.addEventListener('DOMContentLoaded', () => {
    // const sid = 'user_' + Math.random().toString(36).substr(2, 9);
    sid = 1; // 使用固定的ID进行测试

    // 新增用户信息更新
    const userInfoDiv = document.querySelector('.user-info div:last-child');
    const userAvatar = document.querySelector('.user-avatar');
    if (userInfoDiv && userAvatar) {
        userInfoDiv.textContent = `用户：${sid}`;
        userAvatar.textContent = String(sid).charAt(0).toUpperCase();
    }

    connectWebSocket(sid);
    fetchModelName();
    fetchModelList(); // 调用获取模型列表的函数
    initSidebar(); // 初始化侧边栏
    loadChatHistory(); // 加载历史记录
    // 初始化文件上传
    initFileUpload();
});

function createLoadingMessage() {
    // 防御性检查：如果已有加载动画则不再创建
    if (document.querySelector('.loading-message')) return;
    
    const container = document.createElement('div');
    container.classList.add('loading-message');
    
    const spinner = document.createElement('div');
    spinner.classList.add('loading-spinner');
    
    const text = document.createElement('span');
    text.textContent = 'AI正在思考...';
    
    container.appendChild(spinner);
    container.appendChild(text);
    chatMessages.appendChild(container);
    
    return container;
}

// 在全局变量区域新增按钮状态对象
let buttonStates = {
    deepThinkButtonStatus: "0",
    webButtonStatus: "0",
    mcpButtonStatus: "0"
};

// script.js 新增功能

document.addEventListener('DOMContentLoaded', function() {
    const modeButtons = document.querySelectorAll('.mode-btn');
    const modeMap = {
        'deep': 'deepThinkButtonStatus',
        'web': 'webButtonStatus',
        'mcp': 'mcpButtonStatus'
    };

    modeButtons.forEach(button => {
        button.addEventListener('click', async function() {
            const mode = this.dataset.mode;
            const currentField = modeMap[mode];
            const isActive = this.classList.contains('selected');
            const newStatus = isActive ? "0" : "1"; // 切换状态值
            //如果已经点亮，则直接把状态切换为0 
            if(isActive){
                buttonStates[currentField] = "0";
                this.classList.remove('selected');
                return;
            }

            try {
                // 构建包含三个字段的请求体
                const requestBody = {
                    deepThinkButtonStatus: "0",
                    webButtonStatus: "0",
                    mcpButtonStatus: "0",
                    [currentField]: newStatus // 设置当前按钮的新状态
                };

                const response = await fetch('http://localhost:1618/ai/checkmodel/button', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody)
                });

                const result = await response.text();
                if (result === 'OK') {
                    // 成功时切换按钮状态
                    buttonStates[currentField] = newStatus;
                    this.classList.toggle('selected');
                } else {
                    showButtonAlert(this, result);
                }
            } catch (error) {
                showButtonAlert(this, '网络请求失败');
            }
        });
    });
});


// 新增按钮提示函数
function showButtonAlert(button, message) {
    const alert = document.createElement('div');
    alert.className = 'button-alert';
    alert.textContent = message;
    
    // 计算提示位置
    const rect = button.getBoundingClientRect();
    alert.style.top = `${rect.top - 35}px`;
    alert.style.left = `${rect.left + rect.width/2}px`;
    alert.style.transform = 'translateX(-50%)';
    
    document.body.appendChild(alert);
    
    // 1.5秒后淡出移除
    setTimeout(() => {
        alert.style.opacity = '0';
        setTimeout(() => alert.remove(), 500);
    }, 1500);
}

// 输入框高度自适应
messageInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';
});

// 新增快捷键支持 (Alt+1/2/3)
document.addEventListener('keydown', (e) => {
    if (e.altKey) {
        const buttons = document.querySelectorAll('.mode-btn');
        switch(e.key) {
            case '1': buttons[0].click(); break;
            case '2': buttons[1].click(); break;
            case '3': buttons[2].click(); break;
        }
    }
});

// 获取模型名称
async function fetchModelName() {
    try {
        // 添加调试信息
        console.log('正在尝试获取模型名称...');
        const response = await fetch('http://localhost:1618/ai/getmodelname');
        console.log('请求已发送，等待响应...');
        
        if (!response.ok) {
            console.error('请求失败，状态码:', response.status);
            modelName.textContent = '未知模型';
            return;
        }
        
        const data = await response.json();
        modelName.textContent = data.modelName || '未知模型';
        console.log('成功获取模型名称:', data.modelName);
    } catch (error) {
        console.error('获取模型名称失败:', error);
        modelName.textContent = '未知模型';
    }
}

// 获取模型列表并显示下拉框
async function fetchModelList() {
    try {
        console.log('正在尝试获取模型列表...');
        const response = await fetch('http://localhost:1618/ai/getmodellist');
        console.log('请求已发送，等待响应...');
        
        if (!response.ok) {
            console.error('请求失败，状态码:', response.status);
            return;
        }
        
        const data = await response.json();
        console.log('后端返回的数据:', data);
        
        if (Array.isArray(data)) {
            // 填充下拉框
            modelDropdown.innerHTML = '';
            data.forEach(model => {
                const option = document.createElement('div');
                option.classList.add('model-option');
                option.textContent = model;
                option.addEventListener('click', async () => {
                    // 更新模型名称
                    modelName.textContent = model;
                    modelDropdown.classList.remove('active');
                    
                    // 向后端发送更改模型的请求
                    await changeModel(model);
                });
                modelDropdown.appendChild(option);
            });
        } else {
            console.error('后端返回的数据格式不符合预期:', data);
        }
    } catch (error) {
        console.error('获取模型列表失败:', error);
    }
}


// 点击模型名称时显示/隐藏下拉框
modelName.addEventListener('click', () => {
    modelDropdown.classList.toggle('active');
});

// 点击其他地方时隐藏下拉框
document.addEventListener('click', (event) => {
    if (!modelName.contains(event.target) && !modelDropdown.contains(event.target)) {
        modelDropdown.classList.remove('active');
    }
});

// 向后端发送更改模型的请求
async function changeModel(modelName) {
    try {
        const response = await fetch('http://localhost:1618/ai/switchmodel', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ modelName: modelName }),
        });
        
        const responseText = await response.text(); // 先获取文本
        console.log('原始响应:', responseText);

        // 切换模型时重置所有按钮状态
        buttonStates = {
            deepThinkButtonStatus: "0",
            webButtonStatus: "0",
            mcpButtonStatus: "0"
        };
        // 移除所有按钮的选中状态
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        console.log('按钮状态已重置');
        
        if (!response.ok) {
            console.error('更改模型失败，状态码:', response.status);
            return;
        }
        
        // 尝试解析JSON
        
         const data = JSON.parse(responseText);
         console.log('模型更改成功:', data);
         fetchModelName()
         //重新加载当前会话历史
         if (currentChatId) {
             await loadChatDetails(currentChatId); 
             await loadChatHistory(); // 同时刷新会话列表
         }
    } catch (error) {
        console.error('请求失败:', error);
    }
}

// 在initSidebar函数中修改新建会话逻辑
// 修改后的新建会话逻辑
function initSidebar() {
    const newChatBtn = document.getElementById('newChatBtn');
    let isCreating = false;

    newChatBtn.addEventListener('click', async () => {
        if (isCreating) return; // 防止重复点击
        isCreating = true;

        if (await shouldBlockNavigation()) {
            e.stopImmediatePropagation();
            return;
        }
        try {
            // 检查是否存在未使用的会话
            const unusedSession = await findUnusedSession();
            if (unusedSession) {
                // alert('存在未使用的会话，已自动跳转');
                loadChatDetails(unusedSession);
                return;
            }

            // 生成随机会话ID
            const chatId = 'chat_'+ Math.random().toString(36).substr(2, 9);
            currentChatId = chatId; // 更新当前会话ID
            await loadChatHistory(chatId); // 强制刷新列表

            const type = 'chat';
            const response = await fetch(`http://localhost:1618/ai/history/${type}/${chatId}/${sid}`, {
                method: 'POST'
            });
            
            if (!response.ok) throw new Error('请求失败');
            
            // 清空当前聊天记录
            chatMessages.innerHTML = '';
            // 加载历史记录并自动选中新会话
            await loadChatHistory(chatId); // 新增参数传递新会话ID
            loadChatDetails(chatId); // 新增调用确保选中状态更新

            // 新增延时防止重复
            setTimeout(() => isCreating = false, 1000);
        } catch (error) {
            isCreating = false;
            console.error('创建会话失败:', error);
            alert('创建新会话失败，请检查控制台');
        }
    });
}

// 检查未使用会话的方法
async function findUnusedSession() {
    try {
        const response = await fetch('http://localhost:1618/ai/history/chat');
        const sessions = await response.json();
        
        for (const chat of sessions) {
            const res = await fetch(`http://localhost:1618/ai/history/chat/${chat.chatId}`);
            const messages = await res.json();
            if (messages.length === 0) {
                return chat.chatId;
            }
        }
        return null;
    } catch (error) {
        console.error('检查会话失败:', error);
        return null;
    }
}

// 加载历史记录函数
async function loadChatHistory() {
     try {
        const response = await fetch(`http://localhost:1618/ai/history/chat`);
        const history = await response.json();
        
        const container = document.getElementById('historyList');
        container.innerHTML = '';
        
        history.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
        .forEach(chat => {  // 参数改为chat对象
            const item = document.createElement('div');
            item.className = 'history-item';
            // 存储chatId到DOM属性
            item.setAttribute('data-chat-id', chat.chatId);
            // 新增选中状态判断
            if (chat.chatId === currentChatId) {
                item.classList.add('selected');
            }
            item.innerHTML = `
                <div class="session-title">${
                    chat.chatName.length > 12 
                    ? chat.chatName.slice(0, 12) + '...' 
                    : chat.chatName
                }</div>
                <div class="session-meta">
                    <span>${chat.modelName}</span>
                    <span>${new Date(chat.createTime).toLocaleString()}</span>
                </div>
                <div class="delete-btn"><i class="fas fa-times-circle"></i></div>
            `;
            
            // 添加删除按钮点击事件（修改获取chatId的方式）
            const deleteBtn = item.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const chatId = item.getAttribute('data-chat-id');
                if (confirm('确定要删除此会话吗？')) {
                    await deleteChat(chatId);
                }
            });
            
            // 绑定点击事件（修改获取chatId的方式）
            item.addEventListener('click', async (e) => {
                if (await shouldBlockNavigation()) {
                    e.stopImmediatePropagation();
                    return;
                }
                document.querySelectorAll('.history-item').forEach(el => {
                    el.classList.remove('selected');
                });
                item.classList.add('selected');
                loadChatDetails(item.getAttribute('data-chat-id')); // 从属性获取chatId
            });
            
            container.appendChild(item);
        });
    } catch (error) {
        console.error('加载历史记录失败:', error);
    }
}

let totalMessages = 0 // 新增消息计数器
let totalChars = 0
async function loadChatDetails(chatId) {
    try {
        currentChatId = chatId; // 更新当前会话ID

        // 更新侧边栏选中状态
        document.querySelectorAll('.history-item').forEach(el => {
            const itemChatId = el.getAttribute('data-chat-id');
            el.classList.toggle('selected', itemChatId === chatId);
        });

        const response = await fetch(`http://localhost:1618/ai/history/chat/${chatId}`);
        const messages = await response.json();
        
        // 清空当前聊天记录
        chatMessages.innerHTML = '';
        
        // 使用通用消息处理函数渲染历史消息
        messages.forEach(msg => {
            const className = msg.messageType === 'assistant' ? 'ai-message' : 'user-message';
            processMessageContent(msg.content, className); // 替换原来的addMessage调用
        });
        
        currentMessage = messages;

        // 清空当前文件列表
        document.getElementById('fileList').innerHTML = '';

        // 加载当前会话关联的文件
        uploadedFiles
            .filter(file => file.chatId === chatId)
            .forEach(file => {
                // 重新创建文件项但不重复存储
                const fileItem = document.createElement('div');
                fileItem.className = 'file-item';
                fileItem.innerHTML = `
                    <i class="fas fa-file-alt"></i>
                    <span class="file-name">${file.fileName}</span>
                    <span class="file-remove">&times;</span>
                `;
                // 重新绑定删除事件...
                document.getElementById('fileList').appendChild(fileItem);
            });

        // 新增上下文长度检测
        const contextWarning = document.getElementById('contextWarning');
        totalMessages = messages.length;
        totalChars = messages.reduce((sum, msg) => sum + (msg.content?.length || 0), 0);
        
        if (totalMessages >= 50 || totalChars >= 4000) {
            contextWarning.style.display = 'flex';
        } else {
            contextWarning.style.display = 'none';
        }
        // 滚动控制（使用双重保障）
        setTimeout(() => {
            // 方式一：直接设置滚动位置
            // chatMessages.scrollTop = chatMessages.scrollHeight;
            
            // 方式二：使用平滑滚动（可选）
            const lastMessage = chatMessages.lastElementChild;
            if (lastMessage) {
                lastMessage.scrollIntoView({
                    behavior: 'smooth',
                    block: 'end'
                });
            }
        }, 50); // 50ms延迟确保DOM更新完成
    } catch (error) {
        console.error('加载会话详情失败:', error);
        alert('获取历史对话失败');
    }
}

// 修改后的通用消息处理函数
function processMessageContent(content, className) {
    const container = document.createElement('div');
    container.classList.add('message', className);
    
    // 先进行格式转换
    const processedContent = formatContent(content);
    
    // 拆分思考块和普通内容
    const parts = processedContent.split(/<think>|<\/think>/g);
    let isInThink = false;
    
    parts.forEach(part => {
        if (isInThink && part) {
            const thinkDiv = document.createElement('div');
            thinkDiv.className = 'think-message';
            thinkDiv.innerHTML = part;
            container.appendChild(thinkDiv);
        } else if (part) {
            // 创建文档片段处理嵌套标签
            const fragment = document.createRange().createContextualFragment(part);
            container.appendChild(fragment);
        }
        isInThink = !isInThink;
    });
    
    chatMessages.appendChild(container);
}

// 新增删除会话方法
async function deleteChat(chatId) {
    try {
        chat = 'chat'; // 确保chat变量存在

        // 新增文件清理逻辑
        const sessionFiles = uploadedFiles.filter(f => f.chatId === chatId);
        // 并行删除所有关联文件
        await Promise.all(sessionFiles.map(async file => {
            await fetch(`http://localhost:1618/files/${file.fileId}`, {
                method: 'DELETE'
            });
        }));

        // 更新文件数组
        uploadedFiles = uploadedFiles.filter(f => f.chatId !== chatId);
        uploadedFileIds = uploadedFileIds.filter(id => 
            !sessionFiles.some(f => f.fileId === id)
        );

        //删除会话
        const response = await fetch(`http://localhost:1618/ai/deleteChatId/${chat}/${chatId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            // 如果删除的是当前会话，清空聊天记录
            if (currentChatId === chatId) {
                chatMessages.innerHTML = '';
                currentChatId = null;
                // 新增当前会话文件列表清理
                document.getElementById('fileList').innerHTML = '';

            }
            // 刷新会话列表
            await loadChatHistory();
        }
    } catch (error) {
        console.error('删除会话失败:', error);
        alert('删除会话失败');
    }
}

// 在全局工具函数区域新增格式转换方法
function formatContent(text) {

    // 处理标题（双星号**标题**）
    formatted = text.replace(/\*\*([^*]+)\*\*/g, '<span class="content-header">$1</span>');
    
    // 处理加粗（单星号*内容*）
    formatted = formatted.replace(/\*([^*]+?)\*/g, '<strong>$1</strong>');
    
    // 处理强调块（三井号###内容###）
    formatted = formatted.replace(/###([^#]+)###/g, (_, p1) => {
        const lines = p1.split('\n').filter(l => l.trim());
        return `<div class="emphasis-block">${lines.join('<br>')}</div>`;
    });

    // 处理副标题（双井号##副标题##）
    formatted = formatted.replace(/##([^#]+)##/g, '<span class="content-subheader">$1</span>');
    
    // 处理副标题（双井号#副标题#）
    formatted = formatted.replace(/#([^#]+)#/g, '<span class="content-subheader">$1</span>');

    // 最后处理代码块（避免被其他正则覆盖）
    formatted = formatted.replace(/```([\s\S]*?)```/g, (_, code) => {
        const cleanedCode = code.trim()
            .replace(/^\n+|\n+$/g, '')
            .replace(/</g, '&lt;')  // 转义HTML标签
            .replace(/>/g, '&gt;');
        return `<pre class="code-block"><code>${cleanedCode}</code></pre>`;
    });

    // 保留换行但避免多余空行
    // 智能换行处理（关键修改部分）
    return formatted
        // 保留单个换行为<br>
        .replace(/\n/g, '<br>')
        // 合并连续多个<br>为段落间距
        .replace(/(<br>){3,}/g, '<div class="paragraph-break"></div>')
        .replace(/(<br>){2}/g, '<div class="paragraph-break"></div>');
}

async function shouldBlockNavigation() {
    if (!isResponsePending) return false;
    
    const result = await showNavigationConfirm();
    return !result;
}

function showNavigationConfirm() {
    return new Promise((resolve) => {
        const confirmBox = document.createElement('div');
        confirmBox.id = 'navigationConfirm';
        confirmBox.innerHTML = `
            <div class="confirm-content">
                <p>离开当前会话会丢失响应的加载过程</p>
                <div class="confirm-buttons">
                    <button id="confirmLeave">确定</button>
                    <button id="cancelLeave">取消</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(confirmBox);
        
        confirmBox.querySelector('#confirmLeave').addEventListener('click', () => {
            confirmBox.remove();
            resolve(true);
        });
        
        confirmBox.querySelector('#cancelLeave').addEventListener('click', () => {
            confirmBox.remove();
            resolve(false);
        });
    });
}


let uploadedFiles = [];  // 上传的文件列表
let uploadedFileIds = []; // 文件ID列表

// 新增文件上传初始化函数
function initFileUpload() {
    // 创建隐藏的文件输入
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.txt';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    // 点击附件图标触发文件选择
    document.querySelector('.attachment-trigger').addEventListener('click', () => {
        fileInput.click();
    });

    // 处理文件选择
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // 验证文件类型和大小
        if (!file.name.endsWith('.txt') && !file.type.includes('text/plain')) {
            alert('仅支持上传txt文件');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            alert('文件大小不能超过10MB');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('filedata', file);

            const response = await fetch('http://localhost:1618/files/upload', {
                method: 'POST',
                body: formData
            });
            //获取响应的fileId

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error);
            }

            const result = await response.json();
            showUploadedFile(file.name, result.fileId);
        } catch (error) {
            console.error('上传失败:', error);
            alert(`上传失败: ${error.message}`);
        }
    });
}

// 显示已上传文件
function showUploadedFile(fileName, fileId) {
    const fileList = document.getElementById('fileList');
    
    // 创建文件项
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    fileItem.innerHTML = `
        <i class="fas fa-file-alt"></i>
        <span class="file-name">${fileName}</span>
        <span class="file-remove">&times;</span>
    `;

    // 插入到列表最前面（由于flex反向布局，视觉上在最右侧）
    fileList.insertBefore(fileItem, fileList.firstChild);

    // 存储文件信息
    uploadedFiles.push({
        fileName,
        fileId,
        chatId: currentChatId, // 新增会话ID绑定
        element: fileItem
    });

    // 自动滚动到最新文件
    fileList.scrollTo({
        left: 0,
        behavior: 'smooth'
    });


    // 修改删除按钮点击事件
    const removeBtn = fileItem.querySelector('.file-remove');
    removeBtn.addEventListener('click', async () => {
        try {
            // 调用后端删除接口
            await fetch(`http://localhost:1618/files/${fileId}`, {
                method: 'DELETE'
            });
            
            // 从数组中移除对应文件
            uploadedFiles = uploadedFiles.filter(f => f.fileId !== fileId);
            uploadedFileIds = uploadedFileIds.filter(id => id !== fileId);
            fileItem.remove();
        } catch (error) {
            console.error('文件删除失败:', error);
            alert('文件删除失败，请稍后重试');
        }
    });

    uploadedFileIds.push(fileId); // 将fileId添加到列表

}