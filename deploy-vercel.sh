#!/bin/bash

# Vercel 部署脚本

echo "🚀 Vercel 部署脚本"
echo "=================="
echo ""

# 检查是否在正确的目录
if [ ! -f "index.html" ]; then
    echo "❌ 错误：未找到 index.html"
    echo "请确保在 games-portfolio 目录中运行此脚本"
    exit 1
fi

echo "📋 部署信息："
echo "- 项目名称：JasonStudio Vibe Coding"
echo "- GitHub 仓库：https://github.com/jasonstudiocn/games-portfolio"
echo "- 部署平台：Vercel"
echo ""

echo "🔧 手动部署步骤："
echo "1. 访问 Vercel：https://vercel.com"
echo "2. 使用 GitHub 账号登录"
echo "3. 点击 'Add New...' -> 'Project'"
echo "4. 选择 'jasonstudiocn/games-portfolio' 仓库"
echo "5. 配置部署设置："
echo "   - Framework Preset: Other"
echo "   - Root Directory: ./"
echo "   - Build Command: (留空)"
echo "   - Output Directory: (留空)"
echo "6. 点击 'Deploy' 按钮开始部署"
echo ""

echo "🎯 Vercel 配置已完成："
echo "- ✅ vercel.json 配置文件已创建"
echo "- ✅ 路由规则已配置"
echo "- ✅ 静态文件处理已设置"
echo ""

echo "📁 项目文件结构："
echo "- index.html (主页)"
echo "- css/ (样式文件)"
echo "- js/ (交互脚本)"
echo "- images/ (游戏截图)"
echo "- games/ (游戏文件)"
echo "- vercel.json (Vercel配置)"
echo ""

echo "⚡ 部署完成后，您的网站将在以下地址可用："
echo "- 主域名：https://games-portfolio-jasonstudiocn.vercel.app"
echo "- 自定义域名：需要额外配置"
echo ""

echo "🔄 GitHub Actions 自动部署（可选）："
echo "如果您想实现自动部署，可以添加 GitHub Actions："
echo ""
echo "1. 在仓库中创建 .github/workflows/deploy.yml"
echo "2. 配置 Vercel 环境变量"
echo "3. 推送代码时自动触发部署"
echo ""

echo "📱 部署后测试："
echo "- 检查所有游戏链接是否正常工作"
echo "- 测试移动端响应式设计"
echo "- 验证 GitHub 链接可访问性"
echo "- 测试键盘快捷键功能"
echo ""

echo "💡 部署完成后，请更新链接："
echo "- 作品集地址：Vercel 提供的域名"
echo "- GitHub 仓库：https://github.com/jasonstudiocn/games-portfolio"