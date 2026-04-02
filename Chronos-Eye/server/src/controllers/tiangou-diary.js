const { query } = require('../config/database')
const dayjs = require('dayjs')

/**
 * 获取每日舔狗日记（缓存机制）
 * 每天 24:00 随机选一条，当天固定不变
 */
async function getDailyDiary(req, res) {
  try {
    const { date } = req.query
    const targetDate = date ? dayjs(date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')

    // 先从缓存表查找当日是否已有精选
    const cached = await query(
      'SELECT tiangou_diary_id FROM daily_diary_cache WHERE date = ?',
      [targetDate]
    )

    let diary

    if (cached && cached.length > 0 && cached[0].tiangou_diary_id) {
      // 缓存命中，直接返回对应日记
      const cachedDiary = await query(
        'SELECT id, content, created_at FROM tiangou_diary WHERE id = ?',
        [cached[0].tiangou_diary_id]
      )
      diary = cachedDiary
    } else {
      // 缓存未命中，随机选一条并写入缓存
      const [randomDiary] = await query(`
        SELECT id, content, created_at
        FROM tiangou_diary
        ORDER BY RAND()
        LIMIT 1
      `)

      if (!randomDiary) {
        return res.json({
          success: true,
          data: null,
          message: '暂无数据'
        })
      }

      // 写入或更新缓存
      await query(`
        INSERT INTO daily_diary_cache (date, tiangou_diary_id, created_at)
        VALUES (?, ?, NOW())
        ON DUPLICATE KEY UPDATE tiangou_diary_id = VALUES(tiangou_diary_id), updated_at = NOW()
      `, [targetDate, randomDiary.id])

      diary = [randomDiary]
    }

    if (!diary || diary.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: '暂无数据'
      })
    }

    res.json({
      success: true,
      data: {
        ...diary[0],
        date: targetDate
      }
    })
  } catch (error) {
    console.error('获取每日舔狗日记失败:', error)
    res.status(500).json({
      success: false,
      message: '获取每日舔狗日记失败',
      error: error.message
    })
  }
}

/**
 * 获取随机一条舔狗日记
 */
async function getRandomDiary(req, res) {
  try {
    const diary = await query(`
      SELECT id, content, created_at
      FROM tiangou_diary
      ORDER BY RAND()
      LIMIT 1
    `)

    if (!diary || diary.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: '暂无数据'
      })
    }

    res.json({
      success: true,
      data: diary[0]
    })
  } catch (error) {
    console.error('获取舔狗日记失败:', error)
    res.status(500).json({
      success: false,
      message: '获取舔狗日记失败',
      error: error.message
    })
  }
}

/**
 * 获取舔狗日记列表（分页）
 */
async function getDiaryList(req, res) {
  try {
    const { page = 1, limit = 20 } = req.query
    const offset = (page - 1) * limit

    const diaries = await query(`
      SELECT id, content, created_at
      FROM tiangou_diary
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [parseInt(limit), parseInt(offset)])

    const total = await query(`
      SELECT COUNT(*) as count
      FROM tiangou_diary
    `)

    res.json({
      success: true,
      data: diaries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total[0]?.count || 0
      }
    })
  } catch (error) {
    console.error('获取舔狗日记列表失败:', error)
    res.status(500).json({
      success: false,
      message: '获取舔狗日记列表失败',
      error: error.message
    })
  }
}

/**
 * 获取多条随机舔狗日记
 */
async function getRandomDiaries(req, res) {
  try {
    const { count = 10 } = req.query

    const diaries = await query(`
      SELECT id, content, created_at
      FROM tiangou_diary
      ORDER BY RAND()
      LIMIT ?
    `, [parseInt(count)])

    res.json({
      success: true,
      data: diaries
    })
  } catch (error) {
    console.error('获取随机舔狗日记失败:', error)
    res.status(500).json({
      success: false,
      message: '获取随机舔狗日记失败',
      error: error.message
    })
  }
}

module.exports = {
  getDailyDiary,
  getRandomDiary,
  getDiaryList,
  getRandomDiaries
}
