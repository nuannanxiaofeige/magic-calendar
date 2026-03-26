Page({
  data: {
    // 日期信息
    day: '24',
    year: '2026',
    weekday: '星期二',
    currentDate: '三月',
    currentTime: '',

    // 农历信息
    lunarYear: '二〇二六',
    lunarMonth: '二',
    lunarDay: '初六',
    ganzhiYear: '丙午年',
    ganzhiMonth: '辛卯月',
    ganzhiDay: '丁酉日',

    // 黄历信息
    almanac: {
      yi: '嫁娶 纳采 求医 治病 除虫 捕鱼',
      ji: '开光 辉煌'
    },

    // 节日信息
    festivals: [],

    // 当前季节背景
    seasonBg: '/images/home-bg.png'
  },

  onLoad: function () {
    this.updateTime()
    this.loadDate()
    this.loadAlmanac()
    this.loadRecentFestivals()
    this.setSeasonBackground() // 设置季节背景

    // 每分钟更新时间
    setInterval(() => {
      this.updateTime()
    }, 60000)
  },

  updateTime: function () {
    const now = new Date()
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    this.setData({
      currentTime: `${hours}:${minutes}`
    })
  },

  loadDate: function () {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const day = now.getDate()
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const weekday = weekdays[now.getDay()]

    const lunarMonths = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊']
    const lunarDays = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
                      '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
                      '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十']

    const lunarMonth = lunarMonths[(month - 1) % 12]
    const lunarDay = lunarDays[(day - 1) % 30]

    // 农历年份（简化版）
    const lunarYear = this.getLunarYear(year)

    this.setData({
      day: String(day),
      year: String(year),
      weekday: weekday,
      currentDate: this.getChineseMonth(month),
      lunarYear: lunarYear,
      lunarMonth: lunarMonth,
      lunarDay: lunarDay
    })

    // 从 API 加载详细农历
    this.loadLunarDetail()
  },

  getLunarYear: function (year) {
    // 简化农历年份计算
    const gan = ['庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己']
    const zhi = ['申', '酉', '戌', '亥', '子', '丑', '寅', '卯', '辰', '巳', '午', '未']
    const ganIndex = (year - 1900) % 10
    const zhiIndex = (year - 1900) % 12
    return `二〇${year % 100}`
  },

  getChineseMonth: function (month) {
    const months = ['一月', '二月', '三月', '四月', '五月', '六月',
                   '七月', '八月', '九月', '十月', '十一月', '十二月']
    return months[month - 1]
  },

  loadLunarDetail: function () {
    const that = this
    const app = getApp()
    wx.request({
      url: `${app.globalData.baseUrl}/calendar/today`,
      success: function (res) {
        if (res.data.success && res.data.data) {
          const lunar = res.data.data.date.lunar
          const ganzhi = res.data.data.ganzhi
          that.setData({
            lunarYear: lunar.year,
            lunarMonth: lunar.month,
            lunarDay: lunar.day,
            ganzhiYear: ganzhi.year + '年',
            ganzhiMonth: ganzhi.month + '月',
            ganzhiDay: ganzhi.day + '日'
          })
        }
      },
      fail: function (err) {
        console.error('加载农历详情失败:', err)
      }
    })
  },

  loadAlmanac: function () {
    const that = this
    const app = getApp()
    wx.request({
      url: `${app.globalData.baseUrl}/almanac/today`,
      success: function (res) {
        if (res.data.success && res.data.data) {
          const data = res.data.data
          that.setData({
            almanac: {
              yi: data.yi || '暂无',
              ji: data.ji || '暂无'
            }
          })
        }
      },
      fail: function () {
        // 使用默认值
      }
    })
  },

  loadRecentFestivals: function () {
    const that = this
    const app = getApp()
    wx.request({
      url: `${app.globalData.baseUrl}/holidays/recent?limit=1`,
      success: function (res) {
        if (res.data.success && res.data.data && res.data.data.length > 0) {
          const item = res.data.data[0]
          if (item.vacation_dates) {
            item.vacation_dates_formatted = that.formatVacationDates(item.vacation_dates)
          }
          if (item.date_full) {
            item.date_display = that.formatDateWithWeekday(item.date_full)
          } else {
            item.date_display = `${item.date_month}月${item.date_day}日`
          }
          item.style = that.getHolidayStyle(item.name, item.type)
          that.setData({
            festivals: [item]
          })
        } else {
          // 默认清明节数据
          that.setData({
            festivals: [{
              id: 1,
              name: '清明节',
              date_display: '2026 年 4 月 4 日 周六',
              days_left: 11,
              vacation_dates: '2026 年 4 月 4 日 - 2026 年 4 月 6 日',
              vacation_dates_formatted: '4 月 4 日 - 4 月 6 日',
              style: {
                icon: '🌸',
                gradient: 'linear-gradient(135deg, #A8E6CF 0%, #88D8B0 100%)'
              }
            }]
          })
        }
      },
      fail: function (err) {
        // 默认数据
        that.setData({
          festivals: [{
            id: 1,
            name: '清明节',
            date_display: '2026 年 4 月 4 日 周六',
            days_left: 11,
            vacation_dates: '2026 年 4 月 4 日 - 2026 年 4 月 6 日',
            vacation_dates_formatted: '4 月 4 日 - 4 月 6 日',
            style: {
              icon: '🌸',
              gradient: 'linear-gradient(135deg, #A8E6CF 0%, #88D8B0 100%)'
            }
          }]
        })
      }
    })
  },

  getHolidayStyle: function (name, type) {
    const holidayStyles = {
      '春节': { icon: '🧧', gradient: 'linear-gradient(135deg, #FF6B6B 0%, #E74C3C 100%)' },
      '元宵': { icon: '🏮', gradient: 'linear-gradient(135deg, #F39C12 0%, #E67E22 100%)' },
      '清明': { icon: '🌸', gradient: 'linear-gradient(135deg, #A8E6CF 0%, #88D8B0 100%)' },
      '端午': { icon: '🫔', gradient: 'linear-gradient(135deg, #56AB91 0%, #4A9685 100%)' },
      '七夕': { icon: '💕', gradient: 'linear-gradient(135deg, #F8BBD0 0%, #F48FB1 100%)' },
      '中秋': { icon: '🌕', gradient: 'linear-gradient(135deg, #9FA8DA 0%, #7986CB 100%)' },
      '国庆': { icon: '🇨🇳', gradient: 'linear-gradient(135deg, #FF6B6B 0%, #FFD700 100%)' },
      '元旦': { icon: '🎉', gradient: 'linear-gradient(135deg, #64B5F6 0%, #42A5F5 100%)' },
    }

    if (holidayStyles[name]) {
      return holidayStyles[name]
    }

    for (const key of Object.keys(holidayStyles)) {
      if (name.includes(key)) {
        return holidayStyles[key]
      }
    }

    return { icon: '📅', gradient: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)' }
  },

  formatVacationDates: function (dates) {
    if (!dates) return ''
    if (Array.isArray(dates)) {
      return dates.join(' - ')
    }
    if (typeof dates === 'string') {
      const dateArray = dates.split('|')
      if (dateArray.length === 1) {
        return this.formatDate(dateArray[0])
      }
      const start = this.formatDate(dateArray[0])
      const end = this.formatDate(dateArray[dateArray.length - 1])
      return `${start} - ${end}`
    }
    return dates
  },

  formatDate: function (dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${month}月${day}日`
  },

  formatDateWithWeekday: function (dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const weekday = weekdays[date.getDay()]
    return `${year}年${month}月${day}日 ${weekday}`
  },

  goToDetail: function (e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/countdown/detail?id=${id}`
    })
  },

  goToHistory: function () {
    wx.navigateTo({
      url: '/pages/history/history'
    })
  },

  goToHolidayList: function () {
    wx.navigateTo({
      url: '/pages/holiday/holiday'
    })
  },

  goToCalendar: function () {
    wx.navigateTo({
      url: '/pages/calendar/calendar'
    })
  },

  goToConstellation: function () {
    wx.navigateTo({
      url: '/pages/constellation/constellation'
    })
  },

  goToMatch: function () {
    wx.navigateTo({
      url: '/pages/match/match'
    })
  },

  goToOilPrice: function () {
    wx.navigateTo({
      url: '/pages/oil-price/oil-price'
    })
  },

  goToDateCalc: function () {
    wx.navigateTo({
      url: '/pages/date-calc/date-calc'
    })
  },

  goToIdiomQuiz: function () {
    wx.navigateTo({
      url: '/pages/idiom-quiz/idiom-quiz'
    })
  },

  goToWeatherPoetry: function () {
    wx.navigateTo({
      url: '/pages/weather-poetry/weather-poetry'
    })
  },

  // 根据季节设置背景图
  setSeasonBackground: function () {
    const month = new Date().getMonth() + 1
    let seasonBg = ''

    // 春季：3-5 月
    if (month >= 3 && month <= 5) {
      seasonBg = '/images/bg-spring.png'
    }
    // 夏季：6-8 月
    else if (month >= 6 && month <= 8) {
      seasonBg = '/images/bg-summer.png'
    }
    // 秋季：9-11 月
    else if (month >= 9 && month <= 11) {
      seasonBg = '/images/bg-autumn.png'
    }
    // 冬季：12-2 月
    else {
      seasonBg = '/images/bg-winter.png'
    }

    this.setData({ seasonBg })
  }
})
