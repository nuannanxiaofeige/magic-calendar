# 时光之眼 - 服务器部署指南

## 部署步骤

### 1. 上传代码到服务器

使用 SCP 或 SFTP 将整个 `server` 目录上传到服务器的 `/root/chronos-eye/server` 目录：

```bash
# 在本地执行（需要 SSH 密钥或密码）
scp -r server/ root@47.102.152.82:/root/chronos-eye/server/
```

### 2. 登录服务器并执行部署

```bash
ssh root@47.102.152.82
cd /root/chronos-eye/server
chmod +x deploy.sh
./deploy.sh
```

### 3. 检查服务状态

```bash
# 查看 PM2 进程状态
pm2 status

# 查看服务日志
pm2 logs chronos-eye

# 测试本地访问
curl http://localhost:3000/health
```

### 4. 配置防火墙（重要！）

如果使用的是阿里云/腾讯云服务器，需要在**安全组**中开放端口：

1. 登录云服务器控制台
2. 找到「安全组」或「防火墙」设置
3. 添加入站规则：
   - 端口：`3000`
   - 协议：`TCP`
   - 源 IP：`0.0.0.0/0`（允许所有 IP）

### 5. 测试公网访问

在本地电脑测试：
```bash
curl http://47.102.152.82:3000/api/history/today
```

## 常用 PM2 命令

```bash
# 查看状态
pm2 status

# 重启服务
pm2 restart chronos-eye

# 停止服务
pm2 stop chronos-eye

# 查看日志
pm2 logs chronos-eye

# 开机自启配置
pm2 startup
pm2 save
```

## 注意事项

1. **数据库已配置**：`.env` 文件中已设置 MySQL 连接，服务器上的 MySQL 应该已经在运行
2. **端口 3000**：确保没有其他服务占用 3000 端口
3. **HTTPS**：微信小程序正式环境需要 HTTPS，开发测试阶段可以用 HTTP

## 故障排查

### 服务无法访问
1. 检查 PM2 状态：`pm2 status`
2. 查看日志：`pm2 logs chronos-eye`
3. 检查端口：`netstat -tlnp | grep 3000`
4. 检查防火墙：安全组是否开放 3000 端口

### 数据库连接失败
1. 检查 MySQL 状态：`systemctl status mysql`
2. 验证连接：`mysql -u root -p -e "USE chronos_eye; SELECT 1;"`

### 依赖安装失败
```bash
cd /root/chronos-eye/server
npm install --registry=https://registry.npmmirror.com
```
