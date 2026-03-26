/**
 * NLP 模糊日期解析服务 - 规则引擎版本
 * 支持自然语言查询日期，如"春节"、"中秋节后第 3 天"、"明年国庆"等
 *
 * 技术栈：规则引擎 + 关键词匹配 + 农历转换
 */

const dayjs = require('dayjs')
const { CalendarConverter } = require('../utils/calendar')
const { query } = require('../config/database')

// ============================================
// 配置常量
// ============================================

// 节日名称映射（公历固定节日）
const SOLAR_FESTIVALS = {
  '元旦': { month: 1, day: 1 },
  '新年': { month: 1, day: 1 },
  '春节': 'lunar:01:01',
  '元宵': 'lunar:01:15',
  '情人节': { month: 2, day: 14 },
  '妇女节': { month: 3, day: 8 },
  '愚人节': { month: 4, day: 1 },
  '劳动节': { month: 5, day: 1 },
  '青年节': { month: 5, day: 4 },
  '儿童节': { month: 6, day: 1 },
  '建党节': { month: 7, day: 1 },
  '七夕': 'lunar:07:07',
  '建军节': { month: 8, day: 1 },
  '教师节': { month: 9, day: 10 },
  '中秋': 'lunar:08:15',
  '中秋节': 'lunar:08:15',
  '国庆': { month: 10, day: 1 },
  '国庆节': { month: 10, day: 1 },
  '万圣': { month: 10, day: 31 },
  '万圣节': { month: 10, day: 31 },
  '光棍节': { month: 11, day: 11 },
  '圣诞': { month: 12, day: 25 },
  '圣诞节': { month: 12, day: 25 },
  '腊八': 'lunar:12:08',
  '小年': 'lunar:12:23',
  '除夕': 'lunar:12:30',
  '大年三十': 'lunar:12:30',
  '大年初一': 'lunar:01:01',
  '二月二': 'lunar:02:02',
  '龙抬头': 'lunar:02:02',
  '端午': 'lunar:05:05',
  '端午节': 'lunar:05:05',
  '重阳': 'lunar:09:09',
  '重阳节': 'lunar:09:09',
  '寒衣节': 'lunar:10:01',
  '下元节': 'lunar:10:15',
}

// 浮动节日（需要计算）
const FLOAT_FESTIVALS = {
  '清明': 'term', // 节气
  '清明节': 'term',
  '母亲': { type: 'float', rule: 'sunday', month: 5, week: 2 }, // 5 月第 2 个周日
  '母亲节': { type: 'float', rule: 'sunday', month: 5, week: 2 },
  '父亲': { type: 'float', rule: 'sunday', month: 6, week: 3 }, // 6 月第 3 个周日
  '父亲节': { type: 'float', rule: 'sunday', month: 6, week: 3 },
  '感恩': { type: 'float', rule: 'thursday', month: 11, week: 4 }, // 11 月第 4 个周四
  '感恩节': { type: 'float', rule: 'thursday', month: 11, week: 4 },
}

// 年份偏移
const YEAR_OFFSETS = {
  '今天': 0,
  '今日': 0,
  '今年': 0,
  '明年': 1,
  '后年': 2,
  '去年': -1,
  '前年': -2,
  '大后年': 3,
  '大前年': -3,
}

// 日偏移
const DAY_OFFSETS = {
  '明天': 1,
  '明日': 1,
  '后天': 2,
  '大后天': 3,
  '昨天': -1,
  '昨日': -1,
  '前天': -2,
  '大前天': -3,
  '前一天': -1,
  '前两天': -2,
  '后一天': 1,
  '后两天': 2,
}

