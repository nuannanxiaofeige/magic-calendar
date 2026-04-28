/**
 * 星座运势路由
 * 集成天行数据 API，支持缓存到数据库
 * 包含今日、本周、本月、年度运势
 */

const express = require('express')
const router = express.Router()
const db = require('../config/database')
const { getFullConstellationFortune, getConstellationFortune, constellationMap, getConstellationMatch, generateLocalConstellationMatch } = require('../services/tianapi')

// 日期类型映射
const dateTypeMap = {
  'today': 0,
  'tomorrow': 1,
  'week': 7,
  'month': 30,
  'year': 365
}

// 12 星座列表
const ALL_SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'
]

// 星座名校验
function isValidSign(sign) {
  return ALL_SIGNS.includes(sign?.toLowerCase())
}

/**
 * 获取指定星座的完整运势（包含今日、本周、本月、年度）
 * GET /api/constellation/:sign/full
 */
router.get('/:sign/full', async (req, res) => {
  try {
    const { sign } = req.params

    if (!isValidSign(sign)) {
      return res.json({ success: false, message: '无效的星座参数' })
    }

    const dateStr = new Date().toISOString().split('T')[0]

    // 从数据库获取数据
    const [rows] = await db.query(`
      SELECT * FROM constellation_fortune
      WHERE date = ? AND sign = ?
    `, [dateStr, sign])

    if (rows && rows.length > 0) {
      // 数据库有缓存数据
      const row = rows[0]
      const data = formatFullFortuneData(row)
      res.json({ success: true, data, source: 'cache' })
    } else {
      // 数据库没有数据，从天行 API 获取
      const fortune = await getFullConstellationFortune(sign, dateStr)

      if (fortune) {
        // 存储到数据库
        await saveFullFortuneToDB(fortune, dateStr)
        const data = formatFullFortuneData(fortune)
        res.json({ success: true, data, source: 'tianapi' })
      } else {
        // API 失败时使用本地生成
        const data = generateFullLocalFortune(sign)
        res.json({ success: true, data, source: 'local' })
      }
    }
  } catch (error) {
    console.error('获取星座运势失败:', error.message)
    const { sign } = req.params
    const data = generateFullLocalFortune(sign)
    res.json({ success: true, data, source: 'local' })
  }
})

/**
 * 获取指定星座指定日期类型的运势
 * GET /api/constellation/:sign/:dateType
 */
router.get('/:sign/:dateType', async (req, res) => {
  try {
    const { sign, dateType } = req.params

    if (!isValidSign(sign)) {
      return res.json({ success: false, message: '无效的星座参数' })
    }

    const daysOffset = dateTypeMap[dateType] || 0

    // 计算目标日期
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + daysOffset)
    const dateStr = targetDate.toISOString().split('T')[0]

    // 从数据库获取数据
    // 使用 DATE_FORMAT() 函数比较日期部分，忽略时区问题
    const [rows] = await db.query(`
      SELECT sign, sign_name, overall, love, work, wealth, health,
             lucky_color, lucky_number, match_sign, summary,
             week_overall, week_love, week_work, week_wealth, week_health, week_summary,
             month_overall, month_love, month_work, month_wealth, month_health, month_summary,
             year_overall, year_love, year_work, year_wealth, year_health, year_summary
      FROM constellation_fortune
      WHERE DATE_FORMAT(date, '%Y-%m-%d') = ? AND sign = ?
    `, [dateStr, sign])

    if (rows && rows.length > 0) {
      // 数据库有缓存数据
      const row = rows[0]
      const data = formatFortuneData(row, sign, dateType)
      res.json({ success: true, data, source: 'cache' })
    } else {
      // 数据库没有数据，从天行 API 获取
      const fortune = await getFullConstellationFortune(sign, dateStr)

      if (fortune) {
        // 存储到数据库
        await saveFullFortuneToDB(fortune, dateStr)
        const data = formatFortuneData(fortune, sign, dateType)
        res.json({ success: true, data, source: 'tianapi' })
      } else {
        // API 失败时使用本地生成
        const data = generateLocalFortune(sign, dateType, targetDate)
        res.json({ success: true, data, source: 'local' })
      }
    }
  } catch (error) {
    console.error('获取星座运势失败:', error.message)
    // 出错时返回本地生成的运势
    const { sign, dateType } = req.params
    const targetDate = new Date()
    const data = generateLocalFortune(sign, dateType, targetDate)
    res.json({ success: true, data, source: 'local' })
  }
})

