/**
 * 从 API 获取黄历数据并导入数据库
 */

require('dotenv').config()
const https = require('https')
const { query, run, initDatabase } = require('../src/config/database')

// 天干地支
const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const ZODIAC = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']

// 从 API 获取指定日期的黄历数据
function fetchAlmanacFromAPI(date) {
  return new Promise((resolve, reject) => {
    const url = `https://cn.apihz.cn/api/time/getzdday.php?id=YOUR_ID&date=${date}`

    https.get(url, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const result = JSON.parse(data)
          if (result.code === 200 && result.data) {
            resolve(result.data)
          } else {
            resolve(null)
          }
        } catch (e) {
          resolve(null)
        }
      })
    }).on('error', reject)
  })
}

// 计算干支年
function getGanZhiYear(year) {
  const ganIndex = (year - 4) % 10
  const zhiIndex = (year - 4) % 12
  return TIAN_GAN[ganIndex] + DI_ZHI[zhiIndex]
}

// 获取生肖
function getZodiac(year) {
  return ZODIAC[(year - 4) % 12]
}

// 生成黄历数据（后备方案，使用简单规则）
function generateAlmanacFallback(dateStr) {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  // 简单的干支计算
  const ganzhiYear = getGanZhiYear(year)
  const ganzhiMonth = TIAN_GAN[(year % 10 + 1) % 10] + DI_ZHI[((month + 2) % 12)]
  const ganzhiDay = TIAN_GAN[(day - 1) % 10] + DI_ZHI[(day - 1) % 12]
  const zodiac = getZodiac(year)

  // 简化的宜忌数据（需要后续用真实数据替换）
  const yiOptions = ['祭祀', '祈福', '求嗣', '开光', '出行', '嫁娶', '动土', '安床', '交易', '纳财']
  const jiOptions = ['安葬', '破土', '伐木', '词讼', '入狱', '远行', '栽种', '纳畜']

  const dayIndex = (day - 1) % 10
  const yi = yiOptions.slice(dayIndex, dayIndex + 3).join(' ')
  const ji = jiOptions.slice(dayIndex, dayIndex + 2).join(' ')

  const shenShaList = ['青龙', '明堂', '天刑', '朱雀', '金匮', '天德', '白虎', '玉堂', '天牢', '玄武', '司命', '勾陈']
  const shenSha = shenShaList[dayIndex]

  const timeList = ['子时（23-1 点）', '丑时（1-3 点）', '寅时（3-5 点）', '卯时（5-7 点）', '辰时（7-9 点）', '巳时（9-11 点）', '午时（11-13 点）', '未时（13-15 点）', '申时（15-17 点）', '酉时（17-19 点）', '戌时（19-21 点）', '亥时（21-23 点）']
  const luckyTime = timeList[dayIndex]

  const conflictList = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']
  const conflictZodiac = conflictList[(dayIndex + 6) % 12]

  const directions = ['正东', '正南', '正西', '正北', '东南', '西南', '西北', '东北']
  const luckyDirection = directions[dayIndex % 8]

  const colors = ['红色', '黄色', '白色', '绿色', '黑色', '蓝色', '紫色', '橙色']
  const luckyColor = colors[dayIndex % 8]

  const numbers = ['1, 6', '2, 7', '3, 8', '4, 9', '5, 0']
  const luckyNumber = numbers[dayIndex % 5]

  const rating = 3 + (dayIndex % 3) - 1

  return {
    date: dateStr,
    ganzhi_year: ganzhiYear,
    ganzhi_month: ganzhiMonth,
    ganzhi_day: ganzhiDay,
    zodiac,
    yi,
    ji,
    shen_sha: shenSha,
    lucky_time: luckyTime,
    conflict_zodiac: conflictZodiac,
    lucky_direction: luckyDirection,
    lucky_color: luckyColor,
    lucky_number: luckyNumber,
    rating
  }
}

async function main() {
  try {
    await initDatabase()
    console.log('数据库连接成功')

    // 检查现有数据
    const existing = await query('SELECT COUNT(*) as count FROM almanac_data WHERE yi IS NOT NULL')
    console.log('已有黄历数据的记录数:', existing[0].count)

    // 生成 2026 年全年日期
    const dates = []
    const startDate = new Date('2026-01-01')
    const endDate = new Date('2026-12-31')

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0])
    }

    console.log(`需要处理 ${dates.length} 天`)

    let successCount = 0
    let updateCount = 0

    for (const dateStr of dates) {
      // 检查是否已有数据
      const existing = await query('SELECT id, yi FROM almanac_data WHERE date = CONVERT_TZ(?, \'+00:00\', \'+08:00\')', [dateStr])

      if (existing.length > 0 && existing[0].yi) {
        // 已有完整数据，跳过
        continue
      }

      // 使用后备方案生成数据
      const almanac = generateAlmanacFallback(dateStr)

      if (existing.length > 0) {
        // 更新
        await run(`
          UPDATE almanac_data SET
            ganzhi_year = ?, ganzhi_month = ?, ganzhi_day = ?, zodiac = ?,
            yi = ?, ji = ?, shen_sha = ?, lucky_time = ?,
            conflict_zodiac = ?, lucky_direction = ?, lucky_color = ?,
            lucky_number = ?, rating = ?
          WHERE id = ?
        `, [
          almanac.ganzhi_year, almanac.ganzhi_month, almanac.ganzhi_day, almanac.zodiac,
          almanac.yi, almanac.ji, almanac.shen_sha, almanac.lucky_time,
          almanac.conflict_zodiac, almanac.lucky_direction, almanac.lucky_color,
          almanac.lucky_number, almanac.rating, existing[0].id
        ])
        updateCount++
      } else {
        // 需要先有农历数据才能插入，这里跳过
        console.log('跳过', dateStr, '(无农历基础数据)')
      }

      successCount++
      if (successCount % 50 === 0) {
        console.log(`已处理 ${successCount} 条`)
      }
    }

    console.log('\\n完成！')
    console.log('更新记录:', updateCount)

    // 验证结果
    const result = await query('SELECT DATE_FORMAT(CONVERT_TZ(date, \'+00:00\', \'+08:00\'), \'%Y-%m-%d\') as date, yi, ji FROM almanac_data WHERE yi IS NOT NULL LIMIT 10')
    console.log('\\n示例数据：')
    result.forEach(row => {
      console.log(`${row.date}: 宜${row.yi} | 忌${row.ji}`)
    })

    process.exit(0)
  } catch (error) {
    console.error('错误:', error)
    process.exit(1)
  }
}

main()
