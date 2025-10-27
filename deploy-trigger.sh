#!/bin/bash
# 手动触发 Vercel 部署

echo "正在检查 GitHub 最新提交..."
LATEST_COMMIT=$(git log -1 --format="%H")
echo "最新提交: $LATEST_COMMIT"

echo ""
echo "请访问 Vercel 仪表板手动触发部署："
echo "https://vercel.com/everest-ans-projects/protocol-bank"
echo ""
echo "或者在 Vercel 项目设置中："
echo "1. 进入 Settings → Git"
echo "2. 确认 GitHub 集成已启用"
echo "3. 点击 'Redeploy' 按钮"
