// 修改后的完整settings.js
let activeCategory = null;

document.addEventListener('DOMContentLoaded', () => {
    // 新增：立即应用本地存储中的设置
    const savedSize = localStorage.getItem('字体大小') || '中';
    applyFontSize(savedSize);
    // 新增：应用主题模式
    const savedTheme = localStorage.getItem('主题模式') || '浅色模式';
    document.body.classList.toggle('dark-theme', savedTheme === '夜间模式');

    initSettingsModal();
    // 添加评分初始化
    const savedRating = parseInt(localStorage.getItem('userRating')) || 0;
    document.querySelectorAll('.el-star').forEach((star, index) => {
        star.classList.toggle('active', index < savedRating);
    });
    initRatingSystem();
    // 新增MCP列表初始化
    fetchAndRenderMCPList();

    // 添加设置分类
    addSettingsCategory('通用设置');
    addSettingsCategory('系统设置');
    addSettingsCategory('模型设置');
    addSettingsCategory('MCP设置');
    addSettingsCategory('关于我们');

   
    
    const mcpCategory = document.querySelector(`.category-content[data-category="MCP设置"]`);

     // 创建头部容器
    const header = document.createElement('div');
    header.className = 'mcp-header';
    header.innerHTML = `
            <h3 class="mcp-title">MCP服务器配置</h3>
            <div class="mcp-actions">
                <el-button class="mcp-delete-btn" type="primary">
                     <svg t="1748509350683" class="icon" viewBox="0 0 1024 1024" 
                        width="20" height="20" style="vertical-align: middle;">
                        <path d="M202.666667 256h-42.666667a32 32 0 0 1 0-64h704a32 32 0 0 1 0 64H266.666667v565.333333a53.333333 53.333333 0 0 0 53.333333 53.333334h384a53.333333 53.333333 0 0 0 53.333333-53.333334V352a32 32 0 0 1 64 0v469.333333c0 64.8-52.533333 117.333333-117.333333 117.333334H320c-64.8 0-117.333333-52.533333-117.333333-117.333334V256z m224-106.666667a32 32 0 0 1 0-64h170.666666a32 32 0 0 1 0 64H426.666667z m-32 288a32 32 0 0 1 64 0v256a32 32 0 0 1-64 0V437.333333z m170.666666 0a32 32 0 0 1 64 0v256a32 32 0 0 1-64 0V437.333333z">
                        </path>
                    </svg>
                </el-button>
            </div>
    `;
     // 插入到分类容器顶部
    mcpCategory.insertBefore(header, mcpCategory.firstChild);

    // 在MCP头部添加删除按钮事件监听
    const deleteBtn = header.querySelector('.mcp-delete-btn');
    deleteBtn.addEventListener('click', function() {
        // 切换按钮激活状态
        this.classList.toggle('active');

        // 切换删除按钮显示状态
        const deleteIcons = document.querySelectorAll('.mcp-delete-icon');
        deleteIcons.forEach(icon => icon.style.display = icon.style.display === 'none' ? 'inline-block' : 'none');
        
        // 添加/移除全局点击事件处理
        if(deleteIcons[0] && deleteIcons[0].style.display === 'inline-block') {
            document.addEventListener('click', globalDeleteHandler);
        } else {
            this.classList.remove('active'); // 取消激活状态
            document.removeEventListener('click', globalDeleteHandler);
        }
    });

   

    // 添加加号按钮
    const addBtn = document.createElement('div');
    addBtn.className = 'mcp-add-btn';
    addBtn.innerHTML = '<i class="codicon codicon-add"></i>';
    mcpCategory.insertBefore(addBtn, mcpCategory.firstChild);
    
    // 初始化MCP对话框
    const mcpDialog = document.createElement('div');
    mcpDialog.className = 'mcp-dialog';
    mcpDialog.style.display = 'none';
    mcpDialog.innerHTML = `
        <div class="mcp-dialog-input">
            <label>服务名称</label>
            <input type="text" class="service-name" required>
        </div>
        <div class="mcp-dialog-input">
            <label>URL</label>
            <input type="url" class="service-url" required>
        </div>
        <div class="mcp-dialog-input">
            <label>End-point（可选）</label>
            <input type="text" class="service-endpoint">
        </div>
        <div class="mcp-dialog-footer">
            <button class="btn-close mcp-cancel">取消</button>
            <button class="btn-save mcp-add">添加</button>
        </div>
    `;
    document.body.appendChild(mcpDialog);
    
    // 添加按钮事件
    addBtn.addEventListener('click', () => {
        const mask = document.createElement('div');
        mask.className = 'mcp-mask';
        document.body.appendChild(mask);

        mcpDialog.style.display = 'block';
    });
    
    // 对话框按钮事件
    mcpDialog.querySelector('.mcp-cancel').addEventListener('click', () => {
        document.querySelector('.mcp-mask')?.remove();
        mcpDialog.style.display = 'none';
    });

    
    mcpDialog.querySelector('.mcp-add').addEventListener('click', () => {
        document.querySelector('.mcp-mask')?.remove();
        const name = mcpDialog.querySelector('.service-name').value;
        const url = mcpDialog.querySelector('.service-url').value;
        const endpoint = mcpDialog.querySelector('.service-endpoint').value;
        
        if (!name || !url) return;
        
         // 发送POST请求
        fetch('http://localhost:1618/ai/settings/addmcp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name,
                url: url,
                endPoint: endpoint
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.code === 200) {
                // 添加成功后重新获取MCP列表
                fetchAndRenderMCPList();
                mcpDialog.style.display = 'none';
                mcpDialog.querySelectorAll('input').forEach(input => input.value = '');
            } else {
                throw new Error(data.message || '服务器返回未知错误');
            }
        })
        .catch(error => {
            console.error('添加MCP失败:', error);
            // 显示具体错误信息并保持对话框
            alert(`添加失败：${error.message}`);
            mcpDialog.style.display = 'block';
            document.querySelector('.mcp-mask')?.remove();
        });
    });

    addSettingItem({
        category: '通用设置', 
        label: '主题模式',
        type: "select",
        options: ['浅色模式', '夜间模式'],
        default: '浅色模式'
    });
    addSettingItem({
        category: '通用设置',
        label: '字体大小',
        type: "select",
        options: ['小', '中', '大'],
        default: '中'
    });
    addSettingItem({
        category: '通用设置',
        label: '清理缓存',
        type: "bufferButton",
        tooltip: '清空缓存内容，包括上传的文件等临时内容，不会清理会话历史。'
    })
    
    addSettingItem({
        category: '系统设置',
        label: 'Ollama服务地址',
        type: "text",
        default: 'http://127.0.0.1:11434'
    });
    addSettingItem({
        category: '系统设置',
        label: '错误日志',
        type: "errLogButton",
        tooltip: '导出应用在执行时的错误日志，用于排查和反馈问题。'
    });

    addSettingItem({
       category: '模型设置',
       label: '温度',
       type: 'range',
       min: 0,
       max: 2,
       step: 0.1,
       default: 1.0,
       tooltip: '温度值越高，模型的输出就越随机，适合创作类任务，反之则越确定，适合技术文档生成。'
    });
    addSettingItem({
        category: '模型设置',
        label: '最大生成长度',
        type: 'range',
        min: 512,
        max: 4096,
        step: 1,
        default: 2048,
        tooltip: '模型一次生成的最大长度，单位为 token，一个中文字符对应 2 个 token。'
    });
    addSettingItem({
        category: '模型设置',
        label: '系统提示词',
        type: "textarea",
        tooltip: '系统提示词是模型的初始提示词，影响模型的行为和输出风格。可以根据需要进行调整。'
    });
    addSettingItem({
       category: '模型设置',
       label: 'top-p',
       type: 'range',
       min: 0,
       max: 1.0,
       step: 0.1,
       default: 1.0,
       tooltip: 'top-p 采样是另一种控制生成文本多样性的方法。它通过限制模型选择的词汇范围来实现。Nucleus 采样，从累积概率超过阈值的候选词中随机选择。与 temperature 配合，控制候选词范围。'
    });
     addSettingItem({
       category: '模型设置',
       label: 'top-k',
       type: 'range',
       min: 1,
       max: 100,
       step: 1,
       default: 40,
       tooltip: 'top-k 采样通过限制模型每次生成时考虑的候选词数量来控制输出的多样性。较高的 top-k 值会使输出更具创造性，较低的值则会使输出更具确定性。仅从概率最高的前 K 个词中采样，减少随机性，提高稳定性。'
    });

    addSettingItem({
    category: '关于我们',
    label:'关于我们',
    type: "custom",
    content: `
            <div class="about-container">
                <header class="about-header">
                    <h1 class="gradient-title">关于我们</h1>
                    <p class="version-tag">Version 2.4.0</p>
                </header>
                
                <div class="info-grid">
                    <!-- 开发者信息 -->
                    <section class="info-card">
                        <div class="card-header">
                            <i class="codicon codicon-organization"></i>
                            <h2>开发团队</h2>
                        </div>
                        <ul class="developer-list">
                            <li><span>首席架构师</span>Fanxt</li>
                            <li><span>前端负责人</span>Fanxt</li>
                            <li><span>质量保障</span>Fanxt</li>
                        </ul>
                    </section>
    
                    <!-- 开源信息 -->
                    <section class="info-card">
                        <div class="card-header">
                            <i class="codicon codicon-source-control"></i>
                            <h2>开源生态</h2>
                        </div>
                        <div class="oss-buttons">
                            <a href="https://github.com/fanxt0218/Local_Helper" class="oss-btn github"  target="_blank"  rel="noopener noreferrer">
                                <i class="codicon codicon-github"></i>
                                <span>GitHub 仓库</span>
                                <span class="repo-address">github.com/fanxt0218/Local_Helper</span>
                            </a>
                            <a href="https://gitee.com/fan_xt/local_helper" class="oss-btn gitee"  target="_blank"  rel="noopener noreferrer">
                                <i class="codicon codicon-repo-clone"></i>
                                <span>Gitee 仓库</span>
                                <span class="repo-address">gitee.com/fan_xt/local_helper</span>
                            </a>
                        </div>
                    </section>

                    <section class="info-card">
                        <div class="card-header">
                            <i class="codicon codicon-feedback"></i>
                            <h2>联系我们</h2>
                        </div>
                        <div class="contact-info">
                            <p>如有问题，请联系：</p>
                            <ul>
                                <li><span>邮箱：</span>3515228784@QQ.com</li>
                                <li><span>CSDN：</span><a href="https://blog.csdn.net/2402_84949062?spm=1011.2480.3001.5343"  target="_blank"  rel="noopener noreferrer">Fanxt_Ja</a></li>
                            </ul>
                        </div>
                    </section>
    
                    <!-- 用户评分 -->
                    <section class="info-card">
                        <div class="card-header">
                            <i class="codicon codicon-feedback"></i>
                            <h2>体验评分</h2>
                        </div>
                        <div class="el-rate-container">
                            ${Array(5).fill().map((_, i) => 
                                `<div class="el-star" data-rating="${i + 1}"></div>`
                            ).join('')}
                        </div>
                        <div class="rating-text"></div>
                    </section>
                </div>
            </div>
        `
    });

});

