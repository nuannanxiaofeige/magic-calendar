/**
 * 智能日期查询控制器 - 混合方案
 * 提供多历法切换、节假日/节气联动查询
 * 支持：本地计算 + 数据库 + 第三方 API（天行数据）
 */
const { query } = require('../config/database')
const { CalendarConverter, SolarTermCalculator } = require('../utils/calendar')
const tianapi = require('../services/tianapi')
const dayjs = require('dayjs')
const { parseNaturalDate } = require('../services/nlp-date-parser')

// 获取指定日期的完整信息（多历法）
async function getDateInfo(req, res) {
  try {
    const { date } = req.query
    let targetDate

    if (date) {
      targetDate = new Date(date)
    } else {
      targetDate = new Date()
    }

    const dateInfo = CalendarConverter.getFullDateInfo(targetDate)

    // 查询该日期的节假日
    const holidays = await query(`
      SELECT name, type, description, customs
      FROM holidays
      WHERE is_active = 1
      AND (
        (type = 'solar' AND date_month = ? AND date_day = ?)
        OR (type = 'lunar' AND lunar_month = ? AND lunar_day = ? AND is_leap = 0)
        OR (type = 'festival' AND date_full = ?)
        OR (type = 'term' AND date_month = ? AND date_day = ?)
      )
    `, [
      dateInfo.solar.month, dateInfo.solar.day,
      dateInfo.lunar.month, dateInfo.lunar.day,
      dayjs(targetDate).format('YYYY-MM-DD'),
      dateInfo.solar.month, dateInfo.solar.day
    ])

    // 查询用户倒计时
    const userId = req.userId || parseInt(req.query.user_id) || 1
    const today = dayjs(targetDate).format('YYYY-MM-DD')

    const countdowns = await query(`
      SELECT id, custom_name as name, custom_date as date,
             DATEDIFF(custom_date, ?) as days_left
      FROM user_countdowns
      WHERE user_id = ? AND is_enabled = 1
      ORDER BY sort_order, days_left ASC
      LIMIT 5
    `, [today, userId])

    res.json({
      success: true,
      data: {
        date: dateInfo,
        holidays: holidays,
        countdowns: countdowns.map(item => ({
          ...item,
          days_left: Math.floor(item.days_left)
        }))
      }
    })
  } catch (error) {
    console.error('获取日期信息失败:', error)
    res.status(500).json({
      success: false,
      message: '获取日期信息失败',
      error: error.message
    })
  }
}

// 获取今日完整信息（包含节气/节假日/倒计时）
async function getTodayInfo(req, res) {
  try {
    const today = new Date()
    const dateInfo = CalendarConverter.getFullDateInfo(today)

    // 检查是否是节气
    const termCheck = SolarTermCalculator.isTodayTerm(today)
    let todayTerm = null

    if (termCheck.isTerm) {
      // 先查询数据库获取详细信息
      const termDetail = await query(`
        SELECT term_name, origin, phenology, customs, health_tips, poetry
        FROM almanac_terms
        WHERE term_name = ?
      `, [termCheck.term.name])

      if (termDetail && termDetail.length > 0) {
        todayTerm = termDetail[0]
      } else {
        // 如果数据库没有数据，返回基本信息
        todayTerm = {
          term_name: termCheck.term.name,
          origin: '',
          phenology: '',
          customs: '',
          health_tips: '',
          poetry: ''
        }
      }
    }

    // 查询节假日
    const holidays = await query(`
      SELECT name, type, description, customs, is_official
      FROM holidays
      WHERE is_active = 1
      AND (
        (type = 'solar' AND date_month = ? AND date_day = ?)
        OR (type = 'lunar' AND lunar_month = ? AND lunar_day = ?)
        OR (type = 'festival' AND date_full = ?)
        OR (type = 'term' AND date_month = ? AND date_day = ?)
      )
    `, [
      dateInfo.solar.month, dateInfo.solar.day,
      dateInfo.lunar.month, dateInfo.lunar.day,
      dayjs(today).format('YYYY-MM-DD'),
      dateInfo.solar.month, dateInfo.solar.day
    ])

    // 查询用户倒计时
    const userId = req.userId || 1
    const todayStr = dayjs().format('YYYY-MM-DD')

    const countdowns = await query(`
      SELECT id, custom_name as name, custom_date as date,
             DATEDIFF(custom_date, ?) as days_left
      FROM user_countdowns
      WHERE user_id = ? AND is_enabled = 1
      ORDER BY sort_order, days_left ASC
      LIMIT 5
    `, [todayStr, userId])

    // 计算距离最近节假日的天数
    const nextHoliday = await query(`
      SELECT name, date_full, DATEDIFF(date_full, ?) as days_left
      FROM holidays
      WHERE is_official = 1 AND date_full >= ?
      ORDER BY date_full ASC
      LIMIT 1
    `, [todayStr, todayStr])

    res.json({
      success: true,
      data: {
        date: dateInfo,
        term: todayTerm,
        nextTerm: dateInfo.term.next,
        holidays: holidays,
        countdowns: countdowns.map(item => ({
          ...item,
          days_left: Math.floor(item.days_left)
        })),
        nextHoliday: nextHoliday[0] || null
      }
    })
  } catch (error) {
    console.error('获取今日信息失败:', error)
    res.status(500).json({
      success: false,
      message: '获取今日信息失败',
      error: error.message
    })
  }
}

