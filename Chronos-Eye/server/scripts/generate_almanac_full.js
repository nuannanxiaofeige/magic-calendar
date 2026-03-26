/**
 * 合并农历数据和黄历数据，生成完整的黄历记录
 */

require('dotenv').config()
const fs = require('fs')
const { query, run, initDatabase } = require('../src/config/database')

// 天干地支
const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const ZODIAC = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']

// 节气数据
const TERM_DATA = {
  2026: { '1-5': '小寒', '1-20': '大寒', '2-3': '立春', '2-18': '雨水', '3-5': '惊蛰', '3-20': '春分', '4-4': '清明', '4-19': '谷雨', '5-5': '立夏', '5-20': '小满', '6-5': '芒种', '6-21': '夏至', '7-7': '小暑', '7-22': '大暑', '8-7': '立秋', '8-22': '处暑', '9-7': '白露', '9-22': '秋分', '10-8': '寒露', '10-23': '霜降', '11-7': '立冬', '11-22': '小雪', '12-7': '大雪', '12-21': '冬至' },
  2027: { '1-5': '小寒', '1-20': '大寒', '2-4': '立春', '2-18': '雨水', '3-6': '惊蛰', '3-21': '春分', '4-5': '清明', '4-20': '谷雨', '5-6': '立夏', '5-21': '小满', '6-6': '芒种', '6-21': '夏至', '7-7': '小暑', '7-23': '大暑', '8-8': '立秋', '8-23': '处暑', '9-8': '白露', '9-23': '秋分', '10-8': '寒露', '10-24': '霜降', '11-7': '立冬', '11-23': '小雪', '12-7': '大雪', '12-22': '冬至' },
  2028: { '1-6': '小寒', '1-21': '大寒', '2-5': '立春', '2-19': '雨水', '3-5': '惊蛰', '3-20': '春分', '4-4': '清明', '4-19': '谷雨', '5-5': '立夏', '5-20': '小满', '6-5': '芒种', '6-21': '夏至', '7-7': '小暑', '7-22': '大暑', '8-7': '立秋', '8-22': '处暑', '9-7': '白露', '9-22': '秋分', '10-8': '寒露', '10-23': '霜降', '11-7': '立冬', '11-22': '小雪', '12-7': '大雪', '12-21': '冬至' },
  2029: { '1-5': '小寒', '1-20': '大寒', '2-3': '立春', '2-18': '雨水', '3-5': '惊蛰', '3-20': '春分', '4-4': '清明', '4-19': '谷雨', '5-5': '立夏', '5-20': '小满', '6-5': '芒种', '6-21': '夏至', '7-7': '小暑', '7-22': '大暑', '8-7': '立秋', '8-22': '处暑', '9-7': '白露', '9-23': '秋分', '10-8': '寒露', '10-23': '霜降', '11-7': '立冬', '11-22': '小雪', '12-7': '大雪', '12-22': '冬至' },
  2030: { '1-5': '小寒', '1-20': '大寒', '2-4': '立春', '2-18': '雨水', '3-6': '惊蛰', '3-21': '春分', '4-5': '清明', '4-20': '谷雨', '5-6': '立夏', '5-21': '小满', '6-6': '芒种', '6-21': '夏至', '7-7': '小暑', '7-23': '大暑', '8-8': '立秋', '8-23': '处暑', '9-8': '白露', '9-23': '秋分', '10-8': '寒露', '10-24': '霜降', '11-8': '立冬', '11-23': '小雪', '12-7': '大雪', '12-22': '冬至' },
  2031: { '1-5': '小寒', '1-20': '大寒', '2-4': '立春', '2-19': '雨水', '3-6': '惊蛰', '3-21': '春分', '4-5': '清明', '4-20': '谷雨', '5-6': '立夏', '5-21': '小满', '6-6': '芒种', '6-21': '夏至', '7-7': '小暑', '7-23': '大暑', '8-8': '立秋', '8-23': '处暑', '9-8': '白露', '9-23': '秋分', '10-8': '寒露', '10-24': '霜降', '11-8': '立冬', '11-23': '小雪', '12-7': '大雪', '12-22': '冬至' },
  2032: { '1-6': '小寒', '1-20': '大寒', '2-4': '立春', '2-19': '雨水', '3-5': '惊蛰', '3-20': '春分', '4-4': '清明', '4-19': '谷雨', '5-5': '立夏', '5-20': '小满', '6-5': '芒种', '6-21': '夏至', '7-7': '小暑', '7-22': '大暑', '8-7': '立秋', '8-22': '处暑', '9-7': '白露', '9-22': '秋分', '10-8': '寒露', '10-23': '霜降', '11-7': '立冬', '11-22': '小雪', '12-7': '大雪', '12-21': '冬至' },
  2033: { '1-5': '小寒', '1-20': '大寒', '2-3': '立春', '2-18': '雨水', '3-5': '惊蛰', '3-20': '春分', '4-4': '清明', '4-19': '谷雨', '5-5': '立夏', '5-20': '小满', '6-5': '芒种', '6-21': '夏至', '7-7': '小暑', '7-22': '大暑', '8-7': '立秋', '8-22': '处暑', '9-7': '白露', '9-23': '秋分', '10-8': '寒露', '10-23': '霜降', '11-7': '立冬', '11-22': '小雪', '12-7': '大雪', '12-22': '冬至' },
  2034: { '1-5': '小寒', '1-20': '大寒', '2-4': '立春', '2-18': '雨水', '3-6': '惊蛰', '3-21': '春分', '4-5': '清明', '4-20': '谷雨', '5-6': '立夏', '5-21': '小满', '6-6': '芒种', '6-21': '夏至', '7-7': '小暑', '7-23': '大暑', '8-8': '立秋', '8-23': '处暑', '9-8': '白露', '9-23': '秋分', '10-8': '寒露', '10-24': '霜降', '11-7': '立冬', '11-22': '小雪', '12-7': '大雪', '12-21': '冬至' },
  2035: { '1-5': '小寒', '1-20': '大寒', '2-4': '立春', '2-18': '雨水', '3-5': '惊蛰', '3-20': '春分', '4-5': '清明', '4-20': '谷雨', '5-5': '立夏', '5-21': '小满', '6-5': '芒种', '6-21': '夏至', '7-7': '小暑', '7-23': '大暑', '8-8': '立秋', '8-23': '处暑', '9-8': '白露', '9-23': '秋分', '10-8': '寒露', '10-24': '霜降', '11-7': '立冬', '11-22': '小雪', '12-7': '大雪', '12-22': '冬至' }
}