// 获取设置数据并应用
function fetchSettingsAndApply() {
    fetch('http://localhost:1618/ai/settings/getsettings')
        .then(response => {
            if (!response.ok) {
                throw new Error('获取设置失败');
            }
            return response.json();
        })
        .then(data => {
            applySettingsData(data);
            // 新增：记录初始值
            recordInitialValues();
        })
        .catch(error => {
            console.error('获取设置失败:', error);
            // 即使失败也记录初始值
            recordInitialValues();
        });
}

// 应用设置数据到各个控件 - 修复匹配问题
function applySettingsData(settingsData) {
    settingsData.groupSettings.forEach(group => {
        group.items.forEach(item => {
            const itemName = item.itemName.trim();
            const value = item.value.trim();
            
            // 查找对应的设置项控件 - 使用更可靠的匹配方法
            let targetGroup = null;
            let targetInput = null;
            
            // 遍历所有设置组查找匹配项
            document.querySelectorAll('.setting-group').forEach(groupEl => {
                const titleEl = groupEl.querySelector('.setting-title');
                if (titleEl) {
                    // 获取纯文本内容，忽略图标和工具提示
                    const titleText = Array.from(titleEl.childNodes)
                        .filter(node => node.nodeType === Node.TEXT_NODE)
                        .map(node => node.textContent.trim())
                        .join('')
                        .trim();
                    
                    if (titleText === itemName) {
                        targetGroup = groupEl;
                        targetInput = groupEl.querySelector('.setting-input');
                    }
                }
            });
            
            if (!targetGroup || !targetInput) {
                console.warn(`未找到设置项: ${itemName}`);
                return;
            }
            
            // 根据控件类型设置值
            switch (targetInput.tagName) {
                case 'SELECT':
                    targetInput.value = value;
                    targetInput.dispatchEvent(new Event('change'));
                    break;
                case 'INPUT':
                    if (targetInput.type === 'range') {
                        targetInput.value = value;
                        // 更新范围值显示
                        const display = targetInput.nextElementSibling;
                        if (display && display.classList.contains('range-value')) {
                            display.textContent = value;
                        }
                        targetInput.dispatchEvent(new Event('input'));
                    } else {
                        targetInput.value = value;
                        targetInput.dispatchEvent(new Event('input'));
                    }
                    break;
                case 'TEXTAREA':
                    targetInput.value = value;
                    targetInput.dispatchEvent(new Event('input'));
                    break;
            }
            
            // 特殊处理主题和字体大小
            if (itemName === '主题模式') {
                document.body.classList.toggle('dark-theme', value === '夜间模式');
            } else if (itemName === '字体大小') {
                applyFontSize(value);
            }
        });
    });
}

