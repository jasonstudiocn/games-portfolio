#!/bin/bash

# 游戏文件验证脚本

echo "🔍 游戏文件完整性检查"
echo "===================="
echo ""

# 检查游戏文件
games=("arena-breakout" "cat-runner-game" "minecraft-web")
required_files=("index.html")

for game in "${games[@]}"; do
    echo "🎮 检查 $game:"
    
    # 检查目录是否存在
    if [ ! -d "games/$game" ]; then
        echo "   ❌ 目录不存在"
        continue
    fi
    
    # 检查必要文件
    all_files_exist=true
    for file in "${required_files[@]}"; do
        if [ ! -f "games/$game/$file" ]; then
            echo "   ❌ 缺少文件: $file"
            all_files_exist=false
        fi
    done
    
    # 检查特定游戏的额外文件
    case $game in
        "arena-breakout")
            if [ ! -d "games/$game/src" ]; then
                echo "   ❌ 缺少 src 目录"
                all_files_exist=false
            fi
            if [ ! -f "games/$game/src/js/main.js" ]; then
                echo "   ❌ 缺少 main.js"
                all_files_exist=false
            fi
            ;;
        "cat-runner-game")
            if [ ! -d "games/$game/css" ] || [ ! -d "games/$game/js" ]; then
                echo "   ❌ 缺少 css 或 js 目录"
                all_files_exist=false
            fi
            ;;
        "minecraft-web")
            if [ ! -f "games/$game/game.js" ] || [ ! -f "games/$game/textures.js" ]; then
                echo "   ❌ 缺少 game.js 或 textures.js"
                all_files_exist=false
            fi
            ;;
    esac
    
    if [ "$all_files_exist" = true ]; then
        echo "   ✅ 所有必要文件存在"
    fi
    
    # 统计文件数量
    file_count=$(find "games/$game" -type f | wc -l)
    echo "   📊 文件总数: $file_count"
    echo ""
done

# 检查主页面文件
echo "🏠 检查主页面文件:"
main_files=("index.html" "css/style.css" "js/main.js" "README.md")
for file in "${main_files[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✅ $file 存在"
    else
        echo "   ❌ $file 缺少"
    fi
done

echo ""
echo "🔗 检查脚本文件:"
script_files=("start-portfolio.sh" "sync-games.sh")
for script in "${script_files[@]}"; do
    if [ -f "$script" ] && [ -x "$script" ]; then
        echo "   ✅ $script 存在且可执行"
    else
        echo "   ⚠️  $script 不存在或不可执行"
    fi
done

echo ""
echo "🖼️  检查游戏图片："
images=("arena-breakout.png" "cat-runner-game.png" "minecraft-web.png")
for img in "${images[@]}"; do
    if [ -f "images/$img" ]; then
        size=$(stat -f%z "images/$img" 2>/dev/null || stat -c%s "images/$img" 2>/dev/null)
        size_mb=$(echo "scale=2; $size / 1024 / 1024" | bc 2>/dev/null || echo "N/A")
        echo "   ✅ $img (${size_mb} MB)"
    else
        echo "   ❌ $img 缺少"
    fi
done

echo ""
echo "🎯 检查完成！"
echo ""
echo "💡 如果发现问题，请运行："
echo "   - ./sync-games.sh (同步游戏文件)"
echo "   - ./sync-images.sh (同步游戏图片)"