// 宜忌数据（按日地支）
const YI_JI_DATA = {
  '子': { yi: '祭祀 祈福 求嗣 开光 解除', ji: '嫁娶 入宅 安葬 动土' },
  '丑': { yi: '嫁娶 祭祀 出行 开光 交易', ji: '动土 安床 破土 栽种' },
  '寅': { yi: '祈福 求嗣 开光 解除 赴任', ji: '嫁娶 入宅 动土 安葬' },
  '卯': { yi: '开光 祭祀 祈福 求嗣 出行', ji: '安床 动土 破土 安葬' },
  '辰': { yi: '祭祀 祈福 斋醮 赴任 出行', ji: '开仓 嫁娶 安葬 动土' },
  '巳': { yi: '嫁娶 祭祀 祈福 求嗣 开光', ji: '安床 动土 破土 安葬' },
  '午': { yi: '祈福 求嗣 开光 解除 交易', ji: '嫁娶 入宅 动土 安葬' },
  '未': { yi: '祭祀 祈福 求嗣 开光 出行', ji: '动土 安床 安葬 破土' },
  '申': { yi: '开光 祭祀 祈福 嫁娶 出行 交易', ji: '动土 破土 安葬 伐木' },
  '酉': { yi: '祭祀 祈福 求嗣 开光 解除 交易', ji: '嫁娶 入宅 动土 安床' },
  '戌': { yi: '祈福 求嗣 开光 出行 赴任 祭祀', ji: '嫁娶 动土 安葬 开仓' },
  '亥': { yi: '嫁娶 祭祀 祈福 求嗣 开光 出行', ji: '动土 安床 安葬 破土' }
}

