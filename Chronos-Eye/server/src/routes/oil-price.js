/**
 * 油价查询路由
 * 提供全国各省市油价查询
 */

const express = require('express')
const router = express.Router()
const { getLatestOilPrice, getLatestInternationalCrude, getAdjustmentHistory } = require('../services/oil-price-sync')
const { exec } = require('child_process')
const path = require('path')
const dayjs = require('dayjs')

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
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误'
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
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误'
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
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误'
    })
  }
})

/**
 * 获取下次调价窗口日期
 * GET /api/oil-price/next-adjust
 */
router.get('/next-adjust', async (req, res) => {
  try {
    // 使用 Python 脚本获取调价窗口日期
    const pythonCmd = path.join(__dirname, '../../venv/bin/python3')
    const scriptPath = path.join(__dirname, '../../scripts/oil_price_crawler.py')

    // 调用 Python 获取调价窗口日期
    const { execSync } = require('child_process')
    const script = `
import sys
sys.path.insert(0, '.')
from oil_price_crawler import get_adjustment_window_dates, get_next_adjust_date
import json

# 尝试获取下一个调价日期
next_date = get_next_adjust_date()
# 尝试获取全年调价窗口
year = ${new Date().getFullYear()}
window_dates = get_adjustment_window_dates(year)

result = {
    'next_date_text': next_date,
    'window_dates': window_dates[:10] if window_dates else [],  # 只返回前10个
    'year': year
}
print(json.dumps(result))
`

    let result
    try {
      const stdout = execSync(`${pythonCmd} -c "${script.replace(/"/g, '\\"')}"`, {
        cwd: path.join(__dirname, '../../scripts')
      })
      result = JSON.parse(stdout.trim())
    } catch (pyErr) {
      console.error('Python 脚本执行失败:', pyErr.message)
      // 返回默认值
      result = {
        next_date_text: null,
        window_dates: [],
        year: new Date().getFullYear()
      }
    }

    // 从调价窗口日期列表中找出下一个日期
    let nextAdjustDate = null
    let nextAdjustWeekday = null

    if (result.window_dates && result.window_dates.length > 0) {
      const today = dayjs().format('YYYY-MM-DD')
      for (const dateStr of result.window_dates) {
        if (dateStr >= today) {
          nextAdjustDate = dateStr
          // 计算星期几
          const date = new Date(dateStr)
          const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
          nextAdjustWeekday = weekdays[date.getDay()]
          break
        }
      }
    }

    // 如果 Python 返回了文本信息，优先使用
    if (result.next_date_text && !nextAdjustDate) {
      res.json({
        success: true,
        data: {
          next_date_text: result.next_date_text,
          next_date: null,
          next_weekday: null,
          days_until: null
        }
      })
    } else {
      // 计算距离天数
      let daysUntil = null
      if (nextAdjustDate) {
        daysUntil = dayjs(nextAdjustDate).diff(dayjs().startOf('day'), 'day')
      }

      res.json({
        success: true,
        data: {
          next_date_text: nextAdjustDate ? `${nextAdjustDate} ${nextAdjustWeekday}` : null,
          next_date: nextAdjustDate,
          next_weekday: nextAdjustWeekday,
          days_until: daysUntil
        }
      })
    }
  } catch (error) {
    console.error('获取下次调价日期失败:', error.message)
    res.json({
      success: false,
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误'
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
