// 玩家类
class Player {
    constructor(x, y) {
        this.position = new Vector2D(x, y);
        this.velocity = new Vector2D(0, 0);
        this.radius = GameConfig.PLAYER.RADIUS;
        this.health = GameConfig.PLAYER.HEALTH;
        this.maxHealth = GameConfig.PLAYER.HEALTH;
        this.speed = GameConfig.PLAYER.SPEED;
        this.rotation = 0;
        this.color = '#4488ff';
        
        // 输入状态
        this.keys = {};
        this.mousePosition = new Vector2D(0, 0);
        this.isMouseDown = false;
        this.mouseButton = null;
        
        // 移动状态
        this.isSprinting = false;
        this.isReloading = false;
        this.isShooting = false;
        this.lastShotTime = 0;
        
        // 真实感参数
        this.stamina = GameConfig.PLAYER.STAMINA;
        this.maxStamina = GameConfig.PLAYER.STAMINA;
        this.breathingPhase = 0;
        this.stepPhase = 0;
        this.isExhausted = false;
        this.lastStepTime = 0;
        
        // 身体状态
        this.posture = 'standing'; // standing, crouching, prone
        this.leaning = 0; // -1 to 1, left to right
        this.recoilOffset = new Vector2D(0, 0);
        
        // 第三人称视角参数
        this.canvas = null; // Canvas引用
        
        // 武器系统
        this.currentWeapon = null;
        this.weapons = [];
        this.inventory = [];
        this.currentWeaponIndex = 0;
        
        // 动画状态
        this.animationState = 'idle';
        this.animationTime = 0;
        
        // 物理属性
        this.mass = 1;
        this.friction = 0.9;
        
        // 背包系统
        this.inventory = [];
        this.maxInventorySize = GameConfig.PLAYER.INVENTORY_SIZE;
        this.isSearching = false;
        this.searchingContainer = null;
        this.searchStartTime = 0;
        this.totalLootValue = 0;
    }
    
    // 初始化武器
    init() {
        // 给玩家初始武器 - 全部改为无限弹药
        const weapons = [
            new Weapon('RIFLE'),
            new Weapon('MACHINE_GUN'),
            new Weapon('SHOTGUN'),
            new Weapon('LASER_RIFLE')
        ];
        
        // 设置所有武器为无限弹药
        weapons.forEach(weapon => {
            weapon.infiniteAmmo = true;
            weapon.totalAmmo = 999999;
        });
        
        this.weapons = weapons;
        this.equipWeapon(0);
    }
    
    // 更新玩家状态
    update(deltaTime, map) {
        // 处理输入
        this.handleInput();
        
        // 更新移动
        this.updateMovement(deltaTime);
        
        // 检测碰撞
        if (map) {
            this.handleCollisions(map);
        }
        
        // 更新武器
        if (this.currentWeapon) {
            this.currentWeapon.update(deltaTime);
        }
        
        // 更新动画
        this.updateAnimation(deltaTime);
    }
    
    // 处理输入
    handleInput() {
        // 计算移动方向
        let moveX = 0;
        let moveY = 0;
        
        if (this.keys[Keys.W]) moveY -= 1;
        if (this.keys[Keys.S]) moveY += 1;
        if (this.keys[Keys.A]) moveX -= 1;
        if (this.keys[Keys.D]) moveX += 1;
        
        // 归一化移动向量
        const moveVector = new Vector2D(moveX, moveY);
        if (moveVector.magnitude() > 0) {
            moveVector.normalize();
            
        // 处理体力系统
        const autoSprint = window.game && window.game.autoSprint;
        const shiftPressed = this.keys[Keys.SHIFT] || autoSprint;
        this.isSprinting = shiftPressed && this.velocity.magnitude() > 0 && this.stamina > 0;
        
        // 计算最终速度
        let currentSpeed = this.speed;
        if (this.isSprinting && !this.isExhausted) {
            currentSpeed *= GameConfig.PLAYER.SPRINT_MULTIPLIER;
            this.animationState = 'sprinting';
            // 消耗体力
            this.stamina = Math.max(0, this.stamina - GameConfig.PLAYER.STAMINA_DRAIN_RATE * 0.016);
        } else {
            this.animationState = 'running';
            // 站立时恢复体力更快
            const recoverMultiplier = this.velocity.magnitude() < 0.1 ? 2 : 1;
            this.stamina = Math.min(this.maxStamina, this.stamina + GameConfig.PLAYER.STAMINA_RECOVER_RATE * recoverMultiplier * 0.016);
        }
            
            this.velocity = moveVector.multiply(currentSpeed);
            
            // 步态动画
            this.updateStepAnimation();
        } else {
            this.velocity = this.velocity.multiply(this.friction);
            if (this.velocity.magnitude() < 0.1) {
                this.velocity.set(0, 0);
                this.animationState = 'idle';
                // 站立时恢复体力
                this.stamina = Math.min(this.maxStamina, this.stamina + GameConfig.PLAYER.STAMINA_RECOVER_RATE * 2 * 0.016);
            }
        }
        
        // 检查是否精疲力竭
        this.isExhausted = this.stamina <= 0;
        if (this.isExhausted) {
            this.isSprinting = false;
        }
        
        // 处理射击
        if (this.isMouseDown && this.mouseButton === MouseButtons.LEFT) {
            this.shoot();
        }
        
        // 处理换弹
        if (this.keys[Keys.R] && this.currentWeapon && !this.isReloading) {
            this.reload();
        }
        
        // 处理武器切换
        if (this.keys[Keys.ONE]) this.switchWeapon(0);
        if (this.keys[Keys.TWO]) this.switchWeapon(1);
        if (this.keys[Keys.THREE]) this.switchWeapon(2);
    }
    
