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
        this.gameSpeed = 3.0;
        this.baseSpeed = 3.0;
        this.gravity = 0.5;
        this.jumpPower = -15;
        this.isPaused = false;
        
        // 等级系统
        this.level = 1;
        this.levelUpScore = 100;
        
        // 速度系统（每1000分提升速度）
        this.speedLevel = 1;
        this.speedUpScore = 1000;
        this.speedIncrement = 0.8;
        
        // 跳跃物理参数（Google恐龙风格）
        this.jumpKeyDown = false;
        this.jumpKeyStartTime = 0;
        this.initialJumpVelocity = -20;
        this.minJumpVelocity = -12;
        this.maxJumpVelocity = -28;
        this.maxJumpHoldTime = 300;
        this.jumpAcceleration = -1.2;
        this.isJumping = false;
        this.jumpHoldTime = 0;
        
        // 障碍物控制
        this.obstacleSpawnRate = 0.012;
        this.minObstacleGap = 250;
        this.lastObstacleX = 0;
        
        // 金色飞鸟控制
        this.birdSpawnRate = 0.003;
        
        // 游戏对象
        this.cat = null;
        this.obstacles = [];
        this.clouds = [];
        this.particles = [];
        this.collectibleBirds = [];
        
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
            this.obstacles = [];
            this.particles = [];
            this.collectibleBirds = [];
            this.lastObstacleX = 0;
            
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
        this.cat = {
            x: 100,
            y: 250,
            width: 60,
            height: 60,
            velocityY: 0,
            isJumping: false,
            runFrame: 0,
            jumpFrame: 0,
            color: '#FF6B35'
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
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: this.cat.x + this.cat.width / 2,
                y: this.cat.y + this.cat.height,
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * -3,
                size: Math.random() * 4 + 2,
                color: '#FFD700',
                lifetime: 20
            });
        }
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
                this.gameOver();
                return;
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
        // 生成金色飞鸟
        if (Math.random() < this.birdSpawnRate) {
            this.collectibleBirds.push({
                x: this.canvas.width,
                y: Math.random() * (this.canvas.height - 200) + 50,
                width: 30,
                height: 25,
                color: '#FFD700',
                points: 50
            });
        }
        
        // 更新飞鸟
        for (let i = this.collectibleBirds.length - 1; i >= 0; i--) {
            const bird = this.collectibleBirds[i];
            bird.x -= this.gameSpeed * 1.2;
            bird.y += Math.sin(Date.now() * 0.003) * 2;
            
            // 移除屏幕外的飞鸟
            if (bird.x + bird.width < 0) {
                this.collectibleBirds.splice(i, 1);
            }
            
            // 收集检测
            if (this.checkCollision(this.cat, bird)) {
                this.score += bird.points;
                this.updateScore();
                this.checkLevelUp();
                this.collectibleBirds.splice(i, 1);
                this.createJumpParticles(6);
            }
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
        if (this.gameState === 'playing') {
            this.updateCat();
            this.updateObstacles();
            this.updateCollectibleBirds();
            this.updateClouds();
            this.updateDayNightCycle(); // 更新昼夜系统
            this.updateScore();
            
            if (this.frameCount % 10 === 0) {
                this.score += 1;
                this.updateScore();
                this.checkLevelUp();
            }
        } else {
            // 即使不在游戏状态也要更新昼夜系统，保证背景动态
            this.updateDayNightCycle();
        }
        
        this.draw();
        this.frameCount++;
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
        
        // 绘制太阳或月亮
        this.drawSunAndMoon(transitionProgress);
        
        // 绘制云朵
        this.drawClouds(transitionProgress);
        
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
        
        // 绘制金色飞鸟
        this.drawCollectibleBirds();
        
        // 绘制粒子效果
        this.drawParticles();
        
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
            } else {
                // 黎明：太阳逐渐出现，月亮逐渐消失
                sunOpacity = transitionProgress;
                moonOpacity = 1 - transitionProgress;
                showStars = moonOpacity > 0.3;
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
            
            // 月亮主体
            this.ctx.fillStyle = `rgba(240, 240, 240, ${moonOpacity})`;
            this.ctx.beginPath();
            this.ctx.arc(this.moon.x, this.moon.y, this.moon.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 月亮纹理
            this.ctx.fillStyle = `rgba(208, 208, 208, ${moonOpacity})`;
            this.ctx.beginPath();
            this.ctx.arc(this.moon.x - 8, this.moon.y - 5, 5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(this.moon.x + 10, this.moon.y + 8, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // 绘制星星
        if (showStars) {
            this.drawStars(moonOpacity);
        }
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
            const frame = this.frameCount;
            const centerX = bird.x + bird.width / 2;
            const centerY = bird.y + bird.height / 2;
            
            // 多层光晕效果（脉动）
            const pulseSize = Math.sin(frame * 0.1) * 3;
            for (let i = 3; i > 0; i--) {
                this.ctx.fillStyle = `rgba(255, 215, 0, ${0.1 * (4 - i)})`;
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, bird.width + i * 5 + pulseSize, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            // 鸟身体（渐变色）
            const bodyGradient = this.ctx.createRadialGradient(
                centerX, centerY - bird.height * 0.1, 0,
                centerX, centerY, bird.width * 0.6
            );
            bodyGradient.addColorStop(0, '#FFD700');
            bodyGradient.addColorStop(0.7, bird.color);
            bodyGradient.addColorStop(1, '#FFA500');
            
            this.ctx.fillStyle = bodyGradient;
            this.ctx.beginPath();
            this.ctx.ellipse(centerX, centerY, bird.width / 2, bird.height / 2, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 鸟头
            const headX = centerX + bird.width * 0.3;
            const headY = centerY - bird.height * 0.2;
            this.ctx.fillStyle = bird.color;
            this.ctx.beginPath();
            this.ctx.arc(headX, headY, bird.width * 0.25, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 鸟喙（三角形）
            this.ctx.fillStyle = '#FF6347';
            this.ctx.beginPath();
            this.ctx.moveTo(headX + bird.width * 0.2, headY);
            this.ctx.lineTo(headX + bird.width * 0.4, headY + bird.width * 0.05);
            this.ctx.lineTo(headX + bird.width * 0.2, headY + bird.width * 0.1);
            this.ctx.closePath();
            this.ctx.fill();
            
            // 眼睛
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.beginPath();
            this.ctx.arc(headX + bird.width * 0.1, headY - bird.width * 0.05, bird.width * 0.08, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = '#000000';
            this.ctx.beginPath();
            this.ctx.arc(headX + bird.width * 0.1, headY - bird.width * 0.05, bird.width * 0.04, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 翅膀（扇动动画）
            const wingFlap = Math.sin(frame * 0.3) * 15;
            
            // 左翅膀
            this.ctx.fillStyle = '#FFB347';
            this.ctx.beginPath();
            this.ctx.ellipse(
                centerX - bird.width * 0.3, centerY,
                bird.width * 0.3, bird.height * 0.6,
                -20 * Math.PI / 180 + wingFlap * Math.PI / 180,
                0, Math.PI * 2
            );
            this.ctx.fill();
            
            // 右翅膀
            this.ctx.beginPath();
            this.ctx.ellipse(
                centerX + bird.width * 0.3, centerY,
                bird.width * 0.3, bird.height * 0.6,
                20 * Math.PI / 180 - wingFlap * Math.PI / 180,
                0, Math.PI * 2
            );
            this.ctx.fill();
            
            // 尾巴（分叉）
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.lineWidth = 3;
            this.ctx.lineCap = 'round';
            
            // 左尾羽
            this.ctx.beginPath();
            this.ctx.moveTo(centerX - bird.width * 0.4, centerY);
            this.ctx.quadraticCurveTo(
                centerX - bird.width * 0.6, centerY + bird.height * 0.3,
                centerX - bird.width * 0.5, centerY + bird.height * 0.5
            );
            this.ctx.stroke();
            
            // 右尾羽
            this.ctx.beginPath();
            this.ctx.moveTo(centerX - bird.width * 0.4, centerY);
            this.ctx.quadraticCurveTo(
                centerX - bird.width * 0.6, centerY - bird.height * 0.3,
                centerX - bird.width * 0.5, centerY - bird.height * 0.5
            );
            this.ctx.stroke();
            
            // 鸟冠（装饰）
            this.ctx.fillStyle = '#FF69B4';
            const crownPulse = Math.sin(frame * 0.15) * 2;
            this.ctx.beginPath();
            this.ctx.arc(headX, headY - bird.width * 0.3, 3 + crownPulse, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 星星点缀（围绕飞鸟旋转）
            const starAngle = (frame * 0.05) % (Math.PI * 2);
            const starRadius = bird.width + 10;
            for (let i = 0; i < 3; i++) {
                const angle = starAngle + (i * 2 * Math.PI / 3);
                const starX = centerX + Math.cos(angle) * starRadius;
                const starY = centerY + Math.sin(angle) * starRadius;
                
                this.drawStar(starX, starY, 3, 5, 2);
            }
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
    
    drawParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
            
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.lifetime--;
            
            if (particle.lifetime <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    drawCat() {
        const cat = this.cat;
        const frame = this.frameCount;
        
        // 猫咪身体（渐变色）
        const bodyGradient = this.ctx.createLinearGradient(cat.x, cat.y, cat.x + cat.width, cat.y + cat.height);
        bodyGradient.addColorStop(0, '#FF8C42');
        bodyGradient.addColorStop(0.5, cat.color);
        bodyGradient.addColorStop(1, '#FF6B35');
        this.ctx.fillStyle = bodyGradient;
        this.ctx.fillRect(cat.x, cat.y, cat.width, cat.height);
        
        // 猫咪头部（椭圆形）
        this.ctx.fillStyle = cat.color;
        this.ctx.beginPath();
        this.ctx.ellipse(cat.x + cat.width - 10, cat.y + cat.height/2 - 5, 15, 20, 0, 0, Math.PI * 2);
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
        
        // 脚部动画
        const runFrame = Math.floor(frame / 5) % 2;
        if (!cat.isJumping) {
            // 奔跑动画
            this.ctx.fillStyle = '#FF8C42';
            // 前腿
            const frontLegOffset = runFrame === 0 ? 5 : -5;
            this.ctx.fillRect(cat.x + 15, cat.y + cat.height - 15, 8, 15 + frontLegOffset);
            // 后腿
            const backLegOffset = runFrame === 0 ? -5 : 5;
            this.ctx.fillRect(cat.x + 35, cat.y + cat.height - 15, 8, 15 + backLegOffset);
        } else {
            // 跳跃状态
            this.ctx.fillStyle = '#FF8C42';
            this.ctx.fillRect(cat.x + 15, cat.y + cat.height - 10, 8, 20);
            this.ctx.fillRect(cat.x + 35, cat.y + cat.height - 10, 8, 20);
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