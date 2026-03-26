/**
 * 创建星座配对表
 */

require('dotenv').config()
const mysql = require('mysql2/promise')

async function main() {
  console.log('正在连接数据库...')
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '47.102.152.82',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '_kIjZ9iVb@nt',
    database: process.env.DB_NAME || 'chronos_eye'
  })

  try {
    console.log('创建星座配对表...')
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`constellation_match\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键 ID',
        \`sign1\` VARCHAR(20) NOT NULL COMMENT '第一个星座（中文）',
        \`sign2\` VARCHAR(20) NOT NULL COMMENT '第二个星座（中文）',
        \`grade\` VARCHAR(100) DEFAULT NULL COMMENT '点评（友情、爱情、婚姻、亲情评分）',
        \`title\` VARCHAR(50) DEFAULT NULL COMMENT '标题',
        \`content\` TEXT COMMENT '配对内容解说',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        UNIQUE KEY \`uk_sign1_sign2\` (\`sign1\`, \`sign2\`),
        INDEX \`idx_sign1\` (\`sign1\`),
        INDEX \`idx_sign2\` (\`sign2\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='星座配对表'
    `)
    console.log('星座配对表创建成功！')
  } catch (error) {
    console.error('创建表失败:', error.message)
  } finally {
    await connection.end()
  }
}

main().catch(console.error)
