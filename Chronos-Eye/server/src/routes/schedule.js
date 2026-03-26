const express = require('express')
const router = express.Router()
const scheduleController = require('../controllers/scheduleController')

// 获取日程列表
router.get('/', scheduleController.getSchedules)

// 获取日程详情
router.get('/:id', scheduleController.getScheduleById)

// 创建日程
router.post('/', scheduleController.createSchedule)

// 更新日程
router.put('/:id', scheduleController.updateSchedule)

// 删除日程
router.delete('/:id', scheduleController.deleteSchedule)

// 批量更新日程状态
router.put('/batch/status', scheduleController.batchUpdateStatus)

// 获取日程统计
router.get('/stats/:year/:month', scheduleController.getMonthStats)

module.exports = router
