/**
 * 节气百科控制器
 * 提供节气详细信息查询
 */
const { query } = require('../config/database')
const { SolarTermCalculator } = require('../utils/calendar')

// 获取所有节气列表
async function getTermList(req, res) {
  try {
    const terms = await query(`
      SELECT term_name, term_order, lunar_month, lunar_day
      FROM almanac_terms
      ORDER BY term_order
    `)

    res.json({
      success: true,
      data: terms
    })
  } catch (error) {
    console.error('获取节气列表失败:', error)
    res.status(500).json({
      success: false,
      message: '获取节气列表失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误'
    })
  }
}

// 获取指定节气的详细信息
async function getTermDetail(req, res) {
  try {
    const { termName } = req.params

    const term = await query(`
      SELECT * FROM almanac_terms
      WHERE term_name = ?
    `, [termName])

    if (!term || term.length === 0) {
      return res.status(404).json({
        success: false,
        message: '节气不存在'
      })
    }

    res.json({
      success: true,
      data: term[0]
    })
  } catch (error) {
    console.error('获取节气详情失败:', error)
    res.status(500).json({
      success: false,
      message: '获取节气详情失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误'
    })
  }
}

// 获取当前节气
async function getCurrentTerm(req, res) {
  try {
    const termInfo = SolarTermCalculator.getTodayTerm()

    // 从数据库获取详细信息
    const detail = await query(`
      SELECT * FROM almanac_terms
      WHERE term_name = ?
    `, [termInfo.current.name])

    res.json({
      success: true,
      data: {
        current: termInfo.current,
        next: termInfo.next,
        detail: detail[0] || null
      }
    })
  } catch (error) {
    console.error('获取当前节气失败:', error)
    res.status(500).json({
      success: false,
      message: '获取当前节气失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误'
    })
  }
}

// 获取今日节气百科（包含详细信息）
async function getTodayTermEncyclopedia(req, res) {
  try {
    const termInfo = SolarTermCalculator.isTodayTerm()

    if (!termInfo.isTerm) {
      return res.json({
        success: true,
        data: null,
        message: '今日不是节气'
      })
    }

    const detail = await query(`
      SELECT * FROM almanac_terms
      WHERE term_name = ?
    `, [termInfo.term.name])

    res.json({
      success: true,
      data: {
        term: termInfo.term,
        detail: detail[0]
      }
    })
  } catch (error) {
    console.error('获取今日节气百科失败:', error)
    res.status(500).json({
      success: false,
      message: '获取今日节气百科失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误'
    })
  }
}

// 获取指定年份的节气时间表
async function getTermDates(req, res) {
  try {
    const { year } = req.params
    const targetYear = parseInt(year) || new Date().getFullYear()

    // 计算该年所有节气时间
    const dates = SolarTermCalculator.getTermDates(targetYear)

    res.json({
      success: true,
      data: dates
    })
  } catch (error) {
    console.error('获取节气时间失败:', error)
    res.status(500).json({
      success: false,
      message: '获取节气时间失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误'
    })
  }
}

// 搜索节气（按名称）
async function searchTerms(req, res) {
  try {
    const { keyword } = req.query

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: '请输入搜索关键词'
      })
    }

    const terms = await query(`
      SELECT term_name, term_order, origin, customs
      FROM almanac_terms
      WHERE term_name LIKE ? OR origin LIKE ? OR customs LIKE ?
      ORDER BY term_order
    `, [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`])

    res.json({
      success: true,
      data: terms
    })
  } catch (error) {
    console.error('搜索节气失败:', error)
    res.status(500).json({
      success: false,
      message: '搜索节气失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误'
    })
  }
}

module.exports = {
  getTermList,
  getTermDetail,
  getCurrentTerm,
  getTodayTermEncyclopedia,
  getTermDates,
  searchTerms
}
