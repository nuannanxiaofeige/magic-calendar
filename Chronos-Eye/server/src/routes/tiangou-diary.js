const express = require('express')
const router = express.Router()
const tiangouDiaryController = require('../controllers/tiangou-diary')

/**
 * @route GET /api/tiangou-diary/daily
 * @description 获取每日舔狗日记（每天一条，同一天获取的是同一条）
 */
router.get('/daily', tiangouDiaryController.getDailyDiary)

/**
 * @route GET /api/tiangou-diary/random
 * @description 获取随机一条舔狗日记
 */
router.get('/random', tiangouDiaryController.getRandomDiary)

/**
 * @route GET /api/tiangou-diary/list
 * @description 获取舔狗日记列表（分页）
 */
router.get('/list', tiangouDiaryController.getDiaryList)

/**
 * @route GET /api/tiangou-diary/randoms
 * @description 获取多条随机舔狗日记
 */
router.get('/randoms', tiangouDiaryController.getRandomDiaries)

module.exports = router
