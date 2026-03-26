const { query } = require('../config/database')
const dayjs = require('dayjs')

/**
 * 获取指定日期的舔狗日记（每日一条）
 * 使用日期作为种子，确保同一天获取的是同一条
 */
async function getDailyDiary(req, res) {
  try {
    const { date } = req.query
    const targetDate = date ? dayjs(date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')

    // 使用日期计算一个偏移量，作为 RAND() 的种子
    const dateObj = dayjs(targetDate)
    const seed = dateObj.year() * 10000 + dateObj.month() * 100 + dateObj.date()

    // 使用种子获取随机一条（同一天总是返回同一条）
    const diary = await query(`
      SELECT id, content, created_at
      FROM tiangou_diary
      ORDER BY RAND(${seed})
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
