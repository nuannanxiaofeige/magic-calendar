const express = require('express')
const router = express.Router()
const workerDiaryController = require('../controllers/worker-diary')

/**
 * @route GET /api/worker-diary/daily
 * @description 获取每日打工者日记（仅工作日返回）
 */
router.get('/daily', workerDiaryController.getWorkerDiary)

/**
 * @route GET /api/worker-diary/check-workday
 * @description 检查指定日期是否为工作日
 */
router.get('/check-workday', workerDiaryController.checkWorkday)

module.exports = router
