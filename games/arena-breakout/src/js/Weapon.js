// 武器类
class Weapon {
    constructor(type) {
        this.type = type;
        this.config = GameConfig.WEAPONS[type];
        
        if (!this.config) {
            throw new Error(`Unknown weapon type: ${type}`);
        }
        
        // 武器属性
        this.damage = this.config.DAMAGE;
        this.fireRate = this.config.FIRE_RATE;
        this.reloadTime = this.config.RELOAD_TIME;
        this.magazineSize = this.config.MAGAZINE_SIZE;
        this.bulletSpeed = this.config.BULLET_SPEED;
        this.spread = this.config.SPREAD;
        this.recoil = this.config.RECOIL;
        
        // 当前状态
        this.currentAmmo = this.magazineSize;
        this.totalAmmo = this.config.TOTAL_AMMO;
        this.lastShotTime = 0;
        this.isReloading = false;
        this.reloadStartTime = 0;
        this.infiniteAmmo = this.config.INFINITE_AMMO || false;
        this.pellets = this.config.PELLETS || 1; // 霰弹枪弹丸数量
        
        // 视觉效果
        this.muzzleFlash = 0;
        this.casingEjectAngle = 0;
        
        // 射击统计
        this.shotsFired = 0;
        this.hits = 0;
    }
    
    // 射击
    shoot(position, angle) {
        const now = Utils.now();
        
        // 检查射速限制
        if (now - this.lastShotTime < this.fireRate) {
            return false;
        }
        
        // 检查弹药（无限弹药武器跳过检查）
        if (!this.infiniteAmmo && this.currentAmmo <= 0) {
            return false;
        }
        
        // 创建子弹数组（支持多弹丸，如霰弹枪）
        const bullets = [];
        
        for (let i = 0; i < this.pellets; i++) {
            // 计算散射
            let spreadAngle = angle;
            if (this.pellets > 1) {
                // 霰弹枪散射
                spreadAngle = angle + Utils.random(-this.spread, this.spread);
            } else {
                // 单发武器的轻微散射
                spreadAngle = angle + Utils.random(-this.spread, this.spread);
            }
            
            // 创建子弹
            const bullet = {
                x: position.x,
                y: position.y,
                vx: Math.cos(spreadAngle) * this.bulletSpeed,
                vy: Math.sin(spreadAngle) * this.bulletSpeed,
                damage: this.damage,
                owner: 'player',
                lifetime: this.type === 'SNIPER' ? 3000 : 2000, // 狙击枪子弹飞行时间更长
                createdAt: now,
                type: this.type.toLowerCase()
            };
            
            bullets.push(bullet);
        }
        
        // 更新状态
        if (!this.infiniteAmmo) {
            this.currentAmmo--;
        }
        this.lastShotTime = now;
        this.shotsFired += this.pellets;
        this.muzzleFlash = this.type === 'LASER_RIFLE' ? 50 : 100; // 激光枪闪光时间较短
        this.casingEjectAngle = angle + Math.PI / 2 + Utils.random(-0.5, 0.5);
        
        // 播放射击音效
        this.playShootSound();
        
        // 返回子弹或子弹数组
        return this.pellets === 1 ? bullets[0] : bullets;
    }
    
    // 带精度的射击（第一人称）
    shootWithAccuracy(position, angle, pitchAngle, accuracyModifier) {
        const now = Utils.now();
        
        // 检查射速限制
        if (now - this.lastShotTime < this.fireRate) {
            return false;
        }
        
        // 检查弹药（无限弹药武器跳过检查）
        if (!this.infiniteAmmo && this.currentAmmo <= 0) {
            return false;
        }
        
        // 创建子弹数组（支持多弹丸，如霰弹枪）
        const bullets = [];
        
        for (let i = 0; i < this.pellets; i++) {
            // 计算散射 - 结合武器扩散和玩家精度
            let spreadAngle = angle;
            let verticalSpread = 0;
            
            if (this.pellets > 1) {
                // 霰弹枪散射
                spreadAngle += Utils.random(-this.spread, this.spread);
                verticalSpread = Utils.random(-this.spread, this.spread);
            } else {
                // 单发武器的精准扩散
                spreadAngle += Utils.random(-this.spread, this.spread) * accuracyModifier;
                verticalSpread = Utils.random(-this.spread, this.spread) * accuracyModifier;
            }
            
            // 创建子弹
            const bullet = {
                x: position.x,
                y: position.y,
                vx: Math.cos(spreadAngle) * this.bulletSpeed,
                vy: Math.sin(spreadAngle) * this.bulletSpeed,
                damage: this.damage,
                owner: 'player',
                lifetime: this.type === 'SNIPER' ? 3000 : 2000, // 狙击枪子弹飞行时间更长
                createdAt: now,
                type: this.type.toLowerCase(),
                pitchAngle: pitchAngle + verticalSpread // 添加俯仰角影响
            };
            
            bullets.push(bullet);
        }
        
        // 更新状态
        if (!this.infiniteAmmo) {
            this.currentAmmo--;
        }
        this.lastShotTime = now;
        this.shotsFired += this.pellets;
        this.muzzleFlash = this.type === 'LASER_RIFLE' ? 50 : 100; // 激光枪闪光时间较短
        this.casingEjectAngle = angle + Math.PI / 2 + Utils.random(-0.5, 0.5);
        
        // 播放射击音效
        this.playShootSound();
        
        // 返回子弹或子弹数组
        return this.pellets === 1 ? bullets[0] : bullets;
    }
    
