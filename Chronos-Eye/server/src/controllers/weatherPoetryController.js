/**
 * 天气诗句控制器
 */

const weatherPoetryService = require('../services/weather-poetry')

/**
 * 获取天气诗句
 * GET /api/weather-poetry?q=晴 或 GET /api/weather-poetry?type=9
 */
async function getWeatherPoetry(req, res) {
  try {
    const { q, type } = req.query

    // 支持通过名称或类型查询
    let weatherType = null

    if (type) {
      // 直接指定类型
      weatherType = parseInt(type)
    } else if (q) {
      // 通过天气名称查询
      const typeMap = {
        '风': 1, '大风': 1,
        '云': 2, '多云': 2,
        '雨': 3, '下雨': 3, '小雨': 3, '中雨': 3, '大雨': 3, '暴雨': 3,
        '雪': 4, '下雪': 4, '小雪': 4, '中雪': 4, '大雪': 4, '暴雪': 4,
        '霜': 5, '霜降': 5,
        '露': 6, '露水': 6,
        '雾': 7, '大雾': 7, '雾霾': 7,
        '雷': 8, '打雷': 8, '雷雨': 8, '雷电': 8,
        '晴': 9, '晴天': 9, '晴朗': 9,
        '阴': 10, '阴天': 10
      }
      weatherType = typeMap[q] || typeMap[q.trim()]
    }

    const result = await weatherPoetryService.getWeatherPoetry(weatherType)

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        message: '获取成功'
      })
    } else {
      res.status(404).json({
        success: false,
        message: result.message || '未找到对应的诗句'
      })
    }
  } catch (error) {
    console.error('获取天气诗句失败:', error)
    res.status(500).json({
      success: false,
      message: '获取失败，请稍后重试',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

/**
 * 批量获取天气诗句
 * GET /api/weather-poetry/multiple?type=9&count=5
 */
async function getMultipleWeatherPoetry(req, res) {
  try {
    const { type, count } = req.query

    if (!type) {
      return res.status(400).json({
        success: false,
        message: '请指定天气类型 (type 参数)'
      })
    }

    const weatherType = parseInt(type)
    const poetryCount = count ? parseInt(count) : 3

    const result = await weatherPoetryService.getMultipleWeatherPoetry(weatherType, poetryCount)

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        message: `获取 ${result.data.length} 条诗句`
      })
    } else {
      res.status(404).json({
        success: false,
        message: result.message
      })
    }
  } catch (error) {
    console.error('批量获取天气诗句失败:', error)
    res.status(500).json({
      success: false,
      message: '获取失败，请稍后重试'
    })
  }
}

/**
 * 获取天气类型列表
 * GET /api/weather-poetry/types
 */
async function getWeatherTypeList(req, res) {
  try {
    const result = await weatherPoetryService.getWeatherTypeList()

    res.json({
      success: true,
      data: result.data
    })
  } catch (error) {
    console.error('获取天气类型列表失败:', error)
    res.status(500).json({
      success: false,
      message: '获取失败'
    })
  }
}

/**
 * 获取诗句统计
 * GET /api/weather-poetry/stats
 */
async function getWeatherPoetryStats(req, res) {
  try {
    const result = await weatherPoetryService.getPoetryStats()

    res.json({
      success: true,
      data: result.data
    })
  } catch (error) {
    console.error('获取诗句统计失败:', error)
    res.status(500).json({
      success: false,
      message: '获取失败'
    })
  }
}

module.exports = {
  getWeatherPoetry,
  getMultipleWeatherPoetry,
  getWeatherTypeList,
  getWeatherPoetryStats
}
