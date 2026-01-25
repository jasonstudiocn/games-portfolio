// 全屏优化的 Cat Run! 游戏
class FullScreenCatRunner {
    constructor() {
        console.log('FullScreenCatRunner 构造函数开始');
        
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        this.startScreen = document.getElementById('startScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.finalScoreElement = document.getElementById('finalScore');
        this.newRecordElement = document.getElementById('newRecord');
        
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('catRunnerHighScore') || '0');
        this.gameState = 'waiting';
        
        // 游戏速度和等级系统
        this.baseSpeed = 6;
        this.currentSpeed = this.baseSpeed;
        this.level = 1;
        this.speedMultiplier = 1.0;
        
        // 跳跃控制（修复版）
        this.jumpPower = -12;
        this.maxJumpPower = -20;
        this.jumpPressTime = 0;
        this.jumpHolding = false;
        this.jumpHoldTimer = null;
        this.jumpEnhanced = false;
        
        // 障碍物控制
        this.obstacleSpawnRate = 0.012; // 进一步降低
        this.birdSpawnRate = 0.002;
        this.minObstacleGap = 300; // 增加最小间隔
        this.lastObstacleX = 0;
        
        console.log('FullScreenCatRunner 元素获取完成:', {
            canvas: !!this.canvas,
            ctx: !!this.ctx,
            startScreen: !!this.startScreen
        });
        
        this.init();
    }
    
    init() {
        console.log('FullScreenCatRunner 初始化开始');
        
        this.setupCanvas();
        this.updateHighScore();
        this.updateLevel();
        this.setupEventListeners();
        this.drawStartScreen();
        
        console.log('FullScreenCatRunner 初始化完成');
    }
    
