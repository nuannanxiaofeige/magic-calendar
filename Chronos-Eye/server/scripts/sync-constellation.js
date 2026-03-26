/**
 * 星座运势同步脚本
 * 手动同步指定月份的星座运势数据
 * 用法：node scripts/sync-constellation.js [year-month]
 * 示例：node scripts/sync-constellation.js 2026-03
 *       node scripts/sync-constellation.js (默认为当前月份)
 */

require('dotenv').config()
const dayjs = require('dayjs')
const { syncMonthlyConstellation } = require('./src/services/scheduler')
const db = require('./src/config/database')

async function syncConstellation() {
  try {
    // 获取命令行参数中的年月
    const ymArg = process.argv[2]
    let year, month

    if (ymArg) {
      // 解析 YYYY-MM 格式
      const parts = ymArg.split('-')
      year = parseInt(parts[0])
      month = parseInt(parts[1])
    } else {
      // 默认为当前月份
      const now = dayjs()
      year = now.year()
      month = now.month() + 1
    }

    console.log(`开始同步 ${year}-${String(month).padStart(2, '0')} 的星座运势数据...\n`)

    // 初始化数据库
    await db.initDatabase()

    // 执行同步
    const result = await syncMonthlyConstellation(year, month)

    console.log('\n同步完成!')
    console.log(`新增：${result.success} 条`)
    console.log(`缓存命中：${result.cached} 条`)
    console.log(`API 调用：${result.apiCalls} 次`)
    console.log(`失败：${result.fail} 条`)

    process.exit(0)
  } catch (error) {
    console.error('同步失败:', error)
    process.exit(1)
  }
}

syncConstellation()
