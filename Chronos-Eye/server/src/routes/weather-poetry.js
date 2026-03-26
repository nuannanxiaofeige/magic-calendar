/**
 * 天气诗句路由
 */

const express = require('express')
const router = express.Router()
const weatherPoetryController = require('../controllers/weatherPoetryController')

// 获取天气诗句（随机或指定类型）
router.get('/', weatherPoetryController.getWeatherPoetry)

// 批量获取天气诗句
router.get('/multiple', weatherPoetryController.getMultipleWeatherPoetry)

// 获取天气类型列表
router.get('/types', weatherPoetryController.getWeatherTypeList)

// 获取诗句统计
router.get('/stats', weatherPoetryController.getWeatherPoetryStats)

module.exports = router
