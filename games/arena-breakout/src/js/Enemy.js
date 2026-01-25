// 敌人类
class Enemy {
    constructor(x, y, type = 'basic') {
        this.position = new Vector2D(x, y);
        this.velocity = new Vector2D(0, 0);
        this.radius = GameConfig.ENEMY.RADIUS;
        this.health = GameConfig.ENEMY.HEALTH;
        this.maxHealth = GameConfig.ENEMY.HEALTH;
        this.speed = GameConfig.ENEMY.SPEED;
        this.damage = GameConfig.ENEMY.DAMAGE;
        this.type = type;
        
        // AI 状态
        this.state = 'patrol'; // patrol, chase, attack, search, dead
        this.target = null;
        this.patrolPoints = [];
        this.currentPatrolIndex = 0;
        this.lastKnownPlayerPosition = null;
        this.searchStartTime = 0;
        
        // 战斗属性
        this.attackRange = GameConfig.ENEMY.ATTACK_RANGE;
        this.detectionRange = GameConfig.ENEMY.DETECTION_RANGE;
        this.lastAttackTime = 0;
        this.attackCooldown = GameConfig.ENEMY.ATTACK_COOLDOWN;
        this.patrolSpeed = GameConfig.ENEMY.PATROL_SPEED;
        this.chaseSpeed = GameConfig.ENEMY.CHASE_SPEED;
        
        // 视觉和听觉
        this.visionAngle = Math.PI / 3; // 60度视野
        this.visionRange = this.detectionRange;
        this.hearingRange = this.detectionRange * 0.6;
        
        // 动画
        this.rotation = 0;
        this.animationTime = 0;
        this.animationState = 'idle';
        
        // 装备
        this.weapon = null;
        this.inventory = [];
        
        // 物理属性
        this.mass = 1;
        this.friction = 0.8;
    }
    
    // 初始化
    init(patrolPoints) {
        this.patrolPoints = patrolPoints || this.generatePatrolPoints();
        this.equipWeapon();
    }
    
    // 生成巡逻点
    generatePatrolPoints() {
        const points = [];
        const numPoints = Utils.randomInt(3, 6);
        const radius = 200;
        
        for (let i = 0; i < numPoints; i++) {
            const angle = (Math.PI * 2 * i) / numPoints + Utils.random(-0.3, 0.3);
            const distance = Utils.random(radius * 0.5, radius);
            const x = this.position.x + Math.cos(angle) * distance;
            const y = this.position.y + Math.sin(angle) * distance;
            points.push(new Vector2D(x, y));
        }
        
        return points;
    }
    
    // 装备武器
    equipWeapon() {
        // 根据敌人类型装备不同武器
        const weaponTypes = {
            'basic': 'PISTOL',
            'soldier': 'RIFLE',
            'sniper': 'SNIPER'
        };
        
        const weaponType = weaponTypes[this.type] || 'PISTOL';
        this.weapon = new Weapon(weaponType);
    }
    
    // 更新敌人
    update(deltaTime, player, map, otherEnemies) {
        this.animationTime += deltaTime;
        
        if (this.state === 'dead') {
            return;
        }
        
        // 感知玩家
        this.detectPlayer(player, map);
        
        // 根据状态执行AI
        switch (this.state) {
            case 'patrol':
                this.patrol(deltaTime, map);
                break;
            case 'chase':
                this.chaseWithPathfinding(player, deltaTime, map);
                break;
            case 'attack':
                this.attack(player, deltaTime);
                break;
            case 'search':
                this.searchWithPathfinding(deltaTime, map);
                break;
        }
        
        // 更新武器
        if (this.weapon) {
            this.weapon.update(deltaTime);
        }
        
        // 处理物理
        this.updatePhysics(deltaTime, map);
        
        // 群体行为
        this.applyGroupBehavior(otherEnemies);
    }
    
    // 带寻路的追击
    chaseWithPathfinding(player, deltaTime, map) {
        if (!player) return;
        
        const distance = this.position.distance(player.position);
        
        if (distance <= this.attackRange) {
            // 进入攻击范围
            this.state = 'attack';
            this.velocity.set(0, 0);
        } else {
            // 使用寻路追击玩家
            const path = this.findPath(this.position, player.position, map);
            if (path && path.length > 0) {
                const nextPoint = path[0];
                const direction = nextPoint.subtract(this.position).normalize();
                this.velocity = direction.multiply(this.chaseSpeed);
                this.rotation = direction.getAngle();
                this.animationState = 'running';
            } else {
                // 寻路失败，直接追击
                this.chase(player, deltaTime, map);
            }
        }
        
        // 尝试射击（如果有武器）
        if (this.weapon && distance <= this.weapon.bulletSpeed * 0.5) {
            this.tryShoot(player);
        }
    }
    
