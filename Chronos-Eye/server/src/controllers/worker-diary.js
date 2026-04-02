const { query } = require('../config/database')
const dayjs = require('dayjs')

/**
 * 判断指定日期是否为工作日
 * @param {string} dateStr - 日期字符串 YYYY-MM-DD
 * @returns {Promise<boolean>}
 */
async function isWorkday(dateStr) {
  const targetDate = dayjs(dateStr).format('YYYY-MM-DD')
  const weekday = dayjs(targetDate).day() // 0=周日，6=周六

  // 周末不是工作日
  if (weekday === 0 || weekday === 6) {
    return false
  }

  // 检查是否为法定节假日（放假）
  const holiday = await query(`
    SELECT id, is_work FROM holidays
    WHERE date_full = ? AND is_active = 1
    LIMIT 1
  `, [targetDate])

  if (holiday && holiday.length > 0) {
    // is_work=1 表示调休上班（是工作日），is_work=0 表示放假
    return holiday[0].is_work === 1
  }

  // 没有节假日记录，默认为工作日
  return true
}

/**
 * 获取打工者日记（仅工作日返回，使用缓存机制）
 * 每天 24:00 随机选一条（非工作日不选），当日固定不变
 */
async function getWorkerDiary(req, res) {
  try {
    const { date } = req.query
    const targetDate = date ? dayjs(date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')

    // 判断是否为工作日
    const workday = await isWorkday(targetDate)

    if (!workday) {
      return res.json({
        success: true,
        data: null,
        message: '今日休息，无需打工',
        isWorkday: false
      })
    }

    // 先从缓存表查找当日是否已有精选
    const cached = await query(
      'SELECT worker_diary_id FROM daily_diary_cache WHERE date = ?',
      [targetDate]
    )

    let diary

    if (cached && cached.length > 0 && cached[0].worker_diary_id) {
      // 缓存命中，直接返回对应日记
      const cachedDiary = await query(
        'SELECT id, content, created_at FROM worker_diary WHERE id = ?',
        [cached[0].worker_diary_id]
      )
      diary = cachedDiary
    } else {
      // 缓存未命中，随机选一条并写入缓存
      const [randomDiary] = await query(`
        SELECT id, content, created_at
        FROM worker_diary
        ORDER BY RAND()
        LIMIT 1
      `)

      if (!randomDiary) {
        return res.json({
          success: true,
          data: null,
          message: '暂无打工日记',
          isWorkday: true
        })
      }

      // 写入或更新缓存
      await query(`
        INSERT INTO daily_diary_cache (date, worker_diary_id, created_at)
        VALUES (?, ?, NOW())
        ON DUPLICATE KEY UPDATE worker_diary_id = VALUES(worker_diary_id), updated_at = NOW()
      `, [targetDate, randomDiary.id])

      diary = [randomDiary]
    }

    if (!diary || diary.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: '暂无打工日记',
        isWorkday: true
      })
    }

    res.json({
      success: true,
      data: {
        ...diary[0],
        date: targetDate,
        isWorkday: true
      }
    })
  } catch (error) {
    console.error('获取打工者日记失败:', error)
    res.status(500).json({
      success: false,
      message: '获取打工者日记失败',
      error: error.message
    })
  }
}

/**
 * 判断是否为工作日
 */
async function checkWorkday(req, res) {
  try {
    const { date } = req.query
    const targetDate = date ? dayjs(date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')

    const workday = await isWorkday(targetDate)
    const weekday = dayjs(targetDate).day()

    res.json({
      success: true,
      data: {
        date: targetDate,
        isWorkday: workday,
        weekday: weekday,
        weekdayName: ['日', '一', '二', '三', '四', '五', '六'][weekday]
      }
    })
  } catch (error) {
    console.error('检查工作日失败:', error)
    res.status(500).json({
      success: false,
      message: '检查工作日失败',
      error: error.message
    })
  }
}

module.exports = {
  getWorkerDiary,
  checkWorkday
}
