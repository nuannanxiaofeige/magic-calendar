const express = require('express')
const router = express.Router()
const historyController = require('../controllers/historyController')

// 获取历史上的今天（列表）
router.get('/today/list', historyController.getHistoryTodayList)

// 获取历史上的今天（随机一条）
router.get('/today', historyController.getHistoryToday)

// 按分类获取历史事件
router.get('/today/category/:category', historyController.getHistoryByCategory)

// 获取热门历史事件
router.get('/today/featured', historyController.getFeaturedHistory)

// 搜索历史事件
router.get('/search', historyController.searchHistoryEvents)

// 获取历史事件详情
router.get('/event/:id', historyController.getHistoryEventById)

// 添加历史事件（管理员）
router.post('/event', historyController.addHistoryEvent)

module.exports = router