function initSettingsModal() {
    const modal = document.getElementById('settingsModal');
    const settingsBtn = document.querySelector('.settings-btn');
    const closeBtns = document.querySelectorAll('.btn-close');
    const saveBtn = document.querySelector('.btn-save');
    
    // 创建遮罩层
    const overlay = document.createElement('div');
    overlay.className = 'settings-modal-overlay';

    
    settingsBtn.addEventListener('click', () => {
        document.body.appendChild(overlay);
        modal.style.display = 'block';
        if(!activeCategory) document.querySelector('.category-item').click();
        
        // 打开设置弹窗时获取设置数据
        fetchSettingsAndApply();
        // 获取MCP列表
        fetchAndRenderMCPList();
    });
    
    // 保存按钮事件
    saveBtn.addEventListener('click', () => {
        // 收集变更的设置项
        const changedSettings = collectChangedSettings();
        
        // 如果没有变更，直接关闭弹窗
        if (changedSettings.groupSettings.length === 0) {
            modal.style.display = 'none';
            overlay.remove();
            return;
        }
        
        // 发送 POST 请求
        fetch('http://localhost:1618/ai/settings/updatesettings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(changedSettings)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('保存设置失败');
            }
            return response.json();
        })
        .then(() => {
            modal.style.display = 'none';
            overlay.remove();
            // 更新初始值记录
            updateInitialValues();
        })
        .catch(error => {
            console.error('保存设置失败:', error);
            alert('保存失败，请重试');
        });
    });

    // 关闭按钮事件修改
    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modal.style.display = 'none';
            overlay.remove();
            // 还原所有设置项的值和页面状态
            document.querySelectorAll('.setting-input').forEach(input => {
                const group = input.closest('.setting-group');
                if (group) {
                    const titleEl = group.querySelector('.setting-title');
                    if (titleEl) {
                        const title = Array.from(titleEl.childNodes)
                            .filter(node => node.nodeType === Node.TEXT_NODE)
                            .map(node => node.textContent.trim())
                            .join('')
                            .trim();
                        
                        if (title) {
                            const savedValue = localStorage.getItem(title);
                            if (savedValue) {
                                input.value = savedValue;
                                const eventType = input.type === 'select-one' ? 'change' : 'input';
                                input.dispatchEvent(new Event(eventType));

                                if (input.type === 'range') {
                                    const display = input.nextElementSibling;
                                    if (display && display.classList.contains('range-value')) {
                                        display.textContent = savedValue;
                                    }
                                }
                            }
                        }
                    }
                }
            });
        });
    });
}

