Page({
  data: {
    globalBgUrl: '',
    currentDate: '',
    currentTab: 'today',
    showMore: false,
    selectedSign: 'aries',
    selectedSignData: null,
    fortune: {},
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
    this.loadCurrentDate()
    this.loadDefaultSign()
  },

  onShow: function () {
    const app = getApp()
    app.applyGlobalBackground(this)
  },
  loadCurrentDate: function () {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const day = now.getDate()
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const weekday = weekdays[now.getDay()]
    this.setData({
      currentDate: `${year}年${month}月${day}日 ${weekday}`
    })
  },

  // 获取默认星座（根据日期自动匹配）
  loadDefaultSign: function () {
    const now = new Date()
    const month = now.getMonth() + 1
    const day = now.getDate()
    const sign = this.getZodiacSign(month, day)

    this.setData({
      selectedSign: sign
    })

    // 加载该星座的运势
    this.loadSignFortune(sign)
  },

  // 根据月日获取星座
  getZodiacSign: function (month, day) {
    const signs = [
      { en: 'capricorn', start: [12, 22], end: [1, 19] },
      { en: 'aquarius', start: [1, 20], end: [2, 18] },
      { en: 'pisces', start: [2, 19], end: [3, 20] },
      { en: 'aries', start: [3, 21], end: [4, 19] },
      { en: 'taurus', start: [4, 20], end: [5, 20] },
      { en: 'gemini', start: [5, 21], end: [6, 21] },
      { en: 'cancer', start: [6, 22], end: [7, 22] },
      { en: 'leo', start: [7, 23], end: [8, 22] },
      { en: 'virgo', start: [8, 23], end: [9, 22] },
      { en: 'libra', start: [9, 23], end: [10, 23] },
      { en: 'scorpio', start: [10, 24], end: [11, 22] },
      { en: 'sagittarius', start: [11, 23], end: [12, 21] }
    ]

    for (const sign of signs) {
      if ((month === sign.start[0] && day >= sign.start[1]) ||
          (month === sign.end[0] && day <= sign.end[1])) {
        return sign.en
      }
    }
    return 'aries'
  },

  // 切换日期标签
  switchTab: function (e) {
    const tab = e.currentTarget.dataset.tab
    console.log('切换 tab:', tab)
    this.setData({ currentTab: tab })

    // 重新加载对应日期的运势
    this.loadSignFortune(this.data.selectedSign, tab)
  },

  // 展开/收起更多
  toggleMore: function () {
    this.setData({
      showMore: !this.data.showMore
    })
  },

  // 查看更多星座信息
  viewMore: function () {
    this.showConstellationSelector()
  },

  // 显示星座选择器（简化为切换到选择页面）
  showConstellationSelector: function () {
    // 这里可以弹窗显示星座选择器
    wx.showToast({
      title: '点击下方切换星座',
      icon: 'none'
    })
  },

  // 加载星座运势
  loadSignFortune: function (sign, tab = 'today') {
    const that = this
    const app = getApp()
    const selectedData = this.data.constellations.find(item => item.en === sign)

    this.setData({
      selectedSignData: selectedData
    })

    wx.showLoading({ title: '加载中...' })

    wx.request({
      url: `${app.globalData.baseUrl}/constellation/${sign}/${tab}`,
      success: function (res) {
        wx.hideLoading()
        console.log('API 返回:', res.data)
        if (res.data.success && res.data.data) {
          const fortuneData = res.data.data
          // 根据 tab 处理不同的数据格式
          that.processFortuneData(fortuneData, tab)
        } else {
          that.generateLocalFortune(sign, tab)
        }
      },
      fail: function (err) {
        wx.hideLoading()
        console.error('请求失败:', err)
        that.generateLocalFortune(sign, tab)
      }
    })
  },

  // 处理返回的运势数据
  processFortuneData: function (data, tab) {
    let fortune = {}

    // 如果返回的是完整格式（包含 today/week/month/year）
    if (data.today || data.week || data.month || data.year) {
      // 根据 tab 选择对应的数据
      switch (tab) {
        case 'today':
          fortune = data.today || {}
          break
        case 'week':
          fortune = data.week || {}
          break
        case 'month':
          fortune = data.month || {}
          break
        case 'year':
          fortune = data.year || {}
          break
        default:
          fortune = data.today || {}
      }

      // 合并通用字段
      fortune.sign = data.sign
      fortune.sign_name = data.sign_name
    } else {
      // 旧格式，直接使用
      fortune = data
    }

    console.log('处理后的运势:', fortune)
    this.setData({ fortune: fortune })
  },

  // 生成本地运势（后备方案）
  generateLocalFortune: function (sign, tab = 'today') {
    const now = new Date()
    const day = now.getDate()
    const month = now.getMonth() + 1
    const signIndex = this.data.constellations.findIndex(item => item.en === sign)

    // 根据 tab 生成不同的 seed
    const tabMap = { 'today': 0, 'tomorrow': 1, 'week': 7, 'month': 30, 'year': 365 }
    const tabOffset = tabMap[tab] || 0
    const seed = day + month + (signIndex + 1) * 7 + tabOffset
    const totalScore = 60 + (seed * 11) % 41

    const mottos = [
      '见春天不见故人，敬山水不敬过往',
      '心若向阳，无畏悲伤',
      '星光不问赶路人，时光不负有心人',
      '生活不止眼前的苟且，还有诗和远方',
      '愿你被这世界温柔以待',
      '所有的相遇，都是久别重逢',
      '人生若只如初见，何事秋风悲画扇',
      '不忘初心，方得始终'
    ]

    const descriptions = [
      '今天旺盛的精力会驱使着你排除万难，有效地控制事情的走势。',
      '运势平稳，适合处理日常事务，不宜做重大决定。',
      '创造力旺盛，适合进行艺术创作或解决复杂问题。',
      '人际关系良好，容易得到他人的帮助和支持。',
      '需要谨慎行事，避免做出重要决定，多观察少说话。',
      '财运较好，可能会有意外的收入，适合理财规划。',
      '感情运势上升，单身者有机会遇到心仪对象。',
      '事业运不错，工作上会有新的机会和挑战。'
    ]

    const weekDescriptions = [
      '本周整体运势平稳上升，适合制定新计划并逐步实施。',
      '本周可能会遇到一些小挑战，但凭借你的智慧都能化解。',
      '本周是展现实力的好时机，积极主动会带来意外收获。',
      '本周需要保持耐心，稳扎稳打才能取得长远进步。',
      '本周人际关系良好，多与人交流合作会有意想不到的收获。'
    ]

    const monthDescriptions = [
      '本月整体运势较好，各方面都有不错的表现。',
      '本月需要多加注意健康和情绪管理，保持平和心态。',
      '本月是学习和成长的好时机，适合充电提升自己。',
      '本月可能会有新的机会出现，要勇于把握。',
      '本月适合总结和规划，为下一阶段做好准备。'
    ]

    const yearDescriptions = [
      '今年是充满机遇的一年，事业上会有新的突破。',
      '今年财运亨通，适合投资理财。',
      '今年思维活跃，学习能力强。',
      '今年家庭运势佳，感情有新发展。',
      '今年事业运强劲，有机会晋升。'
    ]

    const planets = [
      { name: '火星', desc: '行动力与决断力的象征' },
      { name: '金星', desc: '爱情与美的守护者' },
      { name: '水星', desc: '沟通与智慧的使者' },
      { name: '木星', desc: '幸运与扩张的行星' },
      { name: '土星', desc: '责任与考验的老师' }
    ]

    const astroEvents = [
      { time: '06:00', event: '日出', suggest: '适合晨练，开启活力一天' },
      { time: '09:00', event: '工作吉时', suggest: '处理重要事务效率高' },
      { time: '12:00', event: '午间休息', suggest: '适当放松，补充能量' },
      { time: '15:00', event: '创意时刻', suggest: '灵感涌现，适合 brainstorm' },
      { time: '18:00', event: '社交吉时', suggest: '适合约会或朋友聚会' },
      { time: '21:00', event: '静心时刻', suggest: '冥想或阅读，沉淀心灵' }
    ]

    const luckyNumbers = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 27, 33]
    const colors = ['红色', '橙色', '黄色', '绿色', '青色', '蓝色', '紫色', '粉色', '白色', '黑色', '灰色', '金色', '银色', '熟褐', '藏青', '米白']
    const matchSigns = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座']
    const yiList = ['约会', '购物', '运动', '学习', '工作', '旅行', '聚会', '阅读', '听音乐', '看电影', '品尝美食', '休息', '整理', '创作', '交流']
    const jiList = ['熬夜', '争吵', '冲动消费', '懒惰', '浪费', '贪吃', '酗酒', '冒险', '犹豫不决', '抱怨', '放弃', '生气', '焦虑', '拖延']

    // 根据 tab 选择描述
    let description = descriptions[seed % descriptions.length]
    if (tab === 'week') {
      description = weekDescriptions[seed % weekDescriptions.length]
    } else if (tab === 'month') {
      description = monthDescriptions[seed % monthDescriptions.length]
    } else if (tab === 'year') {
      description = yearDescriptions[seed % yearDescriptions.length]
    }

    this.setData({
      fortune: {
        sign: sign,
        sign_name: this.data.constellations[signIndex].name,
        totalScore,
        overall: totalScore,
        love: 50 + (seed * 7) % 51,
        work: 50 + (seed * 11) % 51,
        wealth: 50 + (seed * 13) % 51,
        health: 50 + (seed * 17) % 51,
        description: description,
        motto: mottos[seed % mottos.length],
        luckyNumber: luckyNumbers[seed % luckyNumbers.length],
        luckyColor: colors[seed % colors.length],
        matchSign: matchSigns[(seed + signIndex) % matchSigns.length],
        rulingPlanet: planets[seed % planets.length].name,
        rulingPlanetDesc: planets[seed % planets.length].desc,
        yi: yiList.slice(seed % yiList.length, (seed % yiList.length) + 3).join(','),
        ji: jiList.slice((seed + 3) % jiList.length, (seed + 3) % jiList.length + 3).join(','),
        astroEvents: astroEvents.slice(0, 4 + (seed % 3))
      }
    })
  },

  // 跳转函数
  goToMonthFortune: function () {
    wx.showToast({ title: '即将上线', icon: 'none' })
  },

  goToLoveMatch: function () {
    wx.navigateTo({
      url: '/pages/match/match'
    })
  },

  goToFortuneBag: function () {
    wx.showToast({ title: '即将上线', icon: 'none' })
  },

  goToQuarterCareer: function () {
    wx.showToast({ title: '即将上线', icon: 'none' })
  },

  goToYearFortune2026: function () {
    wx.showToast({ title: '即将上线', icon: 'none' })
  },

  goToWealthUp: function () {
    wx.showToast({ title: '即将上线', icon: 'none' })
  },

  goToFateCareer: function () {
    wx.showToast({ title: '即将上线', icon: 'none' })
  },

  goToWealthSecret: function () {
    wx.showToast({ title: '即将上线', icon: 'none' })
  },

  selectColor: function () {
    wx.showToast({ title: '选择颜色', icon: 'none' })
  },

  goToWish: function () {
    wx.showToast({ title: '即将上线', icon: 'none' })
  },

  goToPrayer: function () {
    wx.showToast({ title: '即将上线', icon: 'none' })
  },

  goToWealth: function () {
    wx.showToast({ title: '即将上线', icon: 'none' })
  },

  goToYear2026: function () {
    wx.showToast({ title: '即将上线', icon: 'none' })
  }
})
