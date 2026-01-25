#!/bin/bash

# JasonStudio Vibe Coding 启动脚本

echo "🎮 启动 JasonStudio Vibe Coding..."
echo "=================================="

# 检查Python是否可用
if command -v python3 &> /dev/null; then
    echo "📡 启动本地服务器..."
    echo "🌐 JasonStudio Vibe Coding 地址: http://localhost:8000"
    echo "🔗 可直接访问: http://localhost:8000"
    echo ""
    echo "💡 提示:"
    echo "   - Ctrl+1/2/3 快速打开游戏（本地文件）"
    echo "   - Ctrl+Shift+1/2/3 快速打开GitHub仓库"
    echo "   - 支持移动端触摸滑动"
    echo "   - 游戏文件已复制到本地，无需外部依赖"
    echo "   - 按 Ctrl+C 停止服务器"
    echo ""
    
    # 进入项目目录并启动服务器
    cd games-portfolio
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    echo "📡 启动本地服务器..."
    echo "🌐 游戏作品集地址: http://localhost:8000"
    echo ""
    
    cd games-portfolio
    python -m http.server 8000
else
    echo "❌ 未找到Python，请手动在浏览器中打开:"
    echo "   file://$(pwd)/games-portfolio/index.html"
    echo ""
    echo "💡 建议安装Python以获得更好的体验"
fi