    // 换弹
    reload() {
        // 无限弹药武器不需要换弹
        if (this.infiniteAmmo) {
            return false;
        }
        
        if (this.isReloading || this.currentAmmo === this.magazineSize) {
            return false;
        }
        
        if (this.totalAmmo <= 0) {
            return false;
        }
        
        this.isReloading = true;
        this.reloadStartTime = Utils.now();
        
        // 播放换弹音效
        this.playReloadSound();
        
        return true;
    }
    
    // 更新武器状态
    update(deltaTime) {
        // 更新换弹
        if (this.isReloading) {
            const elapsed = Utils.now() - this.reloadStartTime;
            if (elapsed >= this.reloadTime) {
                this.completeReload();
            }
        }
        
        // 更新视觉效果
        if (this.muzzleFlash > 0) {
            this.muzzleFlash -= deltaTime;
            if (this.muzzleFlash < 0) this.muzzleFlash = 0;
        }
    }
    
    // 完成换弹
    completeReload() {
        const ammoNeeded = this.magazineSize - this.currentAmmo;
        const ammoToReload = Math.min(ammoNeeded, this.totalAmmo);
        
        this.currentAmmo += ammoToReload;
        this.totalAmmo -= ammoToReload;
        this.isReloading = false;
    }
    
    // 添加弹药
    addAmmo(amount) {
        this.totalAmmo = Math.min(this.totalAmmo + amount, this.config.TOTAL_AMMO * 3);
    }
    
    // 获取换弹进度
    getReloadProgress() {
        if (!this.isReloading) return 0;
        
        const elapsed = Utils.now() - this.reloadStartTime;
        return Math.min(elapsed / this.reloadTime, 1);
    }
    
    // 获取武器信息
    getInfo() {
        return {
            type: this.type,
            currentAmmo: this.currentAmmo,
            totalAmmo: this.totalAmmo,
            magazineSize: this.magazineSize,
            isReloading: this.isReloading,
            reloadProgress: this.getReloadProgress(),
            shotsFired: this.shotsFired,
            accuracy: this.shotsFired > 0 ? (this.hits / this.shotsFired * 100).toFixed(1) : 0
        };
    }
    
    // 渲染武器
    render(ctx, position, angle, scale = 1) {
        ctx.save();
        
        // 移动到武器位置
        ctx.translate(position.x, position.y);
        ctx.rotate(angle);
        
        // 武器尺寸
        const weaponLength = 30 * scale;
        const weaponWidth = 8 * scale;
        
        // 绘制武器主体
        ctx.fillStyle = '#666666';
        ctx.fillRect(0, -weaponWidth / 2, weaponLength, weaponWidth);
        
        // 绘制枪管
        ctx.fillStyle = '#444444';
        ctx.fillRect(weaponLength * 0.7, -weaponWidth / 4, weaponLength * 0.4, weaponWidth / 2);
        
        // 绘制握把
        ctx.fillStyle = '#333333';
        ctx.fillRect(-weaponLength * 0.2, weaponWidth / 2, weaponLength * 0.3, weaponWidth * 0.6);
        
        // 绘制瞄准镜（狙击枪特有）
        if (this.type === 'SNIPER') {
            ctx.fillStyle = '#888888';
            ctx.fillRect(weaponLength * 0.3, -weaponWidth * 0.8, weaponLength * 0.4, weaponWidth * 0.3);
        }
        
        // 绘制枪口闪光
        if (this.muzzleFlash > 0) {
            const flashSize = (this.muzzleFlash / 100) * 15 * scale;
            const gradient = ctx.createRadialGradient(weaponLength, 0, 0, weaponLength, 0, flashSize);
            gradient.addColorStop(0, 'rgba(255, 255, 200, 0.8)');
            gradient.addColorStop(0.5, 'rgba(255, 200, 100, 0.4)');
            gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(weaponLength, 0, flashSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    // 渲染弹壳（抛壳效果）
    renderCasing(ctx, position, time) {
        // 这里可以实现弹壳抛出的物理效果
        // 简化版：在武器旁边显示一个小矩形表示弹壳
        if (this.muzzleFlash > 50) { // 射击后显示弹壳
            ctx.save();
            
            const casingX = position.x + Math.cos(this.casingEjectAngle) * 10;
            const casingY = position.y + Math.sin(this.casingEjectAngle) * 10;
            
            ctx.translate(casingX, casingY);
            ctx.rotate(time * 0.01); // 旋转效果
            
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(-2, -3, 4, 6);
            
            ctx.restore();
        }
    }
    
    // 播放射击音效
    playShootSound() {
        // 这里可以添加音效播放逻辑
        console.log(`Playing ${this.type} shoot sound`);
    }
    
    // 播放换弹音效
    playReloadSound() {
        // 这里可以添加音效播放逻辑
        console.log(`Playing ${this.type} reload sound`);
    }
    
    // 重置武器状态
    reset() {
        this.currentAmmo = this.magazineSize;
        this.totalAmmo = this.config.TOTAL_AMMO;
        this.lastShotTime = 0;
        this.isReloading = false;
        this.reloadStartTime = 0;
        this.shotsFired = 0;
        this.hits = 0;
        this.muzzleFlash = 0;
    }
    
    // 静态方法：获取所有武器类型
    static getWeaponTypes() {
        return Object.keys(GameConfig.WEAPONS);
    }
    
    // 静态方法：创建武器
    static create(type) {
        return new Weapon(type);
    }
}