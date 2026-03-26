Page({
  data: {
    currentDate: '',
    lunarDate: '',
    ganzhi: '',
    almanac: {
      yi: '祭祀 祈福 求嗣',
      ji: '出行 嫁娶 入宅'
    },
    todayTerm: '', // 今日节气
    todayTermDesc: '',
    lunarFestival: '', // 今日农历节日
    lunarFestivalDesc: '',
    lunarFestivalIcon: '',
    festivals: [], // 最近节日列表
    historyEvents: []
  },

  onLoad: function () {
    this.loadDate()
    this.loadAlmanac()
    this.loadTodayTerm() // 加载今日节气
    this.loadLunarFestival() // 加载农历节日
    this.loadRecentFestivals() // 加载最近节日
    this.loadHistoryEvents()
  },

  loadDate: function () {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const day = now.getDate()
    const lunar = this.getLunarDate(now)
    this.setData({
      currentDate: `${year}年${month}月${day}日`,
      lunarDate: `农历${lunar}`
    })
  },

  loadAlmanac: function () {
    const that = this
    const app = getApp()
    wx.request({
      url: `${app.globalData.baseUrl}/almanac/today`,
      success: function (res) {
        if (res.data.success && res.data.data) {
          that.setData({
            almanac: res.data.data,
            lunarDate: `农历${res.data.data.lunar_year}年${res.data.data.lunar_month}月${res.data.data.lunar_day}日`,
            ganzhi: `${res.data.data.ganzhi_year}年 ${res.data.data.ganzhi_month}月 ${res.data.data.ganzhi_day}日`
          })
        }
      },
      fail: function () {
        that.setData({
          lunarDate: '农历加载中...'
        })
      }
    })
  },

  // 加载今日节气 - 只有今天确实是节气时才显示
  loadTodayTerm: function () {
    const that = this
    const app = getApp()
    wx.request({
      url: `${app.globalData.baseUrl}/calendar/today`,
      success: function (res) {
        if (res.data.success && res.data.data) {
          // 检查 term 字段（今天是否有节气）
          if (res.data.data.term) {
            // 今天确实是节气日
            that.setData({
              todayTerm: res.data.data.term.term_name,
              todayTermDesc: res.data.data.term.customs || res.data.data.term.phenology || ''
            })
          }
        }
      },
      fail: function (err) {
        console.error('加载今日节气失败:', err)
      }
    })
  },

  // 加载农历节日（如龙抬头等）
  loadLunarFestival: function () {
    const that = this
    const app = getApp()
    // 从 calendar API 获取今天的农历日期
    wx.request({
      url: `${app.globalData.baseUrl}/calendar/today`,
      success: function (res) {
        if (!res.data.success || !res.data.data || !res.data.data.date) return

        const lunarMonth = res.data.data.date.lunar.month
        const lunarDay = res.data.data.date.lunar.day

        // 获取所有农历节日
        wx.request({
          url: `${app.globalData.baseUrl}/holidays/list?type=lunar`,
          success: function (holidayRes) {
            if (holidayRes.data.success && holidayRes.data.data && holidayRes.data.data.length > 0) {
              // 查找今天的农历节日
              const festival = holidayRes.data.data.find(item =>
                item.date_month === lunarMonth && item.date_day === lunarDay
              )

              if (festival) {
                const style = that.getHolidayStyle(festival.name, festival.type)
                that.setData({
                  lunarFestival: festival.name,
                  lunarFestivalDesc: festival.description || '',
                  lunarFestivalIcon: style.icon
                })
              }
            }
          },
          fail: function (err) {
            console.error('加载农历节日失败:', err)
          }
        })
      },
      fail: function (err) {
        console.error('获取农历日期失败:', err)
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
          // 格式化假期日期显示
          if (item.vacation_dates) {
            item.vacation_dates_formatted = that.formatVacationDates(item.vacation_dates)
          }
          // 格式化日期显示
          if (item.date_full) {
            item.date_display = that.formatDateWithWeekday(item.date_full)
          } else {
            item.date_display = `${item.date_month}月${item.date_day}日`
          }
          // 获取节日风格
          item.style = that.getHolidayStyle(item.name, item.type)
          that.setData({
            festivals: [item]
          })
        } else {
          that.setData({ festivals: [] })
        }
      },
      fail: function (err) {
        console.error('加载最近节日失败:', err)
        that.setData({ festivals: [] })
      }
    })
  },

  // 根据节日名称获取匹配的图标和风格
  getHolidayStyle: function (name, type) {
    const holidayStyles = {
      '春节': { icon: '🧧', gradient: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)' },
      '除夕': { icon: '🏮', gradient: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)' },
      '元宵节': { icon: '🏮', gradient: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)' },
      '清明': { icon: '🌸', gradient: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)' },
      '端午': { icon: '🫔', gradient: 'linear-gradient(135deg, #27ae60 0%, #16a085 100%)' },
      '七夕': { icon: '💕', gradient: 'linear-gradient(135deg, #e91e63 0%, #f06292 100%)' },
      '情人节': { icon: '💕', gradient: 'linear-gradient(135deg, #e91e63 0%, #f06292 100%)' },
      '中秋': { icon: '🌕', gradient: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)' },
      '国庆': { icon: '🇨🇳', gradient: 'linear-gradient(135deg, #e74c3c 0%, #f1c40f 100%)' },
      '重阳': { icon: '🏔️', gradient: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)' },
      '元旦': { icon: '🎉', gradient: 'linear-gradient(135deg, #3498db 0%, #9b59b6 100%)' },
      '劳动': { icon: '🛠️', gradient: 'linear-gradient(135deg, #e67e22 0%, #d35400 100%)' },
      '儿童': { icon: '🧸', gradient: 'linear-gradient(135deg, #f39c12 0%, #e74c3c 100%)' },
      '教师': { icon: '📚', gradient: 'linear-gradient(135deg, #9b59b6 0%, #3498db 100%)' },
      '圣诞': { icon: '🎄', gradient: 'linear-gradient(135deg, #27ae60 0%, #e74c3c 100%)' },
      '万圣': { icon: '🎃', gradient: 'linear-gradient(135deg, #e67e22 0%, #2c3e50 100%)' },
      '母亲': { icon: '💐', gradient: 'linear-gradient(135deg, #e91e63 0%, #f06292 100%)' },
      '父亲': { icon: '👔', gradient: 'linear-gradient(135deg, #34495e 0%, #2c3e50 100%)' },
      '立春': { icon: '🌱', gradient: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)' },
      '立夏': { icon: '☀️', gradient: 'linear-gradient(135deg, #f39c12 0%, #e74c3c 100%)' },
      '立秋': { icon: '🍂', gradient: 'linear-gradient(135deg, #e67e22 0%, #d35400 100%)' },
      '立冬': { icon: '❄️', gradient: 'linear-gradient(135deg, #3498db 0%, #9b59b6 100%)' },
    }

    // 先精确匹配
    if (holidayStyles[name]) {
      return holidayStyles[name]
    }

    // 模糊匹配：找最长匹配关键词
    let matchedKey = ''
    for (const key of Object.keys(holidayStyles)) {
      if (name.includes(key) && key.length > matchedKey.length) {
        matchedKey = key
      }
    }
    if (matchedKey) {
      return holidayStyles[matchedKey]
    }

    // 按类型返回默认
    if (type === 'festival') {
      return { icon: '🇨🇳', gradient: 'linear-gradient(135deg, #e74c3c 0%, #f1c40f 100%)' }
    } else if (type === 'lunar') {
      return { icon: '🌙', gradient: 'linear-gradient(135deg, #34495e 0%, #2c3e50 100%)' }
    } else if (type === 'solar') {
      return { icon: '☀️', gradient: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)' }
    }
    return { icon: '📅', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }
  },

  // 格式化假期日期
  formatVacationDates: function (dates) {
    if (!dates) return ''
    // 如果是数组直接返回
    if (Array.isArray(dates)) {
      return dates.join(' - ')
    }
    // 如果是 pipe 分隔的字符串
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

  // 格式化单个日期
  formatDate: function (dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${year}年${month}月${day}日`
  },

  // 格式化日期带星期
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

  loadHistoryEvents: function () {
    const that = this
    const app = getApp()
    wx.request({
      url: `${app.globalData.baseUrl}/history/today`,
      success: function (res) {
        if (res.data.success && res.data.data && res.data.data.length > 0) {
          that.setData({
            historyEvents: res.data.data.slice(0, 3)
          })
        }
      },
      fail: function (err) {
        // 静默失败，不显示错误
      }
    })
  },

  getLunarDate: function (date) {
    const lunarMonths = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊']
    const lunarDays = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
                       '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
                       '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十']
    const month = lunarMonths[date.getMonth() % 12]
    const day = lunarDays[(date.getDate() - 1) % 30]
    return `${month}月${day}`
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
  }
})
