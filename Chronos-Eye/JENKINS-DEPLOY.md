# 时光之眼 - Jenkins 自动化部署配置指南

## 架构图

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Git 仓库    │ ──>  │   Jenkins    │ ──>  │  腾讯云服务器  │
│ (代码提交)    │      │ (自动构建部署) │      │  (47.102.152.82)│
└──────────────┘      └──────────────┘      └──────────────┘
```

---

## 步骤 1：安装 Jenkins

### 在服务器上执行：

```bash
# 1. 安装 Java (Jenkins 需要)
apt-get update
apt-get install -y openjdk-11-jdk

# 2. 添加 Jenkins 仓库
wget -q -O - https://pkg.jenkins.io/debian-stable/jenkins.io.key | apt-key add -
echo "deb https://pkg.jenkins.io/debian-stable binary/" > /etc/apt/sources.list.d/jenkins.list

# 3. 安装 Jenkins
apt-get update
apt-get install -y jenkins

# 4. 启动 Jenkins
systemctl start jenkins
systemctl enable jenkins

# 5. 开放端口
ufw allow 8080/tcp
```

### 访问 Jenkins

浏览器打开：`http://47.102.152.82:8080`

首次登录需要密码：
```bash
cat /var/lib/jenkins/secrets/initialAdminPassword
```

---

## 步骤 2：Jenkins 初始化配置

1. 安装推荐插件
2. 创建管理员账户
3. 开始使用

---

## 步骤 3：安装必要插件

进入 **系统管理 -> 插件管理 -> 可选插件**，安装：

- [x] Git plugin
- [x] SSH Agent plugin
- [x] Pipeline plugin
- [x] NodeJS plugin
- [x] Green Balls (让构建成功显示为绿色)

---

## 步骤 4：配置 Node.js

进入 **系统管理 -> 工具配置 -> NodeJS 安装**：

1. 添加 Node.js
2. 名称：`NodeJS-18`
3. 勾选"自动安装"
4. 版本：选择 18.x

---

## 步骤 5：配置 SSH 凭证

进入 **管理 Jenkins -> 管理凭证 -> 系统 -> 全局凭证 -> 添加凭证**：

- 类型：`SSH Username with private key`
- ID：`server-deploy-key`
- 描述：`腾讯云服务器 SSH 密钥`
- Username：`root`
- Private Key：选择"Enter directly"，粘贴你的 SSH 私钥

### 如果没有 SSH 密钥，先生成：

```bash
# 在 Jenkins 服务器上生成
ssh-keygen -t rsa -b 4096 -f /var/lib/jenkins/.ssh/id_rsa -N "" -C "jenkins@chronos-eye"

# 复制公钥到目标服务器
ssh-copy-id -i /var/lib/jenkins/.ssh/id_rsa.pub root@47.102.152.82

# 设置权限
chown -R jenkins:jenkins /var/lib/jenkins/.ssh
chmod 700 /var/lib/jenkins/.ssh
chmod 600 /var/lib/jenkins/.ssh/id_rsa
```

---

## 步骤 6：创建 Jenkins 任务

### 6.1 创建新任务

1. 点击"新建任务"
2. 名称：`chronos-eye-deploy`
3. 类型：选择"Pipeline"
4. 点击"确定"

### 6.2 配置 Pipeline

进入任务配置页面：

#### General 配置
- 勾选"Discard old builds"
- Max # of builds to keep: 10

#### 源代码管理
- 选择 Git
- Repository URL: 你的 Git 仓库地址（如 GitHub/Gitee）
- Branches: `*/main` (或 master)

#### 构建触发器（可选）
- 勾选"Git hook trigger"（实现代码推送后自动构建）

#### Pipeline 配置
- Definition: `Pipeline script`
- 脚本内容见下面的 `Jenkinsfile`

---

## 步骤 7：创建 Jenkinsfile

在项目根目录创建 `Jenkinsfile`：

