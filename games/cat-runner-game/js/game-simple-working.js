// 游戏核心文件 - Cat Run!
// 清理版本 - 确保开始按钮正常工作

class CatRunnerGame {
    constructor() {
        // DOM元素获取
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
        
        // 全屏控制按钮
        this.fullscreenBtn = document.getElementById('fullscreenBtn');
        
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
        this.gameState = 'waiting';
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('catRunnerHighScore') || '0');
        this.gameSpeed = 4.5; // 加快50%，从3.0增加到4.5
        this.baseSpeed = 4.5;
        this.gravity = 0.5; // 保持重力
        this.jumpPower = -18; // 保持跳跃力度
        this.isPaused = false;
        
        // 血量系统
        this.maxHealth = 100;
        this.health = 100;
        this.isInvincible = false;
        this.invincibleTime = 0;
        this.invincibleDuration = 120; // 2秒无敌时间
        
        // 无敌道具系统
        this.superInvincibleTime = 0;
        this.superInvincibleDuration = 600; // 10秒无敌时间
        this.superInvincibles = []; // 彩色无敌道具数组
        
        // 等级系统
        this.level = 1;
        this.levelUpScore = 100;
        
        // 速度系统（每500分提升速度）
        this.speedLevel = 1;
        this.speedUpScore = 500; // 更频繁的速度提升
        this.speedIncrement = 1.0; // 更大的速度增量
        
        // 跳跃物理参数（优化跳跃体验）
        this.jumpKeyDown = false;
        this.jumpKeyStartTime = 0;
        this.initialJumpVelocity = -22; // 增加初始跳跃力度
        this.minJumpVelocity = -15; // 增加最小跳跃
        this.maxJumpVelocity = -30; // 增加最大跳跃
        this.maxJumpHoldTime = 350; // 延长最大跳跃时间
        this.jumpAcceleration = -1.5; // 增强跳跃加速度
        this.isJumping = false;
        this.jumpHoldTime = 0;
        
        // 障碍物控制
        this.obstacleSpawnRate = 0.012;
        this.minObstacleGap = 250;
        this.lastObstacleX = 0;
        
        // 金色飞鸟控制 - 根据游戏进程调整
        this.baseBirdSpawnRate = 0.008;
        this.birdSpawnRate = 0.008;
        
        // 猫粮控制 - 根据游戏进程调整
        this.baseFoodSpawnRate = 0.015;
        this.foodSpawnRate = 0.015;
        this.minFoodGap = 150; // 最小间隔
        
        // 无敌道具控制 - 大幅降低概率
        this.superInvincibleSpawnRate = 0.0005; // 极低概率，原来0.002的1/4
        this.minSuperInvincibleGap = 1200; // 更大的间隔
        
        // 游戏进程控制
        this.difficultyMultiplier = 1; // 难度系数，随游戏进程增加
        
        // 游戏对象
        this.cat = null;
        this.obstacles = [];
        this.clouds = [];
        this.particles = [];
        this.collectibleBirds = [];
        this.catFoods = []; // 猫粮道具
        this.superInvincibles = []; // 彩色无敌道具
        this.backgroundElements = []; // 背景装饰元素
        this.windParticles = []; // 风粒子效果
        
        // 日夜循环系统
        this.isDaytime = true;
        this.dayNightCycle = 30000; // 30秒切换
        this.lastCycleTime = Date.now();
        this.transitionDuration = 3000; // 3秒过渡时间
        this.isTransitioning = false;
        this.transitionStartTime = 0;
        this.transitionType = null; // 'dawn' 或 'dusk'
        this.sun = null;
        this.moon = null;
        
        // 太阳月亮运动参数
        this.celestialAngle = 0; // 天体运动角度
        this.celestialSpeed = 0.0005; // 运动速度
        this.sunRiseAngle = Math.PI; // 日出角度
        this.sunSetAngle = 0; // 日落角度
        this.moonRiseAngle = Math.PI; // 月出角度
        this.moonSetAngle = 0; // 月落角度
        
        // 动画帧
        this.animationFrame = null;
        this.frameCount = 0;
        this.lastFrameTime = Date.now();
        this.targetFPS = 60;
        this.frameInterval = 1000 / this.targetFPS;
        
        // 性能优化：对象池
        this.particlePool = [];
        this.maxParticles = 100; // 限制最大粒子数
        
