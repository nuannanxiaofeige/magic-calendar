Page({
  data: {
    globalBgUrl: '',
    currentTab: 0,
    startDate: '',
    endDate: '',
    daysResult: null,
    baseDate: '',
    calcDays: '',
    dateResult: '',
    Math: Math
  },

  onShow: function () {
    const app = getApp()
    app.applyGlobalBackground(this)
  },

  switchTab: function(e) {
    const tab = parseInt(e.currentTarget.dataset.tab)
    this.setData({ currentTab: tab })
  },

  onStartDateChange: function(e) {
    this.setData({ startDate: e.detail.value })
  },

  onEndDateChange: function(e) {
    this.setData({ endDate: e.detail.value })
  },

  onBaseDateChange: function(e) {
    this.setData({ baseDate: e.detail.value })
  },

  onCalcDaysInput: function(e) {
    this.setData({ calcDays: e.detail.value })
  },

  calcDays: function() {
    const { startDate, endDate } = this.data
    if (!startDate || !endDate) {
      wx.showToast({ title: '请选择日期', icon: 'none' })
      return
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = end - start
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    this.setData({ daysResult: diffDays })
  },

  calcDate: function() {
    const { baseDate, calcDays } = this.data
    if (!baseDate || !calcDays) {
      wx.showToast({ title: '请填写完整', icon: 'none' })
      return
    }

    const base = new Date(baseDate)
    base.setDate(base.getDate() + parseInt(calcDays))

    const year = base.getFullYear()
    const month = String(base.getMonth() + 1).padStart(2, '0')
    const day = String(base.getDate()).padStart(2, '0')
    const result = `${year}-${month}-${day}`

    this.setData({ dateResult: result })
  },

  quickCalc: function(e) {
    const days = parseInt(e.currentTarget.dataset.days)
    const today = new Date()
    today.setDate(today.getDate() + days)

    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const result = `${year}-${month}-${day}`

    const now = new Date()
    const nowStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    this.setData({
      startDate: nowStr,
      endDate: result,
      daysResult: days,
      currentTab: 0
    })
  }
})
