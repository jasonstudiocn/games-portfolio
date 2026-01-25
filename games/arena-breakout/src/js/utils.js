// 工具函数库
class Utils {
    // 计算两点间距离
    static distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    // 计算两点间角度
    static angle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    }
    
    // 角度转弧度
    static degToRad(degrees) {
        return degrees * (Math.PI / 180);
    }
    
    // 弧度转角度
    static radToDeg(radians) {
        return radians * (180 / Math.PI);
    }
    
    // 限制值在指定范围内
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    
    // 线性插值
    static lerp(start, end, t) {
        return start + (end - start) * t;
    }
    
    // 生成随机数
    static random(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    // 生成随机整数
    static randomInt(min, max) {
        return Math.floor(Utils.random(min, max + 1));
    }
    
    // 检测圆形碰撞
    static circleCollision(x1, y1, r1, x2, y2, r2) {
        const distance = this.distance(x1, y1, x2, y2);
        return distance < r1 + r2;
    }
    
    // 检测矩形碰撞
    static rectCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    // 检测点是否在圆内
    static pointInCircle(px, py, cx, cy, radius) {
        return this.distance(px, py, cx, cy) < radius;
    }
    
    // 检测点是否在矩形内
    static pointInRect(px, py, rect) {
        return px >= rect.x && px <= rect.x + rect.width &&
               py >= rect.y && py <= rect.y + rect.height;
    }
    
    // 格式化时间
    static formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    // 深拷贝对象
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = this.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    }
    
    // 防抖函数
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // 节流函数
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    // 创建颜色字符串
    static rgba(r, g, b, a = 1) {
        return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
    
    // 创建HSL颜色字符串
    static hsl(h, s, l, a = 1) {
        return `hsla(${h}, ${s}%, ${l}%, ${a})`;
    }
    
    // 获取时间戳
    static now() {
        return Date.now();
    }
    
    // 规范化角度（0-360度）
    static normalizeAngle(angle) {
        while (angle < 0) angle += 360;
        while (angle >= 360) angle -= 360;
        return angle;
    }
    
    // 计算最短角度差
    static angleDifference(angle1, angle2) {
        const diff = ((angle2 - angle1 + 180) % 360) - 180;
        return diff < -180 ? diff + 360 : diff;
    }
    
    // 混合两种颜色
    static mixColors(color1, color2, ratio = 0.5) {
        const c1 = this.hexToRgb(color1);
        const c2 = this.hexToRgb(color2);
        
        const r = Math.round(this.lerp(c1.r, c2.r, ratio));
        const g = Math.round(this.lerp(c1.g, c2.g, ratio));
        const b = Math.round(this.lerp(c1.b, c2.b, ratio));
        
        return this.rgbToHex(r, g, b);
    }
    
    // 十六进制颜色转RGB
    static hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
    
    // RGB转十六进制颜色
    static rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
    
    // 生成UUID
    static generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}