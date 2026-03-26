/**
 * 天气诗句服务
 * 提供天气诗句查询功能，支持随机返回和指定天气类型
 */

const { query } = require('../config/database')

// 天气类型映射
const WEATHER_TYPES = {
  1: '风',
  2: '云',
  3: '雨',
  4: '雪',
  5: '霜',
  6: '露',
  7: '雾',
  8: '雷',
  9: '晴',
  10: '阴'
}

/**
 * 获取指定天气类型的诗句
 * @param {number} weatherType - 天气类型 (1-10)
 * @returns {Promise<{success: boolean, data?: object, message?: string}>}
 */
async function getWeatherPoetry(weatherType = null) {
  try {
    let result

    if (weatherType) {
      // 查询指定天气类型的诗句
      result = await query(`
        SELECT id, weather_type, weather_name, content, author, source
        FROM weather_poetry
        WHERE weather_type = ?
        ORDER BY RAND()
        LIMIT 1
      `, [weatherType])
    } else {
      // 随机查询任意天气类型的诗句
      result = await query(`
        SELECT id, weather_type, weather_name, content, author, source
        FROM weather_poetry
        ORDER BY RAND()
        LIMIT 1
      `)
    }

    if (result && result.length > 0) {
      const poetry = result[0]
      return {
        success: true,
        data: {
          weather_type: poetry.weather_type,
          weather_name: poetry.weather_name,
          content: poetry.content,
          author: poetry.author,
          source: poetry.source
        }
      }
    } else {
      return {
        success: false,
        message: '未找到对应的诗句'
      }
    }
  } catch (error) {
    console.error('获取天气诗句失败:', error)
    return {
      success: false,
      message: '查询失败，请稍后重试'
    }
  }
}

/**
 * 批量获取天气诗句（用于生成海报等场景）
 * @param {number} weatherType - 天气类型
 * @param {number} count - 数量
 * @returns {Promise<{success: boolean, data?: array, message?: string}>}
 */
async function getMultipleWeatherPoetry(weatherType, count = 3) {
  try {
    const result = await query(`
      SELECT id, weather_type, weather_name, content, author, source
      FROM weather_poetry
      WHERE weather_type = ?
      ORDER BY RAND()
      LIMIT ?
    `, [weatherType, count])

    if (result && result.length > 0) {
      return {
        success: true,
        data: result.map(item => ({
          weather_type: item.weather_type,
          weather_name: item.weather_name,
          content: item.content,
          author: item.author,
          source: item.source
        }))
      }
    } else {
      return {
        success: false,
        message: '未找到对应的诗句'
      }
    }
  } catch (error) {
    console.error('批量获取天气诗句失败:', error)
    return {
      success: false,
      message: '查询失败，请稍后重试'
    }
  }
}

/**
 * 获取所有天气类型列表
 * @returns {Promise<{success: boolean, data: array}>}
 */
async function getWeatherTypeList() {
  const types = Object.entries(WEATHER_TYPES).map(([type, name]) => ({
    type: parseInt(type),
    name: name
  }))

  return {
    success: true,
    data: types
  }
}

/**
 * 统计诗句数量
 * @returns {Promise<{success: boolean, data: object}>}
 */
async function getPoetryStats() {
  try {
    const result = await query(`
      SELECT weather_name, COUNT(*) as count
      FROM weather_poetry
      GROUP BY weather_type, weather_name
      ORDER BY weather_type
    `)

    const total = result.reduce((sum, item) => sum + item.count, 0)

    return {
      success: true,
      data: {
        total,
        byType: result
      }
    }
  } catch (error) {
    console.error('获取诗句统计失败:', error)
    return {
      success: false,
      message: '查询失败'
    }
  }
}

module.exports = {
  getWeatherPoetry,
  getMultipleWeatherPoetry,
  getWeatherTypeList,
  getPoetryStats,
  WEATHER_TYPES
}