    // 更新移动
    updateMovement(deltaTime) {
        this.position = this.position.add(this.velocity.multiply(deltaTime / 1000));
        
        // 更新旋转角度（朝向鼠标）
        const dx = this.mousePosition.x - this.position.x;
        const dy = this.mousePosition.y - this.position.y;
        this.rotation = Math.atan2(dy, dx);
    }
    
    // 处理碰撞
    handleCollisions(map) {
        // 简单的边界检测
        this.position.x = Utils.clamp(this.position.x, this.radius, map.width - this.radius);
        this.position.y = Utils.clamp(this.position.y, this.radius, map.height - this.radius);
        
        // 这里可以添加与墙壁和其他物体的碰撞检测
    }
    
    // 射击
    shoot() {
        if (!this.currentWeapon || this.isReloading) return;
        
        if (this.currentWeapon.currentAmmo > 0 || this.currentWeapon.infiniteAmmo) {
            this.isShooting = true;
        } else {
            this.reload();
        }
    }
    
    // 换弹
    reload() {
        if (!this.currentWeapon || this.isReloading) return;
        
        if (this.currentWeapon.totalAmmo > 0 && 
            this.currentWeapon.currentAmmo < this.currentWeapon.magazineSize) {
            this.isReloading = true;
            this.currentWeapon.reload();
            
            setTimeout(() => {
                this.isReloading = false;
            }, this.currentWeapon.reloadTime);
        }
    }
    
    // 搜索容器
    searchContainer(container) {
        if (this.isSearching || container.isSearched || container.isSearching) {
            return false;
        }
        
        // 检查距离
        const distance = Utils.distance(this.position.x, this.position.y, container.position.x, container.position.y);
        if (distance > GameConfig.PLAYER.SEARCH_RANGE) {
            return false;
        }
        
        this.isSearching = true;
        this.searchingContainer = container;
        this.searchStartTime = Utils.now();
        
        // 标记容器正在被搜索
        container.isSearching = true;
        container.searchStartTime = Utils.now();
        
        return true;
    }
    
    // 完成搜索
    completeSearch() {
        if (!this.searchingContainer) return;
        
        const container = this.searchingContainer;
        container.isSearched = true;
        container.isSearching = false;
        
        // 生成战利品
        const loot = this.generateLoot(container.value);
        
        // 添加到背包
        if (this.addToInventory(loot)) {
            this.totalLootValue += loot.value;
        }
        
        // 重置搜索状态
        this.isSearching = false;
        this.searchingContainer = null;
    }
    
    // 生成战利品
    generateLoot(containerValue) {
        const lootTypes = ['weapon', 'ammo', 'medkit', 'special'];
        const lootType = lootTypes[Utils.randomInt(0, lootTypes.length - 1)];
        
        // 根据容器价值调整物品价值
        const valueMultiplier = containerValue / 500; // 基准值500
        const lootValue = Utils.random(50, 300) * valueMultiplier;
        
        return {
            type: lootType,
            value: Math.floor(lootValue),
            name: this.getLootName(lootType),
            rarity: this.getLootRarity(containerValue)
        };
    }
    
