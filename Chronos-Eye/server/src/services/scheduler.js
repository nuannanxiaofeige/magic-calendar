/**
 * 定时任务服务
 * 每月底自动调用天行 API 获取下月的农历、节假日数据
 * 每天凌晨自动获取 12 星座的当日运势数据
 */
const { query } = require('../config/database')
const tianapi = require('./tianapi')
const dayjs = require('dayjs')

/**
 * 同步指定年份的全年节假日和节气数据到数据库
 */
async function syncYearData(year) {
  try {
    if (!year) {
      // 如果没有指定年份，同步下一年全年数据
      year = dayjs().add(1, 'year').year()
    }

    console.log(`[定时任务] 开始同步 ${year}年 全年数据...`)

    let totalHolidays = 0
    let totalTerms = 0

    // 1. 获取全年节假日数据（一次 API 调用）
    console.log(`[定时任务] 获取 ${year}年 节假日数据...`)
    try {
      const holidayData = await tianapi.getHolidayInfo(year)
      if (holidayData && holidayData.length > 0) {
        await saveHolidayData(holidayData)
        totalHolidays = holidayData.length
        console.log(`  节假日：${holidayData.length} 条`)
      }
    } catch (error) {
      console.error(`  ${year}年节假日获取失败:`, error.message)
    }

    // 暂停 2 秒，避免 API 频率超限
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 2. 获取全年节气数据（24 次 API 调用）
    console.log(`[定时任务] 获取 ${year}年 节气数据...`)
    try {
      const termData = await tianapi.getTermInfo(year)
      if (termData && termData.length > 0) {
        await saveTermData(termData, year)
        totalTerms = termData.length
        console.log(`  节气：${termData.length} 条`)
      }
    } catch (error) {
      console.error(`  ${year}年节气获取失败:`, error.message)
    }

    console.log(`[定时任务] ${year}年 数据同步完成，共 ${totalHolidays} 条节假日，${totalTerms} 条节气`)
    return true
  } catch (error) {
    console.error('[定时任务] 同步数据失败:', error)
    throw error
  }
}

/**
 * 保存节假日数据到数据库
 */
async function saveHolidayData(holidayData, year) {
  let insertCount = 0
  let updateCount = 0
  let deleteCount = 0

  // 先删除该年份的现有节假日数据（保留农历和公历节日）
  const deleteResult = await query(
    'DELETE FROM holidays WHERE year = ? AND type = ?',
    [year, 'festival']
  )
  deleteCount = deleteResult.affectedRows || 0
  console.log(`  已删除 ${deleteCount} 条 ${year} 年的旧节假日数据`)

  for (const holiday of holidayData) {
    // 验证日期格式
    const dateStr = holiday.date
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      console.warn(`[跳过] 无效的日期格式：${dateStr}`, holiday)
      continue
    }

    const dateObj = new Date(dateStr)
    const month = dateObj.getMonth() + 1
    const day = dateObj.getDate()
    const weekday = dateObj.getDay()

    // 检查是否已存在
    const existing = await query(
      'SELECT id FROM holidays WHERE date_full = ?',
      [dateStr]
    )

    if (existing.length === 0) {
      // 插入新数据
      await query(`
        INSERT INTO holidays (
          holiday_str, name, date_full, type,
          date_month, date_day,
          is_official, is_rest, is_work,
          vacation_dates, work_dates, wage_dates,
          tip, rest_tip,
          start, end, now,
          year, is_active, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())
      `, [
        holiday.holiday || '',
        holiday.name,
        dateStr,
        'festival',
        month,
        day,
        holiday.name !== '调休上班' ? 1 : 0,
        holiday.rest,
        holiday.work,
        holiday.vacation_dates || '',
        holiday.work_dates || '',
        holiday.wage_dates || '',
        holiday.tip || '',
        holiday.rest_tip || '',
        holiday.start || 0,
        holiday.end || 0,
        holiday.now || 0,
        year
      ])
      insertCount++
    } else {
      // 更新现有数据
      await query(`
        UPDATE holidays SET
          holiday_str = ?, name = ?, type = ?,
          date_month = ?, date_day = ?,
          is_official = ?, is_rest = ?, is_work = ?,
          vacation_dates = ?, work_dates = ?, wage_dates = ?,
          tip = ?, rest_tip = ?,
          start = ?, end = ?, now = ?,
          year = ?, updated_at = NOW()
        WHERE date_full = ?
      `, [
        holiday.holiday || '',
        holiday.name,
        'festival',
        month,
        day,
        holiday.name !== '调休上班' ? 1 : 0,
        holiday.rest,
        holiday.work,
        holiday.vacation_dates || '',
        holiday.work_dates || '',
        holiday.wage_dates || '',
        holiday.tip || '',
        holiday.rest_tip || '',
        holiday.start || 0,
        holiday.end || 0,
        holiday.now || 0,
        year,
        dateStr
      ])
      updateCount++
    }
  }

  console.log(`[保存节假日] 新增 ${insertCount} 条，更新 ${updateCount} 条`)
}