        // 初始化游戏
        this.init();
    }
    
    init() {
        console.log('🎮 游戏初始化开始');
        
        // 验证必要元素
        this.validateElements();
        
        // 设置响应式画布
        this.setupResponsiveCanvas();
        
        // 添加窗口大小变化监听器
        window.addEventListener('resize', () => {
            this.setupResponsiveCanvas();
        });
        
        // 初始化游戏对象
        this.createCat();
        this.createClouds();
        this.createSunAndMoon();
        this.createBackgroundElements();
        
        // 启动游戏循环
        this.gameLoop();
        
        console.log('✅ 游戏初始化完成');
    }
    
    validateElements() {
        console.log('🔍 验证DOM元素');
        
        const requiredElements = [
            { name: 'canvas', element: this.canvas },
            { name: 'scoreElement', element: this.scoreElement },
            { name: 'startScreen', element: this.startScreen },
            { name: 'gameOverScreen', element: this.gameOverScreen }
        ];
        
        for (let elem of requiredElements) {
            if (!elem.element) {
                throw new Error(`❌ 缺少必要元素: ${elem.name}`);
            }
        }
        
        console.log('✅ 所有必要元素验证通过');
    }
    
    startGame() {
        console.log('🎮 开始游戏');
        
        try {
            this.gameState = 'playing';
            this.score = 0;
            this.level = 1;
            this.speedLevel = 1;
            this.gameSpeed = this.baseSpeed;
            this.health = this.maxHealth;
            this.isInvincible = false;
            this.invincibleTime = 0;
            this.superInvincibleTime = 0;
            this.obstacles = [];
            this.particles = [];
            this.collectibleBirds = [];
            this.catFoods = [];
            this.superInvincibles = [];
            this.windParticles = [];
            this.lastObstacleX = 0;
            this.difficultyMultiplier = 1;
            this.updateHealthDisplay();
            this.updateInvincibilityDisplay();
            
            // 重置日夜循环
            this.isDaytime = true;
            this.lastCycleTime = Date.now();
            this.isTransitioning = false;
            this.transitionStartTime = 0;
            this.transitionType = null;
            if (this.sun) this.sun.visible = true;
            if (this.moon) this.moon.visible = false;
            
            // 重置跳跃状态
            this.jumpKeyDown = false;
            this.jumpKeyStartTime = 0;
            
            this.createCat();
            this.updateScore();
            this.updateLevel();
            
            // 隐藏覆盖层
            if (this.startScreen) this.startScreen.style.display = 'none';
            if (this.gameOverScreen) this.gameOverScreen.style.display = 'none';
            
            // 重置暂停按钮
            if (this.mobilePauseBtn) {
                this.mobilePauseBtn.innerHTML = '<span class="btn-icon">⏸️</span><span class="btn-text">暂停</span>';
            }
            
            console.log('✅ 游戏开始成功');
            
        } catch (error) {
            console.error('❌ 游戏开始失败:', error);
            this.gameState = 'waiting';
        }
    }
    
    jump() {
        if (!this.cat.isJumping) {
            this.cat.velocityY = this.initialJumpVelocity;
            this.cat.isJumping = true;
            this.jumpHoldTime = 0;
            this.createJumpParticles(8);
            this.soundManager.play('jump');
        }
    }
    
    prepareJump() {
        if (!this.cat.isJumping) {
            this.cat.velocityY = this.minJumpVelocity;
            this.cat.isJumping = true;
            this.jumpHoldTime = 0;
        }
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            // 进入全屏
            const elem = document.documentElement;
            if (elem.requestFullscreen) {
                elem.requestFullscreen();
            } else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen();
            } else if (elem.mozRequestFullScreen) {
                elem.mozRequestFullScreen();
            } else if (elem.msRequestFullscreen) {
                elem.msRequestFullscreen();
            }
            
            // 更新按钮显示
            if (this.fullscreenBtn) {
                this.fullscreenBtn.innerHTML = '<span class="btn-icon">⛶</span><span class="btn-text">退出</span>';
            }
        } else {
            // 退出全屏
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
            
            // 更新按钮显示
            if (this.fullscreenBtn) {
                this.fullscreenBtn.innerHTML = '<span class="btn-icon">⛶</span><span class="btn-text">全屏</span>';
            }
        }
    }
    
    createCat() {
        // 根据屏幕大小调整猫咪尺寸
        const isMobile = window.innerWidth <= 768;
        const scaleFactor = isMobile ? 0.7 : 1.0;
        
        this.cat = {
            x: 100,
            y: 250,
            width: 60 * scaleFactor,
            height: 60 * scaleFactor,
            velocityY: 0,
            isJumping: false,
            runFrame: 0,
            jumpFrame: 0,
            color: '#FF6B35',
            scaleFactor: scaleFactor
        };
    }
    
    createClouds() {
        this.clouds = [];
        for (let i = 0; i < 3; i++) {
            this.clouds.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * 150 + 20,
                width: Math.random() * 80 + 60,
                height: Math.random() * 30 + 20,
                speed: Math.random() * 0.5 + 0.2
            });
        }
    }
    
    createCatFood() {
        const groundY = this.canvas.height - 100;
        const minY = Math.max(groundY - 150, 50); // 限制在跳跃范围内
        const maxY = groundY - 30;
        
        return {
            x: this.canvas.width,
            y: Math.random() * (maxY - minY) + minY,
            width: 25,
            height: 25,
            color: '#FF6B6B',
            points: 10,
            bounceOffset: 0,
            bounceSpeed: 0.1,
            type: Math.random() > 0.7 ? 'fish' : 'normal' // 30%概率是鱼粮
        };
    }
    
    createSuperInvincible() {
        const groundY = this.canvas.height - 100;
        const minY = Math.max(groundY - 180, 50); // 限制在跳跃范围内
        const maxY = groundY - 40;
        const colors = ['#FF69B4', '#00CED1', '#FFD700', '#32CD32', '#FF4500'];
        
        return {
            x: this.canvas.width,
            y: Math.random() * (maxY - minY) + minY,
            width: 35,
            height: 35,
            colors: colors,
            currentColorIndex: 0,
            bounceOffset: 0,
            bounceSpeed: 0.08,
            rotationSpeed: 0.05,
            rotation: 0,
            glowSize: 0,
            glowDirection: 1
        };
    }
    
    createSunAndMoon() {
        // 太阳初始位置和属性
        this.sun = {
            centerX: this.canvas.width / 2,
            centerY: this.canvas.height * 0.8,
            radius: 40,
            orbitRadius: this.canvas.height * 0.6,
            visible: true,
            angle: Math.PI // 从地平线开始
        };
        
        // 月亮初始位置和属性
        this.moon = {
            centerX: this.canvas.width / 2,
            centerY: this.canvas.height * 0.8,
            radius: 35,
            orbitRadius: this.canvas.height * 0.6,
            visible: false,
            angle: Math.PI // 从地平线开始
        };
    }
    
    createBackgroundElements() {
        // 创建远景山脉
        this.backgroundElements = [];
        for (let i = 0; i < 5; i++) {
            this.backgroundElements.push({
                type: 'mountain',
                x: i * 300,
                y: this.canvas.height - 200,
                width: 200 + Math.random() * 100,
                height: 80 + Math.random() * 40,
                color: `hsl(220, 20%, ${30 + Math.random() * 10}%)`,
                speed: 0.3 // 增加视差效果
            });
        }
        
        // 创建远树
        for (let i = 0; i < 8; i++) {
            this.backgroundElements.push({
                type: 'tree',
                x: Math.random() * this.canvas.width,
                y: this.canvas.height - 120 - Math.random() * 50,
                width: 15 + Math.random() * 10,
                height: 30 + Math.random() * 20,
                color: `hsl(120, 40%, ${25 + Math.random() * 10}%)`,
                speed: 0.5 // 增加移动速度
            });
        }
        
        // 创建前景树
        for (let i = 0; i < 6; i++) {
            this.backgroundElements.push({
                type: 'tree',
                x: Math.random() * this.canvas.width,
                y: this.canvas.height - 100 - Math.random() * 30,
                width: 20 + Math.random() * 15,
                height: 40 + Math.random() * 30,
                color: `hsl(120, 50%, ${20 + Math.random() * 10}%)`,
                speed: 0.3,
                swayOffset: Math.random() * Math.PI * 2
            });
        }
    }
    
    updateBackgroundElements() {
        for (let element of this.backgroundElements) {
            element.x -= this.gameSpeed * element.speed;
            
            // 山脉循环
            if (element.type === 'mountain' && element.x + element.width < 0) {
                element.x = Math.max(...this.backgroundElements
                    .filter(e => e.type === 'mountain')
                    .map(e => e.x + e.width));
            }
            
            // 树木循环
            if (element.type === 'tree' && element.x + element.width < 0) {
                element.x = this.canvas.width + Math.random() * 200;
                element.y = this.canvas.height - 120 - Math.random() * 50;
            }
        }
        
        // 更新风粒子
        this.updateWindParticles();
    }
    
    updateWindParticles() {
        // 偶尔生成风粒子
        if (Math.random() < 0.02) {
            this.windParticles.push({
                x: this.canvas.width + 10,
                y: Math.random() * (this.canvas.height - 200) + 50,
                vx: -2 - Math.random() * 2,
                vy: Math.sin(Date.now() * 0.001) * 0.5,
                size: Math.random() * 2 + 1,
                opacity: 0.3 + Math.random() * 0.3,
                lifetime: 200
            });
        }
        
        // 更新现有风粒子
        for (let i = this.windParticles.length - 1; i >= 0; i--) {
            const particle = this.windParticles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.lifetime--;
            particle.opacity *= 0.995; // 缓慢消失
            
            if (particle.lifetime <= 0 || particle.x < -10 || particle.opacity < 0.01) {
                this.windParticles.splice(i, 1);
            }
        }
    }
    
    updateDayNightCycle() {
        const currentTime = Date.now();
        
        // 更新天体运动角度
        this.celestialAngle += this.celestialSpeed;
        if (this.celestialAngle > Math.PI * 2) {
            this.celestialAngle -= Math.PI * 2;
        }
        
        // 更新太阳位置
        this.sun.angle = this.celestialAngle;
        this.sun.x = this.sun.centerX + Math.cos(this.sun.angle + Math.PI) * this.sun.orbitRadius;
        this.sun.y = this.sun.centerY + Math.sin(this.sun.angle + Math.PI) * this.sun.orbitRadius;
        
        // 更新月亮位置（与太阳相对）
        this.moon.angle = this.celestialAngle + Math.PI;
        this.moon.x = this.moon.centerX + Math.cos(this.moon.angle + Math.PI) * this.moon.orbitRadius;
        this.moon.y = this.moon.centerY + Math.sin(this.moon.angle + Math.PI) * this.moon.orbitRadius;
        
        // 根据太阳位置判断白天黑夜
        const sunAboveHorizon = this.sun.y < this.sun.centerY;
        const moonAboveHorizon = this.moon.y < this.moon.centerY;
        
        this.isDaytime = sunAboveHorizon;
        this.sun.visible = sunAboveHorizon;
        this.moon.visible = moonAboveHorizon;
        
        if (!this.isTransitioning) {
            // 检查是否需要开始过渡
            if (currentTime - this.lastCycleTime >= this.dayNightCycle) {
                this.isTransitioning = true;
                this.transitionStartTime = currentTime;
                this.transitionType = this.isDaytime ? 'dusk' : 'dawn';
            }
        } else {
            // 检查过渡是否完成
            if (currentTime - this.transitionStartTime >= this.transitionDuration) {
                this.isTransitioning = false;
                this.lastCycleTime = currentTime;
            }
        }
    }
    
    getTransitionProgress() {
        if (!this.isTransitioning) return 0;
        const elapsed = Date.now() - this.transitionStartTime;
        return Math.min(elapsed / this.transitionDuration, 1);
    }
    
    getInterpolatedColor(color1, color2, progress) {
        const r1 = parseInt(color1.slice(1, 3), 16);
        const g1 = parseInt(color1.slice(3, 5), 16);
        const b1 = parseInt(color1.slice(5, 7), 16);
        
        const r2 = parseInt(color2.slice(1, 3), 16);
        const g2 = parseInt(color2.slice(3, 5), 16);
        const b2 = parseInt(color2.slice(5, 7), 16);
        
        const r = Math.round(r1 + (r2 - r1) * progress);
        const g = Math.round(g1 + (g2 - g1) * progress);
        const b = Math.round(b1 + (b2 - b1) * progress);
        
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    updateClouds() {
        for (let i = this.clouds.length - 1; i >= 0; i--) {
            const cloud = this.clouds[i];
            cloud.x -= cloud.speed;
            
            // 云朵飘出屏幕后重新生成
            if (cloud.x + cloud.width < 0) {
                cloud.x = this.canvas.width + Math.random() * 100;
                cloud.y = Math.random() * 150 + 20;
            }
        }
    }
    
    createJumpParticles(count) {
        count = count || 5;
        const particlesToAdd = Math.min(count, this.maxParticles - this.particles.length);
        
        for (let i = 0; i < particlesToAdd; i++) {
            const angle = (Math.PI * 2 / count) * i;
            const speed = 2 + Math.random() * 2;
            this.particles.push(this.createParticle(
                this.cat.x + this.cat.width / 2,
                this.cat.y + this.cat.height,
                Math.cos(angle) * speed,
                Math.abs(Math.sin(angle) * speed) - 1,
                '#FFD700',
                Math.random() * 3 + 1,
                25
            ));
        }
    }
    
    createParticle(x, y, vx, vy, color, size, lifetime) {
        return {
            x: x,
            y: y,
            vx: vx,
            vy: vy,
            size: size,
            color: color,
            lifetime: lifetime,
            gravity: 0.2,
            friction: 0.98,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.2
        };
    }
    
    updateScore() {
        if (this.scoreElement) this.scoreElement.textContent = this.score;
    }
    
    updateLevel() {
        if (this.levelElement) this.levelElement.textContent = `Lv.${this.level}`;
        if (this.speedElement) {
            this.speedElement.textContent = `速度: ${this.gameSpeed.toFixed(1)} (Speed Lv.${this.speedLevel})`;
            
            this.speedElement.classList.remove('fast', 'very-fast');
            if (this.gameSpeed >= 8) {
                this.speedElement.classList.add('very-fast');
            } else if (this.gameSpeed >= 6) {
                this.speedElement.classList.add('fast');
            }
        }
    }
    
    setupResponsiveCanvas() {
        // 防止移动端页面滚动和缩放
        if (window.innerWidth <= 768) {
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
            document.body.style.height = '100%';
        }
        
        // 检查是否全屏模式
        const isFullscreen = document.fullscreenElement || 
                            document.webkitFullscreenElement || 
                            document.mozFullScreenElement || 
                            document.msFullscreenElement;
        
        if (isFullscreen) {
            // 全屏模式：最大化游戏画面
            this.canvas.width = Math.floor(window.innerWidth * 0.98);
            this.canvas.height = Math.floor(window.innerHeight * 0.85);
        } else {
            // 普通模式：减去头部和底部的空间
            const headerHeight = document.querySelector('.game-header')?.offsetHeight || 100;
            const footerHeight = document.querySelector('.game-footer')?.offsetHeight || 50;
            const availableHeight = window.innerHeight - headerHeight - footerHeight - 40;
            const availableWidth = window.innerWidth - 60;
            
            // 根据屏幕尺寸动态调整，提供更大的游戏画面
            if (window.innerWidth >= 1400) {
                // 大屏幕：更大的游戏画面
                this.canvas.width = Math.min(availableWidth, 1400);
                this.canvas.height = Math.min(availableHeight, 700);
            } else if (window.innerWidth >= 1024) {
                // 中等屏幕：适中尺寸
                this.canvas.width = Math.min(availableWidth, 1200);
                this.canvas.height = Math.min(availableHeight, 600);
            } else {
                // 小屏幕：充分利用可用空间
                this.canvas.width = Math.min(availableWidth, 900);
                this.canvas.height = Math.min(availableHeight, 500);
            }
        }
        
        console.log(`📏 画布尺寸设置为: ${this.canvas.width}x${this.canvas.height}`);
    }
    
    updateCat() {
        if (this.cat.isJumping && this.jumpKeyDown && this.jumpHoldTime < this.maxJumpHoldTime) {
            this.jumpHoldTime += 16.67;
            this.cat.velocityY = Math.max(
                this.cat.velocityY + this.jumpAcceleration, 
                this.maxJumpVelocity
            );
        }
        
        if (this.cat.isJumping) {
            this.cat.velocityY += this.gravity;
        }
        
        this.cat.y += this.cat.velocityY;
        
        const groundY = this.canvas.height - 100;
        
        if (this.cat.y >= groundY - this.cat.height) {
            this.cat.y = groundY - this.cat.height;
            this.cat.velocityY = 0;
            this.cat.isJumping = false;
            this.jumpHoldTime = 0;
        }
        
        // 防止猫咪跳得太高（软性限制，不是硬性限制）
        const maxHeight = this.canvas.height * 0.15;
        if (this.cat.y < maxHeight) {
            this.cat.y = maxHeight;
            this.cat.velocityY = Math.min(this.cat.velocityY, 0);
        }
    }
    
    updateObstacles() {
        // 生成新障碍物 - 简化逻辑
        if (Math.random() < this.obstacleSpawnRate) {
            // 检查是否满足间隔要求
            const lastObstacle = this.obstacles.length > 0 ? 
                Math.max(...this.obstacles.map(o => o.x + o.width)) : 0;
            
            if (lastObstacle < this.canvas.width - this.minObstacleGap) {
                const groundY = this.canvas.height - 100;
                const obstacleHeight = Math.max(30, Math.random() * 25 + 25);
                
                this.obstacles.push({
                    x: this.canvas.width,
                    y: groundY - obstacleHeight,
                    width: 40,
                    height: obstacleHeight,
                    color: '#228B22'
                });
                
                console.log(`✅ 新障碍物生成! 位置=${this.canvas.width}, 高度=${obstacleHeight.toFixed(1)}`);
            }
        }
        
        // 更新现有障碍物
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.x -= this.gameSpeed;
            
            // 碰撞检测
            if (this.checkCollision(this.cat, obstacle)) {
                if (!this.isInvincible && !this.isSuperInvincible()) {
                    this.changeHealth(-10);
                    this.createDamageParticles(this.cat.x + this.cat.width/2, this.cat.y + this.cat.height/2);
                    this.soundManager.play('damage');
                }
            }
            
            // 移除屏幕外的障碍物
            if (obstacle.x + obstacle.width < 0) {
                this.obstacles.splice(i, 1);
                this.score += 10;
                this.updateScore();
                this.checkLevelUp();
            }
        }
    }
    
    updateCollectibleBirds() {
        // 生成飞鸟类 - 根据昼夜决定类型
        if (Math.random() < this.birdSpawnRate) {
            const birdType = this.generateBirdType();
            const bird = this.createBird(birdType);
            this.collectibleBirds.push(bird);
        }
        
        // 更新飞鸟
        for (let i = this.collectibleBirds.length - 1; i >= 0; i--) {
            const bird = this.collectibleBirds[i];
            bird.x -= this.gameSpeed * 1.3; // 增加快度系数
            bird.y += Math.sin(Date.now() * 0.004) * 3; // 更快的上下摆动
            
            // 移除屏幕外的飞鸟
            if (bird.x + bird.width < 0) {
                this.collectibleBirds.splice(i, 1);
            }
            
            // 收集检测
            if (this.checkCollision(this.cat, bird)) {
                this.handleBirdCollection(bird, i);
            }
        }
    }
    
    generateBirdType() {
        const random = Math.random();
        if (this.isDaytime) {
            // 白天：90%普通鸟，10%治疗鸟，不生成蝙蝠
            if (random < 0.9) return 'normal';
            else return 'healing';
        } else {
            // 夜晚：60%蝙蝠，25%普通鸟，15%治疗鸟
            if (random < 0.6) return 'bat';
            else if (random < 0.85) return 'normal';
            else return 'healing';
        }
    }
    
    createBird(type) {
        // 限制飞鸟生成在猫咪可跳跃范围内
        const minY = 50;
        const maxY = this.canvas.height - 200; // 确保在跳跃范围内
        
        const baseBird = {
            x: this.canvas.width,
            y: Math.random() * (maxY - minY) + minY,
            width: 30,
            height: 25,
            type: type
        };
        
        switch(type) {
            case 'normal':
                baseBird.color = '#FFD700';
                baseBird.points = 50;
                baseBird.healthEffect = 0;
                break;
            case 'bat':
                baseBird.color = '#8B4513';
                baseBird.points = 30;
                baseBird.healthEffect = -10;
                break;
            case 'healing':
                baseBird.color = '#FF69B4';
                baseBird.points = 20;
                baseBird.healthEffect = 10;
                break;
        }
        
        return baseBird;
    }
    
    handleBirdCollection(bird, index) {
        // 应用血量效果
        if (bird.healthEffect !== 0) {
            this.changeHealth(bird.healthEffect);
        }
        
        // 增加分数
        this.score += bird.points;
        this.updateScore();
        this.checkLevelUp();
        
        // 移除飞鸟
        this.collectibleBirds.splice(index, 1);
        
        // 创建特效
        if (bird.healthEffect > 0) {
            this.createHealParticles(bird.x + bird.width/2, bird.y + bird.height/2);
            this.soundManager.play('heal');
        } else if (bird.healthEffect < 0) {
            this.createDamageParticles(bird.x + bird.width/2, bird.y + bird.height/2);
            this.soundManager.play('damage');
        } else {
            this.createJumpParticles(6);
            this.soundManager.play('collect');
        }
    }
    
    changeHealth(amount) {
        if ((!this.isInvincible && !this.isSuperInvincible()) || amount > 0) { // 治疗时无视无敌状态
            this.health = Math.max(0, Math.min(this.maxHealth, this.health + amount));
            this.updateHealthDisplay();
            
            if (amount < 0 && !this.isInvincible && !this.isSuperInvincible()) {
                this.isInvincible = true;
                this.invincibleTime = this.invincibleDuration;
            }
            
            if (this.health <= 0) {
                this.gameOver();
            }
        }
    }
    
    updateHealthDisplay() {
        const healthBar = document.getElementById('healthBar');
        const healthText = document.getElementById('healthText');
        const healthPercent = (this.health / this.maxHealth) * 100;
        
        if (healthBar) {
            healthBar.style.width = healthPercent + '%';
            healthBar.className = 'health-bar';
            
            if (healthPercent <= 30) {
                healthBar.classList.add('low-health');
            } else if (healthPercent <= 60) {
                healthBar.classList.add('medium-health');
            }
        }
        
        if (healthText) {
            healthText.textContent = `${this.health}/${this.maxHealth}`;
        }
    }
    
    updateCatFoods() {
        // 生成猫粮
        if (Math.random() < this.foodSpawnRate) {
            // 检查间隔
            const lastFood = this.catFoods.length > 0 ? 
                Math.max(...this.catFoods.map(f => f.x + f.width)) : 0;
            
            if (lastFood < this.canvas.width - this.minFoodGap) {
                this.catFoods.push(this.createCatFood());
            }
        }
        
        // 更新猫粮
        for (let i = this.catFoods.length - 1; i >= 0; i--) {
            const food = this.catFoods[i];
            food.x -= this.gameSpeed;
            
            // 添加弹跳动画
            food.bounceOffset += food.bounceSpeed;
            const bounceY = Math.sin(food.bounceOffset) * 3;
            
            // 移除屏幕外的猫粮
            if (food.x + food.width < 0) {
                this.catFoods.splice(i, 1);
            }
            
            // 收集检测 - 使用临时位置进行碰撞检测
            const tempFood = {
                ...food,
                y: food.y + bounceY
            };
            
            if (this.checkCollision(this.cat, tempFood)) {
                this.score += food.points;
                this.updateScore();
                this.checkLevelUp();
                this.catFoods.splice(i, 1);
                this.createCollectParticles(food.x + food.width/2, food.y + food.height/2, food.color);
                this.soundManager.play('collect');
            }
        }
    }
    
    updateSuperInvincibles() {
        // 生成无敌道具
        if (Math.random() < this.superInvincibleSpawnRate) {
            // 检查间隔
            const lastInvincible = this.superInvincibles.length > 0 ? 
                Math.max(...this.superInvincibles.map(i => i.x + i.width)) : 0;
            
            if (lastInvincible < this.canvas.width - this.minSuperInvincibleGap) {
                this.superInvincibles.push(this.createSuperInvincible());
            }
        }
        
        // 更新无敌道具
        for (let i = this.superInvincibles.length - 1; i >= 0; i--) {
            const invincible = this.superInvincibles[i];
            invincible.x -= this.gameSpeed * 1.1; // 无敌道具稍快
            
            // 更新动画
            invincible.bounceOffset += invincible.bounceSpeed;
            invincible.rotation += invincible.rotationSpeed;
            invincible.currentColorIndex = Math.floor(invincible.rotation / (Math.PI * 2)) % invincible.colors.length;
            
            // 更新光晕
            invincible.glowSize += invincible.glowDirection * 0.5;
            if (invincible.glowSize > 10 || invincible.glowSize < 0) {
                invincible.glowDirection *= -1;
            }
            
            // 移除屏幕外的道具
            if (invincible.x + invincible.width < 0) {
                this.superInvincibles.splice(i, 1);
            }
            
            // 收集检测
            const bounceY = Math.sin(invincible.bounceOffset) * 5;
            const tempInvincible = {
                ...invincible,
                y: invincible.y + bounceY,
                width: invincible.width - 10, // 稍微缩小碰撞箱
                height: invincible.height - 10
            };
            
            if (this.checkCollision(this.cat, tempInvincible)) {
                this.activateSuperInvincibility();
                this.superInvincibles.splice(i, 1);
                this.createSuperInvincibleParticles(invincible.x + invincible.width/2, invincible.y + invincible.height/2);
                this.soundManager.play('powerup');
            }
        }
    }
    
    createCollectParticles(x, y, color) {
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3,
                size: Math.random() * 3 + 2,
                color: color,
                lifetime: 25
            });
        }
    }
    
    updateInvincibility() {
        // 更新普通无敌时间
        if (this.isInvincible) {
            this.invincibleTime--;
            if (this.invincibleTime <= 0) {
                this.isInvincible = false;
            }
        }
        
        // 更新超级无敌时间
        if (this.superInvincibleTime > 0) {
            this.superInvincibleTime--;
            if (this.superInvincibleTime <= 0) {
                this.superInvincibleTime = 0;
                this.soundManager.play('powerdown'); // 播放无敌结束音效
            }
        }
        
        // 更新无敌时间显示
        this.updateInvincibilityDisplay();
    }
    
    activateSuperInvincibility() {
        this.superInvincibleTime = this.superInvincibleDuration;
        this.createInvincibilityEffect();
    }
    
    isSuperInvincible() {
        return this.superInvincibleTime > 0;
    }
    
    updateInvincibilityDisplay() {
        const invincibleSection = document.getElementById('invincibleSection');
        const invincibleText = document.getElementById('invincibleText');
        
        if (this.superInvincibleTime > 0) {
            const seconds = Math.ceil(this.superInvincibleTime / 60);
            if (invincibleSection) invincibleSection.style.display = 'block';
            if (invincibleText) invincibleText.textContent = `⭐ 无敌: ${seconds}秒`;
        } else {
            if (invincibleSection) invincibleSection.style.display = 'none';
        }
    }
    
    updateDifficulty() {
        // 根据分数调整游戏难度 - 更快增长
        const scoreThresholds = [300, 600, 1200, 2000, 3500];
        
        for (let i = 0; i < scoreThresholds.length; i++) {
            if (this.score >= scoreThresholds[i]) {
                this.difficultyMultiplier = 1 + (i + 1) * 0.15; // 增加难度增长率
                break;
            }
        }
        
        // 更新生成率（更快增加）
        this.birdSpawnRate = Math.min(this.baseBirdSpawnRate * (1 + this.difficultyMultiplier * 0.5), 0.02);
        this.foodSpawnRate = Math.min(this.baseFoodSpawnRate * (1 + this.difficultyMultiplier * 0.3), 0.035);
    }
    
    createDamageParticles(x, y) {
        const particlesToAdd = Math.min(12, this.maxParticles - this.particles.length);
        
        for (let i = 0; i < particlesToAdd; i++) {
            const angle = (Math.PI * 2 / particlesToAdd) * i;
            const speed = 3 + Math.random() * 3;
            const particle = this.createParticle(
                x,
                y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                i % 2 === 0 ? '#FF0000' : '#FF6347',
                Math.random() * 4 + 2,
                35
            );
            particle.gravity = 0.15;
            particle.friction = 0.95;
            particle.fadeSpeed = 0.92;
            this.particles.push(particle);
        }
    }
    
    createHealParticles(x, y) {
        const particlesToAdd = Math.min(10, this.maxParticles - this.particles.length);
        
        for (let i = 0; i < particlesToAdd; i++) {
            const angle = (Math.PI * 2 / particlesToAdd) * i;
            const speed = 1.5 + Math.random() * 1.5;
            const particle = this.createParticle(
                x,
                y,
                Math.cos(angle) * speed * 0.5,
                Math.sin(angle) * speed - 3,
                ['#FF69B4', '#FFB6C1', '#FF1493'][i % 3],
                Math.random() * 3 + 2,
                45
            );
            particle.gravity = -0.05;
            particle.float = true;
            particle.wobble = Math.random() * Math.PI * 2;
            particle.wobbleSpeed = 0.1;
            this.particles.push(particle);
        }
    }
    
    createSuperInvincibleParticles(x, y) {
        // 彩色爆炸粒子 - 更真实的爆炸效果
        const colors = ['#FF69B4', '#00CED1', '#FFD700', '#32CD32', '#FF4500', '#9370DB', '#FF1493'];
        const mainParticlesToAdd = Math.min(20, Math.floor((this.maxParticles - this.particles.length) * 0.8));
        
        for (let i = 0; i < mainParticlesToAdd; i++) {
            const angle = (Math.PI * 2 / mainParticlesToAdd) * i;
            const speed = 4 + Math.random() * 6;
            const particle = this.createParticle(
                x,
                y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                colors[i % colors.length],
                Math.random() * 5 + 2,
                50
            );
            particle.gravity = 0.1;
            particle.friction = 0.92;
            particle.sparkle = true;
            particle.twinkle = Math.random() * Math.PI * 2;
            this.particles.push(particle);
        }
        
        // 中心闪光
        const flashParticlesToAdd = Math.min(5, this.maxParticles - this.particles.length - mainParticlesToAdd);
        for (let i = 0; i < flashParticlesToAdd; i++) {
            const particle = this.createParticle(
                x,
                y,
                (Math.random() - 0.5) * 8,
                (Math.random() - 0.5) * 8,
                '#FFFFFF',
                Math.random() * 3 + 4,
                20
            );
            particle.gravity = 0.2;
            particle.friction = 0.9;
            this.particles.push(particle);
        }
    }
    
    createInvincibilityEffect() {
        // 创建无敌特效指示器
        this.invincibilityEffectParticles = [];
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            this.invincibilityEffectParticles.push({
                angle: angle,
                radius: 30,
                color: ['#FF69B4', '#00CED1', '#FFD700', '#32CD32', '#FF4500'][i % 5],
                size: 3,
                rotation: 0
            });
        }
    }
    
    checkCollision(cat, object) {
        const padding = 5;
        return cat.x < object.x + object.width - padding &&
               cat.x + cat.width > object.x + padding &&
               cat.y < object.y + object.height - padding &&
               cat.y + cat.height > object.y + padding;
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        this.finalScoreElement.textContent = this.score;
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('catRunnerHighScore', this.highScore.toString());
            this.highScoreElement.textContent = this.highScore;
            if (this.newRecordElement) this.newRecordElement.style.display = 'block';
        } else {
            if (this.newRecordElement) this.newRecordElement.style.display = 'none';
        }
        
        if (this.gameOverScreen) this.gameOverScreen.style.display = 'flex';
    }
    
    gameLoop() {
        const currentTime = Date.now();
        const deltaTime = currentTime - this.lastFrameTime;
        
        // 帧率控制
        if (deltaTime >= this.frameInterval) {
            this.lastFrameTime = currentTime - (deltaTime % this.frameInterval);
            
            if (this.gameState === 'playing') {
                this.updateCat();
                this.updateObstacles();
                this.updateCollectibleBirds();
                this.updateCatFoods();
                this.updateSuperInvincibles();
                this.updateClouds();
                this.updateBackgroundElements();
                this.updateDayNightCycle(); // 更新昼夜系统
                this.updateInvincibility();
                this.updateScore();
                
                if (this.frameCount % 10 === 0) {
                    this.score += 1;
                    this.updateScore();
                    this.checkLevelUp();
                }
            } else if (this.gameState === 'paused') {
                // 暂停状态只更新背景和昼夜系统
                this.updateBackgroundElements();
                this.updateDayNightCycle();
            } else {
                // 即使不在游戏状态也要更新背景
                this.updateBackgroundElements();
                this.updateDayNightCycle();
            }
            
            this.draw();
            this.frameCount++;
        }
        
        this.animationFrame = requestAnimationFrame(() => this.gameLoop());
    }
    
    checkLevelUp() {
        const newLevel = Math.floor(this.score / this.levelUpScore) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.updateLevel();
        }
        
        const newSpeedLevel = Math.floor(this.score / this.speedUpScore) + 1;
        if (newSpeedLevel > this.speedLevel) {
            this.speedLevel = newSpeedLevel;
            this.gameSpeed = this.baseSpeed + (this.speedLevel - 1) * this.speedIncrement;
            this.updateLevel();
        }
    }
    
    draw() {
        const transitionProgress = this.getTransitionProgress();
        
        // 设置背景色（考虑过渡）
        let gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        
        if (this.isTransitioning) {
            if (this.transitionType === 'dusk') {
                // 黄昏过渡：白天 -> 夜晚
                const topColor = this.getInterpolatedColor('#87CEEB', '#0a1929', transitionProgress);
                const bottomColor = this.getInterpolatedColor('#E0F6FF', '#1a2332', transitionProgress);
                gradient.addColorStop(0, topColor);
                gradient.addColorStop(1, bottomColor);
            } else {
                // 黎明过渡：夜晚 -> 白天
                const topColor = this.getInterpolatedColor('#0a1929', '#87CEEB', transitionProgress);
                const bottomColor = this.getInterpolatedColor('#1a2332', '#E0F6FF', transitionProgress);
                gradient.addColorStop(0, topColor);
                gradient.addColorStop(1, bottomColor);
            }
        } else {
            if (this.isDaytime) {
                gradient.addColorStop(0, '#87CEEB');
                gradient.addColorStop(1, '#E0F6FF');
            } else {
                gradient.addColorStop(0, '#0a1929');
                gradient.addColorStop(1, '#1a2332');
            }
        }
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制风粒子
        this.drawWindParticles();
        
        // 绘制太阳或月亮
        this.drawSunAndMoon(transitionProgress);
        
        // 绘制云朵
        this.drawClouds(transitionProgress);
        
        // 绘制背景元素（在地面之前）
        this.drawBackgroundElements();
        
        // 绘制地面
        const groundY = this.canvas.height - 100;
        let groundColor;
        if (this.isTransitioning) {
            if (this.transitionType === 'dusk') {
                groundColor = this.getInterpolatedColor('#f0f0f0', '#2a2a2a', transitionProgress);
            } else {
                groundColor = this.getInterpolatedColor('#2a2a2a', '#f0f0f0', transitionProgress);
            }
        } else {
            groundColor = this.isDaytime ? '#f0f0f0' : '#2a2a2a';
        }
        this.ctx.fillStyle = groundColor;
        this.ctx.fillRect(0, groundY, this.canvas.width, 100);
        
        // 绘制障碍物
        this.drawObstacles();
        
        // 绘制无敌道具
        this.drawSuperInvincibles();
        
        // 绘制猫粮
        this.drawCatFoods();
        
        // 绘制金色飞鸟
        this.drawCollectibleBirds();
        
        // 绘制粒子效果
        this.drawParticles();
        
        // 绘制无敌特效（在猫咪后面）
        this.drawInvincibilityEffects();
        
        // 绘制猫咪
        if (this.cat) {
            this.drawCat();
        }
    }
    
    drawSunAndMoon(transitionProgress) {
        transitionProgress = transitionProgress || 0;
        let sunOpacity = 1;
        let moonOpacity = 1;
        let showStars = false;
        
        if (this.isTransitioning) {
            if (this.transitionType === 'dusk') {
                // 黄昏：太阳逐渐消失，月亮逐渐出现
                sunOpacity = 1 - transitionProgress;
                moonOpacity = transitionProgress;
                showStars = transitionProgress > 0.3;
                
                // 绘制日落光线效果
                if (transitionProgress > 0.2 && transitionProgress < 0.8) {
                    this.drawSunsetRays(transitionProgress);
                }
            } else {
                // 黎明：太阳逐渐出现，月亮逐渐消失
                sunOpacity = transitionProgress;
                moonOpacity = 1 - transitionProgress;
                showStars = moonOpacity > 0.3;
                
                // 绘制日出光线效果
                if (transitionProgress > 0.2 && transitionProgress < 0.8) {
                    this.drawSunriseRays(transitionProgress);
                }
            }
        } else {
            sunOpacity = this.isDaytime ? 1 : 0;
            moonOpacity = this.isDaytime ? 0 : 1;
            showStars = !this.isDaytime;
        }
        
        // 绘制太阳
        if (this.sun && sunOpacity > 0) {
            const sunHeightRatio = Math.max(0, Math.min(1, 1 - (this.sun.y / this.sun.centerY)));
            
            // 动态太阳光晕（根据高度变化）
            for (let i = 4; i > 0; i--) {
                const pulseSize = Math.sin(this.frameCount * 0.02) * 5;
                const opacity = (0.15 * i * sunOpacity * sunHeightRatio);
                this.ctx.fillStyle = `rgba(255, 223, 0, ${opacity})`;
                this.ctx.beginPath();
                this.ctx.arc(this.sun.x, this.sun.y, this.sun.radius + i * 20 + pulseSize, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            // 太阳主体渐变
            const sunGradient = this.ctx.createRadialGradient(
                this.sun.x, this.sun.y, 0,
                this.sun.x, this.sun.y, this.sun.radius
            );
            sunGradient.addColorStop(0, '#FFFACD');
            sunGradient.addColorStop(0.3, '#FFD700');
            sunGradient.addColorStop(0.7, '#FFA500');
            sunGradient.addColorStop(1, '#FF8C00');
            
            this.ctx.fillStyle = sunGradient;
            this.ctx.globalAlpha = sunOpacity;
            this.ctx.beginPath();
            this.ctx.arc(this.sun.x, this.sun.y, this.sun.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
            
            // 动态太阳光芒
            this.ctx.strokeStyle = `rgba(255, 215, 0, ${sunOpacity * sunHeightRatio})`;
            this.ctx.lineWidth = 3;
            
            for (let i = 0; i < 12; i++) {
                const angle = (Math.PI * 2 / 12) * i + this.frameCount * 0.005;
                const rayLength = this.sun.radius + 20 + Math.sin(this.frameCount * 0.03 + i) * 10;
                const x1 = this.sun.x + Math.cos(angle) * (this.sun.radius + 10);
                const y1 = this.sun.y + Math.sin(angle) * (this.sun.radius + 10);
                const x2 = this.sun.x + Math.cos(angle) * rayLength;
                const y2 = this.sun.y + Math.sin(angle) * rayLength;
                
                // 渐变光芒
                const rayGradient = this.ctx.createLinearGradient(x1, y1, x2, y2);
                rayGradient.addColorStop(0, `rgba(255, 215, 0, ${sunOpacity})`);
                rayGradient.addColorStop(1, `rgba(255, 215, 0, 0)`);
                
                this.ctx.strokeStyle = rayGradient;
                this.ctx.beginPath();
                this.ctx.moveTo(x1, y1);
                this.ctx.lineTo(x2, y2);
                this.ctx.stroke();
            }
            
            // 太阳表面细节
            this.ctx.fillStyle = `rgba(255, 140, 0, ${sunOpacity * 0.3})`;
            for (let i = 0; i < 5; i++) {
                const spotAngle = (Math.PI * 2 / 5) * i + this.frameCount * 0.001;
                const spotX = this.sun.x + Math.cos(spotAngle) * (this.sun.radius * 0.6);
                const spotY = this.sun.y + Math.sin(spotAngle) * (this.sun.radius * 0.6);
                const spotSize = this.sun.radius * 0.1;
                
                this.ctx.beginPath();
                this.ctx.arc(spotX, spotY, spotSize, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        
        // 绘制月亮
        if (this.moon && moonOpacity > 0) {
            const moonHeightRatio = Math.max(0, Math.min(1, 1 - (this.moon.y / this.moon.centerY)));
            
            // 动态月光光晕
            for (let i = 4; i > 0; i--) {
                const pulseSize = Math.sin(this.frameCount * 0.03) * 3;
                const opacity = (0.1 * i * moonOpacity * moonHeightRatio);
                this.ctx.fillStyle = `rgba(200, 220, 255, ${opacity})`;
                this.ctx.beginPath();
                this.ctx.arc(this.moon.x, this.moon.y, this.moon.radius + i * 15 + pulseSize, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            // 月亮主体渐变
            const moonGradient = this.ctx.createRadialGradient(
                this.moon.x - this.moon.radius * 0.3, 
                this.moon.y - this.moon.radius * 0.3, 
                0,
                this.moon.x, this.moon.y, this.moon.radius
            );
            moonGradient.addColorStop(0, '#FFFACD');
            moonGradient.addColorStop(0.4, '#F5F5DC');
            moonGradient.addColorStop(0.8, '#E6E6FA');
            moonGradient.addColorStop(1, '#D3D3E0');
            
            this.ctx.fillStyle = moonGradient;
            this.ctx.globalAlpha = moonOpacity;
            this.ctx.beginPath();
            this.ctx.arc(this.moon.x, this.moon.y, this.moon.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
            
            // 月亮表面纹理（环形山）
            this.ctx.fillStyle = `rgba(180, 180, 200, ${moonOpacity * 0.3})`;
            
            // 大环形山
            this.ctx.beginPath();
            this.ctx.arc(this.moon.x - 8, this.moon.y - 5, 6, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 中等环形山
            this.ctx.beginPath();
            this.ctx.arc(this.moon.x + 10, this.moon.y + 8, 4, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 小环形山
            this.ctx.beginPath();
            this.ctx.arc(this.moon.x - 3, this.moon.y + 10, 3, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.beginPath();
            this.ctx.arc(this.moon.x + 12, this.moon.y - 6, 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 月亮阴影边缘（月牙效果）
            this.ctx.fillStyle = `rgba(100, 100, 120, ${moonOpacity * 0.4})`;
            this.ctx.beginPath();
            this.ctx.arc(this.moon.x + this.moon.radius * 0.3, this.moon.y, this.moon.radius * 0.9, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 月亮光泽
            const highlightGradient = this.ctx.createRadialGradient(
                this.moon.x - this.moon.radius * 0.4,
                this.moon.y - this.moon.radius * 0.4,
                0,
                this.moon.x - this.moon.radius * 0.4,
                this.moon.y - this.moon.radius * 0.4,
                this.moon.radius * 0.5
            );
            highlightGradient.addColorStop(0, `rgba(255, 255, 255, ${moonOpacity * 0.6})`);
            highlightGradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
            
            this.ctx.fillStyle = highlightGradient;
            this.ctx.beginPath();
            this.ctx.arc(this.moon.x - this.moon.radius * 0.4, this.moon.y - this.moon.radius * 0.4, this.moon.radius * 0.5, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // 绘制星星
        if (showStars) {
            this.drawStars(moonOpacity);
        }
        
        // 绘制地面光线反射
        if (this.isTransitioning) {
            this.drawGroundReflections(transitionProgress);
        }
    }
    
    drawSunsetRays(progress) {
        const sunX = this.sun.x;
        const sunY = this.sun.y;
        const rayCount = 12;
        
        this.ctx.save();
        this.ctx.globalAlpha = (0.8 - progress) * 0.3;
        
        for (let i = 0; i < rayCount; i++) {
            const angle = (i * Math.PI * 2) / rayCount + this.frameCount * 0.001;
            const rayLength = this.canvas.width * 0.6;
            
            const gradient = this.ctx.createLinearGradient(sunX, sunY, sunX + Math.cos(angle) * rayLength, sunY + Math.sin(angle) * rayLength);
            gradient.addColorStop(0, 'rgba(255, 100, 50, 0.6)');
            gradient.addColorStop(0.5, 'rgba(255, 150, 100, 0.3)');
            gradient.addColorStop(1, 'rgba(255, 200, 150, 0)');
            
            this.ctx.strokeStyle = gradient;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(sunX, sunY);
            this.ctx.lineTo(sunX + Math.cos(angle) * rayLength, sunY + Math.sin(angle) * rayLength);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }
    
    drawSunriseRays(progress) {
        const sunX = this.sun.x;
        const sunY = this.sun.y;
        const rayCount = 16;
        
        this.ctx.save();
        this.ctx.globalAlpha = progress * 0.4;
        
        for (let i = 0; i < rayCount; i++) {
            const angle = (i * Math.PI * 2) / rayCount - Math.PI/2; // 从地平线向上
            const rayLength = this.canvas.height * 0.4;
            
            const gradient = this.ctx.createLinearGradient(sunX, sunY, sunX + Math.cos(angle) * rayLength, sunY + Math.sin(angle) * rayLength);
            gradient.addColorStop(0, 'rgba(255, 220, 100, 0.8)');
            gradient.addColorStop(0.3, 'rgba(255, 240, 150, 0.5)');
            gradient.addColorStop(1, 'rgba(255, 255, 200, 0)');
            
            this.ctx.strokeStyle = gradient;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(sunX, sunY);
            this.ctx.lineTo(sunX + Math.cos(angle) * rayLength, sunY + Math.sin(angle) * rayLength);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }
    
    drawGroundReflections(progress) {
        const groundY = this.canvas.height - 100;
        const sunX = this.sun.x;
        const moonX = this.moon.x;
        
        this.ctx.save();
        
        if (this.transitionType === 'dusk') {
            // 日落反射：橙色到紫色的地面反射
            const reflectionGradient = this.ctx.createRadialGradient(sunX, groundY, 0, sunX, groundY, this.canvas.width * 0.3);
            reflectionGradient.addColorStop(0, `rgba(255, 150, 50, ${progress * 0.3})`);
            reflectionGradient.addColorStop(0.5, `rgba(255, 100, 100, ${progress * 0.2})`);
            reflectionGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            this.ctx.fillStyle = reflectionGradient;
            this.ctx.fillRect(0, groundY, this.canvas.width, 100);
        } else {
            // 日出反射：金色的地面反射
            const reflectionGradient = this.ctx.createRadialGradient(sunX, groundY, 0, sunX, groundY, this.canvas.width * 0.4);
            reflectionGradient.addColorStop(0, `rgba(255, 220, 100, ${progress * 0.4})`);
            reflectionGradient.addColorStop(0.5, `rgba(255, 255, 150, ${progress * 0.2})`);
            reflectionGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            this.ctx.fillStyle = reflectionGradient;
            this.ctx.fillRect(0, groundY, this.canvas.width, 100);
        }
        
        this.ctx.restore();
    }
    
    drawStars(opacityMultiplier) {
        if (!opacityMultiplier) opacityMultiplier = 1;
        
        // 简单的星星绘制
        for (let i = 0; i < 50; i++) {
            const x = (i * 137 + this.frameCount * 0.1) % this.canvas.width;
            const y = (i * 73) % (this.canvas.height - 150) + 20;
            const size = (i % 3) + 1;
            const opacity = (0.3 + (Math.sin(this.frameCount * 0.05 + i) + 1) * 0.35) * opacityMultiplier;
            
            this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    // 绘制流星
    drawShootingStar() {
        const startX = Math.random() * this.canvas.width;
        const startY = Math.random() * (this.canvas.height * 0.3);
        const endX = startX + Math.random() * 200 + 100;
        const endY = startY + Math.random() * 100 + 50;
        
        // 流星轨迹
        const gradient = this.ctx.createLinearGradient(startX, startY, endX, endY);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        this.ctx.strokeStyle = gradient;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();
        
        // 流星头部光点
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.beginPath();
        this.ctx.arc(endX, endY, 3, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    // 十六进制颜色转RGB
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : [255, 255, 255];
    }
    
    drawClouds(transitionProgress) {
        transitionProgress = transitionProgress || 0;
        for (let cloud of this.clouds) {
            let cloudOpacity, cloudColor;
            
            if (this.isTransitioning) {
                if (this.transitionType === 'dusk') {
                    // 黄昏：云朵逐渐变暗并带橙色
                    cloudOpacity = 0.8 - transitionProgress * 0.5;
                    const r = 255;
                    const g = Math.floor(255 - transitionProgress * 50);
                    const b = Math.floor(255 - transitionProgress * 100);
                    cloudColor = `rgba(${r}, ${g}, ${b}, ${cloudOpacity})`;
                } else {
                    // 黎明：云朵逐渐变亮
                    cloudOpacity = 0.3 + transitionProgress * 0.5;
                    cloudColor = `rgba(255, 255, 255, ${cloudOpacity})`;
                }
            } else {
                cloudColor = this.isDaytime ? 'rgba(255, 255, 255, 0.8)' : 'rgba(200, 200, 220, 0.4)';
            }
            
            // 绘制多层次云朵
            this.drawDetailedCloud(cloud, cloudColor);
        }
    }
    
    // 绘制详细云朵的辅助函数
    drawDetailedCloud(cloud, cloudColor) {
        const frame = this.frameCount;
        const driftX = Math.sin(frame * 0.001 + cloud.x) * 2; // 轻微飘动
        
        // 云朵阴影
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.beginPath();
        this.ctx.ellipse(
            cloud.x + cloud.width/2 + driftX + 3, 
            cloud.y + cloud.height/2 + 5,
            cloud.width/2 * 0.8, 
            cloud.height/2 * 0.3,
            0, 0, Math.PI * 2
        );
        this.ctx.fill();
        
        // 云朵主体（多个圆形组成）
        this.ctx.fillStyle = cloudColor;
        
        // 主云团
        const mainX = cloud.x + cloud.width/2 + driftX;
        const mainY = cloud.y + cloud.height/2;
        
        // 中心大圆
        this.ctx.beginPath();
        this.ctx.arc(mainX, mainY, cloud.width * 0.35, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 左侧云团
        this.ctx.beginPath();
        this.ctx.arc(mainX - cloud.width * 0.25, mainY, cloud.width * 0.25, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 右侧云团
        this.ctx.beginPath();
        this.ctx.arc(mainX + cloud.width * 0.25, mainY, cloud.width * 0.25, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 上方小云团
        this.ctx.beginPath();
        this.ctx.arc(mainX - cloud.width * 0.15, mainY - cloud.height * 0.25, cloud.width * 0.2, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.arc(mainX + cloud.width * 0.15, mainY - cloud.height * 0.25, cloud.width * 0.2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 云朵高光（增加立体感）
        const highlightColor = this.isDaytime ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillStyle = highlightColor;
        
        // 顶部高光
        this.ctx.beginPath();
        this.ctx.arc(mainX - cloud.width * 0.1, mainY - cloud.height * 0.3, cloud.width * 0.15, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.arc(mainX + cloud.width * 0.2, mainY - cloud.height * 0.2, cloud.width * 0.12, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 云朵边缘柔化效果
        const edgeGradient = this.ctx.createRadialGradient(
            mainX, mainY, cloud.width * 0.2,
            mainX, mainY, cloud.width * 0.5
        );
        
        if (this.isDaytime) {
            edgeGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
            edgeGradient.addColorStop(0.8, 'rgba(255, 255, 255, 0)');
            edgeGradient.addColorStop(1, 'rgba(255, 255, 255, 0.2)');
        } else {
            edgeGradient.addColorStop(0, 'rgba(200, 200, 220, 0)');
            edgeGradient.addColorStop(0.8, 'rgba(200, 200, 220, 0)');
            edgeGradient.addColorStop(1, 'rgba(200, 200, 220, 0.1)');
        }
        
        this.ctx.fillStyle = edgeGradient;
        this.ctx.beginPath();
        this.ctx.arc(mainX, mainY, cloud.width * 0.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 添加雨效果（如果是黄昏或夜晚）
        if (!this.isDaytime && Math.random() > 0.98) {
            this.drawRainDrop(cloud.x + Math.random() * cloud.width, cloud.y + cloud.height);
        }
    }
    
    // 绘制雨滴的辅助函数
    drawRainDrop(x, y) {
        this.ctx.strokeStyle = 'rgba(150, 200, 255, 0.6)';
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x, y + 15);
        this.ctx.stroke();
    }
    
    drawObstacles() {
        for (let obstacle of this.obstacles) {
            // 仙人掌主体（渐变色）
            const cactusGradient = this.ctx.createLinearGradient(
                obstacle.x, obstacle.y, 
                obstacle.x + obstacle.width, obstacle.y + obstacle.height
            );
            cactusGradient.addColorStop(0, '#2E7D32');
            cactusGradient.addColorStop(0.5, obstacle.color);
            cactusGradient.addColorStop(1, '#1B5E20');
            
            // 主干
            this.ctx.fillStyle = cactusGradient;
            this.ctx.fillRect(
                obstacle.x + obstacle.width * 0.3, 
                obstacle.y, 
                obstacle.width * 0.4, 
                obstacle.height
            );
            
            // 左臂
            const leftArmHeight = obstacle.height * 0.6;
            this.ctx.fillRect(
                obstacle.x, 
                obstacle.y + obstacle.height - leftArmHeight, 
                obstacle.width * 0.3, 
                leftArmHeight
            );
            
            // 右臂
            const rightArmHeight = obstacle.height * 0.7;
            const rightArmY = obstacle.y + obstacle.height * 0.2;
            this.ctx.fillRect(
                obstacle.x + obstacle.width * 0.7, 
                rightArmY, 
                obstacle.width * 0.3, 
                rightArmHeight
            );
            
            // 仙人掌刺（白色小点）
            this.ctx.fillStyle = '#FFFFFF';
            const spikeSize = 2;
            // 主干上的刺
            for (let i = 0; i < 4; i++) {
                const spikeY = obstacle.y + (i + 1) * (obstacle.height / 5);
                // 左侧刺
                this.ctx.fillRect(obstacle.x + obstacle.width * 0.3 - spikeSize, spikeY, spikeSize, spikeSize * 2);
                // 右侧刺
                this.ctx.fillRect(obstacle.x + obstacle.width * 0.7, spikeY, spikeSize, spikeSize * 2);
            }
            
            // 左臂上的刺
            for (let i = 0; i < 3; i++) {
                const spikeY = obstacle.y + obstacle.height - leftArmHeight + (i + 1) * (leftArmHeight / 4);
                this.ctx.fillRect(obstacle.x + obstacle.width * 0.3 - spikeSize, spikeY, spikeSize, spikeSize * 2);
            }
            
            // 右臂上的刺
            for (let i = 0; i < 3; i++) {
                const spikeY = rightArmY + (i + 1) * (rightArmHeight / 4);
                this.ctx.fillRect(obstacle.x + obstacle.width, spikeY, spikeSize, spikeSize * 2);
            }
            
            // 仙人掌花朵（装饰）
            if (Math.random() > 0.95) { // 偶尔显示花朵
                this.ctx.fillStyle = '#FF69B4';
                const flowerSize = 8;
                const flowerX = obstacle.x + obstacle.width * 0.2;
                const flowerY = obstacle.y + obstacle.height * 0.3;
                
                // 花瓣
                for (let i = 0; i < 5; i++) {
                    const angle = (i * 72) * Math.PI / 180;
                    const petalX = flowerX + Math.cos(angle) * flowerSize * 0.6;
                    const petalY = flowerY + Math.sin(angle) * flowerSize * 0.6;
                    this.ctx.beginPath();
                    this.ctx.arc(petalX, petalY, flowerSize * 0.4, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                
                // 花心
                this.ctx.fillStyle = '#FFD700';
                this.ctx.beginPath();
                this.ctx.arc(flowerX, flowerY, flowerSize * 0.3, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            // 阴影效果
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            this.ctx.ellipse(
                obstacle.x + obstacle.width / 2,
                obstacle.y + obstacle.height + 5,
                obstacle.width * 0.6,
                obstacle.width * 0.15,
                0, 0, Math.PI * 2
            );
            this.ctx.fill();
        }
    }
    
    drawCollectibleBirds() {
        for (let bird of this.collectibleBirds) {
            switch(bird.type) {
                case 'normal':
                    this.drawNormalBird(bird);
                    break;
                case 'bat':
                    this.drawBat(bird);
                    break;
                case 'healing':
                    this.drawHealingBird(bird);
                    break;
            }
            
            // 绘制积分标签
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`+${bird.points}`, bird.x + bird.width/2, bird.y - 5);
        }
    }
    
    drawNormalBird(bird) {
        const frame = this.frameCount;
        const centerX = bird.x + bird.width / 2;
        const centerY = bird.y + bird.height / 2;
        
        // 金色光晕
        const pulseSize = Math.sin(frame * 0.1) * 3;
        for (let i = 3; i > 0; i--) {
            this.ctx.fillStyle = `rgba(255, 215, 0, ${0.1 * (4 - i)})`;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, bird.width + i * 5 + pulseSize, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // 鸟身体
        this.ctx.fillStyle = bird.color;
        this.ctx.beginPath();
        this.ctx.ellipse(centerX, centerY, bird.width / 2, bird.height / 2, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 简化的翅膀动画
        const wingFlap = Math.sin(frame * 0.3) * 10;
        this.ctx.fillStyle = '#FFB347';
        this.ctx.beginPath();
        this.ctx.ellipse(centerX, centerY, bird.width * 0.4, bird.height * 0.3, wingFlap * Math.PI / 180, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawBat(bird) {
        const frame = this.frameCount;
        const centerX = bird.x + bird.width / 2;
        const centerY = bird.y + bird.height / 2;
        
        // 暗红色光晕
        const pulseSize = Math.sin(frame * 0.15) * 4;
        for (let i = 2; i > 0; i--) {
            this.ctx.fillStyle = `rgba(139, 69, 19, ${0.15 * (3 - i)})`;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, bird.width + i * 6 + pulseSize, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // 蝙蝠身体
        this.ctx.fillStyle = bird.color;
        this.ctx.beginPath();
        this.ctx.ellipse(centerX, centerY, bird.width * 0.4, bird.height * 0.5, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 蝙蝠翅膀
        const wingFlap = Math.sin(frame * 0.4) * 20;
        this.ctx.fillStyle = '#654321';
        
        // 左翅膀
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY);
        this.ctx.quadraticCurveTo(
            centerX - bird.width * 0.8, centerY - bird.height * 0.3 + wingFlap,
            centerX - bird.width * 1.2, centerY + wingFlap
        );
        this.ctx.lineTo(centerX, centerY);
        this.ctx.fill();
        
        // 右翅膀
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY);
        this.ctx.quadraticCurveTo(
            centerX + bird.width * 0.8, centerY - bird.height * 0.3 + wingFlap,
            centerX + bird.width * 1.2, centerY + wingFlap
        );
        this.ctx.lineTo(centerX, centerY);
        this.ctx.fill();
        
        // 红色眼睛
        this.ctx.fillStyle = '#FF0000';
        this.ctx.beginPath();
        this.ctx.arc(centerX - 5, centerY - 3, 2, 0, Math.PI * 2);
        this.ctx.arc(centerX + 5, centerY - 3, 2, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawHealingBird(bird) {
        const frame = this.frameCount;
        const centerX = bird.x + bird.width / 2;
        const centerY = bird.y + bird.height / 2;
        
        // 粉色爱心光晕
        const pulseSize = Math.sin(frame * 0.12) * 5;
        for (let i = 3; i > 0; i--) {
            this.ctx.fillStyle = `rgba(255, 105, 180, ${0.2 * (4 - i)})`;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, bird.width + i * 6 + pulseSize, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // 绘制爱心形状的身体
        this.ctx.fillStyle = bird.color;
        this.ctx.beginPath();
        const heartSize = bird.width * 0.4;
        this.ctx.moveTo(centerX, centerY + heartSize * 0.3);
        this.ctx.bezierCurveTo(
            centerX - heartSize, centerY - heartSize * 0.3,
            centerX - heartSize, centerY - heartSize * 0.7,
            centerX, centerY - heartSize * 0.3
        );
        this.ctx.bezierCurveTo(
            centerX + heartSize, centerY - heartSize * 0.7,
            centerX + heartSize, centerY - heartSize * 0.3,
            centerX, centerY + heartSize * 0.3
        );
        this.ctx.fill();
        
        // 光环效果
        for (let i = 0; i < 3; i++) {
            const angle = (frame * 0.05 + i * 2 * Math.PI / 3) % (Math.PI * 2);
            const ringX = centerX + Math.cos(angle) * (bird.width + 8);
            const ringY = centerY + Math.sin(angle) * (bird.width + 8);
            
            this.ctx.strokeStyle = 'rgba(255, 182, 193, 0.6)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(ringX, ringY, 3, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }
    
    // 绘制星星的辅助函数
    drawStar(cx, cy, outerRadius, innerRadius, points) {
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        
        for (let i = 0; i < points * 2; i++) {
            const angle = (i * Math.PI) / points - Math.PI / 2;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const x = cx + Math.cos(angle) * radius;
            const y = cy + Math.sin(angle) * radius;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    drawCatFoods() {
        for (let food of this.catFoods) {
            const centerX = food.x + food.width / 2;
            const centerY = food.y + food.height / 2;
            
            // 弹跳动画
            const bounceY = Math.sin(food.bounceOffset) * 3;
            const adjustedY = centerY + bounceY;
            
            // 发光效果
            for (let i = 2; i > 0; i--) {
                const pulseSize = Math.sin(this.frameCount * 0.1) * 2;
                this.ctx.fillStyle = food.type === 'fish' ? 
                    `rgba(255, 182, 193, ${0.2 * (3 - i)})` : // 鱼粮粉色光晕
                    `rgba(255, 107, 107, ${0.2 * (3 - i)})`; // 普通猫粮红色光晕
                this.ctx.beginPath();
                this.ctx.arc(centerX, adjustedY, food.width/2 + i * 4 + pulseSize, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            if (food.type === 'fish') {
                // 绘制鱼粮
                this.drawFishFood(centerX, adjustedY, food);
            } else {
                // 绘制普通猫粮（碗形状）
                this.drawNormalFood(centerX, adjustedY, food);
            }
            
            // 绘制积分标签
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('+10', centerX, adjustedY - food.height);
        }
    }
    
    drawNormalFood(centerX, centerY, food) {
        // 猫粮碗
        this.ctx.fillStyle = '#8B4513'; // 棕色碗
        this.ctx.beginPath();
        this.ctx.ellipse(centerX, centerY + 5, food.width/2 + 2, food.height/3, 0, 0, Math.PI);
        this.ctx.fill();
        
        // 猫粮颗粒
        this.ctx.fillStyle = food.color;
        const kibbleCount = 5;
        for (let i = 0; i < kibbleCount; i++) {
            const angle = (Math.PI * 2 / kibbleCount) * i;
            const kibbleX = centerX + Math.cos(angle) * (food.width/4);
            const kibbleY = centerY + Math.sin(angle) * (food.height/4) + 2;
            
            this.ctx.beginPath();
            this.ctx.arc(kibbleX, kibbleY, 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // 高光效果
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(centerX - 3, centerY - 2, 2, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawFishFood(centerX, centerY, food) {
        // 鱼形状
        this.ctx.fillStyle = '#FF6B6B'; // 粉红色鱼身
        this.ctx.beginPath();
        this.ctx.ellipse(centerX, centerY, food.width/2, food.height/3, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 鱼尾
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - food.width/2, centerY);
        this.ctx.lineTo(centerX - food.width/2 - 8, centerY - 5);
        this.ctx.lineTo(centerX - food.width/2 - 8, centerY + 5);
        this.ctx.closePath();
        this.ctx.fill();
        
        // 鱼眼
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(centerX + food.width/4, centerY - 2, 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(centerX + food.width/4, centerY - 2, 1, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 鱼鳞纹理
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            const scaleX = centerX - food.width/4 + i * 4;
            this.ctx.beginPath();
            this.ctx.arc(scaleX, centerY, 2, 0, Math.PI);
            this.ctx.stroke();
        }
    }
    
    drawSuperInvincibles() {
        for (let invincible of this.superInvincibles) {
            const centerX = invincible.x + invincible.width / 2;
            const centerY = invincible.y + invincible.height / 2;
            
            // 弹跳动画
            const bounceY = Math.sin(invincible.bounceOffset) * 5;
            const adjustedY = centerY + bounceY;
            
            // 彩色光晕效果
            for (let i = 3; i > 0; i--) {
                const glowAlpha = 0.3 * (4 - i) / 3;
                this.ctx.fillStyle = invincible.colors[invincible.currentColorIndex] + Math.floor(glowAlpha * 255).toString(16).padStart(2, '0');
                this.ctx.beginPath();
                this.ctx.arc(centerX, adjustedY, invincible.width/2 + i * 8 + invincible.glowSize, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            // 绘制星形道具
            this.drawRainbowStar(centerX, adjustedY, invincible);
            
            // 绘制时间标签
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('10秒', centerX, adjustedY - invincible.height);
        }
    }
    
    drawRainbowStar(x, y, invincible) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(invincible.rotation);
        
        // 绘制彩虹星形
        const points = 8;
        const outerRadius = invincible.width / 2;
        const innerRadius = outerRadius / 2;
        
        this.ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const angle = (i * Math.PI) / points;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const px = Math.cos(angle) * radius;
            const py = Math.sin(angle) * radius;
            
            if (i === 0) {
                this.ctx.moveTo(px, py);
            } else {
                this.ctx.lineTo(px, py);
            }
        }
        this.ctx.closePath();
        
        // 创建渐变
        const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, outerRadius);
        const colors = invincible.colors;
        colors.forEach((color, index) => {
            const stop = index / (colors.length - 1);
            gradient.addColorStop(stop, color);
        });
        
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        // 白色边框
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // 中心光点
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    drawInvincibilityEffects() {
        if (this.isSuperInvincible()) {
            // 绘制围绕猫咪的彩虹环
            const catCenterX = this.cat.x + this.cat.width / 2;
            const catCenterY = this.cat.y + this.cat.height / 2;
            const radius = Math.max(this.cat.width, this.cat.height) * 0.8;
            
            // 彩虹环效果
            const colors = ['#FF69B4', '#00CED1', '#FFD700', '#32CD32', '#FF4500'];
            const time = this.frameCount * 0.05;
            
            for (let i = 0; i < 5; i++) {
                const angle = time + (i * Math.PI * 2 / 5);
                const x = catCenterX + Math.cos(angle) * radius;
                const y = catCenterY + Math.sin(angle) * radius;
                
                this.ctx.fillStyle = colors[i];
                this.ctx.beginPath();
                this.ctx.arc(x, y, 4, 0, Math.PI * 2);
                this.ctx.fill();
                
                // 连接线
                this.ctx.strokeStyle = colors[i];
                this.ctx.lineWidth = 2;
                this.ctx.globalAlpha = 0.5;
                this.ctx.beginPath();
                this.ctx.moveTo(catCenterX, catCenterY);
                this.ctx.lineTo(x, y);
                this.ctx.stroke();
                this.ctx.globalAlpha = 1;
            }
            
            // 外圈光晕
            this.ctx.strokeStyle = colors[Math.floor(time) % colors.length];
            this.ctx.lineWidth = 3;
            this.ctx.globalAlpha = 0.6;
            this.ctx.beginPath();
            this.ctx.arc(catCenterX, catCenterY, radius + 5, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.globalAlpha = 1;
        }
    }
    
    drawBackgroundElements() {
        // 绘制山脉
        this.ctx.globalAlpha = 0.6;
        for (let element of this.backgroundElements) {
            if (element.type === 'mountain') {
                this.ctx.fillStyle = element.color;
                this.ctx.beginPath();
                this.ctx.moveTo(element.x, element.y + element.height);
                this.ctx.lineTo(element.x + element.width / 2, element.y);
                this.ctx.lineTo(element.x + element.width, element.y + element.height);
                this.ctx.closePath();
                this.ctx.fill();
            }
        }
        
        // 绘制树木
        this.ctx.globalAlpha = 0.7;
        for (let element of this.backgroundElements) {
            if (element.type === 'tree') {
                // 树干摇摆动画
                const sway = Math.sin(Date.now() * 0.001 + element.swayOffset) * 2;
                
                this.ctx.fillStyle = element.color;
                this.ctx.fillRect(element.x + sway, element.y, element.width, element.height);
                
                // 树冠
                this.ctx.beginPath();
                this.ctx.arc(element.x + element.width/2 + sway, element.y, element.width * 1.5, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        this.ctx.globalAlpha = 1;
    }
    
    drawWindParticles() {
        for (let particle of this.windParticles) {
            this.ctx.globalAlpha = particle.opacity;
            this.ctx.strokeStyle = this.isDaytime ? 'rgba(255, 255, 255, 0.5)' : 'rgba(200, 200, 220, 0.3)';
            this.ctx.lineWidth = particle.size;
            this.ctx.lineCap = 'round';
            
            this.ctx.beginPath();
            this.ctx.moveTo(particle.x, particle.y);
            this.ctx.lineTo(particle.x - 10, particle.y);
            this.ctx.stroke();
        }
        this.ctx.globalAlpha = 1;
    }
    
    drawParticles() {
        const len = this.particles.length;
        let i = len;
        
        // 从后往前遍历，便于删除
        while (i--) {
            const particle = this.particles[i];
            
            // 快速跳过死亡粒子
            if (particle.lifetime <= 0 || 
                particle.y > this.canvas.height || 
                particle.x < -50 || 
                particle.x > this.canvas.width + 50) {
                this.particles.splice(i, 1);
                continue;
            }
            
            // 计算透明度
            let alpha = 1;
            if (particle.fadeSpeed) {
                alpha *= Math.pow(particle.fadeSpeed, 50 - particle.lifetime);
            } else if (particle.lifetime < 10) {
                alpha *= (particle.lifetime / 10);
            }
            
            // 闪烁效果
            if (particle.sparkle) {
                alpha *= (Math.sin(particle.twinkle + this.frameCount * 0.2) * 0.5 + 0.5);
            }
            
            // 漂浮效果
            if (particle.float && particle.wobbleSpeed) {
                particle.wobble += particle.wobbleSpeed;
                particle.x += Math.sin(particle.wobble) * 0.5;
            }
            
            // 绘制粒子
            if (particle.size > 0) {
                this.ctx.save();
                this.ctx.globalAlpha = alpha;
                this.ctx.fillStyle = particle.color;
                
                if (particle.rotation) {
                    this.ctx.translate(particle.x, particle.y);
                    this.ctx.rotate(particle.rotation);
                    this.ctx.fillRect(-particle.size/2, -particle.size/2, particle.size, particle.size);
                } else {
                    this.ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
                }
                
                this.ctx.restore();
            }
            
            // 更新物理
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            if (particle.gravity) {
                particle.vy += particle.gravity;
            }
            
            if (particle.friction) {
                particle.vx *= particle.friction;
                particle.vy *= particle.friction;
            }
            
            particle.lifetime--;
        }
    }
    
    drawCat() {
        const cat = this.cat;
        const frame = this.frameCount;
        const centerX = cat.x + cat.width / 2;
        const centerY = cat.y + cat.height / 2;
        
        // 无敌状态闪烁效果
        if (this.isInvincible && Math.floor(this.invincibleTime / 5) % 2 === 0) {
            this.ctx.globalAlpha = 0.5;
        }
        
        // 猫咪身体（椭圆形，更圆润）
        const bodyGradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, cat.width * 0.4);
        bodyGradient.addColorStop(0, '#FFB366');
        bodyGradient.addColorStop(0.7, cat.color);
        bodyGradient.addColorStop(1, '#FF6B35');
        this.ctx.fillStyle = bodyGradient;
        
        this.ctx.beginPath();
        this.ctx.ellipse(centerX, centerY + 5, cat.width * 0.4, cat.height * 0.35, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 猫咪头部（圆形）
        const headX = centerX + cat.width * 0.25;
        const headY = centerY - 10;
        this.ctx.fillStyle = cat.color;
        this.ctx.beginPath();
        this.ctx.arc(headX, headY, cat.width * 0.25, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 猫耳朵（三角形）
        this.ctx.fillStyle = cat.color;
        // 左耳
        this.ctx.beginPath();
        this.ctx.moveTo(cat.x + cat.width - 25, cat.y);
        this.ctx.lineTo(cat.x + cat.width - 20, cat.y - 15);
        this.ctx.lineTo(cat.x + cat.width - 10, cat.y);
        this.ctx.fill();
        // 右耳
        this.ctx.beginPath();
        this.ctx.moveTo(cat.x + cat.width - 5, cat.y);
        this.ctx.lineTo(cat.x + cat.width, cat.y - 15);
        this.ctx.lineTo(cat.x + cat.width + 5, cat.y);
        this.ctx.fill();
        
        // 耳朵内部
        this.ctx.fillStyle = '#FFB366';
        this.ctx.beginPath();
        this.ctx.moveTo(cat.x + cat.width - 22, cat.y);
        this.ctx.lineTo(cat.x + cat.width - 20, cat.y - 8);
        this.ctx.lineTo(cat.x + cat.width - 15, cat.y);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.moveTo(cat.x + cat.width - 2, cat.y);
        this.ctx.lineTo(cat.x + cat.width, cat.y - 8);
        this.ctx.lineTo(cat.x + cat.width + 2, cat.y);
        this.ctx.fill();
        
        // 眼睛（大而有神）
        const blinkTime = Math.sin(frame * 0.1) > 0.95; // 偶尔眨眼
        if (!blinkTime) {
            // 左眼
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.beginPath();
            this.ctx.ellipse(cat.x + cat.width - 18, cat.y + 10, 6, 8, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = '#2E7D32';
            this.ctx.beginPath();
            this.ctx.ellipse(cat.x + cat.width - 18, cat.y + 10, 4, 6, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = '#000000';
            this.ctx.beginPath();
            this.ctx.arc(cat.x + cat.width - 17, cat.y + 9, 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 右眼
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.beginPath();
            this.ctx.ellipse(cat.x + cat.width - 8, cat.y + 10, 6, 8, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = '#2E7D32';
            this.ctx.beginPath();
            this.ctx.ellipse(cat.x + cat.width - 8, cat.y + 10, 4, 6, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = '#000000';
            this.ctx.beginPath();
            this.ctx.arc(cat.x + cat.width - 7, cat.y + 9, 2, 0, Math.PI * 2);
            this.ctx.fill();
        } else {
            // 眨眼状态
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(cat.x + cat.width - 22, cat.y + 10);
            this.ctx.lineTo(cat.x + cat.width - 14, cat.y + 10);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(cat.x + cat.width - 12, cat.y + 10);
            this.ctx.lineTo(cat.x + cat.width - 4, cat.y + 10);
            this.ctx.stroke();
        }
        
        // 鼻子
        this.ctx.fillStyle = '#FF1493';
        this.ctx.beginPath();
        this.ctx.moveTo(cat.x + cat.width - 13, cat.y + 18);
        this.ctx.lineTo(cat.x + cat.width - 11, cat.y + 21);
        this.ctx.lineTo(cat.x + cat.width - 9, cat.y + 18);
        this.ctx.closePath();
        this.ctx.fill();
        
        // 嘴巴
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.moveTo(cat.x + cat.width - 13, cat.y + 21);
        this.ctx.quadraticCurveTo(cat.x + cat.width - 11, cat.y + 24, cat.x + cat.width - 8, cat.y + 23);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(cat.x + cat.width - 13, cat.y + 21);
        this.ctx.quadraticCurveTo(cat.x + cat.width - 15, cat.y + 24, cat.x + cat.width - 18, cat.y + 23);
        this.ctx.stroke();
        
        // 胡须
        this.ctx.strokeStyle = '#333333';
        this.ctx.lineWidth = 1;
        // 左边胡须
        this.ctx.beginPath();
        this.ctx.moveTo(cat.x + cat.width - 25, cat.y + 15);
        this.ctx.lineTo(cat.x + cat.width - 35, cat.y + 13);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(cat.x + cat.width - 25, cat.y + 19);
        this.ctx.lineTo(cat.x + cat.width - 35, cat.y + 19);
        this.ctx.stroke();
        
        // 右边胡须
        this.ctx.beginPath();
        this.ctx.moveTo(cat.x + cat.width + 5, cat.y + 15);
        this.ctx.lineTo(cat.x + cat.width + 15, cat.y + 13);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(cat.x + cat.width + 5, cat.y + 19);
        this.ctx.lineTo(cat.x + cat.width + 15, cat.y + 19);
        this.ctx.stroke();
        
        // 尾巴（摇摆动画）
        const tailSwing = Math.sin(frame * 0.1) * 15;
        this.ctx.strokeStyle = cat.color;
        this.ctx.lineWidth = 8;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(cat.x, cat.y + cat.height - 20);
        this.ctx.quadraticCurveTo(
            cat.x - 20, cat.y + cat.height - 30 + tailSwing,
            cat.x - 10, cat.y + cat.height - 50 + tailSwing * 1.5
        );
        this.ctx.stroke();
        
        // 脚部动画（圆形）
        const runFrame = Math.floor(frame / 5) % 2;
        const legColor = '#FF8C42';
        
        if (!cat.isJumping) {
            // 奔跑动画
            const frontLegOffset = runFrame === 0 ? 5 : -5;
            const backLegOffset = runFrame === 0 ? -5 : 5;
            
            // 前腿（圆形）
            this.ctx.fillStyle = legColor;
            this.ctx.beginPath();
            this.ctx.arc(centerX - cat.width * 0.15, centerY + cat.height * 0.3 + frontLegOffset, cat.width * 0.08, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 后腿（圆形）
            this.ctx.beginPath();
            this.ctx.arc(centerX + cat.width * 0.15, centerY + cat.height * 0.3 + backLegOffset, cat.width * 0.08, 0, Math.PI * 2);
            this.ctx.fill();
        } else {
            // 跳跃状态（腿部收起）
            this.ctx.fillStyle = legColor;
            this.ctx.beginPath();
            this.ctx.arc(centerX - cat.width * 0.15, centerY + cat.height * 0.25, cat.width * 0.08, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.beginPath();
            this.ctx.arc(centerX + cat.width * 0.15, centerY + cat.height * 0.25, cat.width * 0.08, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
}

// 全局事件监听器
function setupGameEvents() {
    console.log('🎧 设置全局事件监听器');
    
    // 开始和重新开始按钮
    const startBtn = document.getElementById('startBtn');
    const restartBtn = document.getElementById('restartBtn');
    
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            console.log('🎮 开始按钮被点击');
            if (window.catRunnerGame) {
                window.catRunnerGame.startGame();
            }
        });
        console.log('✅ 开始按钮事件绑定成功');
    }
    
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            console.log('🔄 重新开始按钮被点击');
            if (window.catRunnerGame) {
                window.catRunnerGame.startGame();
            }
        });
        console.log('✅ 重新开始按钮事件绑定成功');
    }
    
    // 全屏按钮事件
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => {
            console.log('⛶ 全屏按钮被点击');
            if (window.catRunnerGame) {
                window.catRunnerGame.toggleFullscreen();
            }
        });
        console.log('✅ 全屏按钮事件绑定成功');
    }
    
    // 键盘事件
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            
            if (window.catRunnerGame) {
                if (window.catRunnerGame.gameState === 'waiting' || window.catRunnerGame.gameState === 'gameOver') {
                    window.catRunnerGame.startGame();
                } else if (window.catRunnerGame.gameState === 'playing') {
                    if (!window.catRunnerGame.jumpKeyDown && !window.catRunnerGame.cat.isJumping) {
                        window.catRunnerGame.jumpKeyDown = true;
                        window.catRunnerGame.jumpKeyStartTime = Date.now();
                        window.catRunnerGame.prepareJump();
                    }
                }
            }
        }
    });
    
    document.addEventListener('keyup', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            if (window.catRunnerGame) {
                window.catRunnerGame.jumpKeyDown = false;
            }
        }
    });
    
    // 触摸事件
    const gameCanvas = document.getElementById('gameCanvas');
    if (gameCanvas) {
        gameCanvas.addEventListener('click', () => {
            if (window.catRunnerGame && window.catRunnerGame.gameState === 'playing') {
                window.catRunnerGame.jump();
            }
        });
    }
    
    // 移动端控制按钮
    const mobileJumpBtn = document.getElementById('mobileJumpBtn');
    const mobilePauseBtn = document.getElementById('mobilePauseBtn');
    
    if (mobileJumpBtn) {
        mobileJumpBtn.addEventListener('click', () => {
            if (window.catRunnerGame && window.catRunnerGame.gameState === 'playing') {
                window.catRunnerGame.jump();
            }
        });
    }
    
    if (mobilePauseBtn) {
        mobilePauseBtn.addEventListener('click', () => {
            if (window.catRunnerGame) {
                togglePause();
            }
        });
    }
    
    // 暂停功能
    function togglePause() {
        if (window.catRunnerGame.gameState === 'playing') {
            window.catRunnerGame.gameState = 'paused';
            window.catRunnerGame.isPaused = true;
            mobilePauseBtn.innerHTML = '<span class="btn-icon">▶️</span><span class="btn-text">继续</span>';
        } else if (window.catRunnerGame.gameState === 'paused') {
            window.catRunnerGame.gameState = 'playing';
            window.catRunnerGame.isPaused = false;
            mobilePauseBtn.innerHTML = '<span class="btn-icon">⏸️</span><span class="btn-text">暂停</span>';
        }
    }
    
    console.log('✅ 全局事件监听器设置完成');
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM内容已加载');
    
    try {
        const game = new CatRunnerGame();
        window.catRunnerGame = game;
        
        // 设置事件监听器
        setupGameEvents();
        
        // 添加全屏状态变化监听器
        const updateFullscreenButton = () => {
            const fullscreenBtn = document.getElementById('fullscreenBtn');
            if (fullscreenBtn) {
                if (document.fullscreenElement || 
                    document.webkitFullscreenElement || 
                    document.mozFullScreenElement || 
                    document.msFullscreenElement) {
                    fullscreenBtn.innerHTML = '<span class="btn-icon">⛶</span><span class="btn-text">退出</span>';
                } else {
                    fullscreenBtn.innerHTML = '<span class="btn-icon">⛶</span><span class="btn-text">全屏</span>';
                }
            }
        };
        
        // 监听全屏状态变化
        document.addEventListener('fullscreenchange', () => {
            updateFullscreenButton();
            // 全屏状态改变时重新调整画布尺寸
            if (window.catRunnerGame) {
                window.catRunnerGame.setupResponsiveCanvas();
            }
        });
        document.addEventListener('webkitfullscreenchange', () => {
            updateFullscreenButton();
            if (window.catRunnerGame) {
                window.catRunnerGame.setupResponsiveCanvas();
            }
        });
        document.addEventListener('mozfullscreenchange', () => {
            updateFullscreenButton();
            if (window.catRunnerGame) {
                window.catRunnerGame.setupResponsiveCanvas();
            }
        });
        document.addEventListener('MSFullscreenChange', () => {
            updateFullscreenButton();
            if (window.catRunnerGame) {
                window.catRunnerGame.setupResponsiveCanvas();
            }
        });
        
        console.log('🎮 游戏完全初始化成功');
        
    } catch (error) {
        console.error('❌ 游戏初始化失败:', error);
    }
});