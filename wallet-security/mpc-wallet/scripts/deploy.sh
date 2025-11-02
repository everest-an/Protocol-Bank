#!/bin/bash
# MPC 钱包部署脚本

set -e  # 遇到错误立即退出

echo "======================================"
echo "MPC Wallet Deployment Script"
echo "======================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 root 权限
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}请使用 root 权限运行此脚本${NC}"
    exit 1
fi

# 配置变量
INSTALL_DIR="/opt/mpc-wallet"
SERVICE_USER="mpc-wallet"
CONFIG_DIR="/etc/mpc-wallet"
LOG_DIR="/var/log/mpc-wallet"
DATA_DIR="/var/lib/mpc-wallet"

echo -e "${GREEN}步骤 1/8: 检查系统依赖${NC}"
# 检查必需的系统包
required_packages=("build-essential" "libgmp-dev" "protobuf-compiler" "libssl-dev")
for package in "${required_packages[@]}"; do
    if ! dpkg -l | grep -q "^ii  $package"; then
        echo "安装 $package..."
        apt-get install -y "$package"
    else
        echo "✓ $package 已安装"
    fi
done

echo ""
echo -e "${GREEN}步骤 2/8: 创建系统用户${NC}"
# 创建服务用户
if ! id "$SERVICE_USER" &>/dev/null; then
    useradd -r -s /bin/false "$SERVICE_USER"
    echo "✓ 创建用户 $SERVICE_USER"
else
    echo "✓ 用户 $SERVICE_USER 已存在"
fi

echo ""
echo -e "${GREEN}步骤 3/8: 创建目录结构${NC}"
# 创建必要的目录
mkdir -p "$INSTALL_DIR"
mkdir -p "$CONFIG_DIR"
mkdir -p "$LOG_DIR"
mkdir -p "$DATA_DIR"
mkdir -p "$DATA_DIR/audit_logs"
mkdir -p "$DATA_DIR/key_shares"

# 设置权限
chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR"
chown -R "$SERVICE_USER:$SERVICE_USER" "$CONFIG_DIR"
chown -R "$SERVICE_USER:$SERVICE_USER" "$LOG_DIR"
chown -R "$SERVICE_USER:$SERVICE_USER" "$DATA_DIR"

chmod 700 "$DATA_DIR/key_shares"  # 密钥目录最严格权限

echo "✓ 目录结构创建完成"

echo ""
echo -e "${GREEN}步骤 4/8: 编译项目${NC}"
# 编译 Rust 项目
if [ -f "Cargo.toml" ]; then
    cargo build --release
    echo "✓ 编译完成"
else
    echo -e "${RED}错误: 未找到 Cargo.toml${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}步骤 5/8: 安装二进制文件${NC}"
# 复制二进制文件
if [ -f "target/release/mpc_wallet" ]; then
    cp target/release/mpc_wallet "$INSTALL_DIR/"
    chown "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR/mpc_wallet"
    chmod 755 "$INSTALL_DIR/mpc_wallet"
    echo "✓ 二进制文件安装完成"
else
    echo -e "${RED}错误: 未找到编译后的二进制文件${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}步骤 6/8: 生成配置文件${NC}"
# 生成默认配置
cat > "$CONFIG_DIR/config.toml" <<EOF
[system]
node_id = "node1"
environment = "production"

[policy]
amount_limit = 1.0
daily_limit = 10.0
time_window_start = 9
time_window_end = 18

[mpc]
party_count = 2
threshold = 2
protocol_timeout_secs = 300
max_retries = 3

[network]
listen_addr = "0.0.0.0:50051"
peer_addrs = []

[hsm]
provider = "SoftwareSimulation"
key_rotation_days = 90
backup_enabled = true

[logging]
level = "info"
output = "file"
log_dir = "$LOG_DIR"

[audit]
database_path = "$DATA_DIR/audit_logs/audit.db"
export_enabled = true
retention_days = 365
EOF

chown "$SERVICE_USER:$SERVICE_USER" "$CONFIG_DIR/config.toml"
chmod 600 "$CONFIG_DIR/config.toml"
echo "✓ 配置文件生成完成"

echo ""
echo -e "${GREEN}步骤 7/8: 创建 systemd 服务${NC}"
# 创建 systemd 服务文件
cat > /etc/systemd/system/mpc-wallet.service <<EOF
[Unit]
Description=MPC Wallet Service
After=network.target

[Service]
Type=simple
User=$SERVICE_USER
Group=$SERVICE_USER
WorkingDirectory=$INSTALL_DIR
ExecStart=$INSTALL_DIR/mpc_wallet --config $CONFIG_DIR/config.toml
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

# 安全加固
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$DATA_DIR $LOG_DIR
ProtectKernelTunables=true
ProtectControlGroups=true
RestrictRealtime=true
RestrictNamespaces=true

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
echo "✓ systemd 服务创建完成"

echo ""
echo -e "${GREEN}步骤 8/8: 配置防火墙${NC}"
# 配置防火墙（如果 ufw 已安装）
if command -v ufw &> /dev/null; then
    ufw allow 50051/tcp comment 'MPC Wallet gRPC'
    echo "✓ 防火墙规则添加完成"
else
    echo -e "${YELLOW}警告: ufw 未安装，请手动配置防火墙${NC}"
fi

echo ""
echo "======================================"
echo -e "${GREEN}部署完成！${NC}"
echo "======================================"
echo ""
echo "下一步操作："
echo "1. 编辑配置文件: $CONFIG_DIR/config.toml"
echo "2. 启动服务: systemctl start mpc-wallet"
echo "3. 启用开机自启: systemctl enable mpc-wallet"
echo "4. 查看状态: systemctl status mpc-wallet"
echo "5. 查看日志: journalctl -u mpc-wallet -f"
echo ""
echo "重要提示："
echo "- 密钥存储在: $DATA_DIR/key_shares"
echo "- 审计日志在: $DATA_DIR/audit_logs"
echo "- 请务必备份密钥和审计日志"
echo "- 生产环境请配置 HSM"
echo ""
