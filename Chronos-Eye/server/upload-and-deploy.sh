#!/bin/bash

# ===========================================
# 时光之眼 - 本地代码上传并部署脚本
# 服务器：47.102.152.82
# ===========================================

set -e

SERVER_IP="47.102.152.82"
SERVER_USER="root"
SERVER_DIR="/root/chronos-eye/server"
LOCAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "============================================"
echo "     时光之眼 - 上传并部署到服务器"
echo "============================================"
echo ""
echo "服务器信息:"
echo "  - IP 地址：${SERVER_IP}"
echo "  - 用户：${SERVER_USER}"
echo "  - 目标目录：${SERVER_DIR}"
echo ""

# 1. 检查是否可以连接服务器
echo "检查服务器连接..."
if ! ssh -o ConnectTimeout=5 -o BatchMode=yes ${SERVER_USER}@${SERVER_IP} "echo '连接成功'" 2>/dev/null; then
    echo "无法连接到服务器，请检查:"
    echo "  1. 服务器是否开机"
    echo "  2. SSH 是否正常运行"
    echo "  3. 是否需要配置 SSH 密钥认证"
    echo ""
    echo "首次连接需要输入密码，建议配置 SSH 密钥："
    echo "  ssh-keygen -t rsa"
    echo "  ssh-copy-id ${SERVER_USER}@${SERVER_IP}"
    echo ""
    exit 1
fi
echo "服务器连接成功！"
echo ""

# 2. 在服务器上创建目录
echo "创建服务器目录..."
ssh ${SERVER_USER}@${SERVER_IP} "mkdir -p ${SERVER_DIR}"

# 3. 上传代码
echo "上传代码到服务器..."
scp -r ${LOCAL_DIR}/* ${SERVER_USER}@${SERVER_IP}:${SERVER_DIR}/

echo "代码上传完成！"
echo ""

# 4. 在服务器上执行部署
echo "============================================"
echo "开始在服务器上执行部署..."
echo "============================================"

ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
cd /root/chronos-eye/server

# 创建 .env 文件（如果不存在）
if [ ! -f ".env" ]; then
    echo "创建 .env 配置文件..."
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
fi

# 安装依赖
echo "安装依赖..."
npm install --production

# 停止旧服务
echo "停止旧服务..."
pm2 stop chronos-eye 2>/dev/null || true
pm2 delete chronos-eye 2>/dev/null || true

# 启动新服务
echo "启动服务..."
pm2 start src/index.js --name chronos-eye --env production

# 设置开机自启
pm2 startup systemd -u root --hp /root 2>/dev/null || true
pm2 save

echo ""
echo "部署完成！"
echo ""
pm2 status
ENDSSH

echo ""
echo "============================================"
echo "     部署完成！"
echo "============================================"
echo ""
echo "API 地址：http://${SERVER_IP}:3000/api/"
echo ""
echo "测试 API:"
echo "  curl http://${SERVER_IP}:3000/api/"
echo ""
echo "下一步:"
echo "  1. 测试 API 是否正常响应"
echo "  2. 修改 miniprogram/app.js 中的 baseUrl"
echo "  3. 在微信公众平台配置服务器域名"
echo ""
