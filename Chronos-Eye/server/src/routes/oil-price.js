/**
 * 油价查询路由
 * 提供全国各省市油价查询
 */

const express = require('express')
const router = express.Router()
const { getLatestOilPrice, getLatestInternationalCrude, getAdjustmentHistory } = require('../services/oil-price-sync')

// 省份代码映射
const provinceMap = {
  'beijing': '北京',
  'shanghai': '上海',
  'tianjin': '天津',
  'chongqing': '重庆',
  'guangdong': '广东',
  'jiangsu': '江苏',
  'zhejiang': '浙江',
  'shandong': '山东',
  'henan': '河南',
  'hebei': '河北',
  'hunan': '湖南',
  'hubei': '湖北',
  'sichuan': '四川',
  'shaanxi': '陕西',
  'anhui': '安徽',
  'fujian': '福建',
  'jiangxi': '江西',
  'liaoning': '辽宁',
  'heilongjiang': '黑龙江',
  'jilin': '吉林',
  'shanxi': '山西',
  'hainan': '海南',
  'guizhou': '贵州',
  'yunnan': '云南',
  'gansu': '甘肃',
  'qinghai': '青海',
  'neimenggu': '内蒙古',
  'guangxi': '广西',
  'ningxia': '宁夏',
  'xinjiang': '新疆',
  'xizang': '西藏'
}

/**
 * 获取默认油价数据（后备方案）
 */
function getDefaultOilPrice(provinceName) {
  // 基础油价（2026 年 3 月参考）
  const basePrice = {
    '92': 7.85,
    '95': 8.35,
    '98': 9.42,
    '0': 7.52
  }

  // 不同省份的油价浮动（偏远地区略高）
  const priceAdjustment = {
    '西藏': 0.3,
    '新疆': 0.2,
    '青海': 0.15,
    '甘肃': 0.1,
    '内蒙古': 0.1,
    '黑龙江': 0.1,
    '海南': 0.15,
    '云南': 0.08,
    '贵州': 0.05,
    '四川': 0.05
  }

  const adjustment = priceAdjustment[provinceName] || 0

  return {
    '92': (basePrice['92'] + adjustment).toFixed(2),
    '95': (basePrice['95'] + adjustment).toFixed(2),
    '98': (basePrice['98'] + adjustment).toFixed(2),
    '0': (basePrice['0'] + adjustment).toFixed(2),
    update_time: '2026 年 3 月 23 日'
  }
}

/**
 * 获取所有省份油价列表
 * GET /api/oil-price/list/all
 */
router.get('/list/all', async (req, res) => {
  try {
    const results = []

    for (const [code, name] of Object.entries(provinceMap)) {
      const dbData = await getLatestOilPrice(code)
      if (dbData) {
        results.push(dbData)
      }
    }

    res.json({
      success: true,
      data: results,
      source: 'database'
    })
  } catch (error) {
    console.error('批量查询油价失败:', error.message)
    res.json({
      success: false,
      error: error.message
    })
  }
})

/**
 * 获取国际原油价格
 * GET /api/oil-price/international
 */
router.get('/international', async (req, res) => {
  try {
    const data = await getLatestInternationalCrude()
    res.json({
      success: true,
      data: data,
      source: 'database'
    })
  } catch (error) {
    console.error('查询国际原油失败:', error.message)
    res.json({
      success: false,
      error: error.message
    })
  }
})

/**
 * 获取油价调整历史
 * GET /api/oil-price/history
 */
router.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20
    const data = await getAdjustmentHistory(limit)
    res.json({
      success: true,
      data: data,
      source: 'database'
    })
  } catch (error) {
    console.error('查询调整历史失败:', error.message)
    res.json({
      success: false,
      error: error.message
    })
  }
})

/**
 * 查询指定省份的油价
 * GET /api/oil-price/:province
 * 注意：动态路由必须放在最后，避免匹配 /international 和 /history
 */
router.get('/:province', async (req, res) => {
  try {
    const { province } = req.params
    const provinceName = provinceMap[province]

    if (!provinceName) {
      return res.json({
        success: false,
        error: '不支持的省份'
      })
    }

    // 从数据库获取最新数据
    const dbData = await getLatestOilPrice(province)

    if (dbData) {
      res.json({
        success: true,
        data: dbData,
        source: 'database'
      })
    } else {
      // 返回默认油价数据
      const defaultPrice = getDefaultOilPrice(provinceName)
      res.json({
        success: true,
        data: defaultPrice,
        source: 'default'
      })
    }
  } catch (error) {
    console.error('查询油价失败:', error.message)
    // 返回默认油价数据
    const defaultPrice = getDefaultOilPrice(req.params.province)
    res.json({
      success: true,
      data: defaultPrice,
      source: 'default'
    })
  }
})

module.exports = router
