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
let currentPreviewFileId = null;

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
        addCopyButton(currentStreamingMessage);//复制按钮
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
    // 新增：应用主题和字体设置
    const savedTheme = localStorage.getItem('主题模式') || '浅色模式';
    document.body.classList.toggle('dark-theme', savedTheme === '夜间模式');
    const savedSize = localStorage.getItem('字体大小') || '中';
    applyFontSize(savedSize);

    const fontAwesome = document.createElement('link');
    fontAwesome.rel = 'stylesheet';
    fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
    document.head.appendChild(fontAwesome);

    // const sid = 'user_' + Math.random().toString(36).substr(2, 9);
    sid = 1; // 使用固定的ID进行测试

    // 新增用户信息更新
    const userInfoDiv = document.querySelector('.user-info div:last-child');
    const userAvatar = document.querySelector('.user-avatar');
    if (userInfoDiv && userAvatar) {
        userInfoDiv.textContent = `用户：${sid}`;
        userAvatar.textContent = String(sid).charAt(0).toUpperCase();
    }

    // 初始化预览侧栏
    const previewSidebar = document.createElement('div');
    previewSidebar.id = 'previewSidebar';
    previewSidebar.className = 'preview-sidebar';
    previewSidebar.innerHTML = `
        <div class="preview-header">
        <h3>文件预览</h3>
        <button id="previewCloseBtn" class="close-btn">&times;</button>
        </div>
        <div class="preview-content"></div>
    `;
    
    const previewOverlay = document.createElement('div');
    previewOverlay.className = 'preview-overlay';
    
    document.body.appendChild(previewOverlay);
    document.body.appendChild(previewSidebar);

    // 创建可调整大小的句柄
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle';
    previewSidebar.appendChild(resizeHandle);

    // 添加调整大小功能
    // let isResizing = false;
    // let startX = 0;
    // let startWidth = 800;

    // resizeHandle.addEventListener('mousedown', (e) => {
    //     if (!previewSidebar.classList.contains('active')) return; // 只在侧边栏可见时允许调整
    //     isResizing = true;
    //     startX = e.clientX;
    //     startWidth = previewSidebar.offsetWidth;
    //     document.body.style.cursor = 'col-resize'; // 修改鼠标样式
    //     document.body.style.userSelect = 'none';
    // });

    // document.addEventListener('mousemove', (e) => {
    //     if (!isResizing) return;
    //     const deltaX = e.clientX - startX;
    //     const newWidth = Math.min(Math.max(startWidth + deltaX, 300), 800);
        
    //     // 实时更新宽度
    //     previewSidebar.style.width = `${newWidth}px`;
    //     previewSidebar.style.right = `-${newWidth}px`; 
    // });

    // document.addEventListener('mouseup', () => {
    //     if (!isResizing) return;
    //     isResizing = false;
    //     document.body.style.cursor = '';
    //     document.body.style.userSelect = '';
    // });   
  
    // 修复事件绑定：使用事件委托
    document.body.addEventListener('click', e => {
        if (e.target.closest('#previewCloseBtn') || e.target.classList.contains('preview-overlay')) {
            closePreview();
        }
    });

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
    if (className === 'ai-message') {
        addCopyButton(container); // 为历史消息添加复制按钮
    }
    
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
    fileInput.accept = '.txt, .xlsx, .xls, .pdf, .html, .htm, .css, .js, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, application/pdf, text/html, text/css, application/javascript,text/javascript, image/png, image/jpeg,.mp3, .wav, .ogg, audio/*';    
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

        // 扩展文件类型验证
        const allowedExtensions = /(\.txt|\.xlsx?|\.pdf|\.html?|\.css|\.js|\.png|\.jpg|\.jpeg|\.mp3|\.wav|\.ogg|\.m4a)$/i;
        const allowedMimeTypes = [
            'text/plain',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'application/pdf',
            'text/html',
            'text/css',
            'application/javascript',
            'text/javascript',
            'image/png',
            'image/jpeg',
            'audio/mpeg', // MP3
            'audio/wav',  // WAV
            'audio/ogg',  // OGG
            'audio/m4a'
        ];

        if (!allowedExtensions.exec(file.name) || !allowedMimeTypes.includes(file.type)) {
            alert('仅支持上传 txt、xlsx、pdf、html、css、js、图片、音频文件'); // 修改提示信息
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

     // 新增粘贴事件处理
    document.addEventListener('paste', async (e) => {
        const items = e.clipboardData.items;
        for (const item of items) {
            if (item.kind === 'file') {
                const file = item.getAsFile();
                if (!file) continue;

                // 检查文件类型和大小（复用原有验证逻辑）
                const allowedExtensions = /(\.txt|\.xlsx?|\.pdf|\.html?|\.css|\.js|\.png|\.jpg|\.jpeg|\.mp3|\.wav|\.ogg|\.m4a)$/i;
                const allowedMimeTypes = [
                    'text/plain',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'application/vnd.ms-excel',
                    'application/pdf',
                    'text/html',
                    'text/css',
                    'application/javascript',
                    'text/javascript',
                    'image/png',
                    'image/jpeg',
                    'audio/mpeg', // MP3
                    'audio/wav',  // WAV
                    'audio/ogg',   // OGG
                    'audio/m4a'
                ];

                if (!allowedExtensions.exec(file.name) || !allowedMimeTypes.includes(file.type)) {
                    showButtonAlert(document.querySelector('.attachment-trigger'), '不支持此文件类型');
                    continue;
                }

                if (file.size > 10 * 1024 * 1024) {
                    showButtonAlert(document.querySelector('.attachment-trigger'), '文件大小超过10MB');
                    continue;
                }

                // // 处理图片文件（添加预览功能）
                // if (file.type.startsWith('image/')) {
                //     const reader = new FileReader();
                //     reader.onload = (e) => {
                //         const img = document.createElement('img');
                //         img.src = e.target.result;
                //         img.style.maxWidth = '200px';
                //         img.style.maxHeight = '200px';
                //         chatMessages.appendChild(img);
                //     };
                //     reader.readAsDataURL(file);
                // }

                // 上传文件（复用原有上传逻辑）
                try {
                    const formData = new FormData();
                    formData.append('filedata', file);

                    const response = await fetch('http://localhost:1618/files/upload', {
                        method: 'POST',
                        body: formData
                    });

                    const result = await response.json();
                    showUploadedFile(file.name, result.fileId);
                } catch (error) {
                    console.error('上传失败:', error);
                    showButtonAlert(document.querySelector('.attachment-trigger'), '上传失败');
                }
            }
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
        <span class="file-icon">${getFileIcon(fileName)}</span>
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

    // 修改这部分：为文件名添加点击事件
    const fileNameSpan = fileItem.querySelector('.file-name');
    fileNameSpan.style.cursor = 'pointer';
    fileNameSpan.addEventListener('click', () => previewFile(fileId, fileName));

    uploadedFileIds.push(fileId); // 将fileId添加到列表

}

// 文件类型图标映射函数
function getFileIcon(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    switch(ext) {
        case 'html': case 'htm':
            return `<svg class="file-icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="16" height="18">
                <path d="M869.56139 992.952238l-0.448112 0.256064-0.768192 0.32008c-16.004001 18.692673-38.473618 30.407602-63.11978 30.407602l-586.386597 0c-24.646162 0-47.115779-11.714929-63.631908-30.727682l0-0.256064-0.256064 0.256064C138.434609 974.003501 128.384096 947.180795 128.384096 918.437609L128.384096 105.562391c0-28.807202 10.050513-55.053763 26.566642-74.002501C171.722931 12.227057 194.128532 0 218.83871 0l399.587897 0c8.898225 0 17.732433 4.737184 23.941985 11.714929l243.452863 284.67917c6.72168 8.386097 9.794449 18.180545 9.794449 28.487122l0 0.576144 0 593.044261C895.615904 947.180795 885.565391 973.427357 869.56139 992.952238zM396.803201 518.913728C408.646162 510.527632 412.615154 491.642911 405.317329 478.391598c-6.977744-14.339585-23.045761-18.884721-34.888722-10.498625L202.130533 582.865716c-15.491873 11.522881-16.068017 39.113778 0 50.700675l168.234059 115.292823c11.842961 8.386097 27.910978 4.16104 34.888722-10.114529 7.297824-13.955489 3.328832-32.136034-8.514129-40.522131L265.634409 608.088022 396.803201 518.913728zM584.498125 386.08052C571.182796 380.127032 556.523131 387.808952 551.08177 402.852713l-130.592648 389.793448c-5.185296 14.659665 1.216304 32.136034 14.275569 38.089522C448.464116 837.009252 462.995749 829.327332 468.501125 813.963491l130.592648-390.113528C603.95899 409.190298 597.237309 392.354089 584.498125 386.08052zM614.265566 478.391598C606.967742 491.642911 610.616654 510.527632 622.779695 518.913728l131.168792 89.174294-131.168792 90.19855c-12.163041 8.386097-15.811953 26.566642-8.514129 40.522131 7.297824 14.339585 23.109777 18.564641 34.952738 10.114529l167.593898-115.292823c17.348337-11.586897 16.708177-39.177794 0-50.700675L649.218305 467.892973C637.375344 459.506877 621.563391 464.052013 614.265566 478.391598zM640.384096 126.87972l0 148.709177c0 11.650913 4.993248 22.917729 12.035009 30.663666L653.315329 307.468867c8.258065 8.322081 19.716929 13.379345 32.072018 13.379345l146.852713 0L640.384096 126.87972z"></path>
            </svg>`;
        case 'css':
            return `<svg class="file-icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="16" height="18">
                <path d="M354.40128 0c-87.04 0-157.44 70.55872-157.44 157.59872v275.68128H78.72c-21.6576 0-39.36256 17.69984-39.36256 39.36256v236.31872c0 21.6576 17.69984 39.35744 39.36256 39.35744h118.24128v118.08256c0 87.04 70.4 157.59872 157.44 157.59872h472.63744c87.04 0 157.59872-70.55872 157.59872-157.59872V315.0336c0-41.74848-38.9888-81.93024-107.52-149.27872l-29.11744-29.12256L818.87744 107.52C751.5392 38.9888 711.39328 0 669.59872 0H354.4064z m0 78.72h287.20128c28.35456 7.0912 27.99616 42.1376 27.99616 76.8v120.16128c0 21.6576 17.69984 39.35744 39.36256 39.35744h118.07744c39.38816 0 78.87872-0.0256 78.87872 39.36256v512c0 43.32032-35.55328 78.87872-78.87872 78.87872H354.4064c-43.32544 0-78.72-35.5584-78.72-78.87872v-118.08256h393.91744c21.66272 0 39.36256-17.69472 39.36256-39.35744V472.64256c0-21.66272-17.69984-39.36256-39.36256-39.36256H275.68128V157.59872c0-43.32032 35.39456-78.87872 78.72-78.87872zM246.55872 505.44128c17.92 0 33.28 3.2 46.08 9.6l-9.6 19.2c-12.16-6.4-24.32-9.6-36.48-9.6-16.64 0-30.39744 6.4-41.27744 19.2-10.24 12.16-15.36 29.44-15.36 51.84 0 23.04 4.79744 40.63744 14.39744 52.79744 9.6 11.52 23.68 17.28 42.24 17.28 10.24 0 23.36256-2.23744 39.36256-6.71744v19.2c-11.52 4.48-25.92256 6.71744-43.20256 6.71744-23.68 0-42.24-7.35744-55.68-22.07744-13.44-15.36-20.15744-38.08256-20.15744-68.16256 0-28.16 7.04-49.92 21.12-65.28 14.72-16 34.23744-23.99744 58.55744-23.99744z m120.00256 0c17.28 0 32.64 3.2 46.08 9.6l-7.68 18.23744c-13.44-5.76-26.24-8.63744-38.4-8.63744-10.24 0-17.92 2.23744-23.04 6.71744s-7.68 10.56256-7.68 18.24256c0 8.96 1.92 15.67744 5.76 20.15744 4.48 3.84 15.03744 9.6 31.67744 17.28 17.28 7.04 28.48256 14.40256 33.60256 22.08256 5.76 7.04 8.63744 16 8.63744 26.88 0 14.72-5.12 26.55744-15.36 35.51744s-24.96 13.44-44.16 13.44c-18.56 0-33.28-2.56-44.16-7.68v-21.12c15.36 6.4 30.08 9.6 44.16 9.6 12.8 0 22.08256-2.23744 27.84256-6.71744 6.4-4.48 9.6-11.52 9.6-21.12 0-7.68-2.24256-14.08-6.72256-19.2-3.2-3.2-15.03744-9.28256-35.51744-18.24256-13.44-6.4-23.04-13.44-28.8-21.12s-8.64256-17.59744-8.64256-29.75744c0-13.44
                 4.48-24.00256 13.44-31.68256 9.6-8.32 22.72256-12.47744 39.36256-12.47744z m127.67744 0c17.28 0 32.64 3.2 46.08 9.6l-7.68 18.23744c-13.44-5.76-26.24-8.63744-38.4-8.63744-10.24 0-17.92 2.23744-23.04 6.71744s-7.68 10.56256-7.68 18.24256c0 8.96 1.92 15.67744 5.76 20.15744 4.48 3.84 15.04256 9.6 31.68256 17.28 17.28 7.04 28.47744 14.40256 33.59744 22.08256 5.76 7.04 8.64256 16 8.64256 26.88 0 14.72-5.12 26.55744-15.36 35.51744s-24.96 13.44-44.16 13.44c-18.56 0-33.28-2.56-44.16-7.68v-21.12c15.36 6.4 30.08 9.6 44.16 9.6 12.8 0 22.07744-2.23744 27.83744-6.71744 6.4-4.48 9.6-11.52 9.6-21.12 0-7.68-2.23744-14.08-6.71744-19.2-3.2-3.2-15.04256-9.28256-35.52256-18.24256-13.44-6.4-23.04-13.44-28.8-21.12s-8.63744-17.59744-8.63744-29.75744c0-13.44 4.48-24.00256 13.44-31.68256 9.6-8.32 22.71744-12.47744 39.35744-12.47744z"></path>
            </svg>`;
        case 'js':
            return `<svg class="file-icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="16" height="18">
            <path d="M354.40128 0c-87.04 0-157.44 70.55872-157.44 157.59872v275.68128H78.72c-21.6576 0-39.36256 17.69984-39.36256 39.36256v236.31872c0 21.6576 17.69984 39.35744 39.36256 39.35744h118.24128v118.08256c0 87.04 70.4 157.59872 157.44 157.59872h472.63744c87.04 0 157.59872-70.55872 157.59872-157.59872V315.0336c0-41.74848-38.9888-81.93024-107.52-149.27872l-29.11744-29.12256L818.87744 107.52C751.5392 38.9888 711.39328 0 669.59872 0H354.4064z m0 78.72h287.20128c28.35456 7.0912 27.99616 42.1376 27.99616 76.8v120.16128c0 21.6576 17.69984 39.35744 39.36256 39.35744h118.07744c39.38816 0 78.87872-0.0256 78.87872 39.36256v512c0 43.32032-35.55328 78.87872-78.87872 78.87872H354.4064c-43.32544 0-78.72-35.5584-78.72-78.87872v-118.08256h393.91744c21.66272 0 39.36256-17.69472 39.36256-39.35744V472.64256c0-21.66272-17.69984-39.36256-39.36256-39.36256H275.68128V157.59872c0-43.32032 35.39456-78.87872 78.72-78.87872zM409.7536 501.91872c17.28 0 32.64 3.2 46.08 9.6l-7.68 18.24256c-13.44-5.76-26.24-8.64256-38.4-8.64256-10.24 0-17.92 2.24256-23.04 6.72256s-7.68 10.55744-7.68 18.23744c0 8.96 1.92 15.68256 5.76 20.16256 4.48 3.84 15.04256 9.6 31.68256 17.28 17.28 7.04 28.47744 14.39744 33.59744 22.07744 5.76 7.04 8.64256 16 8.64256 26.88 0 14.72-5.12 26.56256-15.36 35.52256s-24.96 13.44-44.16 13.44c-18.56 0-33.28-2.56-44.16-7.68v-21.12c15.36 6.4 30.08 9.6 44.16 9.6 12.8 0 22.07744-2.24256 27.83744-6.72256 6.4-4.48 9.6-11.52 9.6-21.12 0-7.68-2.23744-14.08-6.71744-19.2-3.2-3.2-15.04256-9.27744-35.52256-18.23744-13.44-6.4-23.04-13.44-28.8-21.12s-8.63744-17.60256-8.63744-29.76256c0-13.44 4.48-23.99744 13.44-31.67744 9.6-8.32 22.71744-12.48256 39.35744-12.48256z m-111.36 1.92h22.08256v172.8c0 16-4.16256 28.16-12.48256 36.48-8.32 8.96-20.15744 13.44-35.51744 13.44-7.04 0-13.12256-0.95744-18.24256-2.87744v-19.2c6.4 1.28 12.8 1.92 19.2 1.92 8.32 0 14.40256-2.24256 18.24256-6.72256 4.48-4.48 6.71744-11.19744 6.71744-20.15744V503.83872z" p-id="4571"></path>
            </svg>`;    
        case 'pdf':
            return `<svg class="file-icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="16" height="18">
            <path d="M905.185809 178.844158C898.576738 172.685485 891.19337 165.824412 883.21687 158.436127 860.422682 137.322863 837.434925 116.207791 815.697647 96.487895 813.243072 94.261877 813.243072 94.261877 810.786411 92.037081 781.783552 65.781062 757.590948 44.376502 739.713617 29.293612 729.254178 20.469111 721.020606 13.860686 714.970549 9.501727 710.955023 6.608611 707.690543 4.524745 704.47155 2.998714 700.417679 1.07689 696.638044-0.094029 691.307277 0.005928 677.045677 0.273349 665.6 11.769337 665.6 26.182727L665.6 77.352844 665.6 128.522961 665.6 230.863194 665.6 256.448252 691.2 256.448252 896 256.448252 870.4 230.863194 870.4 998.414942 896 972.829884 230.381436 972.829884C187.90385 972.829884 153.6 938.623723 153.6 896.20663L153.6 26.182727 128 51.767786 588.8 51.767786C602.93849 51.767786 614.4 40.312965 614.4 26.182727 614.4 12.05249 602.93849 0.597669 588.8 0.597669L128 0.597669 102.4 0.597669 102.4 26.182727 102.4 896.20663C102.4 966.91021 159.652833 1024 230.381436 1024L896 1024 921.6 1024 921.6 998.414942 921.6 230.863194 921.6 205.278135 896 205.278135 691.2 205.278135 716.8 230.863194 716.8 128.522961 716.8 77.352844 716.8 26.182727C716.8 39.813762 705.748075 50.91427 692.267725 51.167041 687.705707 51.252584 685.069822 50.435995 682.52845 49.231204 682.259458 49.103682 683.344977 49.796618 685.029451 51.010252 689.779394 54.432502 697.145822 60.34494 706.686383 68.394196 724.009052 83.009121 747.816448 104.072869 776.413589 129.961594 778.850014 132.168064 778.850014 132.168064 781.285216 134.376514 802.876774 153.964212 825.739479 174.96442 848.413564 195.966437 856.350957 203.3185 863.697005 210.144893 870.269888 216.269843 874.209847 219.941299 877.019309 222.565641 878.499674 223.951409 888.81866 233.610931 905.019017 233.081212 914.684179 222.768247 924.349344 212.455283 923.819315 196.264383 913.500326 186.604861 911.981323 185.182945 909.155025 182.542876 905.185809 178.844158ZM102.4 461.128719 0 461.128719 0 896.074709 512 896.074709 1024 896.074709 1024 461.128719 153.6 461.128719 153.6 460.531049 102.4 460.531049
             102.4 461.128719ZM208.2 711 208.2 819.2 157.6 819.2 157.6 528 269 528C301.533495 528 327.366571 536.466581 346.5 553.4 365.633429 570.333419 375.2 592.733195 375.2 620.6 375.2 649.133476 365.833427 671.333254 347.1 687.2 328.366573 703.066746 302.133502 711 268.4 711L208.2 711ZM208.2 670.4 269 670.4C287.00009 670.4 300.733286 666.166709 310.2 657.7 319.666714 649.233291 324.4 637.000079 324.4 621 324.4 605.266588 319.600047 592.700047 310 583.3 300.399951 573.899953 287.200083 569.066669 270.4 568.8L208.2 568.8 208.2 670.4ZM419.4 819.2 419.4 528 505.4 528C531.133461 528 553.966566 533.733276 573.9 545.2 593.833434 556.666724 609.266611 572.933229 620.2 594 631.133389 615.066771 636.6 639.199863 636.6 666.4L636.6 681C636.6 708.600139 631.100055 732.866562 620.1 753.8 609.099945 774.733438 593.433436 790.866609 573.1 802.2 552.766564 813.533391 529.466799 819.2 503.2 819.2L419.4 819.2ZM470 568.8 470 778.8 503 778.8C529.533466 778.8 549.89993 770.500083 564.1 753.9 578.30007 737.299917 585.533331 713.466822 585.8 682.4L585.8 666.2C585.8 634.599842 578.933402 610.46675 565.2 593.8 551.466598 577.13325 531.533463 568.8 505.4 568.8L470 568.8ZM854.8 695.8 737.6 695.8 737.6 819.2 687 819.2 687 528 872 528 872 568.8 737.6 568.8 737.6 655.4 854.8 655.4 854.8 695.8Z" fill="#5E5E5E" p-id="5621"></path>
            </svg>`;
        case 'xlsx': case 'xls':
            return `<svg class="file-icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="16" height="18">
            <path d="M170.666667 0h568.888889l227.555555 227.555556v796.444444H170.666667z" fill="#BFC3C7" p-id="8552"></path><path d="M227.555556 56.888889v910.222222h682.666666V251.107556L716.003556 56.888889z" fill="#FFFFFF" p-id="8553"></path><path d="M682.666667 284.444444m28.444444 0l113.777778 0q28.444444 0 28.444444 28.444445l0 0q0 28.444444-28.444444 28.444444l-113.777778 0q-28.444444 0-28.444444-28.444444l0 0q0-28.444444 28.444444-28.444445Z" fill="#E6E8EB" p-id="8554"></path><path d="M682.666667 455.111111m28.444444 0l113.777778 0q28.444444 0 28.444444 28.444445l0 0q0 28.444444-28.444444 28.444444l-113.777778 0q-28.444444 0-28.444444-28.444444l0 0q0-28.444444 28.444444-28.444445Z" fill="#E6E8EB" p-id="8555"></path><path d="M682.666667 625.777778m28.444444 0l113.777778 0q28.444444 0 28.444444 28.444444l0 0q0 28.444444-28.444444 28.444445l-113.777778 0q-28.444444 0-28.444444-28.444445l0 0q0-28.444444 28.444444-28.444444Z" fill="#E6E8EB" p-id="8556"></path><path d="M284.444444 796.444444m28.444445 0l512 0q28.444444 0 28.444444 28.444445l0 0q0 28.444444-28.444444 28.444444l-512 0q-28.444444 0-28.444445-28.444444l0 0q0-28.444444 28.444445-28.444445Z" fill="#E6E8EB" p-id="8557"></path><path d="M56.888889 227.555556m56.888889 0l455.111111 0q56.888889 0 56.888889 56.888888l0 398.222223q0 56.888889-56.888889 56.888889l-455.111111 0q-56.888889 0-56.888889-56.888889l0-398.222223q0-56.888889 56.888889-56.888888Z" fill="#0CC0C9" p-id="8558"></path><path d="M305.493333 476.785778l-91.591111-135.395556h72.476445l55.751111 90.794667 57.742222-90.794667h68.494222L377.173333 477.184l99.157334 148.536889H401.863111L339.740444 527.36l-63.317333 98.360889H206.336z" fill="#FFFFFF" p-id="8559"></path>
            </svg>`;
         case 'mp3': case 'wav': case 'ogg':
            return `<svg class="file-icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="16" height="18">
                <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372zm-32-232h64c4.4 0 8-3.6 8-8V360c0-4.4-3.6-8-8-8h-64c-4.4 0-8 3.6-8 8v304c0 4.4 3.6 8 8 8zm224 0h64c4.4 0 8-3.6 8-8V360c0-4.4-3.6-8-8-8h-64c-4.4 0-8 3.6-8 8v304c0 4.4 3.6 8 8 8zm-448 0h64c4.4 0 8-3.6 8-8V360c0-4.4-3.6-8-8-8h-64c-4.4 0-8 3.6-8 8v304c0 4.4 3.6 8 8 8z"/>
            </svg>`;
        default:
            return `<svg class="file-icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="16" height="18">
            <path d="M245.76 122.88h421.60128a20.48 20.48 0 0 1 14.47936 6.00064l172.31872 172.31872a20.48 20.48 0 0 1 6.00064 14.47936V839.68a61.44 61.44 0 0 1-61.44 61.44H245.76a61.44 61.44 0 0 1-61.44-61.44V184.32a61.44 61.44 0 0 1 61.44-61.44z m40.96 81.92a20.48 20.48 0 0 0-20.48 20.48v573.44a20.48 20.48 0 0 0 20.48 20.48h471.04a20.48 20.48 0 0 0 20.48-20.48V356.63872a20.48 20.48 0 0 0-6.00064-14.47936l-131.35872-131.35872a20.48 20.48 0 0 0-14.47936-6.00064H286.72z" fill="#000000" p-id="9588"></path><path d="M655.36 307.2h122.88v81.92h-163.84a40.96 40.96 0 0 1-40.96-40.96V163.84h81.92v143.36z" fill="#000000" p-id="9589"></path><path d="M778.24 307.2v81.92h-122.88a81.92 81.92 0 0 1-81.92-81.92h204.8z" fill="#000000" p-id="9590"></path><path d="M327.68 491.52m40.96 0l307.2 0q40.96 0 40.96 40.96l0 0q0 40.96-40.96 40.96l-307.2 0q-40.96 0-40.96-40.96l0 0q0-40.96 40.96-40.96Z" fill="#000000" p-id="9591"></path><path d="M327.68 634.88m40.96 0l225.28 0q40.96 0 40.96 40.96l0 0q0 40.96-40.96 40.96l-225.28 0q-40.96 0-40.96-40.96l0 0q0-40.96 40.96-40.96Z" fill="#000000" p-id="9592"></path>
            </svg>`;
    }
}

// 复制功能相关函数
function addCopyButton(container) {
    const copyBtn = document.createElement('div');
    copyBtn.className = 'copy-btn';
    copyBtn.innerHTML = `<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#666">
        <path d="M263.2 761.3H145.4c-45.5 0-82.5-37-82.5-82.5V150.6c0-45.5 37-82.5 82.5-82.5h488.9c45.5 0 82.5 37 82.5 82.5v70.1c0 11-9 20-20 20s-20-9-20-20v-70.1c0-23.4-19-42.5-42.5-42.5H145.4c-23.4 0-42.5 19-42.5 42.5v528.3c0 23.4 19 42.5 42.5 42.5h117.8c11 0 20 9 20 20s-8.9 19.9-20 19.9z" fill="#bfbfbf"></path>
        <path d="M897.2 971.1H400.9c-42.5 0-77.2-34.6-77.2-77.2V358.4c0-42.5 34.6-77.2 77.2-77.2h496.4c42.5 0 77.2 34.6 77.2 77.2V894c-0.1 42.5-34.7 77.1-77.3 77.1zM400.9 321.2c-20.5 0-37.2 16.7-37.2 37.2V894c0 20.5 16.7 37.2 37.2 37.2h496.4c20.5 0 37.2-16.7 37.2-37.2V358.4c0-20.5-16.7-37.2-37.2-37.2H400.9z" fill="#bfbfbf"></path>
    </svg>`;
    
    copyBtn.addEventListener('click', () => {
        const content = getCleanContent(container);
        navigator.clipboard.writeText(content).then(() => {
            showCopySuccess(copyBtn);
        });
    });
    
    container.appendChild(copyBtn);
}

function getCleanContent(container) {
    const clone = container.cloneNode(true);
    clone.querySelectorAll('.think-message').forEach(el => el.remove());
    return clone.textContent.trim();
}

function showCopySuccess(btn) {
    const tip = document.createElement('div');
    tip.className = 'copy-tip';
    tip.textContent = '已复制';
    
    btn.appendChild(tip);
    
    // 使用requestAnimationFrame优化动画
    requestAnimationFrame(() => {
        tip.classList.add('hide');
    });
    
    setTimeout(() => {
        tip.remove();
    }, 1000);
}


// 预览文件函数
function previewFile(fileId, fileName) {
  const extension = fileName.split('.').pop().toLowerCase();
  const previewContent = document.querySelector('.preview-content');
  previewContent.innerHTML = '<div class="loading-text">加载中...</div>';
  
  // 显示侧栏
  document.getElementById('previewSidebar').classList.add('active');
  document.querySelector('.preview-overlay').classList.add('active');

  // 保存当前预览的文件ID
  currentPreviewFileId = fileId;
  
  // 根据文件类型显示预览
    if (['png', 'jpg', 'jpeg', 'gif'].includes(extension)) {
        // 图片文件 - 使用下载接口返回原始文件
        previewContent.innerHTML = `
            <h4>${fileName}</h4>
            <img src="http://localhost:1618/files/download/${fileId}" 
                 class="image-preview" 
                 alt="${fileName}"
                 onerror="handlePreviewError('图片加载失败')">
        `;
    }
    else if (['mp3', 'wav', 'ogg', 'm4a'].includes(extension)) {
        // 音频文件 - 使用下载接口返回原始文件
        previewContent.innerHTML = `
            <h4>${fileName}</h4>
            <audio controls class="audio-preview">
                <source src="http://localhost:1618/files/download/${fileId}" 
                        type="${getAudioMimeType(extension)}">
                您的浏览器不支持音频播放
            </audio>
        `;
    }
    else if (['pdf'].includes(extension)) {
        // 创建PDF容器
        previewContent.innerHTML = `
            <h4>${fileName}</h4>
            <div class="pdf-container" style="width: 100%; height: 600px; overflow: auto">
                <canvas id="pdf-canvas"></canvas>
            </div>
            <div class="pdf-controls">
                <button class="page-prev">上一页</button>
                <span class="page-info">第 <span id="page_num">1</span> 页 / 共 <span id="page_count">1</span> 页</span>
                <button class="page-next">下一页</button>
            </div>
        `;

        // 初始化PDF.js
        const loadingTask = pdfjsLib.getDocument(`http://localhost:1618/files/download/${fileId}`);
        let pdfDoc = null, pageNum = 1, pageRendering = false;

        function renderPage(num) {
            pageRendering = true;
            pdfDoc.getPage(num).then(page => {
                const canvas = document.getElementById('pdf-canvas');
                const ctx = canvas.getContext('2d');
                const viewport = page.getViewport({ scale: 1.5 });
                
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                page.render({
                    canvasContext: ctx,
                    viewport: viewport
                }).promise.then(() => {
                    pageRendering = false;
                    document.getElementById('page_num').textContent = num;
                });
            });
        }

        loadingTask.promise.then(pdf => {
            pdfDoc = pdf;
            document.getElementById('page_count').textContent = pdf.numPages;
            renderPage(pageNum);

            // 添加翻页控制
            document.querySelector('.page-prev').addEventListener('click', () => {
                if (pageNum <= 1) return;
                pageNum--;
                renderPage(pageNum);
            });

            document.querySelector('.page-next').addEventListener('click', () => {
                if (pageNum >= pdfDoc.numPages) return;
                pageNum++;
                renderPage(pageNum);
            });
        }).catch(error => {
            console.error('PDF加载失败:', error);
            previewContent.innerHTML = `<p>PDF加载失败: ${error.message}</p>`;
        });
    }
    else if (['txt', 'html', 'css', 'js', 'json'].includes(extension)) {
        // 文本文件 - 使用预览接口返回解析内容
        fetch(`http://localhost:1618/files/preview/${fileId}`)
            .then(response => response.text())
            .then(text => {
                previewContent.innerHTML = `
                    <h4>${fileName}</h4>
                    <pre class="text-preview">${escapeHtml(text)}</pre>
                `;
            })
            .catch(error => {
                previewContent.innerHTML = `<p>加载失败: ${error.message}</p>`;
            });
    }
    else if (['xlsx', 'xls'].includes(extension)) {
        previewContent.innerHTML = `
            <div class="error-message">
                <h4>${fileName}</h4>
                <p>该文件类型不支持在线预览</p>
                <button class="download-btn">下载文件</button>
            </div>
        `;
        
        previewContent.querySelector('.download-btn').addEventListener('click', () => {
            downloadOriginalFile(fileId);
        });
    }
    else {
        previewContent.innerHTML = `<p>不支持预览此文件类型: ${extension}</p>`;
    }
}

// 关闭预览
function closePreview() {
  const sidebar = document.getElementById('previewSidebar');
  const overlay = document.querySelector('.preview-overlay');
  
  if (sidebar) sidebar.classList.remove('active');
  if (overlay) overlay.classList.remove('active');
  
  // 清理资源
  const previewContent = document.querySelector('.preview-content');
  if (previewContent) {
    previewContent.querySelectorAll('img, audio, iframe').forEach(element => {
      if (element.src) URL.revokeObjectURL(element.src);
    });
  }
  
  // 重置当前预览文件ID
  currentPreviewFileId = null;
}

// HTML转义函数
function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// 辅助函数：获取音频MIME类型
function getAudioMimeType(extension) {
    switch(extension) {
        case 'mp3': return 'audio/mpeg';
        case 'wav': return 'audio/wav';
        case 'ogg': return 'audio/ogg';
        case 'm4a': return 'audio/mp4';
        default: return 'audio/*';
    }
}

// 错误处理函数
function handlePreviewError(message) {
    const previewContent = document.querySelector('.preview-content');
    previewContent.innerHTML = `<p>${message}</p>
    <button class="download-btn">下载原始文件</button>`;
    
    previewContent.querySelector('.download-btn').addEventListener('click', () => {
        downloadOriginalFile(currentPreviewFileId);
    });
}

// 下载原始文件
function downloadOriginalFile(fileId) {
    const link = document.createElement('a');
    link.href = `http://localhost:1618/files/download/${fileId}`;
    link.download = '';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