/**
 * 保存节气数据到数据库
 */
async function saveTermData(termData, year) {
  for (const term of termData) {
    // 检查是否已存在
    const existing = await query(
      'SELECT id FROM almanac_term_dates WHERE term_name = ? AND year = ?',
      [term.name, year]
    )

    if (existing.length === 0) {
      // 插入新数据
      await query(`
        INSERT INTO almanac_term_dates (
          year, term_name, term_order, date, time, week, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW())
      `, [
        year,
        term.name,
        term.order || 0,
        term.date,
        term.time || '00:00',
        term.week || 0
      ])
    } else {
      // 更新现有数据
      await query(`
        UPDATE almanac_term_dates SET
          term_order = ?, date = ?, time = ?, week = ?, updated_at = NOW()
        WHERE term_name = ? AND year = ?
      `, [
        term.order || 0,
        term.date,
        term.time || '00:00',
        term.week || 0,
        term.name,
        year
      ])
    }
  }
}

/**
 * 检查是否是月底（每月 25 日及以后）
 */
function isEndOfMonth() {
  const today = dayjs().date()
  return today >= 25 // 每月 25 日执行
}

/**
 * 启动定时任务检查
 * 每天检查一次，如果是月底则执行同步
 */
function startScheduler() {
  // 每天凌晨 2 点检查
  const checkInterval = 24 * 60 * 60 * 1000 // 24 小时
  const checkTime = 2 * 60 * 60 * 1000 // 凌晨 2 点

  // 计算到明天凌晨 2 点的时间
  const now = Date.now()
  const tomorrow2am = new Date()
  tomorrow2am.setDate(tomorrow2am.getDate() + 1)
  tomorrow2am.setHours(2, 0, 0, 0)
  const firstDelay = tomorrow2am.getTime() - now

  console.log(`[定时任务] 将在 ${Math.floor(firstDelay / 1000 / 60)} 分钟后开始检查`)

  // 首次检查
  setTimeout(() => {
    checkAndSync()
    // 之后每 24 小时检查一次
    setInterval(checkAndSync, checkInterval)
  }, firstDelay)
}

/**
 * 检查并执行同步
 */
async function checkAndSync() {
  const today = dayjs()
  console.log(`[定时任务] 检查是否执行同步，当前日期：${today.format('YYYY-MM-DD')}`)

  // 如果是每月 25 日及以后，执行同步
  if (isEndOfMonth()) {
    console.log('[定时任务] 检测到月底，开始执行数据同步')
    // 每月底同步下一年全年数据
    const nextYear = dayjs().add(1, 'year').year()
    await syncYearData(nextYear)
  } else {
    console.log('[定时任务] 非月底，跳过同步')
  }
}

/**
 * 手动触发同步（用于测试或立即执行）
 */
async function manualSync(year) {
  try {
    let targetYear

    if (!year) {
      // 如果没有指定年份，默认同步下一年全年数据
      targetYear = dayjs().add(1, 'year').year()
    } else {
      targetYear = parseInt(year)
    }

    console.log(`[手动同步] 开始同步 ${targetYear}年 全年数据...`)

    // 调用全年同步函数
    await syncYearData(targetYear)

    console.log(`[手动同步] ${targetYear}年 数据同步完成`)
    return true
  } catch (error) {
    console.error('[手动同步] 同步数据失败:', error)
    throw error
  }
}

/**
 * 同步 12 星座的当月运势数据到数据库（每月执行一次）
 * 每月初获取整个月的运势数据，避免每天调用 API
 * @param {number} year - 年份
 * @param {number} month - 月份
 * @param {number} startDay - 从该月的哪一天开始（默认为 1，即整月同步）
 * @param {number} maxApiCalls - 最大 API 调用次数限制（默认为 0，即不限制）
 */
