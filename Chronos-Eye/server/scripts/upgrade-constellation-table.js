/**
 * 星座运势表升级脚本
 * 检查并添加周运、月运、年运字段
 *
 * 用法：node scripts/upgrade-constellation-table.js
 */

require('dotenv').config()
const db = require('./src/config/database')

// 需要添加的字段列表
const columnsToAdd = [
  // 周运字段
  { name: 'week_overall', sql: 'ALTER TABLE `constellation_fortune` ADD COLUMN `week_overall` INT DEFAULT 0 COMMENT \'周综合指数\' AFTER `summary`' },
  { name: 'week_love', sql: 'ALTER TABLE `constellation_fortune` ADD COLUMN `week_love` INT DEFAULT 0 COMMENT \'周爱情指数\' AFTER `week_overall`' },
  { name: 'week_work', sql: 'ALTER TABLE `constellation_fortune` ADD COLUMN `week_work` INT DEFAULT 0 COMMENT \'周工作指数\' AFTER `week_love`' },
  { name: 'week_wealth', sql: 'ALTER TABLE `constellation_fortune` ADD COLUMN `week_wealth` INT DEFAULT 0 COMMENT \'周财富指数\' AFTER `week_work`' },
  { name: 'week_health', sql: 'ALTER TABLE `constellation_fortune` ADD COLUMN `week_health` INT DEFAULT 0 COMMENT \'周健康指数\' AFTER `week_wealth`' },
  { name: 'week_summary', sql: 'ALTER TABLE `constellation_fortune` ADD COLUMN `week_summary` TEXT COMMENT \'周运势概述\' AFTER `week_health`' },
  { name: 'week_lucky_color', sql: 'ALTER TABLE `constellation_fortune` ADD COLUMN `week_lucky_color` VARCHAR(50) DEFAULT NULL COMMENT \'周幸运颜色\' AFTER `week_summary`' },
  { name: 'week_lucky_number', sql: 'ALTER TABLE `constellation_fortune` ADD COLUMN `week_lucky_number` INT DEFAULT NULL COMMENT \'周幸运数字\' AFTER `week_lucky_color`' },
  // 月运字段
  { name: 'month_overall', sql: 'ALTER TABLE `constellation_fortune` ADD COLUMN `month_overall` INT DEFAULT 0 COMMENT \'月综合指数\' AFTER `week_lucky_number`' },
  { name: 'month_love', sql: 'ALTER TABLE `constellation_fortune` ADD COLUMN `month_love` INT DEFAULT 0 COMMENT \'月爱情指数\' AFTER `month_overall`' },
  { name: 'month_work', sql: 'ALTER TABLE `constellation_fortune` ADD COLUMN `month_work` INT DEFAULT 0 COMMENT \'月工作指数\' AFTER `month_love`' },
  { name: 'month_wealth', sql: 'ALTER TABLE `constellation_fortune` ADD COLUMN `month_wealth` INT DEFAULT 0 COMMENT \'月财富指数\' AFTER `month_work`' },
  { name: 'month_health', sql: 'ALTER TABLE `constellation_fortune` ADD COLUMN `month_health` INT DEFAULT 0 COMMENT \'月健康指数\' AFTER `month_wealth`' },
  { name: 'month_summary', sql: 'ALTER TABLE `constellation_fortune` ADD COLUMN `month_summary` TEXT COMMENT \'月运势概述\' AFTER `month_health`' },
  { name: 'month_lucky_color', sql: 'ALTER TABLE `constellation_fortune` ADD COLUMN `month_lucky_color` VARCHAR(50) DEFAULT NULL COMMENT \'月幸运颜色\' AFTER `month_summary`' },
  { name: 'month_lucky_number', sql: 'ALTER TABLE `constellation_fortune` ADD COLUMN `month_lucky_number` INT DEFAULT NULL COMMENT \'月幸运数字\' AFTER `month_lucky_color`' },
  // 年运字段
  { name: 'year_overall', sql: 'ALTER TABLE `constellation_fortune` ADD COLUMN `year_overall` INT DEFAULT 0 COMMENT \'年综合指数\' AFTER `month_lucky_number`' },
  { name: 'year_love', sql: 'ALTER TABLE `constellation_fortune` ADD COLUMN `year_love` INT DEFAULT 0 COMMENT \'年爱情指数\' AFTER `year_overall`' },
  { name: 'year_work', sql: 'ALTER TABLE `constellation_fortune` ADD COLUMN `year_work` INT DEFAULT 0 COMMENT \'年工作指数\' AFTER `year_love`' },
  { name: 'year_wealth', sql: 'ALTER TABLE `constellation_fortune` ADD COLUMN `year_wealth` INT DEFAULT 0 COMMENT \'年财富指数\' AFTER `year_work`' },
  { name: 'year_health', sql: 'ALTER TABLE `constellation_fortune` ADD COLUMN `year_health` INT DEFAULT 0 COMMENT \'年健康指数\' AFTER `year_wealth`' },
  { name: 'year_summary', sql: 'ALTER TABLE `constellation_fortune` ADD COLUMN `year_summary` TEXT COMMENT \'年运势概述\' AFTER `year_health`' },
  // 其他字段
  { name: 'lucky_direction', sql: 'ALTER TABLE `constellation_fortune` ADD COLUMN `lucky_direction` VARCHAR(50) DEFAULT NULL COMMENT \'幸运方位\' AFTER `lucky_number`' },
  { name: 'yi', sql: 'ALTER TABLE `constellation_fortune` ADD COLUMN `yi` TEXT COMMENT \'宜\' AFTER `lucky_direction`' },
  { name: 'ji', sql: 'ALTER TABLE `constellation_fortune` ADD COLUMN `ji` TEXT COMMENT \'忌\' AFTER `yi`' }
]

async function upgradeTable() {
  try {
    console.log('=== 星座运势表升级 ===\n')

    // 初始化数据库
    await db.initDatabase()
    console.log('数据库连接成功\n')

    // 获取当前表结构
    const [columns] = await db.query('SHOW COLUMNS FROM constellation_fortune')
    const existingColumns = columns.map(col => col.Field)

    console.log('现有字段:', existingColumns.join(', '))
    console.log()

    let addedCount = 0
    let skippedCount = 0

    // 检查并添加缺失的字段
    for (const column of columnsToAdd) {
      if (existingColumns.includes(column.name)) {
        console.log(`跳过：${column.name} (已存在)`)
        skippedCount++
      } else {
        try {
          await db.query(column.sql)
          console.log(`添加：${column.name} (成功)`)
          addedCount++
        } catch (error) {
          console.error(`添加：${column.name} (失败：${error.message})`)
        }
      }
    }

    console.log(`\n=== 升级完成 ===`)
    console.log(`新增字段：${addedCount} 个`)
    console.log(`跳过字段：${skippedCount} 个`)

    process.exit(0)
  } catch (error) {
    console.error('升级失败:', error)
    process.exit(1)
  }
}

upgradeTable()
