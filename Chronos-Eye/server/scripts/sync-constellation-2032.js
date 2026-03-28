/**
 * 同步 2032 年星座运势数据到远程数据库
 * 用法：node scripts/sync-constellation-2032.js
 */

require('dotenv').config()
const mysql = require('mysql2/promise')
const tianapi = require('../src/services/tianapi')

const signs = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'
]

const signMap = tianapi.constellationMap

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  console.log('========== 同步 2032 年星座运势数据 ==========')

  const connection = await mysql.createConnection({
    host: '47.102.152.82',
    port: 3306,
    user: 'root',
    password: '_kIjZ9iVb@nt',
    database: 'chronos_eye'
  })

  console.log('数据库连接成功!')

  const year = 2032
  let successCount = 0
  let failCount = 0
  let apiCallCount = 0
  let cachedCount = 0

  // 检查已存在的数据
  const [existing] = await connection.query(`
    SELECT COUNT(*) as total FROM constellation_fortune
    WHERE YEAR(date) = ?
  `, [year])
  console.log(`\n${year}年已存在数据：${existing[0].total} 条`)

  // 遍历 2032 年每个月
  for (let month = 1; month <= 12; month++) {
    const daysInMonth = new Date(year, month, 0).getDate()
    console.log(`\n--- 处理 ${year}-${String(month).padStart(2, '0')} ---`)

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

      for (const sign of signs) {
        try {
          // 检查是否已存在
          const [check] = await connection.query(
            'SELECT id FROM constellation_fortune WHERE date = ? AND sign = ?',
            [dateStr, sign]
          )

          if (check.length > 0) {
            cachedCount++
            continue
          }

          // 从天行 API 获取运势数据
          const fortune = await tianapi.getFullConstellationFortune(sign, dateStr)
          apiCallCount++

          if (fortune) {
            await saveConstellationFortune(connection, fortune, dateStr)
            successCount++
          } else {
            failCount++
          }

          // 每 10 次 API 调用后延迟 1 秒，避免频率超限
          if (apiCallCount % 10 === 0) {
            await delay(1000)
          } else {
            await delay(200)
          }

          if (successCount % 50 === 0) {
            console.log(`  进度：${dateStr} ${sign} - 成功:${successCount} 缓存:${cachedCount} API 调用:${apiCallCount}`)
          }
        } catch (error) {
          failCount++
          console.error(`  ${dateStr} ${sign}: 保存失败 - ${error.message}`)
          await delay(500)
        }
      }
    }

    console.log(`  ${year}-${String(month).padStart(2, '0')} 完成，本月新增：${successCount} 条`)
  }

  console.log('\n========== 同步完成 ==========')
  console.log(`新增数据：${successCount} 条`)
  console.log(`缓存命中：${cachedCount} 条`)
  console.log(`API 调用：${apiCallCount} 次`)
  console.log(`失败：${failCount} 条`)

  // 验证结果
  const [finalCount] = await connection.query(`
    SELECT COUNT(*) as total FROM constellation_fortune WHERE YEAR(date) = ?
  `, [year])
  console.log(`\n${year}年数据库中的总数据量：${finalCount[0].total} 条`)

  await connection.end()
  process.exit(0)
}

async function saveConstellationFortune(connection, fortune, dateStr) {
  const signName = signMap[fortune.sign] || fortune.sign

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
    ON DUPLICATE KEY UPDATE
      overall = VALUES(overall),
      love = VALUES(love),
      work = VALUES(work),
      wealth = VALUES(wealth),
      health = VALUES(health),
      updated_at = CURRENT_TIMESTAMP
  `, [
    dateStr,
    fortune.sign,
    signName,
    fortune.overall || 0,
    fortune.love || 0,
    fortune.work || 0,
    fortune.wealth || 0,
    fortune.health || 0,
    fortune.lucky_color || null,
    fortune.lucky_number || 0,
    fortune.lucky_direction || null,
    fortune.match_sign || null,
    fortune.summary || null,
    fortune.yi || null,
    fortune.ji || null,
    fortune.week_overall || 0,
    fortune.week_love || 0,
    fortune.week_work || 0,
    fortune.week_wealth || 0,
    fortune.week_health || 0,
    fortune.week_summary || null,
    fortune.week_lucky_color || null,
    fortune.week_lucky_number || 0,
    fortune.month_overall || 0,
    fortune.month_love || 0,
    fortune.month_work || 0,
    fortune.month_wealth || 0,
    fortune.month_health || 0,
    fortune.month_summary || null,
    fortune.month_lucky_color || null,
    fortune.month_lucky_number || 0,
    fortune.year_overall || 0,
    fortune.year_love || 0,
    fortune.year_work || 0,
    fortune.year_wealth || 0,
    fortune.year_health || 0,
    fortune.year_summary || null
  ])
}

main().catch(console.error)
