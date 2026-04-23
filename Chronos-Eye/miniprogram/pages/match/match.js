Page({
  data: {
    globalBgUrl: '',
    mode: 'double', // 'double' 或 'single'
    showSelector: false,
    selectorTarget: 1, // 1 或 2
    sign1Data: null,
    sign2Data: null,
    matchResult: null,
    matchList: [],
    constellations: [
      { en: 'aries', name: '白羊座', symbol: '♈', date: '3.21-4.19' },
      { en: 'taurus', name: '金牛座', symbol: '♉', date: '4.20-5.20' },
      { en: 'gemini', name: '双子座', symbol: '♊', date: '5.21-6.21' },
      { en: 'cancer', name: '巨蟹座', symbol: '♋', date: '6.22-7.22' },
      { en: 'leo', name: '狮子座', symbol: '♌', date: '7.23-8.22' },
      { en: 'virgo', name: '处女座', symbol: '♍', date: '8.23-9.22' },
      { en: 'libra', name: '天秤座', symbol: '♎', date: '9.23-10.23' },
      { en: 'scorpio', name: '天蝎座', symbol: '♏', date: '10.24-11.22' },
      { en: 'sagittarius', name: '射手座', symbol: '♐', date: '11.23-12.21' },
      { en: 'capricorn', name: '摩羯座', symbol: '♑', date: '12.22-1.19' },
      { en: 'aquarius', name: '水瓶座', symbol: '♒', date: '1.20-2.18' },
      { en: 'pisces', name: '双鱼座', symbol: '♓', date: '2.19-3.20' }
    ]
  },

  onLoad: function () {
    // 默认选择第一个和第二个星座
    this.setData({
      sign1Data: this.data.constellations[0],
      sign2Data: this.data.constellations[1]
    })
  },

  onShow: function () {
    const app = getApp()
    app.applyGlobalBackground(this)
  },

  // 切换模式
  switchMode: function (e) {
    const mode = e.currentTarget.dataset.mode
    this.setData({
      mode: mode,
      matchResult: null,
      matchList: []
    })
  },

  // 打开选择器 1
  openSelector1: function () {
    this.setData({
      showSelector: true,
      selectorTarget: 1
    })
  },

  // 打开选择器 2
  openSelector2: function () {
    this.setData({
      showSelector: true,
      selectorTarget: 2
    })
  },

  // 关闭选择器
  closeSelector: function () {
    this.setData({
      showSelector: false
    })
  },

  // 不传递点击事件到背景
  doNothing: function () {},

  // 选择星座
  selectSign: function (e) {
    const sign = e.currentTarget.dataset.sign
    const target = this.data.selectorTarget

    if (target === 1) {
      this.setData({ sign1Data: sign })
    } else {
      this.setData({ sign2Data: sign })
    }

    this.setData({ showSelector: false })
  },

  // 开始配对（双人模式）
  startMatch: function () {
    const sign1 = this.data.sign1Data
    const sign2 = this.data.sign2Data

    if (!sign1 || !sign2) {
      wx.showToast({ title: '请选择星座', icon: 'none' })
      return
    }

    wx.showLoading({ title: '配对中...' })

    const app = getApp()
    wx.request({
      url: `${app.globalData.baseUrl}/constellation/match?sign1=${sign1.en}&sign2=${sign2.en}`,
      success: (res) => {
        wx.hideLoading()
        console.log('配对结果:', res.data)
        if (res.data.success && res.data.data) {
          const result = res.data.data
          // 解析评分为各个维度
          const grade = this.parseGrade(result.grade)
          this.setData({
            matchResult: {
              title: result.title,
              grade: grade,
              content: result.content
            }
          })
        } else {
          wx.showToast({ title: '获取配对失败', icon: 'none' })
        }
      },
      fail: (err) => {
        wx.hideLoading()
        console.error('请求失败:', err)
        wx.showToast({ title: '网络错误', icon: 'none' })
      }
    })
  },

  // 查询所有配对（单人模式）
  queryAllMatches: function () {
    const sign1 = this.data.sign1Data

    if (!sign1) {
      wx.showToast({ title: '请选择星座', icon: 'none' })
      return
    }

    wx.showLoading({ title: '查询中...' })

    const app = getApp()
    wx.request({
      url: `${app.globalData.baseUrl}/constellation/match/${sign1.en}/all`,
      success: (res) => {
        wx.hideLoading()
        console.log('配对列表:', res.data)
        if (res.data.success && res.data.data) {
          const list = res.data.data.map(item => {
            // 解析评分，提取爱情评分作为排序依据
            const grade = this.parseGrade(item.grade)
            const loveStars = grade.爱情 || ''
            // 计算内容预览
            const contentPreview = item.content.length > 50 ? item.content.substring(0, 50) + '...' : item.content
            return {
              ...item,
              grade_summary: `爱情：${loveStars}`,
              content_preview: contentPreview
            }
          })
          this.setData({ matchList: list })
        } else {
          wx.showToast({ title: '暂无数据', icon: 'none' })
        }
      },
      fail: (err) => {
        wx.hideLoading()
        console.error('请求失败:', err)
        wx.showToast({ title: '网络错误', icon: 'none' })
      }
    })
  },

  // 解析评分字符串
  parseGrade: function (gradeStr) {
    const result = {}
    if (!gradeStr) return result

    // 解析 "友情：★★ 爱情：★★★ 婚姻：★★ 亲情：★★"
    const patterns = [
      { key: '友情', regex: /友情：([★☆]+)/ },
      { key: '爱情', regex: /爱情：([★☆]+)/ },
      { key: '婚姻', regex: /婚姻：([★☆]+)/ },
      { key: '亲情', regex: /亲情：([★☆]+)/ }
    ]

    patterns.forEach(p => {
      const match = gradeStr.match(p.regex)
      if (match) {
        result[p.key] = match[1]
      }
    })

    return result
  },

  // 查看配对详情
  viewMatchDetail: function (e) {
    const item = e.currentTarget.dataset.item
    const grade = this.parseGrade(item.grade)
    this.setData({
      matchResult: {
        title: `${this.data.sign1Data.name}：${item.sign2_name}`,
        grade: grade,
        content: item.content
      }
    })
    // 滚动到顶部
    wx.pageScrollTo({ scrollTop: 0 })
  }
})
