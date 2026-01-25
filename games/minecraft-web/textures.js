# 方块纹理生成器
class BlockTextureGenerator {
    static generateGrassTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // 草地绿色渐变
        const gradient = ctx.createLinearGradient(0, 0, 64, 64);
        gradient.addColorStop(0, '#7CFC00');
        gradient.addColorStop(0.5, '#90EE90');
        gradient.addColorStop(1, '#228B22');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
        
        // 添加草地纹理细节
        ctx.strokeStyle = '#228B22';
        ctx.lineWidth = 1;
        for (let i = 0; i < 20; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random() * 64, Math.random() * 64);
            ctx.lineTo(Math.random() * 64, Math.random() * 64);
            ctx.stroke();
        }
        
        return new THREE.CanvasTexture(canvas);
    }
    
    static generateStoneTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // 石头灰色基础
        ctx.fillStyle = '#8B8682';
        ctx.fillRect(0, 0, 64, 64);
        
        // 添加石头纹理细节
        ctx.fillStyle = '#696969';
        for (let i = 0; i < 15; i++) {
            const x = Math.random() * 64;
            const y = Math.random() * 64;
            const size = Math.random() * 8 + 2;
            ctx.fillRect(x, y, size, size);
        }
        
        ctx.fillStyle = '#A9A9A9';
        for (let i = 0; i < 10; i++) {
            const x = Math.random() * 64;
            const y = Math.random() * 64;
            const size = Math.random() * 6 + 1;
            ctx.fillRect(x, y, size, size);
        }
        
        return new THREE.CanvasTexture(canvas);
    }
    
    static generateWoodTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // 木头棕色基础
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(0, 0, 64, 64);
        
        // 添加木纹
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            ctx.beginPath();
            ctx.moveTo(0, i * 8);
            ctx.lineTo(64, i * 8 + Math.random() * 4 - 2);
            ctx.stroke();
        }
        
        // 添加 knot 纹理
        ctx.fillStyle = '#4B2F20';
        ctx.beginPath();
        ctx.arc(32, 32, 8, 0, Math.PI * 2);
        ctx.fill();
        
        return new THREE.CanvasTexture(canvas);
    }
    
    static generateDirtTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // 泥土褐色基础
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(0, 0, 64, 64);
        
        // 添加泥土颗粒
        ctx.fillStyle = '#654321';
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * 64;
            const y = Math.random() * 64;
            const size = Math.random() * 3 + 1;
            ctx.fillRect(x, y, size, size);
        }
        
        return new THREE.CanvasTexture(canvas);
    }
    
    static generateLeavesTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // 树叶绿色基础
        ctx.fillStyle = '#228B22';
        ctx.fillRect(0, 0, 64, 64);
        
        // 添加树叶纹理
        ctx.fillStyle = '#32CD32';
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * 64;
            const y = Math.random() * 64;
            ctx.beginPath();
            ctx.arc(x, y, Math.random() * 4 + 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 添加叶脉
        ctx.strokeStyle = '#006400';
        ctx.lineWidth = 1;
        for (let i = 0; i < 10; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random() * 64, Math.random() * 64);
            ctx.lineTo(Math.random() * 64, Math.random() * 64);
            ctx.stroke();
        }
        
        return new THREE.CanvasTexture(canvas);
    }
    
    static generateSandTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // 沙子浅棕基础
        ctx.fillStyle = '#F4A460';
        ctx.fillRect(0, 0, 64, 64);
        
        // 添加沙粒
        ctx.fillStyle = '#DEB887';
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * 64;
            const y = Math.random() * 64;
            ctx.beginPath();
            ctx.arc(x, y, Math.random() * 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        return new THREE.CanvasTexture(canvas);
    }
    
    static generateCobblestoneTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // 圆石灰色基础
        ctx.fillStyle = '#696969';
        ctx.fillRect(0, 0, 64, 64);
        
        // 添加圆石纹理
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                ctx.fillStyle = Math.random() > 0.5 ? '#696969' : '#808080';
                ctx.fillRect(i * 8, j * 8, 8, 8);
                
                ctx.strokeStyle = '#404040';
                ctx.lineWidth = 1;
                ctx.strokeRect(i * 8, j * 8, 8, 8);
            }
        }
        
        return new THREE.CanvasTexture(canvas);
    }
    
    static generateBrickTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // 砖块红色基础
        ctx.fillStyle = '#B22222';
        ctx.fillRect(0, 0, 64, 64);
        
        // 添加砖块纹理
        ctx.strokeStyle = '#8B0000';
        ctx.lineWidth = 2;
        
        // 横线
        for (let i = 1; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(0, i * 16);
            ctx.lineTo(64, i * 16);
            ctx.stroke();
        }
        
        // 竖线（错位排列）
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                const x = i * 16 + (j % 2 === 0 ? 0 : 8);
                if (x < 64) {
                    ctx.beginPath();
                    ctx.moveTo(x, j * 16);
                    ctx.lineTo(x, (j + 1) * 16);
                    ctx.stroke();
                }
            }
        }
        
        return new THREE.CanvasTexture(canvas);
    }
    
    static generateGoldTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // 金块金色基础
        const gradient = ctx.createLinearGradient(0, 0, 64, 64);
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(0.5, '#FFA500');
        gradient.addColorStop(1, '#FFD700');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
        
        // 添加金属光泽
        ctx.strokeStyle = '#FFFF00';
        ctx.lineWidth = 1;
        for (let i = 0; i < 10; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random() * 64, 0);
            ctx.lineTo(Math.random() * 64, 64);
            ctx.stroke();
        }
        
        return new THREE.CanvasTexture(canvas);
    }
}