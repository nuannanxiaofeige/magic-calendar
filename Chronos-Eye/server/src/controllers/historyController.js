const { query, run } = require('../config/database')
const dayjs = require('dayjs')

// 生成基于日期的种子随机数
function getSeedRandom(month, day) {
  const seed = month * 100 + day
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

// 获取历史上的今天（返回所有事件列表）
async function getHistoryTodayList(req, res) {
  try {
    const { date } = req.query
    const d = date ? dayjs(date) : dayjs()
    const month = d.month() + 1
    const day = d.date()

    const events = await query(`
      SELECT * FROM history_events
      WHERE month = ? AND day = ?
      ORDER BY year DESC
      LIMIT 50
    `, [month, day])

    res.json({
      success: true,
      data: events,
      total: events.length
    })
  } catch (error) {
    console.error('获取历史上的今天列表失败:', error)
    res.status(500).json({
      success: false,
      message: '获取历史上的今天列表失败',
      error: error.message
    })
  }
}

// 获取历史上的今天（随机返回一条，但同一天不变）
async function getHistoryToday(req, res) {
  try {
    const { date } = req.query
    const d = date ? dayjs(date) : dayjs()
    const month = d.month() + 1
    const day = d.date()

    const events = await query(`
      SELECT * FROM history_events
      WHERE month = ? AND day = ?
      ORDER BY year DESC
    `, [month, day])

    // 如果当天数据少于 2 条，从前后日期补充
    if (events.length < 2) {
      const nearbyEvents = await getNearbyEvents(month, day, 2 - events.length)
      events.push(...nearbyEvents)
    }

    // 基于日期种子随机选一条
    let selectedEvent = null
    if (events.length > 0) {
      const randomIndex = Math.floor(getSeedRandom(month, day) * events.length)
      selectedEvent = events[randomIndex]
    }

    res.json({
      success: true,
      data: selectedEvent,
      total: events.length
    })
  } catch (error) {
    console.error('获取历史上的今天失败:', error)
    res.status(500).json({
      success: false,
      message: '获取历史上的今天失败',
      error: error.message
    })
  }
}

// 从附近日期获取补充事件
async function getNearbyEvents(month, day, needed) {
  const events = []
  const checkedDates = new Set()
  checkedDates.add(`${month}-${day}`)

  // 向前后各扩展 5 天
  for (let offset = 1; offset <= 5 && events.length < needed; offset++) {
    // 检查前 offset 天
    const prevDate = dayjs().month(month - 1).date(day).subtract(offset, 'day')
    const prevMonth = prevDate.month() + 1
    const prevDay = prevDate.date()
    const prevKey = `${prevMonth}-${prevDay}`

    if (!checkedDates.has(prevKey)) {
      checkedDates.add(prevKey)
      const prevEvents = await query(`
        SELECT * FROM history_events
        WHERE month = ? AND day = ?
        ORDER BY year DESC
        LIMIT ?
      `, [prevMonth, prevDay, needed - events.length])
      events.push(...prevEvents)
    }

    if (events.length >= needed) break

    // 检查后 offset 天
    const nextDate = dayjs().month(month - 1).date(day).add(offset, 'day')
    const nextMonth = nextDate.month() + 1
    const nextDay = nextDate.date()
    const nextKey = `${nextMonth}-${nextDay}`

    if (!checkedDates.has(nextKey)) {
      checkedDates.add(nextKey)
      const nextEvents = await query(`
        SELECT * FROM history_events
        WHERE month = ? AND day = ?
        ORDER BY year DESC
        LIMIT ?
      `, [nextMonth, nextDay, needed - events.length])
      events.push(...nextEvents)
    }
  }

  return events
}

// 获取历史事件详情
async function getHistoryEventById(req, res) {
  try {
    const { id } = req.params
    const event = await query('SELECT * FROM history_events WHERE id = ?', [id])

    if (!event || event.length === 0) {
      return res.status(404).json({
        success: false,
        message: '历史事件不存在'
      })
    }

    res.json({
      success: true,
      data: event[0]
    })
  } catch (error) {
    console.error('获取历史事件详情失败:', error)
    res.status(500).json({
      success: false,
      message: '获取历史事件详情失败',
      error: error.message
    })
  }
}

// 按分类获取历史事件
async function getHistoryByCategory(req, res) {
  try {
    const { category } = req.params
    const { date } = req.query
    const d = date ? dayjs(date) : dayjs()
    const month = d.month() + 1
    const day = d.date()

    let sql = 'SELECT * FROM history_events WHERE month = ? AND day = ?'
    let params = [month, day]

    if (category && category !== 'all') {
      sql += ' AND category = ?'
      params.push(category)
    }

    sql += ' ORDER BY year DESC'

    const events = await query(sql, params)

    // 如果当天数据少于 2 条，从前后日期补充
    if (events.length < 2) {
      const nearbyEvents = await getNearbyEventsWithCategory(month, day, category, 2 - events.length)
      events.push(...nearbyEvents)
    }

    // 基于日期种子随机选一条
    let selectedEvent = null
    if (events.length > 0) {
      const randomIndex = Math.floor(getSeedRandom(month, day) * events.length)
      selectedEvent = events[randomIndex]
    }

    res.json({
      success: true,
      data: selectedEvent,
      total: events.length
    })
  } catch (error) {
    console.error('按分类获取历史事件失败:', error)
    res.status(500).json({
      success: false,
      message: '按分类获取历史事件失败',
      error: error.message
    })
  }
}

// 从附近日期获取补充事件（带分类）
async function getNearbyEventsWithCategory(month, day, category, needed) {
  if (category === 'all') {
    return getNearbyEvents(month, day, needed)
  }

  const events = []
  const checkedDates = new Set()
  checkedDates.add(`${month}-${day}`)

  // 向前后各扩展 5 天
  for (let offset = 1; offset <= 5 && events.length < needed; offset++) {
    // 检查前 offset 天
    const prevDate = dayjs().month(month - 1).date(day).subtract(offset, 'day')
    const prevMonth = prevDate.month() + 1
    const prevDay = prevDate.date()
    const prevKey = `${prevMonth}-${prevDay}`

    if (!checkedDates.has(prevKey)) {
      checkedDates.add(prevKey)
      const prevEvents = await query(`
        SELECT * FROM history_events
        WHERE month = ? AND day = ? AND category = ?
        ORDER BY year DESC
        LIMIT ?
      `, [prevMonth, prevDay, category, needed - events.length])
      events.push(...prevEvents)
    }

    if (events.length >= needed) break

    // 检查后 offset 天
    const nextDate = dayjs().month(month - 1).date(day).add(offset, 'day')
    const nextMonth = nextDate.month() + 1
    const nextDay = nextDate.date()
    const nextKey = `${nextMonth}-${nextDay}`

    if (!checkedDates.has(nextKey)) {
      checkedDates.add(nextKey)
      const nextEvents = await query(`
        SELECT * FROM history_events
        WHERE month = ? AND day = ? AND category = ?
        ORDER BY YEAR DESC
        LIMIT ?
      `, [nextMonth, nextDay, category, needed - events.length])
      events.push(...nextEvents)
    }
  }

  return events
}

// 搜索历史事件
async function searchHistoryEvents(req, res) {
  try {
    const { keyword } = req.query

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: '搜索关键词不能为空'
      })
    }

    const events = await query(`
      SELECT * FROM history_events
      WHERE title LIKE ? OR description LIKE ?
      ORDER BY year DESC
      LIMIT 20
    `, [`%${keyword}%`, `%${keyword}%`])

    res.json({
      success: true,
      data: events
    })
  } catch (error) {
    console.error('搜索历史事件失败:', error)
    res.status(500).json({
      success: false,
      message: '搜索历史事件失败',
      error: error.message
    })
  }
}

