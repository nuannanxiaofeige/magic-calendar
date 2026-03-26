/**
 * 日期服务 - 混合方案（本地计算 + 后端接口）
 * 本地计算：基础公历、简单农历算法
 * 接口获取：精确农历数据、节气、节假日、调休信息
 */
import Taro from '@tarojs/taro'
import dayjs from 'dayjs'

const BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://your-domain.com/api'
  : 'http://192.168.10.3:3000/api'

// 本地缓存
const calendarCache = new Map<string, any>()
const CACHE_EXPIRY = 1000 * 60 * 60 // 1 小时缓存

// 天干地支
const heavenlyStems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const earthlyBranches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const zodiacAnimals = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']

/**
 * 本地农历计算工具（简化版，用于快速显示）
 */
export const LocalLunar = {
  // 简单的农历转换（用于快速显示，精确数据从接口获取）
  getLunarDate: (date: Date): string => {
    const lunarMonths = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊']
    const lunarDays = [
      '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
      '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
      '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'
    ]

    // 简化计算，实际应从接口获取
    const month = lunarMonths[date.getMonth() % 12]
    const day = lunarDays[(date.getDate() - 1) % 30]
    return `${month}月${day}`
  },

  // 获取干支年
  getGanzhiYear: (year: number): string => {
    const stemIndex = (year - 4) % 10
    const branchIndex = (year - 4) % 12
    return `${heavenlyStems[stemIndex]}${earthlyBranches[branchIndex]}年`
  },

  // 获取生肖
  getZodiac: (year: number): string => {
    return zodiacAnimals[(year - 4) % 12]
  }
}

/**
 * 请求封装
 */
async function request<T>(url: string, data?: any): Promise<T | null> {
  try {
    const cacheKey = `${url}_${JSON.stringify(data || {})}`

    // 检查缓存
    const cached = calendarCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
      return cached.data
    }

    const response = await Taro.request({
      url: `${BASE_URL}${url}`,
      method: 'GET',
      data,
      timeout: 5000
    })

    if (response.data.success) {
      // 缓存结果
      calendarCache.set(cacheKey, {
        data: response.data.data,
        timestamp: Date.now()
      })
      return response.data.data
    }
    return null
  } catch (error) {
    console.error('请求失败:', error)
    return null
  }
}

/**
 * 日历数据服务
 */
export const CalendarService = {
  /**
   * 获取多历法数据（优先接口，失败则用本地计算）
   */
  getCalendarInfo: async (date?: Date) => {
    const targetDate = date || new Date()
    const dateStr = dayjs(targetDate).format('YYYY-MM-DD')

    // 尝试从接口获取
    const calendarData = await request<any>('/calendar/calendar', { date: dateStr })

    if (calendarData) {
      return calendarData
    }

    // 接口失败时使用本地计算
    return {
      solar: {
        date: dayjs(targetDate).format('YYYY 年 MM 月 DD 日'),
        weekday: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][targetDate.getDay()],
        icon: '🌞'
      },
      lunar: {
        date: LocalLunar.getLunarDate(targetDate),
        isLeap: false,
        icon: '🌙'
      },
      ganzhi: {
        year: LocalLunar.getGanzhiYear(targetDate.getFullYear()),
        zodiac: LocalLunar.getZodiac(targetDate.getFullYear()),
        icon: '📅'
      },
      islamic: {
        date: '伊斯兰历计算中...',
        icon: '☪️'
      }
    }
  },

  /**
   * 获取今日完整信息（包含节气、节假日）
   */
  getTodayInfo: async () => {
    return await request<any>('/calendar/today')
  },

  /**
   * 获取节气详情
   */
  getTermDetail: async (termName: string) => {
    return await request<any>(`/terms/detail/${termName}`)
  },

  /**
   * 获取当前节气
   */
  getCurrentTerm: async () => {
    return await request<any>('/terms/current')
  },

  /**
   * 获取节假日/节气联动信息
   */
  getHolidayTermLink: async (date?: Date) => {
    const targetDate = date || new Date()
    const dateStr = dayjs(targetDate).format('YYYY-MM-DD')
    return await request<any>('/calendar/holiday-term-link', { date: dateStr })
  },

  /**
   * 清除缓存
   */
  clearCache: () => {
    calendarCache.clear()
  }
}

/**
 * 生成月视图数据（本地计算）
 */
export const generateMonthView = (year: number, month: number) => {
  const firstDay = dayjs(`${year}-${month}-01`)
  const startDay = firstDay.day() // 周几开始
  const daysInMonth = firstDay.daysInMonth()

  const prevMonth = firstDay.subtract(1, 'month')
  const daysInPrevMonth = prevMonth.daysInMonth()

  const nextMonth = firstDay.add(1, 'month')

  const days: any[] = []

  // 上月日期
  for (let i = startDay - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i
    days.push({
      date: dayjs(`${year}-${month}-${day}`).subtract(1, 'month').format('YYYY-MM-DD'),
      day,
      month: prevMonth.month() + 1,
      isCurrentMonth: false
    })
  }

  // 当月日期
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      date: dayjs(`${year}-${month}-${i}`).format('YYYY-MM-DD'),
      day: i,
      month,
      isCurrentMonth: true
    })
  }

  // 下月日期（补足 42 天）
  const remainingDays = 42 - days.length
  for (let i = 1; i <= remainingDays; i++) {
    days.push({
      date: dayjs(`${year}-${month}-${i}`).add(1, 'month').format('YYYY-MM-DD'),
      day: i,
      month: nextMonth.month() + 1,
      isCurrentMonth: false
    })
  }

  return days
}
