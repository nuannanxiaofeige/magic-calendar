const { query, run } = require('../config/database')
const dayjs = require('dayjs')

// 计算两个日期之间的天数
function daysBetween(date1, date2) {
  const d1 = dayjs(date1).startOf('day')
  const d2 = dayjs(date2).startOf('day')
  return d2.diff(d1, 'day')
}

// 获取所有节日列表（节日大全）- 支持类型/分类过滤
async function getAllHolidays(req, res) {
  try {
    const today = dayjs().format('YYYY-MM-DD')
    const { type, category } = req.query

    let sql, params

    // 如果按 category 过滤
    if (category) {
      if (category === 'festival') {
        // 法定节假日使用 date_full 逻辑
        sql = `
          SELECT
            h.id, h.name, h.type, h.category, h.date_full, h.date_month, h.date_day,
            h.is_official, h.description, h.customs, h.vacation_dates,
            h.weekday,
            DATEDIFF(h.date_full, ?) as days_left
          FROM holidays h
          INNER JOIN (
            SELECT name, MIN(date_full) as min_date
            FROM holidays
            WHERE is_active = 1
            AND is_work = 0
            GROUP BY name
          ) grouped ON h.name = grouped.name AND h.date_full = grouped.min_date
          WHERE h.is_active = 1
          AND h.is_work = 0
          AND h.date_full >= ?
          AND h.category = 'festival'
          ORDER BY h.date_full ASC
        `
        params = [today, today]
      } else {
        // 其他分类（chinese, international, western, national）
        sql = `
          SELECT
            h.id, h.name, h.type, h.category, h.date_full, h.date_month, h.date_day,
            h.is_official, h.description, h.customs, h.vacation_dates,
            h.weekday
          FROM holidays h
          WHERE h.is_active = 1
          AND h.category = ?
          ORDER BY h.date_month, h.date_day
        `
        params = [category]
      }
    } else if (type && type !== 'festival') {
      // 对于非 festival 类型（如 solar、lunar、term），不需要 date_full 过滤
      sql = `
        SELECT
          h.id, h.name, h.type, h.category, h.date_full, h.date_month, h.date_day,
          h.is_official, h.description, h.customs, h.vacation_dates,
          h.weekday
        FROM holidays h
        WHERE h.is_active = 1
        AND h.type = ?
        ORDER BY h.date_month, h.date_day
      `
      params = [type]
    } else if (type && type === 'festival') {
      // 对于 festival 类型，使用原有的 date_full 逻辑
      sql = `
        SELECT
          h.id, h.name, h.type, h.category, h.date_full, h.date_month, h.date_day,
          h.is_official, h.description, h.customs, h.vacation_dates,
          h.weekday,
          DATEDIFF(h.date_full, ?) as days_left
        FROM holidays h
        INNER JOIN (
          SELECT name, MIN(date_full) as min_date
          FROM holidays
          WHERE is_active = 1
          AND is_work = 0
          GROUP BY name
        ) grouped ON h.name = grouped.name AND h.date_full = grouped.min_date
        WHERE h.is_active = 1
        AND h.is_work = 0
        AND h.date_full >= ?
        ORDER BY h.date_full ASC
      `
      params = [today, today]
    } else {
      // 不过滤类型，返回所有节日
      sql = `
        SELECT
          h.id, h.name, h.type, h.category, h.date_full, h.date_month, h.date_day,
          h.is_official, h.description, h.customs, h.vacation_dates,
          h.weekday
        FROM holidays h
        WHERE h.is_active = 1
        ORDER BY h.date_month, h.date_day
      `
      params = []
    }

    const holidays = await query(sql, params)

    res.json({
      success: true,
      data: holidays
    })
  } catch (error) {
    console.error('获取节日大全列表失败:', error)
    res.status(500).json({
      success: false,
      message: '获取节日大全列表失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误'
    })
  }
}

// 获取节假日列表
async function getHolidays(req, res) {
  try {
    const { type, page = 1, limit = 20 } = req.query
    const offset = (page - 1) * limit

    let sql = 'SELECT * FROM holidays WHERE is_active = 1'
    let params = []

    if (type) {
      sql += ' AND type = ?'
      params.push(type)
    }

    sql += ' ORDER BY date_month, date_day LIMIT ? OFFSET ?'
    params.push(parseInt(limit), parseInt(offset))

    const holidays = await query(sql, params)

    res.json({
      success: true,
      data: holidays
    })
  } catch (error) {
    console.error('获取节假日列表失败:', error)
    res.status(500).json({
      success: false,
      message: '获取节假日列表失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误'
    })
  }
}

