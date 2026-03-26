/**
 * 多历法计算工具类
 * 支持：农历、干支历、伊斯兰历、二十四节气计算
 */

const dayjs = require('dayjs')
const { Solar } = require('lunar-javascript')

// 天干
const heavenlyStems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
// 地支
const earthlyBranches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
// 生肖
const zodiacAnimals = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']

// 农历月份名称
const lunarMonths = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊']
// 农历日期名称
const lunarDays = [
  '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'
]

// 24 节气名称
const solarTerms = [
  '小寒', '大寒', '立春', '雨水', '惊蛰', '春分',
  '清明', '谷雨', '立夏', '小满', '芒种', '夏至',
  '小暑', '大暑', '立秋', '处暑', '白露', '秋分',
  '寒露', '霜降', '立冬', '小雪', '大雪', '冬至'
]

// 节气交节时间计算基准数据 (2000-2030 年的节气时间偏移)
// 格式：[1 月小寒，1 月大寒，2 月立春，2 月雨水，3 月惊蛰，3 月春分，...]
const termBaseData = {
  2024: [6, 20, 4, 19, 5, 20, 4, 19, 5, 20, 5, 21, 6, 22, 7, 22, 7, 22, 8, 23, 7, 22, 7, 21],
  2025: [5, 20, 3, 18, 5, 20, 4, 19, 5, 20, 5, 21, 7, 22, 7, 22, 7, 22, 8, 23, 7, 22, 6, 21],
  2026: [5, 20, 4, 18, 5, 20, 4, 20, 5, 20, 5, 21, 7, 22, 7, 22, 7, 23, 8, 23, 7, 22, 6, 21],
  2027: [5, 20, 4, 19, 5, 20, 5, 20, 5, 20, 5, 21, 7, 22, 7, 22, 8, 23, 8, 23, 7, 22, 7, 21],
  2028: [5, 20, 4, 19, 5, 20, 4, 19, 5, 20, 5, 21, 6, 22, 7, 22, 7, 22, 7, 22, 6, 21, 6, 21],
  2029: [5, 20, 3, 18, 5, 20, 5, 19, 5, 20, 5, 21, 7, 22, 7, 22, 7, 22, 7, 22, 6, 21, 6, 21],
  2030: [5, 20, 4, 18, 6, 20, 5, 20, 5, 20, 5, 21, 7, 22, 7, 22, 8, 23, 8, 23, 7, 22, 7, 21]
}

/**
 * 农历计算工具
 * 使用 lunar-javascript 库进行精确计算
 */