// 添加设置分类
function addSettingsCategory(name) {
    const container = document.getElementById('settingsCategories');
    
    const category = document.createElement('div');
    category.className = 'category-item';
    category.innerHTML = `<i class="fas fa-cog"></i>${name}`;

    category.addEventListener('click', function() {
        document.querySelectorAll('.category-item').forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        showCategoryContent(name);
        activeCategory = name;
    });
    
    container.appendChild(category);
    
    const contentSection = document.createElement('div');
    contentSection.className = 'category-content';
    contentSection.dataset.category = name;
    contentSection.style.display = 'none';
    document.getElementById('settingsBody').appendChild(contentSection);
    
    if(!activeCategory) {
        category.click();
    }
}

// 显示分类内容
function showCategoryContent(name) {
    document.querySelectorAll('.category-content').forEach(el => {
        el.style.display = el.dataset.category === name ? 'block' : 'none';
    });
}

// addSettingItem方法
function addSettingItem(config) {
    const category = config.category || '通用设置';
    const contentSection = document.querySelector(`.category-content[data-category="${category}"]`);
    
    const group = document.createElement('div');
    group.className = 'setting-group';
    
    const title = document.createElement('div');
    title.className = 'setting-title';
    
    // 创建纯文本节点用于标题
    const titleText = document.createTextNode(config.label);
    title.appendChild(titleText);
    
    // 添加图标
    const icon = document.createElement('i');
    icon.className = 'fas fa-sliders-h';
    title.insertBefore(icon, title.firstChild);
    
    // 添加工具提示
    if(config.tooltip) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip-icon';
        tooltip.innerHTML = 'i<div class="tooltip-text">' + config.tooltip + '</div>';
        title.appendChild(tooltip);
    }
    
    // 调用创建控件方法
    const control = createControlElement(config);

    // 主题切换逻辑
    if(config.label === '主题模式') {
        control.select.addEventListener('change', function() {
            document.body.classList.toggle('dark-theme', this.value === '夜间模式');
        });
    }
    // 字体大小处理
    if(config.label === '字体大小') {
        control.select.addEventListener('change', function() {
            applyFontSize(this.value);
            localStorage.setItem('字体大小', this.value);
        });
    }

    group.appendChild(title);
    group.appendChild(control.element);
    contentSection.appendChild(group);
}