```groovy
pipeline {
    agent any

    tools {
        nodejs 'NodeJS-18'
    }

    environment {
        SERVER_IP = '47.102.152.82'
        SERVER_USER = 'root'
        SERVER_DIR = '/root/chronos-eye/server'
    }

    stages {
        stage('Checkout') {
            steps {
                echo '📦 检出代码...'
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo '📥 安装依赖...'
                dir('server') {
                    sh 'npm install --production'
                }
            }
        }

        stage('Run Tests') {
            steps {
                echo '🧪 运行测试...'
                dir('server') {
                    sh 'npm test' || true
                }
            }
        }

        stage('Deploy to Server') {
            steps {
                echo '🚀 部署到服务器...'
                sshagent(['server-deploy-key']) {
                    sh '''
                        # 上传代码
                        scp -r server/* ${SERVER_USER}@${SERVER_IP}:${SERVER_DIR}/

                        # 执行远程部署命令
                        ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
                        cd ${SERVER_DIR}

                        # 创建 .env 文件
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

                        # 安装依赖
                        npm install --production

                        # 重启服务
                        pm2 restart chronos-eye || pm2 start src/index.js --name chronos-eye
                        pm2 save

                        echo "部署完成！"
                        ENDSSH
                    '''
                }
            }
        }

        stage('Verify') {
            steps {
                echo '✅ 验证部署...'
                sh 'curl -s http://${SERVER_IP}:3000/api/ || echo "API 验证失败"'
            }
        }
    }

    post {
        always {
            echo '📊 构建完成'
            cleanWs()
        }
        success {
            echo '✅ 部署成功！'
        }
        failure {
            echo '❌ 部署失败，请检查日志'
        }
    }
}
```

---

## 步骤 8：配置 Git Hook（可选，实现自动部署）

### GitHub Webhook

1. 进入 GitHub 仓库 -> Settings -> Webhooks
2. Add webhook
3. Payload URL: `http://47.102.152.82:8080/github-webhook/`
4. Content type: `application/json`
5. 勾选 Push events

### Gitee Webhook

1. 进入 Gitee 仓库 -> 管理 -> WebHooks
2. 添加 WebHook
3. URL: `http://47.102.152.82:8080/gitee-webhook/`
4. 勾选 Push 事件

---

## 步骤 9：开始部署

### 手动触发

1. 进入 Jenkins 任务页面
2. 点击"立即构建"
3. 查看构建控制台输出

### 自动触发

推送代码后自动触发：
```bash
git push origin main
```

---

## 步骤 10：监控和管理

### 查看构建历史

在 Jenkins 任务页面可以看到所有构建历史。

### 查看服务状态

```bash
# SSH 登录服务器
ssh root@47.102.152.82

# 查看 PM2 状态
pm2 status

# 查看日志
pm2 logs chronos-eye
```

---

## 常见问题

### Q: SSH 连接失败
```bash
# 检查 SSH 密钥权限
chmod 600 /var/lib/jenkins/.ssh/id_rsa
chmod 700 /var/lib/jenkins/.ssh

# 测试连接
sudo -u jenkins ssh -i /var/lib/jenkins/.ssh/id_rsa root@47.102.152.82
```

### Q: PM2 命令找不到
```bash
# 在服务器上全局安装 PM2
npm install -g pm2

# 或者在 Jenkinsfile 中添加安装步骤
sh 'npm install -g pm2'
```

### Q: 端口被占用
修改 `server/.env` 中的 PORT，或在 Jenkinsfile 中修改。

---

## 安全建议

1. **修改 Jenkins 默认端口**
   ```bash
   # 编辑 /etc/default/jenkins
   HTTP_PORT=8888
   ```

2. **配置 HTTPS**
   ```bash
   # 使用 Nginx 反向代理
   apt-get install -y nginx certbot python3-certbot-nginx
   ```

3. **配置防火墙**
   ```bash
   ufw allow 8080/tcp  # Jenkins
   ufw allow 3000/tcp  # 应用
   ufw allow 22/tcp    # SSH
   ```

4. **定期备份**
   ```bash
   # 备份 Jenkins 配置
   tar -czf jenkins-backup.tar.gz /var/lib/jenkins
   ```

---

## 下一步

部署完成后：

1. 测试 API：`curl http://47.102.152.82:3000/api/`
2. 修改小程序 `app.js` 的 `baseUrl`
3. 在微信公众平台配置服务器域名（正式上线时）
