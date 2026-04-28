#!/bin/bash
# 手动部署脚本
# 用法：bash scripts/deploy.sh [dev|prod]
#
# 前置要求：
#   - Docker + Docker Compose
#   - 服务器上已有 .env 文件

set -e

ENV=${1:-dev}
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "🚀 部署环境：$ENV"

if [ "$ENV" = "prod" ]; then
  # 生产环境：检查 .env 是否存在
  if [ ! -f .env ]; then
    echo "⚠️  .env 文件不存在，正在从 .env.prod 模板创建..."
    cp .env.prod .env
    echo "⚠️  请编辑 .env 填入真实密钥，然后重新运行此脚本"
    exit 1
  fi
fi

# 构建并启动
docker compose build --no-cache app
docker compose up -d

# 等待启动
echo "⏳ 等待服务启动..."
sleep 5

# 健康检查
if curl -sf http://localhost:3000/health > /dev/null; then
  echo "✅ 部署成功！"
  docker compose ps
else
  echo "⚠️  服务可能仍在启动中，请手动检查"
  docker compose logs --tail=20 app
fi