// 新增的createControlElement方法
function createControlElement(config) {
    const container = document.createElement('div');
    let control;
    
    switch(config.type) {
        case 'select':
            control = document.createElement('select');
            control.className = 'setting-input setting-select';
            config.options.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt;
                option.textContent = opt;
                if(opt === config.default) option.selected = true;
                control.appendChild(option);
            });
            container.appendChild(control);
            return { element: container, select: control };
            
        case 'number':
        case 'text':
            control = document.createElement('input');
            control.className = 'setting-input';
            control.type = config.type;
            control.value = config.default || '';
            if(config.placeholder) control.placeholder = config.placeholder;
            container.appendChild(control);
            break;
            
        case 'range':
            control = document.createElement('input');
            control.className = 'setting-input';
            control.type = 'range';
            control.min = config.min || 0;
            control.max = config.max || 1;
            control.step = config.step || 0.1;
            control.value = config.default || 0;
            
            // 添加数值显示
            const valueDisplay = document.createElement('span');
            valueDisplay.className = 'range-value';
            valueDisplay.textContent = control.value;
            
            // 实时更新显示值
            control.addEventListener('input', () => {
                valueDisplay.textContent = control.value;
            });
            
            container.appendChild(control);
            container.appendChild(valueDisplay);
            break;

        case 'textarea':
            control = document.createElement('textarea');
            control.className = 'setting-input textarea-input';
            control.rows = config.rows || 4;
            control.value = config.default || '';
            if(config.placeholder) control.placeholder = config.placeholder;
            container.appendChild(control);
            break;

        case 'custom':  
            container.innerHTML = config.content;
            return { element: container };
         
        case 'bufferButton':
            control = document.createElement('button');
            control.className = 'setting-input btn-clear-cache';
            control.textContent = '立即清理';
            // 添加点击事件
            control.addEventListener('click', () => {
                fetch('http://localhost:1618/files/clearMemory', {
                    method: 'POST'
                })
                .then(response => {
                    if (!response.ok) throw new Error('清理失败');
                    return response.json();
                })
                .then(data => {
                    alert(data.message || '缓存清理成功');
                    //清空文件列表
                    if (window.uploadedFiles) window.uploadedFiles = [];
                    if (window.uploadedFileIds) window.uploadedFileIds = [];
                    const fileList = document.getElementById('fileList');
                    if (fileList) fileList.innerHTML = '';

                })
                .catch(error => {
                    console.error('清理失败:', error);
                    alert(error.message);
                });
            });
            container.appendChild(control);
            break;

        case 'errLogButton':
            control = document.createElement('button');
            control.className = 'setting-input btn-clear-cache';
            control.textContent = '导出错误日志';
            // 添加点击事件
            control.addEventListener('click', () => {
                exportErrorLog();
            });
            container.appendChild(control);
            break;
        default:
            control = document.createElement('input');
            control.className = 'setting-input';
    }

    // 添加焦点交互逻辑
    if(control.tagName === 'INPUT' || control.tagName === 'SELECT') {
        control.addEventListener('focus', () => {
            control.closest('.setting-group').classList.add('focus');
        });
        
        control.addEventListener('blur', () => {
            control.closest('.setting-group').classList.remove('focus');
        });
    }
    
    return { element: container, input: control };
}


