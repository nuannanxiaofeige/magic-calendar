/**
 * 修复数据库缺失字段的脚本
 * 执行 add_missing_columns.sql 中的 ALTER TABLE 语句
 */

const mysql = require('mysql2/promise')
const fs = require('fs')
const path = require('path')

async function fixDatabaseColumns() {
  let connection

  try {
    // 连接数据库
    console.log('正在连接数据库...')
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || '47.102.152.82',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '_kIjZ9iVb@nt',
      database: process.env.DB_NAME || 'chronos_eye',
      multipleStatements: true // 允许执行多条 SQL 语句
    })

    console.log('数据库连接成功！')

    // 读取 SQL 文件
    const sqlPath = path.join(__dirname, '../sql/add_missing_columns.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8')

    // 分割 SQL 语句（按分号分隔）
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('USE '))

    console.log(`找到 ${statements.length} 条 SQL 语句需要执行`)

    // 逐条执行 ALTER TABLE 语句
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      try {
        await connection.execute(statement)
        console.log(`✓ 执行成功 (${i + 1}/${statements.length}): ${statement.substring(0, 60)}...`)
      } catch (err) {
        // 忽略 "列已存在" 的错误
        if (err.code === 'ER_DUP_FIELDNAME') {
          console.log(`- 列已存在，跳过 (${i + 1}/${statements.length})`)
        } else {
          throw err
        }
      }
    }

    // 验证字段是否添加成功
    console.log('\n验证表结构...')
    const [columns] = await connection.query(`
      SHOW COLUMNS FROM almanac_data
      WHERE Field IN ('lunar_festival', 'term', 'jieqi', 'solar_festival',
                      'year_na_yin', 'month_na_yin', 'day_na_yin', 'hour_na_yin',
                      'constellation', 'yue_ji')
    `)

    console.log('\n已添加的字段:')
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} (${col.Null})`)
    })

    if (columns.length === 10) {
      console.log('\n✅ 所有缺失字段已成功添加！')
    } else {
      console.log(`\n⚠️  只添加了 ${columns.length}/10 个字段，请检查是否有字段已存在`)
    }

  } catch (error) {
    console.error('❌ 执行失败:', error.message)
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
      console.log('\n数据库连接已关闭')
    }
  }
}

// 加载环境变量
const dotenv = require('dotenv')
const envPath = path.join(__dirname, '../.env')
dotenv.config({ path: envPath })

fixDatabaseColumns()
