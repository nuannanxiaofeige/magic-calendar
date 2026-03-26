#!/bin/bash

# ===========================================
# 时光之眼 - 一键部署脚本（生产环境）
# ===========================================

set -e

echo "============================================"
echo "     时光之眼 (Chronos Eye) 部署脚本"
echo "============================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 1. 检查是否以 root 权限运行
if [ "$EUID" -ne 0 ]; then
    log_error "请使用 root 权限运行此脚本 (sudo ./deploy-prod.sh)"
    exit 1
fi

# 2. 更新系统包
log_info "步骤 1/8: 更新系统包..."
apt-get update -y || yum update -y

# 3. 安装 Node.js
log_info "步骤 2/8: 检查 Node.js..."
if ! command -v node &> /dev/null; then
    log_info "安装 Node.js 18.x..."
    if command -v apt-get &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt-get install -y nodejs
    else
        curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
        yum install -y nodejs
    fi
    log_info "Node.js 安装完成：$(node --version)"
else
    log_info "Node.js 已安装：$(node --version)"
fi

# 4. 安装 PM2
log_info "步骤 3/8: 安装 PM2..."
npm install -g pm2 --silent
log_info "PM2 安装完成：$(pm2 --version)"

# 5. 安装依赖
log_info "步骤 4/8: 安装项目依赖..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ -f "package.json" ]; then
    npm install --production
    log_info "依赖安装完成"
else
    log_error "package.json 不存在，请确保在正确的目录下运行"
    exit 1
fi

# 6. 创建/更新 .env 文件
log_info "步骤 5/8: 配置环境变量..."
if [ ! -f ".env" ]; then
    log_warn ".env 文件不存在，正在创建..."
    cat > .env << 'EOF'
PORT=3000
DB_TYPE=mysql
DB_HOST=47.102.152.82
DB_PORT=3306
DB_USER=root
DB_PASSWORD=_kIjZ9iVb@nt
DB_NAME=chronos_eye
JWT_SECRET=chronos-eye-jwt-secret-2026
JWT_EXPIRES_IN=7d
NODE_ENV=production
TIANAPI_KEY=30b92001a007855fe7ea7328e8754e2a
EOF
    log_info ".env 文件创建完成"
else
    log_info ".env 文件已存在"
fi

# 7. 停止旧进程并启动新服务
log_info "步骤 6/8: 重启服务..."
pm2 stop chronos-eye 2>/dev/null || true
pm2 delete chronos-eye 2>/dev/null || true

# 启动服务
pm2 start src/index.js --name chronos-eye --instances 1 --env production
log_info "服务启动完成"

# 8. 设置 PM2 开机自启
log_info "步骤 7/8: 配置开机自启..."
pm2 startup systemd -u root --hp /root 2>/dev/null || true
pm2 save

# 9. 配置防火墙
log_info "步骤 8/8: 配置防火墙..."
if command -v ufw &> /dev/null; then
    ufw allow 3000/tcp 2>/dev/null || true
    log_info "UFW 防火墙配置完成"
elif command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-port=3000/tcp 2>/dev/null || true
    firewall-cmd --reload 2>/dev/null || true
    log_info "firewalld 防火墙配置完成"
else
    log_warn "未检测到常见防火墙，请手动配置端口 3000"
fi

# 完成
echo ""
echo "============================================"
echo -e "${GREEN}     部署完成！${NC}"
echo "============================================"
echo ""
echo "服务信息:"
echo "  - 服务名称：chronos-eye"
echo "  - 运行端口：3000"
echo "  - 运行环境：production"
echo ""
echo "常用命令:"
echo "  - 查看状态：pm2 status"
echo "  - 查看日志：pm2 logs chronos-eye"
echo "  - 重启服务：pm2 restart chronos-eye"
echo "  - 停止服务：pm2 stop chronos-eye"
echo "  - 实时监控：pm2 monit"
echo ""
echo "测试 API:"
echo "  curl http://localhost:3000/api/"
echo ""

# 显示服务状态
pm2 status
