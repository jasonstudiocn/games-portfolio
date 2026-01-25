// 预览图片生成器（可选功能）
// 可以用于生成游戏预览图，目前使用CSS渐变背景

const gamePreviews = {
    'arena-breakout': {
        title: '暗区突围',
        gradient: 'linear-gradient(135deg, #ff6b6b, #4ecdc4)',
        icon: '🔫',
        description: '战术射击游戏'
    },
    'cat-runner': {
        title: '猫咪快跑',
        gradient: 'linear-gradient(135deg, #f093fb, #f5576c)',
        icon: '🐱',
        description: '横版跑酷游戏'
    },
    'minecraft-web': {
        title: '网页版我的世界',
        gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)',
        icon: '🧱',
        description: '3D沙盒游戏'
    }
};

// 如果需要生成实际的预览图，可以使用这个函数
function generatePreviewImage(gameData) {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    
    // 创建渐变背景
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 添加游戏标题
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(gameData.title, canvas.width / 2, canvas.height / 2 - 50);
    
    // 添加游戏图标
    ctx.font = '120px Arial';
    ctx.fillText(gameData.icon, canvas.width / 2, canvas.height / 2 + 30);
    
    // 添加游戏描述
    ctx.font = '24px Arial';
    ctx.fillText(gameData.description, canvas.width / 2, canvas.height / 2 + 100);
    
    return canvas.toDataURL();
}

console.log('Game previews:', gamePreviews);