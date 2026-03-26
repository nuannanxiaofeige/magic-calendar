const express = require('express')
const router = express.Router()
const holidayController = require('../controllers/holidayController')

// 获取下一个节假日 (放在 /:id 之前，避免被拦截)
router.get('/next', holidayController.getNextHoliday)

// 获取最近节日列表
router.get('/recent', holidayController.getRecentFestivals)

// 获取今日农历节日
router.get('/today-lunar', holidayController.getTodayLunarFestival)

// 获取农历节日列表
router.get('/lunar-list', holidayController.getLunarFestivals)

// 获取所有节日列表（节日大全）
router.get('/list', holidayController.getAllHolidays)

// 获取节假日列表
router.get('/', holidayController.getHolidays)

// 获取节假日详情
router.get('/:id', holidayController.getHolidayById)

// 获取倒计时列表
router.get('/countdown/list', holidayController.getCountdownList)

// 添加倒计时
router.post('/countdown/add', holidayController.addCountdown)

// 更新倒计时
router.put('/countdown/:id', holidayController.updateCountdown)

// 删除倒计时
router.delete('/countdown/:id', holidayController.deleteCountdown)

// 更新倒计时排序
router.put('/countdown/sort', holidayController.sortCountdowns)

// 获取指定日期的节假日
router.get('/date/:date', holidayController.getHolidaysByDate)

// 获取本月节假日
router.get('/month/:year/:month', holidayController.getHolidaysByMonth)

module.exports = router
