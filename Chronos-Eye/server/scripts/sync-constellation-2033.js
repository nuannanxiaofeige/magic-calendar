/**
 * 同步 2033 年星座运势数据到远程数据库
 * 用法：node scripts/sync-constellation-2033.js
 */

require('dotenv').config()
const mysql = require('mysql2/promise')
const https = require('https')

const signs = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'
]

const signMap = {
  'aries': '白羊座', 'taurus': '金牛座', 'gemini': '双子座', 'cancer': '巨蟹座',
  'leo': '狮子座', 'virgo': '处女座', 'libra': '天秤座', 'scorpio': '天蝎座',
  'sagittarius': '射手座', 'capricorn': '摩羯座', 'aquarius': '水瓶座', 'pisces': '双鱼座'
}

const TIANAPI_KEY = process.env.TIANAPI_KEY || '30b92001a007855fe7ea7328e8754e2a'

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function getConstellationFortune(sign, dateStr) {
  return new Promise((resolve, reject) => {
    const signCn = signMap[sign.toLowerCase()] || sign
    const url = new URL('https://apis.tianapi.com/star/index')
    url.searchParams.append('key', TIANAPI_KEY)
    url.searchParams.append('astro', signCn)
    url.searchParams.append('date', dateStr)

    https.get(url.toString(), (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try {
          const result = JSON.parse(data)
          if (result.code === 200 && result.result && Array.isArray(result.result.list)) {
            const fortune = { sign: sign }
            for (const item of result.result.list) {
              const { type: itemType, content } = item
              switch (itemType) {
                case '综合指数': fortune.overall = parseInt(content) || 0; break
                case '爱情指数': fortune.love = parseInt(content) || 0; break
                case '工作指数': fortune.work = parseInt(content) || 0; break
                case '财运指数': fortune.wealth = parseInt(content) || 0; break
                case '健康指数': fortune.health = parseInt(content) || 0; break
                case '幸运颜色': fortune.lucky_color = content; break
                case '幸运数字': fortune.lucky_number = parseInt(content) || 0; break
                case '贵人星座': fortune.match_sign = content; break
                case '今日概述': fortune.summary = content; break
              }
            }
            resolve({ success: true, data: fortune })
          } else {
            resolve({ success: false, code: result.code, msg: result.msg })
          }
        } catch (error) {
          reject(error)
        }
      })
    }).on('error', reject)
  })
}

function generatePeriodFortune(todayFortune, sign, period) {
  const signIndex = Object.keys(signMap).indexOf(sign.toLowerCase()) + 1
  const seed = signIndex * 7 + (period === 'week' ? 17 : 31)
  const baseOverall = todayFortune?.overall || 70
  const variation = (seed % 21) - 10

  const summaries = {
    week: ['本周运势平稳上升，适合制定新计划。', '本周可能会遇到小挑战，但都能化解。', '本周是展现实力的好时机。'],
    month: ['本月整体运势较好。', '本月需要多加注意健康。', '本月是学习成长的好时机。']
  }

  return {
    overall: Math.min(100, Math.max(0, baseOverall + variation)),
    love: Math.min(100, Math.max(0, (todayFortune?.love || 65) + (seed % 15) - 7)),
    work: Math.min(100, Math.max(0, (todayFortune?.work || 70) + (seed % 15) - 7)),
    wealth: Math.min(100, Math.max(0, (todayFortune?.wealth || 60) + (seed % 15) - 7)),
    health: Math.min(100, Math.max(0, (todayFortune?.health || 75) + (seed % 15) - 7)),
    summary: summaries[period][seed % summaries[period].length],
    lucky_color: ['红色', '蓝色', '绿色', '黄色', '紫色', '白色', '黑色'][seed % 7],
    lucky_number: (seed % 9) + 1
  }
}

function generateYearFortune(sign, dateStr) {
  const year = parseInt(dateStr.split('-')[0])
  const signIndex = Object.keys(signMap).indexOf(sign.toLowerCase()) + 1
  const seed = signIndex * 13 + year

  const yearSummaries = {
    aries: `${year}年是白羊座充满机遇的一年，事业上会有新突破。`,
    taurus: `${year}年金牛座财运亨通，适合投资理财。`,
    gemini: `${year}年双子座思维活跃，适合进修提升自己。`,
    cancer: `${year}年巨蟹座家庭运势佳，感情会有新发展。`,
    leo: `${year}年狮子座事业运强劲，有机会获得晋升。`,
    virgo: `${year}年处女座注重细节会有收获，需关注健康。`,
    libra: `${year}年天秤座人际关系良好，合作机会多。`,
    scorpio: `${year}年天蝎座直觉敏锐，财运稳中有升。`,
    sagittarius: `${year}年射手座旅行运佳，视野会更开阔。`,
    capricorn: `${year}年摩羯座事业稳步上升，努力会有回报。`,
    aquarius: `${year}年水瓶座创意无限，适合尝试新事物。`,
    pisces: `${year}年双鱼座感情丰富，艺术运势强。`
  }

  return {
    overall: 60 + (seed % 35),
    love: 55 + (seed % 40),
    work: 58 + (seed % 38),
    wealth: 52 + (seed % 42),
    health: 65 + (seed % 30),
    summary: yearSummaries[sign.toLowerCase()] || `${year}年整体运势平稳。`
  }
}

