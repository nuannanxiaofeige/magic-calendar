Page({
  data: {
    currentDate: '',
    lunarDate: '',
    events: [], // 改为数组
    total: 0,
    loadError: null
  },

  onLoad: function () {
    this.loadDate()
    this.loadHistoryEvents()
  },

  onShow: function () {
    // 每次显示时刷新数据
    this.loadHistoryEvents()
  },

  loadDate: function () {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const day = now.getDate()
    this.setData({
      currentDate: `${year}年${month}月${day}日`,
      lunarDate: `农历${this.getLunarDate(now)}`
    })
  },

  loadHistoryEvents: function () {
    const that = this
    const now = new Date()
    const month = now.getMonth() + 1
    const day = now.getDate()
    const app = getApp()
    this.setData({ loadError: null })
    // 调用列表接口
    wx.request({
      url: `${app.globalData.baseUrl}/history/today`,
      success: function (res) {
        if (res.data.success) {
          // history/today 返回的是单个对象，需要包装成数组
          const data = res.data.data
          const events = data ? [data] : []
          that.setData({
            events: events,
            total: res.data.total || (data ? 1 : 0)
          })
        } else {
          that.setData({ loadError: '加载失败' })
        }
      },
      fail: function (err) {
        console.error('加载历史事件失败:', err)
        that.setData({ loadError: '加载失败，请检查网络连接' })
      }
    })
  },

  getCategoryName: function (category) {
    const names = {
      'politics': '政治',
      'military': '军事',
      'science': '科技',
      'culture': '文化',
      'sports': '体育',
      'entertainment': '娱乐',
      'economy': '经济',
      'other': '其他'
    }
    return names[category] || category
  },

  getLunarDate: function (date) {
    // 简化农历计算，实际应使用农历库
    const lunarMonths = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊']
    const lunarDays = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
                       '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
                       '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十']
    const month = lunarMonths[(date.getMonth()) % 12]
    const day = lunarDays[(date.getDate() - 1) % 30]
    return `${month}月${day}`
  }
})