async function syncMonthlyConstellation(year, month, startDay = 1, maxApiCalls = 0) {
  try {
    // 如果没有指定年月，默认为当前月份
    if (!year || !month) {
      const now = dayjs()
      year = now.year()
      month = now.month() + 1 // dayjs 月份从 0 开始
    }

    const monthStr = `${year}-${String(month).padStart(2, '0')}`
    console.log(`[定时任务] 开始同步 ${monthStr} 星座运势数据...`)

    // 获取该月的所有日期
    const daysInMonth = dayjs(`${year}-${month}-01`).daysInMonth()
    const dates = []
    for (let d = startDay; d <= daysInMonth; d++) {
      dates.push(dayjs(`${year}-${month}-${d}`).format('YYYY-MM-DD'))
    }

    // 12 星座列表
    const signs = [
      'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
      'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'
    ]

    let successCount = 0
    let failCount = 0
    let apiCallCount = 0

    // 遍历每一天和每个星座
    for (const dateStr of dates) {
      for (const sign of signs) {
        try {
          // 检查是否已存在该日期的数据
          const [existing] = await query(
            'SELECT id FROM constellation_fortune WHERE date = ? AND sign = ?',
            [dateStr, sign]
          )

          if (existing && existing.length > 0) {
            // 已有数据，跳过
            continue
          }

          // 从天行 API 获取运势数据（包含周运、月运、年运）
          const fortune = await tianapi.getFullConstellationFortune(sign, dateStr)

          if (fortune) {
            await saveConstellationFortune(fortune, dateStr)
            successCount++
          } else {
            failCount++
          }

          apiCallCount++

          // 检查是否达到 API 调用上限
          if (maxApiCalls > 0 && apiCallCount >= maxApiCalls) {
            console.log(`  ${dateStr} ${sign}: 已达到 API 调用上限 (${apiCallCount} 次)，停止同步`)
            // 返回当前结果
            const totalNeeded = dates.length * signs.length
            const cachedCount = totalNeeded - apiCallCount
            console.log(`[定时任务] ${monthStr} 星座运势同步完成（达到 API 上限）`)
            console.log(`  总数据量：${totalNeeded} 条`)
            console.log(`  新增：${successCount} 条`)
            console.log(`  缓存命中：${cachedCount} 条`)
            console.log(`  API 调用：${apiCallCount} 次`)
            console.log(`  失败：${failCount} 条`)
            return { success: successCount, fail: failCount, cached: cachedCount, apiCalls: apiCallCount, limitReached: true }
          }

          console.log(`  ${dateStr} ${sign}: ${fortune ? '成功' : '失败'} (API 调用：${apiCallCount})`)

          // 每次 API 调用后延迟 200ms，避免频率超限
          await new Promise(resolve => setTimeout(resolve, 200))
        } catch (error) {
          failCount++
          console.error(`  ${dateStr} ${sign}: 保存失败 - ${error.message}`)
        }
      }
    }

    const totalNeeded = dates.length * signs.length
    const cachedCount = totalNeeded - apiCallCount

    console.log(`[定时任务] ${monthStr} 星座运势同步完成`)
    console.log(`  总数据量：${totalNeeded} 条`)
    console.log(`  新增：${successCount} 条`)
    console.log(`  缓存命中：${cachedCount} 条`)
    console.log(`  API 调用：${apiCallCount} 次`)
    console.log(`  失败：${failCount} 条`)

    return { success: successCount, fail: failCount, cached: cachedCount, apiCalls: apiCallCount, limitReached: false }
  } catch (error) {
    console.error('[定时任务] 同步星座运势失败:', error)
    throw error
  }
}

/**
 * 保存星座运势数据到数据库（包含今日、周运、月运、年运）
 */
