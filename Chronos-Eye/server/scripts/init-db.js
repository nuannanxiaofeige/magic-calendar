/**
 * 数据库初始化脚本
 * 连接 MySQL 并执行 init.sql 中的所有语句
 */

require('dotenv').config()
const mysql = require('mysql2/promise')
const fs = require('fs')
const path = require('path')

async function initDatabase() {
  const mysqlConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true // 允许执行多条 SQL 语句
  }

  let connection

  try {
    console.log('正在连接 MySQL 数据库...')
    console.log(`主机：${mysqlConfig.host}:${mysqlConfig.port}`)
    console.log(`用户：${mysqlConfig.user}`)
    console.log(`数据库：${process.env.DB_NAME || 'chronos_eye'}`)
    console.log('')

    // 先连接到 MySQL 服务器（不指定数据库）
    connection = await mysql.createConnection(mysqlConfig)
    console.log('✓ MySQL 连接成功')

    // 读取 init.sql 文件
    const sqlPath = path.join(__dirname, '../sql/init.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    console.log(`✓ 读取 SQL 文件：${sqlPath}`)

    // 创建数据库（如果不存在）
    const dbName = process.env.DB_NAME || 'chronos_eye'
    console.log(`\n正在创建数据库：${dbName}...`)
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName} DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`)
    console.log(`✓ 数据库 ${dbName} 创建成功`)

    // 切换到目标数据库
    await connection.query(`USE ${dbName}`)
    console.log(`✓ 已切换到数据库 ${dbName}\n`)

    // 执行 SQL 文件内容
    console.log('正在执行 SQL 脚本...')
    console.log('  - 创建数据表...')
    console.log('  - 插入节假日数据...')
    console.log('  - 插入黄历数据...')
    console.log('  - 插入历史事件数据...')
    console.log('')

    await connection.query(sqlContent)

    console.log('✓ 所有 SQL 语句执行成功\n')

    // 验证数据
    console.log('验证数据...')
    const [tables] = await connection.query(`SHOW TABLES`)
    const tableNames = tables.map(row => Object.values(row)[0])

    console.log(`\n✓ 已创建 ${tableNames.length} 张表:`)
    for (const tableName of tableNames) {
      const [info] = await connection.query(`SHOW TABLE STATUS LIKE '${tableName}'`)
      const comment = info[0]?.Comment || ''
      console.log(`  - ${tableName}: ${comment}`)
    }

    // 统计各表数据量
    console.log('\n数据统计:')
    for (const tableName of tableNames) {
      const [rows] = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`)
      console.log(`  - ${tableName}: ${rows[0].count} 条记录`)
    }

    console.log('\n========================================')
    console.log('数据库初始化完成!')
    console.log('========================================\n')

  } catch (error) {
    console.error('\n❌ 数据库初始化失败:', error.message)
    console.error('\n请检查:')
    console.error('  1. MySQL 服务是否已启动')
    console.error('  2. .env 文件中的数据库配置是否正确')
    console.error('  3. 用户名和密码是否正确')
    console.error('  4. 是否有创建数据库的权限')
    console.error('')
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
      console.log('数据库连接已关闭')
    }
  }
}

// 运行初始化
initDatabase()
