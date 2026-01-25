// 主入口文件
document.addEventListener('DOMContentLoaded', function() {
    'use strict';
    
    // 检查浏览器兼容性
    if (!window.requestAnimationFrame) {
        alert('您的浏览器不支持此游戏所需的现代功能。请升级到最新版本的现代浏览器。');
        return;
    }
    
    // 创建游戏实例
    let game = null;
    
    try {
        game = new Game();
        
        // 添加错误处理
        window.addEventListener('error', function(event) {
            console.error('Game error:', event.error);
            
            // 显示错误信息
            const errorDiv = document.createElement('div');
            errorDiv.style.position = 'fixed';
            errorDiv.style.top = '50%';
            errorDiv.style.left = '50%';
            errorDiv.style.transform = 'translate(-50%, -50%)';
            errorDiv.style.background = 'rgba(255, 0, 0, 0.9)';
            errorDiv.style.color = 'white';
            errorDiv.style.padding = '20px';
            errorDiv.style.borderRadius = '10px';
            errorDiv.style.zIndex = '9999';
            const errorMessage = event.error ? event.error.message : '未知错误';
            errorDiv.innerHTML = `
                <h2>游戏错误</h2>
                <p>${errorMessage}</p>
                <button onclick="location.reload()" style="padding: 10px 20px; background: white; color: black; border: none; border-radius: 5px; cursor: pointer;">重新加载</button>
            `;
            document.body.appendChild(errorDiv);
        });
        
        // 添加性能监控
        let frameCount = 0;
        let lastTime = performance.now();
        let fps = 0;
        
        function updateFPS() {
            frameCount++;
            const currentTime = performance.now();
            const elapsed = currentTime - lastTime;
            
            if (elapsed >= 1000) {
                fps = Math.round((frameCount * 1000) / elapsed);
                frameCount = 0;
                lastTime = currentTime;
                
                // 显示FPS（可选，用于调试）
                if (GameConfig.DEBUG && game && game.ctx) {
                    game.ctx.save();
                    game.ctx.fillStyle = '#00ff00';
                    game.ctx.font = '16px Arial';
                    game.ctx.fillText(`FPS: ${fps}`, 10, 30);
                    game.ctx.restore();
                }
            }
            
            requestAnimationFrame(updateFPS);
        }
        
        // 启动FPS监控
        if (GameConfig.DEBUG) {
            updateFPS();
        }
        
        // 添加调试信息
        console.log('Game initialized successfully!');
        console.log('Canvas size:', game.canvas.width, 'x', game.canvas.height);
        console.log('Game state:', game.state);
        
    } catch (error) {
        console.error('Failed to initialize game:', error);
        alert('游戏初始化失败: ' + error.message);
    }
    
    // 暴露游戏实例给全局
    window.game = game;
    
    // 添加一些实用的全局函数
    window.gameUtils = {
        // 获取游戏实例
        getGame: function() {
            return game;
        },
        
        // 切换调试模式
        toggleDebug: function() {
            if (GameConfig) {
                GameConfig.DEBUG = !GameConfig.DEBUG;
                console.log('Debug mode:', GameConfig.DEBUG);
            }
        },
        
        // 显示游戏信息
        showGameInfo: function() {
            if (!game) return;
            
            const info = {
                state: game.state,
                playerHealth: game.player ? game.player.health : 'N/A',
                enemyCount: game.enemies.length,
                bulletCount: game.bullets.length,
                gameTime: game.gameTime,
                score: game.score
            };
            
            console.log('Game Info:', info);
            return info;
        },
        
        // 重置游戏
        resetGame: function() {
            if (game && game.state !== GameState.MENU) {
                game.returnToMenu();
            }
        }
    };
    
    // 添加键盘快捷键
    document.addEventListener('keydown', function(event) {
        // Ctrl+Shift+D: 切换调试模式
        if (event.ctrlKey && event.shiftKey && event.key === 'D') {
            window.gameUtils.toggleDebug();
        }
        
        // Ctrl+Shift+I: 显示游戏信息
        if (event.ctrlKey && event.shiftKey && event.key === 'I') {
            window.gameUtils.showGameInfo();
        }
        
        // Ctrl+Shift+R: 重置游戏
        if (event.ctrlKey && event.shiftKey && event.key === 'R') {
            window.gameUtils.resetGame();
        }
    });
    
    // 防止页面滚动
    document.addEventListener('wheel', function(event) {
        if (event.target === game.canvas || game.canvas.contains(event.target)) {
            event.preventDefault();
        }
    }, { passive: false });
    
    // 防止右键菜单
    document.addEventListener('contextmenu', function(event) {
        if (event.target === game.canvas || game.canvas.contains(event.target)) {
            event.preventDefault();
        }
    });
    
    // 处理页面可见性变化
    document.addEventListener('visibilitychange', function() {
        if (game) {
            if (document.hidden) {
                // 页面隐藏时暂停游戏
                if (game.state === GameState.PLAYING) {
                    game.state = GameState.PAUSED;
                }
            } else {
                // 页面显示时恢复游戏
                if (game.state === GameState.PAUSED) {
                    // 可以选择自动恢复或显示提示
                    console.log('Game resumed after page visibility change');
                }
            }
        }
    });
    
    // 处理窗口失去焦点
    window.addEventListener('blur', function() {
        if (game && game.state === GameState.PLAYING) {
            game.state = GameState.PAUSED;
        }
    });
    
    // 添加全屏支持
    const fullscreenButton = document.createElement('button');
    fullscreenButton.innerHTML = '⛶';
    fullscreenButton.style.position = 'fixed';
    fullscreenButton.style.top = '10px';
    fullscreenButton.style.right = '10px';
    fullscreenButton.style.width = '40px';
    fullscreenButton.style.height = '40px';
    fullscreenButton.style.border = 'none';
    fullscreenButton.style.borderRadius = '5px';
    fullscreenButton.style.background = 'rgba(0, 0, 0, 0.5)';
    fullscreenButton.style.color = 'white';
    fullscreenButton.style.fontSize = '20px';
    fullscreenButton.style.cursor = 'pointer';
    fullscreenButton.style.zIndex = '1000';
    fullscreenButton.style.display = 'none'; // 默认隐藏，游戏开始时显示
    
    fullscreenButton.addEventListener('click', function() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log('Error attempting to enable fullscreen:', err.message);
            });
            fullscreenButton.innerHTML = '⛶';
        } else {
            document.exitFullscreen();
            fullscreenButton.innerHTML = '⛶';
        }
    });
    
    document.body.appendChild(fullscreenButton);
    
    // 监听全屏状态变化
    document.addEventListener('fullscreenchange', function() {
        if (game && game.state === GameState.PLAYING) {
            fullscreenButton.style.display = 'block';
        } else {
            fullscreenButton.style.display = 'none';
        }
    });
    
    // 显示加载完成信息
    console.log('%c🎮 暗区突围 - 搜打撤射击游戏', 'font-size: 20px; color: #ff4444; font-weight: bold;');
    console.log('%c游戏已加载完成！', 'font-size: 16px; color: #44ff44;');
    console.log('%c快捷键:', 'font-size: 14px; color: #ffff00;');
    console.log('%c  Ctrl+Shift+D: 切换调试模式', 'font-size: 12px; color: #ffffff;');
    console.log('%c  Ctrl+Shift+I: 显示游戏信息', 'font-size: 12px; color: #ffffff;');
    console.log('%c  Ctrl+Shift+R: 重置游戏', 'font-size: 12px; color: #ffffff;');
    console.log('%c游戏开始！祝你好运，战士！🎯', 'font-size: 14px; color: #00ffff;');
});