// 历史事件日期映射
const HISTORY_EVENTS = {
  '建国': { year: 1949, month: 10, day: 1 },
  '新中国成立': { year: 1949, month: 10, day: 1 },
  '建党': { year: 1921, month: 7, day: 1 },
  '建军': { year: 1927, month: 8, day: 1 },
  '港澳回归': { year: 1997, month: 7, day: 1 },
  '香港回归': { year: 1997, month: 7, day: 1 },
  '澳门回归': { year: 1999, month: 12, day: 20 },
  '申奥成功': { year: 2001, month: 7, day: 13 },
  '北京奥运': { year: 2008, month: 8, day: 8 },
  '奥运会开幕': { year: 2008, month: 8, day: 8 },
  '汶川地震': { year: 2008, month: 5, day: 12 },
  '非典': { year: 2003, month: 3, day: 1 },
  '新冠': { year: 2020, month: 1, day: 1 },
  '疫情': { year: 2020, month: 1, day: 1 },
  '改革开放': { year: 1978, month: 12, day: 18 },
  '辛亥革命': { year: 1911, month: 10, day: 10 },
  '抗战胜利': { year: 1945, month: 9, day: 3 },
  '五四运动': { year: 1919, month: 5, day: 4 },
  '九一八': { year: 1931, month: 9, day: 18 },
  '七七事变': { year: 1937, month: 7, day: 7 },
  '卢沟桥': { year: 1937, month: 7, day: 7 },
}

// 季节映射
const SEASONS = {
  '春天': { months: [3, 4, 5], name: '春季' },
  '春季': { months: [3, 4, 5], name: '春季' },
  '夏天': { months: [6, 7, 8], name: '夏季' },
  '夏季': { months: [6, 7, 8], name: '夏季' },
  '秋天': { months: [9, 10, 11], name: '秋季' },
  '秋季': { months: [9, 10, 11], name: '秋季' },
  '冬天': { months: [12, 1, 2], name: '冬季' },
  '冬季': { months: [12, 1, 2], name: '冬季' },
}

// ============================================
// 核心解析函数
// ============================================

/**
 * 解析自然语言日期查询
 * @param {string} input - 用户输入
 * @param {number} [baseYear] - 基准年份（默认为当前年份）
 * @returns {Promise<{success: boolean, date?: string, message?: string, data?: any}>}
 */
async function parseNaturalDate(input, baseYear = null) {
  try {
    if (!input || typeof input !== 'string') {
      return {
        success: false,
        message: '请输入有效的查询内容'
      }
    }

    // 清理输入
    const text = input.trim()
    const year = baseYear || dayjs().year()

    // 1. 检查是否是历史事件
    const historyResult = parseHistoryEvent(text, year)
    if (historyResult) {
      return historyResult
    }

    // 2. 检查组合表述（"春节后第 3 天"、"国庆节前一天"等）- 优先处理
    // 放在前面是因为组合表达可能包含年份偏移，需要先解析基础日期
    const comboResult = await parseComboExpression(text, year)
    if (comboResult) {
      return comboResult
    }

    // 3. 检查年份偏移（明年、去年等）
    let yearOffset = 0
    for (const [key, offset] of Object.entries(YEAR_OFFSETS)) {
      if (text.includes(key)) {
        yearOffset = offset
        break
      }
    }
    const targetYear = year + yearOffset

    // 4. 检查日偏移（明天、后天等）
    const simpleOffset = parseSimpleOffset(text)
    if (simpleOffset !== null) {
      const result = dayjs().add(simpleOffset, 'day')
      return {
        success: true,
        date: result.format('YYYY-MM-DD'),
        message: `${result.format('YYYY 年 MM 月 DD 日')}，${result.format('dddd')}`,
        data: { type: 'offset', offset: simpleOffset }
      }
    }

    // 5. 检查节日（包括农历和浮动节日）
    const festivalResult = await parseFestival(text, targetYear)
    if (festivalResult) {
      return festivalResult
    }

    // 6. 检查节气
    const termResult = parseTerm(text, targetYear)
    if (termResult) {
      return termResult
    }

    // 7. 检查季节
    const seasonResult = parseSeason(text, targetYear)
    if (seasonResult) {
      return seasonResult
    }

    // 8. 检查标准日期格式
    const dateResult = parseStandardDate(text)
    if (dateResult) {
      return dateResult
    }

    // 9. 检查星期表达（"下周五"、"这个周日"等）
    const weekResult = parseWeekday(text)
    if (weekResult) {
      return weekResult
    }

    // 无法解析
    return {
      success: false,
      message: '未找到匹配的日期，请尝试更精确的描述，如"春节"、"明年国庆"、"下周五"等'
    }

  } catch (error) {
    console.error('NLP 日期解析失败:', error)
    return {
      success: false,
      message: '解析失败，请稍后重试'
    }
  }
}