    // 获取战利品名称
    getLootName(type) {
        const names = {
            'weapon': ['突击步枪零件', '狙击枪配件', '手枪零件', '霰弹枪配件'],
            'ammo': ['步枪弹药箱', '手枪弹药包', '霰弹', '狙击弹药'],
            'medkit': ['医疗包', '绷带', '肾上腺素', '抗生素'],
            'special': ['黄金', '宝石', '古董', '情报文件']
        };
        
        const typeNames = names[type] || ['未知物品'];
        return typeNames[Utils.randomInt(0, typeNames.length - 1)];
    }
    
    // 获取战利品稀有度
    getLootRarity(value) {
        if (value >= 1000) return 'legendary';
        if (value >= 500) return 'epic';
        if (value >= 200) return 'rare';
        if (value >= 100) return 'uncommon';
        return 'common';
    }
    
    // 添加到背包
    addToInventory(loot) {
        if (this.inventory.length >= this.maxInventorySize) {
            // 背包已满，替换价值最低的物品
            const minValueLoot = this.inventory.reduce((min, item) => 
                item.value < min.value ? item : min, this.inventory[0]);
            
            if (minValueLoot.value < loot.value) {
                const index = this.inventory.indexOf(minValueLoot);
                this.inventory[index] = loot;
                this.totalLootValue = this.totalLootValue - minValueLoot.value + loot.value;
                return true;
            }
            return false;
        }
        
        this.inventory.push(loot);
        return true;
    }
    
    // 取消搜索
    cancelSearch() {
        if (this.searchingContainer) {
            this.searchingContainer.isSearching = false;
            this.searchingContainer.searchProgress = 0;
        }
        
        this.isSearching = false;
        this.searchingContainer = null;
        this.searchStartTime = 0;
    }
    
    // 添加武器
    addWeapon(weapon) {
        if (this.weapons.length < 3) {
            this.weapons.push(weapon);
            return true;
        }
        return false;
    }
    
    // 装备武器
    equipWeapon(index) {
        if (index >= 0 && index < this.weapons.length) {
            this.currentWeapon = this.weapons[index];
            this.currentWeaponIndex = index;
        }
    }
    
    // 切换武器
    switchWeapon(index) {
        if (index >= 0 && index < this.weapons.length && index !== this.currentWeaponIndex) {
            this.equipWeapon(index);
        }
    }
    
    // 受到伤害
    takeDamage(damage) {
        this.health = Math.max(0, this.health - damage);
        if (this.health <= 0) {
            this.die();
        }
    }
    