// 字体应用方法
function applyFontSize(size) {
    document.body.classList.remove('text-small', 'text-large');
    
    switch(size) {
        case '小':
            document.body.classList.add('text-small');
            break;
        case '大':
            document.body.classList.add('text-large');
            break;
        // 默认保持正常尺寸
    }
}

//评分
document.addEventListener('click', (e) => {
      if(e.target.classList.contains('el-star')) {
        const container = e.target.closest('.el-rate-container');
        const stars = container.querySelectorAll('.el-star');
        const currentIndex = Array.from(stars).indexOf(e.target);
        
        stars.forEach((star, index) => {
            const delay = index * 50;
            star.style.transition = `all 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55) ${delay}ms`;
            star.classList.remove('active');
            if(index <= currentIndex) star.classList.add('active');
        });
        
        const texts = ['需要改进', '基本可用', '体验良好', '非常优秀', '完美体验'];
        container.nextElementSibling.textContent = texts[currentIndex];
        
        localStorage.setItem('userRating', currentIndex + 1);
    }
});


function initRatingSystem() {
    document.addEventListener('mouseover', (e) => {
        if(e.target.classList.contains('el-star')) {
            const container = e.target.closest('.el-rate-container');
            const stars = container.querySelectorAll('.el-star');
            const currentIndex = Array.from(stars).indexOf(e.target);
            
            stars.forEach((star, index) => {
                star.style.background = index <= currentIndex ? '#409EFF' : '#f0f2f5';
                star.style.transform = index <= currentIndex ? 'scale(1.1)' : 'scale(1)';
            });
        }
    });

    document.addEventListener('mouseout', (e) => {
        if(e.target.classList.contains('el-star')) {
            const container = e.target.closest('.el-rate-container');
            const stars = container.querySelectorAll('.el-star');
            const savedRating = parseInt(localStorage.getItem('userRating')) || 0;
            
            stars.forEach((star, index) => {
                star.style.background = index < savedRating ? '#7c4dff' : '#f0f2f5';
                star.style.transform = 'scale(1)';
            });
        }
    });
}

