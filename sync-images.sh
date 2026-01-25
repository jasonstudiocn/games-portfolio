#!/bin/bash

# 游戏图片同步脚本
# 将游戏项目中的PNG图片同步到portfolio images文件夹

echo "🖼️  游戏图片同步脚本"
echo "===================="
echo ""

# 检查原始游戏目录是否存在
if [ ! -d "../arena-breakout" ] || [ ! -d "../cat-runner-game" ] || [ ! -d "../minecraft-web" ]; then
    echo "❌ 错误：找不到原始游戏目录"
    echo "请确保脚本从正确的位置运行（games-portfolio目录）"
    exit 1
fi

echo "📸 开始同步游戏图片..."
echo ""

# 确保images目录存在
mkdir -p images

# 同步 arena-breakout 图片
echo "🔫 同步 暗区突围 图片..."
if [ -f "../arena-breakout/arena-breakout.png" ]; then
    cp ../arena-breakout/arena-breakout.png images/
    echo "   ✅ arena-breakout.png 同步成功"
else
    echo "   ⚠️  arena-breakout.png 不存在"
fi

# 同步 cat-runner-game 图片
echo "🐱 同步 猫咪快跑 图片..."
if [ -f "../cat-runner-game/cat-runner-game.png" ]; then
    cp ../cat-runner-game/cat-runner-game.png images/
    echo "   ✅ cat-runner-game.png 同步成功"
else
    echo "   ⚠️  cat-runner-game.png 不存在"
fi

# 同步 minecraft-web 图片
echo "🧱 同步 网页版我的世界 图片..."
if [ -f "../minecraft-web/minecraft-web.png" ]; then
    cp ../minecraft-web/minecraft-web.png images/
    echo "   ✅ minecraft-web.png 同步成功"
else
    echo "   ⚠️  minecraft-web.png 不存在"
fi

echo ""
echo "🧊 图片优化（可选）..."
# 如果有ImageMagick，可以压缩图片
if command -v convert &> /dev/null; then
    echo "   🔧 发现ImageMagick，开始优化图片..."
    for img in images/*.png; do
        if [ -f "$img" ]; then
            echo "   📦 优化 $(basename "$img")..."
            convert "$img" -quality 85 -strip "${img%.png}_optimized.png"
        fi
    done
else
    echo "   ℹ️  未找到ImageMagick，跳过优化"
fi

echo ""
echo "📊 同步完成！"
echo ""
echo "📂 图片统计："
echo "- 图片总数: $(find images -name "*.png" | wc -l)"
echo "- 总大小: $(du -sh images | cut -f1)"
echo ""
echo "📸 同步的图片："
for img in images/*.png; do
    if [ -f "$img" ]; then
        size=$(stat -f%z "$img" 2>/dev/null || stat -c%s "$img" 2>/dev/null)
        size_mb=$(echo "scale=2; $size / 1024 / 1024" | bc 2>/dev/null || echo "N/A")
        echo "- $(basename "$img") (${size_mb} MB)"
    fi
done

echo ""
echo "🎮 现在作品集将显示真实的游戏截图！"