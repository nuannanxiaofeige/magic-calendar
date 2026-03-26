/**
 * 第三方 API 服务 - 天行数据
 * 提供精确的农历、节假日、调休数据
 * 官网：https://www.tianapi.com/
 */

const https = require('https')

// 天行数据 API 配置 - 使用新域名
const TIANAPI_CONFIG = {
  key: process.env.TIANAPI_KEY || '', // 从环境变量获取 API Key
  baseUrl: 'https://apis.tianapi.com'  // 使用新域名
}

/**
 * 调用天行 API
 */
async function requestTianapi(path, params = {}) {
  if (!TIANAPI_CONFIG.key) {
    console.warn('未配置天行 API Key，请使用本地计算模式')
    return null
  }

  return new Promise((resolve, reject) => {
    const url = new URL(`${TIANAPI_CONFIG.baseUrl}${path}`)
    url.searchParams.append('key', TIANAPI_CONFIG.key)

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.append(key, value)
    }

    https.get(url.toString(), (res) => {
      let data = ''

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        try {
          const result = JSON.parse(data)
          if (result.code === 200) {
            // 新域名返回数据在 result.list 中
            resolve(result.result?.list || result.result || result.newlist)
          } else {
            console.error('天行 API 错误:', result.msg)
            resolve(null)
          }
        } catch (error) {
          reject(error)
        }
      })
    }).on('error', (error) => {
      reject(error)
    })
  })
}

/**
 * 获取农历数据
 * 天行接口：/wannianli/index
 */
async function getLunarDate(date = new Date()) {
  try {
    const dateStr = date.toISOString().split('T')[0]
    const result = await requestTianapi('/wannianli/index', { date: dateStr })

    if (result && result.length > 0) {
      const item = result[0]
      return {
        year: item.lunaryear,
        month: item.lunarmonth,
        day: item.lunarday,
        isLeap: !!item.leapmonth,
        monthName: item.lunarmonth,
        dayName: item.lunarday,
        ganzhi_year: item.yeargz,
        ganzhi_month: item.monthgz,
        ganzhi_day: item.daygz,
        zodiac: item.yearshengxiao,
        fullString: `${item.lunaryear}年${item.lunarmonth}${item.lunarday}`
      }
    }
    return null
  } catch (error) {
    console.error('获取农历数据失败:', error)
    return null
  }
}

/**
 * 获取节假日数据（含调休）
 * 天行接口：/jiejiari/index
 * 支持按年查询，一次性获取全年数据
 * @param {number} year - 年份，如 2026
 */
async function getHolidayInfo(year) {
  try {
    // 按年查询，type=1 表示按年查询
    const result = await requestTianapi('/jiejiari/index', {
      type: '1',
      date: String(year)
    })

    if (!result) {
      return null
    }

    const holidays = []

    // 按年查询返回的是假期列表，需要解析每个假期的所有日期
    if (Array.isArray(result)) {
      for (const holiday of result) {
        // 解析假期范围 - API 返回的是用 | 分隔的字符串，需要分割成数组
        const vacationStr = holiday.vacation || ''
        const remarkStr = holiday.remark || ''
        const wageStr = holiday.wage || ''

        const vacationDates = vacationStr ? vacationStr.split('|') : []
        const remarkDates = remarkStr ? remarkStr.split('|') : []
        const wageDates = wageStr ? wageStr.split('|') : []

        // 处理假期中的每一天
        for (const dateStr of vacationDates) {
          if (!dateStr) continue

          // 判断是否是调休上班日（需要上班的假期日）
          const isWorkDay = remarkDates.includes(dateStr)

          holidays.push({
            name: holiday.name || '',
            date: dateStr,
            weekday: 0, // 后续可解析
            rest: isWorkDay ? 0 : 1, // 是否休息
            work: isWorkDay ? 1 : 0, // 是否上班
            type: 'solar',
            tip: holiday.tip || '', // 放假调休说明
            remark: remarkDates, // 调休上班日期数组
            wage: wageDates // 三倍工资日期数组
          })
        }

        // 处理调休上班日（不在假期范围内的上班日）
        if (remarkDates.length > 0) {
          for (const dateStr of remarkDates) {
            if (!dateStr || vacationDates.includes(dateStr)) continue

            holidays.push({
              name: '调休上班',
              date: dateStr,
              weekday: 0,
              rest: 0, // 上班
              work: 1, // 调休上班
              type: 'solar',
              tip: holiday.tip || '',
              remark: remarkDates,
              wage: []
            })
          }
        }
      }
    }

    return holidays.length > 0 ? holidays : null
  } catch (error) {
    console.error('获取节假日数据失败:', error)
    return null
  }
}

