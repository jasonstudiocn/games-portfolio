// 相机类
class Camera {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.position = new Vector2D(0, 0);
        this.target = null;
        this.smoothness = 0.1;
        this.bounds = null;
        this.zoom = 1.0;
        this.rotation = 0;
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.shakeOffset = new Vector2D(0, 0);
    }
    
    // 更新相机位置
    update() {
        // 如果有固定位置，保持在中心
        if (this.fixedPosition) {
            this.position.x = this.fixedPosition.x;
            this.position.y = this.fixedPosition.y;
        } else if (this.target) {
            // 跟随目标（小地图模式）
            const targetX = this.target.x - this.width / 2;
            const targetY = this.target.y - this.height / 2;
            
            // 平滑跟随
            this.position.x += (targetX - this.position.x) * this.smoothness;
            this.position.y += (targetY - this.position.y) * this.smoothness;
        }
        
        // 应用边界限制
        if (this.bounds) {
            this.position.x = Utils.clamp(this.position.x, this.bounds.left, this.bounds.right);
            this.position.y = Utils.clamp(this.position.y, this.bounds.top, this.bounds.bottom);
        }
        
        // 更新屏幕震动
        this.updateShake();
    }
    
    // 设置为跟随模式（小地图）
    setFollowMode(target) {
        this.fixedPosition = null;
        this.target = target;
        this.smoothness = 0.1;
        
        // 重新设置边界
        if (target && this.lastMapBounds) {
            this.setBounds(this.lastMapBounds.left, this.lastMapBounds.top, 
                          this.lastMapBounds.right, this.lastMapBounds.bottom);
        }
    }
    
    // 设置为固定模式（大地图居中）
    setFixedMode(centerX, centerY, mapBounds) {
        this.target = null;
        this.fixedPosition = new Vector2D(centerX, centerY);
        this.lastMapBounds = mapBounds;
        this.smoothness = 0;
    }
    
    // 设置跟随目标
    setTarget(target) {
        this.target = target;
    }
    
    // 设置相机边界
    setBounds(left, top, right, bottom) {
        // 确保地图始终居中显示
        const mapWidth = right - left;
        const mapHeight = bottom - top;
        
        // 如果地图比屏幕小，完全居中
        if (mapWidth <= this.width) {
            const offsetX = (this.width - mapWidth) / 2;
            this.bounds = {
                left: -offsetX,
                top: top,
                right: mapWidth + offsetX,
                bottom: bottom
            };
        } else if (mapHeight <= this.height) {
            const offsetY = (this.height - mapHeight) / 2;
            this.bounds = {
                left: left,
                top: -offsetY,
                right: right,
                bottom: mapHeight + offsetY
            };
        } else {
            // 地图比屏幕大，正常边界
            this.bounds = {
                left: left,
                top: top,
                right: right - this.width,
                bottom: bottom - this.height
            };
        }
    }
    
    // 设置固定边界（地图始终居中）
    setFixedBounds(centerX, centerY) {
        // 固定在中心位置，不跟随任何目标
        this.fixedPosition = new Vector2D(centerX, centerY);
        this.bounds = null; // 取消边界限制
    }
    
    // 设置为跟随模式（小地图）
    setFollowMode(target) {
        this.fixedPosition = null;
        this.target = target;
        this.smoothness = 0.1;
        
        // 重新设置边界适应小地图
        if (this.lastMapBounds) {
            const mapWidth = this.lastMapBounds.right - this.lastMapBounds.left;
            const mapHeight = this.lastMapBounds.bottom - this.lastMapBounds.top;
            const screenMargin = 100; // 为小地图留边距
            
            this.bounds = {
                left: -screenMargin,
                top: -screenMargin,
                right: mapWidth + screenMargin,
                bottom: mapHeight + screenMargin
            };
        }
    }
    
    // 设置为固定模式（大地图居中）
    setFixedMode(centerX, centerY, mapBounds) {
        this.target = null;
        this.fixedPosition = new Vector2D(centerX, centerY);
        this.lastMapBounds = mapBounds;
        this.smoothness = 0;
    }
    
    // 设置相机位置
    setPosition(x, y) {
        this.position.x = x;
        this.position.y = y;
    }
    
    // 世界坐标转屏幕坐标
    worldToScreen(worldX, worldY) {
        const screenX = (worldX - this.position.x + this.shakeOffset.x) * this.zoom;
        const screenY = (worldY - this.position.y + this.shakeOffset.y) * this.zoom;
        return new Vector2D(screenX, screenY);
    }
    
    // 屏幕坐标转世界坐标
    screenToWorld(screenX, screenY) {
        const worldX = (screenX / this.zoom) + this.position.x - this.shakeOffset.x;
        const worldY = (screenY / this.zoom) + this.position.y - this.shakeOffset.y;
        return new Vector2D(worldX, worldY);
    }
    
    // 获取相机视野范围
    getViewBounds() {
        return {
            left: this.position.x,
            top: this.position.y,
            right: this.position.x + this.width,
            bottom: this.position.y + this.height
        };
    }
    
    // 检查物体是否在视野内
    isInView(x, y, width, height) {
        const bounds = this.getViewBounds();
        return x + width >= bounds.left &&
               x <= bounds.right &&
               y + height >= bounds.top &&
               y <= bounds.bottom;
    }
    
    // 设置缩放
    setZoom(zoom) {
        this.zoom = Utils.clamp(zoom, 0.1, 5.0);
    }
    
    // 设置旋转角度
    setRotation(angle) {
        this.rotation = angle;
    }
    
    // 开始屏幕震动
    shake(intensity = 5, duration = 500) {
        this.shakeIntensity = intensity;
        this.shakeDuration = duration;
    }
    
    // 更新屏幕震动
    updateShake() {
        if (this.shakeDuration > 0) {
            this.shakeDuration -= 16; // 假设60FPS，每帧约16ms
            
            if (this.shakeDuration > 0) {
                const shakeX = Utils.random(-this.shakeIntensity, this.shakeIntensity);
                const shakeY = Utils.random(-this.shakeIntensity, this.shakeIntensity);
                this.shakeOffset.set(shakeX, shakeY);
            } else {
                this.shakeOffset.set(0, 0);
                this.shakeIntensity = 0;
            }
        }
    }
    
    // 设置平滑跟随系数
    setSmoothness(smoothness) {
        this.smoothness = Utils.clamp(smoothness, 0.01, 1.0);
    }
    
    // 立即移动到目标位置
    snapToTarget() {
        if (this.target) {
            this.position.x = this.target.x - this.width / 2;
            this.position.y = this.target.y - this.height / 2;
        }
    }
    
    // 重置相机
    reset() {
        this.position.set(0, 0);
        this.target = null;
        this.zoom = 1.0;
        this.rotation = 0;
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.shakeOffset.set(0, 0);
        this.bounds = null;
    }
    
    // 获取变换矩阵（用于Canvas 2D上下文）
    getTransformMatrix() {
        const matrix = new DOMMatrix();
        
        // 应用缩放
        matrix.translateSelf(this.width / 2, this.height / 2);
        matrix.scaleSelf(this.zoom, this.zoom);
        matrix.rotateSelf(this.rotation * 180 / Math.PI);
        
        // 应用平移
        matrix.translateSelf(-this.position.x - this.shakeOffset.x, -this.position.y - this.shakeOffset.y);
        
        return matrix;
    }
    
    // 应用相机变换到Canvas上下文
    applyTransform(ctx) {
        ctx.save();
        
        // 屏幕震动效果
        if (this.shakeDuration > 0) {
            ctx.translate(this.shakeOffset.x, this.shakeOffset.y);
        }
        
        // 缩放和平移
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-this.position.x, -this.position.y);
        
        // 旋转
        if (this.rotation !== 0) {
            const centerX = this.position.x + this.width / (2 * this.zoom);
            const centerY = this.position.y + this.height / (2 * this.zoom);
            ctx.translate(centerX, centerY);
            ctx.rotate(this.rotation);
            ctx.translate(-centerX, -centerY);
        }
    }
    
    // 恢复Canvas上下文
    restoreTransform(ctx) {
        ctx.restore();
    }
    
    // 获取视口信息
    getViewport() {
        return {
            x: this.position.x,
            y: this.position.y,
            width: this.width,
            height: this.height,
            zoom: this.zoom,
            rotation: this.rotation
        };
    }
    
    // 设置视口大小
    setViewport(width, height) {
        this.width = width;
        this.height = height;
    }
    
    // 设置canvas引用
    setCanvas(canvas) {
        this.canvas = canvas;
    }
    
    // 平移相机
    pan(dx, dy) {
        this.position.x += dx;
        this.position.y += dy;
        
        if (this.bounds) {
            this.position.x = Utils.clamp(this.position.x, this.bounds.left, this.bounds.right);
            this.position.y = Utils.clamp(this.position.y, this.bounds.top, this.bounds.bottom);
        }
    }
    
    // 缩放到指定点
    zoomAt(zoomLevel, centerX, centerY) {
        const oldZoom = this.zoom;
        const newZoom = Utils.clamp(zoomLevel, 0.1, 5.0);
        const zoomRatio = newZoom / oldZoom;
        
        // 计算缩放后需要调整的位置
        const worldBefore = this.screenToWorld(centerX, centerY);
        this.zoom = newZoom;
        const worldAfter = this.screenToWorld(centerX, centerY);
        
        // 调整位置以保持缩放中心点不变
        const adjustment = worldBefore.subtract(worldAfter);
        this.position = this.position.add(adjustment);
    }
}