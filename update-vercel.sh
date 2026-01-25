#!/bin/bash

# Vercel 更新部署脚本

echo "🚀 更新 Vercel 部署"
echo "=================="
echo ""

echo "📋 当前更改："
echo "- ✅ 游戏按钮改为直接导航"
echo "- ✅ 移除新窗口/标签页打开"
echo "- ✅ 删除iframe内嵌区域"
echo "- ✅ 优化按钮样式和交互"
echo ""

echo "🌐 Vercel 更新步骤："
echo "方法一：Vercel CLI（推荐）"
echo "1. 确保已安装: npm install -g vercel"
echo "2. 登录: vercel login"
echo "3. 更新部署: vercel --prod"
echo ""

echo "方法二：Vercel Web界面"
echo "1. 访问: https://vercel.com/dashboard"
echo "2. 找到 games-portfolio 项目"
echo "3. 点击 'Redeploy' 按钮"
echo "4. 等待部署完成"
echo ""

echo "🔄 自动更新设置："
echo "如果您已连接GitHub仓库，Vercel会在代码推送时自动更新"
echo "当前GitHub状态：需要推送 - 网络连接问题"
echo ""

echo "📱 更新后的功能："
echo "- 🎮 点击"开始游戏"直接进入游戏页面"
echo "- 🔙 使用浏览器返回按钮回到作品集"
echo "- ⌨️ 键盘快捷键仍然有效"
echo "- 📱 移动端体验更佳"
echo ""

echo "🔗 更新后地址："
echo "- 作品集: https://games-portfolio.vercel.app"
echo "- 暗区突围: https://games-portfolio.vercel.app/games/arena-breakout/"
echo "- 猫咪快跑: https://games-portfolio.vercel.app/games/cat-runner-game/"
echo "- 网页版我的世界: https://games-portfolio.vercel.app/games/minecraft-web/"
echo ""

echo "⚡ 推送命令（网络恢复后）："
echo "cd games-portfolio"
echo "git push origin main"
echo ""

echo "🎯 测试检查清单："
echo "□ 点击"开始游戏"是否直接导航"
echo "□ 浏览器返回按钮是否正常工作"
echo "□ 键盘快捷键是否有效"
echo "□ 移动端体验是否良好"
echo "□ 游戏页面是否正常加载"
echo ""

echo "💡 提示："
echo "- 游戏页面会有完整的游戏体验"
echo "- 使用浏览器返回键回到作品集"
echo "- 可以在游戏页面添加"返回作品集"链接"
echo "- 所有GitHub链接保持不变"