FROM node:18-alpine

# 安全：非 root 用户运行
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# 先复制 package 文件，利用 Docker 缓存层
COPY package*.json ./
RUN npm install --production && npm cache clean --force

# 复制应用代码
COPY . .

# 设置环境变量（Dockerfile 不写死任何密钥，运行时注入）
ENV NODE_ENV=production
ENV PORT=3000

# 切换非 root 用户
USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "src/index.js"]
