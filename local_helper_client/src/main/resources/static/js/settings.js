// 修改后的完整settings.js
let activeCategory = null;

document.addEventListener('DOMContentLoaded', () => {
    initSettingsModal();
    const savedSize = localStorage.getItem('字体大小') || '中';
    applyFontSize(savedSize);

    // 示例设置项（测试用）
    addSettingsCategory('通用设置');
    addSettingsCategory('系统设置');
    addSettingsCategory('模型设置');
    addSettingsCategory('MCP设置');

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
        category: '系统设置',
        label: 'Ollama服务地址',
        type: "text",
        default: 'http://127.0.0.1:11434'
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
        default: 4096,
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

});

function initSettingsModal() {
    const modal = document.getElementById('settingsModal');
    const settingsBtn = document.querySelector('.settings-btn');
    const closeBtns = document.querySelectorAll('.btn-close');
    const saveBtn = document.querySelector('.btn-save'); // 新增保存按钮引用
    
    settingsBtn.addEventListener('click', () => {
        modal.style.display = 'block';
        if(!activeCategory) document.querySelector('.category-item').click();
    });
    
    // 保存按钮事件
    saveBtn.addEventListener('click', () => {
        // 收集并保存所有设置项的值
        document.querySelectorAll('.setting-input').forEach(input => {
            if(input.type === 'select-one') {
                localStorage.setItem(input.closest('.setting-group').querySelector('.setting-title').textContent, input.value);
            } else {
                localStorage.setItem(input.closest('.setting-group').querySelector('.setting-title').textContent, input.value);
            }
        });
        modal.style.display = 'none';
    });

    // 关闭按钮事件修改
    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modal.style.display = 'none';
            // 还原所有设置项的值和页面状态
            document.querySelectorAll('.setting-input').forEach(input => {
                const key = input.closest('.setting-group').querySelector('.setting-title').textContent;
                const savedValue = localStorage.getItem(key);

                if (savedValue) {
                    // 统一设置值并触发事件
                    input.value = savedValue;
                    const eventType = input.type === 'select-one' ? 'change' : 'input';
                    input.dispatchEvent(new Event(eventType));

                    // 特殊处理 range 类型的数值显示
                    if (input.type === 'range') {
                        const display = input.nextElementSibling;
                        if (display && display.classList.contains('range-value')) {
                            display.textContent = savedValue;
                        }
                    }
                }
            });
        });
    });
    
    window.addEventListener('click', (e) => {
        if(e.target === modal) modal.style.display = 'none';
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
    contentSection.style.display = 'none'; // 新增初始化隐藏
    document.getElementById('settingsBody').appendChild(contentSection);
    
    if(!activeCategory) {
        category.click(); // 触发点击时会自动显示对应内容
    }
}

// 显示分类内容
function showCategoryContent(name) {
    document.querySelectorAll('.category-content').forEach(el => {
        el.style.display = el.dataset.category === name ? 'block' : 'none';
    });
}

// 完整的addSettingItem方法
function addSettingItem(config) {
    const category = config.category || '通用设置';
    const contentSection = document.querySelector(`.category-content[data-category="${category}"]`);
    
    const group = document.createElement('div');
    group.className = 'setting-group';
    
    const title = document.createElement('div');
    title.className = 'setting-title';
    title.innerHTML = `
        <i class="fas fa-sliders-h"></i>${config.label}
        ${config.tooltip ? '<div class="tooltip-icon">i<div class="tooltip-text">' + config.tooltip + '</div></div>' : ''}
    `;
    
    // 调用创建控件方法
    const control = createControlElement(config);

    // 主题切换逻辑
    if(config.label === '主题模式') {
        // 移除原来的change事件
        control.select.addEventListener('change', function() {
            // 仅临时改变预览，不实际保存
            document.body.classList.toggle('dark-theme', this.value === '夜间模式');
        });
        
        // 初始化时读取保存的值
        const savedTheme = localStorage.getItem('主题模式') || '浅色模式';
        control.select.value = savedTheme;
        document.body.classList.toggle('dark-theme', savedTheme === '夜间模式');
    }
    // 字体大小处理
    if(config.label === '字体大小') {
        // 初始化设置
        const savedSize = localStorage.getItem('字体大小') || '中';
        control.select.value = savedSize;
        applyFontSize(savedSize);

        // 添加事件监听
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
            return { element: container, select: control }; // 返回包含select的复合对象
            
        case 'number':
        case 'text':
            control = document.createElement('input');
            control.className = 'setting-input';
            control.type = config.type;
            control.value = config.default || '';  // 修改这里，使用default字段
            if(config.placeholder) control.placeholder = config.placeholder;
            container.appendChild(control);  // 新增这行
            break;
            
        case 'switch':
            control = document.createElement('div');
            control.className = 'switch-container';
            control.innerHTML = `
                <label class="switch">
                    <input type="checkbox" ${config.checked ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
            `;
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