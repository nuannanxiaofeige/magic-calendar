# 时光之眼 - 服务器部署指南

## 前置准备

### 1. 购买云服务器
推荐服务商：
- 腾讯云 (https://cloud.tencent.com)
- 阿里云 (https://www.aliyun.com)
- 华为云 (https://www.huaweicloud.com)

推荐配置：
- CPU: 1 核
- 内存：2GB
- 带宽：3Mbps 以上
- 系统：Ubuntu 20.04 LTS 或 CentOS 7+

### 2. 备案域名
- 在服务器提供商处完成 ICP 备案
- 申请 SSL 证书（HTTPS）

### 3. 配置安全组
在云服务器控制台开放以下端口：
- 3000 (HTTP - 后端 API)
- 443 (HTTPS - 生产环境)
- 22 (SSH)

---

## 方式一：手动部署（推荐新手）

### 步骤 1：连接服务器

```bash
ssh root@你的服务器 IP
```

### 步骤 2：安装 Node.js 和 PM2

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs
npm install -g pm2

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs
npm install -g pm2
```

### 步骤 3：上传项目代码

```bash
# 在服务器上创建目录
mkdir -p /root/chronos-eye
cd /root/chronos-eye

# 方式 A: 使用 git clone
git clone <你的仓库地址> .

# 方式 B: 使用 scp 从本地上传
# 在本地执行：
# scp -r /Users/lifei/Chronos-Eye/server/* root@服务器 IP:/root/chronos-eye/
```

### 步骤 4：配置环境变量

```bash
# 编辑.env 文件
vi .env
```

修改以下配置（请将占位符替换为你的实际值）：
```
PORT=3000
DB_TYPE=mysql
DB_HOST=your_server_ip
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=chronos_eye
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
NODE_ENV=production
TIANAPI_KEY=your_tianapi_key
```

> ⚠️ **安全提示**：不要将包含真实密码的 `.env` 文件提交到版本控制系统。

### 步骤 5：安装依赖并启动

```bash
# 安装依赖
npm install

# 启动服务
pm2 start src/index.js --name chronos-eye

# 设置开机自启
pm2 startup
pm2 save
```

### 步骤 6：配置防火墙

```bash
# Ubuntu
ufw allow 3000
ufw reload

# CentOS
firewall-cmd --permanent --add-port=3000/tcp
firewall-cmd --reload
```

---

## 方式二：使用部署脚本

### 在服务器上执行：

```bash
cd /root/chronos-eye/server
chmod +x deploy.sh
./deploy.sh
```

---

## 配置 Nginx 反向代理（可选，用于 HTTPS）

### 步骤 1：安装 Nginx

```bash
apt-get install -y nginx  # Ubuntu
yum install -y nginx      # CentOS
```

### 步骤 2：配置 Nginx

```bash
vi /etc/nginx/sites-available/chronos-eye
```

添加配置：
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 步骤 3：启用配置

```bash
ln -s /etc/nginx/sites-available/chronos-eye /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### 步骤 4：配置 HTTPS（使用 Let's Encrypt）

```bash
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

---

## 常用 PM2 命令

```bash
# 查看服务状态
pm2 status

# 查看日志
pm2 logs chronos-eye

# 重启服务
pm2 restart chronos-eye

# 停止服务
pm2 stop chronos-eye

# 删除服务
pm2 delete chronos-eye

# 查看监控
pm2 monit
```

---

## 测试 API

部署完成后，测试 API 是否正常：

```bash
# 测试首页
curl http://服务器IP:3000/api/

# 测试黄历接口
curl http://服务器IP:3000/api/almanac/today
```

---

## 修改小程序配置

部署完成后，需要修改小程序的 API 地址：

编辑 `miniprogram/app.js`：
```javascript
globalData: {
  baseUrl: 'https://your-domain.com/api'  // 改为你的域名
  // 或 baseUrl: 'http://服务器IP:3000/api'
}
```

---

## 微信公众平台配置

1. 登录 https://mp.weixin.qq.com
2. 开发 -> 开发管理 -> 开发设置
3. 服务器域名 -> request 合法域名
4. 添加你的域名（必须是 HTTPS）

---

## 故障排查

### 服务无法访问
```bash
# 检查服务状态
pm2 status

# 检查端口
netstat -tlnp | grep 3000

# 检查防火墙
ufw status  # Ubuntu
firewall-cmd --list-ports  # CentOS
```

### 数据库连接失败
```bash
# 测试数据库连接
mysql -h your_server_ip -u root -p
```

### 查看日志
```bash
pm2 logs chronos-eye --lines 100
```
