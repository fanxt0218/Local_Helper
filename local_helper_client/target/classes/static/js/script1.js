// 流式响应的js文件

const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const chatMessages = document.getElementById('chatMessages');
const connectionStatus = document.getElementById('connectionStatus');
let websocket;

// 建立 WebSocket 连接
function connectWebSocket(sid) {
    const wsUrl = `ws://localhost:8080/ai/response/${sid}`;
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

    let isSending = false;
    async function sendMessage() {
        if (isSending) return;
    
        currentStreamingMessage = null; // 重置引用
        createLoadingMessage(); // 创建加载动画

        const message = messageInput.value.trim();
        if (!message) return;

        isSending = true;
        sendButton.disabled = true;

        addMessage(message, 'user-message');
        messageInput.value = '';

        try {
            if (websocket?.readyState === WebSocket.OPEN) {
                websocket.send(message);
            } else {
                console.error('WebSocket连接未就绪');
                addMessage('连接未准备好，请稍后再试', 'ai-message');
                clearLoading();
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
        // 如果后端返回的是带\n的纯文本：
        messageElement.innerHTML = text.replace(/\n/g, '<br>');
        
        // 或者直接使用textContent + CSS样式（推荐）
        // messageElement.textContent = text; 
        
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
        fetchModelName(); // 调用获取模型名称的函数
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
            const response = await fetch('http://localhost:8080/ai/getmodelname');
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
