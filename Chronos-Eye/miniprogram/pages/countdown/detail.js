Page({
  data: {
    holiday: null,
    loading: true
  },

  onLoad: function (options) {
    if (options.id) {
      this.loadHolidayDetail(options.id)
    }
  },

  // 根据节日名称获取匹配的渐变色
getHolidayGradient: function (name, type) {
  const gradients = {
    // 春节相关
    '春节': 'linear-gradient(180deg, #e74c3c 0%, #e74c3c 35%, #f5f5f5 35%)',
    '除夕': 'linear-gradient(180deg, #e74c3c 0%, #e74c3c 35%, #f5f5f5 35%)',
    '元宵节': 'linear-gradient(180deg, #f39c12 0%, #f39c12 35%, #f5f5f5 35%)',
    // 清明
    '清明': 'linear-gradient(180deg, #27ae60 0%, #27ae60 35%, #f5f5f5 35%)',
    // 端午
    '端午': 'linear-gradient(180deg, #27ae60 0%, #27ae60 35%, #f5f5f5 35%)',
    // 七夕
    '七夕': 'linear-gradient(180deg, #e91e63 0%, #e91e63 35%, #f5f5f5 35%)',
    '情人节': 'linear-gradient(180deg, #e91e63 0%, #e91e63 35%, #f5f5f5 35%)',
    // 中秋
    '中秋': 'linear-gradient(180deg, #3498db 0%, #3498db 35%, #f5f5f5 35%)',
    // 国庆
    '国庆': 'linear-gradient(180deg, #e74c3c 0%, #e74c3c 35%, #f5f5f5 35%)',
    // 重阳
    '重阳': 'linear-gradient(180deg, #9b59b6 0%, #9b59b6 35%, #f5f5f5 35%)',
    // 元旦
    '元旦': 'linear-gradient(180deg, #3498db 0%, #3498db 35%, #f5f5f5 35%)',
    // 劳动
    '劳动': 'linear-gradient(180deg, #e67e22 0%, #e67e22 35%, #f5f5f5 35%)',
    // 儿童
    '儿童': 'linear-gradient(180deg, #f39c12 0%, #f39c12 35%, #f5f5f5 35%)',
    // 教师
    '教师': 'linear-gradient(180deg, #9b59b6 0%, #9b59b6 35%, #f5f5f5 35%)',
    // 圣诞
    '圣诞': 'linear-gradient(180deg, #27ae60 0%, #27ae60 35%, #f5f5f5 35%)',
    '万圣': 'linear-gradient(180deg, #e67e22 0%, #e67e22 35%, #f5f5f5 35%)',
    // 母亲/父亲
    '母亲': 'linear-gradient(180deg, #e91e63 0%, #e91e63 35%, #f5f5f5 35%)',
    '父亲': 'linear-gradient(180deg, #34495e 0%, #34495e 35%, #f5f5f5 35%)',
    // 其他节气
    '立春': 'linear-gradient(180deg, #2ecc71 0%, #2ecc71 35%, #f5f5f5 35%)',
    '立夏': 'linear-gradient(180deg, #f39c12 0%, #f39c12 35%, #f5f5f5 35%)',
    '立秋': 'linear-gradient(180deg, #e67e22 0%, #e67e22 35%, #f5f5f5 35%)',
    '立冬': 'linear-gradient(180deg, #3498db 0%, #3498db 35%, #f5f5f5 35%)',
  }

  // 先精确匹配
  if (gradients[name]) {
    return gradients[name]
  }

  // 再模糊匹配关键词
  for (const key of Object.keys(gradients)) {
    if (name.includes(key)) {
      return gradients[key]
    }
  }

  // 按类型返回默认
  if (type === 'festival') {
    return 'linear-gradient(180deg, #e74c3c 0%, #e74c3c 35%, #f5f5f5 35%)'
  } else if (type === 'lunar') {
    return 'linear-gradient(180deg, #34495e 0%, #34495e 35%, #f5f5f5 35%)'
  } else if (type === 'solar') {
    return 'linear-gradient(180deg, #f39c12 0%, #f39c12 35%, #f5f5f5 35%)'
  }

  return 'linear-gradient(180deg, #FDFBF7 0%, #FDFBF7 35%, #F5F0E8 35%)'
},

loadHolidayDetail: async function (id) {
    const that = this
    const app = getApp()
    wx.request({
      url: `${app.globalData.baseUrl}/holidays/${id}`,
      success: function (res) {
        if (res.data.success && res.data.data) {
          const holiday = res.data.data
          // 确保数组正确设置
          const workDates = Array.isArray(holiday.work_dates) ? holiday.work_dates : []
          const wageDates = Array.isArray(holiday.wage_dates) ? holiday.wage_dates : []
          const vacationDates = Array.isArray(holiday.vacation_dates) ? holiday.vacation_dates : []

          // 计算距离节日的天数
          const today = new Date()
          const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
          let itemDate
          if (holiday.date_full) {
            itemDate = new Date(holiday.date_full)
          } else {
            // 对于没有 date_full 的，用 date_month 和 date_day 构建今年的日期
            const year = today.getFullYear()
            itemDate = new Date(`${year}-${String(holiday.date_month).padStart(2, '0')}-${String(holiday.date_day).padStart(2, '0')}`)
            // 如果今年的日期已经过了，用明年
            if (itemDate < new Date(todayStr)) {
              itemDate = new Date(`${year + 1}-${String(holiday.date_month).padStart(2, '0')}-${String(holiday.date_day).padStart(2, '0')}`)
            }
          }
          const daysLeft = Math.ceil((itemDate - today) / (1000 * 60 * 60 * 24))
          holiday.days_left = daysLeft >= 0 ? daysLeft : 0

          // 获取匹配的节日风格
          const gradient = that.getHolidayGradient(holiday.name, holiday.type)

          that.setData({
            holiday: holiday,
            vacation_dates: vacationDates,
            work_dates: workDates,
            wage_dates: wageDates,
            gradient: gradient,
            // 预先格式化好日期字符串
            work_dates_text: workDates.map(d => that.formatDate(d)).join('、'),
            wage_dates_text: wageDates.map(d => that.formatDate(d)).join('、'),
            // 预先格式化节日日期
            duration_text: that.formatDurationFromDates(vacationDates, holiday),
            typeText: that.getTypeText(holiday.type),
            loading: false
          })
          // 设置页面标题
          wx.setNavigationBarTitle({
            title: holiday.name
          })
        }
      },
      fail: function (err) {
        console.error('加载节假日详情失败:', err)
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
        that.setData({ loading: false })
      }
    })
  },

  // 格式化日期范围（从日期数组）
  formatDurationFromDates: function (dates, holiday) {
    if (!dates || dates.length === 0) {
      if (holiday.date_full) {
        return this.formatDate(holiday.date_full)
      }
      return `${holiday.date_month}月${holiday.date_day}日`
    }

    const start = new Date(dates[0])
    const end = new Date(dates[dates.length - 1])
    const startYear = start.getFullYear()
    const startMonth = start.getMonth() + 1
    const startDay = start.getDate()
    const endYear = end.getFullYear()
    const endMonth = end.getMonth() + 1
    const endDay = end.getDate()
    if (startYear === endYear && startMonth === endMonth) {
      return `${startYear}年${startMonth}月${startDay}日 - ${endDay}日`
    }
    return `${startYear}年${startMonth}月${startDay}日 - ${endYear}年${endMonth}月${endDay}日`
  },

  // 格式化日期显示
  formatDate: function (dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()]
    return `${year}年${month}月${day}日 ${weekday}`
  },

  // 格式化日期范围
  formatDuration: function () {
    const holiday = this.data.holiday
    if (!holiday) return ''

    if (holiday.vacation_dates && holiday.vacation_dates.length > 0) {
      const dates = holiday.vacation_dates
      const start = new Date(dates[0])
      const end = new Date(dates[dates.length - 1])
      const startYear = start.getFullYear()
      const startMonth = start.getMonth() + 1
      const startDay = start.getDate()
      const endYear = end.getFullYear()
      const endMonth = end.getMonth() + 1
      const endDay = end.getDate()
      if (startYear === endYear && startMonth === endMonth) {
        return `${startYear}年${startMonth}月${startDay}日 - ${endDay}日`
      }
      return `${startYear}年${startMonth}月${startDay}日 - ${endYear}年${endMonth}月${endDay}日`
    }

    if (holiday.date_full) {
      return this.formatDate(holiday.date_full)
    }

    return `${holiday.date_month}月${holiday.date_day}日`
  },

  // 获取类型文本
  getTypeText: function (type) {
    switch (type) {
      case 'festival':
        return '法定节假日'
      case 'solar':
        return '公历节日'
      case 'lunar':
        return '农历节日'
      default:
        return '其他'
    }
  }
})
