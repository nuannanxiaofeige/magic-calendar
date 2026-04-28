/**
 * 智能日期查询路由
 */
const express = require('express')
const router = express.Router()
const calendarController = require('../controllers/calendarController')
const scheduler = require('../services/scheduler')
const authMiddleware = require('../middleware/auth')

// 获取指定日期信息
router.get('/date', calendarController.getDateInfo)

// 获取今日信息
router.get('/today', calendarController.getTodayInfo)

// 获取多历法信息
router.get('/calendar', calendarController.getCalendarInfo)

// 获取节假日/节气联动
router.get('/holiday-term-link', calendarController.getHolidayTermLink)

// 获取某年所有节气
router.get('/terms', calendarController.getSolarTerms)

// AI 增强查询：自然语言日期解析
router.get('/nlp-query', calendarController.parseNLPDate)

// 管理接口：手动触发同步全年数据
router.post('/sync', authMiddleware, async (req, res) => {
  try {
    const { year } = req.body
    await scheduler.manualSync(year)
    res.json({
      success: true,
      message: '数据同步完成'
    })
  } catch (error) {
    console.error('数据同步失败:', error.message)
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ? error.message : '同步失败'
    })
  }
})

module.exports = router