async function saveConstellationFortune(fortune, dateStr) {
  const signMap = tianapi.constellationMap || {}
  const signName = signMap[fortune.sign] || fortune.sign

  await query(`
    INSERT INTO constellation_fortune (
      date, sign, sign_name,
      overall, love, work, wealth, health,
      lucky_color, lucky_number, lucky_direction, match_sign,
      summary, yi, ji,
      week_overall, week_love, week_work, week_wealth, week_health, week_summary, week_lucky_color, week_lucky_number,
      month_overall, month_love, month_work, month_wealth, month_health, month_summary, month_lucky_color, month_lucky_number,
      year_overall, year_love, year_work, year_wealth, year_health, year_summary
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      overall = VALUES(overall),
      love = VALUES(love),
      work = VALUES(work),
      wealth = VALUES(wealth),
      health = VALUES(health),
      lucky_color = VALUES(lucky_color),
      lucky_number = VALUES(lucky_number),
      lucky_direction = VALUES(lucky_direction),
      match_sign = VALUES(match_sign),
      summary = VALUES(summary),
      yi = VALUES(yi),
      ji = VALUES(ji),
      week_overall = VALUES(week_overall),
      week_love = VALUES(week_love),
      week_work = VALUES(week_work),
      week_wealth = VALUES(week_wealth),
      week_health = VALUES(week_health),
      week_summary = VALUES(week_summary),
      week_lucky_color = VALUES(week_lucky_color),
      week_lucky_number = VALUES(week_lucky_number),
      month_overall = VALUES(month_overall),
      month_love = VALUES(month_love),
      month_work = VALUES(month_work),
      month_wealth = VALUES(month_wealth),
      month_health = VALUES(month_health),
      month_summary = VALUES(month_summary),
      month_lucky_color = VALUES(month_lucky_color),
      month_lucky_number = VALUES(month_lucky_number),
      year_overall = VALUES(year_overall),
      year_love = VALUES(year_love),
      year_work = VALUES(year_work),
      year_wealth = VALUES(year_wealth),
      year_health = VALUES(year_health),
      year_summary = VALUES(year_summary),
      updated_at = CURRENT_TIMESTAMP
  `, [
    dateStr,
    fortune.sign,
    signName,
    fortune.overall || 0,
    fortune.love || 0,
    fortune.work || 0,
    fortune.wealth || 0,
    fortune.health || 0,
    fortune.lucky_color || null,
    fortune.lucky_number || 0,
    fortune.lucky_direction || null,
    fortune.match_sign || null,
    fortune.summary || null,
    fortune.yi || null,
    fortune.ji || null,
    // 周运
    fortune.week_overall || 0,
    fortune.week_love || 0,
    fortune.week_work || 0,
    fortune.week_wealth || 0,
    fortune.week_health || 0,
    fortune.week_summary || null,
    fortune.week_lucky_color || null,
    fortune.week_lucky_number || 0,
    // 月运
    fortune.month_overall || 0,
    fortune.month_love || 0,
    fortune.month_work || 0,
    fortune.month_wealth || 0,
    fortune.month_health || 0,
    fortune.month_summary || null,
    fortune.month_lucky_color || null,
    fortune.month_lucky_number || 0,
    // 年运
    fortune.year_overall || 0,
    fortune.year_love || 0,
    fortune.year_work || 0,
    fortune.year_wealth || 0,
    fortune.year_health || 0,
    fortune.year_summary || null
  ])
}

/**
 * 检查是否是月初（每月 1-3 日）
 */
function isStartOfMonth() {
  const today = dayjs().date()
  return today >= 1 && today <= 3 // 每月 1-3 日执行
}

/**
 * 启动定时任务检查
 * 每天检查一次，如果是月底则执行农历/节假日同步
 * 每月初（1-3 日）同步当月星座运势
 */
function startScheduler() {
  // 每天凌晨 2 点检查
  const checkInterval = 24 * 60 * 60 * 1000 // 24 小时

  // 计算到明天凌晨 2 点的时间
  const now = Date.now()
  const tomorrow2am = new Date()
  tomorrow2am.setDate(tomorrow2am.getDate() + 1)
  tomorrow2am.setHours(2, 0, 0, 0)
  const firstDelay = tomorrow2am.getTime() - now

  console.log(`[定时任务] 将在 ${Math.floor(firstDelay / 1000 / 60)} 分钟后开始检查`)

  // 首次检查
  setTimeout(() => {
    checkAndSync()
    // 之后每 24 小时检查一次
    setInterval(checkAndSync, checkInterval)
  }, firstDelay)

  // 每月初凌晨 3 点同步星座运势
  const constellationDelay = tomorrow2am.getTime() - now + 60 * 60 * 1000 // 2 点 +1 小时 = 3 点
  console.log(`[定时任务] 星座运势同步将在 ${Math.floor(constellationDelay / 1000 / 60)} 分钟后开始`)

  setTimeout(async () => {
    await checkAndSyncConstellation()
    // 之后每天凌晨 3 点检查一次（但只在月初 1-3 日执行）
    setInterval(async () => {
      await checkAndSyncConstellation()
    }, checkInterval)
  }, constellationDelay)
}

/**
 * 检查并执行星座运势同步
 * 只在每月初（1-3 日）执行，同步整月数据
 */
