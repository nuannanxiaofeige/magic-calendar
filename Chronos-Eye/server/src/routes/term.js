/**
 * 节气百科路由
 */
const express = require('express')
const router = express.Router()
const termController = require('../controllers/termController')

// 获取所有节气列表
router.get('/list', termController.getTermList)

// 获取指定节气详情
router.get('/detail/:termName', termController.getTermDetail)

// 获取当前节气
router.get('/current', termController.getCurrentTerm)

// 获取今日节气百科
router.get('/today', termController.getTodayTermEncyclopedia)

// 获取指定年份节气时间
router.get('/dates/:year', termController.getTermDates)

// 搜索节气
router.get('/search', termController.searchTerms)

module.exports = router
