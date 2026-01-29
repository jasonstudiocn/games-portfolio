// 游戏页面交互功能
document.addEventListener('DOMContentLoaded', function() {
    // 平滑滚动到锚点
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const offsetTop = targetElement.offsetTop - 100; // 考虑固定header的高度
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // 图片容器点击事件（可选，如果需要点击图片也可以进入游戏）
    const gameImageContainers = document.querySelectorAll('.game-image-container');
    gameImageContainers.forEach(container => {
        container.addEventListener('click', function() {
            const gameSection = this.closest('.game-section');
            const gameId = gameSection.id;
            navigateToGame(getGamePath(gameId));
        });
    });

    // 滚动动画
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // 观察所有游戏section
    const gameSections = document.querySelectorAll('.game-section');
    gameSections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });

    // 高亮当前导航项
    window.addEventListener('scroll', function() {
        const sections = document.querySelectorAll('.game-section');
        const navLinks = document.querySelectorAll('.nav-link');
        
        let currentSection = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 150;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= sectionTop && pageYOffset < sectionTop + sectionHeight) {
                currentSection = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + currentSection) {
                link.classList.add('active');
            }
        });
    });
});

// 打开游戏函数（现在改为直接导航）
function openGame(gamePath) {
    // 检查游戏路径是否存在
    const gameUrl = `${gamePath}/index.html`;
    
    // 创建一个临时链接来检查文件是否存在
    fetch(gameUrl, { method: 'HEAD' })
        .then(response => {
            if (response.ok) {
                // 在当前页面直接打开游戏
                window.location.href = gameUrl;
            } else {
                showNotification('游戏文件暂时无法访问，请检查文件路径', 'error');
            }
        })
        .catch(error => {
            console.error('Error accessing game:', error);
            showNotification('游戏文件暂时无法访问', 'error');
        });
}

// 直接导航到游戏（备用函数）
function navigateToGame(gamePath) {
    window.location.href = `${gamePath}/index.html`;
}

// 打开GitHub页面函数
function openGithub(folderName) {
    const githubUrl = `https://github.com/jasonstudiocn/${folderName}`;
    
    // 在新窗口中打开GitHub页面
    const githubWindow = window.open(githubUrl, '_blank');
    if (!githubWindow) {
        // 如果弹出窗口被阻止，则显示提示
        showNotification('GitHub页面已在新标签页中打开，请检查浏览器标签页');
    }
    
    console.log(`Opening GitHub repository: ${githubUrl}`);
}

// 根据游戏ID获取游戏路径
function getGamePath(gameId) {
    const pathMap = {
        'arena-breakout': 'arena-breakout',
        'cat-runner': 'cat-runner-game',
        'minecraft-web': 'minecraft-web',
        'tank-shooting-game': 'tank-shooting-game',
        'raiden-shooting-game': 'raiden-shooting-game'
    };
    return pathMap[gameId] || gameId;
}

// 显示通知函数
function showNotification(message, type = 'success') {
    // 移除已存在的通知
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // 添加样式
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#ff4757'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        opacity: 0;
        transform: translateX(100%);
        transition: opacity 0.3s ease, transform 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
    `;

    // 添加到页面
    document.body.appendChild(notification);

    // 显示动画
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);

    // 3秒后自动隐藏
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// 添加键盘快捷键支持
document.addEventListener('keydown', function(e) {
    // 按 Ctrl/Cmd + 1/2/3/4/5 快速打开对应游戏
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case '1':
                e.preventDefault();
                navigateToGame('games/arena-breakout');
                break;
            case '2':
                e.preventDefault();
                navigateToGame('games/cat-runner-game');
                break;
            case '3':
                e.preventDefault();
                navigateToGame('games/minecraft-web');
                break;
            case '4':
                e.preventDefault();
                navigateToGame('games/tank-shooting-game');
                break;
            case '5':
                e.preventDefault();
                navigateToGame('games/raiden-shooting-game');
                break;
        }
    }
    
    // 按 Ctrl/Cmd + Shift + 1/2/3/4/5 快速打开对应GitHub页面
    if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
        switch(e.key) {
            case '1':
                e.preventDefault();
                openGithub('arena-breakout');
                break;
            case '2':
                e.preventDefault();
                openGithub('cat-runner-game');
                break;
            case '3':
                e.preventDefault();
                openGithub('minecraft-web');
                break;
            case '4':
                e.preventDefault();
                openGithub('tank-shooting-game');
                break;
            case '5':
                e.preventDefault();
                openGithub('raiden-shooting-game');
                break;
        }
    }
});

// 添加触摸支持（移动端）
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', function(e) {
    touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener('touchend', function(e) {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
});

function handleSwipe() {
    const swipeThreshold = 100;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > swipeThreshold) {
        const sections = Array.from(document.querySelectorAll('.game-section'));
        const currentSection = sections.find(section => {
            const sectionTop = section.offsetTop - 150;
            const sectionHeight = section.clientHeight;
            return pageYOffset >= sectionTop && pageYOffset < sectionTop + sectionHeight;
        });
        
        if (currentSection) {
            const currentIndex = sections.indexOf(currentSection);
            let targetIndex;
            
            if (diff > 0 && currentIndex < sections.length - 1) {
                // 向左滑动，下一个section
                targetIndex = currentIndex + 1;
            } else if (diff < 0 && currentIndex > 0) {
                // 向右滑动，上一个section
                targetIndex = currentIndex - 1;
            }
            
            if (targetIndex !== undefined) {
                const targetSection = sections[targetIndex];
                const offsetTop = targetSection.offsetTop - 100;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        }
    }
}