const LunarCalculator = {
  // 农历月份名称
  lunarMonths: ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'],
  // 农历日期名称
  lunarDays: [
    '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
    '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
    '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'
  ],

  // 获取农历节日
  getLunarFestival: function (lunarMonth, lunarDay, isLeap) {
    if (!isLeap) {
      const festivals = {
        '1-1': '春节',
        '1-15': '元宵节',
        '2-2': '龙抬头',
        '5-5': '端午节',
        '7-7': '七夕节',
        '7-15': '中元节',
        '8-15': '中秋节',
        '9-9': '重阳节',
        '10-1': '寒衣节',
        '12-8': '腊八节',
        '12-23': '小年'
      }
      return festivals[`${lunarMonth}-${lunarDay}`] || null
    }
    return null
  },

  // 公历转农历 - 使用 lunar-javascript 库
  solarToLunar: function (date) {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()

    try {
      // 使用 lunar-javascript 库
      const solar = Solar.fromYmd(year, month, day)
      const lunar = solar.getLunar()

      const lunarMonth = lunar.getMonth()
      const lunarDay = lunar.getDay()

      return {
        year: lunar.getYear(),
        month: lunarMonth,
        day: lunarDay,
        isLeap: false, // lunar-javascript 的 Solar 转 Lunar 不直接提供闰月信息，需要额外计算
        monthName: this.lunarMonths[lunarMonth - 1],
        dayName: this.lunarDays[lunarDay - 1],
        fullString: `${lunar.getYearInGanZhi()}年 ${lunar.getMonthInChinese()}月 ${lunar.getDayInChinese()}`
      }
    } catch (error) {
      console.error('农历计算失败:', error.message)
      // 备用方案：使用原始算法
      return this.solarToLunarFallback(date)
    }
  },

  // 备用方案：原始农历算法
  solarToLunarFallback: function (date) {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()

    // 计算距离 1900 年 1 月 31 日的天数
    const baseDate = new Date(1900, 0, 31)
    let offset = Math.floor((date - baseDate) / 86400000)

    // 计算农历年份
    let lunarYear = 1900
    let yearDays = this.getLunarYearDays(lunarYear)
    while (lunarYear < 2100 && offset > yearDays) {
      offset -= yearDays
      lunarYear++
      yearDays = this.getLunarYearDays(lunarYear)
    }

    // 计算闰月信息
    const leapMonth = this.getLeapMonth(lunarYear)
    let isLeap = false
    let lunarMonth = 1

    // 计算农历月份和日期
    for (let i = 1; i <= 12; i++) {
      const monthDays = this.getLunarMonthDays(lunarYear, i)
      if (leapMonth > 0 && i === leapMonth + 1 && !isLeap) {
        i--
        isLeap = true
        const leapDays = this.getLeapDays(lunarYear)
        if (offset < leapDays) {
          lunarMonth = leapMonth
          break
        }
        offset -= leapDays
        isLeap = false
      } else if (offset < monthDays) {
        lunarMonth = i
        break
      }
      offset -= monthDays
    }

    const lunarDay = offset + 1

    return {
      year: lunarYear,
      month: lunarMonth,
      day: lunarDay,
      isLeap: isLeap,
      monthName: (isLeap ? '闰' : '') + this.lunarMonths[lunarMonth - 1],
      dayName: this.lunarDays[lunarDay - 1],
      fullString: `${lunarYear}年${this.lunarMonths[lunarMonth - 1]}月${this.lunarDays[lunarDay - 1]}`
    }
  },

  // 以下为备用方案的数据和方法
  lunarInfo: [
    0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
    0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
    0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
    0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
    0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
    0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5d0, 0x14573, 0x052d0, 0x0a9a8, 0x0e950, 0x06aa0,
    0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
    0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b5a0, 0x195a6,
    0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
    0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0,
    0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
    0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
    0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
    0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
    0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
    0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0,
    0x0a2e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4,
    0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0,
    0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160,
    0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252,
    0x0d520
  ],

  getLunarYearDays: function (year) {
    let sum = 348
    for (let i = 0x8000; i > 0x8; i >>= 1) {
      sum += (this.lunarInfo[year - 1900] & i) ? 1 : 0
    }
    return sum + this.getLeapDays(year)
  },

  getLeapDays: function (year) {
    if (this.getLeapMonth(year)) {
      return (this.lunarInfo[year - 1900] & 0x10000) ? 30 : 29
    }
    return 0
  },

  getLeapMonth: function (year) {
    return this.lunarInfo[year - 1900] & 0xf
  },

  getLunarMonthDays: function (year, month) {
    return (this.lunarInfo[year - 1900] & (0x10000 >> month)) ? 30 : 29
  }
}

/**
 * 干支历计算工具
 */