async function checkAndSyncConstellation() {
  const today = dayjs()
  const dateStr = today.format('YYYY-MM-DD')
  console.log(`[定时任务] 检查星座运势同步，当前日期：${dateStr}`)

  if (isStartOfMonth()) {
    console.log('[定时任务] 检测到月初，开始同步当月星座运势')
    const year = today.year()
    const month = today.month() + 1
    await syncMonthlyConstellation(year, month)
  } else {
    console.log('[定时任务] 非月初，跳过星座运势同步')
  }
}

/**
 * 油价数据同步任务
 * 每 6 小时执行一次（每天 4 次：00:00, 06:00, 12:00, 18:00）
 */
async function syncOilPriceData() {
  try {
    const oilPriceSync = require('./oil-price-sync')
    console.log(`[定时任务] 开始执行油价数据同步，当前日期：${new Date().toISOString()}`)
    const result = await oilPriceSync.syncAllOilData()
    console.log(`[定时任务] 油价数据同步完成：`, result)
    return result
  } catch (error) {
    console.error('[定时任务] 油价数据同步失败:', error)
    throw error
  }
}

/**
 * 清理指定天数前的历史油价数据
 * @param {number} keepDays - 保留的天数，默认 90 天
 */
async function cleanupOldOilPriceData(keepDays = 90) {
  try {
    const { query } = require('../config/database')
    console.log(`[清理任务] 开始清理 ${keepDays} 天前的油价历史数据...`)

    const result = await query(`
      DELETE FROM oil_province_price
      WHERE price_date < DATE_SUB(CURDATE(), INTERVAL ? DAY)
    `, [keepDays])

    console.log(`[清理任务] 已删除 ${result.affectedRows} 条历史记录`)
    return { success: true, deleted: result.affectedRows }
  } catch (error) {
    console.error('[清理任务] 清理历史数据失败:', error)
    throw error
  }
}

/**
 * 启动油价同步定时任务
 * 每 6 小时执行一次（00:00, 06:00, 12:00, 18:00）
 */
function startOilPriceScheduler() {
  const interval = 6 * 60 * 60 * 1000 // 6 小时

  // 计算到下一个整点（00:00, 06:00, 12:00, 18:00）的时间
  const now = new Date()
  const nextSync = new Date(now)

  // 设置到下一个 6 小时整点
  const currentHour = now.getHours()
  const nextHour = Math.floor(currentHour / 6) * 6 + 6 // 下一个 6 小时倍数

  if (nextHour >= 24) {
    // 如果超过 24 点，设置为明天的 00:00
    nextSync.setDate(nextSync.getDate() + 1)
    nextSync.setHours(0, 0, 0, 0)
  } else {
    nextSync.setHours(nextHour, 0, 0, 0)
  }

  const firstDelay = nextSync.getTime() - now.getTime()

  console.log(`[定时任务] 油价同步将在 ${Math.floor(firstDelay / 1000 / 60)} 分钟后首次执行`)
  console.log(`[定时任务] 下次执行时间：${nextSync.toLocaleString('zh-CN')}`)
  console.log(`[定时任务] 之后每 6 小时执行一次（00:00, 06:00, 12:00, 18:00）`)

  // 首次执行
  setTimeout(() => {
    syncOilPriceData()
    // 之后每 6 小时执行一次
    setInterval(() => {
      syncOilPriceData()
    }, interval)
  }, firstDelay)
}

/**
 * 清理指定天数前的每日日记缓存
 * @param {number} keepDays - 保留的天数，默认 30 天
 */
async function cleanupOldDiaryCache(keepDays = 30) {
  try {
    const { query } = require('../config/database')
    console.log(`[清理任务] 开始清理 ${keepDays} 天前的每日日记缓存...`)

    const result = await query(`
      DELETE FROM daily_diary_cache
      WHERE date < DATE_SUB(CURDATE(), INTERVAL ? DAY)
    `, [keepDays])

    console.log(`[清理任务] 已删除 ${result.affectedRows} 条每日日记缓存`)
    return { success: true, deleted: result.affectedRows }
  } catch (error) {
    console.error('[清理任务] 清理每日日记缓存失败:', error)
    throw error
  }
}

module.exports = {
  startScheduler,
  manualSync,
  syncYearData,
  syncMonthlyConstellation,
  checkAndSyncConstellation,
  syncOilPriceData,
  cleanupOldOilPriceData,
  cleanupOldDiaryCache,
  startOilPriceScheduler
}