// 获取和渲染MCP列表的方法
function fetchAndRenderMCPList() {
    fetch('http://localhost:1618/ai/settings/getmcp')
        .then(response => response.json())
        .then(data => {
            // 清空现有MCP项（保留加号按钮）
            const mcpCategory = document.querySelector('.category-content[data-category="MCP设置"]');
            document.querySelectorAll('.mcp-item').forEach(item => item.remove());
            
            // 渲染新的MCP项
            data.forEach(mcp => {
                addMCPItem({
                    id: mcp.id,
                    name: mcp.name,
                    url: mcp.url,
                    endpoint: mcp.endPoint,
                    status: Number(mcp.isEnable)
                });
            });
        })
        .catch(error => console.error('获取MCP列表失败:', error));
}

// addMCPItem函数支持状态显示
function addMCPItem(config) {
    const contentSection = document.querySelector(`.category-content[data-category="MCP设置"]`);
    
    const group = document.createElement('div');
    group.className = 'setting-group mcp-item';

    // 添加数据属性存储MCP信息
    group.dataset.id = config.id;
    group.dataset.url = config.url;
    group.dataset.endpoint = config.endpoint || '';
    
    group.innerHTML = `
        <div class="setting-title">${config.name}</div>
         ${config.id !== 1 ? `
            <svg class="mcp-delete-icon" style="display:none;cursor:pointer;margin-left:500px;width:30px;height:30px" viewBox="0 0 1024 1024">
                <path d="M512 146.286a365.714 365.714 0 1 1 0 731.428 365.714 365.714 0 0 1 0-731.428z m0 62.025a303.69 303.69 0 1 0 0.073 607.451A303.69 303.69 0 0 0 512 208.311zM647.022 376.32a6.555 6.555 0 0 1 6.583 6.583 6.583 6.583 0 0 1-1.463 4.169L545.865 513.609l106.057 126.537a6.802 6.802 0 0 1 1.536 4.17 6.555 6.555 0 0 1-6.583 6.582l-53.833-0.292L512 553.984l-81.042 96.695-53.98 0.292a6.583 6.583 0 0 1-4.973-10.825l106.203-126.464-106.203-126.537a6.802 6.802 0 0 1-1.536-4.242 6.477 6.477 0 0 1 6.51-6.51l53.979 0.293L512 473.234l81.189-96.768z" fill="#ff4d4f"></path>
            </svg>
            ` : ''}
        <div class="setting-content">${config.url}${config.endpoint ? config.endpoint : ''}</div>
        <label class="mcp-switch">
            <input type="checkbox" ${config.status == 1 ? 'checked' : ''}>  // 修改为松散比较
            <span class="mcp-slider"></span>
        </label>
    `;

     // 添加状态变更事件监听
    const checkbox = group.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', () => {
        const mcpData = {
            id: group.dataset.id,
            name: config.name,
            url: group.dataset.url,
            endPoint: group.dataset.endpoint,
            isEnable: checkbox.checked ? 1 : 0
        };

        fetch('http://localhost:1618/ai/settings/mcpstatus', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(mcpData)
        })
        .then(response => {
            if (!response.ok) throw new Error('状态更新失败');
            return response.json();
        })
        .catch(error => {
            console.error('更新MCP状态失败:', error);
            checkbox.checked = !checkbox.checked; // 回滚状态变更
            alert('状态更新失败，请检查服务是否可用');
        });
    });

     // 添加删除按钮点击事件
     if (config.id !== 1) { 
        const deleteIcon = group.querySelector('.mcp-delete-icon');
        deleteIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            if(confirm('确定要删除该MCP配置吗？')) {
                fetch(`http://localhost:1618/ai/settings/deletemcp?id=${config.id}`, {
                    method: 'DELETE'
                })
                .then(response => {
                    if(response.ok) {
                        // 清除激活状态
                        const deleteBtn = document.querySelector('.mcp-delete-btn');
                        deleteBtn.classList.remove('active');
                        document.querySelectorAll('.mcp-delete-icon').forEach(icon => icon.style.display = 'none');
                        
                        fetchAndRenderMCPList();
                    }
                });
            }
        });
    }
    
    contentSection.insertBefore(group, contentSection.lastElementChild);
}

