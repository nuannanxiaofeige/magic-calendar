//pages/mine/mine.js
const theme = require('../../utils/theme.js')

Page({
  data: {
    nickname: '',
    avatarUrl: '',
    stats: {
      countdown: 0,
      schedule: 0,
      favorite: 0
    },
    globalBgUrl: '',     // 全局背景
    themeList: [],       // 主题列表
    currentThemeId: ''   // 当前主题ID
  },

  onLoad: function () {
    this.loadUserInfo()
    this.loadStats()
    this.loadThemeList()
  },

  onShow: function () {
    // 应用全局背景
    const app = getApp()
    app.applyGlobalBackground(this)

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

  // 加载主题列表
  async loadThemeList() {
    const themes = await theme.getAllThemes()
    const currentTheme = wx.getStorageSync('currentThemeId') || ''

    this.setData({
      themeList: themes,
      currentThemeId: currentTheme
    })
  },

  // 切换主题
  async switchTheme(e) {
    const themeId = e.currentTarget.dataset.id
    const themeName = e.currentTarget.dataset.name

    wx.showLoading({ title: '切换中...' })

    const result = await theme.switchTheme(themeId)

    wx.hideLoading()

    if (result.success) {
      // 保存当前主题ID
      wx.setStorageSync('currentThemeId', themeId)

      this.setData({
        globalBgUrl: result.bgUrl,
        currentThemeId: themeId
      })

      wx.showToast({
        title: `已切换为${themeName}`,
        icon: 'success'
      })
    } else {
      wx.showToast({
        title: '切换失败',
        icon: 'none'
      })
    }
  },

  // 打开主题选择弹窗
  showThemeSelector() {
    if (this.data.themeList.length === 0) {
      wx.showToast({
        title: '暂无可用主题',
        icon: 'none'
      })
      return
    }

    const themeItems = this.data.themeList.map(t => t.name)

    wx.showActionSheet({
      itemList: themeItems,
      success: (res) => {
        const selectedTheme = this.data.themeList[res.tapIndex]
        this.switchTheme({
          currentTarget: {
            dataset: {
              id: selectedTheme._id,
              name: selectedTheme.name
            }
          }
        })
      }
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
      title: '关于魔法日历',
      content: '魔法日历是一款集黄历、节日、倒计时、日程管理于一体的综合性时间管理应用。\n\nVersion 1.0.0\n\n用心记录每一个重要时刻',
      showCancel: false,
      confirmText: '我知道了'
    })
  }
})
