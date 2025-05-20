// 修改后的完整settings.js
let activeCategory = null;

document.addEventListener('DOMContentLoaded', () => {
    initSettingsModal();
    const savedSize = localStorage.getItem('字体大小') || '中';
    applyFontSize(savedSize);

    // 示例设置项（测试用）
    addSettingsCategory('显示设置');
    addSettingsCategory('通用设置');

    addSettingItem({
        category: '通用设置',
        label: '自动保存间隔（分钟）',
        type: "number",
        value: 30,
        placeholder: '请输入保存间隔'
    });
    
    addSettingItem({
        category: '显示设置', 
        label: '主题模式',
        type: "select",
        options: ['浅色模式', '夜间模式'],
        default: '浅色模式'
    });
    addSettingItem({
        category: '显示设置', 
        label: '字体大小',
        type: "select",
        options: ['小', '中', '大'],
        default: '中'
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
                input.value = savedValue;
                // 触发变更事件来更新界面状态
                if (input.type === 'select-one') {
                    input.dispatchEvent(new Event('change'));
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
    title.innerHTML = `<i class="fas fa-sliders-h"></i>${config.label}`;
    
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
            control.value = config.value || '';
            if(config.placeholder) control.placeholder = config.placeholder;
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