const GanzhiCalculator = {
  // 计算年柱
  getYearGanzhi: function (year) {
    const stemIndex = (year - 4) % 10
    const branchIndex = (year - 4) % 12
    return heavenlyStems[stemIndex] + earthlyBranches[branchIndex]
  },

  // 计算月柱（考虑节气）
  getMonthGanzhi: function (year, month, day) {
    const date = new Date(year, month - 1, day)
    const term = SolarTermCalculator.getCurrentTerm(date)

    // 根据节气确定月份的地支
    let branchIndex
    if (term >= 0 && term < 2) branchIndex = 2 // 寅月 (立春 - 惊蛰)
    else if (term >= 2 && term < 4) branchIndex = 3 // 卯月
    else if (term >= 4 && term < 6) branchIndex = 4 // 辰月
    else if (term >= 6 && term < 8) branchIndex = 5 // 巳月
    else if (term >= 8 && term < 10) branchIndex = 6 // 午月
    else if (term >= 10 && term < 12) branchIndex = 7 // 未月
    else if (term >= 12 && term < 14) branchIndex = 8 // 申月
    else if (term >= 14 && term < 16) branchIndex = 9 // 酉月
    else if (term >= 16 && term < 18) branchIndex = 10 // 戌月
    else if (term >= 18 && term < 20) branchIndex = 11 // 亥月
    else if (term >= 20 && term < 22) branchIndex = 0 // 子月
    else branchIndex = 1 // 丑月

    // 根据年干计算月干（五虎遁）
    const yearStem = (year - 4) % 10
    let stemIndex
    if (yearStem === 0 || yearStem === 5) {
      stemIndex = (2 + branchIndex - 2) % 10 // 甲己之年丙作首
    } else if (yearStem === 1 || yearStem === 6) {
      stemIndex = (4 + branchIndex - 2) % 10 // 乙庚之岁戊为头
    } else if (yearStem === 2 || yearStem === 7) {
      stemIndex = (6 + branchIndex - 2) % 10 // 丙辛之年寻庚上
    } else if (yearStem === 3 || yearStem === 8) {
      stemIndex = (8 + branchIndex - 2) % 10 // 丁壬壬寅顺水流
    } else {
      stemIndex = (0 + branchIndex - 2) % 10 // 戊癸之年甲寅首
    }
    if (stemIndex < 0) stemIndex += 10

    return heavenlyStems[stemIndex] + earthlyBranches[branchIndex]
  },

  // 计算日柱
  getDayGanzhi: function (year, month, day) {
    const date = new Date(year, month - 1, day)
    const baseDate = new Date(1900, 0, 1)
    const offset = Math.floor((date - baseDate) / 86400000)

    // 1900 年 1 月 1 日是甲戌日
    const stemIndex = (offset + 10) % 10
    const branchIndex = (offset + 10) % 12

    return heavenlyStems[stemIndex] + earthlyBranches[branchIndex]
  },

  // 计算时柱
  getHourGanzhi: function (hour) {
    // 地支：子时 (23-1), 丑时 (1-3), 寅时 (3-5)...
    const branchIndex = Math.floor((hour + 1) % 24 / 2)

    return {
      branch: earthlyBranches[branchIndex],
      branchIndex: branchIndex,
      time: `${hour}:00-${(hour + 2) % 24}:00`
    }
  },

  // 获取完整干支信息
  getFullGanzhi: function (date) {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours()

    const yearGanzhi = this.getYearGanzhi(year)
    const monthGanzhi = this.getMonthGanzhi(year, month, day)
    const dayGanzhi = this.getDayGanzhi(year, month, day)
    const hourInfo = this.getHourGanzhi(hour)

    // 根据日干计算时干（五鼠遁）
    const dayStem = dayGanzhi.charCodeAt(0) - 0x7532 // 甲的 Unicode
    let stemIndex
    if (dayStem === 0 || dayStem === 5) {
      stemIndex = (2 + hourInfo.branchIndex - 2) % 10 // 甲己还加甲
    } else if (dayStem === 1 || dayStem === 6) {
      stemIndex = (4 + hourInfo.branchIndex - 2) % 10 // 乙庚丙作初
    } else if (dayStem === 2 || dayStem === 7) {
      stemIndex = (6 + hourInfo.branchIndex - 2) % 10 // 丙辛从戊起
    } else if (dayStem === 3 || dayStem === 8) {
      stemIndex = (8 + hourInfo.branchIndex - 2) % 10 // 丁壬庚子居
    } else {
      stemIndex = (0 + hourInfo.branchIndex - 2) % 10 // 戊癸壬子头
    }
    if (stemIndex < 0) stemIndex += 10

    return {
      year: yearGanzhi,
      month: monthGanzhi,
      day: dayGanzhi,
      hour: heavenlyStems[stemIndex] + hourInfo.branch,
      hourInfo: hourInfo,
      fullString: `${yearGanzhi}年 ${monthGanzhi}月 ${dayGanzhi}日 ${heavenlyStems[stemIndex] + hourInfo.branch}时`
    }
  }
}

/**
 * 伊斯兰历计算工具（简化版）
 */
const IslamicCalculator = {
  // 伊斯兰历年长度（354 或 355 天）
  getIslamicYearDays: function (year) {
    return ((year * 11 + 2) % 30 < 11) ? 354 : 355
  },

  // 公历转伊斯兰历（简化算法）
  solarToIslamic: function (date) {
    constgregorianYear = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()

    // 计算儒略日
    const jd = this.getJulianDay(date)

    // 伊斯兰历起点（622 年 7 月 16 日）
    const islamicEpoch = 1948439.5
    const daysSinceEpoch = jd - islamicEpoch

    // 计算伊斯兰历年份
    const islamicYear = Math.floor((daysSinceEpoch * 30 / 10631) + 1)

    // 计算月份和日期
    let remainingDays = daysSinceEpoch - Math.floor(islamicYear * 10631 / 30)
    let islamicMonth = 1
    let islamicDay = 1

    const monthDays = [30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29]

    for (let i = 0; i < 12; i++) {
      if (remainingDays < monthDays[i]) {
        islamicMonth = i + 1
        islamicDay = Math.floor(remainingDays) + 1
        break
      }
      remainingDays -= monthDays[i]
    }

    // 伊斯兰历月份名称
    const monthNames = [
      '穆哈兰姆', '萨法尔', '拉比·乌拉', '拉比·阿赫拉',
      '朱马达·乌拉', '朱马达·阿赫拉', '拉贾布', '舍尔邦',
      '拉马丹', '肖瓦尔', '都尔喀尔德', '都尔希哲'
    ]

    return {
      year: islamicYear,
      month: islamicMonth,
      day: islamicDay,
      monthName: monthNames[islamicMonth - 1],
      fullString: `${islamicYear}年 ${monthNames[islamicMonth - 1]}${islamicDay}日`
    }
  },

  // 计算儒略日
  getJulianDay: function (date) {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()

    const a = Math.floor((14 - month) / 12)
    const y = year + 4800 - a
    const m = month + 12 * a - 3

    return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045
  }
}