/**
 * 批量获取 12 星座今日运势
 * GET /api/constellation/all/today
 */
router.get('/all/today', async (req, res) => {
  try {
    const dateStr = new Date().toISOString().split('T')[0]
    const results = []

    // 从数据库批量获取
    const [rows] = await db.query(`
      SELECT sign, sign_name, overall, love, work, wealth, health,
             lucky_color, lucky_number, match_sign, summary
      FROM constellation_fortune
      WHERE date = ?
    `, [dateStr])

    if (rows && rows.length > 0) {
      // 有缓存数据
      for (const row of rows) {
        results.push({
          success: true,
          data: formatFortuneData(row, row.sign, 'today'),
          source: 'cache'
        })
      }
      res.json({ success: true, data: results })
    } else {
      // 从天行 API 批量获取
      for (const sign of ALL_SIGNS) {
        const fortune = await getConstellationFortune(sign, dateStr)
        if (fortune) {
          await saveFortuneToDB(fortune, dateStr)
          results.push({
            success: true,
            data: formatFortuneData(fortune, sign, 'today'),
            source: 'tianapi'
          })
        } else {
          results.push({
            success: false,
            data: generateLocalFortune(sign, 'today', new Date()),
            source: 'local'
          })
        }
        // 每次 API 调用后延迟 200ms，避免频率超限
        await new Promise(resolve => setTimeout(resolve, 200))
      }
      res.json({ success: true, data: results })
    }
  } catch (error) {
    console.error('批量获取星座运势失败:', error.message)
    res.json({ success: false, error: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误' })
  }
})

/**
 * 保存运势数据到数据库
 */
async function saveFortuneToDB(fortune, dateStr) {
  try {
    await db.run(`
      INSERT INTO constellation_fortune
      (date, sign, sign_name, overall, love, work, wealth, health,
       lucky_color, lucky_number, match_sign, summary)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        overall = VALUES(overall),
        love = VALUES(love),
        work = VALUES(work),
        wealth = VALUES(wealth),
        health = VALUES(health),
        lucky_color = VALUES(lucky_color),
        lucky_number = VALUES(lucky_number),
        match_sign = VALUES(match_sign),
        summary = VALUES(summary),
        updated_at = CURRENT_TIMESTAMP
    `, [
      dateStr,
      fortune.sign,
      fortune.sign_name || constellationMap[fortune.sign] || fortune.sign,
      fortune.overall || 0,
      fortune.love || 0,
      fortune.work || 0,
      fortune.wealth || 0,
      fortune.health || 0,
      fortune.lucky_color || null,
      fortune.lucky_number || 0,
      fortune.match_sign || null,
      fortune.summary || null
    ])
  } catch (error) {
    console.error('保存星座运势到数据库失败:', error.message)
  }
}

/**
 * 保存完整运势数据到数据库（包含今日、周运、月运、年运）
 */
async function saveFullFortuneToDB(fortune, dateStr) {
  try {
    await db.run(`
      INSERT INTO constellation_fortune
      (date, sign, sign_name,
       overall, love, work, wealth, health,
       lucky_color, lucky_number, match_sign, summary,
       week_overall, week_love, week_work, week_wealth, week_health, week_summary, week_lucky_color, week_lucky_number,
       month_overall, month_love, month_work, month_wealth, month_health, month_summary, month_lucky_color, month_lucky_number,
       year_overall, year_love, year_work, year_wealth, year_health, year_summary)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        overall = VALUES(overall),
        love = VALUES(love),
        work = VALUES(work),
        wealth = VALUES(wealth),
        health = VALUES(health),
        lucky_color = VALUES(lucky_color),
        lucky_number = VALUES(lucky_number),
        match_sign = VALUES(match_sign),
        summary = VALUES(summary),
        week_overall = VALUES(week_overall),
        week_love = VALUES(week_love),
        week_work = VALUES(week_work),
        week_wealth = VALUES(week_wealth),
        week_health = VALUES(week_health),
        week_summary = VALUES(week_summary),
        week_lucky_color = VALUES(week_lucky_color),
        week_lucky_number = VALUES(week_lucky_number),
        month_overall = VALUES(month_overall),
        month_love = VALUES(month_love),
        month_work = VALUES(month_work),
        month_wealth = VALUES(month_wealth),
        month_health = VALUES(month_health),
        month_summary = VALUES(month_summary),
        month_lucky_color = VALUES(month_lucky_color),
        month_lucky_number = VALUES(month_lucky_number),
        year_overall = VALUES(year_overall),
        year_love = VALUES(year_love),
        year_work = VALUES(year_work),
        year_wealth = VALUES(year_wealth),
        year_health = VALUES(year_health),
        year_summary = VALUES(year_summary),
        updated_at = CURRENT_TIMESTAMP
    `, [
      dateStr,
      fortune.sign,
      fortune.sign_name || constellationMap[fortune.sign] || fortune.sign,
      fortune.overall || 0,
      fortune.love || 0,
      fortune.work || 0,
      fortune.wealth || 0,
      fortune.health || 0,
      fortune.lucky_color || null,
      fortune.lucky_number || 0,
      fortune.match_sign || null,
      fortune.summary || null,
      // 周运
      fortune.week_overall || 0,
      fortune.week_love || 0,
      fortune.week_work || 0,
      fortune.week_wealth || 0,
      fortune.week_health || 0,
      fortune.week_summary || null,
      fortune.week_lucky_color || null,
      fortune.week_lucky_number || 0,
      // 月运
      fortune.month_overall || 0,
      fortune.month_love || 0,
      fortune.month_work || 0,
      fortune.month_wealth || 0,
      fortune.month_health || 0,
      fortune.month_summary || null,
      fortune.month_lucky_color || null,
      fortune.month_lucky_number || 0,
      // 年运
      fortune.year_overall || 0,
      fortune.year_love || 0,
      fortune.year_work || 0,
      fortune.year_wealth || 0,
      fortune.year_health || 0,
      fortune.year_summary || null
    ])
  } catch (error) {
    console.error('保存星座运势到数据库失败:', error.message)
  }
}

// 格式化数据库返回的完整运势数据（包含今日、周运、月运、年运）
function formatFullFortuneData(row) {
  return {
    sign: row.sign,
    sign_name: row.sign_name,
    // 今日运势
    today: {
      totalScore: row.overall || Math.round((row.love + row.wealth + row.work + row.health) / 4),
      overall: row.overall || 0,
      love: row.love || 0,
      work: row.work || 0,
      wealth: row.wealth || 0,
      health: row.health || 0,
      luckyColor: row.lucky_color || '',
      luckyNumber: row.lucky_number || 0,
      matchSign: row.match_sign || '',
      description: row.summary || '',
      motto: getMottoBySign(row.sign)
    },
    // 周运
    week: {
      totalScore: row.week_overall || Math.round((row.week_love + row.week_work + row.week_wealth + row.week_health) / 4),
      overall: row.week_overall || 0,
      love: row.week_love || 0,
      work: row.week_work || 0,
      wealth: row.week_wealth || 0,
      health: row.week_health || 0,
      luckyColor: row.week_lucky_color || '',
      luckyNumber: row.week_lucky_number || 0,
      description: row.week_summary || ''
    },
    // 月运
    month: {
      totalScore: row.month_overall || Math.round((row.month_love + row.month_work + row.month_wealth + row.month_health) / 4),
      overall: row.month_overall || 0,
      love: row.month_love || 0,
      work: row.month_work || 0,
      wealth: row.month_wealth || 0,
      health: row.month_health || 0,
      luckyColor: row.month_lucky_color || '',
      luckyNumber: row.month_lucky_number || 0,
      description: row.month_summary || ''
    },
    // 年运
    year: {
      totalScore: row.year_overall || Math.round((row.year_love + row.year_work + row.year_wealth + row.year_health) / 4),
      overall: row.year_overall || 0,
      love: row.year_love || 0,
      work: row.year_work || 0,
      wealth: row.year_wealth || 0,
      health: row.year_health || 0,
      description: row.year_summary || '',
      rulingPlanet: getRulingPlanet(row.sign),
      rulingPlanetDesc: getRulingPlanetDesc(getRulingPlanet(row.sign))
    }
  }
}

// 格式化数据库返回的运势数据
function formatFortuneData(row, sign, dateType) {
  return {
    sign: row.sign,
    sign_name: row.sign_name,
    totalScore: row.overall || Math.round((row.love + row.wealth + row.work + row.health) / 4),
    overall: row.overall || 0,
    love: row.love || 0,
    work: row.work || 0,
    wealth: row.wealth || 0,
    health: row.health || 0,
    motto: getMottoBySign(sign),
    description: row.summary || '',
    luckyColor: row.lucky_color || '',
    luckyNumber: row.lucky_number || 0,
    matchSign: row.match_sign || '',
    rulingPlanet: getRulingPlanet(sign),
    rulingPlanetDesc: getRulingPlanetDesc(sign),
    astroEvents: generateAstroEvents(sign, dateType)
  }
}

// 获取星座守护星
function getRulingPlanet(sign) {
  const planets = {
    'aries': '火星',
    'taurus': '金星',
    'gemini': '水星',
    'cancer': '月亮',
    'leo': '太阳',
    'virgo': '水星',
    'libra': '金星',
    'scorpio': '火星',
    'sagittarius': '木星',
    'capricorn': '土星',
    'aquarius': '土星',
    'pisces': '木星'
  }
  return planets[sign] || '火星'
}

// 获取守护星描述
function getRulingPlanetDesc(planet) {
  const descs = {
    '火星': '行动力与决断力的象征',
    '金星': '爱情与美的守护者',
    '水星': '沟通与智慧的使者',
    '月亮': '情绪与直觉的主宰',
    '太阳': '生命力与创造力的源泉',
    '木星': '幸运与扩张的行星',
    '土星': '责任与考验的老师'
  }
  return descs[planet] || '守护星座的能量之源'
}

// 根据星座获取心情星语
function getMottoBySign(sign) {
  const mottos = {
    'aries': '勇往直前，无畏挑战',
    'taurus': '踏实前行，静待花开',
    'gemini': '变化万千，精彩无限',
    'cancer': '温柔如水，滋养万物',
    'leo': '闪耀自我，照亮他人',
    'virgo': '精益求精，成就完美',
    'libra': '平衡和谐，美好相伴',
    'scorpio': '深邃神秘，洞察一切',
    'sagittarius': '自由奔放，追逐梦想',
    'capricorn': '坚韧不拔，志在巅峰',
    'aquarius': '独立思考，创新无限',
    'pisces': '梦幻浪漫，心怀善意'
  }
  return mottos[sign] || '见春天不见故人，敬山水不敬过往'
}

// 生成天文事件
function generateAstroEvents(sign, dateType) {
  const events = [
    { time: '06:00', event: '日出', suggest: '适合晨练，开启活力一天' },
    { time: '09:00', event: '工作吉时', suggest: '处理重要事务效率高' },
    { time: '12:00', event: '午间休息', suggest: '适当放松，补充能量' },
    { time: '15:00', event: '创意时刻', suggest: '灵感涌现，适合 brainstorm' },
    { time: '18:00', event: '社交吉时', suggest: '适合约会或朋友聚会' },
    { time: '21:00', event: '静心时刻', suggest: '冥想或阅读，沉淀心灵' }
  ]
  return events.slice(0, 4)
}

// 生成本地运势（后备方案）
function generateLocalFortune(sign, dateType, date) {
  const signIndex = Object.keys({
    'aries': 1, 'taurus': 2, 'gemini': 3, 'cancer': 4, 'leo': 5, 'virgo': 6,
    'libra': 7, 'scorpio': 8, 'sagittarius': 9, 'capricorn': 10, 'aquarius': 11, 'pisces': 12
  }).indexOf(sign) + 1

  const day = date.getDate()
  const month = date.getMonth() + 1
  const seed = day + month + signIndex * 7 + (dateTypeMap[dateType] || 0)

  const totalScore = 60 + (seed * 11) % 41

  const mottos = [
    '见春天不见故人，敬山水不敬过往',
    '心若向阳，无畏悲伤',
    '星光不问赶路人，时光不负有心人',
    '生活不止眼前的苟且，还有诗和远方',
    '愿你被这世界温柔以待',
    '所有的相遇，都是久别重逢'
  ]

  const descriptions = [
    '今天旺盛的精力会驱使着你排除万难，有效地控制事情的走势。',
    '运势平稳，适合处理日常事务，不宜做重大决定。',
    '创造力旺盛，适合进行艺术创作或解决复杂问题。',
    '人际关系良好，容易得到他人的帮助和支持。',
    '需要谨慎行事，避免做出重要决定，多观察少说话。',
    '财运较好，可能会有意外的收入，适合理财规划。'
  ]

  const luckyNumbers = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 27, 33]
  const colors = ['红色', '橙色', '黄色', '绿色', '青色', '蓝色', '紫色', '粉色', '白色', '黑色', '熟褐', '藏青']
  const matchSigns = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座']

  return {
    sign,
    sign_name: constellationMap[sign] || sign,
    totalScore,
    overall: totalScore,
    love: 50 + (seed * 7) % 51,
    work: 50 + (seed * 11) % 51,
    wealth: 50 + (seed * 13) % 51,
    health: 50 + (seed * 17) % 51,
    description: descriptions[seed % descriptions.length],
    motto: mottos[seed % mottos.length],
    luckyNumber: luckyNumbers[seed % luckyNumbers.length],
    luckyColor: colors[seed % colors.length],
    matchSign: matchSigns[(seed + signIndex) % matchSigns.length],
    rulingPlanet: getRulingPlanet(sign),
    rulingPlanetDesc: getRulingPlanetDesc(getRulingPlanet(sign)),
    astroEvents: generateAstroEvents(sign, dateType)
  }
}

// 生成完整的本地运势（包含今日、周运、月运、年运）
function generateFullLocalFortune(sign) {
  const now = new Date()
  const signIndex = Object.keys({
    'aries': 1, 'taurus': 2, 'gemini': 3, 'cancer': 4, 'leo': 5, 'virgo': 6,
    'libra': 7, 'scorpio': 8, 'sagittarius': 9, 'capricorn': 10, 'aquarius': 11, 'pisces': 12
  }).indexOf(sign) + 1

  const day = now.getDate()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const seed = day + month + signIndex * 7

  const luckyNumbers = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 27, 33]
  const colors = ['红色', '橙色', '黄色', '绿色', '青色', '蓝色', '紫色', '粉色', '白色', '黑色', '熟褐', '藏青']
  const matchSigns = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座']
  const descriptions = [
    '今天旺盛的精力会驱使着你排除万难，有效地控制事情的走势。',
    '运势平稳，适合处理日常事务，不宜做重大决定。',
    '创造力旺盛，适合进行艺术创作或解决复杂问题。',
    '人际关系良好，容易得到他人的帮助和支持。',
    '需要谨慎行事，避免做出重要决定，多观察少说话。',
    '财运较好，可能会有意外的收入，适合理财规划。'
  ]
  const weekSummaries = [
    '本周整体运势平稳上升，适合制定新计划并逐步实施。',
    '本周可能会遇到一些小挑战，但凭借你的智慧都能化解。',
    '本周是展现实力的好时机，积极主动会带来意外收获。',
    '本周需要保持耐心，稳扎稳打才能取得长远进步。',
    '本周人际关系良好，多与人交流合作会有意想不到的收获。'
  ]
  const monthSummaries = [
    '本月整体运势较好，各方面都有不错的表现。',
    '本月需要多加注意健康和情绪管理，保持平和心态。',
    '本月是学习和成长的好时机，适合充电提升自己。',
    '本月可能会有新的机会出现，要勇于把握。',
    '本月适合总结和规划，为下一阶段做好准备。'
  ]
  const yearSummaries = {
    aries: `${year}年是白羊座充满机遇的一年，事业上会有新的突破。`,
    taurus: `${year}年金牛座财运亨通，适合投资理财。`,
    gemini: `${year}年双子座思维活跃，学习能力强。`,
    cancer: `${year}年巨蟹座家庭运势佳，感情有新发展。`,
    leo: `${year}年狮子座事业运强劲，有机会晋升。`,
    virgo: `${year}年处女座注重细节会有收获。`,
    libra: `${year}年天秤座人际关系良好，合作机会多。`,
    scorpio: `${year}年天蝎座直觉敏锐，财运稳中有升。`,
    sagittarius: `${year}年射手座旅行运佳，视野更开阔。`,
    capricorn: `${year}年摩羯座事业稳步上升，努力有回报。`,
    aquarius: `${year}年水瓶座创意无限，适合尝试新事物。`,
    pisces: `${year}年双鱼座感情丰富，艺术运势强。`
  }

  return {
    sign,
    sign_name: constellationMap[sign] || sign,
    today: {
      totalScore: 60 + (seed * 11) % 41,
      overall: 60 + (seed * 11) % 41,
      love: 50 + (seed * 7) % 51,
      work: 50 + (seed * 11) % 51,
      wealth: 50 + (seed * 13) % 51,
      health: 50 + (seed * 17) % 51,
      luckyColor: colors[seed % colors.length],
      luckyNumber: luckyNumbers[seed % luckyNumbers.length],
      matchSign: matchSigns[(seed + signIndex) % matchSigns.length],
      description: descriptions[seed % descriptions.length],
      motto: getMottoBySign(sign)
    },
    week: {
      totalScore: 55 + (seed * 13) % 41,
      overall: 55 + (seed * 13) % 41,
      love: 50 + (seed * 9) % 51,
      work: 50 + (seed * 13) % 51,
      wealth: 50 + (seed * 15) % 51,
      health: 50 + (seed * 19) % 51,
      luckyColor: colors[(seed + 3) % colors.length],
      luckyNumber: luckyNumbers[(seed + 5) % luckyNumbers.length],
      description: weekSummaries[seed % weekSummaries.length]
    },
    month: {
      totalScore: 58 + (seed * 17) % 41,
      overall: 58 + (seed * 17) % 41,
      love: 50 + (seed * 11) % 51,
      work: 50 + (seed * 15) % 51,
      wealth: 50 + (seed * 17) % 51,
      health: 50 + (seed * 21) % 51,
      luckyColor: colors[(seed + 6) % colors.length],
      luckyNumber: luckyNumbers[(seed + 7) % luckyNumbers.length],
      description: monthSummaries[seed % monthSummaries.length]
    },
    year: {
      totalScore: 60 + (signIndex * 7 + year) % 35,
      overall: 60 + (signIndex * 7 + year) % 35,
      love: 55 + (signIndex * 9 + year) % 40,
      work: 58 + (signIndex * 11 + year) % 38,
      wealth: 52 + (signIndex * 13 + year) % 42,
      health: 65 + (signIndex * 5 + year) % 30,
      description: yearSummaries[sign] || `${year}年整体运势平稳。`,
      rulingPlanet: getRulingPlanet(sign),
      rulingPlanetDesc: getRulingPlanetDesc(getRulingPlanet(sign))
    }
  }
}

