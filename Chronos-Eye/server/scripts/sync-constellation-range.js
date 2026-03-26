/**
 * 星座运势同步脚本 - 指定年月范围
 * 同步指定年月范围内的星座运势数据
 * 用法：node scripts/sync-constellation-range.js [start-ym] [end-ym]
 * 示例：node scripts/sync-constellation-range.js 2027-03 2027-06
 *       node scripts/sync-constellation-range.js 2027-03 (同步单月)
 */

require('dotenv').config()
const dayjs = require('dayjs')
const { syncMonthlyConstellation } = require('../src/services/scheduler')
const db = require('../src/config/database')

async function syncConstellationRange() {
  try {
    // 获取命令行参数
    const startYm = process.argv[2]
    const endYm = process.argv[3]

    if (!startYm) {
      console.error('用法：node scripts/sync-constellation-range.js [start-ym] [end-ym]')
      console.error('示例：node scripts/sync-constellation-range.js 2027-03 2027-06')
      process.exit(1)
    }

    console.log('=== 星座运势数据同步（指定范围）===\n')

    // 初始化数据库
    console.log('1. 初始化数据库连接...')
    await db.initDatabase()
    console.log('   数据库连接成功\n')

    // 解析起始和结束年月
    const [startYear, startMonth] = startYm.split('-').map(Number)
    let [endYear, endMonth] = endYm ? endYm.split('-').map(Number) : [startYear, startMonth]

    const startDate = dayjs(`${startYear}-${startMonth}-01`)
    const endDate = dayjs(`${endYear}-${endMonth}-01`)

    // 计算需要同步的月份数
    const monthsToSync = endDate.diff(startDate, 'month') + 1

    console.log(`开始同步 ${startYm} 至 ${endYm || startYm} 的星座运势数据...`)
    console.log(`同步月份数：${monthsToSync}\n`)

    let totalSuccess = 0
    let totalCached = 0
    let totalApiCalls = 0
    let totalFail = 0

    // 同步指定范围内的每个月
    for (let i = 0; i < monthsToSync; i++) {
      const targetDate = startDate.add(i, 'month')
      const year = targetDate.year()
      const month = targetDate.month() + 1
      const monthStr = `${year}-${String(month).padStart(2, '0')}`

      console.log(`${'='.repeat(50)}`)
      console.log(`同步 ${monthStr} ...`)

      const daysInMonth = targetDate.daysInMonth()
      console.log(`数据量：${daysInMonth}天 × 12 星座 = ${daysInMonth * 12}条数据`)

      // 执行同步
      const result = await syncMonthlyConstellation(year, month)

      console.log(`\n${monthStr} 同步完成:`)
      console.log(`  - 新增：${result.success} 条`)
      console.log(`  - 缓存：${result.cached} 条`)
      console.log(`  - API：${result.apiCalls} 次`)
      console.log(`  - 失败：${result.fail} 条`)

      totalSuccess += result.success
      totalCached += result.cached
      totalApiCalls += result.apiCalls
      totalFail += result.fail

      // 每个月之间暂停 2 秒
      if (i < monthsToSync - 1) {
        console.log('\n暂停 2 秒，避免 API 频率超限...')
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    console.log(`\n${'='.repeat(50)}`)
    console.log('\n=== 同步完成 ===')
    console.log(`同步范围：${startYm} 至 ${endYm || startYm}`)
    console.log(`同步月份数：${monthsToSync}`)
    console.log(`总数据量：${totalSuccess + totalCached} 条`)
    console.log(`新增数据：${totalSuccess} 条`)
    console.log(`缓存命中：${totalCached} 条`)
    console.log(`API 调用：${totalApiCalls} 次`)
    console.log(`失败：${totalFail} 条`)

    process.exit(0)
  } catch (error) {
    console.error('\n同步失败:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

syncConstellationRange()
