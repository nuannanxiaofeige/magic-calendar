/**
 * 星座配对路由
 * 集成天行数据 API，支持缓存到数据库
 */

const express = require('express')
const router = express.Router()
const db = require('../config/database')
const { getConstellationMatch, getAllConstellationMatches, constellationMap, generateLocalConstellationMatch } = require('../services/tianapi')

// 12 星座列表
const ALL_SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'
]

/**
 * 星座配对查询
 * GET /api/constellation-match/match?sign1=aries&sign2=taurus
 */
router.get('/match', async (req, res) => {
  try {
    const { sign1, sign2 } = req.query

    if (!sign1) {
      return res.json({ success: false, message: '请提供 sign1 参数' })
    }

    // 将英文星座名转换为中文
    const sign1Cn = constellationMap[sign1.toLowerCase()] || sign1
    const sign2Cn = sign2 ? (constellationMap[sign2.toLowerCase()] || sign2) : null

    if (sign2Cn) {
      // 查询两个星座的配对
      // 先尝试从数据库获取
      const [rows] = await db.query(`
        SELECT * FROM constellation_match
        WHERE (sign1 = ? AND sign2 = ?) OR (sign1 = ? AND sign2 = ?)
        LIMIT 1
      `, [sign1.toLowerCase(), sign2.toLowerCase(), sign2.toLowerCase(), sign1.toLowerCase()])

      if (rows && rows.length > 0) {
        // 数据库有缓存
        const match = rows[0]
        res.json({ success: true, data: match, source: 'cache' })
      } else {
        // 从天行 API 获取
        const match = await getConstellationMatch(sign1.toLowerCase(), sign2.toLowerCase())
        if (match) {
          // 存储到数据库
          await saveMatchToDB(match)
          res.json({ success: true, data: match, source: 'tianapi' })
        } else {
          // API 失败时使用本地生成
          const localMatch = generateLocalConstellationMatch(sign1.toLowerCase(), sign2.toLowerCase())
          await saveMatchToDB(localMatch)
          res.json({ success: true, data: localMatch, source: 'local' })
        }
      }
    } else {
      // 查询一个星座与其他所有星座的配对
      const [rows] = await db.query(`SELECT * FROM constellation_match WHERE sign1 = ? ORDER BY sign2`, [sign1.toLowerCase()])

      if (rows && rows.length > 0) {
        res.json({ success: true, data: rows, source: 'cache' })
      } else {
        // 从天行 API 批量获取
        const matches = await getAllConstellationMatches(sign1.toLowerCase())
        if (matches && matches.length > 0) {
          // 批量存储到数据库
          for (const match of matches) {
            await saveMatchToDB(match)
          }
          res.json({ success: true, data: matches, source: 'tianapi' })
        } else {
          // API 失败时使用本地生成
          const localMatches = []
          const allSigns = ['taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces']
          for (const sign2 of allSigns) {
            const localMatch = generateLocalConstellationMatch(sign1.toLowerCase(), sign2)
            await saveMatchToDB(localMatch)
            localMatches.push(localMatch)
          }
          res.json({ success: true, data: localMatches, source: 'local' })
        }
      }
    }
  } catch (error) {
    console.error('获取星座配对失败:', error.message)
    res.json({ success: false, message: error.message })
  }
})

/**
 * 保存配对数据到数据库
 */
async function saveMatchToDB(match) {
  try {
    await db.run(`
      INSERT INTO constellation_match
      (sign1, sign2, sign1_name, sign2_name, title, grade, content)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        grade = VALUES(grade),
        content = VALUES(content),
        updated_at = CURRENT_TIMESTAMP
    `, [
      match.sign1,
      match.sign2,
      match.sign1_name,
      match.sign2_name,
      match.title,
      match.grade,
      match.content
    ])
  } catch (error) {
    console.error('保存星座配对到数据库失败:', error.message)
  }
}

/**
 * 批量缓存所有星座配对数据
 * GET /api/constellation-match/cache-all
 * 注意：此操作会调用大量 API，建议仅在后台任务中使用
 */
router.get('/cache-all', async (req, res) => {
  try {
    const results = []

    for (const sign1 of ALL_SIGNS) {
      const matches = await getConstellationMatchesForSign(sign1)
      results.push({ sign: sign1, count: matches.length })
      // 每次 API 调用后延迟 200ms，避免频率超限
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    res.json({ success: true, data: results })
  } catch (error) {
    console.error('批量缓存星座配对失败:', error.message)
    res.json({ success: false, message: error.message })
  }
})

/**
 * 获取单个星座的所有配对并缓存
 */
async function getConstellationMatchesForSign(sign1) {
  const sign1Cn = constellationMap[sign1] || sign1
  const matches = []

  for (const sign2 of ALL_SIGNS) {
    if (sign1 === sign2) continue

    const sign2Cn = constellationMap[sign2] || sign2

    // 检查是否已缓存
    const [cached] = await db.query(`
      SELECT * FROM constellation_match
      WHERE (sign1 = ? AND sign2 = ?) OR (sign1 = ? AND sign2 = ?)
      LIMIT 1
    `, [sign1, sign2, sign2, sign1])

    if (cached && cached.length > 0) {
      matches.push(cached[0])
      continue
    }

    // 从天行 API 获取
    const match = await getConstellationMatch(sign1, sign2)
    if (match) {
      await saveMatchToDB(match)
      matches.push(match)
    }
  }

  return matches
}

/**
 * 获取所有星座列表
 * GET /api/constellation-match/list
 */
router.get('/list', async (req, res) => {
  try {
    const data = Object.entries(constellationMap)
      .filter(([en]) => en.length < 15) // 只保留英文名
      .map(([en, cn]) => ({
        en,
        name: cn,
        symbol: getSignSymbol(cn)
      }))
    res.json({ success: true, data })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
})

// 获取星座符号
function getSignSymbol(signCn) {
  const symbols = {
    '白羊座': '♈',
    '金牛座': '♉',
    '双子座': '♊',
    '巨蟹座': '♋',
    '狮子座': '♌',
    '处女座': '♍',
    '天秤座': '♎',
    '天蝎座': '♏',
    '射手座': '♐',
    '摩羯座': '♑',
    '水瓶座': '♒',
    '双鱼座': '♓'
  }
  return symbols[signCn] || ''
}

module.exports = router