    setupCanvas() {
        // 设置画布为全屏
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // 设置画布样式占满整个屏幕
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100vw';
        this.canvas.style.height = '100vh';
        this.canvas.style.margin = '0';
        this.canvas.style.padding = '0';
        this.canvas.style.zIndex = '1';
        
        console.log('画布尺寸:', this.canvas.width, 'x', this.canvas.height);
        
        // 监听窗口大小变化
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            console.log('画布重新调整大小:', this.canvas.width, 'x', this.canvas.height);
        });
        
        // 延迟请求全屏，确保页面完全加载
        setTimeout(() => {
            this.requestFullscreen();
        }, 500);
    }
    
    requestFullscreen() {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen().catch(err => {
                console.log('全屏请求被拒绝:', err);
            });
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
        
        // 添加ESC键监听
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                console.log('ESC键按下，准备退出游戏');
                if (this.gameState === 'playing') {
                    this.gameState = 'paused';
                    this.showPauseScreen();
                } else if (this.gameState === 'paused') {
                    this.gameState = 'playing';
                    this.hidePauseScreen();
                    this.gameLoop();
                }
            }
        });
    }
    
    setupEventListeners() {
        console.log('设置事件监听器');
        
        // 移除之前的事件监听器
        this.cleanupEventListeners();
        
        const startBtn = document.getElementById('startBtn');
        const restartBtn = document.getElementById('restartBtn');
        
        // 添加新的事件监听器
        this.handleStartClick = () => {
            console.log('开始游戏按钮点击');
            this.startGame();
        };
        
        if (startBtn) {
            startBtn.addEventListener('click', this.handleStartClick);
        }
        
        if (restartBtn) {
            restartBtn.addEventListener('click', this.handleStartClick);
        }
        
        // 键盘事件处理
        this.handleKeyDown = (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                console.log('空格键按下，状态:', this.gameState);
                
                if (this.gameState === 'waiting') {
                    this.startGame();
                } else if (this.gameState === 'playing') {
                    this.handleJumpStart();
                } else if (this.gameState === 'gameOver') {
                    this.startGame();
                }
            }
        };
        
        this.handleKeyUp = (e) => {
            if (e.code === 'Space' && this.gameState === 'playing') {
                e.preventDefault();
                this.handleJumpEnd();
            }
        };
        
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
        
        // 触摸事件处理
        this.handleCanvasClick = (e) => {
            e.preventDefault();
            console.log('画布点击，游戏状态:', this.gameState);
            if (this.gameState === 'playing') {
                this.handleJumpStart();
            }
        };
        
        this.handleTouchStart = (e) => {
            e.preventDefault();
            if (this.gameState === 'playing') {
                this.handleJumpStart();
            }
        };
        
        this.handleTouchEnd = (e) => {
            e.preventDefault();
            this.handleJumpEnd();
        };
        
        this.canvas.addEventListener('click', this.handleCanvasClick);
        this.canvas.addEventListener('touchstart', this.handleTouchStart);
        this.canvas.addEventListener('touchend', this.handleTouchEnd);
    }
    
    cleanupEventListeners() {
        console.log('清理事件监听器');
        
        // 清理键盘事件
        if (this.handleKeyDown) {
            document.removeEventListener('keydown', this.handleKeyDown);
        }
        if (this.handleKeyUp) {
            document.removeEventListener('keyup', this.handleKeyUp);
        }
        
        // 清理按钮事件
        const startBtn = document.getElementById('startBtn');
        const restartBtn = document.getElementById('restartBtn');
        
        if (this.handleStartClick) {
            if (startBtn) {
                startBtn.removeEventListener('click', this.handleStartClick);
            }
            if (restartBtn) {
                restartBtn.removeEventListener('click', this.handleStartClick);
            }
        }
        
        // 清理触摸事件
        if (this.handleCanvasClick) {
            this.canvas.removeEventListener('click', this.handleCanvasClick);
        }
        if (this.handleTouchStart) {
            this.canvas.removeEventListener('touchstart', this.handleTouchStart);
        }
        if (this.handleTouchEnd) {
            this.canvas.removeEventListener('touchend', this.handleTouchEnd);
        }
        
        // 清理定时器
        if (this.jumpHoldTimer) {
            clearTimeout(this.jumpHoldTimer);
            this.jumpHoldTimer = null;
        }
    }
    
    handleJumpStart() {
        if (!this.cat) {
            console.log('猫咪对象未初始化，忽略跳跃');
            return;
        }
        
        // 允许在地面时重新跳跃
        const groundY = this.canvas.height * 0.75;
        const onGround = this.cat.y >= groundY - this.cat.height - 5;
        
        if (!this.jumpHolding && (!this.cat.isJumping || onGround)) {
            this.jumpHolding = true;
            this.jumpPressTime = Date.now();
            this.jumpEnhanced = false;
            
            // 如果在地面上，重置跳跃状态
            if (onGround) {
                this.cat.isJumping = false;
            }
            
            this.performJump(this.jumpPower);
            console.log('开始跳跃检测，初始力度:', this.jumpPower, '在地面:', onGround);
            
            // 设置长按检测（更短的时间）
            this.jumpHoldTimer = setTimeout(() => {
                if (this.jumpHolding && this.cat && this.cat.isJumping && this.cat.velocityY < -3) {
                    this.jumpEnhanced = true;
                    this.performJump(this.maxJumpPower);
                    console.log('长按跳跃增强，力度:', this.maxJumpPower);
                }
            }, 150); // 减少到150ms
        }
    }
    
    handleJumpEnd() {
        if (this.jumpHolding) {
            this.jumpHolding = false;
            
            if (this.jumpHoldTimer) {
                clearTimeout(this.jumpHoldTimer);
                this.jumpHoldTimer = null;
            }
            
            const pressDuration = Date.now() - this.jumpPressTime;
            console.log('按键释放，持续时间:', pressDuration + 'ms, 增强跳跃:', this.jumpEnhanced);
            
            // 强制重置跳跃状态，防止卡住
            setTimeout(() => {
                if (this.cat && this.jumpHolding === false) {
                    const groundY = this.canvas.height * 0.75;
                    if (this.cat.y >= groundY - this.cat.height - 5) {
                        this.cat.isJumping = false;
                        console.log('强制重置跳跃状态');
                    }
                }
            }, 100);
        }
    }
    
    performJump(power) {
        if (!this.cat) {
            console.log('猫咪对象不存在，无法跳跃');
            return;
        }
        
        if (!this.cat.isJumping) {
            this.cat.velocityY = power;
            this.cat.isJumping = true;
            console.log('执行跳跃，力度:', power, '猫咪Y坐标:', this.cat.y);
        } else if (this.jumpEnhanced && this.cat.velocityY < -5) {
            // 在跳跃过程中增强
            this.cat.velocityY = power;
            console.log('增强跳跃，新力度:', power);
        }
    }
    
    startGame() {
        console.log('开始游戏');
        this.gameState = 'playing';
        this.score = 0;
        this.level = 1;
        this.currentSpeed = this.baseSpeed;
        this.speedMultiplier = 1.0;
        this.updateScore();
        this.updateLevel();
        
        this.startScreen.style.display = 'none';
        this.gameOverScreen.style.display = 'none';
        
        // 调整猫咪大小适应屏幕
        const catScale = Math.max(0.8, Math.min(2, this.canvas.width / 400));
        this.cat = {
            x: this.canvas.width * 0.2,
            y: this.canvas.height * 0.6,
            width: 60 * catScale,
            height: 60 * catScale,
            velocityY: 0,
            isJumping: false
        };
        
this.obstacles = [];
        this.birds = [];
        this.clouds = [];
        this.lastObstacleX = 0;
        this.jumpEnhanced = false;
        
        // 初始化云朵
        this.initClouds();
        
        this.gameLoop();
    }
    
    showPauseScreen() {
        // 创建暂停界面
        const pauseOverlay = document.createElement('div');
        pauseOverlay.id = 'pauseOverlay';
        pauseOverlay.className = 'game-overlay';
        pauseOverlay.style.display = 'flex';
        pauseOverlay.innerHTML = `
            <div class="overlay-content">
                <h2>游戏暂停</h2>
                <p>按 ESC 继续游戏</p>
                <p>按空格键重新开始</p>
                <button id="resumeBtn" class="game-btn">继续游戏</button>
            </div>
        `;
        document.body.appendChild(pauseOverlay);
        
        // 添加继续游戏事件
        document.getElementById('resumeBtn').addEventListener('click', () => {
            this.hidePauseScreen();
            this.gameState = 'playing';
            this.gameLoop();
        });
    }
    
    hidePauseScreen() {
        const pauseOverlay = document.getElementById('pauseOverlay');
        if (pauseOverlay) {
            pauseOverlay.remove();
        }
    }
    
    initClouds() {
        // 创建初始云朵
        for (let i = 0; i < 5; i++) {
            this.clouds.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * (this.canvas.height * 0.4) + 20,
                width: Math.random() * 60 + 40,
                height: Math.random() * 20 + 15,
                speed: Math.random() * 0.5 + 0.2,
                opacity: Math.random() * 0.3 + 0.4
            });
        }
    }
    
    updateLevel() {
        const newLevel = Math.floor(this.score / 100) + 1;
        
        if (newLevel !== this.level) {
            this.level = newLevel;
            this.speedMultiplier = 1 + (this.level - 1) * 0.12; // 每级速度增加12%
            this.currentSpeed = this.baseSpeed * this.speedMultiplier;
            
            this.obstacleSpawnRate = Math.min(0.012 + (this.level - 1) * 0.0015, 0.020);
            this.birdSpawnRate = Math.min(0.002 + (this.level - 1) * 0.0003, 0.004);
            
            console.log(`升级到等级 ${this.level}！速度倍数: ${this.speedMultiplier.toFixed(2)}`);
        }
    }
    
    update() {
        if (this.gameState !== 'playing' || !this.cat) return;
        
        // 更新猫咪物理
        this.cat.velocityY += 0.5; // 适中的重力
        this.cat.y += this.cat.velocityY;
        
        const groundY = this.canvas.height * 0.75; // 适应屏幕的地面位置
        if (this.cat.y > groundY - this.cat.height) {
            this.cat.y = groundY - this.cat.height;
            this.cat.velocityY = 0;
            this.cat.isJumping = false;
            this.jumpEnhanced = false;
        }
        
        // 生成障碍物（保持合理间隔）
        const canSpawnObstacle = this.lastObstacleX < this.canvas.width - this.minObstacleGap;
        
        if (Math.random() < this.obstacleSpawnRate && canSpawnObstacle) {
            const obstacleHeight = Math.max(this.cat.height * 0.7, 50); // 确保可跳过
            const obstacle = {
                x: this.canvas.width,
                y: groundY - obstacleHeight,
                width: Math.min(60, this.canvas.width / 15),
                height: obstacleHeight,
                color: '#228B22'
            };
            
            this.obstacles.push(obstacle);
            this.lastObstacleX = this.canvas.width;
        }
        
        // 生成金色飞鸟
        if (Math.random() < this.birdSpawnRate) {
            this.birds.push({
                x: this.canvas.width,
                y: Math.random() * (this.canvas.height * 0.3) + 50,
                width: Math.min(30, this.canvas.width / 25),
                height: Math.min(25, this.canvas.width / 30),
                color: '#FFD700',
                points: 50
            });
        }
        
        // 更新障碍物
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            if (!obstacle) {
                this.obstacles.splice(i, 1);
                continue;
            }
            
            obstacle.x -= this.currentSpeed;
            
            if (obstacle.x + obstacle.width < 0) {
                this.obstacles.splice(i, 1);
                this.score += 10;
                this.updateScore();
                this.updateLevel();
            }
            
            if (this.checkCollision(this.cat, obstacle)) {
                this.gameOver();
                return;
            }
        }
        
        // 更新飞鸟
        for (let i = this.birds.length - 1; i >= 0; i--) {
            const bird = this.birds[i];
            if (!bird) {
                this.birds.splice(i, 1);
                continue;
            }
            
            bird.x -= this.currentSpeed * 1.2;
            bird.y += Math.sin(Date.now() * 0.003) * 3;
            
            if (bird.x + bird.width < 0) {
                this.birds.splice(i, 1);
            }
            
            if (this.checkCollision(this.cat, bird)) {
                this.score += bird.points;
                this.updateScore();
                this.updateLevel();
                this.birds.splice(i, 1);
            }
        }
        
        // 更新云朵
        for (let i = this.clouds.length - 1; i >= 0; i--) {
            const cloud = this.clouds[i];
            if (!cloud) {
                this.clouds.splice(i, 1);
                continue;
            }
            
            cloud.x -= cloud.speed;
            
            // 云朵飘出屏幕后重新生成
            if (cloud.x + cloud.width < 0) {
                cloud.x = this.canvas.width + Math.random() * 100;
                cloud.y = Math.random() * (this.canvas.height * 0.4) + 20;
                cloud.width = Math.random() * 60 + 40;
                cloud.height = Math.random() * 20 + 15;
                cloud.speed = Math.random() * 0.5 + 0.2;
                cloud.opacity = Math.random() * 0.3 + 0.4;
            }
        }
        
        // 持续得分
        if (Math.random() < 0.02) {
            this.score += 1;
            this.updateScore();
            this.updateLevel();
        }
    }
    
    checkCollision(cat, object) {
        if (!cat || !object) {
            console.log('碰撞检测：对象不存在');
            return false;
        }
        
        const padding = 5; // 给碰撞检测一些容错
        return cat.x < object.x + object.width - padding &&
               cat.x + cat.width > object.x + padding &&
               cat.y < object.y + object.height - padding &&
               cat.y + cat.height > object.y + padding;
    }
    
    draw() {
        // 清空画布
        if (!this.ctx) {
            console.error('Canvas context 不存在');
            return;
        }
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制背景
        const skyHeight = this.canvas.height * 0.75;
        const gradient = this.ctx.createLinearGradient(0, 0, 0, skyHeight);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#98D8E8');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, skyHeight);
        
        // 绘制云朵
        this.drawClouds();
        
        // 绘制地面
        this.ctx.fillStyle = '#f0f0f0';
        this.ctx.fillRect(0, skyHeight, this.canvas.width, this.canvas.height - skyHeight);
        
        // 绘制精细的猫咪
        if (this.cat) {
            this.drawDetailedCat();
        }
        
        // 绘制障碍物和飞鸟
        this.drawGameObjects();
        
        // 绘制UI
        this.drawUI();
    }
    
    drawClouds() {
        for (let cloud of this.clouds) {
            if (!cloud) continue;
            
            this.ctx.save();
            this.ctx.globalAlpha = cloud.opacity;
            this.ctx.fillStyle = '#FFFFFF';
            
            // 绘制云朵主体
            const centerX = cloud.x + cloud.width / 2;
            const centerY = cloud.y + cloud.height / 2;
            
            // 使用多个圆形组成云朵
            const circles = [
                { x: centerX - cloud.width * 0.3, y: centerY, r: cloud.height * 0.6 },
                { x: centerX, y: centerY - cloud.height * 0.2, r: cloud.height * 0.7 },
                { x: centerX + cloud.width * 0.3, y: centerY, r: cloud.height * 0.6 },
                { x: centerX - cloud.width * 0.15, y: centerY + cloud.height * 0.1, r: cloud.height * 0.5 },
                { x: centerX + cloud.width * 0.15, y: centerY + cloud.height * 0.1, r: cloud.height * 0.5 }
            ];
            
            // 绘制云朵的各个圆形
            for (let circle of circles) {
                this.ctx.beginPath();
                this.ctx.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            // 添加云朵阴影效果
            this.ctx.globalAlpha = cloud.opacity * 0.3;
            this.ctx.fillStyle = '#DDDDDD';
            this.ctx.beginPath();
            this.ctx.ellipse(centerX, centerY + cloud.height * 0.4, cloud.width * 0.4, cloud.height * 0.2, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
        }
    }
    
    drawDetailedCat() {
        const cat = this.cat;
        const frame = Date.now() * 0.01;
        const scale = cat.width / 60; // 基础缩放
        
        // 猫咪呼吸动画
        const breatheScale = 1 + Math.sin(frame * 0.05) * 0.02;
        
        this.ctx.save();
        this.ctx.translate(cat.x + cat.width / 2, cat.y + cat.height / 2);
        this.ctx.scale(breatheScale, breatheScale);
        this.ctx.translate(-(cat.x + cat.width / 2), -(cat.y + cat.height / 2));
        
        // 猫咪阴影（更细腻）
        if (!cat.isJumping) {
            const shadowGradient = this.ctx.createRadialGradient(
                cat.x + cat.width / 2, cat.y + cat.height + 8,
                0,
                cat.x + cat.width / 2, cat.y + cat.height + 8,
                cat.width / 2.5
            );
            shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
            shadowGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.2)');
            shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            this.ctx.fillStyle = shadowGradient;
            this.ctx.beginPath();
            this.ctx.ellipse(
                cat.x + cat.width / 2,
                cat.y + cat.height + 8,
                cat.width / 3.5,
                cat.height / 10,
                0, 0, Math.PI * 2
            );
            this.ctx.fill();
        }
        
        // 猫咪身体主体（更精细的渐变）
        const bodyGradient = this.ctx.createRadialGradient(
            cat.x + cat.width / 2 - 5 * scale, cat.y + cat.height / 2 - 5 * scale,
            0,
            cat.x + cat.width / 2, cat.y + cat.height / 2,
            cat.width / 1.8
        );
        bodyGradient.addColorStop(0, '#FFB366');
        bodyGradient.addColorStop(0.3, '#FF8C42');
        bodyGradient.addColorStop(0.7, '#FF6B35');
        bodyGradient.addColorStop(1, '#E55100');
        
        this.ctx.fillStyle = bodyGradient;
        this.ctx.beginPath();
        this.ctx.ellipse(
            cat.x + cat.width / 2,
            cat.y + cat.height / 2 + 10 * scale,
            cat.width / 2.0,
            cat.height / 1.8,
            0, 0, Math.PI * 2
        );
        this.ctx.fill();
        
        // 猫咪身体条纹（更自然的曲线）
        this.ctx.strokeStyle = '#D84315';
        this.ctx.lineWidth = 2.5 * scale;
        this.ctx.globalAlpha = 0.7;
        this.ctx.lineCap = 'round';
        
        // 主要条纹
        const stripes = [
            { startX: 0.25, startY: 0.25, midX: 0.5, midY: 0.22, endX: 0.75, endY: 0.25 },
            { startX: 0.22, startY: 0.35, midX: 0.5, midY: 0.32, endX: 0.78, endY: 0.35 },
            { startX: 0.2, startY: 0.45, midX: 0.5, midY: 0.42, endX: 0.8, endY: 0.45 },
            { startX: 0.25, startY: 0.55, midX: 0.5, midY: 0.52, endX: 0.75, endY: 0.55 },
            { startX: 0.3, startY: 0.65, midX: 0.5, midY: 0.63, endX: 0.7, endY: 0.65 }
        ];
        
        for (let stripe of stripes) {
            this.ctx.beginPath();
            this.ctx.moveTo(cat.x + cat.width * stripe.startX, cat.y + cat.height * stripe.startY);
            this.ctx.quadraticCurveTo(
                cat.x + cat.width * stripe.midX, cat.y + cat.height * stripe.midY,
                cat.x + cat.width * stripe.endX, cat.y + cat.height * stripe.endY
            );
            this.ctx.stroke();
        }
        
        // 添加斑点点缀
        this.ctx.fillStyle = '#BF360C';
        this.ctx.globalAlpha = 0.4;
        for (let i = 0; i < 8; i++) {
            const spotX = cat.x + cat.width * (0.2 + Math.random() * 0.6);
            const spotY = cat.y + cat.height * (0.3 + Math.random() * 0.4);
            const spotSize = Math.random() * 3 * scale + 1 * scale;
            
            this.ctx.beginPath();
            this.ctx.arc(spotX, spotY, spotSize, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.globalAlpha = 1;
        
        // 猫咪头部（更立体）
        const headGradient = this.ctx.createRadialGradient(
            cat.x + cat.width - 15 * scale, cat.y + 12 * scale,
            0,
            cat.x + cat.width - 10 * scale, cat.y + 18 * scale,
            cat.width / 3.0
        );
        headGradient.addColorStop(0, '#FFB366');
        headGradient.addColorStop(0.5, '#FF8C42');
        headGradient.addColorStop(1, '#FF6B35');
        
        this.ctx.fillStyle = headGradient;
        this.ctx.beginPath();
        this.ctx.ellipse(
            cat.x + cat.width - 10 * scale,
            cat.y + 18 * scale,
            cat.width / 3.0,
            cat.height / 2.8,
            -0.2, 0, Math.PI * 2
        );
        this.ctx.fill();
        
        // 猫耳朵（更立体）
        this.ctx.fillStyle = '#FF8C42';
        // 左耳
        this.ctx.beginPath();
        this.ctx.moveTo(cat.x + cat.width - 22 * scale, cat.y + 5 * scale);
        this.ctx.lineTo(cat.x + cat.width - 18 * scale, cat.y - 10 * scale);
        this.ctx.lineTo(cat.x + cat.width - 8 * scale, cat.y + 8 * scale);
        this.ctx.closePath();
        this.ctx.fill();
        
        // 左耳内部
        this.ctx.fillStyle = '#FFB74D';
        this.ctx.beginPath();
        this.ctx.moveTo(cat.x + cat.width - 20 * scale, cat.y + 3 * scale);
        this.ctx.lineTo(cat.x + cat.width - 18 * scale, cat.y - 5 * scale);
        this.ctx.lineTo(cat.x + cat.width - 12 * scale, cat.y + 5 * scale);
        this.ctx.closePath();
        this.ctx.fill();
        
        // 右耳
        this.ctx.fillStyle = '#FF8C42';
        this.ctx.beginPath();
        this.ctx.moveTo(cat.x + cat.width - 2 * scale, cat.y + 8 * scale);
        this.ctx.lineTo(cat.x + cat.width + 8 * scale, cat.y - 10 * scale);
        this.ctx.lineTo(cat.x + cat.width + 10 * scale, cat.y + 6 * scale);
        this.ctx.closePath();
        this.ctx.fill();
        
        // 右耳内部
        this.ctx.fillStyle = '#FFB74D';
        this.ctx.beginPath();
        this.ctx.moveTo(cat.x + cat.width, cat.y + 5 * scale);
        this.ctx.lineTo(cat.x + cat.width + 6 * scale, cat.y - 5 * scale);
        this.ctx.lineTo(cat.x + cat.width + 8 * scale, cat.y + 3 * scale);
        this.ctx.closePath();
        this.ctx.fill();
        
        // 猫眼睛（超生动）
        const eyeSize = 4 * scale;
        const eyeBlink = Math.sin(frame * 0.08) > 0.96 ? 0.15 : 1;
        const eyeFollowX = Math.sin(frame * 0.03) * 0.5; // 眼球跟随
        const eyeFollowY = Math.cos(frame * 0.04) * 0.3;
        
        // 眼白（更自然的眼形）
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.save();
        
        // 左眼
        this.ctx.beginPath();
        this.ctx.ellipse(
            cat.x + cat.width - 20 * scale, cat.y + 16 * scale, 
            eyeSize * 1.8, eyeSize * 1.2 * eyeBlink, -0.1, 0, Math.PI * 2
        );
        this.ctx.fill();
        
        // 右眼
        this.ctx.beginPath();
        this.ctx.ellipse(
            cat.x + cat.width - 8 * scale, cat.y + 16 * scale, 
            eyeSize * 1.8, eyeSize * 1.2 * eyeBlink, 0.1, 0, Math.PI * 2
        );
        this.ctx.fill();
        
        // 虹膜
        const irisGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, eyeSize);
        irisGradient.addColorStop(0, '#FFD54F');
        irisGradient.addColorStop(0.3, '#FF8F00');
        irisGradient.addColorStop(0.7, '#4A148C');
        irisGradient.addColorStop(1, '#1A0033');
        
        this.ctx.fillStyle = irisGradient;
        
        // 左虹膜
        this.ctx.beginPath();
        this.ctx.arc(
            cat.x + cat.width - 20 * scale + eyeFollowX * scale, 
            cat.y + 16 * scale + eyeFollowY * scale, 
            eyeSize * 0.9 * eyeBlink, 0, Math.PI * 2
        );
        this.ctx.fill();
        
        // 右虹膜
        this.ctx.beginPath();
        this.ctx.arc(
            cat.x + cat.width - 8 * scale + eyeFollowX * scale, 
            cat.y + 16 * scale + eyeFollowY * scale, 
            eyeSize * 0.9 * eyeBlink, 0, Math.PI * 2
        );
        this.ctx.fill();
        
        // 瞳孔
        this.ctx.fillStyle = '#000000';
        
        // 左瞳孔
        this.ctx.beginPath();
        this.ctx.arc(
            cat.x + cat.width - 20 * scale + eyeFollowX * scale, 
            cat.y + 16 * scale + eyeFollowY * scale, 
            eyeSize * 0.4 * eyeBlink, 0, Math.PI * 2
        );
        this.ctx.fill();
        
        // 右瞳孔
        this.ctx.beginPath();
        this.ctx.arc(
            cat.x + cat.width - 8 * scale + eyeFollowX * scale, 
            cat.y + 16 * scale + eyeFollowY * scale, 
            eyeSize * 0.4 * eyeBlink, 0, Math.PI * 2
        );
        this.ctx.fill();
        
        // 眼睛高光（多层）
        this.ctx.fillStyle = '#FFFFFF';
        
        // 大高光
        this.ctx.beginPath();
        this.ctx.arc(
            cat.x + cat.width - 19 * scale + eyeFollowX * scale, 
            cat.y + 14 * scale + eyeFollowY * scale, 
            eyeSize * 0.4, 0, Math.PI * 2
        );
        this.ctx.arc(
            cat.x + cat.width - 7 * scale + eyeFollowX * scale, 
            cat.y + 14 * scale + eyeFollowY * scale, 
            eyeSize * 0.4, 0, Math.PI * 2
        );
        this.ctx.fill();
        
        // 小高光
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.beginPath();
        this.ctx.arc(
            cat.x + cat.width - 18 * scale + eyeFollowX * scale, 
            cat.y + 15 * scale + eyeFollowY * scale, 
            eyeSize * 0.15, 0, Math.PI * 2
        );
        this.ctx.arc(
            cat.x + cat.width - 6 * scale + eyeFollowX * scale, 
            cat.y + 15 * scale + eyeFollowY * scale, 
            eyeSize * 0.15, 0, Math.PI * 2
        );
        this.ctx.fill();
        
        // 眼线
        this.ctx.strokeStyle = '#E65100';
        this.ctx.lineWidth = 1.5 * scale;
        this.ctx.globalAlpha = 0.6;
        
        // 左眼线
        this.ctx.beginPath();
        this.ctx.ellipse(
            cat.x + cat.width - 20 * scale, cat.y + 16 * scale, 
            eyeSize * 2.0, eyeSize * 1.3, -0.1, Math.PI * 0.7, Math.PI * 2.3
        );
        this.ctx.stroke();
        
        // 右眼线
        this.ctx.beginPath();
        this.ctx.ellipse(
            cat.x + cat.width - 8 * scale, cat.y + 16 * scale, 
            eyeSize * 2.0, eyeSize * 1.3, 0.1, Math.PI * 0.7, Math.PI * 2.3
        );
        this.ctx.stroke();
        
        this.ctx.globalAlpha = 1;
        this.ctx.restore();
        
        // 猫鼻子（更精细）
        this.ctx.fillStyle = '#D84315';
        this.ctx.beginPath();
        this.ctx.moveTo(cat.x + cat.width - 12 * scale, cat.y + 20 * scale);
        this.ctx.lineTo(cat.x + cat.width - 10 * scale, cat.y + 23 * scale);
        this.ctx.lineTo(cat.x + cat.width - 14 * scale, cat.y + 23 * scale);
        this.ctx.closePath();
        this.ctx.fill();
        
        // 猫嘴巴
        this.ctx.strokeStyle = '#8D4E24';
        this.ctx.lineWidth = 1.5 * scale;
        this.ctx.beginPath();
        this.ctx.moveTo(cat.x + cat.width - 12 * scale, cat.y + 23 * scale);
        this.ctx.quadraticCurveTo(cat.x + cat.width - 12 * scale, cat.y + 26 * scale, cat.x + cat.width - 15 * scale, cat.y + 28 * scale);
        this.ctx.moveTo(cat.x + cat.width - 12 * scale, cat.y + 23 * scale);
        this.ctx.quadraticCurveTo(cat.x + cat.width - 12 * scale, cat.y + 26 * scale, cat.x + cat.width - 9 * scale, cat.y + 28 * scale);
        this.ctx.stroke();
        
        // 猫胡须（更多更细）
        this.ctx.strokeStyle = '#8D4E24';
        this.ctx.lineWidth = 1 * scale;
        this.ctx.globalAlpha = 0.8;
        
        // 左侧胡须
        const leftWhiskers = [
            { y: 16 * scale, endX: -35 * scale, endY: 14 * scale },
            { y: 19 * scale, endX: -35 * scale, endY: 19 * scale },
            { y: 22 * scale, endX: -35 * scale, endY: 24 * scale },
            { y: 25 * scale, endX: -30 * scale, endY: 28 * scale }
        ];
        
        for (let whisker of leftWhiskers) {
            this.ctx.beginPath();
            this.ctx.moveTo(cat.x + cat.width - 25 * scale, cat.y + whisker.y);
            this.ctx.lineTo(cat.x + cat.width + whisker.endX, cat.y + whisker.endY);
            this.ctx.stroke();
        }
        
        // 右侧胡须
        const rightWhiskers = [
            { y: 16 * scale, endX: 15 * scale, endY: 14 * scale },
            { y: 19 * scale, endX: 15 * scale, endY: 19 * scale },
            { y: 22 * scale, endX: 15 * scale, endY: 24 * scale },
            { y: 25 * scale, endX: 10 * scale, endY: 28 * scale }
        ];
        
        for (let whisker of rightWhiskers) {
            this.ctx.beginPath();
            this.ctx.moveTo(cat.x + cat.width - 3 * scale, cat.y + whisker.y);
            this.ctx.lineTo(cat.x + cat.width + whisker.endX, cat.y + whisker.endY);
            this.ctx.stroke();
        }
        
        this.ctx.globalAlpha = 1;
        
        // 猫尾巴（更流畅的动画）
        const tailWave = Math.sin(frame * 0.15) * 20;
        const tailCurve = Math.sin(frame * 0.1) * 10;
        
        this.ctx.strokeStyle = '#FF6B35';
        this.ctx.lineWidth = cat.width / 8 * scale;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        this.ctx.beginPath();
        this.ctx.moveTo(cat.x + 8 * scale, cat.y + cat.height / 2);
        
        // 使用贝塞尔曲线创建更自然的尾巴
        this.ctx.bezierCurveTo(
            cat.x - 10 * scale + tailWave * 0.3,
            cat.y + cat.height / 2 - 15 * scale,
            cat.x - 25 * scale + tailWave * 0.7,
            cat.y + cat.height / 2 + tailCurve,
            cat.x - 35 * scale + tailWave,
            cat.y + cat.height / 2 + 20 * scale + tailCurve * 0.5
        );
        this.ctx.stroke();
        
        // 尾巴尖端
        this.ctx.fillStyle = '#FF8C42';
        this.ctx.beginPath();
        this.ctx.arc(
            cat.x - 35 * scale + tailWave,
            cat.y + cat.height / 2 + 20 * scale + tailCurve * 0.5,
            cat.width / 12 * scale, 0, Math.PI * 2
        );
        this.ctx.fill();
        
        // 猫腿（更生动的跑步动画）
        if (!cat.isJumping) {
            const legAnimation = Math.sin(frame * 0.3) * 12;
            const legBend = Math.sin(frame * 0.15) * 5;
            
            this.ctx.strokeStyle = '#FF6B35';
            this.ctx.lineWidth = cat.width / 10 * scale;
            this.ctx.lineCap = 'round';
            
            // 前腿
            this.ctx.beginPath();
            this.ctx.moveTo(cat.x + cat.width * 0.35, cat.y + cat.height - 8 * scale);
            this.ctx.quadraticCurveTo(
                cat.x + cat.width * 0.35 - legBend,
                cat.y + cat.height + 5 * scale,
                cat.x + cat.width * 0.35 + legAnimation * 0.3,
                cat.y + cat.height + 10 * scale + Math.abs(legAnimation)
            );
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(cat.x + cat.width * 0.5, cat.y + cat.height - 8 * scale);
            this.ctx.quadraticCurveTo(
                cat.x + cat.width * 0.5 + legBend,
                cat.y + cat.height + 5 * scale,
                cat.x + cat.width * 0.5 - legAnimation * 0.3,
                cat.y + cat.height + 10 * scale + Math.abs(legAnimation)
            );
            this.ctx.stroke();
            
            // 后腿
            this.ctx.beginPath();
            this.ctx.moveTo(cat.x + cat.width * 0.65, cat.y + cat.height - 5 * scale);
            this.ctx.quadraticCurveTo(
                cat.x + cat.width * 0.65 - legBend,
                cat.y + cat.height + 8 * scale,
                cat.x + cat.width * 0.65 + legAnimation * 0.2,
                cat.y + cat.height + 15 * scale + Math.abs(legAnimation) * 0.8
            );
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(cat.x + cat.width * 0.8, cat.y + cat.height - 5 * scale);
            this.ctx.quadraticCurveTo(
                cat.x + cat.width * 0.8 + legBend,
                cat.y + cat.height + 8 * scale,
                cat.x + cat.width * 0.8 - legAnimation * 0.2,
                cat.y + cat.height + 15 * scale + Math.abs(legAnimation) * 0.8
            );
            this.ctx.stroke();
            
            // 爪子
            this.ctx.fillStyle = '#D84315';
            for (let i = 0; i < 4; i++) {
                const pawX = cat.x + cat.width * (0.35 + i * 0.15);
                const pawY = cat.y + cat.height + 15 * scale + Math.abs(legAnimation) * (i < 2 ? 1 : 0.8);
                this.ctx.beginPath();
                this.ctx.ellipse(pawX, pawY, 3 * scale, 2 * scale, 0, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        
        // 跳跃时的表情变化
        if (cat.isJumping) {
            // 兴奋的眼睛光芒
            this.ctx.fillStyle = this.jumpEnhanced ? '#FFD700' : '#FFFFFF';
            this.ctx.shadowColor = this.jumpEnhanced ? '#FFD700' : '#FFFFFF';
            this.ctx.shadowBlur = this.jumpEnhanced ? 15 : 8;
            this.ctx.beginPath();
            this.ctx.arc(cat.x + cat.width - 12 * scale, cat.y + 25 * scale, 3 * scale, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
            
            // 嘴巴表情
            if (this.jumpEnhanced) {
                // 超级跳跃的大微笑
                this.ctx.strokeStyle = '#FF6B35';
                this.ctx.lineWidth = 3 * scale;
                this.ctx.lineCap = 'round';
                this.ctx.beginPath();
                this.ctx.arc(cat.x + cat.width - 12 * scale, cat.y + 30 * scale, 8 * scale, 0.2, Math.PI - 0.2);
                this.ctx.stroke();
                
                // 粉色腮红
                const blushGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, 6 * scale);
                blushGradient.addColorStop(0, 'rgba(255, 192, 203, 0.6)');
                blushGradient.addColorStop(1, 'rgba(255, 192, 203, 0)');
                
                this.ctx.fillStyle = blushGradient;
                // 左腮红
                this.ctx.beginPath();
                this.ctx.arc(cat.x + cat.width - 25 * scale, cat.y + 22 * scale, 6 * scale, 0, Math.PI * 2);
                this.ctx.fill();
                // 右腮红
                this.ctx.beginPath();
                this.ctx.arc(cat.x + cat.width - 2 * scale, cat.y + 22 * scale, 6 * scale, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                // 普通跳跃的小表情
                this.ctx.strokeStyle = '#8D4E24';
                this.ctx.lineWidth = 2 * scale;
                this.ctx.beginPath();
                this.ctx.arc(cat.x + cat.width - 12 * scale, cat.y + 28 * scale, 5 * scale, 0.3, Math.PI - 0.3);
                this.ctx.stroke();
            }
        }
        
        // 添加耳朵内部细节
        const earInnerGradient = this.ctx.createLinearGradient(0, 0, 0, 10 * scale);
        earInnerGradient.addColorStop(0, '#FFCC80');
        earInnerGradient.addColorStop(1, '#FFB366');
        
        this.ctx.fillStyle = earInnerGradient;
        
        // 左耳内部毛
        for (let i = 0; i < 3; i++) {
            this.ctx.beginPath();
            this.ctx.ellipse(
                cat.x + cat.width - 17 * scale + i * 2 * scale,
                cat.y + 2 * scale + i * 1.5 * scale,
                1.5 * scale, 3 * scale, -0.3, 0, Math.PI * 2
            );
            this.ctx.fill();
        }
        
        // 右耳内部毛
        for (let i = 0; i < 3; i++) {
            this.ctx.beginPath();
            this.ctx.ellipse(
                cat.x + cat.width - 7 * scale + i * 2 * scale,
                cat.y + 2 * scale + i * 1.5 * scale,
                1.5 * scale, 3 * scale, 0.3, 0, Math.PI * 2
            );
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
    
    drawGameObjects() {
        // 绘制障碍物
        for (let obstacle of this.obstacles) {
            this.ctx.fillStyle = obstacle.color;
            this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        }
        
        // 绘制金色飞鸟
        for (let bird of this.birds) {
            // 光晕效果
            this.ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
            this.ctx.beginPath();
            this.ctx.arc(bird.x + bird.width / 2, bird.y + bird.height / 2, bird.width + 5, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 鸟身体
            this.ctx.fillStyle = bird.color;
            this.ctx.beginPath();
            this.ctx.ellipse(bird.x + bird.width / 2, bird.y + bird.height / 2, bird.width / 2, bird.height / 2, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 得分提示
            this.ctx.fillStyle = '#000000';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.fillText(`+${bird.points}`, bird.x - 15, bird.y - 5);
        }
    }
    
    drawUI() {
        // 全屏模式下的UI调整
        const baseFontSize = Math.max(18, Math.min(this.canvas.width / 35, 28));
        const scoreFontSize = Math.max(24, Math.min(this.canvas.width / 25, 36));
        const levelFontSize = Math.max(16, Math.min(this.canvas.width / 40, 24));
        
        // UI背景半透明面板
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(10, 10, Math.min(300, this.canvas.width / 5), Math.min(120, this.canvas.height / 8));
        
        // 分数显示
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = `bold ${scoreFontSize}px Arial`;
        this.ctx.fillText(`得分: ${this.score}`, 20, scoreFontSize + 15);
        
        // 速度等级显示
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = `bold ${levelFontSize}px Arial`;
        this.ctx.fillText(`Lv.${this.level}`, 20, scoreFontSize + 50);
        
        // 最高分显示
        this.ctx.fillStyle = '#B0BEC5';
        this.ctx.font = `${levelFontSize}px Arial`;
        this.ctx.fillText(`最高: ${this.highScore}`, 20, scoreFontSize + 80);
        
        // 速度指示器（全屏版更大）
        const speedBarWidth = Math.min(250, this.canvas.width / 8);
        const speedBarHeight = Math.max(10, this.canvas.width / 80);
        const speedBarX = 20;
        const speedBarY = scoreFontSize + 35;
        
        // 速度条背景
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(speedBarX, speedBarY, speedBarWidth, speedBarHeight);
        
        // 速度条填充
        const speedPercentage = Math.min(this.speedMultiplier / 3, 1);
        const fillColor = this.speedMultiplier < 1.5 ? '#4CAF50' : 
                        this.speedMultiplier < 2.5 ? '#FFC107' : '#FF5722';
        this.ctx.fillStyle = fillColor;
        this.ctx.fillRect(speedBarX, speedBarY, speedBarWidth * speedPercentage, speedBarHeight);
        
        // 速度条边框
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(speedBarX, speedBarY, speedBarWidth, speedBarHeight);
        
        // 右上角提示信息
        const hintFontSize = Math.max(14, Math.min(this.canvas.width / 50, 18));
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.font = `${hintFontSize}px Arial`;
        this.ctx.fillText('空格键跳跃', this.canvas.width - 120, 30);
        this.ctx.fillText('ESC 退出', this.canvas.width - 100, 55);
    }
    
    drawStartScreen() {
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制大型装饰猫咪
        this.drawStartScreenCat();
        
        // 标题文字
        this.ctx.fillStyle = '#000000';
        const titleSize = Math.max(32, Math.min(this.canvas.width / 25, 48));
        this.ctx.font = `${titleSize}px Arial`;
        this.ctx.fillText('🐱 Cat Run!', this.canvas.width / 2 - 80, this.canvas.height / 3);
        
        // 按钮提示
        const textSize = Math.max(16, Math.min(this.canvas.width / 50, 20));
        this.ctx.font = `${textSize}px Arial`;
        this.ctx.fillText('点击"开始游戏"按钮', this.canvas.width / 2 - 100, this.canvas.height / 2);
        this.ctx.fillText('🌵 障碍物 +10分 | 🐦 金鸟 +50分', this.canvas.width / 2 - 120, this.canvas.height / 2 + 40);
    }
    
    drawStartScreenCat() {
        const catX = this.canvas.width / 2;
        const catY = this.canvas.height / 2 - 50;
        const catSize = Math.max(60, this.canvas.width / 15);
        const frame = Date.now() * 0.01;
        
        // 装饰猫咪
        this.ctx.fillStyle = '#FF6B35';
        this.ctx.beginPath();
        this.ctx.ellipse(catX, catY, catSize / 2, catSize / 3, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.arc(catX + catSize / 3, catY - catSize / 4, catSize / 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 眼睛
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(catX + catSize / 2.5, catY - catSize / 4, 3, 0, Math.PI * 2);
        this.ctx.arc(catX + catSize / 2, catY - catSize / 4, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 摇摆的尾巴
        const tailWave = Math.sin(frame) * 10;
        this.ctx.strokeStyle = '#FF4500';
        this.ctx.lineWidth = catSize / 10;
        this.ctx.beginPath();
        this.ctx.moveTo(catX - catSize / 3, catY);
        this.ctx.quadraticCurveTo(catX - catSize / 2, catY + tailWave, catX - catSize * 0.8, catY + tailWave + catSize / 3);
        this.ctx.stroke();
    }
    
    gameLoop() {
        try {
            if (this.gameState === 'playing') {
                this.update();
            }
            this.draw();
            
            if (this.gameState === 'playing') {
                requestAnimationFrame(() => this.gameLoop());
            }
        } catch (error) {
            console.error('游戏循环错误:', error);
            // 防止游戏崩溃，暂停游戏
            this.gameState = 'gameOver';
            this.gameOver();
        }
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        this.finalScoreElement.textContent = this.score;
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('catRunnerHighScore', this.highScore.toString());
            this.highScoreElement.textContent = this.highScore;
            this.newRecordElement.style.display = 'block';
        } else {
            this.newRecordElement.style.display = 'none';
        }
        
        this.gameOverScreen.style.display = 'flex';
    }
    
    updateScore() {
        this.scoreElement.textContent = this.score;
    }
    
    updateHighScore() {
        this.highScoreElement.textContent = this.highScore;
    }
}

// 使用全屏版本
document.addEventListener('DOMContentLoaded', () => {
    console.log('页面加载完成，启动全屏版游戏');
    
    const game = new FullScreenCatRunner();
    window.fullScreenCatRunner = game;
});