/**
 * 获取节气数据
 * 天行接口：/jieqi/index
 * @param {string} year - 年份，如 2026
 */
async function getTermInfo(year) {
  try {
    const terms = []

    // 24 节气名称
    const termNames = ['立春', '雨水', '惊蛰', '春分', '清明', '谷雨',
                       '立夏', '小满', '芒种', '夏至', '小暑', '大暑',
                       '立秋', '处暑', '白露', '秋分', '寒露', '霜降',
                       '立冬', '小雪', '大雪', '冬至', '小寒', '大寒']

    // 遍历 24 个节气，逐个查询
    for (const termName of termNames) {
      const result = await requestTianapi('/jieqi/index', { word: termName, year: String(year) })

      if (result && result.date && result.date.gregdate) {
        // 检查该节气是否在指定年份
        const termYear = parseInt(result.date.gregdate.split('-')[0])
        if (termYear === year) {
          terms.push({
            name: result.name || termName,
            date: result.date.gregdate,
            time: '00:00',
            week: 0
          })
        }
      }

      // 每次 API 调用后暂停 1 秒，避免频率超限
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    return terms
  } catch (error) {
    console.error('获取节气数据失败:', error)
    return null
  }
}

/**
 * 星座中英文名映射
 */
const constellationMap = {
  'aries': '白羊座',
  'taurus': '金牛座',
  'gemini': '双子座',
  'cancer': '巨蟹座',
  'leo': '狮子座',
  'virgo': '处女座',
  'libra': '天秤座',
  'scorpio': '天蝎座',
  'sagittarius': '射手座',
  'capricorn': '摩羯座',
  'aquarius': '水瓶座',
  'pisces': '双鱼座',
  '白羊座': 'aries',
  '金牛座': 'taurus',
  '双子座': 'gemini',
  '巨蟹座': 'cancer',
  '狮子座': 'leo',
  '处女座': 'virgo',
  '天秤座': 'libra',
  '天蝎座': 'scorpio',
  '射手座': 'sagittarius',
  '摩羯座': 'capricorn',
  '水瓶座': 'aquarius',
  '双鱼座': 'pisces'
}

/**
 * 星座简称映射（天行 API 需要）
 */
const constellationShortMap = {
  'aries': '白羊',
  'taurus': '金牛',
  'gemini': '双子',
  'cancer': '巨蟹',
  'leo': '狮子',
  'virgo': '处女',
  'libra': '天秤',
  'scorpio': '天蝎',
  'sagittarius': '射手',
  'capricorn': '摩羯',
  'aquarius': '水瓶',
  'pisces': '双鱼',
  '白羊': 'aries',
  '金牛': 'taurus',
  '双子': 'gemini',
  '巨蟹': 'cancer',
  '狮子': 'leo',
  '处女': 'virgo',
  '天秤': 'libra',
  '天蝎': 'scorpio',
  '射手': 'sagittarius',
  '摩羯': 'capricorn',
  '水瓶': 'aquarius',
  '双鱼': 'pisces'
}

/**
 * 获取星座运势数据
 * 天行接口：/star/index
 * @param {string} sign - 星座英文名（如 aries, taurus）
 * @param {string} date - 日期，格式 YYYY-MM-DD，默认为当天
 * @param {string} type - 运势类型：today, week, month, year
 */
async function getConstellationFortune(sign, date, type = 'today') {
  try {
    // 将星座英文名转换为中文名传递给 API
    const signCn = constellationMap[sign.toLowerCase()] || sign

    // 日期默认为当天
    const dateStr = date || new Date().toISOString().split('T')[0]

    const result = await requestTianapi('/star/index', {
      astro: signCn,
      date: dateStr
    })

    if (result && Array.isArray(result)) {
      // 将返回的数组格式转换为对象
      const fortune = {}
      for (const item of result) {
        const { type: itemType, content } = item
        switch (itemType) {
          case '综合指数':
            fortune.overall = parseInt(content) || 0
            break
          case '爱情指数':
            fortune.love = parseInt(content) || 0
            break
          case '工作指数':
            fortune.work = parseInt(content) || 0
            break
          case '财运指数':
            fortune.wealth = parseInt(content) || 0
            break
          case '健康指数':
            fortune.health = parseInt(content) || 0
            break
          case '幸运颜色':
            fortune.lucky_color = content
            break
          case '幸运数字':
            fortune.lucky_number = parseInt(content) || 0
            break
          case '贵人星座':
            fortune.match_sign = content
            break
          case '今日概述':
            fortune.summary = content
            break
        }
      }

      // 补充星座信息
      fortune.sign = sign.toLowerCase()
      fortune.sign_name = typeof sign === 'string' && constellationMap[sign.toLowerCase()]
        ? sign
        : Object.keys(constellationMap).find(k => constellationMap[k] === sign) || sign

      return fortune
    }
    return null
  } catch (error) {
    console.error('获取星座运势失败:', error)
    return null
  }
}

/**
 * 获取完整的星座运势数据（今日、周运、月运、年运）
 * @param {string} sign - 星座英文名
 * @param {string} date - 日期，格式 YYYY-MM-DD，默认为当天
 */
async function getFullConstellationFortune(sign, date) {
  try {
    const dateStr = date || new Date().toISOString().split('T')[0]
    const signCn = constellationMap[sign.toLowerCase()] || sign

    // 天行 API 目前只支持日运，周运、月运、年运需要通过其他方式获取
    // 这里我们调用日运 API，然后生成本地的周运、月运、年运数据

    // 1. 获取今日运势（从天行 API）
    const todayFortune = await getConstellationFortune(sign, dateStr, 'today')

    // 2. 生成本地周运、月运、年运数据
    const weekFortune = generatePeriodFortune(todayFortune, sign, 'week')
    const monthFortune = generatePeriodFortune(todayFortune, sign, 'month')
    const yearFortune = generateYearFortune(todayFortune, sign, dateStr)

    return {
      ...todayFortune,
      week_overall: weekFortune.overall,
      week_love: weekFortune.love,
      week_work: weekFortune.work,
      week_wealth: weekFortune.wealth,
      week_health: weekFortune.health,
      week_summary: weekFortune.summary,
      week_lucky_color: weekFortune.lucky_color,
      week_lucky_number: weekFortune.lucky_number,
      month_overall: monthFortune.overall,
      month_love: monthFortune.love,
      month_work: monthFortune.work,
      month_wealth: monthFortune.wealth,
      month_health: monthFortune.health,
      month_summary: monthFortune.summary,
      month_lucky_color: monthFortune.lucky_color,
      month_lucky_number: monthFortune.lucky_number,
      year_overall: yearFortune.overall,
      year_love: yearFortune.love,
      year_work: yearFortune.work,
      year_wealth: yearFortune.wealth,
      year_health: yearFortune.health,
      year_summary: yearFortune.summary
    }
  } catch (error) {
    console.error('获取完整星座运势失败:', error)
    return null
  }
}

/**
 * 生成周期运势（周运、月运）
 */
function generatePeriodFortune(todayFortune, sign, period) {
  const signIndex = Object.keys(constellationMap).indexOf(sign.toLowerCase()) + 1
  const seed = signIndex * 7 + (period === 'week' ? 17 : 31)

  // 基于今日运势生成略有不同的周期运势
  const baseOverall = todayFortune?.overall || 70
  const variation = (seed % 21) - 10 // -10 到 +10 的浮动

  const summaries = {
    week: [
      '本周整体运势平稳上升，适合制定新计划并逐步实施。',
      '本周可能会遇到一些小挑战，但凭借你的智慧都能化解。',
      '本周是展现实力的好时机，积极主动会带来意外收获。',
      '本周需要保持耐心，稳扎稳打才能取得长远进步。',
      '本周人际关系良好，多与人交流合作会有意想不到的收获。'
    ],
    month: [
      '本月整体运势较好，各方面都有不错的表现。',
      '本月需要多加注意健康和情绪管理，保持平和心态。',
      '本月是学习和成长的好时机，适合充电提升自己。',
      '本月可能会有新的机会出现，要勇于把握。',
      '本月适合总结和规划，为下一阶段做好准备。'
    ]
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

/**
 * 生成年度运势
 */
function generateYearFortune(todayFortune, sign, dateStr) {
  const year = parseInt(dateStr.split('-')[0])
  const signIndex = Object.keys(constellationMap).indexOf(sign.toLowerCase()) + 1
  const seed = signIndex * 13 + year

  // 各星座年度运势特点
  const yearSummaries = {
    aries: `${year}年是白羊座充满机遇的一年，事业上会有新的突破，但需注意人际关系的处理。`,
    taurus: `${year}年金牛座财运亨通，适合投资理财，感情方面也会迎来甜蜜时刻。`,
    gemini: `${year}年双子座思维活跃，学习能力强，适合进修和提升自我。`,
    cancer: `${year}年巨蟹座家庭运势佳，适合装修搬家，感情也会有新的发展。`,
    leo: `${year}年狮子座事业运强劲，有机会获得晋升或重要项目。`,
    virgo: `${year}年处女座注重细节会有收获，健康方面需要多加关注。`,
    libra: `${year}年天秤座人际关系良好，合作机会多，感情运势也不错。`,
    scorpio: `${year}年天蝎座直觉敏锐，适合深入研究，财运稳中有升。`,
    sagittarius: `${year}年射手座旅行运佳，适合出国或远行，视野会更开阔。`,
    capricorn: `${year}年摩羯座事业稳步上升，努力会有回报，财运也较好。`,
    aquarius: `${year}年水瓶座创意无限，适合创业或尝试新事物。`,
    pisces: `${year}年双鱼座感情丰富，艺术运势强，适合创作和表达。`
  }

  return {
    overall: 60 + (seed % 35),
    love: 55 + (seed % 40),
    work: 58 + (seed % 38),
    wealth: 52 + (seed % 42),
    health: 65 + (seed % 30),
    summary: yearSummaries[sign.toLowerCase()] || `${year}年整体运势平稳，保持积极心态会有收获。`,
    lucky_color: ['金色', '银色', '红色', '蓝色', '绿色'][seed % 5],
    lucky_number: (seed % 99) + 1
  }
}

/**
 * 获取星座配对数据
 * 天行接口：/xingzuo/index
 * 支持三种模式：
 * 1. 单人模式：只提供 me 参数，查询该星座的解说
 * 2. 双人模式：提供 me 和 he 参数，查询两个星座的配对
 * 3. 批量模式：提供 me 和 all=1 参数，一个星座与所有其他星座配对
 *
 * @param {string} sign1 - 第一个星座英文名（如 aries）或单人模式的星座
 * @param {string} sign2 - 第二个星座英文名（如 taurus），可选
 * @param {boolean} all - 是否批量查询该星座与所有其他星座的配对，默认 false
 */
async function getConstellationMatch(sign1, sign2 = null, all = false) {
  try {
    // 将星座英文名转换为中文名简称传递给 API（天行 API 需要两个字的简称）
    const sign1Short = constellationShortMap[sign1.toLowerCase()] || sign1
    const sign2Short = sign2 ? (constellationShortMap[sign2.toLowerCase()] || sign2) : null

    // 构建请求参数
    const params = { me: sign1Short }
    if (sign2Short) {
      params.he = sign2Short
    }
    if (all) {
      params.all = 1
    }

    // 星座配对接口返回结构特殊，直接调用而非使用 requestTianapi
    const result = await requestTianapiConstellation(params)

    if (result) {
      // 双人模式：返回单个配对结果
      if (sign2Short && !all) {
        const sign1Cn = constellationMap[sign1.toLowerCase()] || sign1Short
        const sign2Cn = constellationMap[sign2.toLowerCase()] || sign2Short
        return {
          sign1: sign1.toLowerCase(),
          sign2: sign2.toLowerCase(),
          sign1_name: sign1Cn,
          sign2_name: sign2Cn,
          title: result.title || `${sign1Cn}：${sign2Cn}`,
          grade: result.grade || '',
          content: result.content || ''
        }
      }
      // 批量模式：返回数组
      if (all && Array.isArray(result)) {
        return result.map(item => ({
          sign1: sign1.toLowerCase(),
          sign2: constellationMap[item.title?.split(':')[1]?.trim()] || item.title?.split(':')[1]?.trim() || '',
          sign1_name: constellationMap[sign1.toLowerCase()] || sign1Short,
          sign2_name: item.title?.split(':')[1]?.trim() || '',
          title: item.title || '',
          grade: item.grade || '',
          content: item.content || ''
        }))
      }
      // 单人模式返回单个对象
      const sign1Cn = constellationMap[sign1.toLowerCase()] || sign1Short
      return {
        sign1: sign1.toLowerCase(),
        sign2: sign2 ? sign2.toLowerCase() : '',
        sign1_name: sign1Cn,
        sign2_name: constellationMap[sign2.toLowerCase()] || sign2 || '',
        title: result.title || `${sign1Cn}配对`,
        grade: result.grade || '',
        content: result.content || ''
      }
    }
    return null
  } catch (error) {
    console.error('获取星座配对失败:', error)
    return null
  }
}

/**
 * 专门调用星座配对 API（返回结构特殊）
 */
function requestTianapiConstellation(params = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL('https://apis.tianapi.com/xingzuo/index')
    url.searchParams.append('key', TIANAPI_CONFIG.key)
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.append(key, value)
    }

    https.get(url.toString(), (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try {
          const result = JSON.parse(data)
          if (result.code === 200) {
            // 星座配对接口返回 result.result 对象
            resolve(result.result)
          } else {
            console.error('天行 API 错误:', result.msg)
            resolve(null)
          }
        } catch (error) {
          reject(error)
        }
      })
    }).on('error', (error) => { reject(error) })
  })
}

