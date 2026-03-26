//pages/mine/mine.js
Page({
  data: {
    nickname: '',
    avatarUrl: '',
    stats: {
      countdown: 0,
      schedule: 0,
      favorite: 0
    }
  },

  onLoad: function () {
    this.loadUserInfo()
    this.loadStats()
  },

  onShow: function () {
    // 每次显示时刷新统计数据
    this.loadStats()
  },

  // 加载用户信息
  loadUserInfo: function () {
    const that = this
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      that.setData({
        nickname: userInfo.nickName || '微信用户',
        avatarUrl: userInfo.avatarUrl || ''
      })
    } else {
      // 尝试获取用户信息
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: (res) => {
          const userInfo = res.userInfo
          that.setData({
            nickname: userInfo.nickName || '微信用户',
            avatarUrl: userInfo.avatarUrl || ''
          })
          wx.setStorageSync('userInfo', userInfo)
        },
        fail: () => {
          that.setData({
            nickname: '微信用户',
            avatarUrl: ''
          })
        }
      })
    }
  },

  // 加载统计数据
  loadStats: function () {
    const countdowns = wx.getStorageSync('countdowns') || []
    const schedules = wx.getStorageSync('schedules') || []
    const favorites = wx.getStorageSync('favorites') || []

    this.setData({
      'stats.countdown': countdowns.length,
      'stats.schedule': schedules.length,
      'stats.favorite': favorites.length
    })
  },

  // 页面跳转
  navigateTo: function (e) {
    const url = e.currentTarget.dataset.url
    if (url) {
      wx.navigateTo({
        url: url
      })
    }
  },

  // 意见反馈
  showFeedback: function () {
    wx.showModal({
      title: '意见反馈',
      editable: true,
      placeholderText: '请留下您的宝贵建议...',
      success: (res) => {
        if (res.confirm && res.content) {
          wx.showToast({
            title: '感谢反馈',
            icon: 'success'
          })
          // 这里可以调用 API 提交反馈
        }
      }
    })
  },

  // 关于我们
  showAbout: function () {
    wx.showModal({
      title: '关于时光之眼',
      content: '时光之眼是一款集黄历、节日、倒计时、日程管理于一体的综合性时间管理应用。\n\nVersion 1.0.0\n\n用心记录每一个重要时刻',
      showCancel: false,
      confirmText: '我知道了'
    })
  }
})
