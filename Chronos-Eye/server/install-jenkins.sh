#!/bin/bash

# ===========================================
# 时光之眼 - Jenkins 服务器一键安装脚本
# 服务器：47.102.152.82
# ===========================================

set -e

SERVER_IP="47.102.152.82"
SERVER_USER="root"

echo "============================================"
echo "     Jenkins 服务器安装脚本"
echo "============================================"
echo ""
echo "目标服务器：${SERVER_IP}"
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查 SSH 连接
log_info "检查 SSH 连接..."
if ! ssh -o ConnectTimeout=5 -o BatchMode=yes ${SERVER_USER}@${SERVER_IP} "echo '连接成功'" 2>/dev/null; then
    log_error "无法连接到服务器，请先配置 SSH 密钥认证："
    echo ""
    echo "  ssh-keygen -t rsa"
    echo "  ssh-copy-id ${SERVER_USER}@${SERVER_IP}"
    echo ""
    exit 1
fi
log_info "服务器连接成功！"
echo ""

# 执行远程安装
log_info "开始安装 Jenkins..."

ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
set -e

echo ""
echo "============================================"
echo "     在服务器上安装 Jenkins"
echo "============================================"
echo ""

# 1. 安装 Java
echo "[1/6] 安装 OpenJDK 11..."
apt-get update -y
apt-get install -y openjdk-11-jdk

java -version
echo ""

# 2. 安装 Jenkins
echo "[2/6] 安装 Jenkins..."
wget -q -O - https://pkg.jenkins.io/debian-stable/jenkins.io.key | apt-key add -
echo "deb https://pkg.jenkins.io/debian-stable binary/" > /etc/apt/sources.list.d/jenkins.list
apt-get update -y
apt-get install -y jenkins

echo ""
echo "[3/6] 启动 Jenkins..."
systemctl start jenkins
systemctl enable jenkins

echo ""
echo "[4/6] 配置防火墙..."
ufw allow 8080/tcp 2>/dev/null || true
ufw allow 3000/tcp 2>/dev/null || true
ufw allow 22/tcp 2>/dev/null || true

echo ""
echo "[5/6] 安装 Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

echo ""
echo "[6/6] 安装 PM2..."
npm install -g pm2

echo ""
echo "============================================"
echo "     Jenkins 安装完成！"
echo "============================================"
echo ""
echo "访问地址：http://${SERVER_IP}:8080"
echo ""
echo "获取初始管理员密码："
echo "  cat /var/lib/jenkins/secrets/initialAdminPassword"
echo ""

# 生成 SSH 密钥用于部署
echo "生成 Jenkins SSH 密钥..."
JENKINS_HOME="/var/lib/jenkins"
mkdir -p ${JENKINS_HOME}/.ssh
ssh-keygen -t rsa -b 4096 -f ${JENKINS_HOME}/.ssh/id_rsa -N "" -C "jenkins@chronos-eye"
chown -R jenkins:jenkins ${JENKINS_HOME}/.ssh
chmod 700 ${JENKINS_HOME}/.ssh
chmod 600 ${JENKINS_HOME}/.ssh/id_rsa

echo ""
echo "SSH 公钥已生成："
cat ${JENKINS_HOME}/.ssh/id_rsa.pub
echo ""
echo "请将上面的公钥添加到目标服务器的 authorized_keys："
echo "  echo '<公钥>' >> /root/.ssh/authorized_keys"
echo ""

# 显示服务状态
echo "服务状态："
systemctl status jenkins --no-pager -l
echo ""
pm2 status

ENDSSH

echo ""
echo "============================================"
echo "     Jenkins 安装完成！"
echo "============================================"
echo ""
echo "下一步操作："
echo ""
echo "1. 访问 Jenkins: http://${SERVER_IP}:8080"
echo ""
echo "2. 获取初始密码："
echo "   ssh root@${SERVER_IP} 'cat /var/lib/jenkins/secrets/initialAdminPassword'"
echo ""
echo "3. 在 Jenkins 中安装推荐插件"
echo ""
echo "4. 配置 Node.js 工具（系统管理 -> 工具配置）"
echo "   - 名称：NodeJS-18"
echo "   - 勾选'自动安装'"
echo ""
echo "5. 配置 SSH 凭证（管理凭证 -> 添加凭证）"
echo "   - 类型：SSH Username with private key"
echo "   - ID: server-deploy-key"
echo "   - Username: root"
echo "   - Private Key: 使用服务器生成的私钥"
echo ""
echo "6. 创建 Pipeline 任务，使用项目根目录的 Jenkinsfile"
echo ""
