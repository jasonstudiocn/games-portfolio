// 简化的游戏测试版本
class SimpleCatRunner {
    constructor() {
        console.log('SimpleCatRunner 构造函数开始');
        
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
        
        // 跳跃控制
        this.jumpPower = -12; // 短按跳跃（降低以更平衡）
        this.maxJumpPower = -20; // 长按跳跃（降低以更平衡）
        this.jumpPressTime = 0;
        this.jumpHolding = false;
        this.jumpHoldTimer = null;
        
        // 障碍物控制
        this.obstacleSpawnRate = 0.015; // 降低生成频率
        this.birdSpawnRate = 0.003;
        this.minObstacleGap = 200; // 最小间隔（像素）
        this.lastObstacleX = 0;
        
        console.log('元素获取完成:', {
            canvas: !!this.canvas,
            ctx: !!this.ctx,
            startScreen: !!this.startScreen
        });
        
        this.init();
    }
    
    init() {
        console.log('SimpleCatRunner 初始化开始');
        
        this.updateHighScore();
        this.updateLevel();
        this.setupEventListeners();
        this.drawStartScreen();
        
        console.log('SimpleCatRunner 初始化完成');
    }
    
    setupEventListeners() {
        console.log('设置事件监听器');
        
        // 移除之前的事件监听器（防止重复添加）
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
        this.handleCanvasClick = () => {
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
        
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                console.log('重新开始按钮点击');
                this.startGame();
            });
        }
        
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                console.log('空格键按下，状态:', this.gameState);
                
                if (this.gameState === 'waiting') {
                    this.startGame();
                } else if (this.gameState === 'playing') {
                    if (!this.jumpHolding && !this.cat.isJumping) {
                        // 立即开始跳跃（短按）
                        this.jumpHolding = true;
                        this.jumpPressTime = Date.now();
                        this.jump(this.jumpPower);
                        console.log('开始跳跃检测，初始力度:', this.jumpPower);
                        
                        // 设置长按检测
                        this.jumpHoldTimer = setTimeout(() => {
                            if (this.jumpHolding && this.cat.isJumping) {
                                // 长按增强跳跃
                                this.cat.velocityY = this.maxJumpPower;
                                console.log('长按跳跃增强，力度:', this.maxJumpPower);
                            }
                        }, 200);
                    }
                } else if (this.gameState === 'gameOver') {
                    this.startGame();
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space' && this.gameState === 'playing') {
                e.preventDefault();
                
                if (this.jumpHolding) {
                    this.jumpHolding = false;
                    
                    // 清除长按检测计时器
                    if (this.jumpHoldTimer) {
                        clearTimeout(this.jumpHoldTimer);
                        this.jumpHoldTimer = null;
                    }
                    
                    const pressDuration = Date.now() - this.jumpPressTime;
                    console.log('按键释放，持续时间:', pressDuration + 'ms');
                }
            }
        });
        
        this.canvas.addEventListener('click', () => {
            if (this.gameState === 'playing') {
                this.jump();
            }
        });
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
        
        this.cat = {
            x: 100,
            y: 250,
            width: 80,
            height: 80,
            velocityY: 0,
            isJumping: false
        };
        
        this.obstacles = [];
        this.birds = [];
        this.lastObstacleX = 0;
        
        this.gameLoop();
    }
    
    updateLevel() {
        // 每100分升一级
        const newLevel = Math.floor(this.score / 100) + 1;
        
        if (newLevel !== this.level) {
            this.level = newLevel;
            this.speedMultiplier = 1 + (this.level - 1) * 0.15; // 每级速度增加15%
            this.currentSpeed = this.baseSpeed * this.speedMultiplier;
            
            // 升级时略微增加障碍物生成率，但保持合理的间隔
            this.obstacleSpawnRate = Math.min(0.015 + (this.level - 1) * 0.002, 0.025);
            this.birdSpawnRate = Math.min(0.003 + (this.level - 1) * 0.0005, 0.006);
            
            console.log(`升级到等级 ${this.level}！速度倍数: ${this.speedMultiplier.toFixed(2)}`);
        }
    }
    
    jump(power = this.jumpPower) {
        if (!this.cat.isJumping) {
            this.cat.velocityY = power;
            this.cat.isJumping = true;
            console.log('跳跃，力度:', power);
        }
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        // 更新猫咪
        this.cat.velocityY += 0.6; // 降低重力，让跳跃更有弹性
        this.cat.y += this.cat.velocityY;
        
        const groundY = this.canvas.height - 100;
        if (this.cat.y > groundY - this.cat.height) {
            this.cat.y = groundY - this.cat.height;
            this.cat.velocityY = 0;
            this.cat.isJumping = false;
        }
        
        // 生成障碍物（考虑最小间隔）
        const canSpawnObstacle = this.lastObstacleX < this.canvas.width - this.minObstacleGap;
        
        if (Math.random() < this.obstacleSpawnRate && canSpawnObstacle) {
            const obstacle = {
                x: this.canvas.width,
                y: groundY - 60,
                width: 40,
                height: 60,
                color: '#228B22'
            };
            
            // 根据等级调整障碍物高度，保持可跳跃性
            if (this.level > 3) {
                // 高等级时偶尔生成稍高的障碍物
                if (Math.random() < 0.3) {
                    obstacle.height = 50; // 稍矮一些，保持可跳性
                }
            }
            
            this.obstacles.push(obstacle);
            this.lastObstacleX = this.canvas.width;
        }
        
        // 生成金色飞鸟
        if (Math.random() < this.birdSpawnRate) {
            this.birds.push({
                x: this.canvas.width,
                y: Math.random() * 150 + 50,
                width: 30,
                height: 25,
                color: '#FFD700',
                points: 50
            });
        }
        
        // 更新障碍物
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            this.obstacles[i].x -= this.currentSpeed;
            
            if (this.obstacles[i].x + this.obstacles[i].width < 0) {
                this.obstacles.splice(i, 1);
                this.score += 10;
                this.updateScore();
                this.updateLevel();
            }
            
            if (this.checkCollision(this.cat, this.obstacles[i])) {
                this.gameOver();
                return;
            }
        }
        
        // 更新飞鸟
        for (let i = this.birds.length - 1; i >= 0; i--) {
            this.birds[i].x -= this.currentSpeed * 1.2; // 飞鸟稍快，鼓励跳跃
            
            if (this.birds[i].x + this.birds[i].width < 0) {
                this.birds.splice(i, 1);
            }
            
            if (this.checkCollision(this.cat, this.birds[i])) {
                this.score += this.birds[i].points;
                this.updateScore();
                this.updateLevel();
                this.birds.splice(i, 1);
            }
        }
        
        // 持续得分
        if (Math.random() < 0.02) {
            this.score += 1;
            this.updateScore();
        }
    }
    
    checkCollision(cat, object) {
        return cat.x < object.x + object.width &&
               cat.x + cat.width > object.x &&
               cat.y < object.y + object.height &&
               cat.y + cat.height > object.y;
    }
    
    draw() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 天空背景
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height - 100);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#98D8E8');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height - 100);
        
        // 地面
        this.ctx.fillStyle = '#f0f0f0';
        this.ctx.fillRect(0, this.canvas.height - 100, this.canvas.width, 100);
        
        // 绘制精细的猫咪
        if (this.cat) {
            this.drawCat();
        }
    
    drawCat() {
        const cat = this.cat;
        const frame = Date.now() * 0.01; // 动画帧
        
        // 猫咪身体（椭圆）
        this.ctx.fillStyle = '#FF6B35';
        this.ctx.beginPath();
        this.ctx.ellipse(
            cat.x + cat.width / 2,
            cat.y + cat.height / 2 + 10,
            cat.width / 2.5,
            cat.height / 2.2,
            0, 0, Math.PI * 2
        );
        this.ctx.fill();
        
        // 猫咪头部
        this.ctx.beginPath();
        this.ctx.arc(
            cat.x + cat.width - 12,
            cat.y + 15,
            15, 0, Math.PI * 2
        );
        this.ctx.fill();
        
        // 猫耳朵
        this.ctx.fillStyle = '#FF8C42';
        // 左耳
        this.ctx.beginPath();
        this.ctx.moveTo(cat.x + cat.width - 25, cat.y + 8);
        this.ctx.lineTo(cat.x + cat.width - 20, cat.y - 8);
        this.ctx.lineTo(cat.x + cat.width - 10, cat.y + 10);
        this.ctx.closePath();
        this.ctx.fill();
        
        // 右耳
        this.ctx.beginPath();
        this.ctx.moveTo(cat.x + cat.width - 5, cat.y + 10);
        this.ctx.lineTo(cat.x + cat.width + 5, cat.y - 8);
        this.ctx.lineTo(cat.x + cat.width + 8, cat.y + 8);
        this.ctx.closePath();
        this.ctx.fill();
        
        // 猫眼睛
        this.ctx.fillStyle = '#000000';
        // 左眼
        this.ctx.beginPath();
        this.ctx.arc(cat.x + cat.width - 20, cat.y + 12, 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 右眼
        this.ctx.beginPath();
        this.ctx.arc(cat.x + cat.width - 8, cat.y + 12, 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 猫鼻子
        this.ctx.fillStyle = '#FF4500';
        this.ctx.beginPath();
        this.ctx.arc(cat.x + cat.width - 14, cat.y + 18, 1.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 猫胡须
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 1;
        // 左胡须
        this.ctx.beginPath();
        this.ctx.moveTo(cat.x + cat.width - 25, cat.y + 15);
        this.ctx.lineTo(cat.x + cat.width - 35, cat.y + 13);
        this.ctx.moveTo(cat.x + cat.width - 25, cat.y + 18);
        this.ctx.lineTo(cat.x + cat.width - 35, cat.y + 18);
        this.ctx.stroke();
        
        // 右胡须
        this.ctx.beginPath();
        this.ctx.moveTo(cat.x + cat.width - 3, cat.y + 15);
        this.ctx.lineTo(cat.x + cat.width + 7, cat.y + 13);
        this.ctx.moveTo(cat.x + cat.width - 3, cat.y + 18);
        this.ctx.lineTo(cat.x + cat.width + 7, cat.y + 18);
        this.ctx.stroke();
        
        // 猫尾巴（动态摆动）
        const tailWave = Math.sin(frame * 0.1) * 15;
        this.ctx.strokeStyle = '#FF4500';
        this.ctx.lineWidth = 6;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(cat.x + 5, cat.y + cat.height / 2);
        this.ctx.quadraticCurveTo(
            cat.x - 15 + tailWave,
            cat.y + cat.height / 2 - 10,
            cat.x - 25 + tailWave,
            cat.y + cat.height / 2 + 10
        );
        this.ctx.stroke();
        
        // 猫腿（跑步动画）
        if (!cat.isJumping) {
            const legOffset = Math.sin(frame * 0.2) * 8;
            this.ctx.strokeStyle = '#FF6B35';
            this.ctx.lineWidth = 5;
            this.ctx.lineCap = 'round';
            
            // 前腿
            this.ctx.beginPath();
            this.ctx.moveTo(cat.x + 20, cat.y + cat.height - 5);
            this.ctx.lineTo(cat.x + 20, cat.y + cat.height + legOffset);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(cat.x + 35, cat.y + cat.height - 5);
            this.ctx.lineTo(cat.x + 35, cat.y + cat.height - legOffset);
            this.ctx.stroke();
            
            // 后腿
            this.ctx.beginPath();
            this.ctx.moveTo(cat.x + 10, cat.y + cat.height - 5);
            this.ctx.lineTo(cat.x + 10, cat.y + cat.height - legOffset);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(cat.x + 45, cat.y + cat.height - 5);
            this.ctx.lineTo(cat.x + 45, cat.y + cat.height + legOffset);
            this.ctx.stroke();
        } else {
            // 跳跃时的腿（蜷缩）
            this.ctx.strokeStyle = '#FF6B35';
            this.ctx.lineWidth = 5;
            
            for (let i = 0; i < 4; i++) {
                const legX = cat.x + 10 + i * 12;
                this.ctx.beginPath();
                this.ctx.moveTo(legX, cat.y + cat.height - 5);
                this.ctx.lineTo(legX - 5, cat.y + cat.height);
                this.ctx.stroke();
            }
        }
        
        // 添加表情（根据状态）
        if (cat.isJumping) {
            // 跳跃时的开心表情
            this.ctx.fillStyle = '#000000';
            this.ctx.beginPath();
            this.ctx.arc(cat.x + cat.width - 14, cat.y + 22, 1, 0, Math.PI * 2);
            this.ctx.fill(); // 笑眼
        }
        
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
            this.ctx.arc(bird.x + bird.width/2, bird.y + bird.height/2, bird.width + 5, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 鸟身体
            this.ctx.fillStyle = bird.color;
            this.ctx.beginPath();
            this.ctx.ellipse(bird.x + bird.width/2, bird.y + bird.height/2, bird.width/2, bird.height/2, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 得分提示
            this.ctx.fillStyle = '#000000';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.fillText(`+${bird.points}`, bird.x - 15, bird.y - 5);
        }
        
        // 动态字体大小
        const baseFontSize = Math.max(20, Math.min(this.canvas.width / 40, 24));
        const scoreFontSize = Math.max(24, Math.min(this.canvas.width / 30, 32));
        const levelFontSize = Math.max(18, Math.min(this.canvas.width / 45, 22));
        
        // 分数和等级显示
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.font = `bold ${scoreFontSize}px Arial`;
        this.ctx.fillText(`得分: ${this.score}`, 20, scoreFontSize + 10);
        
        // 速度等级显示
        this.ctx.fillStyle = '#FF6B35';
        this.ctx.font = `bold ${levelFontSize}px Arial`;
        this.ctx.fillText(`速度: Lv.${this.level}`, 20, scoreFontSize + 50);
        
        // 速度指示器（响应屏幕大小）
        const speedBarWidth = Math.min(200, this.canvas.width / 6);
        const speedBarHeight = Math.max(8, this.canvas.width / 100);
        const speedBarX = Math.min(150, this.canvas.width / 8);
        const speedBarY = scoreFontSize + 30;
        
        // 速度条背景
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.fillRect(speedBarX, speedBarY, speedBarWidth, speedBarHeight);
        
        // 速度条填充
        const speedPercentage = Math.min(this.speedMultiplier / 3, 1); // 假设最高3倍速
        const fillColor = this.speedMultiplier < 1.5 ? '#4CAF50' : 
                        this.speedMultiplier < 2.5 ? '#FFC107' : '#FF5722';
        this.ctx.fillStyle = fillColor;
        this.ctx.fillRect(speedBarX, speedBarY, speedBarWidth * speedPercentage, speedBarHeight);
        
        // 速度条边框
        this.ctx.strokeStyle = '#333333';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(speedBarX, speedBarY, speedBarWidth, speedBarHeight);
    }
    
    drawStartScreen() {
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制大型猫咪作为背景装饰
        this.drawStartScreenCat();
        
        this.ctx.fillStyle = '#000000';
        this.ctx.font = `${Math.max(40, this.canvas.width / 20)}px Arial`;
        this.ctx.fillText('🐱 Cat Run!', this.canvas.width / 2 - 80, this.canvas.height / 3);
        
        this.ctx.font = `${Math.max(20, this.canvas.width / 40)}px Arial`;
        this.ctx.fillText('点击"开始游戏"按钮', this.canvas.width / 2 - 100, this.canvas.height / 2);
        this.ctx.fillText('🌵 障碍物 +10分 | 🐦 金鸟 +50分', this.canvas.width / 2 - 120, this.canvas.height / 2 + 40);
    }
    
    drawStartScreenCat() {
        const catX = this.canvas.width / 2;
        const catY = this.canvas.height / 2 - 50;
        const catSize = Math.max(60, this.canvas.width / 15);
        const frame = Date.now() * 0.01;
        
        // 简单的装饰猫咪
        this.ctx.fillStyle = '#FF6B35';
        this.ctx.beginPath();
        this.ctx.ellipse(catX, catY, catSize / 2, catSize / 3, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 头部
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
        if (this.gameState === 'playing') {
            this.update();
        }
        this.draw();
        
        if (this.gameState === 'playing') {
            requestAnimationFrame(() => this.gameLoop());
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
    
    updateLevel() {
        // 每100分升一级
        const newLevel = Math.floor(this.score / 100) + 1;
        
        if (newLevel !== this.level) {
            this.level = newLevel;
            this.speedMultiplier = 1 + (this.level - 1) * 0.15; // 每级速度增加15%
            this.currentSpeed = this.baseSpeed * this.speedMultiplier;
            
            // 升级时略微增加障碍物生成率，但保持合理的间隔
            this.obstacleSpawnRate = Math.min(0.015 + (this.level - 1) * 0.002, 0.025);
            this.birdSpawnRate = Math.min(0.003 + (this.level - 1) * 0.0005, 0.006);
            
            // 更新UI
            const levelIndicator = document.getElementById('levelIndicator');
            const speedIndicator = document.getElementById('speedIndicator');
            
            if (levelIndicator) {
                levelIndicator.textContent = `Lv.${this.level}`;
                levelIndicator.style.animation = 'none';
                setTimeout(() => {
                    levelIndicator.style.animation = 'levelUp 0.5s ease-in-out';
                }, 10);
            }
            
            if (speedIndicator) {
                speedIndicator.textContent = `速度: ${this.speedMultiplier.toFixed(1)}x`;
                speedIndicator.className = 'speed-indicator';
                
                if (this.speedMultiplier > 2.5) {
                    speedIndicator.classList.add('very-fast');
                } else if (this.speedMultiplier > 1.5) {
                    speedIndicator.classList.add('fast');
                }
            }
            
            console.log(`升级到等级 ${this.level}！速度倍数: ${this.speedMultiplier.toFixed(2)}`);
        }
    }
}

// 使用简化版本
document.addEventListener('DOMContentLoaded', () => {
    console.log('页面加载完成，启动简化版游戏');
    
    // 检查是否加载了完整版本
    if (typeof CatRunnerGame !== 'undefined') {
        console.log('使用完整版游戏');
    } else {
        console.log('完整版未找到，使用简化版游戏');
        const game = new SimpleCatRunner();
        window.simpleCatRunner = game;
    }
});