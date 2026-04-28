const express = require('express')
const router = express.Router()
const scheduleController = require('../controllers/scheduleController')
const authMiddleware = require('../middleware/auth')

// 获取日程列表
router.get('/', scheduleController.getSchedules)

// 获取日程详情
router.get('/:id', scheduleController.getScheduleById)

// 创建日程（需要认证）
router.post('/', authMiddleware, scheduleController.createSchedule)

// 更新日程（需要认证）
router.put('/:id', authMiddleware, scheduleController.updateSchedule)

// 删除日程（需要认证）
router.delete('/:id', authMiddleware, scheduleController.deleteSchedule)

// 批量更新日程状态（需要认证）
router.put('/batch/status', authMiddleware, scheduleController.batchUpdateStatus)

// 获取日程统计
router.get('/stats/:year/:month', scheduleController.getMonthStats)

module.exports = router
