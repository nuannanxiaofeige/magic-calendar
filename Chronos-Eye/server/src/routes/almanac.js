const express = require('express')
const router = express.Router()
const almanacController = require('../controllers/almanacController')

// 获取今日黄历
router.get('/today', almanacController.getTodayAlmanac)

// 获取指定日期黄历
router.get('/:date', almanacController.getAlmanacByDate)

// 获取本月黄历
router.get('/month/:year/:month', almanacController.getAlmanacByMonth)

// 获取吉日（宜某事的日子）
router.get('/auspicious/:event', almanacController.getAuspiciousDays)

// 获取天文台节气数据（新增）
router.get('/term/today', almanacController.getTodayTermInfo)

// 获取指定年份的节气数据
router.get('/term/:year', almanacController.getSolarTermsByYear)

// 获取太阳黄经数据
router.get('/solar/longitude', almanacController.getSolarLongitude)

module.exports = router