/**
 * 获取星座配对（双人模式）
 * GET /api/constellation/match?sign1=aries&sign2=taurus
 */
router.get('/match', async (req, res) => {
  try {
    const { sign1, sign2 } = req.query

    if (!sign1 || !sign2) {
      return res.json({ success: false, error: '缺少参数 sign1 或 sign2' })
    }

    // 从数据库获取配对数据
    const [rows] = await db.query(`
      SELECT * FROM constellation_match
      WHERE (sign1 = ? AND sign2 = ?) OR (sign1 = ? AND sign2 = ?)
    `, [sign1, sign2, sign2, sign1])

    if (rows && rows.length > 0) {
      // 数据库有缓存数据
      const row = rows[0]
      res.json({
        success: true,
        data: {
          sign1: row.sign1,
          sign2: row.sign2,
          sign1_name: row.sign1_name,
          sign2_name: row.sign2_name,
          title: row.title,
          grade: row.grade,
          content: row.content
        },
        source: 'cache'
      })
    } else {
      // 数据库没有数据，从天行 API 获取
      // 传入英文星座名，函数内部会转换为中文
      const result = await getConstellationMatch(sign1, sign2)

      if (result) {
        // 存储到数据库
        await db.run(`
          INSERT INTO constellation_match (sign1, sign2, sign1_name, sign2_name, title, grade, content)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            title = VALUES(title),
            grade = VALUES(grade),
            content = VALUES(content),
            updated_at = CURRENT_TIMESTAMP
        `, [result.sign1, result.sign2, result.sign1_name, result.sign2_name, result.title, result.grade, result.content])

        res.json({ success: true, data: result, source: 'tianapi' })
      } else {
        // API 失败时使用本地生成
        const localResult = generateLocalConstellationMatch(sign1, sign2)
        // 存储到数据库
        await db.run(`
          INSERT INTO constellation_match (sign1, sign2, sign1_name, sign2_name, title, grade, content)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            title = VALUES(title),
            grade = VALUES(grade),
            content = VALUES(content),
            updated_at = CURRENT_TIMESTAMP
        `, [localResult.sign1, localResult.sign2, localResult.sign1_name, localResult.sign2_name, localResult.title, localResult.grade, localResult.content])

        res.json({ success: true, data: localResult, source: 'local' })
      }
    }
  } catch (error) {
    console.error('获取星座配对失败:', error.message)
    res.json({ success: false, error: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误' })
  }
})

/**
 * 获取某星座与所有其他星座的配对（批量查询）
 * GET /api/constellation/match/:sign/all
 */
router.get('/match/:sign/all', async (req, res) => {
  try {
    const { sign } = req.params

    // 从数据库批量获取该星座与所有其他星座的配对
    const rows = await db.query(`
      SELECT * FROM constellation_match
      WHERE sign1 = ? OR sign2 = ?
      ORDER BY sign1, sign2
    `, [sign, sign])

    if (rows && rows.length > 0) {
      const data = rows.map(row => ({
        sign1: row.sign1,
        sign2: row.sign2,
        sign1_name: row.sign1_name,
        sign2_name: row.sign2_name,
        title: row.title,
        grade: row.grade,
        content: row.content
      }))
      res.json({ success: true, data, source: 'cache' })
    } else {
      res.json({ success: false, error: '暂无配对数据，请先同步数据' })
    }
  } catch (error) {
    console.error('批量获取星座配对失败:', error.message)
    res.json({ success: false, error: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误' })
  }
})

/**
 * 获取所有星座配对数据（12x12 全量）
 * GET /api/constellation/match/all
 */
router.get('/match/all', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT * FROM constellation_match
      ORDER BY sign1, sign2
    `)

    if (rows && rows.length > 0) {
      const data = rows.map(row => ({
        sign1: row.sign1,
        sign2: row.sign2,
        sign1_name: row.sign1_name,
        sign2_name: row.sign2_name,
        title: row.title,
        grade: row.grade,
        content: row.content
      }))
      res.json({ success: true, data, source: 'cache' })
    } else {
      res.json({ success: false, error: '暂无配对数据，请先同步数据' })
    }
  } catch (error) {
    console.error('获取全部星座配对失败:', error.message)
    res.json({ success: false, error: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误' })
  }
})

module.exports = router