    // 治疗
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }
    
    // 死亡
    die() {
        this.animationState = 'dead';
        // 这里可以添加死亡动画和游戏结束逻辑
    }
    
    // 更新动画
    updateAnimation(deltaTime) {
        this.animationTime += deltaTime;
        
        // 更新呼吸动画
        this.breathingPhase += GameConfig.PLAYER.BREATHING_RATE * deltaTime / 1000;
        
        // 更新后坐力恢复
        this.recoilOffset = this.recoilOffset.multiply(0.9);
        
        // 更新搜索进度
        this.updateSearchProgress(deltaTime);
    }
    
    // 更新搜索进度
    updateSearchProgress(deltaTime) {
        if (!this.isSearching || !this.searchingContainer) return;
        
        const elapsed = Utils.now() - this.searchStartTime;
        const searchTime = GameConfig.PLAYER.SEARCH_TIME;
        
        if (elapsed >= searchTime) {
            this.completeSearch();
        } else {
            this.searchingContainer.searchProgress = elapsed / searchTime;
        }
    }
    
    // 更新步态动画
    updateStepAnimation() {
        const now = Utils.now();
        const stepInterval = this.isSprinting ? 200 : 300;
        
        if (now - this.lastStepTime > stepInterval) {
            this.lastStepTime = now;
            this.stepPhase = (this.stepPhase + 1) % 2;
        }
    }
    
    // 渲染玩家
    render(ctx, camera) {
        // 设置canvas引用
        this.canvas = camera.canvas;
        
        // 第三人称视角渲染
        this.renderThirdPersonView(ctx, camera);
    }
    
    // 第一人称视角渲染
    renderFirstPersonView(ctx, camera) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // 头部摆动效果
        this.updateHeadBob();
        
        // 渲染准星
        this.renderCrosshair(ctx, centerX, centerY);
        
        // 渲染武器（第一人称视角）
        if (this.currentWeapon) {
            this.renderWeaponFirstPerson(ctx, centerX, centerY);
        }
        
        // 渲染第一人称UI
        this.renderFirstPersonUI(ctx);
    }
    
    // 第三人称视角渲染
    renderThirdPersonView(ctx, camera) {
        const screenPos = camera.worldToScreen(this.position.x, this.position.y);
        const screenRadius = this.radius * camera.zoom;
        
        ctx.save();
        
        // 移动到玩家位置并旋转
        ctx.translate(screenPos.x, screenPos.y);
        ctx.rotate(this.rotation);
        
        // 应用后坐力偏移
        ctx.translate(this.recoilOffset.x, this.recoilOffset.y);
        
        // 绘制玩家光环效果（突出主角）
        const haloGradient = ctx.createRadialGradient(0, 0, screenRadius, 0, 0, screenRadius * 2.5);
        if (this.isSprinting) {
            haloGradient.addColorStop(0, 'rgba(100, 200, 255, 0.4)');
            haloGradient.addColorStop(1, 'rgba(100, 200, 255, 0)');
        } else {
            haloGradient.addColorStop(0, 'rgba(0, 255, 100, 0.3)');
            haloGradient.addColorStop(1, 'rgba(0, 255, 100, 0)');
        }
        ctx.fillStyle = haloGradient;
        ctx.beginPath();
        ctx.arc(0, 0, screenRadius * 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制身体阴影（增强效果）
        ctx.save();
        ctx.scale(1, 0.6);
        const shadowGradient = ctx.createRadialGradient(0, screenRadius * 0.3, 0, 0, screenRadius * 0.3, screenRadius * 1.5);
        shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
        shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
        ctx.fillStyle = shadowGradient;
        ctx.beginPath();
        ctx.arc(0, screenRadius * 0.3, screenRadius * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // 绘制玩家身体（呼吸效果和状态变化）
        const breathingScale = 1 + Math.sin(this.breathingPhase) * 0.02;
        const staminaEffect = this.isSprinting ? 1.1 : 1.0;
        ctx.save();
        ctx.scale(breathingScale * staminaEffect, breathingScale * staminaEffect);
        
        // 绘制身体外圈（突出效果）
        ctx.fillStyle = this.isSprinting ? '#88ccff' : '#66ff66';
        ctx.beginPath();
        ctx.arc(0, 0, screenRadius * 1.1, 0, Math.PI * 2);
        ctx.fill();
        
        // 身体颜色根据状态变化（更鲜艳）
        let bodyColor = this.color;
        let outlineColor = '#ffffff';
        if (this.health < 30) {
            bodyColor = '#ff6666'; // 低血量亮红色
            outlineColor = '#ff0000';
        } else if (this.isExhausted) {
            bodyColor = '#ffcc44'; // 疲劳亮橙色
            outlineColor = '#ff8800';
        } else if (this.isSprinting) {
            bodyColor = '#88ccff'; // 冲刺亮蓝色
            outlineColor = '#00aaff';
        } else {
            bodyColor = '#66ff66'; // 正常亮绿色
            outlineColor = '#00ff00';
        }
        
        // 绘制主体
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.arc(0, 0, screenRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制多层轮廓（突出效果）
        ctx.strokeStyle = outlineColor;
        ctx.lineWidth = 4;
        ctx.stroke();
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 绘制发光效果
        const glowGradient = ctx.createRadialGradient(0, 0, screenRadius * 0.7, 0, 0, screenRadius);
        glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(0, 0, screenRadius * 0.9, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制头部（更突出）
        const headSize = screenRadius * 0.5;
        const headGradient = ctx.createRadialGradient(0, -screenRadius * 0.6, 0, 0, -screenRadius * 0.6, headSize);
        headGradient.addColorStop(0, '#ffeedd');
        headGradient.addColorStop(1, '#ffdbac');
        ctx.fillStyle = headGradient;
        ctx.beginPath();
        ctx.arc(0, -screenRadius * 0.6, headSize, 0, Math.PI * 2);
        ctx.fill();
        
        // 头部轮廓
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 绘制装备（突出显示）
        if (this.weapons.length > 0) {
            const equipGradient = ctx.createLinearGradient(-screenRadius * 0.3, 0, screenRadius * 0.3, 0);
            equipGradient.addColorStop(0, '#666666');
            equipGradient.addColorStop(0.5, '#888888');
            equipGradient.addColorStop(1, '#666666');
            ctx.fillStyle = equipGradient;
            ctx.fillRect(-screenRadius * 0.4, screenRadius * 0.2, screenRadius * 0.8, screenRadius * 0.4);
            
            // 装备轮廓
            ctx.strokeStyle = '#aaaaaa';
            ctx.lineWidth = 1;
            ctx.strokeRect(-screenRadius * 0.4, screenRadius * 0.2, screenRadius * 0.8, screenRadius * 0.4);
        }
        
        ctx.restore();
        
        // 绘制武器（增强效果）
        if (this.currentWeapon) {
            ctx.save();
            // 武器发光
            if (this.isShooting) {
                const weaponGlow = ctx.createRadialGradient(screenRadius * 0.8, 0, 0, screenRadius * 0.8, 0, screenRadius);
                weaponGlow.addColorStop(0, 'rgba(255, 255, 200, 0.6)');
                weaponGlow.addColorStop(1, 'rgba(255, 255, 200, 0)');
                ctx.fillStyle = weaponGlow;
                ctx.fillRect(screenRadius * 0.7, -screenRadius, screenRadius * 1.5, screenRadius * 2);
            }
            this.currentWeapon.render(ctx, {x: 0, y: 0}, 0, camera.zoom * 1.2);
            ctx.restore();
        }
        
        // 绘制方向指示器（更突出）
        const indicatorGradient = ctx.createLinearGradient(screenRadius * 0.5, 0, screenRadius * 2, 0);
        if (this.isSprinting) {
            indicatorGradient.addColorStop(0, '#ffff00');
            indicatorGradient.addColorStop(1, '#ff8800');
        } else {
            indicatorGradient.addColorStop(0, '#ffffff');
            indicatorGradient.addColorStop(1, '#00ff00');
        }
        ctx.fillStyle = indicatorGradient;
        const indicatorLength = screenRadius * (this.isSprinting ? 1.5 : 1.2);
        const indicatorWidth = this.isSprinting ? 6 : 4;
        ctx.fillRect(screenRadius * 0.5, -indicatorWidth/2, indicatorLength, indicatorWidth);
        
        // 添加方向箭头
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(screenRadius * 1.7, 0);
        ctx.lineTo(screenRadius * 1.5, -indicatorWidth);
        ctx.lineTo(screenRadius * 1.5, indicatorWidth);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
        
        // 绘制脚步效果（增强）
        if (this.animationState === 'running' || this.animationState === 'sprinting') {
            this.renderFootprints(ctx, screenPos, screenRadius);
        }
        
        // 绘制增强的生命值条
        this.renderHealthBar(ctx, screenPos, screenRadius);
        
        // 绘制增强的体力条
        this.renderStaminaBar(ctx, screenPos, screenRadius);
        
        // 绘制状态指示
        this.renderStatus(ctx, screenPos, screenRadius);
        
        // 绘制玩家名称标签
        this.renderPlayerName(ctx, screenPos, screenRadius);
    }
    
    // 绘制玩家名称标签
    renderPlayerName(ctx, screenPos, screenRadius) {
        ctx.save();
        
        // 背景框
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        const boxWidth = 80;
        const boxHeight = 20;
        ctx.fillRect(screenPos.x - boxWidth/2, screenPos.y - screenRadius - 35, boxWidth, boxHeight);
        
        // 边框
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(screenPos.x - boxWidth/2, screenPos.y - screenRadius - 35, boxWidth, boxHeight);
        
        // 文字
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('玩家', screenPos.x, screenPos.y - screenRadius - 20);
        
        ctx.restore();
    }
    
    // 更新头部摆动
    updateHeadBob() {
        if (this.animationState === 'running' || this.animationState === 'sprinting') {
            const bobSpeed = this.isSprinting ? 0.15 : 0.1;
            const bobAmount = GameConfig.PLAYER.HEAD_BOB_INTENSITY * (this.isSprinting ? 1.5 : 1.0);
            const reducedAmount = bobAmount * (1 - this.adsProgress * 0.8); // 瞄准时减少头部摆动
            this.headBobPhase += bobSpeed;
            this.headBobOffset = Math.sin(this.headBobPhase) * reducedAmount;
        } else {
            this.headBobOffset *= 0.9; // 平滑回到原位
        }
    }
    
    // 渲染准星
    renderCrosshair(ctx, centerX, centerY) {
        const crosshairType = window.game && window.game.settingsManager 
            ? window.game.settingsManager.getSetting('gameplay.crosshairType') 
            : 'default';
        
        ctx.save();
        
        // 瞄准时准星变化
        const scale = 1 + this.adsProgress * 0.3;
        const alpha = this.isAiming ? 0.7 : 1.0;
        const spread = this.crosshairSpread * (1 - this.adsProgress * 0.7);
        
        ctx.strokeStyle = `rgba(0, 255, 0, ${alpha})`;
        ctx.fillStyle = `rgba(0, 255, 0, ${alpha})`;
        ctx.lineWidth = 2;
        
        ctx.translate(centerX, centerY);
        ctx.scale(scale, scale);
        
        // 应用扩散效果
        if (spread > 0) {
            ctx.translate(Utils.random(-spread, spread), Utils.random(-spread, spread));
        }
        
        switch (crosshairType) {
            case 'dot':
                ctx.beginPath();
                ctx.arc(0, 0, 2, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'cross':
                ctx.beginPath();
                ctx.moveTo(-15, 0);
                ctx.lineTo(15, 0);
                ctx.moveTo(0, -15);
                ctx.lineTo(0, 15);
                ctx.stroke();
                break;
                
            case 'circle':
                ctx.beginPath();
                ctx.arc(0, 0, 20, 0, Math.PI * 2);
                ctx.stroke();
                break;
                
            default: // default - 四角准星
                const size = 15;
                ctx.beginPath();
                ctx.moveTo(-size, 0);
                ctx.lineTo(-size/2, 0);
                ctx.moveTo(size/2, 0);
                ctx.lineTo(size, 0);
                ctx.moveTo(0, -size);
                ctx.lineTo(0, -size/2);
                ctx.moveTo(0, size/2);
                ctx.lineTo(0, size);
                ctx.stroke();
                
                // 中心点
                ctx.beginPath();
                ctx.arc(0, 0, 1, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
        
        ctx.restore();
    }
    
    // 渲染第一人称武器
    renderWeaponFirstPerson(ctx, centerX, centerY) {
        if (!this.currentWeapon) return;
        
        ctx.save();
        
        // 武器位置和动画
        const adsOffsetX = 100 * this.adsProgress;
        const adsOffsetY = 50 * this.adsProgress;
        const weaponX = centerX + 150 - adsOffsetX;
        const weaponY = centerY + 100 + (this.headBobOffset || 0) - adsOffsetY;
        
        ctx.translate(weaponX, weaponY);
        
        // 应用后坐力和ADS旋转
        const recoilAmount = this.totalRecoil * (1 - this.adsProgress);
        ctx.translate(0, -recoilAmount);
        ctx.rotate(-this.totalRecoil * 0.001 * (1 - this.adsProgress));
        
        // 瞄准时武器更靠近中心
        const weaponScale = 2.5 * (1 + this.adsProgress * 0.3);
        
        // 渲染武器光效
        if (this.muzzleFlash > 0) {
            this.renderMuzzleFlash(ctx);
        }
        
        // 根据武器类型绘制
        switch (this.currentWeapon.type) {
            case 'RIFLE':
                this.renderRifleFirstPerson(ctx, weaponScale);
                break;
            case 'MACHINE_GUN':
                this.renderMachineGunFirstPerson(ctx, weaponScale);
                break;
            case 'SHOTGUN':
                this.renderShotgunFirstPerson(ctx, weaponScale);
                break;
            case 'LASER_RIFLE':
                this.renderLaserRifleFirstPerson(ctx, weaponScale);
                break;
            default:
                this.currentWeapon.render(ctx, {x: 0, y: 0}, 0, weaponScale);
        }
        
        ctx.restore();
    }
    
    // 渲染枪口闪光
    renderMuzzleFlash(ctx) {
        const flashIntensity = this.muzzleFlash / 100;
        
        ctx.save();
        ctx.fillStyle = `rgba(255, 255, 200, ${flashIntensity * 0.8})`;
        
        // 主闪光
        ctx.beginPath();
        ctx.arc(60, 0, 20 * flashIntensity, 0, Math.PI * 2);
        ctx.fill();
        
        // 光线效果
        ctx.strokeStyle = `rgba(255, 200, 100, ${flashIntensity * 0.6})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(60, 0);
        ctx.lineTo(100, 0);
        ctx.stroke();
        
        ctx.restore();
    }
    
    // 渲染步枪第一人称视角
    renderRifleFirstPerson(ctx, scale) {
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(-30 * scale, -10 * scale, 80 * scale, 20 * scale);
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(50 * scale, -8 * scale, 40 * scale, 16 * scale);
        
        // 瞄准镜
        ctx.fillStyle = '#444';
        ctx.fillRect(10 * scale, -15 * scale, 30 * scale, 10 * scale);
    }
    
    // 渲染机枪第一人称视角
    renderMachineGunFirstPerson(ctx, scale) {
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(-25 * scale, -12 * scale, 90 * scale, 24 * scale);
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(65 * scale, -10 * scale, 50 * scale, 20 * scale);
        
        // 弹箱
        ctx.fillStyle = '#555';
        ctx.fillRect(20 * scale, 8 * scale, 40 * scale, 15 * scale);
    }
    
    // 渲染霰弹枪第一人称视角
    renderShotgunFirstPerson(ctx, scale) {
        ctx.fillStyle = '#4a3a2a';
        ctx.fillRect(-20 * scale, -15 * scale, 100 * scale, 30 * scale);
        ctx.fillStyle = '#3a2a1a';
        ctx.fillRect(80 * scale, -12 * scale, 40 * scale, 24 * scale);
        
        // 护木
        ctx.fillStyle = '#5a4a3a';
        ctx.fillRect(0 * scale, -5 * scale, 40 * scale, 10 * scale);
    }
    
    // 渲染激光步枪第一人称视角
    renderLaserRifleFirstPerson(ctx, scale) {
        ctx.fillStyle = '#0044aa';
        ctx.fillRect(-25 * scale, -10 * scale, 85 * scale, 20 * scale);
        ctx.fillStyle = '#0033aa';
        ctx.fillRect(60 * scale, -8 * scale, 35 * scale, 16 * scale);
        
        // 能量管
        const gradient = ctx.createLinearGradient(-20 * scale, 0, 60 * scale, 0);
        gradient.addColorStop(0, '#00ffff');
        gradient.addColorStop(1, '#0088ff');
        ctx.fillStyle = gradient;
        ctx.fillRect(-20 * scale, -3 * scale, 80 * scale, 6 * scale);
    }
    
    // 渲染第一人称UI
    renderFirstPersonUI(ctx) {
        const padding = 20;
        
        // 生命值条（左下角）
        this.renderFPHealthBar(ctx, padding, this.canvas.height - 60);
        
        // 体力条（左下角）
        this.renderFPStaminaBar(ctx, padding, this.canvas.height - 40);
        
        // 武器信息（右下角）
        this.renderFPWeaponInfo(ctx, this.canvas.width - padding - 200, this.canvas.height - 60);
    }
    
    // 第一人称生命值条
    renderFPHealthBar(ctx, x, y) {
        const width = 200;
        const height = 20;
        
        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x, y, width, height);
        
        // 生命值
        const healthPercent = this.health / this.maxHealth;
        const healthColor = healthPercent > 0.5 ? '#00ff00' : 
                           healthPercent > 0.25 ? '#ffff00' : '#ff0000';
        ctx.fillStyle = healthColor;
        ctx.fillRect(x, y, width * healthPercent, height);
        
        // 边框
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
        
        // 文字
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Arial';
        ctx.fillText(`生命值: ${Math.max(0, this.health)}/${this.maxHealth}`, x + 5, y + 15);
    }
    
    // 第一人称体力条
    renderFPStaminaBar(ctx, x, y) {
        const width = 200;
        const height = 15;
        
        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x, y, width, height);
        
        // 体力值
        const staminaPercent = this.stamina / this.maxStamina;
        const staminaColor = this.isExhausted ? '#ff0000' : 
                            this.stamina < 30 ? '#ffaa00' : '#00ff00';
        ctx.fillStyle = staminaColor;
        ctx.fillRect(x, y, width * staminaPercent, height);
        
        // 边框
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
        
        // 文字
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.fillText(`体力: ${Math.floor(this.stamina)}/${this.maxStamina}`, x + 5, y + 11);
    }
    
    // 第一人称武器信息
    renderFPWeaponInfo(ctx, x, y) {
        if (!this.currentWeapon) return;
        
        const weaponName = {
            'RIFLE': '突击步枪',
            'MACHINE_GUN': '机枪',
            'SHOTGUN': '霰弹枪',
            'LASER_RIFLE': '激光步枪'
        }[this.currentWeapon.type] || this.currentWeapon.type;
        
        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x - 10, y - 30, 200, 80);
        
        // 武器名称
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.fillText(weaponName, x, y - 10);
        
        // 弹药信息
        ctx.font = '14px Arial';
        const ammoText = this.currentWeapon.infiniteAmmo 
            ? '∞ / ∞' 
            : `${this.currentWeapon.currentAmmo} / ${this.currentWeapon.totalAmmo}`;
        ctx.fillText(ammoText, x, y + 10);
        
        // 武器状态
        if (this.currentWeapon.isReloading) {
            ctx.fillStyle = '#ffff00';
            ctx.fillText('换弹中...', x, y + 30);
        } else if (this.isExhausted) {
            ctx.fillStyle = '#ff0000';
            ctx.fillText('体力耗尽', x, y + 30);
        }
    }
    
    // 渲染足迹
    renderFootprints(ctx, screenPos, screenRadius) {
        const footOffset = screenRadius * 1.2;
        const leftFoot = this.stepPhase === 0;
        
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#666666';
        
        const footX = screenPos.x + (leftFoot ? -footOffset/2 : footOffset/2);
        const footY = screenPos.y + footOffset;
        
        // 简化的足迹形状
        ctx.beginPath();
        ctx.ellipse(footX, footY, 4, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    // 渲染体力条
    renderStaminaBar(ctx, screenPos, screenRadius) {
        const barWidth = screenRadius * 2;
        const barHeight = 4;
        const barY = screenPos.y - screenRadius - 22;
        
        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(screenPos.x - barWidth / 2, barY, barWidth, barHeight);
        
        // 体力值
        const staminaPercent = this.stamina / this.maxStamina;
        const staminaColor = this.isExhausted ? '#ff0000' : 
                           this.stamina < 30 ? '#ffaa00' : '#00ff00';
        ctx.fillStyle = staminaColor;
        ctx.fillRect(screenPos.x - barWidth / 2, barY, barWidth * staminaPercent, barHeight);
        
        // 边框
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(screenPos.x - barWidth / 2, barY, barWidth, barHeight);
    }
    
    // 渲染生命值条
    renderHealthBar(ctx, screenPos, screenRadius) {
        const barWidth = screenRadius * 2;
        const barHeight = 6;
        const barY = screenPos.y - screenRadius - 15;
        
        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(screenPos.x - barWidth / 2, barY, barWidth, barHeight);
        
        // 生命值
        const healthPercent = this.health / this.maxHealth;
        const healthColor = healthPercent > 0.5 ? '#00ff00' : 
                           healthPercent > 0.25 ? '#ffff00' : '#ff0000';
        ctx.fillStyle = healthColor;
        ctx.fillRect(screenPos.x - barWidth / 2, barY, barWidth * healthPercent, barHeight);
        
        // 边框
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(screenPos.x - barWidth / 2, barY, barWidth, barHeight);
    }
    
    // 渲染状态指示
    renderStatus(ctx, screenPos, screenRadius) {
        const statusY = screenPos.y + screenRadius + 20;
        
        ctx.font = '12px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        
        if (this.isReloading) {
            ctx.fillText('换弹中...', screenPos.x, statusY);
        } else if (this.isSprinting) {
            ctx.fillText('冲刺', screenPos.x, statusY);
        }
        
        // 显示武器信息
        if (this.currentWeapon) {
            const ammoText = `${this.currentWeapon.currentAmmo} / ${this.currentWeapon.totalAmmo}`;
            ctx.fillText(ammoText, screenPos.x, statusY + 15);
        }
    }
    
    // 键盘按下事件
    onKeyDown(key) {
        this.keys[key] = true;
    }
    
    // 键盘释放事件
    onKeyUp(key) {
        this.keys[key] = false;
    }
    
    // 鼠标移动事件
    onMouseMove(x, y, camera) {
        const sensitivity = (window.game && window.game.mouseSensitivity !== undefined) 
            ? window.game.mouseSensitivity * 2.0 // 基础灵敏度
            : 2.0;
        
        const deltaX = (x - this.lastMouseX);
        const deltaY = (y - this.lastMouseY);
        
        // 更新旋转角度
        this.rotation += deltaX * sensitivity * 0.002;
        
        // 记录鼠标位置
        this.lastMouseX = x;
        this.lastMouseY = y;
        
        // 更新鼠标位置（用于其他计算）
        this.mousePosition = camera.screenToWorld(x, y);
        
        // 初始化lastMouse位置
        if (this.lastMouseX === undefined) {
            this.lastMouseX = x;
            this.lastMouseY = y;
        }
    }
    
    // 鼠标按下事件
    onMouseDown(button) {
        this.isMouseDown = true;
        this.mouseButton = button;
    }
    
    // 鼠标释放事件
    onMouseUp(button) {
        this.isMouseDown = false;
        this.isShooting = false;
    }
    
    // 获取玩家信息
    getInfo() {
        return {
            position: this.position,
            health: this.health,
            maxHealth: this.maxHealth,
            currentWeapon: this.currentWeapon ? this.currentWeapon.type : null,
            ammo: this.currentWeapon ? {
                current: this.currentWeapon.currentAmmo,
                total: this.currentWeapon.totalAmmo
            } : null
        };
    }
}