// 获取热门历史事件
async function getFeaturedHistory(req, res) {
  try {
    const { date } = req.query
    const d = date ? dayjs(date) : dayjs()
    const month = d.month() + 1
    const day = d.date()

    const events = await query(`
      SELECT * FROM history_events
      WHERE month = ? AND day = ? AND is_featured = 1
      ORDER BY year DESC
      LIMIT 5
    `, [month, day])

    res.json({
      success: true,
      data: events
    })
  } catch (error) {
    console.error('获取热门历史事件失败:', error)
    res.status(500).json({
      success: false,
      message: '获取热门历史事件失败',
      error: error.message
    })
  }
}

// 添加历史事件（管理员功能）
async function addHistoryEvent(req, res) {
  try {
    const { month, day, year, title, description, category, country } = req.body

    if (!month || !day || !year || !title) {
      return res.status(400).json({
        success: false,
        message: '月份、日期、年份和标题不能为空'
      })
    }

    const result = await run(`
      INSERT INTO history_events
      (month, day, year, title, description, category, country)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [month, day, year, title, description || null, category || 'other', country || null])

    res.json({
      success: true,
      data: { id: result.lastInsertRowid },
      message: '添加成功'
    })
  } catch (error) {
    console.error('添加历史事件失败:', error)
    res.status(500).json({
      success: false,
      message: '添加历史事件失败',
      error: error.message
    })
  }
}

module.exports = {
  getHistoryToday,
  getHistoryTodayList,
  getHistoryEventById,
  getHistoryByCategory,
  searchHistoryEvents,
  getFeaturedHistory,
  addHistoryEvent
}