/**
 * 批量获取星座配对（一个星座与所有其他星座的配对）
 * 天行接口：/xingzuo/index (all=1)
 * @param {string} sign - 星座英文名
 */
async function getAllConstellationMatches(sign) {
  try {
    // 使用 getConstellationMatch 的 all 模式
    const result = await getConstellationMatch(sign, null, true)
    return result
  } catch (error) {
    console.error('批量获取星座配对失败:', error)
    return null
  }
}

module.exports = {
  getLunarDate,
  getHolidayInfo,
  getTermInfo,
  getConstellationFortune,
  getFullConstellationFortune,
  generatePeriodFortune,
  generateYearFortune,
  getConstellationMatch,
  getAllConstellationMatches,
  generateLocalConstellationMatch,
  requestTianapi,
  constellationMap,
  getOilPrice
}

/**
 * 获取油价数据
 * 天行接口：/youjia/index
 * @param {string} province - 省份名称（如：北京、上海）
 */
async function getOilPrice(province) {
  try {
    const result = await requestTianapi('/youjia/index', {
      province: province
    })

    if (result && result.length > 0) {
      const data = result[0]
      return {
        '92': data['92'] || data['no92'] || '--',
        '95': data['95'] || data['no95'] || '--',
        '98': data['98'] || data['no98'] || '--',
        '0': data['0'] || data['no0'] || '--',
        update_time: data.addtime || new Date().toLocaleDateString()
      }
    }
    return null
  } catch (error) {
    console.error('获取油价数据失败:', error)
    return null
  }
}

