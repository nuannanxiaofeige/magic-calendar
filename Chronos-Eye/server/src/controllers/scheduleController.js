const { query, run } = require('../config/database')
const dayjs = require('dayjs')

// 获取日程列表
async function getSchedules(req, res) {
  try {
    // 优先使用认证后的 userId，其次使用 query 参数
    const userId = req.userId || parseInt(req.query.user_id) || 1
    const { start_date, end_date, status } = req.query
    const today = dayjs().format('YYYY-MM-DD')

    let sql = 'SELECT * FROM schedules WHERE user_id = ?'
    let params = [userId]

    if (start_date) {
      sql += ' AND start_time >= ?'
      params.push(start_date)
    } else {
      sql += ' AND start_time >= ?'
      params.push(dayjs().startOf('month').format('YYYY-MM-DD HH:mm:ss'))
    }

    if (end_date) {
      sql += ' AND start_time <= ?'
      params.push(end_date)
    } else {
      sql += ' AND start_time <= ?'
      params.push(dayjs().endOf('month').format('YYYY-MM-DD HH:mm:ss'))
    }

    if (status) {
      sql += ' AND status = ?'
      params.push(status)
    }

    sql += ' ORDER BY start_time ASC'

    const schedules = await query(sql, params)

    res.json({
      success: true,
      data: schedules
    })
  } catch (error) {
    console.error('获取日程列表失败:', error)
    res.status(500).json({
      success: false,
      message: '获取日程列表失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误'
    })
  }
}

// 获取日程详情
async function getScheduleById(req, res) {
  try {
    const { id } = req.params
    const schedule = await query('SELECT * FROM schedules WHERE id = ?', [id])

    if (!schedule || schedule.length === 0) {
      return res.status(404).json({
        success: false,
        message: '日程不存在'
      })
    }

    res.json({
      success: true,
      data: schedule[0]
    })
  } catch (error) {
    console.error('获取日程详情失败:', error)
    res.status(500).json({
      success: false,
      message: '获取日程详情失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误'
    })
  }
}

// 创建日程
async function createSchedule(req, res) {
  try {
    // 优先使用认证后的 userId，其次使用 body 中的 user_id
    const userId = req.userId || parseInt(req.body.user_id) || 1
    const {
      title, description, start_time, end_time,
      is_all_day, repeat_type, repeat_end, reminder_enabled,
      reminder_minutes, priority, color
    } = req.body

    if (!title || !start_time) {
      return res.status(400).json({
        success: false,
        message: '标题和开始时间不能为空'
      })
    }

    const result = await run(`
      INSERT INTO schedules
      (user_id, title, description, start_time, end_time, is_all_day,
       repeat_type, repeat_end, reminder_enabled, reminder_minutes, priority, color)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId, title, description || null, start_time, end_time || null,
      is_all_day ? 1 : 0, repeat_type || 'none', repeat_end || null,
      reminder_enabled !== false ? 1 : 0, reminder_minutes || 30,
      priority || 'normal', color || '#667eea'
    ])

    res.json({
      success: true,
      data: { id: result.lastInsertRowid },
      message: '创建成功'
    })
  } catch (error) {
    console.error('创建日程失败:', error)
    res.status(500).json({
      success: false,
      message: '创建日程失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误'
    })
  }
}

// 更新日程
async function updateSchedule(req, res) {
  try {
    const { id } = req.params
    const {
      title, description, start_time, end_time, is_all_day,
      repeat_type, repeat_end, reminder_enabled, reminder_minutes,
      priority, status, color
    } = req.body

    await run(`
      UPDATE schedules
      SET title = ?, description = ?, start_time = ?, end_time = ?,
          is_all_day = ?, repeat_type = ?, repeat_end = ?,
          reminder_enabled = ?, reminder_minutes = ?, priority = ?,
          status = ?, color = ?
      WHERE id = ?
    `, [
      title, description, start_time, end_time,
      is_all_day ? 1 : 0, repeat_type, repeat_end,
      reminder_enabled ? 1 : 0, reminder_minutes, priority,
      status, color, id
    ])

    res.json({
      success: true,
      message: '更新成功'
    })
  } catch (error) {
    console.error('更新日程失败:', error)
    res.status(500).json({
      success: false,
      message: '更新日程失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误'
    })
  }
}

// 删除日程
async function deleteSchedule(req, res) {
  try {
    const { id } = req.params
    await query('DELETE FROM schedules WHERE id = ?', [id])

    res.json({
      success: true,
      message: '删除成功'
    })
  } catch (error) {
    console.error('删除日程失败:', error)
    res.status(500).json({
      success: false,
      message: '删除日程失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误'
    })
  }
}

// 批量更新日程状态
async function batchUpdateStatus(req, res) {
  try {
    const { ids, status } = req.body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '日程 ID 列表不能为空'
      })
    }

    const placeholders = ids.map(() => '?').join(',')
    await run(
      `UPDATE schedules SET status = ? WHERE id IN (${placeholders})`,
      [status, ...ids]
    )

    res.json({
      success: true,
      message: '批量更新成功'
    })
  } catch (error) {
    console.error('批量更新日程状态失败:', error)
    res.status(500).json({
      success: false,
      message: '批量更新日程状态失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误'
    })
  }
}

// 获取月度统计
async function getMonthStats(req, res) {
  try {
    // 优先使用认证后的 userId，其次使用 params 中的 user_id
    const userId = req.userId || parseInt(req.params.user_id) || 1
    const { year, month } = req.params
    const startDate = dayjs(`${year}-${month}-01`).format('YYYY-MM-DD')
    const endDate = dayjs(`${year}-${month}-01`).endOf('month').format('YYYY-MM-DD')

    const totalResult = await query(`
      SELECT COUNT(*) as count FROM schedules
      WHERE user_id = ? AND date(start_time) BETWEEN ? AND ?
    `, [userId, startDate, endDate])

    const completedResult = await query(`
      SELECT COUNT(*) as count FROM schedules
      WHERE user_id = ? AND date(start_time) BETWEEN ? AND ? AND status = 'completed'
    `, [userId, startDate, endDate])

    const priorityResult = await query(`
      SELECT priority, COUNT(*) as count FROM schedules
      WHERE user_id = ? AND date(start_time) BETWEEN ? AND ?
      GROUP BY priority
    `, [userId, startDate, endDate])

    const total = totalResult[0]?.count || 0
    const completed = completedResult[0]?.count || 0
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    res.json({
      success: true,
      data: {
        total,
        completed,
        pending: total - completed,
        completion_rate: completionRate,
        priority_distribution: priorityResult
      }
    })
  } catch (error) {
    console.error('获取月度统计失败:', error)
    res.status(500).json({
      success: false,
      message: '获取月度统计失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误'
    })
  }
}

module.exports = {
  getSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  batchUpdateStatus,
  getMonthStats
}
