//pages/holiday/holiday.js
Page({
  data: {
    tabList: [
      { key: 'festival', name: '法定节假日', category: 'festival' },
      { key: 'public', name: '公众节日', category: 'public' },
      { key: 'term', name: '二十四节气', type: 'term' }
    ],
    currentTab: 0,
    holidayList: [],
    allHolidays: [],
    termList: [],
    searchKeyword: '',
    loading: true,
    // 二十四节气年份
    termYear: new Date().getFullYear(),
    minYear: new Date().getFullYear() - 10,
    maxYear: new Date().getFullYear() + 10,
    baseUrl: ''
  },

  onLoad: function (options) {
    const currentYear = new Date().getFullYear()
    this.setData({
      minYear: currentYear - 10,
      maxYear: currentYear + 10,
      baseUrl: getApp().globalData.baseUrl
    })
    this.loadAllHolidays()
  },

  onShow: function () {
    // 每次显示页面时刷新数据
    this.loadAllHolidays()
  },

  // 切换 Tab
  onTabChange: function (e) {
    const index = e.currentTarget.dataset.index
    if (index === this.data.currentTab) return

    const selectedTab = this.data.tabList[index]
    this.setData({
      currentTab: index,
      searchKeyword: '',
      loading: true
    })

    // 二十四节气 tab 特殊处理
    if (selectedTab.type === 'term') {
      const currentYear = new Date().getFullYear()
      this.setData({
        termYear: currentYear,
        loading: true
      })
      this.loadSolarTerms()
    } else {
      const selectedCategory = selectedTab.category
      this.loadHolidaysByCategory(selectedCategory)
    }
  },

  // 上一年
  onPrevYear: function () {
    const prevYear = this.data.termYear - 1
    if (prevYear >= this.data.minYear) {
      this.setData({
        termYear: prevYear,
        loading: true
      })
      this.loadSolarTerms()
    } else {
      wx.showToast({
        title: '已经是最小年份',
        icon: 'none'
      })
    }
  },

  // 下一年
  onNextYear: function () {
    const nextYear = this.data.termYear + 1
    if (nextYear <= this.data.maxYear) {
      this.setData({
        termYear: nextYear,
        loading: true
      })
      this.loadSolarTerms()
    } else {
      wx.showToast({
        title: '已经是最大年份',
        icon: 'none'
      })
    }
  },

  // 按分类加载节日
  loadHolidaysByCategory: function (category) {
    const that = this
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    // 公众节日包含多个子分类
    const categories = category === 'public'
      ? ['international', 'western', 'national']
      : [category]

    const promises = categories.map(cat => {
      return new Promise((resolve, reject) => {
        wx.request({
          url: `${this.data.baseUrl}/holidays/list?category=${cat}`,
          success: function (res) {
            resolve(res.data.data || [])
          },
          fail: function () {
            resolve([])
          }
        })
      })
    })

    Promise.all(promises).then(results => {
      // 合并所有数据
      let holidays = [].concat(...results)

      // 计算距离节日的天数并格式化
      holidays = holidays.map(item => {
        // 计算距离节日的天数
        let itemDate
        if (item.date_full) {
          itemDate = new Date(item.date_full)
        } else {
          // 对于没有 date_full 的，用 date_month 和 date_day 构建今年的日期
          const year = today.getFullYear()
          itemDate = new Date(`${year}-${String(item.date_month).padStart(2, '0')}-${String(item.date_day).padStart(2, '0')}`)
          // 如果今年的日期已经过了，用明年
          if (itemDate < new Date(todayStr)) {
            itemDate = new Date(`${year + 1}-${String(item.date_month).padStart(2, '0')}-${String(item.date_day).padStart(2, '0')}`)
          }
        }

        const daysLeft = Math.ceil((itemDate - today) / (1000 * 60 * 60 * 24))
        item.days_left = daysLeft >= 0 ? daysLeft : 0

        // 格式化日期显示
        if (item.date_full) {
          item.date_display = that.formatDateWithWeekday(item.date_full)
        } else {
          item.date_display = `${item.date_month}月${item.date_day}日`
        }

        // 获取风格
        item.style = that.getHolidayStyle(item.name, item.type)
        return item
      })

      // 按天数排序，最近的在前
      holidays.sort((a, b) => a.days_left - b.days_left)

      // 处理法定节日的假期信息
      if (category === 'festival') {
        holidays = holidays.map(item => {
          if (item.vacation_dates) {
            item.vacation_dates = typeof item.vacation_dates === 'string'
              ? item.vacation_dates.split('|').filter(d => d)
              : item.vacation_dates
            item.vacation_dates_formatted = that.formatVacationDates(item.vacation_dates)
          }
          return item
        })
      }

      that.setData({
        holidayList: holidays,
        loading: false
      })
    })
  },

  // 加载二十四节气
  loadSolarTerms: function () {
    const that = this
    const year = that.data.termYear

    wx.request({
      url: `${this.data.baseUrl}/calendar/terms?year=${year}`,
      success: function (res) {
        if (res.data.success && res.data.data) {
          const terms = res.data.data.map(item => {
            // 格式化日期显示（YYYY-MM-DD 格式）
            const date = new Date(item.date)
            const termYear = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
            const weekday = weekdays[date.getDay()]
            item.short_date = `${termYear}-${month}-${day}`
            item.weekday = weekday
            return item
          })
          that.setData({
            termList: terms,
            loading: false
          })
        } else {
          that.setData({ loading: false })
        }
      },
      fail: function (err) {
        console.error('加载节气列表失败:', err)
        that.setData({ loading: false })
      }
    })
  },

  // 加载所有节日
  loadAllHolidays: function () {
    const that = this
    wx.request({
      url: `${this.data.baseUrl}/holidays/list`,
      success: function (res) {
        if (res.data.success && res.data.data) {
          const holidays = res.data.data.map(item => {
            // 将 vacation_dates 从字符串转为数组
            if (item.vacation_dates) {
              item.vacation_dates = typeof item.vacation_dates === 'string'
                ? item.vacation_dates.split('|').filter(d => d)
                : item.vacation_dates
              item.vacation_dates_formatted = that.formatVacationDates(item.vacation_dates)
            }
            // 格式化日期显示
            if (item.date_full) {
              item.date_display = that.formatDateWithWeekday(item.date_full)
            } else {
              item.date_display = `${item.date_month}月${item.date_day}日`
            }
            // 获取匹配的节日风格
            item.style = that.getHolidayStyle(item.name, item.type)
            return item
          })
          that.setData({
            allHolidays: holidays
          })
          // 加载默认 tab 的数据（按距离排序）
          that.loadHolidaysByCategory(that.data.tabList[0].category)
        }
      },
      fail: function (err) {
        console.error('加载节日列表失败:', err)
        that.setData({ loading: false })
      }
    })
  },

  // 搜索输入
  onSearchInput: function (e) {
    const keyword = e.detail.value.trim().toLowerCase()
    this.setData({ searchKeyword: keyword })

    if (!keyword) {
      // 搜索清空时，重新加载当前 tab 的数据
      const selectedCategory = this.data.tabList[this.data.currentTab].category
      this.loadHolidaysByCategory(selectedCategory)
      return
    }

    const filtered = this.data.allHolidays.filter(item => {
      return item.name.toLowerCase().includes(keyword)
    })
    this.setData({ holidayList: filtered })
  },

  // 格式化假期日期
  formatVacationDates: function (dates) {
    if (!dates) return ''
    if (Array.isArray(dates)) {
      const start = this.formatDate(dates[0])
      const end = this.formatDate(dates[dates.length - 1])
      if (dates.length === 1) {
        return start
      }
      return `${start} - ${end}`
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

  // 根据节日名称获取匹配的图标和风格
  getHolidayStyle: function (name, type) {
    const holidayStyles = {
      // 春节相关
      '春节': { icon: '🧧', gradient: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)' },
      '除夕': { icon: '🏮', gradient: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)' },
      '元宵节': { icon: '🏮', gradient: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)' },
      // 清明
      '清明': { icon: '🌸', gradient: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)' },
      // 端午
      '端午': { icon: '🫔', gradient: 'linear-gradient(135deg, #27ae60 0%, #16a085 100%)' },
      // 七夕
      '七夕': { icon: '💕', gradient: 'linear-gradient(135deg, #e91e63 0%, #f06292 100%)' },
      '情人节': { icon: '💕', gradient: 'linear-gradient(135deg, #e91e63 0%, #f06292 100%)' },
      // 中秋
      '中秋': { icon: '🌕', gradient: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)' },
      // 国庆
      '国庆': { icon: '🇨🇳', gradient: 'linear-gradient(135deg, #e74c3c 0%, #f1c40f 100%)' },
      // 重阳
      '重阳': { icon: '🏔️', gradient: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)' },
      // 元旦
      '元旦': { icon: '🎉', gradient: 'linear-gradient(135deg, #3498db 0%, #9b59b6 100%)' },
      // 劳动
      '劳动': { icon: '🛠️', gradient: 'linear-gradient(135deg, #e67e22 0%, #d35400 100%)' },
      // 儿童
      '儿童': { icon: '🧸', gradient: 'linear-gradient(135deg, #f39c12 0%, #e74c3c 100%)' },
      // 教师
      '教师': { icon: '📚', gradient: 'linear-gradient(135deg, #9b59b6 0%, #3498db 100%)' },
      // 圣诞
      '圣诞': { icon: '🎄', gradient: 'linear-gradient(135deg, #27ae60 0%, #e74c3c 100%)' },
      '万圣': { icon: '🎃', gradient: 'linear-gradient(135deg, #e67e22 0%, #2c3e50 100%)' },
      // 母亲/父亲
      '母亲': { icon: '💐', gradient: 'linear-gradient(135deg, #e91e63 0%, #f06292 100%)' },
      '父亲': { icon: '👔', gradient: 'linear-gradient(135deg, #34495e 0%, #2c3e50 100%)' },
      // 其他节气
      '立春': { icon: '🌱', gradient: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)' },
      '立夏': { icon: '☀️', gradient: 'linear-gradient(135deg, #f39c12 0%, #e74c3c 100%)' },
      '立秋': { icon: '🍂', gradient: 'linear-gradient(135deg, #e67e22 0%, #d35400 100%)' },
      '立冬': { icon: '❄️', gradient: 'linear-gradient(135deg, #3498db 0%, #9b59b6 100%)' },
    }

    // 先精确匹配
    if (holidayStyles[name]) {
      return holidayStyles[name]
    }

    // 模糊匹配：找最长匹配关键词（优先匹配更长的关键词）
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
    } else if (type === 'term') {
      return { icon: '🍃', gradient: 'linear-gradient(135deg, #27ae60 0%, #16a085 100%)' }
    }

    return { icon: '📅', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }
  }
})
