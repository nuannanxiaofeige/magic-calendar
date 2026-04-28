/**
 * 为 constellation_match 表添加 sign1_name 和 sign2_name 列
 */

require('dotenv').config()
const mysql = require('mysql2/promise')

async function main() {
  console.log('正在连接数据库...')
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'chronos_eye'
  })

  try {
    console.log('数据库连接成功!')

    // 检查并添加 sign1_name 列
    try {
      await connection.execute(`
        ALTER TABLE constellation_match
        ADD COLUMN sign1_name VARCHAR(20) NOT NULL DEFAULT '' COMMENT '第一个星座中文名'
      `)
      console.log('✓ 添加 sign1_name 列成功')
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('- sign1_name 列已存在')
      } else {
        throw error
      }
    }

    // 检查并添加 sign2_name 列
    try {
      await connection.execute(`
        ALTER TABLE constellation_match
        ADD COLUMN sign2_name VARCHAR(20) NOT NULL DEFAULT '' COMMENT '第二个星座中文名'
      `)
      console.log('✓ 添加 sign2_name 列成功')
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('- sign2_name 列已存在')
      } else {
        throw error
      }
    }

    // 验证表结构
    const [columns] = await connection.query(`
      SHOW COLUMNS FROM constellation_match
    `)
    console.log('\n当前表结构:')
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type}`)
    })

  } catch (error) {
    console.error('执行失败:', error.message)
    throw error
  } finally {
    await connection.end()
  }
}

main().catch(console.error)
