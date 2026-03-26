#!/usr/bin/env node
/**
 * 油价最新表迁移脚本
 * 用法：node scripts/migrate-oil-price-latest.js
 */

const path = require('path')
const fs = require('fs')
const { query, initDatabase } = require('../src/config/database')

async function migrate() {
  try {
    console.log('开始执行油价最新表迁移...\n')

    // 初始化数据库
    await initDatabase()

    // 1. 检查历史表是否有数据
    const historyCount = await query('SELECT COUNT(*) as count FROM oil_province_price')
    console.log(`[检查] 历史表数据量：${historyCount[0].count} 条`)

    if (historyCount[0].count === 0) {
      console.log('[跳过] 历史表为空，无需迁移')
      return
    }

    // 2. 执行迁移（从历史表同步最新数据到最新表）
    console.log('\n[迁移] 开始同步最新数据到最新表...')
    const result = await query(`
      INSERT INTO oil_province_price_latest (
        province, province_code,
        price_89, price_92, price_95, price_98, price_0,
        change_89, change_92, change_95, change_98, change_0,
        price_date, created_at, updated_at
      )
      SELECT
        p1.province, p1.province_code,
        p1.price_89, p1.price_92, p1.price_95, p1.price_98, p1.price_0,
        p1.change_89, p1.change_92, p1.change_95, p1.change_98, p1.change_0,
        p1.price_date, NOW(), NOW()
      FROM oil_province_price p1
      INNER JOIN (
        SELECT province_code, MAX(price_date) as max_date
        FROM oil_province_price
        GROUP BY province_code
      ) p2 ON p1.province_code = p2.province_code AND p1.price_date = p2.max_date
      ON DUPLICATE KEY UPDATE
        province = VALUES(province),
        price_89 = VALUES(price_89),
        price_92 = VALUES(price_92),
        price_95 = VALUES(price_95),
        price_98 = VALUES(price_98),
        price_0 = VALUES(price_0),
        change_89 = VALUES(change_89),
        change_92 = VALUES(change_92),
        change_95 = VALUES(change_95),
        change_98 = VALUES(change_98),
        change_0 = VALUES(change_0),
        price_date = VALUES(price_date),
        updated_at = NOW()
    `)

    console.log(`[迁移] 影响记录数：${result.affectedRows} 条`)

    // 3. 验证结果
    const latestCount = await query('SELECT COUNT(*) as count FROM oil_province_price_latest')
    console.log(`\n[验证] 最新表数据量：${latestCount[0].count} 条`)

    const dateStats = await query(`
      SELECT price_date, COUNT(*) as count
      FROM oil_province_price_latest
      GROUP BY price_date
      ORDER BY price_date DESC
    `)

    console.log('\n[数据分布]')
    dateStats.forEach(row => {
      console.log(`  ${row.price_date}: ${row.count} 条`)
    })

    console.log('\n迁移完成！')
    console.log('\n说明：')
    console.log('  - oil_province_price: 历史表，保留所有历史数据')
    console.log('  - oil_province_price_latest: 最新表，只保留每个省份的最新数据')
    console.log('  - 定时任务会自动同步历史表并刷新最新表')

  } catch (error) {
    console.error('迁移失败:', error)
    process.exit(1)
  } finally {
    process.exit(0)
  }
}

migrate()
