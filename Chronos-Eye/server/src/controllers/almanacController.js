const { query } = require('../config/database')
const dayjs = require('dayjs')
const { AstronomicalCalculator, SOLAR_TERMS } = require('../../scripts/sync-astronomical-data')

// 获取今日节气信息
async function getTodayTermInfo(date = new Date()) {
  try {
    const today = dayjs(date).format('YYYY-MM-DD')

    // 从数据库查询今日节气信息
    const [terms] = await query(`
      SELECT term_name, date, time
      FROM almanac_term_dates
      WHERE year = YEAR(?) AND date <= ?
      ORDER BY date DESC
      LIMIT 2
    `, [today, today])

    if (terms.length === 0) {
      // 使用计算器实时计算
      const { SolarTermCalculator } = require('../utils/calendar')
      return SolarTermCalculator.getTodayTerm(date)
    }

    const currentTerm = terms[0]
    const nextTerm = terms.length > 1 ? terms[1] : null

    // 计算下一个节气
    let nextTermInfo = null
    if (nextTerm) {
      const daysLeft = dayjs(nextTerm.date).diff(dayjs(today), 'day')
      nextTermInfo = {
        name: nextTerm.term_name,
        date: nextTerm.date,
        daysLeft: daysLeft
      }
    }

    return {
      current: {
        name: currentTerm.term_name,
        date: currentTerm.date
      },
      next: nextTermInfo
    }
  } catch (error) {
    console.error('获取节气信息失败:', error)
    return null
  }
}

// 获取今日黄历
async function getTodayAlmanac(req, res) {
  try {
    const today = dayjs().format('YYYY-MM-DD')
    // 使用时区转换查询
    const almanac = await query(`
      SELECT *, DATE_FORMAT(CONVERT_TZ(date, '+00:00', '+08:00'), '%Y-%m-%d') as formatted_date
      FROM almanac_data
      WHERE DATE_FORMAT(CONVERT_TZ(date, '+00:00', '+08:00'), '%Y-%m-%d') = ?
    `, [today])

    if (!almanac || almanac.length === 0) {
      return res.json({
        success: true,
        data: {
          date: today,
          yi: '祭祀 祈福 求嗣',
          ji: '出行 嫁娶 入宅',
          shen_sha: '青龙',
          lucky_time: '辰时（7-9 点）',
          conflict_zodiac: '龙',
          lucky_direction: '正东',
          lucky_color: '红色',
          lucky_number: '3, 8',
          rating: 3
        }
      })
    }

    // 获取天文台节气数据
    const termInfo = await getTodayTermInfo()

    res.json({
      success: true,
      data: {
        ...almanac[0],
        term_info: termInfo
      }
    })
  } catch (error) {
    console.error('获取今日黄历失败:', error)
    res.status(500).json({
      success: false,
      message: '获取今日黄历失败',
      error: error.message
    })
  }
}

// 获取指定日期黄历
async function getAlmanacByDate(req, res) {
  try {
    const { date } = req.params
    const almanac = await query(`
      SELECT *, DATE_FORMAT(CONVERT_TZ(date, '+00:00', '+08:00'), '%Y-%m-%d') as formatted_date
      FROM almanac_data
      WHERE DATE_FORMAT(CONVERT_TZ(date, '+00:00', '+08:00'), '%Y-%m-%d') = ?
    `, [date])

    if (!almanac || almanac.length === 0) {
      return res.status(404).json({
        success: false,
        message: '该日期黄历数据暂无'
      })
    }

    res.json({
      success: true,
      data: almanac[0]
    })
  } catch (error) {
    console.error('获取指定日期黄历失败:', error)
    res.status(500).json({
      success: false,
      message: '获取指定日期黄历失败',
      error: error.message
    })
  }
}