    // 带寻路的搜索
    searchWithPathfinding(deltaTime, map) {
        const searchDuration = 10000; // 10秒搜索时间
        const elapsed = Utils.now() - this.searchStartTime;
        
        if (elapsed >= searchDuration) {
            // 搜索超时，回到巡逻状态
            this.state = 'patrol';
            return;
        }
        
        // 向最后已知位置寻路
        if (this.lastKnownPlayerPosition) {
            const path = this.findPath(this.position, this.lastKnownPlayerPosition, map);
            if (path && path.length > 0) {
                const nextPoint = path[0];
                const direction = nextPoint.subtract(this.position).normalize();
                this.velocity = direction.multiply(this.patrolSpeed * 0.5);
                this.rotation = direction.getAngle();
                this.animationState = 'searching';
            }
        }
    }
    
    // 简化的A*寻路算法
    findPath(start, end, map) {
        // 简化版本：直接走向目标，避开墙壁
        const path = [];
        let current = start.clone();
        const maxSteps = 50;
        let steps = 0;
        
        while (current.distance(end) > 20 && steps < maxSteps) {
            const direction = end.subtract(current).normalize();
            const next = current.add(direction.multiply(20));
            
            // 检查是否可行走
            if (map.isWalkable(next.x, next.y) && 
                !map.checkCollision(next.x, next.y, this.radius)) {
                path.push(next);
                current = next;
            } else {
                // 尝试绕过障碍物
                const alternatives = [
                    current.add(new Vector2D(direction.y * 20, -direction.x * 20)),
                    current.add(new Vector2D(-direction.y * 20, direction.x * 20)),
                    current.add(new Vector2D(0, 20)),
                    current.add(new Vector2D(0, -20))
                ];
                
                let found = false;
                for (const alt of alternatives) {
                    if (map.isWalkable(alt.x, alt.y) && 
                        !map.checkCollision(alt.x, alt.y, this.radius)) {
                        path.push(alt);
                        current = alt;
                        found = true;
                        break;
                    }
                }
                
                if (!found) break;
            }
            
            steps++;
        }
        
        return path.length > 0 ? path : null;
    }
    
    // 感知玩家
    detectPlayer(player, map) {
        if (!player || this.state === 'dead') return;
        
        const distance = this.position.distance(player.position);
        
        // 检查距离
        if (distance <= this.visionRange) {
            // 检查是否在视野内
            if (this.isInVisionCone(player.position) && this.hasLineOfSight(player.position, map)) {
                this.target = player;
                this.state = 'chase';
                this.lastKnownPlayerPosition = player.position.clone();
                return;
            }
        }
        
        // 听觉检测
        if (distance <= this.hearingRange && player.velocity.magnitude() > 3) {
            this.target = player;
            this.state = 'chase';
            this.lastKnownPlayerPosition = player.position.clone();
            return;
        }
        
        // 如果失去目标，进入搜索状态
        if (this.state === 'chase' && (!this.target || distance > this.visionRange * 1.5)) {
            this.state = 'search';
            this.searchStartTime = Utils.now();
        }
    }
    
    // 检查是否在视野锥内
    isInVisionCone(targetPos) {
        const toTarget = targetPos.subtract(this.position);
        const angle = toTarget.getAngle();
        const enemyAngle = this.rotation;
        
        let angleDiff = Math.abs(angle - enemyAngle);
        if (angleDiff > Math.PI) {
            angleDiff = 2 * Math.PI - angleDiff;
        }
        
        return angleDiff <= this.visionAngle / 2;
    }
    
    // 检查是否有视线
    hasLineOfSight(targetPos, map) {
        // 简化的视线检测，实际应该检测墙壁遮挡
        // 这里假设没有遮挡
        return true;
    }
    
    // 巡逻行为
    patrol(deltaTime, map) {
        if (this.patrolPoints.length === 0) return;
        
        const targetPoint = this.patrolPoints[this.currentPatrolIndex];
        const distance = this.position.distance(targetPoint);
        
        if (distance < 20) {
            // 到达巡逻点，切换到下一个
            this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
        }
        
        // 移动向目标点
        const direction = targetPoint.subtract(this.position).normalize();
        this.velocity = direction.multiply(this.patrolSpeed);
        this.rotation = direction.getAngle();
        this.animationState = 'walking';
    }
    