// 获取节假日详情
async function getHolidayById(req, res) {
  try {
    const { id } = req.params
    const today = dayjs().format('YYYY-MM-DD')
    const holiday = await query('SELECT * FROM holidays WHERE id = ?', [id])

    if (!holiday || holiday.length === 0) {
      return res.status(404).json({
        success: false,
        message: '节假日不存在'
      })
    }

    const data = holiday[0]

    // 解析详细信息
    const result = {
      ...data,
      // 计算距离节日的天数
      days_left: data.date_full ? Math.floor(dayjs(data.date_full).diff(dayjs(today), 'day', true)) : 0,
      // 将 pipe 分隔的字符串转为数组
      vacation_dates: data.vacation_dates ? data.vacation_dates.split('|') : [],
      work_dates: data.work_dates ? data.work_dates.split('|') : [],
      wage_dates: data.wage_dates ? data.wage_dates.split('|') : []
    }

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('获取节假日详情失败:', error)
    res.status(500).json({
      success: false,
      message: '获取节假日详情失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误'
    })
  }
}

// 获取倒计时列表（核心功能）
async function getCountdownList(req, res) {
  try {
    // 优先使用认证后的 userId，其次使用 query 参数
    const userId = req.userId || parseInt(req.query.user_id) || 1
    const today = dayjs().format('YYYY-MM-DD')

    // 获取用户自定义倒计时
    let countdowns = await query(`
      SELECT
        uc.id,
        uc.custom_name as name,
        uc.custom_date as date,
        uc.custom_type as type,
        uc.is_recurring,
        uc.reminder_days,
        uc.sort_order,
        DATEDIFF(uc.custom_date, ?) as days_left
      FROM user_countdowns uc
      WHERE uc.user_id = ? AND uc.is_enabled = 1
      ORDER BY uc.sort_order, days_left ASC
      LIMIT 10
    `, [today, userId])

    // 如果没有自定义倒计时，返回最近的法定节假日
    if (countdowns.length === 0) {
      countdowns = await query(`
        SELECT
          h.id,
          h.name,
          h.date_full as date,
          h.type,
          0 as is_recurring,
          1 as reminder_days,
          0 as sort_order,
          DATEDIFF(h.date_full, ?) as days_left
        FROM holidays h
        WHERE h.is_official = 1 AND h.date_full >= ?
        ORDER BY h.date_full ASC
        LIMIT 10
      `, [today, today])
    }

    // 将天数取整
    countdowns = countdowns.map(item => ({
      ...item,
      days_left: Math.floor(item.days_left)
    }))

    res.json({
      success: true,
      data: countdowns
    })
  } catch (error) {
    console.error('获取倒计时列表失败:', error)
    res.status(500).json({
      success: false,
      message: '获取倒计时列表失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误'
    })
  }
}

