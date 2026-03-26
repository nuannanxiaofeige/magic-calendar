const express = require('express')
const router = express.Router()
const idiomQuizService = require('../services/idiom-quiz')

/**
 * @route GET /api/idiom-quiz/random
 * @description 获取随机一道成语填词题目
 * @param {number} [diff] - 难度等级（可选）：1=一般，2=中等，3=困难
 * @returns {Object} 成语填词题目数据
 */
router.get('/random', async (req, res) => {
  try {
    const { diff } = req.query
    const data = await idiomQuizService.getIdiomQuiz(diff ? parseInt(diff, 10) : null)

    if (data) {
      res.json({
        code: 200,
        msg: 'success',
        data: data
      })
    } else {
      res.json({
        code: 404,
        msg: '暂无题目',
        data: null
      })
    }
  } catch (error) {
    console.error('获取成语填词题目失败:', error)
    res.json({
      code: 500,
      msg: '获取题目失败',
      data: null
    })
  }
})

/**
 * @route POST /api/idiom-quiz/verify
 * @description 验证用户答案
 * @param {number} id - 题目 ID
 * @param {string} answer - 用户选择的答案
 * @returns {Object} 验证结果
 */
router.post('/verify', async (req, res) => {
  try {
    const { id, answer } = req.body

    if (!id || !answer) {
      return res.json({
        code: 400,
        msg: '参数错误',
        data: null
      })
    }

    const result = await idiomQuizService.verifyAnswer(id, answer)

    res.json({
      code: 200,
      msg: result.message,
      data: result
    })
  } catch (error) {
    console.error('验证答案失败:', error)
    res.json({
      code: 500,
      msg: '验证失败',
      data: null
    })
  }
})

/**
 * @route GET /api/idiom-quiz/detail/:id
 * @description 获取成语详情（包含解释）
 * @param {number} id - 题目 ID
 * @returns {Object} 成语详情数据
 */
router.get('/detail/:id', async (req, res) => {
  try {
    const { id } = req.params
    const data = await idiomQuizService.getIdiomDetail(parseInt(id, 10))

    if (data) {
      res.json({
        code: 200,
        msg: 'success',
        data: data
      })
    } else {
      res.json({
        code: 404,
        msg: '成语不存在',
        data: null
      })
    }
  } catch (error) {
    console.error('获取成语详情失败:', error)
    res.json({
      code: 500,
      msg: '获取详情失败',
      data: null
    })
  }
})

module.exports = router
