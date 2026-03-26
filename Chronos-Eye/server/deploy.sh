#!/bin/bash

# Chronos-Eye 服务器部署脚本

echo "=== 时光之眼服务器部署 ==="

# 1. 更新系统
echo "更新系统包..."
apt-get update -y

# 2. 安装 Node.js (如果未安装)
if ! command -v node &> /dev/null; then
    echo "安装 Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# 3. 安装 PM2
echo "安装 PM2..."
npm install -g pm2

# 4. 进入项目目录
cd /root/chronos-eye/server

# 5. 安装依赖
echo "安装项目依赖..."
npm install

# 6. 停止旧的进程
echo "停止旧的进程..."
pm2 stop chronos-eye 2>/dev/null || true
pm2 delete chronos-eye 2>/dev/null || true

# 7. 启动服务
echo "启动服务..."
pm2 start src/index.js --name chronos-eye

# 8. 设置开机自启
pm2 startup
pm2 save

# 9. 配置防火墙
echo "配置防火墙..."
ufw allow 3000/tcp 2>/dev/null || iptables -I INPUT -p tcp --dport 3000 -j ACCEPT

echo ""
echo "=== 部署完成 ==="
echo "服务状态查看：pm2 status"
echo "查看日志：pm2 logs chronos-eye"
echo "重启服务：pm2 restart chronos-eye"
