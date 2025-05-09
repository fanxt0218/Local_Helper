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
                // 将新内容追加到缓冲区
                buffer += response.chat;
                // 处理缓冲区内容（false表示不是最终块）
                buffer = processBuffer(buffer, false);

                // 新增滚动控制逻辑
                const isInitialScroll = buffer.length === response.chat.length; // 判断是否是第一条消息
                const threshold = 100;
                // 强制滚动条件：初始响应或用户位于底部附近
                const isNearBottom = chatMessages.scrollHeight - chatMessages.clientHeight 
                <= chatMessages.scrollTop + threshold;

                if (isNearBottom) {
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }
                if (isInitialScroll || isNearBottom) {
                    // 使用requestAnimationFrame优化滚动性能
                    requestAnimationFrame(() => {
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                    });
                }
            }
        } catch (error) {
            isResponsePending = false; // 新增错误处理
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
async function sendMessage() {
    if (!currentChatId) {
        // 自动创建新会话
        currentChatId = 'chat_'+ Math.random().toString(36).substr(2, 9);
        await fetch(`http://localhost:1618/ai/history/chat/${currentChatId}`, {
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
                message: message
            }));
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
    const sid = 'user_' + Math.random().toString(36).substr(2, 9);
    connectWebSocket(sid);
    fetchModelName();
    fetchModelList(); // 调用获取模型列表的函数
    initSidebar(); // 初始化侧边栏
    loadChatHistory(); // 加载历史记录
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

// script.js 新增功能

document.addEventListener('DOMContentLoaded', function() {
    const modeButtons = document.querySelectorAll('.mode-btn');
    
    modeButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 切换按钮的选中状态
            this.classList.toggle('selected');
        });
    });
});

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
        
        if (!response.ok) {
            console.error('更改模型失败，状态码:', response.status);
            return;
        }
        
        // 尝试解析JSON
        try {
            const data = JSON.parse(responseText);
            console.log('模型更改成功:', data);
            fetchModelName()
        } catch (e) {
            console.log('非JSON响应:', responseText);
        }
    } catch (error) {
        console.error('请求失败:', error);
    }
}

// 在initSidebar函数中修改新建会话逻辑
// 修改后的新建会话逻辑
function initSidebar() {
    const newChatBtn = document.getElementById('newChatBtn');
    
    newChatBtn.addEventListener('click', async () => {
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
            const type = 'chat';
            
            const response = await fetch(`http://localhost:1618/ai/history/${type}/${chatId}`, {
                method: 'POST'
            });
            
            if (!response.ok) throw new Error('请求失败');
            
            // 清空当前聊天记录
            chatMessages.innerHTML = '';
            // 加载历史记录并自动选中新会话
            await loadChatHistory(chatId); // 新增参数传递新会话ID
            loadChatDetails(chatId); // 新增调用确保选中状态更新
        } catch (error) {
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
        
        for (const chatId of sessions) {
            const res = await fetch(`http://localhost:1618/ai/history/chat/${chatId}`);
            const messages = await res.json();
            if (messages.length === 0) {
                return chatId;
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
        
        history.forEach(chatId => {
            const item = document.createElement('div');
            item.className = 'history-item';
            // 新增选中状态判断
            if (chatId === currentChatId) {
                item.classList.add('selected');
            }
            item.innerHTML = `
                <div class="session-title">会话: ${chatId}</div>
                <div class="delete-btn"><i class="fas fa-times-circle"></i></div>
            `;
            
            // 添加删除按钮点击事件
            const deleteBtn = item.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', async (e) => {
                e.stopPropagation(); // 阻止事件冒泡
                if (confirm('确定要删除此会话吗？')) {
                    await deleteChat(chatId);
                }
            });
            
            // 绑定点击事件
            item.addEventListener('click', async (e) => {
                if (await shouldBlockNavigation()) {
                    e.stopImmediatePropagation();
                    return;
                }
                // 移除所有选中状态
                document.querySelectorAll('.history-item').forEach(el => {
                    el.classList.remove('selected');
                });
                item.classList.add('selected');
                
                // 调用独立方法加载会话详情
                loadChatDetails(chatId);
            });
            
            container.appendChild(item);
        });
    } catch (error) {
        console.error('加载历史记录失败:', error);
    }
}

async function loadChatDetails(chatId) {
    try {
        currentChatId = chatId; // 更新当前会话ID

        // 更新侧边栏选中状态
        document.querySelectorAll('.history-item').forEach(el => {
            const isTarget = el.querySelector('.session-title').textContent.includes(chatId);
            el.classList.toggle('selected', isTarget);
        });

        const response = await fetch(`http://localhost:1618/ai/history/chat/${chatId}`);
        const messages = await response.json();
        
        // 清空当前聊天记录
        chatMessages.innerHTML = '';
        
        // 使用通用消息处理函数渲染历史消息
        messages.forEach(msg => {
            const className = msg.role === 'assistant' ? 'ai-message' : 'user-message';
            processMessageContent(msg.content, className); // 替换原来的addMessage调用
        });
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
        const response = await fetch(`http://localhost:1618/ai/deleteChatId/${chat}/${chatId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            // 如果删除的是当前会话，清空聊天记录
            if (currentChatId === chatId) {
                chatMessages.innerHTML = '';
                currentChatId = null;
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

