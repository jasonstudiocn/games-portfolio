// 设置管理类
class SettingsManager {
    constructor() {
        this.settings = {
            graphics: {
                quality: 'medium',
                particles: true,
                screenShake: true,
                showFPS: false,
                minimap: true
            },
            audio: {
                masterVolume: 0.8,
                sfxVolume: 0.8,
                musicVolume: 0.6,
                enabled: true
            },
            gameplay: {
                difficulty: 'normal',
                autoReload: true,
                crosshairType: 'default',
                showDamageNumbers: true
            },
            controls: {
                mouseSensitivity: 1.0,
                invertMouseY: false,
                autoSprint: false
            }
        };
        
        this.isPaused = false;
        this.settingsMenu = null;
        this.isInitialized = false;
        
        this.init();
    }
    
    init() {
        this.loadSettings();
        this.createSettingsMenu();
        this.bindEvents();
        this.isInitialized = true;
    }
    
    // 创建设置菜单
    createSettingsMenu() {
        this.settingsMenu = document.createElement('div');
        this.settingsMenu.id = 'settingsMenu';
        this.settingsMenu.className = 'settings-menu';
        this.settingsMenu.innerHTML = `
            <div class="settings-content">
                <div class="settings-header">
                    <h2>游戏设置</h2>
                    <button class="close-settings" id="closeSettings">✕</button>
                </div>
                
                <div class="settings-tabs">
                    <button class="tab-btn active" data-tab="graphics">图形</button>
                    <button class="tab-btn" data-tab="audio">音频</button>
                    <button class="tab-btn" data-tab="gameplay">游戏</button>
                    <button class="tab-btn" data-tab="controls">控制</button>
                </div>
                
                <div class="settings-panels">
                    <!-- 图形设置 -->
                    <div class="settings-panel active" id="graphics-panel">
                        <div class="setting-group">
                            <label>图形质量</label>
                            <select id="graphicQuality">
                                <option value="low">低</option>
                                <option value="medium" selected>中</option>
                                <option value="high">高</option>
                                <option value="ultra">超高</option>
                            </select>
                        </div>
                        
                        <div class="setting-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="particlesEnabled" checked>
                                <span>粒子效果</span>
                            </label>
                        </div>
                        
                        <div class="setting-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="screenShakeEnabled" checked>
                                <span>屏幕震动</span>
                            </label>
                        </div>
                        
                        <div class="setting-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="showFPS">
                                <span>显示FPS</span>
                            </label>
                        </div>
                        
                        <div class="setting-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="minimapEnabled" checked>
                                <span>显示小地图</span>
                            </label>
                        </div>
                    </div>
                    
                    <!-- 音频设置 -->
                    <div class="settings-panel" id="audio-panel">
                        <div class="setting-group">
                            <label>主音量</label>
                            <input type="range" id="masterVolume" min="0" max="1" step="0.1" value="0.8">
                            <span class="volume-value">80%</span>
                        </div>
                        
                        <div class="setting-group">
                            <label>音效音量</label>
                            <input type="range" id="sfxVolume" min="0" max="1" step="0.1" value="0.8">
                            <span class="volume-value">80%</span>
                        </div>
                        
                        <div class="setting-group">
                            <label>背景音乐</label>
                            <input type="range" id="musicVolume" min="0" max="1" step="0.1" value="0.6">
                            <span class="volume-value">60%</span>
                        </div>
                        
                        <div class="setting-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="audioEnabled" checked>
                                <span>启用音频</span>
                            </label>
                        </div>
                    </div>
                    
                    <!-- 游戏设置 -->
                    <div class="settings-panel" id="gameplay-panel">
                        <div class="setting-group">
                            <label>游戏难度</label>
                            <select id="difficulty">
                                <option value="easy">简单</option>
                                <option value="normal" selected>普通</option>
                                <option value="hard">困难</option>
                                <option value="extreme">极限</option>
                            </select>
                        </div>
                        
                        <div class="setting-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="autoReload" checked>
                                <span>自动换弹</span>
                            </label>
                        </div>
                        
                        <div class="setting-group">
                            <label>准星类型</label>
                            <select id="crosshairType">
                                <option value="default" selected>默认</option>
                                <option value="dot">点状</option>
                                <option value="cross">十字</option>
                                <option value="circle">圆形</option>
                            </select>
                        </div>
                        
                        <div class="setting-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="showDamageNumbers" checked>
                                <span>显示伤害数字</span>
                            </label>
                        </div>
                    </div>
                    
                    <!-- 控制设置 -->
                    <div class="settings-panel" id="controls-panel">
                        <div class="setting-group">
                            <label>鼠标灵敏度</label>
                            <input type="range" id="mouseSensitivity" min="0.5" max="2" step="0.1" value="1.0">
                            <span class="sensitivity-value">1.0</span>
                        </div>
                        
                        <div class="setting-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="invertMouseY">
                                <span>反转鼠标Y轴</span>
                            </label>
                        </div>
                        
                        <div class="setting-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="autoSprint">
                                <span>自动冲刺</span>
                            </label>
                        </div>
                    </div>
                </div>
                
                <div class="settings-footer">
                    <button class="btn btn-secondary" id="resetSettings">重置设置</button>
                    <button class="btn btn-primary" id="saveSettings">保存设置</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.settingsMenu);
        this.hide();
    }
    
    // 绑定事件
    bindEvents() {
        // 关闭按钮
        document.getElementById('closeSettings').addEventListener('click', () => this.hide());
        
        // 标签页切换
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
        
        // 保存设置
        document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());
        
        // 重置设置
        document.getElementById('resetSettings').addEventListener('click', () => this.resetSettings());
        
        // 滑块实时更新
        this.bindSliders();
        
        // 复选框和下拉菜单实时更新
        this.bindInputs();
    }
    
    // 绑定滑块
    bindSliders() {
        const sliders = [
            { id: 'masterVolume', setting: 'masterVolume', display: '%' },
            { id: 'sfxVolume', setting: 'sfxVolume', display: '%' },
            { id: 'musicVolume', setting: 'musicVolume', display: '%' },
            { id: 'mouseSensitivity', setting: 'mouseSensitivity', display: '' }
        ];
        
        sliders.forEach(slider => {
            const element = document.getElementById(slider.id);
            if (element) {
                element.addEventListener('input', (e) => {
                    const value = parseFloat(e.target.value);
                    const display = e.target.nextElementSibling;
                    if (display && display.classList.contains('volume-value') || display.classList.contains('sensitivity-value')) {
                        display.textContent = (value * 100).toFixed(0) + slider.display;
                    }
                    
                    // 实时应用设置
                    this.applySetting(slider.setting, value);
                });
            }
        });
    }
    
    // 绑定输入控件
    bindInputs() {
        // 复选框
        const checkboxes = [
            'particlesEnabled', 'screenShakeEnabled', 'showFPS', 'minimapEnabled',
            'audioEnabled', 'autoReload', 'showDamageNumbers', 'invertMouseY', 'autoSprint'
        ];
        
        checkboxes.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', (e) => {
                    const setting = this.mapCheckboxToSetting(id);
                    if (setting) {
                        this.applySetting(setting, e.target.checked);
                    }
                });
            }
        });
        
        // 下拉菜单
        const selects = ['graphicQuality', 'difficulty', 'crosshairType'];
        selects.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', (e) => {
                    const setting = this.mapSelectToSetting(id);
                    if (setting) {
                        this.applySetting(setting, e.target.value);
                    }
                });
            }
        });
    }
    
    // 映射复选框到设置
    mapCheckboxToSetting(id) {
        const mapping = {
            'particlesEnabled': 'graphics.particles',
            'screenShakeEnabled': 'graphics.screenShake',
            'showFPS': 'graphics.showFPS',
            'minimapEnabled': 'graphics.minimap',
            'audioEnabled': 'audio.enabled',
            'autoReload': 'gameplay.autoReload',
            'showDamageNumbers': 'gameplay.showDamageNumbers',
            'invertMouseY': 'controls.invertMouseY',
            'autoSprint': 'controls.autoSprint'
        };
        return mapping[id];
    }
    
    // 映射下拉菜单到设置
    mapSelectToSetting(id) {
        const mapping = {
            'graphicQuality': 'graphics.quality',
            'difficulty': 'gameplay.difficulty',
            'crosshairType': 'gameplay.crosshairType'
        };
        return mapping[id];
    }
    
    // 应用设置
    applySetting(path, value) {
        const keys = path.split('.');
        let obj = this.settings;
        
        for (let i = 0; i < keys.length - 1; i++) {
            obj = obj[keys[i]];
        }
        
        obj[keys[keys.length - 1]] = value;
    }
    
    // 切换标签页
    switchTab(tabName) {
        // 更新按钮状态
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // 更新面板显示
        document.querySelectorAll('.settings-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(`${tabName}-panel`).classList.add('active');
    }
    
    // 显示设置菜单
    show() {
        this.isPaused = true;
        this.settingsMenu.style.display = 'flex';
        this.loadSettingsToUI();
        
        // 触发游戏暂停
        if (window.game && window.game.pauseGame) {
            window.game.pauseGame();
        }
    }
    
    // 隐藏设置菜单
    hide() {
        this.isPaused = false;
        this.settingsMenu.style.display = 'none';
        
        // 恢复游戏
        if (window.game && window.game.resumeGame) {
            window.game.resumeGame();
        }
    }
    
    // 加载设置到UI
    loadSettingsToUI() {
        // 图形设置
        document.getElementById('graphicQuality').value = this.settings.graphics.quality;
        document.getElementById('particlesEnabled').checked = this.settings.graphics.particles;
        document.getElementById('screenShakeEnabled').checked = this.settings.graphics.screenShake;
        document.getElementById('showFPS').checked = this.settings.graphics.showFPS;
        document.getElementById('minimapEnabled').checked = this.settings.graphics.minimap;
        
        // 音频设置
        document.getElementById('masterVolume').value = this.settings.audio.masterVolume;
        document.getElementById('sfxVolume').value = this.settings.audio.sfxVolume;
        document.getElementById('musicVolume').value = this.settings.audio.musicVolume;
        document.getElementById('audioEnabled').checked = this.settings.audio.enabled;
        
        // 更新音量显示
        document.getElementById('masterVolume').nextElementSibling.textContent = 
            (this.settings.audio.masterVolume * 100).toFixed(0) + '%';
        document.getElementById('sfxVolume').nextElementSibling.textContent = 
            (this.settings.audio.sfxVolume * 100).toFixed(0) + '%';
        document.getElementById('musicVolume').nextElementSibling.textContent = 
            (this.settings.audio.musicVolume * 100).toFixed(0) + '%';
        
        // 游戏设置
        document.getElementById('difficulty').value = this.settings.gameplay.difficulty;
        document.getElementById('autoReload').checked = this.settings.gameplay.autoReload;
        document.getElementById('crosshairType').value = this.settings.gameplay.crosshairType;
        document.getElementById('showDamageNumbers').checked = this.settings.gameplay.showDamageNumbers;
        
        // 控制设置
        document.getElementById('mouseSensitivity').value = this.settings.controls.mouseSensitivity;
        document.getElementById('invertMouseY').checked = this.settings.controls.invertMouseY;
        document.getElementById('autoSprint').checked = this.settings.controls.autoSprint;
        
        // 更新鼠标灵敏度显示
        document.getElementById('mouseSensitivity').nextElementSibling.textContent = 
            this.settings.controls.mouseSensitivity.toFixed(1);
    }
    
    // 保存设置
    saveSettings() {
        localStorage.setItem('gameSettings', JSON.stringify(this.settings));
        this.applySettings();
        this.hide();
        
        // 显示保存成功提示
        this.showNotification('设置已保存');
    }
    
    // 加载设置
    loadSettings() {
        const saved = localStorage.getItem('gameSettings');
        if (saved) {
            this.settings = JSON.parse(saved);
        }
    }
    
    // 重置设置
    resetSettings() {
        if (confirm('确定要重置所有设置到默认值吗？')) {
            localStorage.removeItem('gameSettings');
            this.init();
            this.loadSettingsToUI();
            this.showNotification('设置已重置');
        }
    }
    
    // 应用设置到游戏
    applySettings() {
        // 这里可以应用设置到实际游戏中
        console.log('应用设置:', this.settings);
        
        // 应用图形设置
        if (window.game) {
            window.game.applyGraphicsSettings(this.settings.graphics);
            window.game.applyAudioSettings(this.settings.audio);
            window.game.applyGameplaySettings(this.settings.gameplay);
            window.game.applyControlSettings(this.settings.controls);
        }
    }
    
    // 显示通知
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'settings-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 2000);
    }
    
    // 获取设置值
    getSetting(path) {
        const keys = path.split('.');
        let obj = this.settings;
        
        for (const key of keys) {
            obj = obj[key];
        }
        
        return obj;
    }
    
    // 设置值
    setSetting(path, value) {
        this.applySetting(path, value);
        this.saveSettings();
    }
}