// 添加倒计时
async function addCountdown(req, res) {
  try {
    // 优先使用认证后的 userId，其次使用 body 中的 user_id
    const userId = req.userId || parseInt(req.body.user_id) || 1
    const { custom_name, custom_date, custom_type, is_recurring, reminder_days } = req.body

    if (!custom_name || !custom_date) {
      return res.status(400).json({
        success: false,
        message: '名称和日期不能为空'
      })
    }

    const result = await run(`
      INSERT INTO user_countdowns
      (user_id, custom_name, custom_date, custom_type, is_recurring, reminder_days)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [userId, custom_name, custom_date, custom_type || 'solar', is_recurring ? 1 : 0, reminder_days || 1])

    res.json({
      success: true,
      data: { id: result.lastInsertRowid },
      message: '添加成功'
    })
  } catch (error) {
    console.error('添加倒计时失败:', error)
    res.status(500).json({
      success: false,
      message: '添加倒计时失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误'
    })
  }
}

// 更新倒计时
async function updateCountdown(req, res) {
  try {
    const { id } = req.params
    const { custom_name, custom_date, is_recurring, reminder_days, is_enabled } = req.body

    await query(`
      UPDATE user_countdowns
      SET custom_name = ?, custom_date = ?, is_recurring = ?, reminder_days = ?, is_enabled = ?
      WHERE id = ?
    `, [custom_name, custom_date, is_recurring ? 1 : 0, reminder_days, is_enabled ? 1 : 0, id])

    res.json({
      success: true,
      message: '更新成功'
    })
  } catch (error) {
    console.error('更新倒计时失败:', error)
    res.status(500).json({
      success: false,
      message: '更新倒计时失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误'
    })
  }
}

// 删除倒计时
async function deleteCountdown(req, res) {
  try {
    const { id } = req.params
    await query('DELETE FROM user_countdowns WHERE id = ?', [id])

    res.json({
      success: true,
      message: '删除成功'
    })
  } catch (error) {
    console.error('删除倒计时失败:', error)
    res.status(500).json({
      success: false,
      message: '删除倒计时失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误'
    })
  }
}

// 排序倒计时
async function sortCountdowns(req, res) {
  try {
    const { items } = req.body

    for (const item of items) {
      await query('UPDATE user_countdowns SET sort_order = ? WHERE id = ?', [item.sort_order, item.id])
    }

    res.json({
      success: true,
      message: '排序更新成功'
    })
  } catch (error) {
    console.error('排序倒计时失败:', error)
    res.status(500).json({
      success: false,
      message: '排序倒计时失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误'
    })
  }
}

// 获取指定日期的节假日
async function getHolidaysByDate(req, res) {
  try {
    const { date } = req.params
    const d = dayjs(date)
    const month = d.month() + 1
    const day = d.date()

    const holidays = await query(`
      SELECT * FROM holidays
      WHERE is_active = 1
      AND ((type = 'solar' AND date_month = ? AND date_day = ?)
        OR (type = 'festival' AND date_full = ?))
    `, [month, day, date])

    res.json({
      success: true,
      data: holidays
    })
  } catch (error) {
    console.error('获取指定日期节假日失败:', error)
    res.status(500).json({
      success: false,
      message: '获取指定日期节假日失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误'
    })
  }
}

// 获取本月节假日
async function getHolidaysByMonth(req, res) {
  try {
    const { year, month } = req.params
    const startDay = dayjs(`${year}-${month}-01`)
    const endDay = startDay.endOf('month')

    const holidays = await query(`
      SELECT * FROM holidays
      WHERE is_active = 1
      AND ((type IN ('solar', 'lunar') AND date_month = ?)
        OR (type = 'festival' AND date_full BETWEEN ? AND ?))
      ORDER BY date_month, date_day
    `, [parseInt(month), startDay.format('YYYY-MM-DD'), endDay.format('YYYY-MM-DD')])

    res.json({
      success: true,
      data: holidays
    })
  } catch (error) {
    console.error('获取本月节假日失败:', error)
    res.status(500).json({
      success: false,
      message: '获取本月节假日失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误'
    })
  }
}

// 获取最近节日列表（按天数排序，每个节日只显示一条记录）
async function getRecentFestivals(req, res) {
  try {
    const { limit = 5 } = req.query
    const today = dayjs().format('YYYY-MM-DD')

    // 使用子查询，按 name 分组，每个节日取最早的一天
    // 排除调休上班日期 (is_work=1)，但保留正常的节假日
    const festivals = await query(`
      SELECT
        h.id, h.name, h.type, h.date_full, h.date_month, h.date_day,
        h.is_official, h.description, h.customs, h.vacation_dates,
        DATEDIFF(h.date_full, ?) as days_left
      FROM holidays h
      INNER JOIN (
        SELECT name, MIN(date_full) as min_date
        FROM holidays
        WHERE is_active = 1
        AND date_full >= ?
        AND is_work = 0
        GROUP BY name
      ) grouped ON h.name = grouped.name AND h.date_full = grouped.min_date
      WHERE h.is_active = 1
      AND h.is_work = 0
      ORDER BY days_left ASC
      LIMIT ?
    `, [today, today, parseInt(limit)])

    res.json({
      success: true,
      data: festivals
    })
  } catch (error) {
    console.error('获取最近节日列表失败:', error)
    res.status(500).json({
      success: false,
      message: '获取最近节日列表失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误'
    })
  }
}

// 获取下一个节假日（核心新功能）
async function getNextHoliday(req, res) {
  try {
    const today = dayjs().format('YYYY-MM-DD')

    // 获取下一个法定节假日（优先）
    let holiday = await query(`
      SELECT
        id, name, type, date_full, date_month, date_day,
        vacation_dates, work_dates, wage_dates,
        is_official, is_rest, is_work,
        tip, rest_tip, holiday_str,
        start, end, now,
        year, weekday,
        DATEDIFF(date_full, ?) as days_left
      FROM holidays
      WHERE is_active = 1
      AND type = 'festival'
      AND date_full >= ?
      ORDER BY date_full ASC
      LIMIT 1
    `, [today, today])

    // 如果没有法定节假日，获取最近的公历节日
    if (!holiday || holiday.length === 0) {
      const now = dayjs()
      const currentMonth = now.month() + 1
      const currentDay = now.date()

      holiday = await query(`
        SELECT
          id, name, type, date_full, date_month, date_day,
          is_official, is_rest, is_work,
          tip, rest_tip, description, customs,
          weekday,
          DATEDIFF(CONCAT(YEAR(?), '-', LPAD(date_month, 2, '-'), '-', LPAD(date_day, 2, '-')), ?) as days_left
        FROM holidays
        WHERE is_active = 1
        AND type IN ('solar')
        AND (date_month > ? OR (date_month = ? AND date_day >= ?))
        ORDER BY date_month, date_day
        LIMIT 1
      `, [today, today, currentMonth, currentMonth, currentDay])
    }

    if (!holiday || holiday.length === 0) {
      // 如果今年没有了，获取明年的第一个节日
      const nextYear = dayjs().add(1, 'year').year()
      holiday = await query(`
        SELECT
          id, name, type, date_full, date_month, date_day,
          vacation_dates, work_dates, wage_dates,
          is_official, is_rest, is_work,
          tip, rest_tip, holiday_str,
          start, end, now,
          year, weekday,
          DATEDIFF(date_full, ?) as days_left
        FROM holidays
        WHERE is_active = 1
        AND type = 'festival'
        AND year = ?
        ORDER BY date_full ASC
        LIMIT 1
      `, [today, nextYear])
    }

    if (!holiday || holiday.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: '暂无 upcoming 节假日'
      })
    }

    const holidayData = holiday[0]

    // 解析详细信息
    const result = {
      id: holidayData.id,
      name: holidayData.name,
      type: holidayData.type,
      date: holidayData.date_full ? dayjs(holidayData.date_full).format('YYYY-MM-DD') : null,
      date_month: holidayData.date_month,
      date_day: holidayData.date_day,
      weekday: holidayData.weekday,
      days_left: Math.floor(holidayData.days_left),
      // 假期详情
      vacation_dates: holidayData.vacation_dates ? holidayData.vacation_dates.split('|') : [],
      work_dates: holidayData.work_dates ? holidayData.work_dates.split('|') : [],
      wage_dates: holidayData.wage_dates ? holidayData.wage_dates.split('|') : [],
      // 假期属性
      is_official: holidayData.is_official,
      is_rest: holidayData.is_rest,
      is_work: holidayData.is_work,
      // 描述信息
      tip: holidayData.tip,
      rest_tip: holidayData.rest_tip,
      description: holidayData.description,
      customs: holidayData.customs,
      // 原始数据
      holiday_str: holidayData.holiday_str,
      start: holidayData.start,
      end: holidayData.end,
      now: holidayData.now,
      year: holidayData.year
    }

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('获取下一个节假日失败:', error)
    res.status(500).json({
      success: false,
      message: '获取下一个节假日失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误'
    })
  }
}

// 获取今日农历节日
async function getTodayLunarFestival(req, res) {
  try {
    const today = dayjs()

    // 获取今日的农历日期（从 almanac_data 表）
    const almanacData = await query(`
      SELECT lunar_month, lunar_day FROM almanac_data
      WHERE date = ?
    `, [today.format('YYYY-MM-DD')])

    if (!almanacData || almanacData.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: '今日不是农历节日'
      })
    }

    const { lunar_month, lunar_day } = almanacData[0]

    // 查找匹配的农历节日（使用 date_month 和 date_day 字段）
    const festival = await query(`
      SELECT id, name, type, description, customs
      FROM holidays
      WHERE is_active = 1
      AND type = 'lunar'
      AND date_month = ?
      AND date_day = ?
    `, [lunar_month, lunar_day])

    if (!festival || festival.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: '今日不是农历节日'
      })
    }

    const festivalData = festival[0]

    res.json({
      success: true,
      data: {
        ...festivalData,
        isToday: true
      }
    })
  } catch (error) {
    console.error('获取今日农历节日失败:', error)
    res.status(500).json({
      success: false,
      message: '获取今日农历节日失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误'
    })
  }
}

// 获取农历节日列表
async function getLunarFestivals(req, res) {
  try {
    const festivals = await query(`
      SELECT id, name, type, lunar_month, lunar_day, description, customs
      FROM holidays
      WHERE is_active = 1
      AND type = 'lunar'
      ORDER BY lunar_month, lunar_day
    `)

    res.json({
      success: true,
      data: festivals
    })
  } catch (error) {
    console.error('获取农历节日列表失败:', error)
    res.status(500).json({
      success: false,
      message: '获取农历节日列表失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误'
    })
  }
}

module.exports = {
  getAllHolidays,
  getHolidays,
  getHolidayById,
  getCountdownList,
  addCountdown,
  updateCountdown,
  deleteCountdown,
  sortCountdowns,
  getHolidaysByDate,
  getHolidaysByMonth,
  getNextHoliday,
  getRecentFestivals,
  getTodayLunarFestival,
  getLunarFestivals
}