// 值神（黄道黑道）
const ZHI_SHEN = ['青龙', '明堂', '天刑', '朱雀', '金匮', '天德', '白虎', '玉堂', '天牢', '玄武', '司命', '勾陈']

// 获取节气
function getTerm(year, month, day) {
  const terms = TERM_DATA[year]
  if (!terms) return ''
  const key = `${month}-${day}`
  return terms[key] || ''
}

async function main() {
  try {
    await initDatabase()
    console.log('数据库连接成功')

    // 读取农历数据
    const lunarData = JSON.parse(fs.readFileSync('/Users/lifei/Chronos-Eye/server/scripts/lunar_data_2026_2035.json', 'utf-8'))
    console.log(`读取到 ${lunarData.length} 条农历数据`)

    // 构建农历数据映射
    const lunarMap = {}
    lunarData.forEach(item => {
      lunarMap[item.date] = item
    })

    let insertCount = 0
    let updateCount = 0

    for (const lunar of lunarData) {
      const dateStr = lunar.date
      const [year, month, day] = dateStr.split('-').map(Number)

      // 计算干支
      const ganzhiYear = lunar.ganzhi_year
      const ganzhiMonth = TIAN_GAN[((year % 10) * 2 + 2) % 10] + DI_ZHI[(month + 2) % 12]

      // 计算日柱
      const baseDate = new Date(1900, 0, 1)
      const targetDate = new Date(year, month - 1, day)
      const dayOffset = Math.floor((targetDate - baseDate) / 86400000)
      const ganzhiDay = TIAN_GAN[dayOffset % 10] + DI_ZHI[dayOffset % 12]

      const dayGan = ganzhiDay[0]
      const dayZhi = ganzhiDay[1]

      // 值神
      const zhiIndex = DI_ZHI.indexOf(dayZhi)
      const shenSha = ZHI_SHEN[(zhiIndex + 1) % 12]

      // 宜忌
      const yiJi = YI_JI_DATA[dayZhi]

      // 吉时
      const timeList = ['子时（23-1 点）', '丑时（1-3 点）', '寅时（3-5 点）', '卯时（5-7 点）', '辰时（7-9 点）', '巳时（9-11 点）', '午时（11-13 点）', '未时（13-15 点）', '申时（15-17 点）', '酉时（17-19 点）', '戌时（19-21 点）', '亥时（21-23 点）']
      const luckyTime = timeList[(zhiIndex + 3) % 12]

      // 相冲生肖
      const conflictZodiac = ZODIAC[(zhiIndex + 6) % 12]

      // 吉神方位
      const directions = ['正东', '东南', '正南', '西南', '正西', '西北', '正北', '东北']
      const ganIndex = TIAN_GAN.indexOf(dayGan)
      const luckyDirection = directions[ganIndex % 8]

      // 幸运颜色
      const colors = ['红色', '黄色', '白色', '绿色', '黑色', '蓝色']
      const luckyColor = colors[day % 6]

      // 幸运数字
      const numbers = ['1, 6', '2, 7', '3, 8', '4, 9', '5, 0']
      const luckyNumber = numbers[day % 5]

      // 节气
      const term = getTerm(year, month, day)

      // 评分
      const rating = 3 + (zhiIndex % 3) - 1

      const record = {
        date: dateStr,
        lunar_year: lunar.lunar_year,
        lunar_month: lunar.lunar_month,
        lunar_day: lunar.lunar_day,
        ganzhi_year: ganzhiYear,
        ganzhi_month: ganzhiMonth,
        ganzhi_day: ganzhiDay,
        zodiac: lunar.zodiac,
        yi: yiJi?.yi || '',
        ji: yiJi?.ji || '',
        shen_sha: shenSha,
        lucky_time: luckyTime,
        conflict_zodiac: conflictZodiac,
        lucky_direction: luckyDirection,
        lucky_color: luckyColor,
        lucky_number: luckyNumber,
        rating,
        term: term || '',
        solar_festival: lunar.solar_festival || '',
        lunar_festival: lunar.lunar_festival || ''
      }

      const existing = await query('SELECT id FROM almanac_data WHERE date = CONVERT_TZ(?, \'+00:00\', \'+08:00\')', [dateStr])

      if (existing.length > 0) {
        await run(`
          UPDATE almanac_data SET
            lunar_year = ?, lunar_month = ?, lunar_day = ?,
            ganzhi_year = ?, ganzhi_month = ?, ganzhi_day = ?, zodiac = ?,
            yi = ?, ji = ?, shen_sha = ?, lucky_time = ?,
            conflict_zodiac = ?, lucky_direction = ?, lucky_color = ?,
            lucky_number = ?, rating = ?, term = ?, solar_festival = ?, lunar_festival = ?
          WHERE id = ?
        `, [
          record.lunar_year, record.lunar_month, record.lunar_day,
          record.ganzhi_year, record.ganzhi_month, record.ganzhi_day, record.zodiac,
          record.yi, record.ji, record.shen_sha, record.lucky_time,
          record.conflict_zodiac, record.lucky_direction, record.lucky_color,
          record.lucky_number, record.rating, record.term, record.solar_festival, record.lunar_festival, existing[0].id
        ])
        updateCount++
      } else {
        await run(`
          INSERT INTO almanac_data (
            date, lunar_year, lunar_month, lunar_day,
            ganzhi_year, ganzhi_month, ganzhi_day, zodiac,
            yi, ji, shen_sha, lucky_time,
            conflict_zodiac, lucky_direction, lucky_color,
            lucky_number, rating, term, solar_festival, lunar_festival, created_at
          ) VALUES (
            CONVERT_TZ(?, '+00:00', '+08:00'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW()
          )
        `, [
          record.date, record.lunar_year, record.lunar_month, record.lunar_day,
          record.ganzhi_year, record.ganzhi_month, record.ganzhi_day, record.zodiac,
          record.yi, record.ji, record.shen_sha, record.lucky_time,
          record.conflict_zodiac, record.lucky_direction, record.lucky_color,
          record.lucky_number, record.rating, record.term, record.solar_festival, record.lunar_festival
        ])
        insertCount++
      }

      if ((insertCount + updateCount) % 500 === 0) {
        console.log(`已处理 ${insertCount + updateCount} 条...`)
      }
    }

    console.log('\n========== 完成 ==========')
    console.log(`新增记录：${insertCount}`)
    console.log(`更新记录：${updateCount}`)

    // 验证结果
    const result = await query(`
      SELECT DATE_FORMAT(CONVERT_TZ(date, '+00:00', '+08:00'), '%Y-%m-%d') as date,
             lunar_month, lunar_day, ganzhi_year, yi, ji, shen_sha, lunar_festival
      FROM almanac_data
      WHERE DATE_FORMAT(CONVERT_TZ(date, '+00:00', '+08:00'), '%Y-%m-%d') BETWEEN '2026-03-20' AND '2026-03-25'
      ORDER BY date
    `)

    console.log('\n示例数据（2026 年 3 月）：')
    result.forEach(row => {
      console.log(`${row.date}: 农历${row.lunar_month}月${row.lunar_day}日 | ${row.ganzhi_year} | ${row.shen_sha} | 宜${row.yi} | 忌${row.ji} | 节日${row.lunar_festival || '-'}`)
    })

    // 检查端午节
    const dragonBoat = await query(`
      SELECT DATE_FORMAT(CONVERT_TZ(date, '+00:00', '+08:00'), '%Y-%m-%d') as date,
             lunar_month, lunar_day, lunar_festival
      FROM almanac_data
      WHERE lunar_festival = '端午'
      LIMIT 3
    `)
    console.log('\n端午节数据：')
    dragonBoat.forEach(row => {
      console.log(`${row.date}: 农历${row.lunar_month}月${row.lunar_day}日 | ${row.lunar_festival}`)
    })

    process.exit(0)
  } catch (error) {
    console.error('错误:', error)
    process.exit(1)
  }
}

main()
