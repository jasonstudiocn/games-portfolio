#!/bin/bash

# 游戏文件同步脚本
# 将原始游戏文件同步到作品集的games文件夹

echo "🔄 游戏文件同步脚本"
echo "=================="
echo ""

# 检查原始游戏目录是否存在
if [ ! -d "../arena-breakout" ] || [ ! -d "../cat-runner-game" ] || [ ! -d "../minecraft-web" ]; then
    echo "❌ 错误：找不到原始游戏目录"
    echo "请确保脚本从正确的位置运行（games-portfolio目录）"
    exit 1
fi

echo "📦 开始同步游戏文件..."
echo ""

# 同步 arena-breakout
echo "🔫 同步 暗区突围..."
rm -rf games/arena-breakout/*
mkdir -p games/arena-breakout
cp -r ../arena-breakout/index.html ../arena-breakout/src games/arena-breakout/
if [ $? -eq 0 ]; then
    echo "   ✅ 暗区突围 同步成功"
else
    echo "   ❌ 暗区突围 同步失败"
fi

# 同步 cat-runner-game
echo "🐱 同步 猫咪快跑..."
rm -rf games/cat-runner-game/*
mkdir -p games/cat-runner-game
cp -r ../cat-runner-game/index.html ../cat-runner-game/css ../cat-runner-game/js games/cat-runner-game/
if [ $? -eq 0 ]; then
    echo "   ✅ 猫咪快跑 同步成功"
else
    echo "   ❌ 猫咪快跑 同步失败"
fi

# 同步 minecraft-web
echo "🧱 同步 网页版我的世界..."
rm -rf games/minecraft-web/*
mkdir -p games/minecraft-web
cp ../minecraft-web/index.html ../minecraft-web/game.js ../minecraft-web/textures.js games/minecraft-web/
if [ $? -eq 0 ]; then
    echo "   ✅ 网页版我的世界 同步成功"
else
    echo "   ❌ 网页版我的世界 同步失败"
fi

echo ""
echo "🧹 清理临时文件..."
find games/ -name ".DS_Store" -delete
find games/ -name "*.backup" -delete
find games/ -name "*.bak" -delete

echo ""
echo "📊 同步完成！"
echo ""
echo "📂 文件统计："
echo "- 暗区突围: $(find games/arena-breakout -type f | wc -l) 个文件"
echo "- 猫咪快跑: $(find games/cat-runner-game -type f | wc -l) 个文件"
echo "- 网页版我的世界: $(find games/minecraft-web -type f | wc -l) 个文件"
echo ""
echo "🎮 现在可以测试作品集中的游戏链接了！"