/**
 * 生成星座运势数据脚本
 * 为指定日期生成 12 星座的运势数据
 */

require('dotenv').config()
const mysql = require('mysql2/promise')

// 星座数据
const constellations = [
  { en: 'aries', name: '白羊座' },
  { en: 'taurus', name: '金牛座' },
  { en: 'gemini', name: '双子座' },
  { en: 'cancer', name: '巨蟹座' },
  { en: 'leo', name: '狮子座' },
  { en: 'virgo', name: '处女座' },
  { en: 'libra', name: '天秤座' },
  { en: 'scorpio', name: '天蝎座' },
  { en: 'sagittarius', name: '射手座' },
  { en: 'capricorn', name: '摩羯座' },
  { en: 'aquarius', name: '水瓶座' },
  { en: 'pisces', name: '双鱼座' }
]

// 幸运颜色
const luckyColors = ['红色', '橙色', '黄色', '绿色', '青色', '蓝色', '紫色', '粉色', '白色', '黑色', '灰色', '金色', '银色']

// 幸运数字
const luckyNumbers = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 27, 33]

// 速配星座
const matchSigns = constellations.map(c => c.name)

// 宜忌事项
const yiList = ['约会', '购物', '运动', '学习', '工作', '旅行', '聚会', '阅读', '听音乐', '看电影', '品尝美食', '休息', '整理', '创作', '交流']
const jiList = ['熬夜', '争吵', '冲动消费', '懒惰', '浪费', '贪吃', '酗酒', '冒险', '犹豫不决', '抱怨', '放弃', '生气', '焦虑', '拖延']

// 综合运势描述
const overallDescriptions = [
  '今天运势不错，适合积极主动，会有意想不到的收获。保持乐观的心态，好运自然来。',
  '整体运势平稳，按部就班地完成各项任务，不宜有过大的动作和改变。',
  '运势略有波动，需要注意控制情绪，避免冲动行事。多听取他人建议。',
  '今天是个适合思考的日子，静下心来规划未来，会有新的启发和发现。',
  '精力充沛，行动力强，适合推进重要项目。但要注意不要过于急躁。',
  '财运较好，可能会有意外的收入。适合理财规划，但要避免冲动消费。',
  '感情运势上升，单身者有机会遇到心仪对象。有伴侣者感情更加甜蜜。',
  '事业运不错，工作上会有新的机会和挑战。保持自信，勇敢面对。',
  '健康运势需要关注，注意劳逸结合，避免过度疲劳。适当运动有益身心。',
  '人际关系良好，容易得到他人的帮助和支持。多参加社交活动，拓展人脉。',
  '创造力旺盛，适合进行艺术创作或解决复杂问题。灵感会不断涌现。',
  '需要谨慎行事，避免做出重要决定。多观察，少说话，等待更好的时机。'
]

// 根据日期和星座生成种子值
function getSeed(date, signIndex) {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return (year + month + day) * (signIndex + 1) + signIndex * 7
}

// 生成运势数据
function generateFortune(date, signIndex) {
  const seed = getSeed(date, signIndex)

  return {
    love: (seed * 13) % 101,
    wealth: (seed * 17) % 101,
    career: (seed * 19) % 101,
    health: (seed * 23) % 101,
    luckyColor: luckyColors[seed % luckyColors.length],
    luckyNumber: luckyNumbers[seed % luckyNumbers.length],
    matchSign: matchSigns[(seed + signIndex) % matchSigns.length],
    yi: shuffleArray(yiList, seed).slice(0, 3 + (seed % 3)).join('、'),
    ji: shuffleArray(jiList, seed + 100).slice(0, 2 + (seed % 2)).join('、'),
    overall: overallDescriptions[seed % overallDescriptions.length]
  }
}

// 伪随机打乱数组
function shuffleArray(array, seed) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = (seed * (i + 1)) % (i + 1)
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// 生成指定日期的星座运势数据
function generateDailyFortune(date) {
  const fortunes = []
  const dateStr = date.toISOString().split('T')[0]

  constellations.forEach((sign, index) => {
    const fortune = generateFortune(date, index)
    fortunes.push({
      date: dateStr,
      sign: sign.en,
      sign_name: sign.name,
      ...fortune
    })
  })

  return fortunes
}

// 批量生成多天的星座运势数据
function generateDateRangeFortune(startDate, days) {
  const allFortunes = []
  const date = new Date(startDate)

  for (let i = 0; i < days; i++) {
    const fortunes = generateDailyFortune(date)
    allFortunes.push(...fortunes)
    date.setDate(date.getDate() + 1)
  }

  return allFortunes
}

// 保存到数据库
async function saveFortunes(fortunes) {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'chronos_eye'
  })

  try {
    console.log(`开始保存 ${fortunes.length} 条星座运势数据...`)

    let inserted = 0
    const batchSize = 100

    for (let i = 0; i < fortunes.length; i += batchSize) {
      const batch = fortunes.slice(i, i + batchSize)

      for (const fortune of batch) {
        await connection.execute(`
          INSERT INTO constellation_fortune
          (date, sign, sign_name, love, wealth, career, health, lucky_color, lucky_number, match_sign, yi, ji, overall)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
          love = VALUES(love),
          wealth = VALUES(wealth),
          career = VALUES(career),
          health = VALUES(health),
          lucky_color = VALUES(lucky_color),
          lucky_number = VALUES(lucky_number),
          match_sign = VALUES(match_sign),
          yi = VALUES(yi),
          ji = VALUES(ji),
          overall = VALUES(overall)
        `, [
          fortune.date,
          fortune.sign,
          fortune.sign_name,
          fortune.love,
          fortune.wealth,
          fortune.career,
          fortune.health,
          fortune.luckyColor,
          fortune.luckyNumber,
          fortune.matchSign,
          fortune.yi,
          fortune.ji,
          fortune.overall
        ])
        inserted++
      }

      console.log(`已插入 ${inserted}/${fortunes.length} 条`)
    }

    console.log(`\n完成！共保存 ${inserted} 条星座运势数据`)

  } catch (error) {
    console.error('保存失败:', error.message)
    throw error
  } finally {
    await connection.end()
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2)
  const startDate = args[0] ? new Date(args[0]) : new Date()
  const days = parseInt(args[1]) || 30

  console.log(`生成从 ${startDate.toISOString().split('T')[0]} 开始的 ${days} 天星座运势数据`)

  const fortunes = generateDateRangeFortune(startDate, days)
  await saveFortunes(fortunes)
}

main().catch(console.error)
