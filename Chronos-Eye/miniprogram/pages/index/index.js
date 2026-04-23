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

    // 全局背景
    globalBgUrl: '',

    // 每日心情轮播
    moodSwiper: [],
    currentMoodIndex: 0
  },

  onLoad: function () {
    this.updateTime()
    this.loadDate()
    this.loadAlmanac()
    this.loadRecentFestivals()
    this.loadThemeBackground()
    this.loadMoodDiary()

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

    this.setData({
      day: String(day),
      year: String(year),
      weekday: weekday,
      currentDate: this.getChineseMonth(month)
    })

    // 从 API 加载详细农历
    this.loadLunarDetail()
  },

  getChineseMonth: function (month) {
    const months = ['一月', '二月', '三月', '四月', '五月', '六月',
                   '七月', '八月', '九月', '十月', '十一月', '十二月']
    return months[month - 1]
  },

  loadLunarDetail: function () {
    const that = this
    const app = getApp()
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const day = now.getDate()
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

    wx.request({
      url: `${app.globalData.baseUrl}/almanac/${dateStr}`,
      success: function (res) {
        if (res.data.success && res.data.data) {
          const data = res.data.data
          const lunarMonths = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊']
          const lunarDays = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
                            '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
                            '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十']
          that.setData({
            lunarYear: data.lunar_year,
            lunarMonth: lunarMonths[data.lunar_month - 1] || '正',
            lunarDay: lunarDays[data.lunar_day - 1] || '初一'
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

  // 加载每日心情日记
  loadMoodDiary: function () {
    const that = this
    const app = getApp()

    // 并行加载舔狗日记和打工者日记
    Promise.all([
      that.requestDiary(`${app.globalData.baseUrl}/tiangou-diary/daily`),
      that.requestDiary(`${app.globalData.baseUrl}/worker-diary/daily`)
    ]).then(results => {
      const [tiangouRes, workerRes] = results
      const moodList = []

      // 添加舔狗日记
      if (tiangouRes.success && tiangouRes.data) {
        moodList.push({
          type: 'tiangou',
          icon: '💔',
          title: '舔狗日记',
          content: tiangouRes.data.content || tiangouRes.data.diary?.content || '今天也要加油鸭~'
        })
      }

      // 添加打工者日记
      if (workerRes.success && workerRes.data) {
        moodList.push({
          type: 'worker',
          icon: '💼',
          title: '打工者日记',
          content: workerRes.data.content || workerRes.data.diary?.content || '搬砖使我快乐~'
        })
      }

      // 如果都没有数据，添加默认内容
      if (moodList.length === 0) {
        moodList.push({
          type: 'default',
          icon: '📝',
          title: '每日心情',
          content: '今天也要开心哦~'
        })
      }

      that.setData({ moodSwiper: moodList })
    }).catch(() => {
      // 默认数据
      that.setData({
        moodSwiper: [{
          type: 'default',
          icon: '📝',
          title: '每日心情',
          content: '今天也要开心哦~'
        }]
      })
    })
  },

  requestDiary: function (url) {
    return new Promise((resolve) => {
      wx.request({
        url: url,
        success: (res) => resolve(res.data),
        fail: () => resolve({ success: false })
      })
    })
  },

  // 轮播切换
  onMoodSwiperChange: function (e) {
    this.setData({
      currentMoodIndex: e.detail.current
    })
  },

  // 加载主题背景（优先使用云开发主题）
  loadThemeBackground: function () {
    const that = this
    const app = getApp()

    wx.showLoading({ title: '加载中...' })

    // 先获取本地缓存的主题
    const cachedBg = wx.getStorageSync('globalBgUrl')

    if (cachedBg) {
      that.setData({ globalBgUrl: cachedBg })
      wx.hideLoading()
      return
    }

    // 如果没有缓存，等待 app.js 初始化完成后再获取
    setTimeout(() => {
      const bgUrl = app.globalData.bgImageUrl || wx.getStorageSync('globalBgUrl')
      if (bgUrl) {
        that.setData({ globalBgUrl: bgUrl })
      } else {
        // 如果云开发没有主题，使用本地季节背景
        that.setSeasonBackground()
      }
      wx.hideLoading()
    }, 500)
  },

  // 根据季节设置背景图（本地默认 - 使用渐变色）
  setSeasonBackground: function () {
    const month = new Date().getMonth() + 1
    let seasonBg = ''

    // 春季：3-5 月
    if (month >= 3 && month <= 5) {
      seasonBg = 'linear-gradient(135deg, #A8E6CF 0%, #88D8B0 100%)'
    }
    // 夏季：6-8 月
    else if (month >= 6 && month <= 8) {
      seasonBg = 'linear-gradient(135deg, #64B5F6 0%, #42A5F5 100%)'
    }
    // 秋季：9-11 月
    else if (month >= 9 && month <= 11) {
      seasonBg = 'linear-gradient(135deg, #FFB347 0%, #FFCC33 100%)'
    }
    // 冬季：12-2 月
    else {
      seasonBg = 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)'
    }

    this.setData({ globalBgUrl: seasonBg })
  }
})