/**
 * 解析历史事件
 */
function parseHistoryEvent(text, year) {
  for (const [key, date] of Object.entries(HISTORY_EVENTS)) {
    if (text.includes(key)) {
      const resultDate = `${String(date.year).padStart(4, '0')}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`
      const result = dayjs(resultDate)
      return {
        success: true,
        date: result.format('YYYY-MM-DD'),
        message: `${key}：${result.format('YYYY 年 MM 月 DD 日')}，${result.format('dddd')}`,
        data: {
          type: 'history',
          event: key,
          year: date.year
        }
      }
    }
  }
  return null
}

/**
 * 解析简单偏移（明天、后天等）
 */
function parseSimpleOffset(text) {
  for (const [key, offset] of Object.entries(DAY_OFFSETS)) {
    if (text === key || text.includes(key)) {
      return offset
    }
  }
  return null
}

/**
 * 解析节日（公历、农历、浮动）
 */
async function parseFestival(text, year) {
  // 首先检查公历/农历节日
  for (const [name, date] of Object.entries(SOLAR_FESTIVALS)) {
    if (text.includes(name)) {
      if (typeof date === 'string' && date.startsWith('lunar:')) {
        // 农历节日
        const parts = date.split(':')
        const lunarMonth = parseInt(parts[1])
        const lunarDay = parseInt(parts[2])
        return await getLunarFestivalDate(lunarMonth, lunarDay, year, name)
      } else {
        // 公历固定节日
        const month = date.month
        const day = date.day
        const isValid = isValidDate(year, month, day)
        if (isValid) {
          const result = dayjs(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`)
          return {
            success: true,
            date: result.format('YYYY-MM-DD'),
            message: `${name}：${result.format('YYYY 年 MM 月 DD 日')}，${result.format('dddd')}`,
            data: {
              type: 'solar_festival',
              name: name,
              year: year
            }
          }
        }
      }
    }
  }

  // 检查浮动节日
  for (const [name, config] of Object.entries(FLOAT_FESTIVALS)) {
    if (text.includes(name)) {
      if (config === 'term') {
        // 清明是节气
        return parseTerm(name, year)
      } else if (config.type === 'float') {
        // 计算浮动日期
        const floatDate = calculateFloatDate(year, config.month, config.rule, config.week)
        if (floatDate) {
          const result = dayjs(floatDate)
          return {
            success: true,
            date: result.format('YYYY-MM-DD'),
            message: `${name}：${result.format('YYYY 年 MM 月 DD 日')}，${result.format('dddd')}`,
            data: {
              type: 'float_festival',
              name: name,
              year: year
            }
          }
        }
      }
    }
  }

  return null
}

/**
 * 获取农历节日的公历日期
 */
async function getLunarFestivalDate(lunarMonth, lunarDay, year, festivalName) {
  try {
    // 查询数据库获取农历节日对应的公历日期
    const result = await query(`
      SELECT date_full, name
      FROM holidays
      WHERE type = 'lunar'
        AND lunar_month = ?
        AND lunar_day = ?
        AND year = ?
        AND is_active = 1
      LIMIT 1
    `, [lunarMonth, lunarDay, year])

    if (result && result.length > 0) {
      const date = dayjs(result[0].date_full)
      return {
        success: true,
        date: date.format('YYYY-MM-DD'),
        message: `${festivalName}：${date.format('YYYY 年 MM 月 DD 日')}，${date.format('dddd')}`,
        data: {
          type: 'lunar_festival',
          name: festivalName,
          year: year,
          lunar: { month: lunarMonth, day: lunarDay }
        }
      }
    }

    // 如果数据库没有，尝试用本地计算（近似值）
    // 这里使用简化的农历转公历逻辑
    const approxDate = approximateLunarToSolar(lunarMonth, lunarDay, year)
    if (approxDate) {
      const date = dayjs(approxDate)
      return {
        success: true,
        date: date.format('YYYY-MM-DD'),
        message: `${festivalName}：${date.format('YYYY 年 MM 月 DD 日')}，${date.format('dddd')}`,
        data: {
          type: 'lunar_festival_approx',
          name: festivalName,
          year: year
        }
      }
    }

    return null
  } catch (error) {
    console.error('获取农历节日失败:', error)
    return null
  }
}

/**
 * 农历转公历（简化版）
 * 使用内置的农历数据表进行转换
 */
function approximateLunarToSolar(lunarMonth, lunarDay, year) {
  try {
    // 使用 CalendarConverter 进行转换
    const dateInfo = CalendarConverter.getFullDateInfo(new Date(`${year}-01-01`))

    // 这个函数需要更精确的农历数据，暂时返回一个近似值
    // 春节（正月初一）通常在 1 月 21 日 -2 月 20 日之间
    if (lunarMonth === 1 && lunarDay === 1) {
      // 春节：估算在 1 月下旬到 2 月中旬
      const springFestivalDates = {
        2024: '2024-02-10',
        2025: '2025-01-29',
        2026: '2026-02-17',
        2027: '2027-02-06',
        2028: '2028-01-26',
        2029: '2029-02-13',
        2030: '2030-02-03',
        2031: '2031-01-23',
        2032: '2032-02-11',
        2033: '2033-01-31',
        2034: '2034-02-19',
        2035: '2035-02-08'
      }
      return springFestivalDates[year] || `${year}-02-10`
    }

    // 其他农历节日的近似日期
    const lunarDates = {
      '01:15': { year: year, month: 2, day: 15 }, // 元宵
      '05:05': { year: year, month: 6, day: 5 },  // 端午
      '07:07': { year: year, month: 8, day: 7 },  // 七夕
      '08:15': { year: year, month: 9, day: 15 }, // 中秋
      '09:09': { year: year, month: 10, day: 15 },// 重阳
      '12:08': { year: year, month: 1, day: 8 },  // 腊八（下一年）
      '12:23': { year: year, month: 1, day: 23 }, // 小年
    }

    const key = `${String(lunarMonth).padStart(2, '0')}:${String(lunarDay).padStart(2, '0')}`
    if (lunarDates[key]) {
      const d = lunarDates[key]
      return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`
    }

    return null
  } catch (error) {
    return null
  }
}

/**
 * 解析节气
 */
function parseTerm(text, year) {
  const terms = [
    '立春', '雨水', '惊蛰', '春分', '清明', '谷雨',
    '立夏', '小满', '芒种', '夏至', '小暑', '大暑',
    '立秋', '处暑', '白露', '秋分', '寒露', '霜降',
    '立冬', '小雪', '大雪', '冬至', '小寒', '大寒'
  ]

  for (const term of terms) {
    if (text.includes(term)) {
      // 使用 SolarTermCalculator 计算节气日期
      try {
        const { SolarTermCalculator } = require('../utils/calendar')
        // 获取该年份所有节气，然后找到对应的节气
        const termDates = SolarTermCalculator.getTermDates(year)
        const termInfo = termDates.find(t => t.name === term)

        if (termInfo) {
          const result = dayjs(termInfo.date)
          return {
            success: true,
            date: result.format('YYYY-MM-DD'),
            message: `${term}：${result.format('YYYY 年 MM 月 DD 日')}，${result.format('dddd')}`,
            data: {
              type: 'term',
              name: term,
              year: year
            }
          }
        }
      } catch (error) {
        console.error('计算节气失败:', error)
      }
    }
  }

  return null
}

/**
 * 解析季节
 */
function parseSeason(text, year) {
  for (const [name, config] of Object.entries(SEASONS)) {
    if (text.includes(name)) {
      // 返回季节的中间日期
      const midMonth = config.months[1]
      const result = dayjs(`${year}-${String(midMonth).padStart(2, '0')}-15`)
      return {
        success: true,
        date: result.format('YYYY-MM-DD'),
        message: `${config.name}：约${result.format('YYYY 年 MM 月')}，${config.months.join('-')}月`,
        data: {
          type: 'season',
          name: config.name,
          months: config.months
        }
      }
    }
  }
  return null
}

/**
 * 解析标准日期格式
 */
function parseStandardDate(text) {
  // 匹配多种日期格式
  const patterns = [
    /(\d{4})[-./](\d{1,2})[-./](\d{1,2})/,  // 2024-01-15, 2024/1/15, 2024.01.15
    /(\d{4}) 年 (\d{1,2}) 月 (\d{1,2}) 日？/,  // 2024 年 1 月 15 日
    /(\d{1,2})[-./](\d{1,2})/,  // 01-15, 1/15
  ]

  const currentYear = dayjs().year()

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      let year, month, day
      if (match[1] && match[3]) {
        year = match[1].length === 4 ? parseInt(match[1]) : currentYear
        month = parseInt(match[2])
        day = parseInt(match[3])
      } else if (match[1] && match[2]) {
        year = currentYear
        month = parseInt(match[1])
        day = parseInt(match[2])
      }

      if (isValidDate(year, month, day)) {
        const result = dayjs(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`)
        return {
          success: true,
          date: result.format('YYYY-MM-DD'),
          message: `${result.format('YYYY 年 MM 月 DD 日')}，${result.format('dddd')}`,
          data: {
            type: 'standard_date',
            year: year,
            month: month,
            day: day
          }
        }
      }
    }
  }

  return null
}

/**
 * 解析组合表述（"春节后第 3 天"、"国庆节前一天"等）
 */
async function parseComboExpression(text, year) {
  // 匹配模式：支持关键字之间有空格
  // 格式："XXX 后 第 N 天"、"XXX 前 N 天" 等
  const patterns = [
    /(.+?)\s*后\s*第\s*(\d+)\s*天/,     // 春节后第 3 天
    /(.+?)\s*后\s*(\d+)\s*天/,          // 春节后 3 天
    /(.+?)\s*前第\s*(\d+)\s*天/,        // 春节前第 3 天
    /(.+?)\s*前\s*(\d+)\s*天/,          // 春节前 3 天
    /(.+?)\s*之后\s*(\d+)\s*天/,        // 春节之后 3 天
    /(.+?)\s*之前\s*(\d+)\s*天/,        // 春节之前 3 天
    /(.+?)\s*前一天/,                   // 国庆节前一天
    /(.+?)\s*后一天/,                   // 国庆节后一天
    /(.+?)\s*前两天/,                   // 国庆节前两天
    /(.+?)\s*后两天/,                   // 国庆节后两天
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const baseName = match[1].trim()
      let days = match[2] ? parseInt(match[2]) : 1
      const isBefore = pattern.toString().includes('前') || pattern.toString().includes('之前')

      if (isBefore) {
        days = -days
      }

      // 递归解析基础日期
      const baseResult = await parseNaturalDate(baseName, year)
      if (baseResult.success) {
        const result = dayjs(baseResult.date).add(days, 'day')
        return {
          success: true,
          date: result.format('YYYY-MM-DD'),
          message: `${baseName}${isBefore ? '前' : '后'}${Math.abs(days)}天：${result.format('YYYY 年 MM 月 DD 日')}，${result.format('dddd')}`,
          data: {
            type: 'combo',
            base: baseName,
            baseDate: baseResult.date,
            offset: days
          }
        }
      }
    }
  }

  return null
}

/**
 * 解析星期表达（"下周五"、"这个周日"等）
 */
function parseWeekday(text) {
  const weekDays = {
    '周日': 0, '星期天': 0, '星期日': 0,
    '周一': 1, '星期一': 1,
    '周二': 2, '星期二': 2,
    '周三': 3, '星期三': 3,
    '周四': 4, '星期四': 4,
    '周五': 5, '星期五': 5,
    '周六': 6, '星期六': 6,
  }

  // 匹配 "周 X"、"星期 X"
  for (const [key, value] of Object.entries(weekDays)) {
    if (text.includes('下' + key) || text.includes('下周' + key)) {
      return getWeekdayResult(value, 7)
    }
    if (text.includes('上' + key) || text.includes('上周' + key)) {
      return getWeekdayResult(value, -7)
    }
    if (text.includes('这' + key) || text.includes('这个' + key) || text.includes('本周' + key)) {
      return getWeekdayResult(value, 0)
    }
    if (text === key || text.includes(key)) {
      // 单独说"周五"默认指本周五
      return getWeekdayResult(value, 0)
    }
  }

  return null
}

/**
 * 获取星期计算结果
 */
function getWeekdayResult(weekday, weekOffset) {
  const today = dayjs()
  const todayWeekday = today.day()
  const targetWeekday = weekday

  let daysDiff = targetWeekday - todayWeekday + weekOffset

  // 如果结果是负数且 weekOffset 为 0，说明是上周
  if (weekOffset === 0 && daysDiff < 0) {
    daysDiff += 7
  }

  const result = today.add(daysDiff, 'day')
  return {
    success: true,
    date: result.format('YYYY-MM-DD'),
    message: `${result.format('YYYY 年 MM 月 DD 日')}，${result.format('dddd')}`,
    data: {
      type: 'weekday',
      weekday: weekday,
      weekOffset: weekOffset
    }
  }
}

/**
 * 计算浮动节日日期（如母亲节：5 月第 2 个周日）
 */
function calculateFloatDate(year, month, weekdayRule, weekNum) {
  // weekday: 0=周日，1=周一，..., 6=周六
  const weekdayMap = {
    'sunday': 0,
    'monday': 1,
    'tuesday': 2,
    'wednesday': 3,
    'thursday': 4,
    'friday': 5,
    'saturday': 6,
  }

  const targetWeekday = weekdayMap[weekdayRule]
  if (targetWeekday === undefined) return null

  // 计算第 N 个星期 X
  const firstDay = dayjs(`${year}-${String(month).padStart(2, '0')}-01`)
  const firstWeekday = firstDay.day()

  // 第一个目标星期几
  let firstTarget = targetWeekday - firstWeekday
  if (firstTarget < 0) firstTarget += 7
  firstTarget += 1 // 从 1 号开始计算

  // 第 N 个
  const targetDay = firstTarget + (weekNum - 1) * 7

  if (targetDay <= dayjs(`${year}-${String(month).padStart(2, '0')}-01`).daysInMonth()) {
    return `${year}-${String(month).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`
  }

  return null
}

/**
 * 验证日期是否有效
 */
function isValidDate(year, month, day) {
  if (month < 1 || month > 12) return false
  if (day < 1 || day > 31) return false

  const daysInMonth = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).daysInMonth()
  return day <= daysInMonth
}

// ============================================
// 导出接口
// ============================================

module.exports = {
  parseNaturalDate,
  // 导出供测试使用
  parseHistoryEvent,
  parseSimpleOffset,
  parseFestival,
  parseTerm,
  parseSeason,
  parseStandardDate,
  parseComboExpression,
  parseWeekday,
  calculateFloatDate,
  isValidDate
}