// 获取多历法切换数据
async function getCalendarInfo(req, res) {
  try {
    const { date } = req.query
    let targetDate

    if (date) {
      targetDate = new Date(date)
    } else {
      targetDate = new Date()
    }

    // 混合方案：优先使用第三方 API，失败则用本地计算
    const [dateInfo, lunarApi] = await Promise.all([
      Promise.resolve(CalendarConverter.getFullDateInfo(targetDate)),
      tianapi.getLunarDate(targetDate) // 获取精确农历数据
    ])

    // 如果第三方 API 返回数据，使用精确数据
    const lunarData = lunarApi || {
      year: dateInfo.lunar.year,
      month: dateInfo.lunar.month,
      day: dateInfo.lunar.day,
      isLeap: dateInfo.lunar.isLeap,
      monthName: dateInfo.lunar.monthName,
      dayName: dateInfo.lunar.dayName,
      fullString: `${dateInfo.lunar.year}年${dateInfo.lunar.monthName}${dateInfo.lunar.dayName}`
    }

    res.json({
      success: true,
      data: {
        solar: {
          date: dateInfo.solar.fullString,
          weekday: dateInfo.solar.weekdayName,
          icon: '🌞'
        },
        lunar: {
          date: lunarData.fullString,
          isLeap: lunarData.isLeap,
          icon: '🌙'
        },
        ganzhi: {
          date: dateInfo.ganzhi.fullString,
          year: dateInfo.ganzhi.year,
          month: dateInfo.ganzhi.month,
          day: dateInfo.ganzhi.day,
          hour: dateInfo.ganzhi.hour,
          zodiac: lunarApi?.zodiac || dateInfo.zodiac,
          icon: '📅'
        },
        islamic: {
          date: `${dateInfo.islamic.year}年${dateInfo.islamic.monthName}${dateInfo.islamic.day}日`,
          icon: '☪️'
        },
        term: dateInfo.term
      }
    })
  } catch (error) {
    console.error('获取历法信息失败:', error)
    res.status(500).json({
      success: false,
      message: '获取历法信息失败',
      error: error.message
    })
  }
}

// 获取节假日/节气联动信息
async function getHolidayTermLink(req, res) {
  try {
    const { date } = req.query
    let targetDate

    if (date) {
      targetDate = new Date(date)
    } else {
      targetDate = new Date()
    }

    const dateInfo = CalendarConverter.getFullDateInfo(targetDate)
    const todayStr = dayjs(targetDate).format('YYYY-MM-DD')

    // 获取所有相关信息
    const [holidays, termInfo] = await Promise.all([
      query(`
        SELECT name, type, description, customs, is_official
        FROM holidays
        WHERE is_active = 1
        AND (
          (type = 'solar' AND date_month = ? AND date_day = ?)
          OR (type = 'lunar' AND lunar_month = ? AND lunar_day = ?)
          OR (type = 'festival' AND date_full = ?)
          OR (type = 'term' AND date_month = ? AND date_day = ?)
        )
      `, [
        dateInfo.solar.month, dateInfo.solar.day,
        dateInfo.lunar.month, dateInfo.lunar.day,
        todayStr,
        dateInfo.solar.month, dateInfo.solar.day
      ]),
      Promise.resolve(dateInfo.term)
    ])

    // 构建联动信息
    const linkInfo = []

    // 添加节气信息
    if (dateInfo.isTermToday.isTerm) {
      linkInfo.push({
        type: 'term',
        name: dateInfo.isTermToday.term.name,
        message: `今日节气：${dateInfo.isTermToday.term.name}`
      })
    } else if (termInfo.next.daysLeft <= 15) {
      linkInfo.push({
        type: 'term',
        name: termInfo.next.name,
        message: `距${termInfo.next.name}还有${termInfo.next.daysLeft}天`
      })
    }

    // 添加节假日信息
    for (const holiday of holidays) {
      linkInfo.push({
        type: 'holiday',
        name: holiday.name,
        message: `今日节日：${holiday.name}`,
        custom: holiday.customs
      })
    }

    // 添加倒计时信息
    const nextHoliday = await query(`
      SELECT name, DATEDIFF(date_full, ?) as days_left
      FROM holidays
      WHERE is_official = 1 AND date_full > ?
      ORDER BY date_full ASC
      LIMIT 1
    `, [todayStr, todayStr])

    if (nextHoliday[0]) {
      linkInfo.push({
        type: 'countdown',
        name: nextHoliday[0].name,
        message: `距${nextHoliday[0].name}还有${nextHoliday[0].days_left}天`
      })
    }

    res.json({
      success: true,
      data: {
        date: dateInfo.solar.fullString,
        links: linkInfo
      }
    })
  } catch (error) {
    console.error('获取联动信息失败:', error)
    res.status(500).json({
      success: false,
      message: '获取联动信息失败',
      error: error.message
    })
  }
}