/**
 * 生成本地星座配对内容（后备方案）
 * 当 API 不可用时使用
 */
function generateLocalConstellationMatch(sign1, sign2) {
  const sign1Cn = constellationMap[sign1.toLowerCase()] || sign1
  const sign2Cn = constellationMap[sign2.toLowerCase()] || sign2

  // 星座元素分类
  const elements = {
    '白羊座': '火', '狮子座': '火', '射手座': '火',
    '金牛座': '土', '处女座': '土', '摩羯座': '土',
    '双子座': '风', '天秤座': '风', '水瓶座': '风',
    '巨蟹座': '水', '天蝎座': '水', '双鱼座': '水'
  }

  // 星座性格特点
  const traits = {
    '白羊座': '热情冲动，勇往直前',
    '金牛座': '踏实稳重，追求安稳',
    '双子座': '灵活多变，善于沟通',
    '巨蟹座': '温柔细腻，重视家庭',
    '狮子座': '自信张扬，领导力强',
    '处女座': '追求完美，注重细节',
    '天秤座': '追求平衡，善于交际',
    '天蝎座': '神秘深沉，洞察力强',
    '射手座': '自由奔放，热爱冒险',
    '摩羯座': '坚韧务实，目标明确',
    '水瓶座': '独立创新，思想前卫',
    '双鱼座': '浪漫多情，富有想象力'
  }

  const element1 = elements[sign1Cn]
  const element2 = elements[sign2Cn]

  // 同元素配对点评
  const sameElement = {
    '火': '火象星座的组合，热情似火，充满活力，但也容易火爆争吵',
    '土': '土象星座的组合，稳重踏实，细水长流，但可能缺乏激情',
    '风': '风象星座的组合，思维活跃，交流顺畅，但有时过于理性',
    '水': '水象星座的组合，情感丰富，心灵相通，但容易情绪化'
  }

  // 不同元素配对点评
  const diffElement = {
    '火土': '火土相生，能够相互促进，但需要磨合',
    '土水': '土水相融，情感深厚，但需要沟通',
    '水风': '风水相生，思维互补，但需要理解',
    '风火': '风火相助，充满活力，但需要冷静',
    '火水': '水火不容，需要更多的包容和理解',
    '土风': '土风相克，需要更多的妥协和适应',
    '火风': '火风相济，热情与理智并存',
    '水土': '水土交融，温柔与稳重互补',
    '风水': '风水相生，自由与情感共存',
    '风土': '风土相映，变化与稳定平衡',
    '土火': '土火相济，踏实与热情互补',
    '水火': '水火既济，柔情与刚毅并存'
  }

  // 生成评分
  const seed = sign1Cn.length + sign2Cn.length
  const sameElementMatch = element1 === element2
  const baseScore = sameElementMatch ? 4 : 3
  const loveScore = Math.min(5, Math.max(1, baseScore + (seed % 3) - 1))
  const marriageScore = Math.min(5, Math.max(1, baseScore + (seed % 2) - 1))
  const friendshipScore = Math.min(5, Math.max(1, baseScore + ((seed + 1) % 3) - 1))
  const familyScore = Math.min(5, Math.max(1, baseScore + 1))

  const grade = `友情：${'★'.repeat(friendshipScore)}${'☆'.repeat(5 - friendshipScore)} 爱情：${'★'.repeat(loveScore)}${'☆'.repeat(5 - loveScore)} 婚姻：${'★'.repeat(marriageScore)}${'☆'.repeat(5 - marriageScore)} 亲情：${'★'.repeat(familyScore)}${'☆'.repeat(5 - familyScore)}`

  // 生成内容
  const elementKey = element1 + element2
  const elementDesc = sameElementMatch ? sameElement[element1] : (diffElement[elementKey] || '两个星座需要相互理解和包容，才能走得更远')

  const content = `${sign1Cn}与${sign2Cn}的配对。${traits[sign1Cn]}；${traits[sign2Cn]}。${elementDesc}。在感情方面，建议多沟通，尊重彼此的差异，发现共同点，这样才能建立长久和谐的关系。性生活方面，需要相互理解和配合，找到适合双方的节奏。`

  return {
    sign1: sign1.toLowerCase(),
    sign2: sign2.toLowerCase(),
    sign1_name: sign1Cn,
    sign2_name: sign2Cn,
    title: `${sign1Cn}：${sign2Cn}`,
    grade: grade,
    content: content
  }
}
