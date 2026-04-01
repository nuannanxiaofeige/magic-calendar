Page({
  data: {
    currentTab: 'tiangou', // tiangou | worker
    tiangouContent: '',
    workerContent: '',
    noWorkday: false, // 打工日记：是否非工作日
    year: '',
    month: '',
    day: ''
  },

  onLoad: function () {
    this.initDate()
    this.loadDiaries()
  },

  initDate: function () {
    const now = new Date()
    this.setData({
      year: String(now.getFullYear()),
      month: String(now.getMonth() + 1),
      day: String(now.getDate())
    })
  },

  // 切换 Tab
  switchTab: function (e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ currentTab: tab })
  },

  // 加载日记内容
  loadDiaries: function () {
    const app = getApp()
    const baseUrl = app.globalData.baseUrl

    // 并行加载两个日记
    Promise.all([
      this.requestDiary(`${baseUrl}/tiangou-diary/daily`),
      this.requestDiary(`${baseUrl}/worker-diary/daily`)
    ]).then(results => {
      const [tiangouRes, workerRes] = results

      // 处理舔狗日记
      let tiangouContent = '暂无内容'
      if (tiangouRes.success && tiangouRes.data) {
        tiangouContent = tiangouRes.data.content || tiangouRes.data.diary?.content || tiangouContent
      }

      // 处理打工日记
      let workerContent = ''
      let noWorkday = false
      if (workerRes.success) {
        // API 返回 isWorkday 在顶层
        if (workerRes.isWorkday === false || workerRes.data === null) {
          noWorkday = true
          workerContent = workerRes.message || '今日休息，无需打工~'
        } else if (workerRes.data) {
          workerContent = workerRes.data.content || workerRes.data.diary?.content || '暂无内容'
        }
      }

      this.setData({
        tiangouContent,
        workerContent,
        noWorkday
      })
    }).catch(() => {
      this.setData({
        tiangouContent: '加载失败，请重试',
        workerContent: '加载失败，请重试'
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

  // 复制内容
  copyContent: function () {
    const content = this.data.currentTab === 'tiangou'
      ? this.data.tiangouContent
      : this.data.workerContent

    if (!content || content === '暂无内容' || content === '加载失败，请重试') {
      wx.showToast({ title: '暂无内容可复制', icon: 'none' })
      return
    }

    wx.setClipboardData({
      data: content,
      success: () => {
        wx.showToast({ title: '已复制到剪贴板', icon: 'success' })
      },
      fail: () => {
        wx.showToast({ title: '复制失败', icon: 'none' })
      }
    })
  }
})