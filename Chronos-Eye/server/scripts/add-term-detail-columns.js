/**
 * 为 almanac_term_dates 表添加详情字段的执行脚本
 */

require('dotenv').config()
const mysql = require('mysql2/promise')

async function main() {
  try {
    console.log('正在连接数据库...\n')

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'chronos_eye'
    })

    console.log('数据库连接成功')

    // 检查现有字段
    const [columns] = await connection.query('SHOW COLUMNS FROM almanac_term_dates')
    console.log('\n现有表结构:')
    columns.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null} ${col.Key} ${col.Default ? '= ' + col.Default : ''}`)
    })

    const existingColumns = columns.map(c => c.Field.toLowerCase())

    // 找到 term_order 字段位置，在它之后添加新字段
    const lastField = columns.length > 0 ? columns[columns.length - 1].Field : 'term_order'

    // 要添加的字段列表 - 不使用 AFTER 子句
    const columnsToAdd = [
      { name: 'yiji', type: "TEXT", comment: '节气宜忌' },
      { name: 'shiju', type: "VARCHAR(500)", comment: '节气诗句' },
      { name: 'xishu', type: "TEXT", comment: '节气习俗' },
      { name: 'meishi', type: "TEXT", comment: '节气美食' },
      { name: 'jieshao', type: "TEXT", comment: '节气介绍' },
      { name: 'yuanyin', type: "VARCHAR(255)", comment: '节气原因/由来' },
      { name: 'day', type: "VARCHAR(50)", comment: '日期范围' },
      { name: 'cnday', type: "VARCHAR(20)", comment: '农历日' },
      { name: 'cnyear', type: "VARCHAR(20)", comment: '农历年' },
      { name: 'cnmonth', type: "VARCHAR(20)", comment: '农历月' },
      { name: 'cnzodiac', type: "VARCHAR(10)", comment: '农历生肖' },
      { name: 'gregdate', type: "DATE", comment: '公历日期' },
      { name: 'lunardate', type: "VARCHAR(50)", comment: '农历日期' },
      { name: 'nameimg', type: "VARCHAR(100)", comment: '节气图文件名' }
    ]

    let addedCount = 0
    let skipCount = 0

    console.log('\n正在添加字段...\n')

    for (const col of columnsToAdd) {
      if (existingColumns.includes(col.name.toLowerCase())) {
        console.log(`  跳过：${col.name} (已存在)`)
        skipCount++
      } else {
        const sql = `ALTER TABLE almanac_term_dates ADD COLUMN ${col.name} ${col.type} COMMENT '${col.comment}'`
        try {
          await connection.query(sql)
          console.log(`  添加：${col.name} ✓`)
          addedCount++
          existingColumns.push(col.name.toLowerCase())
        } catch (err) {
          console.error(`  失败：${col.name} - ${err.message}`)
        }
      }
    }

    // 添加索引
    console.log('\n正在添加索引...')
    try {
      await connection.query('ALTER TABLE almanac_term_dates ADD INDEX IF NOT EXISTS idx_term_name (term_name)')
      console.log('  索引 idx_term_name 添加成功 ✓')
    } catch (err) {
      if (err.code === 'ER_DUP_KEY') {
        console.log('  索引 idx_term_name 已存在 ✓')
      } else {
        console.error(`  索引添加失败：${err.message}`)
      }
    }

    console.log(`\n完成！新增 ${addedCount} 个字段，跳过 ${skipCount} 个字段`)

    await connection.end()
    process.exit(0)
  } catch (error) {
    console.error('执行失败:', error.message)
    process.exit(1)
  }
}

main()
