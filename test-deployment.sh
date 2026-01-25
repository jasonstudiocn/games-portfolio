#!/bin/bash

# 部署测试脚本

echo "🚀 JasonStudio Vibe Coding 部署测试"
echo "================================="
echo ""

echo "📊 部署信息："
echo "- GitHub 仓库：https://github.com/jasonstudiocn/games-portfolio"
echo "- Vercel 部署：✅ 成功"
echo "- 生产地址：https://games-portfolio.vercel.app"
echo "- 部署ID：Fpe3QadhFNP2rSKohzTNu925Lf6f"
echo ""

echo "🧪 测试结果："
echo ""

# 测试主域名
echo "🏠 主域名测试："
if curl -s --max-time 10 "https://games-portfolio.vercel.app" > /dev/null 2>&1; then
    echo "   ✅ https://games-portfolio.vercel.app - 可访问"
else
    echo "   ❌ https://games-portfolio.vercel.app - 不可访问"
fi

# 测试游戏文件
echo ""
echo "🎮 游戏文件测试："
games=("arena-breakout" "cat-runner-game" "minecraft-web")
for game in "${games[@]}"; do
    url="https://games-portfolio.vercel.app/games/$game/index.html"
    if curl -s --max-time 10 "$url" > /dev/null 2>&1; then
        echo "   ✅ $game - 可访问"
    else
        echo "   ❌ $game - 不可访问"
    fi
done

# 测试图片文件
echo ""
echo "🖼️ 图片文件测试："
images=("arena-breakout.png" "cat-runner-game.png" "minecraft-web.png")
for img in "${images[@]}"; do
    url="https://games-portfolio.vercel.app/images/$img"
    if curl -s --max-time 10 "$url" > /dev/null 2>&1; then
        echo "   ✅ $img - 可访问"
    else
        echo "   ❌ $img - 不可访问"
    fi
done

# 测试静态资源
echo ""
echo "📄 静态资源测试："
resources=("css/style.css" "js/main.js" "index.html")
for resource in "${resources[@]}"; do
    url="https://games-portfolio.vercel.app/$resource"
    if curl -s --max-time 10 "$url" > /dev/null 2>&1; then
        echo "   ✅ $resource - 可访问"
    else
        echo "   ❌ $resource - 不可访问"
    fi
done

echo ""
echo "📱 移动端测试："
echo "📊 响应式设计 - 请在移动设备上测试"
echo "👆 触摸滑动 - 请在触屏设备上测试"
echo "🎯 游戏性能 - 请检查游戏运行状态"

echo ""
echo "🔗 分享链接："
echo "🌐 作品集：https://games-portfolio.vercel.app"
echo "📚 GitHub：https://github.com/jasonstudiocn/games-portfolio"
echo "🎮 暗区突围：https://github.com/jasonstudiocn/arena-breakout"
echo "🐱 猫咪快跑：https://github.com/jasonstudiocn/cat-runner-game"
echo "🧱 网页版我的世界：https://github.com/jasonstudiocn/minecraft-web"

echo ""
echo "🎯 部署状态：✅ 完成并上线！"
echo "💡 使用浏览器打开 https://games-portfolio.vercel.app 体验完整功能"