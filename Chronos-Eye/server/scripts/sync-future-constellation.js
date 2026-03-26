/**
 * 星座运势同步脚本
 * 用法：
 *   node scripts/sync-future-constellation.js 4                    (同步未来 4 个月)
 *   node scripts/sync-future-constellation.js 2028-06              (同步到 2028 年 6 月)
 *   node scripts/sync-future-constellation.js 2027-07 2028-06      (同步指定日期范围)
 *   node scripts/sync-future-constellation.js --from 2027-07-13 --to 2028-06 --limit 500
 *   node scripts/sync-future-constellation.js --from 2027-07-13 --to 2028-06 --max-api 500
 */

require('dotenv').config()
const dayjs = require('dayjs')
const { syncMonthlyConstellation } = require('../src/services/scheduler')
const db = require('../src/config/database')

// 天行 API 每日限额（可根据实际情况调整）
const DEFAULT_MAX_API_CALLS = 500

async function syncFutureConstellation() {
  try {
    // 解析命令行参数
    const args = process.argv.slice(2)
    let startYear, startMonth, startDay
    let endYear, endMonth
    let maxApiCalls = DEFAULT_MAX_API_CALLS
    let usePositional = true

    // 支持 --from / --to / --max-api 参数
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--from' && args[i + 1]) {
        usePositional = false
        const fromDate = args[i + 1]
        const parts = fromDate.split('-').map(Number)
        startYear = parts[0]
        startMonth = parts[1]
        startDay = parts[2] || 1
        i++
      } else if (args[i] === '--to' && args[i + 1]) {
        usePositional = false
        const toDate = args[i + 1]
        const parts = toDate.split('-').map(Number)
        endYear = parts[0]
        endMonth = parts[1]
        i++
      } else if ((args[i] === '--limit' || args[i] === '--max-api') && args[i + 1]) {
        maxApiCalls = parseInt(args[i + 1])
        i++
      }
    }

    console.log('=== 星座运势数据同步 ===\n')

    // 初始化数据库
    console.log('1. 查询数据库最后一条数据的日期...')
    await db.initDatabase()

    // 查询数据库中最大的日期
    const [maxDateResult] = await db.query(
      'SELECT MAX(date) as max_date FROM constellation_fortune'
    )
    const maxDate = maxDateResult[0]?.max_date
    console.log(`   数据库中最后一条数据：${maxDate || '无数据'}`)

    // 如果使用了 --from 参数，则使用指定的开始日期
    if (!usePositional && startYear && startMonth) {
      console.log(`   使用指定的开始日期：${startYear}-${String(startMonth).padStart(2, '0')}-${String(startDay || 1).padStart(2, '0')}`)
    }

    // 如果没有使用 --from 参数，则从数据库最后日期的下个月开始同步
    let syncFromYear, syncFromMonth, syncFromDay = 1
    if (!startYear || !startMonth) {
      if (maxDate) {
        const lastDate = dayjs(maxDate)
        const nextMonth = lastDate.add(1, 'month')
        syncFromYear = nextMonth.year()
        syncFromMonth = nextMonth.month() + 1
        console.log(`   将从 ${syncFromYear}-${String(syncFromMonth).padStart(2, '0')} 开始同步\n`)
      } else {
        const now = dayjs()
        syncFromYear = now.year()
        syncFromMonth = now.month() + 1
        console.log(`   从当前月份开始：${syncFromYear}-${String(syncFromMonth).padStart(2, '0')}\n`)
      }
    } else {
      syncFromYear = startYear
      syncFromMonth = startMonth
      syncFromDay = startDay || 1
    }

    let months = []

    // 确定结束年月
    if (!endYear || !endMonth) {
      if (usePositional) {
        const arg1 = args[0]
        const arg2 = args[1]
        if (arg1 && arg1.includes('-') && !arg2) {
          // 指定结束年月
          [endYear, endMonth] = arg1.split('-').map(Number)
        } else if (arg2) {
          // 指定起止范围
          [endYear, endMonth] = arg2.split('-').map(Number)
        } else {
          // 默认同步未来 N 个月
          const monthsToSync = (arg1 && parseInt(arg1)) || 4
          const endDate = dayjs().add(monthsToSync - 1, 'month')
          endYear = endDate.year()
          endMonth = endDate.month() + 1
        }
      } else {
        // 默认到今年年底
        endYear = dayjs().year()
        endMonth = 12
      }
    }

    console.log(`同步目标：到 ${endYear}-${String(endMonth).padStart(2, '0')}`)
    console.log(`API 调用上限：${maxApiCalls} 次\n`)

    // 如果开始年月已经晚于结束年月，说明数据已经完整
    if (
      syncFromYear > endYear ||
      (syncFromYear === endYear && syncFromMonth > endMonth)
    ) {
      console.log('\n✓ 数据已完整，无需同步！')
      process.exit(0)
    }

    // 构建需要同步的月份列表
    let currentYear = syncFromYear
    let currentMonth = syncFromMonth

    while (
      currentYear < endYear ||
      (currentYear === endYear && currentMonth <= endMonth)
    ) {
      months.push({
        year: currentYear,
        month: currentMonth,
        // 如果是第一个月且指定了开始日期，则从指定日期开始
        startDay: (currentYear === syncFromYear && currentMonth === syncFromMonth) ? syncFromDay : 1
      })
      currentMonth++
      if (currentMonth > 12) {
        currentMonth = 1
        currentYear++
      }
    }

    console.log(`待同步月份：${months.length} 个月\n`)

    let totalSuccess = 0
    let totalCached = 0
    let totalApiCalls = 0
    let totalFail = 0
    let apiLimitReached = false

    // 逐月同步
    for (let i = 0; i < months.length; i++) {
      if (apiLimitReached) {
        console.log('\n   已达到 API 调用上限，停止同步')
        break
      }

      const { year, month, startDay } = months[i]
      const monthStr = `${year}-${String(month).padStart(2, '0')}`

      console.log(`\n${'='.repeat(50)}`)
      console.log(`[${i + 1}/${months.length}] 开始同步 ${monthStr} 的星座运势数据...`)

      const daysInMonth = dayjs(`${year}-${month}-01`).daysInMonth()
      const actualDays = startDay && startDay > 1 ? daysInMonth - startDay + 1 : daysInMonth
      console.log(`     数据量：${actualDays}天 × 12 星座 = ${actualDays * 12}条数据`)
      if (startDay && startDay > 1) {
        console.log(`     从 ${startDay} 日开始同步`)
      }

      // 计算剩余可用的 API 调用次数
      const remainingApiCalls = maxApiCalls - totalApiCalls
      console.log(`     剩余 API 配额：${remainingApiCalls} 次`)

      // 执行同步（传入 startDay 和 maxApiCalls 参数）
      const result = await syncMonthlyConstellation(year, month, startDay, remainingApiCalls)

      console.log(`\n   ${monthStr} 同步完成:`)
      console.log(`   - 新增数据：${result.success} 条`)
      console.log(`   - 缓存命中：${result.cached} 条`)
      console.log(`   - API 调用：${result.apiCalls} 次`)
      console.log(`   - 失败：${result.fail} 条`)

      totalSuccess += result.success
      totalCached += result.cached
      totalApiCalls += result.apiCalls
      totalFail += result.fail

      // 检查是否达到 API 调用上限
      if (totalApiCalls >= maxApiCalls) {
        console.log('\n   !!! 已达到 API 调用上限，停止同步')
        apiLimitReached = true
      }

      // 每个月之间暂停 2 秒，避免 API 频率超限
      if (i < months.length - 1 && !apiLimitReached) {
        console.log('\n   暂停 2 秒，避免 API 频率超限...')
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    console.log(`\n${'='.repeat(50)}`)
    console.log('\n=== 全部同步完成 ===')
    console.log(`同步月份数：${months.length}`)
    console.log(`总数据量：${totalSuccess + totalCached} 条`)
    console.log(`新增数据：${totalSuccess} 条`)
    console.log(`缓存命中：${totalCached} 条`)
    console.log(`API 调用：${totalApiCalls} 次`)
    console.log(`失败：${totalFail} 条`)

    if (months.length > 0) {
      const startMonth = `${months[0].year}-${String(months[0].month).padStart(2, '0')}`
      const endMonth = `${months[months.length - 1].year}-${String(months[months.length - 1].month).padStart(2, '0')}`
      console.log('\n提示：可以使用以下命令查询数据：')
      console.log(`SELECT COUNT(*) FROM constellation_fortune WHERE DATE_FORMAT(date, '%Y-%m') BETWEEN '${startMonth}' AND '${endMonth}';`)
    }

    process.exit(0)
  } catch (error) {
    console.error('\n同步失败:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

syncFutureConstellation()