// 全局点击处理函数
function globalDeleteHandler(e) {
    const deleteBtn = document.querySelector('.mcp-delete-btn');
    if(!e.target.closest('.mcp-delete-icon') && !e.target.closest('.mcp-delete-btn')) {
        document.querySelectorAll('.mcp-delete-icon').forEach(icon => icon.style.display = 'none');
        deleteBtn.classList.remove('active'); // 移除激活状态
        document.removeEventListener('click', globalDeleteHandler);
    }
}

// 添加新函数：收集变更的设置项
function collectChangedSettings() {
    const result = {
        groupSettings: []
    };
    
    // 只关注这三个分类
    const targetCategories = ['通用设置', '系统设置', '模型设置'];
    
    targetCategories.forEach(category => {
        const categoryEl = document.querySelector(`.category-content[data-category="${category}"]`);
        if (!categoryEl) return;
        
        const categoryChanges = {
            settingGroup: category,
            items: []
        };
        
        categoryEl.querySelectorAll('.setting-group').forEach(group => {
            const input = group.querySelector('.setting-input');
            if (!input) return;
            
            const titleEl = group.querySelector('.setting-title');
            if (!titleEl) return;
            
            // 获取纯文本标题
            const title = Array.from(titleEl.childNodes)
                .filter(node => node.nodeType === Node.TEXT_NODE)
                .map(node => node.textContent.trim())
                .join('')
                .trim();
            
            if (!title) return;
            
            // 获取当前值和初始值
            const currentValue = input.value;
            const initialValue = input.dataset.initialValue;
            
            // 检查值是否变更
            if (currentValue !== initialValue) {
                categoryChanges.items.push({
                    itemName: title,
                    value: currentValue
                });
            }
        });
        
        // 如果该分类有变更项，添加到结果中
        if (categoryChanges.items.length > 0) {
            result.groupSettings.push(categoryChanges);
        }
    });
    
    return result;
}

// 记录设置初始值
function recordInitialValues() {
    document.querySelectorAll('.setting-input').forEach(input => {
        // 记录初始值到 data 属性
        input.dataset.initialValue = input.value;
    });
}

// 更新设置初始值
function updateInitialValues() {
    document.querySelectorAll('.setting-input').forEach(input => {
        // 更新初始值为当前值
        input.dataset.initialValue = input.value;
    });
}

function exportErrorLog() {
    fetch('http://localhost:1618/log/download/errLog')
        .then(response => {
            // 从响应头中获取文件名
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = 'users_export.txt'; // 默认文件名

            // 尝试解析响应头中的文件名
            if (contentDisposition) {
                const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                const matches = filenameRegex.exec(contentDisposition);
                if (matches && matches[1]) {
                    // 移除文件名两端的引号
                    filename = matches[1].replace(/['"]/g, '');
                }
            }

            return response.blob().then(blob => ({ blob, filename }));
        })
        .then(({ blob, filename }) => {
            // 创建下载链接
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;  // 使用服务端指定的文件名
            document.body.appendChild(a);
            a.click();

            // 清理资源
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
        })
        .catch(error => {
            console.error('导出错误日志失败:', error);
            alert('导出错误日志失败，请检查控制台');
        });
}