async function saveConstellationFortune(connection, fortune, dateStr) {
  const signName = signMap[fortune.sign] || fortune.sign
  const weekFortune = generatePeriodFortune(fortune, fortune.sign, 'week')
  const monthFortune = generatePeriodFortune(fortune, fortune.sign, 'month')
  const yearFortune = generateYearFortune(fortune.sign, dateStr)

  await connection.execute(`
    INSERT INTO constellation_fortune (
      date, sign, sign_name,
      overall, love, work, wealth, health,
      lucky_color, lucky_number, lucky_direction, match_sign,
      summary, yi, ji,
      week_overall, week_love, week_work, week_wealth, week_health, week_summary, week_lucky_color, week_lucky_number,
      month_overall, month_love, month_work, month_wealth, month_health, month_summary, month_lucky_color, month_lucky_number,
      year_overall, year_love, year_work, year_wealth, year_health, year_summary
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE overall = VALUES(overall)
  `, [
    dateStr, fortune.sign, signName,
    fortune.overall || 0, fortune.love || 0, fortune.work || 0, fortune.wealth || 0, fortune.health || 0,
    fortune.lucky_color || null, fortune.lucky_number || 0, null, fortune.match_sign || null,
    fortune.summary || null, null, null,
    weekFortune.overall, weekFortune.love, weekFortune.work, weekFortune.wealth, weekFortune.health, weekFortune.summary, weekFortune.lucky_color, weekFortune.lucky_number,
    monthFortune.overall, monthFortune.love, monthFortune.work, monthFortune.wealth, monthFortune.health, monthFortune.summary, monthFortune.lucky_color, monthFortune.lucky_number,
    yearFortune.overall, yearFortune.love, yearFortune.work, yearFortune.wealth, yearFortune.health, yearFortune.summary
  ])
}

async function main() {
  console.log('========== 同步 2033 年星座运势数据 ==========')

  const connection = await mysql.createConnection({
    host: '47.102.152.82',
    port: 3306,
    user: 'root',
    password: '_kIjZ9iVb@nt',
    database: 'chronos_eye'
  })

  console.log('数据库连接成功!')

  const year = 2033
  let successCount = 0
  let apiCallCount = 0
  let cachedCount = 0
  let apiErrorCount = 0

  const [existing] = await connection.query('SELECT COUNT(*) as total FROM constellation_fortune WHERE YEAR(date) = ?', [year])
  console.log(`${year}年已存在数据：${existing[0].total} 条`)

  for (let month = 1; month <= 12; month++) {
    const daysInMonth = new Date(year, month, 0).getDate()
    console.log(`\n--- 处理 ${year}-${String(month).padStart(2, '0')} ---`)

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

      for (const sign of signs) {
        try {
          const [check] = await connection.query(
            'SELECT id FROM constellation_fortune WHERE date = ? AND sign = ?',
            [dateStr, sign]
          )

          if (check.length > 0) {
            cachedCount++
            continue
          }

          const result = await getConstellationFortune(sign, dateStr)
          apiCallCount++

          if (result.success) {
            await saveConstellationFortune(connection, result.data, dateStr)
            successCount++
            apiErrorCount = 0
          } else {
            apiErrorCount++
            console.log(`  API 错误：${result.code} - ${result.msg}`)
            if (apiErrorCount >= 3) {
              console.log('  连续 API 错误，停止同步以避免浪费配额')
              await connection.end()
              process.exit(1)
            }
          }

          if (apiCallCount % 10 === 0) {
            await delay(1000)
          } else {
            await delay(200)
          }

          if (successCount % 50 === 0 || apiCallCount % 100 === 0) {
            console.log(`  进度：${dateStr} ${sign} - 成功:${successCount} 缓存:${cachedCount} API:${apiCallCount}`)
          }
        } catch (error) {
          console.error(`  ${dateStr} ${sign}: ${error.message}`)
          await delay(500)
        }
      }
    }
    console.log(`  ${year}-${String(month).padStart(2, '0')} 完成`)
  }

  console.log('\n========== 同步完成 ==========')
  console.log(`新增数据：${successCount} 条`)
  console.log(`缓存命中：${cachedCount} 条`)
  console.log(`API 调用：${apiCallCount} 次`)

  const [finalCount] = await connection.query('SELECT COUNT(*) as total FROM constellation_fortune WHERE YEAR(date) = ?', [year])
  console.log(`\n${year}年数据库中的总数据量：${finalCount[0].total} 条`)

  await connection.end()
  process.exit(0)
}

main().catch(console.error)
