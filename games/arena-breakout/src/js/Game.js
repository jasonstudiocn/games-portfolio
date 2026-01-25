// 游戏主类
class Game {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.camera = null;
        this.map = null;
        this.player = null;
        this.enemies = [];
        this.bullets = [];
        this.particles = [];
        
        // 游戏状态
        this.state = GameState.MENU;
        this.lastTime = 0;
        this.deltaTime = 0;
        this.gameTime = 0;
        this.score = 0;
        this.lootCollected = 0;
        
        // 输入处理
        this.keys = {};
        this.mousePosition = new Vector2D(0, 0);
        this.isMouseDown = false;
        this.mouseButton = null;
        
        // UI 元素
        this.ui = {
            menu: null,
            hud: null,
            inventory: null,
            minimap: null
        };
        
        // 初始化
        this.init();
    }
    
    // 初始化游戏
    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.setupUI();
        this.camera = new Camera(this.canvas.width, this.canvas.height);
        
        // 初始化设置管理器
        this.settingsManager = new SettingsManager();
        
        // 创建撤离覆盖层
        this.createExtractionOverlay();
        
        // 创建小地图
        this.createMinimap();
        
        // 启动游戏循环
        this.gameLoop();
    }
    
    // 设置画布
    setupCanvas() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 设置画布尺寸
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // 设置相机视口
        if (!this.camera) {
            this.camera = new Camera(this.canvas.width, this.canvas.height);
        } else {
            this.camera.setViewport(this.canvas.width, this.canvas.height);
        }
    }
    
    // 设置事件监听器
    setupEventListeners() {
        // 键盘事件
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
        
        // 鼠标事件
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // 窗口调整
        window.addEventListener('resize', () => this.setupCanvas());
        
        // UI 按钮事件
        this.setupUIEvents();
    }
    
    // 设置UI
    setupUI() {
        this.ui.menu = document.getElementById('gameMenu');
        this.ui.hud = document.getElementById('hud');
        this.ui.inventory = document.getElementById('inventory');
        this.ui.minimap = document.getElementById('minimap');
    }
    
    // 设置UI事件
    setupUIEvents() {
        const startButton = document.getElementById('startButton');
        const optionsButton = document.getElementById('optionsButton');
        const quitButton = document.getElementById('quitButton');
        
        if (startButton) {
            startButton.addEventListener('click', () => this.startGame());
        }
        
        if (optionsButton) {
            optionsButton.addEventListener('click', () => this.openOptions());
        }
        
        if (quitButton) {
            quitButton.addEventListener('click', () => this.quitGame());
        }
    }
    
    // 开始游戏
    startGame() {
        this.state = GameState.PLAYING;
        this.setupNewGame();
        this.ui.menu.classList.add('hidden');
        this.ui.hud.classList.remove('hidden');
    }
    
    // 设置新游戏
    setupNewGame() {
        // 创建地图 - 使用更小的地图
        this.map = new Map(GameConfig.MAP_WIDTH, GameConfig.MAP_HEIGHT);
        
        // 创建玩家 - 使用固定的安全出生点
        const playerSpawnPos = this.getFixedPlayerSpawnPoint();
        this.player = new Player(playerSpawnPos.x, playerSpawnPos.y);
        this.player.init();
        
        // 重置游戏状态
        this.gameTime = 0;
        this.score = 0;
        this.lootCollected = 0;
        this.bullets = [];
        this.particles = [];
        
        // 设置相机为第三人称视角（地图居中）
        this.setupThirdPersonView();
        
        // 创建敌人 - 使用固定出生点，远离玩家
        this.spawnEnemiesFixed();
    }
    
    // 获取固定玩家出生点
    getFixedPlayerSpawnPoint() {
        // 在地图左上角的安全区域生成玩家
        return new Vector2D(150, 150);
    }
    
    // 设置第三人称视角
    setupThirdPersonView() {
        this.isFirstPerson = false;
        
        // 地图始终在正中间 - 适应更小的地图
        let centerX, centerY;
        
        if (this.map.width < this.canvas.width) {
            // 地图比屏幕窄，完全居中
            centerX = 0;
        } else {
            centerX = (this.map.width - this.canvas.width) / 2;
        }
        
        if (this.map.height < this.canvas.height) {
            // 地图比屏幕矮，完全居中
            centerY = 0;
        } else {
            centerY = (this.map.height - this.canvas.height) / 2;
        }
        
        this.camera.setPosition(centerX, centerY);
        
        // 设置边界，确保地图完全居中
        this.camera.setFixedBounds(centerX, centerY);
        this.camera.setSmoothness(0); // 不跟随玩家，固定在中心
        this.camera.setCanvas(this.canvas);
    }
    
    // 生成敌人 - 使用固定出生点，远离玩家
    spawnEnemiesFixed() {
        const enemyCount = Utils.randomInt(GameConfig.ENEMY.SPAWN_COUNT[0], GameConfig.ENEMY.SPAWN_COUNT[1]);
        const enemyTypes = ['basic', 'soldier', 'sniper'];
        
        // 预定义的敌人出生区域（远离玩家出生点）
        const enemySpawnZones = [
            { x: this.map.width - 150, y: 150 }, // 右上角
            { x: this.map.width - 150, y: this.map.height - 150 }, // 右下角
            { x: 150, y: this.map.height - 150 }, // 左下角
            { x: this.map.width / 2, y: this.map.height - 150 }, // 中下
            { x: this.map.width - 150, y: this.map.height / 2 }, // 右中
        ];
        
        for (let i = 0; i < enemyCount; i++) {
            // 从预定义区域中选择出生点
            const zoneIndex = i % enemySpawnZones.length;
            const baseZone = enemySpawnZones[zoneIndex];
            
            // 在选定区域附近随机偏移
            const offsetX = Utils.random(-100, 100);
            const offsetY = Utils.random(-100, 100);
            const spawnX = Utils.clamp(baseZone.x + offsetX, 50, this.map.width - 50);
            const spawnY = Utils.clamp(baseZone.y + offsetY, 50, this.map.height - 50);
            
            const enemyType = enemyTypes[Utils.randomInt(0, enemyTypes.length - 1)];
            const enemy = new Enemy(spawnX, spawnY, enemyType);
            
            // 生成巡逻点（在出生点附近）
            const patrolPoints = [];
            for (let j = 0; j < 4; j++) {
                const angle = (Math.PI * 2 * j) / 4 + Utils.random(-0.5, 0.5);
                const distance = Utils.random(80, 150);
                const px = spawnX + Math.cos(angle) * distance;
                const py = spawnY + Math.sin(angle) * distance;
                
                // 确保巡逻点在地图范围内
                const clampedX = Utils.clamp(px, 50, this.map.width - 50);
                const clampedY = Utils.clamp(py, 50, this.map.height - 50);
                patrolPoints.push(new Vector2D(clampedX, clampedY));
            }
            
            enemy.init(patrolPoints);
            this.enemies.push(enemy);
        }
    }
    
    // 游戏循环
    gameLoop = (currentTime = 0) => {
        requestAnimationFrame((time) => this.gameLoop(time));
        
        // 计算时间差
        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // 限制最大时间差
        if (this.deltaTime > 100) this.deltaTime = 16;
        
        // 更新游戏时间
        this.gameTime += this.deltaTime;
        
        // 根据游戏状态执行不同逻辑
        switch (this.state) {
            case GameState.PLAYING:
                this.update(this.deltaTime);
                this.render();
                this.updateUI();
                break;
            case GameState.MENU:
                this.renderMenu();
                break;
            case GameState.PAUSED:
                this.render();
                this.renderPauseScreen();
                break;
            case GameState.GAME_OVER:
                this.render();
                this.renderGameOver();
                break;
            case GameState.VICTORY:
                this.render();
                this.renderVictory();
                break;
        }
    }
    
    // 更新游戏逻辑
    update(deltaTime) {
        // 更新相机
        this.camera.update();
        
        // 更新玩家
        if (this.player) {
            this.player.update(deltaTime, this.map);
            
        // 处理玩家输入
        this.handlePlayerInput();
        
        // 处理容器搜索
        this.handleContainerSearch();
        
        // 检查物品收集
        this.checkItemCollection();
        
        // 检查撤离
        this.checkExtraction();
        
        // 处理玩家射击产生的多弹丸
        this.handlePlayerShooting();
        }
        
        // 更新敌人
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(deltaTime, this.player, this.map, this.enemies);
            
            // 移除死亡的敌人
            if (enemy.state === 'dead') {
                this.enemies.splice(i, 1);
                this.score += 100;
            }
        }
        
        // 更新子弹
        this.updateBullets(deltaTime);
        
        // 更新粒子效果
        this.updateParticles(deltaTime);
        
        // 检查游戏结束条件
        this.checkGameConditions();
    }
    
    // 处理玩家输入
    handlePlayerInput() {
        if (!this.player) return;
        
        // 键盘输入传递给玩家
        for (const key in this.keys) {
            if (this.keys[key]) {
                this.player.onKeyDown(key);
            } else {
                this.player.onKeyUp(key);
            }
        }
        
        // 鼠标输入
        this.player.onMouseMove(this.mousePosition.x, this.mousePosition.y, this.camera);
        if (this.isMouseDown) {
            this.player.onMouseDown(this.mouseButton);
        }
    }
    
    // 处理玩家射击
    handlePlayerShooting() {
        if (!this.player || !this.player.currentWeapon) return;
        
        // 检查玩家是否正在射击并创建子弹
        if (this.player.isMouseDown && this.player.mouseButton === MouseButtons.LEFT) {
            const now = Utils.now();
            if (now - this.player.lastShotTime >= this.player.currentWeapon.fireRate) {
                const bullet = this.player.currentWeapon.shoot(this.player.position, this.player.rotation);
                
                if (bullet) {
                    this.player.lastShotTime = now;
                    
                    // 处理多弹丸（霰弹枪）
                    if (Array.isArray(bullet)) {
                        for (const b of bullet) {
                            this.bullets.push(b);
                        }
                    } else {
                        this.bullets.push(bullet);
                    }
                }
            }
        }
    }
    
    // 更新子弹
    updateBullets(deltaTime) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            // 更新子弹位置（应用俯仰角）
            bullet.x += bullet.vx * deltaTime / 1000;
            bullet.y += bullet.vy * deltaTime / 1000;
            
            // 俯仰角影响子弹轨迹
            if (bullet.pitchAngle) {
                bullet.y += Math.sin(bullet.pitchAngle) * deltaTime / 1000 * 50;
            }
            
            // 特殊效果：激光枪子弹留下轨迹
            if (bullet.type === 'laser_rifle') {
                this.createLaserTrail(bullet.x, bullet.y);
            }
            
            // 检查子弹生命周期
            const age = Utils.now() - bullet.createdAt;
            if (age > bullet.lifetime) {
                this.bullets.splice(i, 1);
                continue;
            }
            
            // 检查墙壁碰撞
            if (this.map.checkCollision(bullet.x, bullet.y, 2)) {
                this.createImpactEffect(bullet.x, bullet.y, bullet.type);
                this.bullets.splice(i, 1);
                continue;
            }
            
            // 检查实体碰撞
            if (bullet.owner === 'player') {
                // 检查敌人命中
                for (const enemy of this.enemies) {
                    if (Utils.distance(bullet.x, bullet.y, enemy.position.x, enemy.position.y) < enemy.radius) {
                        enemy.takeDamage(bullet.damage, this.player);
                        this.createHitEffect(bullet.x, bullet.y, bullet.type);
                        this.bullets.splice(i, 1);
                        break;
                    }
                }
            } else {
                // 检查玩家命中
                if (this.player && Utils.distance(bullet.x, bullet.y, this.player.position.x, this.player.position.y) < this.player.radius) {
                    this.player.takeDamage(bullet.damage);
                    this.createHitEffect(bullet.x, bullet.y, bullet.type);
                    this.bullets.splice(i, 1);
                }
            }
        }
    }
    
    // 更新粒子效果
    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.life -= deltaTime;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            
            // 更新粒子位置
            particle.x += particle.vx * deltaTime / 1000;
            particle.y += particle.vy * deltaTime / 1000;
            
            // 应用重力（如果有）
            if (particle.gravity) {
                particle.vy += 0.5 * deltaTime / 1000;
            }
            
            // 应用摩擦力
            particle.vx *= 0.98;
            particle.vy *= 0.98;
        }
    }
    
    // 检查物品收集
    checkItemCollection() {
        if (!this.player) return;
        
        const nearbyItems = this.map.getNearbyItems(this.player.position, 30);
        for (const item of nearbyItems) {
            const value = this.map.collectItem(item);
            this.handleItemCollection(item, value);
        }
    }
    
    // 处理物品收集
    handleItemCollection(item, value) {
        switch (item.type) {
            case 'weapon':
                // 给玩家添加武器
                const weaponTypes = Weapon.getWeaponTypes();
                const weaponType = weaponTypes[Utils.randomInt(0, weaponTypes.length - 1)];
                const weapon = new Weapon(weaponType);
                if (this.player.addWeapon(weapon)) {
                    this.score += value;
                }
                break;
            case 'ammo':
                // 添加弹药
                if (this.player.currentWeapon) {
                    this.player.currentWeapon.addAmmo(30);
                    this.score += value;
                }
                break;
            case 'medkit':
                // 治疗
                this.player.heal(50);
                this.score += value;
                break;
            case 'loot':
                // 收集战利品
                this.lootCollected++;
                this.score += value;
                break;
        }
    }
    
    // 检查撤离
    checkExtraction() {
        if (!this.player) return;
        
        const extractionZone = this.map.isInExtractionZone(this.player.position);
        if (extractionZone) {
            this.state = GameState.EXTRACTION;
            this.startExtraction(extractionZone);
        }
    }
    
    // 开始撤离
    startExtraction(zone) {
        this.extractionStartTime = Utils.now();
        this.extractionDuration = GameConfig.EXTRACTION.EXTRACTION_TIME;
        this.currentExtractionZone = zone;
        this.state = GameState.EXTRACTION;
        
        // 显示撤离动画
        this.extractionOverlay.style.display = 'flex';
        
        // 开始撤离倒计时
        this.updateExtractionTimer();
        
        // 定期检查玩家是否仍在撤离区域
        this.extractionCheckInterval = setInterval(() => {
            if (this.player && !this.map.isInExtractionZone(this.player.position)) {
                this.cancelExtraction();
            }
        }, 100);
    }
    
    // 更新撤离计时器
    updateExtractionTimer() {
        const updateTimer = () => {
            if (this.state !== GameState.EXTRACTION) return;
            
            const elapsed = Utils.now() - this.extractionStartTime;
            const remaining = Math.max(0, this.extractionDuration - elapsed);
            const remainingSeconds = Math.ceil(remaining / 1000);
            
            // 更新UI
            const timerElement = this.extractionOverlay.querySelector('.extraction-timer');
            const progressBar = this.extractionOverlay.querySelector('.extraction-progress-bar');
            
            if (timerElement) {
                timerElement.textContent = remainingSeconds;
            }
            
            if (progressBar) {
                const progress = 1 - (remaining / this.extractionDuration);
                progressBar.style.width = (progress * 100) + '%';
            }
            
            if (remaining > 0) {
                requestAnimationFrame(updateTimer);
            } else {
                this.completeExtraction();
            }
        };
        
        requestAnimationFrame(updateTimer);
    }
    
    // 取消撤离
    cancelExtraction() {
        clearInterval(this.extractionCheckInterval);
        this.extractionOverlay.style.display = 'none';
        this.state = GameState.PLAYING;
        
        if (this.settingsManager) {
            this.settingsManager.showNotification('撤离已取消，请返回撤离区域');
        }
    }
    
    // 创建小地图
    createMinimap() {
        this.minimapCanvas = document.createElement('canvas');
        this.minimapCanvas.id = 'minimap-canvas';
        this.minimapCanvas.width = 250;
        this.minimapCanvas.height = 180;
        this.minimapCanvas.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            border: 3px solid #444;
            border-radius: 10px;
            background: rgba(0, 0, 0, 0.9);
            z-index: 100;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
        `;
        
        document.body.appendChild(this.minimapCanvas);
        this.minimapCtx = this.minimapCanvas.getContext('2d');
    }
    
    // 渲染小地图
    renderMinimap() {
        if (!this.minimapCtx || !this.map || !this.player) return;
        
        // 计算合适的缩放比例，确保完整显示地图
        const mapWidth = this.map.width;
        const mapHeight = this.map.height;
        const scaleX = 230 / mapWidth;  // 留10px边距
        const scaleY = 160 / mapHeight; // 留10px边距
        const scale = Math.min(scaleX, scaleY, 0.35); // 提高缩放比例以适应小地图
        
        const offsetX = 125; // 小地图中心X (250/2)
        const offsetY = 90;  // 小地图中心Y (180/2)
        
        // 清空小地图，添加背景
        const gradient = this.minimapCtx.createRadialGradient(offsetX, offsetY, 0, offsetX, offsetY, 100);
        gradient.addColorStop(0, 'rgba(20, 20, 40, 0.95)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
        this.minimapCtx.fillStyle = gradient;
        this.minimapCtx.fillRect(0, 0, 200, 150);
        
        // 渲染网格背景
        this.minimapCtx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
        this.minimapCtx.lineWidth = 0.5;
        for (let i = 0; i <= 200; i += 20) {
            this.minimapCtx.beginPath();
            this.minimapCtx.moveTo(i, 0);
            this.minimapCtx.lineTo(i, 150);
            this.minimapCtx.stroke();
        }
        for (let i = 0; i <= 150; i += 15) {
            this.minimapCtx.beginPath();
            this.minimapCtx.moveTo(0, i);
            this.minimapCtx.lineTo(200, i);
            this.minimapCtx.stroke();
        }
        
        // 计算偏移量，让地图居中显示
        const mapOffsetX = (250 - mapWidth * scale) / 2;
        const mapOffsetY = (180 - mapHeight * scale) / 2;
        
        // 渲染网格背景
        this.minimapCtx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
        this.minimapCtx.lineWidth = 0.5;
        for (let i = 0; i <= 250; i += 25) {
            this.minimapCtx.beginPath();
            this.minimapCtx.moveTo(i, 0);
            this.minimapCtx.lineTo(i, 180);
            this.minimapCtx.stroke();
        }
        for (let i = 0; i <= 180; i += 18) {
            this.minimapCtx.beginPath();
            this.minimapCtx.moveTo(0, i);
            this.minimapCtx.lineTo(250, i);
            this.minimapCtx.stroke();
        }
        
        // 渲染撤离区域（带动画效果）
        var currentTime = Date.now() / 1000;
        for (const zone of this.map.extractionZones) {
            const zoneX = mapOffsetX + (zone.position.x - zone.radius) * scale;
            const zoneY = mapOffsetY + (zone.position.y - zone.radius) * scale;
            const zoneSize = zone.radius * 2 * scale;
            
            // 动画效果
            const pulseAlpha = 0.6 + Math.sin(currentTime * 2) * 0.3;
            this.minimapCtx.fillStyle = `rgba(0, 255, 255, ${pulseAlpha})`;
            this.minimapCtx.fillRect(zoneX, zoneY, zoneSize, zoneSize);
            
            // 边框
            this.minimapCtx.strokeStyle = '#00ffff';
            this.minimapCtx.lineWidth = 2;
            this.minimapCtx.strokeRect(zoneX, zoneY, zoneSize, zoneSize);
        }
        
        // 渲染敌人（带威胁等级）
        for (const enemy of this.enemies) {
            const enemyX = mapOffsetX + enemy.position.x * scale;
            const enemyY = mapOffsetY + enemy.position.y * scale;
            
            if (enemyX >= 0 && enemyX <= 250 && enemyY >= 0 && enemyY <= 180) {
                // 根据距离计算威胁等级
                const distance = Utils.distance(this.player.position.x, this.player.position.y, enemy.position.x, enemy.position.y);
                const threatLevel = Math.max(0, Math.min(1, 1 - distance / 500));
                
                // 威胁等级颜色
                if (threatLevel > 0.7) {
                    this.minimapCtx.fillStyle = '#ff0000'; // 高威胁 - 红色
                } else if (threatLevel > 0.3) {
                    this.minimapCtx.fillStyle = '#ff8800'; // 中威胁 - 橙色
                } else {
                    this.minimapCtx.fillStyle = '#ffaa00'; // 低威胁 - 黄色
                }
                
                // 敌人标记（带闪烁效果）
                const currentTime = Date.now() / 1000;
                const blinkRate = Math.sin(currentTime * 4) > 0 ? 1.2 : 1;
                this.minimapCtx.beginPath();
                this.minimapCtx.arc(enemyX, enemyY, 3 * blinkRate, 0, Math.PI * 2);
                this.minimapCtx.fill();
                
                // 敌人边框
                this.minimapCtx.strokeStyle = '#ff0000';
                this.minimapCtx.lineWidth = 1;
                this.minimapCtx.stroke();
            }
        }
        
        // 渲染物品
        this.minimapCtx.fillStyle = '#ffcc00';
        for (const item of this.map.items) {
            if (item.collected) continue;
            
            const itemX = mapOffsetX + item.position.x * scale;
            const itemY = mapOffsetY + item.position.y * scale;
            
            if (itemX >= 0 && itemX <= 250 && itemY >= 0 && itemY <= 180) {
                this.minimapCtx.beginPath();
                this.minimapCtx.arc(itemX, itemY, 2, 0, Math.PI * 2);
                this.minimapCtx.fill();
            }
        }
        
        // 渲染容器
        this.minimapCtx.fillStyle = '#9966ff';
        for (const container of this.map.containers) {
            if (container.isSearched) continue;
            
            const containerX = mapOffsetX + container.position.x * scale;
            const containerY = mapOffsetY + container.position.y * scale;
            
            if (containerX >= 0 && containerX <= 250 && containerY >= 0 && containerY <= 180) {
                this.minimapCtx.fillRect(containerX - 3, containerY - 3, 6, 6);
            }
        }
        
        // 渲染玩家（更加突出）
        const playerX = mapOffsetX + this.player.position.x * scale;
        const playerY = mapOffsetY + this.player.position.y * scale;
        
        // 玩家光环效果
        const haloGradient = this.minimapCtx.createRadialGradient(playerX, playerY, 0, playerX, playerY, 15);
        haloGradient.addColorStop(0, 'rgba(0, 255, 0, 0.8)');
        haloGradient.addColorStop(1, 'rgba(0, 255, 0, 0)');
        this.minimapCtx.fillStyle = haloGradient;
        this.minimapCtx.beginPath();
        this.minimapCtx.arc(playerX, playerY, 15, 0, Math.PI * 2);
        this.minimapCtx.fill();
        
        // 玩家主体（多层效果）
        // 外圈
        this.minimapCtx.fillStyle = '#00ff00';
        this.minimapCtx.beginPath();
        this.minimapCtx.arc(playerX, playerY, 6, 0, Math.PI * 2);
        this.minimapCtx.fill();
        
        // 中圈（动画）
        const middleSize = 4 + Math.sin(currentTime * 3) * 1;
        this.minimapCtx.fillStyle = '#66ff66';
        this.minimapCtx.beginPath();
        this.minimapCtx.arc(playerX, playerY, middleSize, 0, Math.PI * 2);
        this.minimapCtx.fill();
        
        // 内圈
        this.minimapCtx.fillStyle = '#ffffff';
        this.minimapCtx.beginPath();
        this.minimapCtx.arc(playerX, playerY, 2, 0, Math.PI * 2);
        this.minimapCtx.fill();
        
        // 玩家方向指示器（更突出）
        this.minimapCtx.strokeStyle = '#00ff00';
        this.minimapCtx.lineWidth = 3;
        this.minimapCtx.beginPath();
        this.minimapCtx.moveTo(playerX, playerY);
        const dirX = Math.cos(this.player.rotation) * 12;
        const dirY = Math.sin(this.player.rotation) * 12;
        this.minimapCtx.lineTo(playerX + dirX, playerY + dirY);
        this.minimapCtx.stroke();
        
        // 方向箭头
        this.minimapCtx.fillStyle = '#00ff00';
        this.minimapCtx.beginPath();
        this.minimapCtx.moveTo(playerX + dirX, playerY + dirY);
        const arrowX1 = playerX + dirX - Math.cos(this.player.rotation - 2.5) * 5;
        const arrowY1 = playerY + dirY - Math.sin(this.player.rotation - 2.5) * 5;
        const arrowX2 = playerX + dirX - Math.cos(this.player.rotation + 2.5) * 5;
        const arrowY2 = playerY + dirY - Math.sin(this.player.rotation + 2.5) * 5;
        this.minimapCtx.lineTo(arrowX1, arrowY1);
        this.minimapCtx.lineTo(arrowX2, arrowY2);
        this.minimapCtx.closePath();
        this.minimapCtx.fill();
        
        // 渲染边框（双层效果）
        this.minimapCtx.strokeStyle = '#888888';
        this.minimapCtx.lineWidth = 3;
        this.minimapCtx.strokeRect(2, 2, 246, 176);
        
        this.minimapCtx.strokeStyle = '#ffffff';
        this.minimapCtx.lineWidth = 1;
        this.minimapCtx.strokeRect(3, 3, 244, 174);
        
        // 添加小地图标题
        this.minimapCtx.fillStyle = '#ffffff';
        this.minimapCtx.font = 'bold 14px Arial';
        this.minimapCtx.textAlign = 'center';
        this.minimapCtx.fillText('战术地图', 125, 20);
        
        // 添加状态信息
        this.minimapCtx.font = '11px Arial';
        this.minimapCtx.textAlign = 'left';
        this.minimapCtx.fillStyle = '#ffcc00';
        this.minimapCtx.fillText(`敌人: ${this.enemies.length}`, 10, 170);
        this.minimapCtx.fillText(`物品: ${this.map.items.filter(i => !i.collected).length}`, 10, 155);
        this.minimapCtx.fillText(`容器: ${this.map.containers.filter(c => !c.isSearched).length}`, 10, 140);
    }
    
    // 完成撤离
    completeExtraction() {
        clearInterval(this.extractionCheckInterval);
        this.extractionOverlay.style.display = 'none';
        this.state = GameState.VICTORY;
        
        // 撤离成功奖励
        const bonusTime = Math.max(0, 300 - (Utils.now() - this.extractionStartTime) / 1000);
        this.score += Math.floor(bonusTime * 10);
        
        this.showVictoryScreen();
    }
    
    // 检查游戏结束条件
    checkGameConditions() {
        // 检查玩家死亡
        if (this.player && this.player.health <= 0) {
            this.state = GameState.GAME_OVER;
            this.showGameOverScreen();
            return;
        }
        
        // 检查敌人清理
        if (this.enemies.length === 0 && this.lootCollected >= 5) {
            // 可以在清除敌人后开放撤离
        }
    }
    
    // 渲染游戏
    render() {
        // 清空画布
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.state === GameState.PLAYING || this.state === GameState.PAUSED) {
            // 确保相机位置正确（地图居中）
            this.ensureMapCentered();
            
            // 应用相机变换
            this.camera.applyTransform(this.ctx);
            
            // 渲染地图
            if (this.map) {
                this.map.render(this.ctx, this.camera);
            }
            
            // 渲染敌人
            for (const enemy of this.enemies) {
                enemy.render(this.ctx, this.camera);
            }
            
            // 渲染玩家
            if (this.player) {
                this.player.render(this.ctx, this.camera);
            }
            
            // 渲染子弹
            this.renderBullets();
            
            // 渲染粒子效果
            this.renderParticles();
            
            // 恢复相机变换
            this.camera.restoreTransform(this.ctx);
            
            // 渲染小地图
            this.renderMinimap();
        }
    }
    
    // 渲染子弹
    renderBullets() {
        this.ctx.fillStyle = '#ffff00';
        for (const bullet of this.bullets) {
            const screenPos = this.camera.worldToScreen(bullet.x, bullet.y);
            this.ctx.beginPath();
            this.ctx.arc(screenPos.x, screenPos.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    // 渲染粒子效果
    renderParticles() {
        for (const particle of this.particles) {
            const screenPos = this.camera.worldToScreen(particle.x, particle.y);
            
            // 设置透明度
            this.ctx.globalAlpha = particle.life / particle.maxLife;
            
            // 发光效果
            if (particle.glow) {
                // 绘制发光光晕
                const gradient = this.ctx.createRadialGradient(
                    screenPos.x, screenPos.y, 0,
                    screenPos.x, screenPos.y, particle.size * 3
                );
                gradient.addColorStop(0, particle.color);
                gradient.addColorStop(1, 'transparent');
                
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(
                    screenPos.x - particle.size * 3, 
                    screenPos.y - particle.size * 3,
                    particle.size * 6, 
                    particle.size * 6
                );
            }
            
            // 绘制粒子主体
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(screenPos.x, screenPos.y, particle.size, particle.size);
            
            this.ctx.globalAlpha = 1;
        }
    }
    
    // 创建击中效果
    createHitEffect(x, y, bulletType = 'normal') {
        const particleCount = bulletType === 'shotgun' ? 15 : 10;
        const baseColor = bulletType === 'laser_rifle' ? '#00ffff' : '#ff4444';
        
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: Utils.random(-8, 8),
                vy: Utils.random(-8, 8),
                size: Utils.random(2, 5),
                color: bulletType === 'laser_rifle' ? Utils.mixColors(baseColor, '#ffffff', 0.5) : baseColor,
                life: bulletType === 'laser_rifle' ? 800 : 500,
                maxLife: bulletType === 'laser_rifle' ? 800 : 500,
                gravity: false,
                glow: bulletType === 'laser_rifle' // 激光效果
            });
        }
    }
    
    // 创建撞击效果
    createImpactEffect(x, y, bulletType = 'normal') {
        const particleCount = bulletType === 'shotgun' ? 12 : 8;
        const color = bulletType === 'laser_rifle' ? '#0088ff' : '#888888';
        
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: Utils.random(-5, 5),
                vy: Utils.random(-5, 5),
                size: Utils.random(1, 4),
                color: color,
                life: bulletType === 'laser_rifle' ? 400 : 300,
                maxLife: bulletType === 'laser_rifle' ? 400 : 300,
                gravity: false
            });
        }
    }
    
    // 创建激光轨迹
    createLaserTrail(x, y) {
        this.particles.push({
            x: x,
            y: y,
            vx: Utils.random(-1, 1),
            vy: Utils.random(-1, 1),
            size: 2,
            color: '#00ffff',
            life: 100,
            maxLife: 100,
            gravity: false,
            glow: true
        });
    }
    
    // 更新UI
    updateUI() {
        if (!this.player) return;
        
        // 更新生命值显示
        const healthFill = document.querySelector('.health-fill');
        const healthText = document.querySelector('.health-text');
        if (healthFill && healthText) {
            const healthPercent = (this.player.health / this.player.maxHealth) * 100;
            healthFill.style.width = healthPercent + '%';
            healthText.textContent = Math.max(0, this.player.health);
        }
        
        // 更新弹药显示
        if (this.player.currentWeapon) {
            const currentAmmo = document.querySelector('.current-ammo');
            const totalAmmo = document.querySelector('.total-ammo');
            if (currentAmmo && totalAmmo) {
                currentAmmo.textContent = this.player.currentWeapon.currentAmmo;
                totalAmmo.textContent = this.player.currentWeapon.totalAmmo;
            }
        }
        
        // 更新带出价值显示
        this.updateLootValueDisplay();
        
        // 更新小地图
        this.updateMinimap();
    }
    
    // 更新带出价值显示
    updateLootValueDisplay() {
        // 创建或更新带出价值元素
        let lootDisplay = document.getElementById('loot-value-display');
        if (!lootDisplay) {
            lootDisplay = document.createElement('div');
            lootDisplay.id = 'loot-value-display';
            lootDisplay.style.cssText = `
                position: fixed;
                top: 20px;
                left: 20px;
                background: rgba(0, 0, 0, 0.9);
                color: #FFD700;
                padding: 12px 18px;
                border-radius: 8px;
                border: 2px solid #FFD700;
                font-size: 14px;
                font-weight: bold;
                z-index: 100;
                box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
            `;
            document.body.appendChild(lootDisplay);
        }
        
        // 计算总价值
        const currentValue = this.player.totalLootValue;
        const maxPossibleValue = this.getMaxPossibleLootValue();
        const percentage = maxPossibleValue > 0 ? (currentValue / maxPossibleValue * 100) : 0;
        
        lootDisplay.innerHTML = `
            <div style="color: #ffffff; margin-bottom: 5px;">带出价值</div>
            <div style="font-size: 18px;">${currentValue} / ${maxPossibleValue}</div>
            <div style="font-size: 12px; color: #cccccc;">(${percentage.toFixed(1)}%)</div>
        `;
        
        // 根据完成度改变颜色
        if (percentage >= 80) {
            lootDisplay.style.borderColor = '#00ff00';
            lootDisplay.style.color = '#00ff00';
        } else if (percentage >= 50) {
            lootDisplay.style.borderColor = '#FFD700';
            lootDisplay.style.color = '#FFD700';
        } else if (percentage >= 25) {
            lootDisplay.style.borderColor = '#ff8800';
            lootDisplay.style.color = '#ff8800';
        } else {
            lootDisplay.style.borderColor = '#ff4444';
            lootDisplay.style.color = '#ff4444';
        }
    }
    
    // 获取最大可能的带出价值
    getMaxPossibleLootValue() {
        let maxValue = 0;
        
        // 计算所有未搜索容器的价值
        for (const container of this.map.containers) {
            if (!container.isSearched) {
                maxValue += container.value;
            }
        }
        
        // 计算所有未收集物品的价值
        for (const item of this.map.items) {
            if (!item.collected) {
                maxValue += item.value;
            }
        }
        
        // 添加基础分值
        maxValue += this.score;
        
        return maxValue;
    }
    
    // 更新小地图
    updateMinimap() {
        // 现在使用renderMinimap方法
        this.renderMinimap();
    }
    
    // 渲染菜单
    renderMenu() {
        // 菜单由CSS处理，这里可以添加背景效果
    }
    
    // 渲染暂停画面
    renderPauseScreen() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('游戏暂停', this.canvas.width / 2, this.canvas.height / 2);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText('按 ESC 继续', this.canvas.width / 2, this.canvas.height / 2 + 50);
    }
    
    // 渲染游戏结束画面
    showGameOverScreen() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#ff4444';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('任务失败', this.canvas.width / 2, this.canvas.height / 2 - 50);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`得分: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
        this.ctx.fillText('按空格键返回菜单', this.canvas.width / 2, this.canvas.height / 2 + 60);
    }
    
    // 渲染胜利画面
    showVictoryScreen() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#44ff44';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('成功撤离！', this.canvas.width / 2, this.canvas.height / 2 - 50);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`得分: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
        this.ctx.fillText(`收集战利品: ${this.lootCollected}`, this.canvas.width / 2, this.canvas.height / 2 + 60);
        this.ctx.fillText('按空格键返回菜单', this.canvas.width / 2, this.canvas.height / 2 + 100);
    }
    
    // 键盘按下事件
    onKeyDown(event) {
        this.keys[event.code] = true;
        
        // 特殊按键处理
        if (event.code === Keys.ESCAPE) {
            if (this.state === GameState.PLAYING) {
                this.state = GameState.PAUSED;
            } else if (this.state === GameState.PAUSED) {
                this.state = GameState.PLAYING;
            }
        }
        
        if (event.code === Keys.SPACE) {
            if (this.state === GameState.GAME_OVER || this.state === GameState.VICTORY) {
                this.returnToMenu();
            }
        }
    }
    
    // 键盘释放事件
    onKeyUp(event) {
        this.keys[event.code] = false;
    }
    
    // 鼠标移动事件
    onMouseMove(event) {
        this.mousePosition.x = event.clientX;
        this.mousePosition.y = event.clientY;
    }
    
    // 鼠标按下事件
    onMouseDown(event) {
        this.isMouseDown = true;
        this.mouseButton = event.button;
    }
    
    // 鼠标释放事件
    onMouseUp(event) {
        this.isMouseDown = false;
    }
    
    // 打开设置
    openOptions() {
        if (this.settingsManager) {
            this.settingsManager.show();
        }
    }
    
    // 暂停游戏
    pauseGame() {
        if (this.state === GameState.PLAYING) {
            this.previousState = this.state;
            this.state = GameState.PAUSED;
        }
    }
    
    // 恢复游戏
    resumeGame() {
        if (this.state === GameState.PAUSED) {
            this.state = this.previousState || GameState.PLAYING;
        }
    }
    
    // 创建撤离覆盖层
    createExtractionOverlay() {
        this.extractionOverlay = document.createElement('div');
        this.extractionOverlay.className = 'extraction-overlay';
        this.extractionOverlay.innerHTML = `
            <div class="extraction-content">
                <h2>🚁 撤离中...</h2>
                <div class="extraction-timer">10</div>
                <div class="extraction-progress">
                    <div class="extraction-progress-bar"></div>
                </div>
                <div class="extraction-message">请保持在撤离区域内，不要移动！</div>
            </div>
        `;
        document.body.appendChild(this.extractionOverlay);
    }
    
    // 退出游戏
    quitGame() {
        if (confirm('确定要退出游戏吗？')) {
            window.close();
        }
    }
    
    // 返回菜单
    returnToMenu() {
        this.state = GameState.MENU;
        this.ui.menu.classList.remove('hidden');
        this.ui.hud.classList.add('hidden');
        
        // 清理撤离定时器
        if (this.extractionCheckInterval) {
            clearInterval(this.extractionCheckInterval);
        }
        
        // 清理游戏对象
        this.player = null;
        this.enemies = [];
        this.bullets = [];
        this.particles = [];
        this.map = null;
    }
    
    // 应用图形设置
    applyGraphicsSettings(settings) {
        GameConfig.DEBUG = settings.showFPS;
        
        // 根据质量设置调整粒子数量
        if (!settings.particles) {
            this.particles = []; // 清空现有粒子
        }
        
        // 应用屏幕震动设置
        this.screenShakeEnabled = settings.screenShake;
    }
    
    // 应用音频设置
    applyAudioSettings(settings) {
        // 这里可以集成音频系统
        console.log('Audio settings applied:', settings);
    }
    
    // 应用游戏设置
    applyGameplaySettings(settings) {
        // 根据难度调整游戏参数
        switch (settings.difficulty) {
            case 'easy':
                GameConfig.ENEMY.HEALTH = 40;
                GameConfig.ENEMY.DAMAGE = 15;
                GameConfig.ENEMY.SPAWN_COUNT = [15, 20];
                break;
            case 'normal':
                GameConfig.ENEMY.HEALTH = 60;
                GameConfig.ENEMY.DAMAGE = 20;
                GameConfig.ENEMY.SPAWN_COUNT = [20, 30];
                break;
            case 'hard':
                GameConfig.ENEMY.HEALTH = 80;
                GameConfig.ENEMY.DAMAGE = 25;
                GameConfig.ENEMY.SPAWN_COUNT = [25, 35];
                break;
            case 'extreme':
                GameConfig.ENEMY.HEALTH = 100;
                GameConfig.ENEMY.DAMAGE = 30;
                GameConfig.ENEMY.SPAWN_COUNT = [30, 40];
                break;
        }
    }
    
    // 处理容器搜索
    handleContainerSearch() {
        if (!this.player || !this.map) return;
        
        // 检查是否正在搜索
        if (this.player.isSearching) {
            return;
        }
        
        // 查找附近的容器
        for (const container of this.map.containers) {
            if (container.isSearched) continue;
            
            const distance = Utils.distance(
                this.player.position.x, this.player.position.y,
                container.position.x, container.position.y
            );
            
            if (distance <= GameConfig.PLAYER.SEARCH_RANGE) {
                // 自动搜索最近的容器
                if (this.player.searchContainer(container)) {
                    console.log(`开始搜索容器: ${container.type}, 价值: ${container.value}`);
                    break;
                }
            }
        }
    }
    
    // 应用控制设置
    applyControlSettings(settings) {
        this.mouseSensitivity = settings.mouseSensitivity;
        this.invertMouseY = settings.invertMouseY;
        this.autoSprint = settings.autoSprint;
    }
    
    // 确保地图居中显示
    ensureMapCentered() {
        // 地图始终在中心，不需要额外处理
        // 相机已经在setupThirdPersonView中固定在中心位置
    }
}