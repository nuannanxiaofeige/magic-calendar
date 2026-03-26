/**
 * 星座运势初始化脚本
 * 一次性获取并缓存当前月的所有星座运势数据
 *
 * 用法：
 * 1. 确保在 .env 文件中配置了 TIANAPI_KEY
 * 2. 确保数据库已启动
 * 3. 运行：node scripts/init-constellation.js
 */

require('dotenv').config()
const dayjs = require('dayjs')
const { syncMonthlyConstellation } = require('../src/services/scheduler')
const db = require('../src/config/database')

async function initConstellationData() {
  try {
    console.log('=== 星座运势数据初始化 ===\n')

    // 初始化数据库
    console.log('1. 初始化数据库连接...')
    await db.initDatabase()
    console.log('   数据库连接成功\n')

    // 获取当前月份
    const now = dayjs()
    const year = now.year()
    const month = now.month() + 1
    const monthStr = `${year}-${String(month).padStart(2, '0')}`

    console.log(`2. 开始同步 ${monthStr} 的星座运势数据...`)
    console.log(`   数据量：30 天 × 12 星座 = 约 360 条数据`)
    console.log(`   预计时间：约 ${360 * 0.2 / 60} 分钟（每次 API 调用延迟 200ms）\n`)

    // 执行同步
    const result = await syncMonthlyConstellation(year, month)

    console.log('\n=== 初始化完成 ===')
    console.log(`月份：${monthStr}`)
    console.log(`新增数据：${result.success} 条`)
    console.log(`缓存命中：${result.cached} 条`)
    console.log(`API 调用：${result.apiCalls} 次`)
    console.log(`失败：${result.fail} 条`)
    console.log('\n提示：可以使用以下命令查询数据：')
    console.log(`SELECT * FROM constellation_fortune WHERE date >= '${monthStr}-01' ORDER BY date, sign;`)

    process.exit(0)
  } catch (error) {
    console.error('\n初始化失败:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// 运行初始化
initConstellationData()