// 获取本月黄历
async function getAlmanacByMonth(req, res) {
  try {
    const { year, month } = req.params
    const startDate = dayjs(`${year}-${month}-01`).format('YYYY-MM-DD')
    const endDate = dayjs(`${year}-${month}-01`).endOf('month').format('YYYY-MM-DD')

    const almanacs = await query(`
      SELECT DATE_FORMAT(CONVERT_TZ(a.date, '+00:00', '+08:00'), '%Y-%m-%d') as date,
             a.lunar_year, a.lunar_month, a.lunar_day, a.term, a.solar_festival, a.lunar_festival,
             a.ganzhi_year, a.ganzhi_month, a.ganzhi_day, a.ganzhi_hour, a.zodiac, a.yi, a.ji, a.yue_ji, a.shen_sha, a.rating,
             a.wuxing, a.year_na_yin, a.month_na_yin, a.day_na_yin, a.hour_na_yin,
             a.xingxiu, a.constellation, a.jieqi,
             a.caishen, a.fushen, a.xishen, a.yanggui, a.yingui, a.taishen, a.jianchu,
             a.jishen, a.xiongshen, a.pengzu, a.huangdi_year,
             a.conflict_zodiac, a.conflict_sha,
             CASE WHEN h.is_official = 1 AND h.is_work = 0 THEN 1 ELSE 0 END as is_official
      FROM almanac_data a
      LEFT JOIN holidays h ON DATE_FORMAT(CONVERT_TZ(a.date, '+00:00', '+08:00'), '%Y-%m-%d') = h.date_full
        AND h.is_active = 1 AND h.category = 'festival'
      WHERE DATE_FORMAT(CONVERT_TZ(a.date, '+00:00', '+08:00'), '%Y-%m-%d') BETWEEN ? AND ?
      ORDER BY a.date ASC
    `, [startDate, endDate])

    res.json({
      success: true,
      data: almanacs
    })
  } catch (error) {
    console.error('获取本月黄历失败:', error)
    res.status(500).json({
      success: false,
      message: '获取本月黄历失败',
      error: error.message
    })
  }
}

// 获取吉日
async function getAuspiciousDays(req, res) {
  try {
    const { event } = req.params
    const { month } = req.query

    let sql = `
      SELECT *, DATE_FORMAT(CONVERT_TZ(date, '+00:00', '+08:00'), '%Y-%m-%d') as formatted_date
      FROM almanac_data
      WHERE yi LIKE ?
    `
    let params = [`%${event}%`]

    if (month) {
      const startDate = dayjs(`${month}-01`).format('YYYY-MM-DD')
      const endDate = dayjs(`${month}-01`).endOf('month').format('YYYY-MM-DD')
      sql += ` AND DATE_FORMAT(CONVERT_TZ(date, '+00:00', '+08:00'), '%Y-%m-%d') BETWEEN ? AND ?`
      params.push(startDate, endDate)
    }

    sql += ' ORDER BY rating DESC, date ASC LIMIT 10'

    const days = await query(sql, params)

    res.json({
      success: true,
      data: days
    })
  } catch (error) {
    console.error('获取吉日失败:', error)
    res.status(500).json({
      success: false,
      message: '获取吉日失败',
      error: error.message
    })
  }
}

// 获取指定年份的节气数据
async function getSolarTermsByYear(req, res) {
  try {
    const { year } = req.params
    const targetYear = parseInt(year) || new Date().getFullYear()

    // 从数据库查询
    const [terms] = await query(`
      SELECT term_name, term_order, date, time, week
      FROM almanac_term_dates
      WHERE year = ?
      ORDER BY term_order ASC
    `, [targetYear])

    if (terms.length === 0) {
      // 实时计算
      const termsData = AstronomicalCalculator.getSolarTermsForYear(targetYear)
      return res.json({
        success: true,
        data: termsData,
        source: 'calculated'
      })
    }

    res.json({
      success: true,
      data: terms,
      source: 'database'
    })
  } catch (error) {
    console.error('获取节气数据失败:', error)
    res.status(500).json({
      success: false,
      message: '获取节气数据失败',
      error: error.message
    })
  }
}

// 获取当前太阳黄经
async function getSolarLongitude(req, res) {
  try {
    const { date } = req.query
    let targetDate

    if (date) {
      targetDate = new Date(date)
    } else {
      targetDate = new Date()
    }

    // 计算太阳黄经
    const longitude = AstronomicalCalculator.getSolarLongitude(targetDate)

    // 计算当前节气
    const currentTermIndex = Math.floor(longitude / 15)
    const termName = SOLAR_TERMS[currentTermIndex]?.name || '未知'

    // 计算下一个节气
    const nextTermIndex = (currentTermIndex + 1) % 24
    const nextTermLongitude = nextTermIndex * 15
    let daysToNextTerm = (nextTermLongitude - longitude) / 0.9856 // 太阳每天约移动 0.9856 度
    if (daysToNextTerm < 0) daysToNextTerm += 365.2422

    res.json({
      success: true,
      data: {
        datetime: targetDate.toISOString(),
        solar_longitude: parseFloat(longitude.toFixed(4)),
        current_term: termName,
        next_term: SOLAR_TERMS[nextTermIndex]?.name,
        days_to_next_term: Math.round(daysToNextTerm * 10) / 10,
        source: 'astronomical_calculation'
      }
    })
  } catch (error) {
    console.error('获取太阳黄经失败:', error)
    res.status(500).json({
      success: false,
      message: '获取太阳黄经失败',
      error: error.message
    })
  }
}

module.exports = {
  getTodayAlmanac,
  getAlmanacByDate,
  getAlmanacByMonth,
  getAuspiciousDays,
  getTodayTermInfo,
  getSolarTermsByYear,
  getSolarLongitude
}
