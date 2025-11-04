#!/bin/bash
# Protocol Bank AWS 部署脚本
# 用于更新AWS EC2上的前端和后端代码

set -e

echo "=========================================="
echo "Protocol Bank AWS 部署脚本"
echo "=========================================="
echo ""

# 检查参数
if [ -z "$1" ]; then
    echo "用法: ./deploy-to-aws.sh <EC2_IP_ADDRESS> [SSH_KEY_PATH]"
    echo ""
    echo "示例:"
    echo "  ./deploy-to-aws.sh 13.239.123.45"
    echo "  ./deploy-to-aws.sh 13.239.123.45 ~/.ssh/protocol-bank-key.pem"
    echo ""
    exit 1
fi

EC2_IP=$1
SSH_KEY=${2:-"~/.ssh/id_rsa"}
SSH_USER="ubuntu"

echo "目标服务器: $EC2_IP"
echo "SSH密钥: $SSH_KEY"
echo "SSH用户: $SSH_USER"
echo ""

# 测试SSH连接
echo "测试SSH连接..."
if ! ssh -i "$SSH_KEY" -o ConnectTimeout=5 "$SSH_USER@$EC2_IP" "echo 'SSH连接成功'" 2>/dev/null; then
    echo "❌ SSH连接失败,请检查:"
    echo "  1. EC2 IP地址是否正确"
    echo "  2. SSH密钥路径是否正确"
    echo "  3. EC2安全组是否允许SSH访问"
    exit 1
fi

echo "✅ SSH连接成功"
echo ""

# 部署前端
echo "=========================================="
echo "部署前端..."
echo "=========================================="

ssh -i "$SSH_KEY" "$SSH_USER@$EC2_IP" << 'ENDSSH'
set -e

# 进入项目目录
cd /opt/protocol-bank || cd ~/protocol-bank || {
    echo "❌ 找不到项目目录"
    exit 1
}

echo "当前目录: $(pwd)"
echo ""

# 拉取最新代码
echo "拉取最新代码..."
git fetch origin
git reset --hard origin/main
echo "✅ 代码已更新到最新版本"
echo ""

# 安装前端依赖
echo "安装前端依赖..."
cd apps/frontend
npm install || pnpm install || yarn install
echo "✅ 前端依赖安装完成"
echo ""

# 构建前端
echo "构建前端..."
npm run build || pnpm build || yarn build
echo "✅ 前端构建完成"
echo ""

# 复制构建文件到Nginx目录
echo "部署到Nginx..."
sudo rm -rf /var/www/protocol-bank/*
sudo cp -r dist/* /var/www/protocol-bank/
sudo chown -R www-data:www-data /var/www/protocol-bank
echo "✅ 前端已部署到Nginx"
echo ""

# 重启Nginx
echo "重启Nginx..."
sudo systemctl restart nginx
echo "✅ Nginx已重启"
echo ""

# 检查Nginx状态
echo "检查Nginx状态..."
sudo systemctl status nginx --no-pager | head -10
echo ""

ENDSSH

# 部署后端 (如果需要)
echo "=========================================="
echo "部署后端..."
echo "=========================================="

ssh -i "$SSH_KEY" "$SSH_USER@$EC2_IP" << 'ENDSSH'
set -e

cd /opt/protocol-bank || cd ~/protocol-bank || exit 1

# 更新后端
echo "更新后端..."
cd apps/backend
npm install || pnpm install || yarn install
echo "✅ 后端依赖安装完成"
echo ""

# 重启后端服务 (如果使用PM2)
if command -v pm2 &> /dev/null; then
    echo "重启PM2服务..."
    pm2 restart all || pm2 start ecosystem.config.js
    pm2 save
    echo "✅ 后端服务已重启"
    echo ""
    
    echo "PM2状态:"
    pm2 list
else
    echo "⚠️  未找到PM2,请手动重启后端服务"
fi

ENDSSH

echo ""
echo "=========================================="
echo "✅ 部署完成!"
echo "=========================================="
echo ""
echo "请访问 https://protocolbanks.com 验证部署"
echo ""
echo "如果遇到问题,请检查:"
echo "  1. Nginx日志: sudo tail -f /var/log/nginx/error.log"
echo "  2. 后端日志: pm2 logs"
echo "  3. 系统日志: sudo journalctl -xe"
echo ""
