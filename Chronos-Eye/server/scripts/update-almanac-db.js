// 更新黄历数据库表结构并添加数据
require('dotenv').config()
const mysql = require('mysql2/promise')
const fs = require('fs')
const path = require('path')

async function runUpdate() {
  console.log('开始更新黄历数据库...')

  // 创建数据库连接
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'chronos_eye'
  })

  try {
    // 读取 SQL 文件
    const sqlPath = path.join(__dirname, 'update_almanac.sql')
    const sql = fs.readFileSync(sqlPath, 'utf-8')

    // 执行 SQL（分割成多个语句）
    const statements = sql.split(';').filter(s => s.trim())

    for (const statement of statements) {
      if (statement.trim()) {
        await connection.query(statement)
      }
    }

    console.log('黄历数据库更新成功！')
    console.log('已添加字段：五行、星宿、财神、福神、喜神、胎神、建除十二神、吉神宜趋、凶神宜忌、彭祖百忌、黄帝纪元')
  } catch (error) {
    console.error('更新失败:', error.message)
  } finally {
    await connection.end()
  }
}

runUpdate()
