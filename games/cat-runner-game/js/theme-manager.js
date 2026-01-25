// 主题管理器
class ThemeManager {
    constructor() {
        this.currentTheme = 'light';
        this.themeToggle = null;
        this.init();
    }
    
    init() {
        // 创建主题切换按钮
        this.createThemeToggle();
        
        // 从localStorage加载主题偏好
        const savedTheme = localStorage.getItem('catRunnerTheme') || 'light';
        this.setTheme(savedTheme);
    }
    
    createThemeToggle() {
        // 创建切换按钮
        this.themeToggle = document.createElement('button');
        this.themeToggle.innerHTML = '🌙'; // 月亮图标代表深色
        this.themeToggle.className = 'theme-toggle';
        this.themeToggle.setAttribute('title', '切换主题');
        this.themeToggle.setAttribute('aria-label', '切换明暗主题');
        
        // 添加到页面
        document.body.appendChild(this.themeToggle);
        
        // 绑定点击事件
        this.themeToggle.addEventListener('click', () => {
            this.toggleTheme();
        });
        
        // 监听系统主题变化
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (e) => {
                // 只有在用户没有手动设置主题时才跟随系统
                if (!localStorage.getItem('catRunnerTheme')) {
                    this.setTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    }
    
    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
        localStorage.setItem('catRunnerTheme', newTheme);
        
        // 添加切换动画
        this.themeToggle.style.transform = 'rotate(360deg) scale(1.2)';
        setTimeout(() => {
            this.themeToggle.style.transform = '';
        }, 300);
    }
    
    setTheme(theme) {
        this.currentTheme = theme;
        
        // 移除旧主题类
        document.body.classList.remove('light-theme', 'dark-theme');
        
        // 添加新主题类
        document.body.classList.add(`${theme}-theme`);
        
        // 更新按钮图标
        this.themeToggle.innerHTML = theme === 'light' ? '🌙' : '☀️';
        this.themeToggle.title = `切换到${theme === 'light' ? '深色' : '浅色'}主题`;
        
        // 触发主题变化事件
        window.dispatchEvent(new CustomEvent('themechange', {
            detail: { theme: theme }
        }));
        
        console.log(`主题切换到: ${theme}`);
    }
    
    getCurrentTheme() {
        return this.currentTheme;
    }
}

// 导出主题管理器
window.ThemeManager = ThemeManager;