Page({
  data: {
    weatherTypes: [
      { type: 1, name: '风', icon: '🌬️' },
      { type: 2, name: '云', icon: '☁️' },
      { type: 3, name: '雨', icon: '🌧️' },
      { type: 4, name: '雪', icon: '❄️' },
      { type: 5, name: '霜', icon: '🌫️' },
      { type: 6, name: '露', icon: '💧' },
      { type: 7, name: '雾', icon: '🌁' },
      { type: 8, name: '雷', icon: '⛈️' },
      { type: 9, name: '晴', icon: '☀️' },
      { type: 10, name: '阴', icon: '☁️' }
    ],
    selectedType: null,
    selectedTypeName: '',
    currentPoetry: null,
    poetryHistory: [],
    loading: false
  },

  onLoad: function () {
    // 从本地存储加载历史记录
    const history = wx.getStorageSync('poetryHistory')
    if (history) {
      this.setData({ poetryHistory: JSON.parse(history) })
    }

    // 默认选中当前天气类型（如果有）
    this.initWeatherType()
  },

  // 初始化天气类型（根据实际天气）
  initWeatherType: function () {
    // 这里可以接入天气 API，根据实际天气自动选择类型
    // 暂时默认为晴天
    this.setData({
      selectedType: 9,
      selectedTypeName: '晴'
    })
  },

  // 选择天气类型
  selectWeatherType: function (e) {
    const type = e.currentTarget.dataset.type
    const selected = this.data.weatherTypes.find(item => item.type === type)

    this.setData({
      selectedType: type,
      selectedTypeName: selected.name
    })

    // 自动获取诗句
    this.getPoetry()
  },

  // 获取诗句
  getPoetry: function () {
    if (this.data.loading) return

    const that = this
    const app = getApp()

    this.setData({ loading: true })

    wx.request({
      url: `${app.globalData.baseUrl}/weather-poetry`,
      data: {
        type: this.data.selectedType || '' // 空则随机
      },
      success: function (res) {
        if (res.data.success && res.data.data) {
          const poetry = res.data.data

          // 更新当前诗句
          that.setData({
            currentPoetry: poetry,
            loading: false
          })

          // 添加到历史记录
          that.addToHistory(poetry)
        } else {
          wx.showToast({
            title: '未找到诗句',
            icon: 'none'
          })
          that.setData({ loading: false })
        }
      },
      fail: function () {
        wx.showToast({
          title: '获取失败',
          icon: 'none'
        })
        that.setData({ loading: false })
      }
    })
  },

  // 添加到历史记录
  addToHistory: function (poetry) {
    let history = this.data.poetryHistory

    // 检查是否已存在
    const exists = history.some(item => item.content === poetry.content)
    if (!exists) {
      // 添加到开头
      history.unshift({
        ...poetry,
        id: Date.now(),
        timestamp: new Date().toISOString()
      })

      // 限制最多 20 条
      if (history.length > 20) {
        history = history.slice(0, 20)
      }

      this.setData({ poetryHistory: history })

      // 保存到本地存储
      wx.setStorageSync('poetryHistory', JSON.stringify(history))
    }
  },

  // 查看历史诗句
  viewPoetry: function (e) {
    const index = e.currentTarget.dataset.index
    const poetry = this.data.poetryHistory[index]

    this.setData({
      currentPoetry: poetry,
      selectedType: poetry.weather_type
    })
  },

  // 清空历史记录
  clearHistory: function () {
    const that = this
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有浏览记录吗？',
      success: function (res) {
        if (res.confirm) {
          that.setData({ poetryHistory: [] })
          wx.removeStorageSync('poetryHistory')
          wx.showToast({
            title: '已清空',
            icon: 'success'
          })
        }
      }
    })
  }
})