/**
 * 二十四节气计算工具
 */
const SolarTermCalculator = {
  // 计算指定年份的所有节气时间
  getTermDates: function (year) {
    const dates = []

    // 节气对应的月份（每个节气对应一个月份）
    // 格式：[月索引，月索引，...] 对应 24 个节气
    const termMonths = [
      0, 0,   // 小寒、大寒 - 1 月
      1, 1,   // 立春、雨水 - 2 月
      2, 2,   // 惊蛰、春分 - 3 月
      3, 3,   // 清明、谷雨 - 4 月
      4, 4,   // 立夏、小满 - 5 月
      5, 5,   // 芒种、夏至 - 6 月
      6, 6,   // 小暑、大暑 - 7 月
      7, 7,   // 立秋、处暑 - 8 月
      8, 8,   // 白露、秋分 - 9 月
      9, 9,   // 寒露、霜降 - 10 月
      10, 10, // 立冬、小雪 - 11 月
      11, 11  // 大雪、冬至 - 12 月
    ]

    // 使用精确数据表 (2024-2030 年)
    const yearData = termBaseData[year]

    if (yearData) {
      // 使用精确数据 - 每个值直接对应日期
      for (let i = 0; i < 24; i++) {
        const day = yearData[i]
        const month = termMonths[i]
        // 使用本地时间而不是 UTC 时间，避免时区问题
        const termDate = new Date(year, month, day, 12, 0, 0)

        dates.push({
          index: i,
          name: solarTerms[i],
          date: termDate,
          formatted: dayjs(termDate).format('YYYY-MM-DD HH:mm')
        })
      }
    } else {
      // 使用近似算法
      const base = new Date(Date.UTC(year, 0, 6, 2, 0, 0))
      for (let i = 0; i < 24; i++) {
        const termDate = new Date(base.getTime() + i * 15.2184 * 24 * 60 * 60 * 1000)
        dates.push({
          index: i,
          name: solarTerms[i],
          date: termDate,
          formatted: dayjs(termDate).format('YYYY-MM-DD HH:mm')
        })
      }
    }

    return dates
  },

  // 获取当前节气
  getCurrentTerm: function (date = new Date()) {
    const year = date.getFullYear()
    const dates = this.getTermDates(year)

    for (let i = dates.length - 1; i >= 0; i--) {
      if (date >= dates[i].date) {
        return i
      }
    }
    return 0
  },

  // 获取今日节气信息
  getTodayTerm: function (date = new Date()) {
    const termIndex = this.getCurrentTerm(date)
    const dates = this.getTermDates(date.getFullYear())

    // 计算下一个节气
    const nextIndex = (termIndex + 1) % 24
    const nextTerm = dates[nextIndex]

    // 计算距离下一个节气的天数
    const now = date.getTime()
    const nextTime = nextTerm.date.getTime()
    const daysLeft = Math.ceil((nextTime - now) / (24 * 60 * 60 * 1000))

    return {
      current: {
        index: termIndex,
        name: dates[termIndex].name,
        date: dates[termIndex].formatted
      },
      next: {
        index: nextIndex,
        name: nextTerm.name,
        date: nextTerm.formatted,
        daysLeft: daysLeft
      }
    }
  },

  // 检查今天是否是节气
  isTodayTerm: function (date = new Date()) {
    const dates = this.getTermDates(date.getFullYear())
    const today = dayjs(date).format('YYYY-MM-DD')

    for (const term of dates) {
      if (dayjs(term.date).format('YYYY-MM-DD') === today) {
        return {
          isTerm: true,
          term: term
        }
      }
    }

    return { isTerm: false, term: null }
  }
}

/**
 * 综合历法转换
 */
const CalendarConverter = {
  // 获取完整的日期信息（多历法）
  getFullDateInfo: function (date = new Date()) {
    const lunar = LunarCalculator.solarToLunar(date)
    const ganzhi = GanzhiCalculator.getFullGanzhi(date)
    const islamic = IslamicCalculator.solarToIslamic(date)
    const termInfo = SolarTermCalculator.getTodayTerm(date)
    const isTermToday = SolarTermCalculator.isTodayTerm(date)

    return {
      solar: {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        weekday: date.getDay(),
        weekdayName: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()],
        fullString: `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
      },
      lunar: lunar,
      ganzhi: ganzhi,
      islamic: islamic,
      term: termInfo,
      isTermToday: isTermToday,
      zodiac: zodiacAnimals[(date.getFullYear() - 4) % 12]
    }
  }
}

module.exports = {
  LunarCalculator,
  GanzhiCalculator,
  IslamicCalculator,
  SolarTermCalculator,
  CalendarConverter,
  solarTerms,
  lunarMonths,
  lunarDays,
  heavenlyStems,
  earthlyBranches,
  zodiacAnimals
}