    // 追击行为
    chase(player, deltaTime, map) {
        if (!player) return;
        
        const distance = this.position.distance(player.position);
        
        if (distance <= this.attackRange) {
            // 进入攻击范围
            this.state = 'attack';
            this.velocity.set(0, 0);
        } else {
            // 追击玩家
            const direction = player.position.subtract(this.position).normalize();
            this.velocity = direction.multiply(this.chaseSpeed);
            this.rotation = direction.getAngle();
            this.animationState = 'running';
        }
        
        // 尝试射击（如果有武器）
        if (this.weapon && distance <= this.weapon.bulletSpeed * 0.5) {
            this.tryShoot(player);
        }
    }
    
    // 攻击行为
    attack(player, deltaTime) {
        if (!player) return;
        
        const distance = this.position.distance(player.position);
        const now = Utils.now();
        
        if (distance > this.attackRange) {
            // 玩家离开攻击范围，回到追击状态
            this.state = 'chase';
            return;
        }
        
        // 面向玩家
        const direction = player.position.subtract(this.position).normalize();
        this.rotation = direction.getAngle();
        
        // 攻击冷却
        if (now - this.lastAttackTime < this.attackCooldown) {
            return;
        }
        
        // 执行攻击
        if (this.weapon) {
            const bullet = this.weapon.shoot(this.position, this.rotation);
            if (bullet) {
                // 创建子弹实体
                this.createBullet(bullet);
                this.lastAttackTime = now;
                this.animationState = 'attacking';
            }
        } else {
            // 近战攻击
            this.meleeAttack(player);
            this.lastAttackTime = now;
            this.animationState = 'attacking';
        }
    }
    
    // 搜索行为
    search(deltaTime, map) {
        const searchDuration = 10000; // 10秒搜索时间
        const elapsed = Utils.now() - this.searchStartTime;
        
        if (elapsed >= searchDuration) {
            // 搜索超时，回到巡逻状态
            this.state = 'patrol';
            return;
        }
        
        // 向最后已知位置移动
        if (this.lastKnownPlayerPosition) {
            const distance = this.position.distance(this.lastKnownPlayerPosition);
            if (distance > 30) {
                const direction = this.lastKnownPlayerPosition.subtract(this.position).normalize();
                this.velocity = direction.multiply(this.patrolSpeed);
                this.rotation = direction.getAngle();
                this.animationState = 'searching';
            } else {
                // 到达最后已知位置，随机搜索
                this.randomSearch();
            }
        }
    }
    
    // 随机搜索
    randomSearch() {
        const randomAngle = Utils.random(0, Math.PI * 2);
        const randomDistance = Utils.random(50, 100);
        const targetX = this.position.x + Math.cos(randomAngle) * randomDistance;
        const targetY = this.position.y + Math.sin(randomAngle) * randomDistance;
        
        const targetPoint = new Vector2D(targetX, targetY);
        const direction = targetPoint.subtract(this.position).normalize();
        this.velocity = direction.multiply(this.patrolSpeed * 0.5);
        this.rotation = direction.getAngle();
        this.animationState = 'searching';
    }
    
    // 尝试射击
    tryShoot(player) {
        if (!this.weapon) return;
        
        const distance = this.position.distance(player.position);
        const hitChance = Math.max(0.1, 1 - (distance / this.weapon.bulletSpeed));
        
        if (Utils.random(0, 1) < hitChance * 0.8) { // 80%基础命中率
            const bullet = this.weapon.shoot(this.position, this.rotation);
            if (bullet) {
                this.createBullet(bullet);
            }
        }
    }
    
    // 近战攻击
    meleeAttack(player) {
        if (this.position.distance(player.position) <= this.attackRange) {
            player.takeDamage(this.damage);
        }
    }
    
    // 创建子弹
    createBullet(bulletData) {
        // 这里应该将子弹添加到游戏世界的子弹列表中
        // 简化处理，由游戏主循环处理
        return bulletData;
    }
    
    // 应用群体行为
    applyGroupBehavior(otherEnemies) {
        if (!otherEnemies || otherEnemies.length === 0) return;
        
        let separationForce = new Vector2D(0, 0);
        let cohesionForce = new Vector2D(0, 0);
        let alignmentForce = new Vector2D(0, 0);
        
        let neighbors = 0;
        const neighborRadius = 100;
        
        for (const other of otherEnemies) {
            if (other === this || other.state === 'dead') continue;
            
            const distance = this.position.distance(other.position);
            
            if (distance < neighborRadius) {
                neighbors++;
                
                // 分离 - 避免过于拥挤
                if (distance < 50 && distance > 0) {
                    const diff = this.position.subtract(other.position).normalize().divide(distance);
                    separationForce = separationForce.add(diff);
                }
                
                // 聚合 - 向群体中心移动
                cohesionForce = cohesionForce.add(other.position);
                
                // 对齐 - 与邻居方向一致
                alignmentForce = alignmentForce.add(other.velocity);
            }
        }
        
        if (neighbors > 0) {
            // 应用分离力
            if (separationForce.magnitude() > 0) {
                separationForce = separationForce.normalize().multiply(2);
                this.velocity = this.velocity.add(separationForce);
            }
            
            // 应用聚合力
            cohesionForce = cohesionForce.divide(neighbors).subtract(this.position).normalize().multiply(0.1);
            this.velocity = this.velocity.add(cohesionForce);
            
            // 应用对齐力
            alignmentForce = alignmentForce.divide(neighbors).normalize().multiply(0.05);
            this.velocity = this.velocity.add(alignmentForce);
        }
    }
    
