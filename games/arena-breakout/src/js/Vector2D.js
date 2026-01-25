// 二维向量类
class Vector2D {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    
    // 向量加法
    add(vector) {
        return new Vector2D(this.x + vector.x, this.y + vector.y);
    }
    
    // 向量减法
    subtract(vector) {
        return new Vector2D(this.x - vector.x, this.y - vector.y);
    }
    
    // 向量数乘
    multiply(scalar) {
        return new Vector2D(this.x * scalar, this.y * scalar);
    }
    
    // 向量除法
    divide(scalar) {
        if (scalar !== 0) {
            return new Vector2D(this.x / scalar, this.y / scalar);
        }
        return new Vector2D(0, 0);
    }
    
    // 向量点积
    dot(vector) {
        return this.x * vector.x + this.y * vector.y;
    }
    
    // 向量叉积（2D）
    cross(vector) {
        return this.x * vector.y - this.y * vector.x;
    }
    
    // 向量长度
    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    
    // 向量长度的平方
    magnitudeSquared() {
        return this.x * this.x + this.y * this.y;
    }
    
    // 归一化向量
    normalize() {
        const mag = this.magnitude();
        if (mag > 0) {
            return new Vector2D(this.x / mag, this.y / mag);
        }
        return new Vector2D(0, 0);
    }
    
    // 设置向量长度
    setMagnitude(length) {
        return this.normalize().multiply(length);
    }
    
    // 限制向量长度
    limit(maxLength) {
        const mag = this.magnitude();
        if (mag > maxLength) {
            return this.setMagnitude(maxLength);
        }
        return new Vector2D(this.x, this.y);
    }
    
    // 向量旋转
    rotate(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Vector2D(
            this.x * cos - this.y * sin,
            this.x * sin + this.y * cos
        );
    }
    
    // 计算两向量夹角
    angleBetween(vector) {
        return Math.atan2(this.cross(vector), this.dot(vector));
    }
    
    // 计算到另一点的距离
    distance(vector) {
        return this.subtract(vector).magnitude();
    }
    
    // 线性插值到目标向量
    lerp(target, t) {
        return new Vector2D(
            this.x + (target.x - this.x) * t,
            this.y + (target.y - this.y) * t
        );
    }
    
    // 复制向量
    clone() {
        return new Vector2D(this.x, this.y);
    }
    
    // 设置向量值
    set(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }
    
    // 从另一个向量复制值
    copy(vector) {
        this.x = vector.x;
        this.y = vector.y;
        return this;
    }
    
    // 零向量
    zero() {
        this.x = 0;
        this.y = 0;
        return this;
    }
    
    // 检查是否为零向量
    isZero() {
        return this.x === 0 && this.y === 0;
    }
    
    // 检查是否等于另一个向量
    equals(vector, tolerance = 0.001) {
        return Math.abs(this.x - vector.x) < tolerance &&
               Math.abs(this.y - vector.y) < tolerance;
    }
    
    // 反转向量
    negate() {
        return new Vector2D(-this.x, -this.y);
    }
    
    // 垂直向量（顺时针旋转90度）
    perpendicular() {
        return new Vector2D(this.y, -this.x);
    }
    
    // 投影到另一个向量
    project(vector) {
        const normalized = vector.normalize();
        const dotProduct = this.dot(normalized);
        return normalized.multiply(dotProduct);
    }
    
    // 反射向量
    reflect(normal) {
        const normalizedNormal = normal.normalize();
        return this.subtract(normalizedNormal.multiply(2 * this.dot(normalizedNormal)));
    }
    
    // 转换为数组
    toArray() {
        return [this.x, this.y];
    }
    
    // 从数组创建向量
    static fromArray(array) {
        return new Vector2D(array[0] || 0, array[1] || 0);
    }
    
    // 从角度创建单位向量
    static fromAngle(angle) {
        return new Vector2D(Math.cos(angle), Math.sin(angle));
    }
    
    // 获取向量的角度
    getAngle() {
        return Math.atan2(this.y, this.x);
    }
    
    // 设置向量的角度
    setAngle(angle) {
        const magnitude = this.magnitude();
        this.x = Math.cos(angle) * magnitude;
        this.y = Math.sin(angle) * magnitude;
        return this;
    }
    
    // 字符串表示
    toString() {
        return `Vector2D(${this.x}, ${this.y})`;
    }
    
    // 静态方法：计算两点间的中点
    static midpoint(p1, p2) {
        return new Vector2D(
            (p1.x + p2.x) / 2,
            (p1.y + p2.y) / 2
        );
    }
    
    // 静态方法：随机向量
    static random(min = -1, max = 1) {
        return new Vector2D(
            Utils.random(min, max),
            Utils.random(min, max)
        );
    }
    
    // 静态方法：随机单位向量
    static randomUnit() {
        const angle = Utils.random(0, Math.PI * 2);
        return Vector2D.fromAngle(angle);
    }
}