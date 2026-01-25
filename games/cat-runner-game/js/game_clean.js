// 游戏核心文件 - Cat Run!

class CatRunnerGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        this.levelElement = document.getElementById('levelIndicator');
        this.speedElement = document.getElementById('speedIndicator');
        this.startScreen = document.getElementById('startScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.finalScoreElement = document.getElementById('finalScore');
        this.newRecordElement = document.getElementById('newRecord');
        
        // 移动端控制按钮
        this.mobileControls = document.getElementById('mobileControls');
        this.mobileJumpBtn = document.getElementById('mobileJumpBtn');
        this.mobilePauseBtn = document.getElementById('mobilePauseBtn');
        
        // 音效管理器
        try {
            this.soundManager = new SoundManager();
        } catch (e) {
            console.error('音效管理器初始化失败:', e);
            this.soundManager = {
                play: function() {
                    console.log('音效被禁用');
                }
            };
        }
        
        // 游戏状态
        this.gameState = 'waiting'; // waiting, playing, paused, gameOver
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('catRunnerHighScore') || '0');
        this.gameSpeed = 1.5; // 更低的游戏初始速度
        this.baseSpeed = 1.5; // 基础速度
        this.gravity = 0.6;
        this.jumpPower = -15;
        this.isPaused = false;
        
        // 等级系统
        this.level = 1;
        this.levelUpScore = 100; // 每100分升一级
        
        // 速度系统（每1000分提升速度）
        this.speedLevel = 1;
        this.speedUpScore = 1000; // 每1000分提升速度
        this.speedIncrement = 0.5; // 每次速度提升的数值
        
        // 跳跃控制（Google恐龙风格）
        this.jumpKeyDown = false;
        this.jumpKeyStartTime = 0;
        
        // 跳跃物理参数（进一步增加高度）
        this.gravity = 0.6; // Google恐龙游戏使用的重力
        this.initialJumpVelocity = -18; // 进一步增加初始跳跃速度
        this.jumpDeceleration = 0.6; // 跳跃减速（类似Google的物理）
        this.minJumpVelocity = -10; // 进一步增加最小跳跃速度（短按跳跃）
        this.maxJumpVelocity = -25; // 进一步增加最大跳跃速度（长按跳跃）
        this.isJumping = false; // 跳跃状态标志
        this.jumpHoldTime = 0; // 按键按住时间
        this.maxJumpHoldTime = 250; // 增加最大按键按住时间到250毫秒
        this.jumpAcceleration = -1.0; // 增加按住时的额外加速度
        
        // 游戏对象
        this.cat = null;
        this.obstacles = [];
        this.clouds = [];
        this.particles = [];
        this.collectibleBirds = []; // 可收集的飞鸟
        
        // 动画帧
        this.animationFrame = null;
        this.frameCount = 0;
        
        this.init();
    }
    
    init() {
        console.log('游戏初始化开始');
        
        // 系统性检查
        this.validateGameState();
        
        // 设置响应式画布大小
        this.setupResponsiveCanvas();
        
        // 初始化游戏对象
        this.createCat();
        this.createClouds();
        
        // 设置事件监听器
        this.setupEventListeners();
        
        // 启动游戏循环（显示开始画面）
        this.gameLoop();
        
        console.log('游戏初始化完成');
    }
    
    validateGameState() {
        // 系统性检查游戏状态，防止未来问题
        console.log('=== 游戏状态验证 ===');
        
        // 检查必要元素
        const requiredElements = [
            { name: 'canvas', element: this.canvas },
            { name: 'scoreElement', element: this.scoreElement },
            { name: 'highScoreElement', element: this.highScoreElement },
            { name: 'levelElement', element: this.levelElement },
            { name: 'speedElement', element: this.speedElement },
            { name: 'startScreen', element: this.startScreen },
            { name: 'gameOverScreen', element: this.gameOverScreen }
        ];
        
        for (let elem of requiredElements) {
            if (!elem.element) {
                console.error(`❌ 缺少必要元素: ${elem.name}`);
            } else {
                console.log(`✅ 元素检查通过: ${elem.name}`);
            }
        }
        
        // 检查必要属性
        const requiredProperties = [
            { name: 'gameState', value: this.gameState },
            { name: 'gameSpeed', value: this.gameSpeed },
            { name: 'score', value: this.score },
            { name: 'level', value: this.level },
            { name: 'speedLevel', value: this.speedLevel }
        ];
        
        for (let prop of requiredProperties) {
            if (prop.value === undefined || prop.value === null) {
                console.error(`❌ 属性未初始化: ${prop.name}`);
            } else {
                console.log(`✅ 属性检查通过: ${prop.name} = ${prop.value}`);
            }
        }
        
        console.log('=== 验证完成 ===');
    }
    
    testButtonFunction() {
        console.log('🧪 开始按钮测试');
        
        // 测试1: 检查DOM元素
        const startBtn = document.getElementById('startBtn');
        console.log('开始按钮DOM:', startBtn);
        
        // 测试2: 模拟点击
        if (startBtn) {
            console.log('✅ 开始按钮存在，尝试点击');
            startBtn.click();
        } else {
            console.log('❌ 开始按钮不存在');
        }
        
        // 测试3: 直接调用startGame
        console.log('🔄 直接调用startGame');
        try {
            this.startGame();
            console.log('✅ startGame调用成功');
        } catch (error) {
            console.error('❌ startGame调用失败:', error);
        }
    }
    
    validateStartConditions() {
        console.log('🔍 验证游戏开始条件');
        
        // 检查必要元素
        const requiredElements = [
            { name: 'canvas', element: this.canvas },
            { name: 'startScreen', element: this.startScreen },
            { name: 'gameOverScreen', element: this.gameOverScreen }
        ];
        
        for (let elem of requiredElements) {
            if (!elem.element) {
                throw new Error(`缺少必要元素: ${elem.name}`);
            }
        }
        
        // 检查必要方法
        const requiredMethods = [
            'createCat', 'updateCat', 'draw', 'gameLoop', 'checkCollisions'
        ];
        
        for (let method of requiredMethods) {
            if (typeof this[method] !== 'function') {
                throw new Error(`缺少必要方法: ${method}`);
            }
        }
        
        console.log('✅ 开始条件验证通过');
    }
    
    setupEventListeners() {
        console.log('=== 设置事件监听器 ===');
        
        // 检查元素是否存在
        const startBtn = document.getElementById('startBtn');
        const restartBtn = document.getElementById('restartBtn');
        
        console.log('开始按钮元素:', startBtn);
        console.log('重新开始按钮元素:', restartBtn);
        console.log('当前游戏状态:', this.gameState);
        
        // 验证DOM元素
        this.validateDOMElements();
        
        // 确保事件监听器正确绑定
        this.bindStartEvents();
    }
    
    validateDOMElements() {
        console.log('--- DOM元素验证 ---');
        
        const buttons = {
            'startBtn': document.getElementById('startBtn'),
            'restartBtn': document.getElementById('restartBtn'),
            'mobileJumpBtn': document.getElementById('mobileJumpBtn'),
            'mobilePauseBtn': document.getElementById('mobilePauseBtn')
        };
        
        for (let [name, element] of Object.entries(buttons)) {
            if (element) {
                console.log(`✅ ${name} 找到`);
            } else {
                console.error(`❌ ${name} 未找到`);
            }
        }
    }
    
    bindStartEvents() {
        console.log('--- 绑定开始事件 ---');
        
        const startBtn = document.getElementById('startBtn');
        const restartBtn = document.getElementById('restartBtn');
        
        // 绑定开始按钮
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                console.log('🎮 开始按钮被点击');
                try {
                    this.startGame();
                } catch (error) {
                    console.error('❌ 开始游戏失败:', error);
                }
            });
            console.log('✅ 开始按钮事件已绑定');
        } else {
            console.error('❌ 无法绑定开始按钮事件');
        }
        
        // 绑定重新开始按钮
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                console.log('🔄 重新开始按钮被点击');
                try {
                    this.startGame();
                } catch (error) {
                    console.error('❌ 重新开始游戏失败:', error);
                }
            });
            console.log('✅ 重新开始按钮事件已绑定');
        } else {
            console.error('❌ 无法绑定重新开始按钮事件');
        }
    }
        
        // 重新开始按钮
