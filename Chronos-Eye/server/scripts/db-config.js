/**
 * 共享数据库配置模块
 * 从 server/.env 读取环境变量，避免在脚本中硬编码凭据
 *
 * 使用前确保：
 * 1. server/.env 文件已创建并包含 DB_* 变量
 * 2. 不要将 .env 文件提交到版本控制
 */

require('dotenv').config({ path: __dirname + '/../.env' })

module.exports = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'chronos_eye'
}
