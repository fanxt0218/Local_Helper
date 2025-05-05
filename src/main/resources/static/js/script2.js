// 流式响应的js文件

const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const chatMessages = document.getElementById('chatMessages');
const connectionStatus = document.getElementById('connectionStatus');
const modelName = document.getElementById('modelName');
const modelDropdown = document.getElementById('modelDropdown');
let websocket;
let currentStreamingMessage = null;

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
            clearLoading();
            currentStreamingMessage = null; // 清空引用
            return;
        }

        try {
            const response = JSON.parse(data);
            if (response.chat) {
                // 如果当前没有正在更新的消息，创建新消息框
                if (!currentStreamingMessage) {
                    currentStreamingMessage = document.createElement('div');
                    currentStreamingMessage.classList.add('message', 'ai-message');
                    chatMessages.appendChild(currentStreamingMessage);
                }

                // 追加内容到当前消息框
                currentStreamingMessage.textContent += response.chat;

                // 保持滚动到底部
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        } catch (error) {
            console.error('消息处理失败:', error);
        }
    };
    
    websocket.onerror = function(error) {
        console.error('WebSocket 错误:', error);
        connectionStatus.textContent = '连接状态：错误';
        connectionStatus.className = 'status disconnected';
    };

    websocket.onclose = function(event) {
        console.log('WebSocket 连接已关闭', event);
        connectionStatus.textContent = '连接状态：已断开';
        connectionStatus.className = 'status disconnected';
        // 可以在这里实现自动重连逻辑
        setTimeout(() => {
            connectWebSocket(sid); // 5秒后尝试重连
        }, 5000);
    };
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
    
    // 替换换行符为<br>标签（根据后端返回格式二选一）
    messageElement.innerHTML = text.replace(/\n/g, '<br>');
    
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
        try {
            // 生成随机会话ID
            const chatId = 'chat_'+ Math.random().toString(36).substr(2, 9);
            currentChatId = chatId; // 更新当前会话ID
            const type = 'chat'; // 根据实际需求设置类型
            
            // 发送带路径参数的POST请求
            const response = await fetch(`http://localhost:1618/ai/history/${type}/${chatId}`, {
                method: 'POST'
            });
            
            if (!response.ok) {
                throw new Error('请求失败');
            }
            loadChatHistory()
        } catch (error) {
            console.error('创建会话失败:', error);
            alert('创建新会话失败，请检查控制台');
        }
    });
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
            item.innerHTML = `
                <div class="session-title">会话: ${chatId}</div>
            `;
            
            // 绑定点击事件
            item.addEventListener('click', () => {
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
        const chat = 'chat'; 
        const response = await fetch(`http://localhost:1618/ai/history/${chat}/${chatId}`);
        const messages = await response.json();
        
        // 清空当前聊天记录
        chatMessages.innerHTML = '';
        
        // 渲染历史消息（根据后端字段调整判断逻辑）
        messages.forEach(msg => {
            const className = msg.role === 'assistant' ? 'ai-message' : 'user-message';
            addMessage(msg.content, className);
        });
    } catch (error) {
        console.error('加载会话详情失败:', error);
        alert('获取历史对话失败');
    }
}