    // 更新物理
    updatePhysics(deltaTime, map) {
        // 应用速度
        this.position = this.position.add(this.velocity.multiply(deltaTime / 1000));
        
        // 应用摩擦力
        this.velocity = this.velocity.multiply(this.friction);
        
        // 边界检测
        if (map) {
            this.position.x = Utils.clamp(this.position.x, this.radius, map.width - this.radius);
            this.position.y = Utils.clamp(this.position.y, this.radius, map.height - this.radius);
        }
        
        // 限制最大速度
        if (this.velocity.magnitude() > this.chaseSpeed) {
            this.velocity = this.velocity.setMagnitude(this.chaseSpeed);
        }
    }
    
    // 受到伤害
    takeDamage(damage, attacker) {
        this.health = Math.max(0, this.health - damage);
        
        if (this.health <= 0) {
            this.die();
        } else {
            // 受伤反应
            if (this.state === 'patrol') {
                this.state = 'search';
                this.searchStartTime = Utils.now();
            }
        }
    }
    
    // 死亡
    die() {
        this.state = 'dead';
        this.velocity.set(0, 0);
        this.animationState = 'dead';
        
        // 掉落物品
        this.dropLoot();
    }
    
    // 掉落物品
    dropLoot() {
        // 这里可以生成掉落物品
        console.log(`Enemy ${this.type} dropped loot at ${this.position}`);
    }
    
    // 渲染敌人
    render(ctx, camera) {
        if (this.state === 'dead') return;
        
        const screenPos = camera.worldToScreen(this.position.x, this.position.y);
        const screenRadius = this.radius * camera.zoom;
        
        ctx.save();
        
        // 移动到敌人位置并旋转
        ctx.translate(screenPos.x, screenPos.y);
        ctx.rotate(this.rotation);
        
        // 根据状态选择颜色
        let color = '#ff4444'; // 默认红色
        switch (this.state) {
            case 'patrol':
                color = '#ffaa44'; // 橙色
                break;
            case 'chase':
                color = '#ff2222'; // 亮红色
                break;
            case 'attack':
                color = '#ff0000'; // 红色
                break;
            case 'search':
                color = '#ff8844'; // 深橙色
                break;
        }
        
        // 绘制敌人身体
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, screenRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制方向指示器
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(screenRadius * 0.6, -2, screenRadius * 0.7, 4);
        
        // 绘制武器
        if (this.weapon) {
            ctx.fillStyle = '#333333';
            ctx.fillRect(screenRadius * 0.8, -3, screenRadius, 6);
        }
        
        ctx.restore();
        
        // 绘制生命值条
        this.renderHealthBar(ctx, screenPos, screenRadius);
        
        // 绘制视野范围（调试用）
        if (GameConfig.DEBUG) {
            this.renderVisionCone(ctx, screenPos, camera.zoom);
        }
    }
    
    // 渲染生命值条
    renderHealthBar(ctx, screenPos, screenRadius) {
        const barWidth = screenRadius * 2;
        const barHeight = 4;
        const barY = screenPos.y - screenRadius - 10;
        
        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(screenPos.x - barWidth / 2, barY, barWidth, barHeight);
        
        // 生命值
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : 
                       healthPercent > 0.25 ? '#ffff00' : '#ff0000';
        ctx.fillRect(screenPos.x - barWidth / 2, barY, barWidth * healthPercent, barHeight);
    }
    
    // 渲染视野锥（调试用）
    renderVisionCone(ctx, screenPos, zoom) {
        const visionRadius = this.visionRange * zoom;
        
        ctx.save();
        ctx.translate(screenPos.x, screenPos.y);
        ctx.rotate(this.rotation);
        
        ctx.fillStyle = 'rgba(255, 255, 0, 0.1)';
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, visionRadius, -this.visionAngle / 2, this.visionAngle / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
    }
    
    // 获取敌人信息
    getInfo() {
        return {
            type: this.type,
            position: this.position,
            health: this.health,
            maxHealth: this.maxHealth,
            state: this.state,
            weapon: this.weapon ? this.weapon.type : null
        };
    }
}