// 获取某年所有节气
async function getSolarTerms(req, res) {
  try {
    const { year } = req.query
    const targetYear = year ? parseInt(year) : new Date().getFullYear()

    const { SolarTermCalculator } = require('../utils/calendar')
    const termDates = SolarTermCalculator.getTermDates(targetYear)

    // 为每个节气添加样式
    const termsWithStyle = termDates.map(term => {
      return {
        ...term,
        style: getTermStyle(term.name)
      }
    })

    res.json({
      success: true,
      data: termsWithStyle
    })
  } catch (error) {
    console.error('获取节气列表失败:', error)
    res.status(500).json({
      success: false,
      message: '获取节气列表失败',
      error: error.message
    })
  }
}

// 获取节气样式
function getTermStyle(termName) {
  const termStyles = {
    '立春': { icon: '🌱', gradient: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)' },
    '雨水': { icon: '💧', gradient: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)' },
    '惊蛰': { icon: '⚡', gradient: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)' },
    '春分': { icon: '🌸', gradient: 'linear-gradient(135deg, #ff9ff3 0%, #f368e0 100%)' },
    '清明': { icon: '🌿', gradient: 'linear-gradient(135deg, #2ecc71 0%, #16a085 100%)' },
    '谷雨': { icon: '🌾', gradient: 'linear-gradient(135deg, #27ae60 0%, #1abc9c 100%)' },
    '立夏': { icon: '☀️', gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)' },
    '小满': { icon: '🌾', gradient: 'linear-gradient(135deg, #f39c12 0%, #d35400 100%)' },
    '芒种': { icon: '🌾', gradient: 'linear-gradient(135deg, #e67e22 0%, #d35400 100%)' },
    '夏至': { icon: '🌻', gradient: 'linear-gradient(135deg, #f1c40f 0%, #f39c12 100%)' },
    '小暑': { icon: '🔥', gradient: 'linear-gradient(135deg, #ff7979 0%, #eb4d4b 100%)' },
    '大暑': { icon: '☀️', gradient: 'linear-gradient(135deg, #ff5252 0%, #d32f2f 100%)' },
    '立秋': { icon: '🍂', gradient: 'linear-gradient(135deg, #e67e22 0%, #d35400 100%)' },
    '处暑': { icon: '🌾', gradient: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)' },
    '白露': { icon: '💧', gradient: 'linear-gradient(135deg, #a8e6cf 0%, #88d8b0 100%)' },
    '秋分': { icon: '🍁', gradient: 'linear-gradient(135deg, #ff6348 0%, #e84118 100%)' },
    '寒露': { icon: '🍂', gradient: 'linear-gradient(135deg, #c0392b 0%, #8e44ad 100%)' },
    '霜降': { icon: '❄️', gradient: 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)' },
    '立冬': { icon: '❄️', gradient: 'linear-gradient(135deg, #3498db 0%, #2c3e50 100%)' },
    '小雪': { icon: '❄️', gradient: 'linear-gradient(135deg, #ecf0f1 0%, #bdc3c7 100%)' },
    '大雪': { icon: '🌨️', gradient: 'linear-gradient(135deg, #dfe6e9 0%, #b2bec3 100%)' },
    '冬至': { icon: '🥟', gradient: 'linear-gradient(135deg, #fd79a8 0%, #e84393 100%)' },
    '小寒': { icon: '🧊', gradient: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)' },
    '大寒': { icon: '❄️', gradient: 'linear-gradient(135deg, #636e72 0%, #2d3436 100%)' }
  }

  return termStyles[termName] || { icon: '📅', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }
}

module.exports = {
  getDateInfo,
  getTodayInfo,
  getCalendarInfo,
  getHolidayTermLink,
  getSolarTerms,
  parseNLPDate
}

/**
 * 解析自然语言日期查询（AI 增强查询）
 * 支持："春节"、"中秋节后第 3 天"、"明年国庆"、"下周五"、"母亲节"等
 */
async function parseNLPDate(req, res) {
  try {
    const { q, year } = req.query

    if (!q) {
      return res.status(400).json({
        success: false,
        message: '请输入查询内容，如"春节"、"明年国庆"、"下周五"等'
      })
    }

    // 调用 NLP 解析服务
    const result = await parseNaturalDate(q, year ? parseInt(year) : undefined)

    if (result.success) {
      res.json({
        success: true,
        data: {
          query: q,
          date: result.date,
          message: result.message,
          type: result.data?.type
        },
        meta: result.data
      })
    } else {
      res.status(404).json({
        success: false,
        message: result.message || '未找到匹配的日期'
      })
    }
  } catch (error) {
    console.error('NLP 日期解析失败:', error)
    res.status(500).json({
      success: false,
      message: '解析失败，请稍后重试',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}
