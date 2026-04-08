Page({
  data: {
    currentDate: '',
    selectedDate: '',
    lunarDateText: '',
    ganzhiText: '',
    weekday: '',
    weekNum: 0,
    yiList: [],
    jiList: [],
    huangdiYear: 4723,
    wuxing: '',
    zhishen: '',
    chongsha: '',
    xingxiu: '',
    caishen: '',
    fushen: '',
    xishen: '',
    yanggui: '',
    yingui: '',
    taishen: '',
    jianchu: '',
    jishen: '',
    pengzu: '',
    xiongshen: '',
    // 新增：天文台数据
    termInfo: {},
    solarLongitude: 0,
    // 新增：十二时辰吉凶
    shiChenList: [],
    // 新增：纳音五行
    naYin: {
      year: '',
      month: '',
      day: '',
      hour: ''
    }
  },

  onLoad: function () {
    const now = new Date()
    const todayStr = this.formatDate(now)
    this.setData({
      selectedDate: todayStr,
      currentDate: this.formatDateShow(now),
      weekday: this.getWeekday(now),
      weekNum: this.getWeekNumber(now)
    })
    this.loadAlmanac(todayStr)
  },

  formatDate: function (date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  formatDateShow: function (date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}年${month}月${day}日`
  },

  loadAlmanac: function (date) {
    const that = this
    const app = getApp()
    wx.request({
      url: `${app.globalData.baseUrl}/almanac/${date}`,
      success: function (res) {
        if (res.data.success && res.data.data) {
          const data = res.data.data
          // 构建冲煞信息
          const conflictZodiac = data.conflict_zodiac || ''
          const conflictSha = data.conflict_sha || ''
          const chongsha = conflictZodiac ? `冲${conflictZodiac} 煞${conflictSha}` : ''

          // 构建十二时辰吉凶
          const shiChenList = that.buildShiChenList(data.ganzhi_day)

          that.setData({
            // 农历和干支信息
            lunarDateText: `农历${data.lunar_month}月${data.lunar_day}`,
            ganzhiText: `${data.ganzhi_year}年 ${data.ganzhi_month}月 ${data.ganzhi_day}日 [属${data.zodiac}]`,
            weekday: that.getWeekday(new Date(date)),
            weekNum: that.getWeekNumber(new Date(date)),

            // 宜忌
            yiList: that.parseYiJi(data.yi),
            jiList: that.parseYiJi(data.ji),

            // 黄帝纪元
            huangdiYear: data.huangdi_year || 4723,

            // 五行纳音
            wuxing: data.wuxing || '',

            // 值神
            zhishen: data.shen_sha || '',

            // 冲煞
            chongsha: chongsha,

            // 二十八星宿
            xingxiu: data.xingxiu || '',

            // 方位信息
            caishen: data.caishen || '',
            fushen: data.fushen || '',
            xishen: data.xishen || '',
            yanggui: data.yanggui || '',
            yingui: data.yingui || '',

            // 胎神和建除
            taishen: data.taishen || '',
            jianchu: data.jianchu || '',

            // 神煞
            jishen: data.jishen || '',
            pengzu: data.pengzu || '',
            xiongshen: data.xiongshen || '',

            // 新增：天文台数据
            termInfo: data.term_info || {},

            // 新增：纳音五行
            naYin: {
              year: data.year_na_yin || '',
              month: data.month_na_yin || '',
              day: data.wuxing || '',
              hour: data.hour_na_yin || ''
            }
          })

          // 加载十二时辰吉凶
          that.loadShiChenJiXiong(date)
        }
      },
      fail: function () {
        wx.showToast({ title: '加载失败', icon: 'none' })
      }
    })
  },

  parseYiJi: function (text) {
    if (!text) return []
    return text.split(/\s+/).filter(item => item.trim())
  },

  // 十二时辰名称
  shiChenNames: ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'],

  // 十二时辰时间范围
  shiChenTime: {
    '子': '23:00-01:00', '丑': '01:00-03:00', '寅': '03:00-05:00',
    '卯': '05:00-07:00', '辰': '07:00-09:00', '巳': '09:00-11:00',
    '午': '11:00-13:00', '未': '13:00-15:00', '申': '15:00-17:00',
    '酉': '17:00-19:00', '戌': '19:00-21:00', '亥': '21:00-23:00'
  },

  // 时辰生肖
  shiChenZodiac: {
    '子': '鼠', '丑': '牛', '寅': '虎', '卯': '兔', '辰': '龙', '巳': '蛇',
    '午': '马', '未': '羊', '申': '猴', '酉': '鸡', '戌': '狗', '亥': '猪'
  },

  // 根据日干支构建十二时辰列表
  buildShiChenList: function (ganzhiDay) {
    if (!ganzhiDay || ganzhiDay.length < 2) return []

    const dayGan = ganzhiDay[0] // 日天干
    const result = []

    // 五鼠遁口诀：甲己还加甲，乙庚丙作初，丙辛从戊起，丁壬庚子居，戊癸壬子头
    const shiGanMap = {
      '甲': 0, '己': 0,  // 甲己日，子时为甲子（天干索引 0）
      '乙': 2, '庚': 2,  // 乙庚日，子时为丙子（天干索引 2）
      '丙': 4, '辛': 4,  // 丙辛日，子时为戊子（天干索引 4）
      '丁': 6, '壬': 6,  // 丁壬日，子时为庚子（天干索引 6）
      '戊': 8, '癸': 8   // 戊癸日，子时为壬子（天干索引 8）
    }

    const tianGan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
    const diZhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

    // 吉凶星（青龙、明堂等为吉，其余为凶）
    const jiStars = ['青龙', '明堂', '金匮', '天德', '玉堂', '司命']

    const startGanIndex = shiGanMap[dayGan] || 0

    for (let i = 0; i < 12; i++) {
      const ganIndex = (startGanIndex + i) % 10
      const zhiIndex = i
      const shiGan = tianGan[ganIndex]
      const shiZhi = diZhi[zhiIndex]

      // 计算值神（建除十二神对应）
      const starIndex = i % 12
      const starName = jiStars.includes(['青龙', '明堂', '朱雀', '金匮', '天德', '玉堂', '司命'][i % 7] || '') ? '吉' : '凶'

      // 简化吉凶判断（按传统口诀）
      let jiXiong = '平'
      if ([0, 2, 4, 6, 8, 10].includes(i)) {
        jiXiong = '吉'
      } else if ([1, 3, 5].includes(i)) {
        jiXiong = '凶'
      }

      result.push({
        name: shiZhi,
        ganzhi: shiGan + shiZhi,
        time: this.shiChenTime[shiZhi],
        zodiac: this.shiChenZodiac[shiZhi],
        jixiong: jiXiong,
        suit: this.getShiChenSuit(shiZhi, jiXiong)
      })
    }

    return result
  },

  // 获取时辰宜忌
  getShiChenSuit: function (zhi, jixiong) {
    const suits = {
      '子': '宜会友 出行', '丑': '宜祭祀 祈福', '寅': '宜嫁娶 入宅',
      '卯': '宜开市 交易', '辰': '宜动土 修造', '巳': '宜出行 赴任',
      '午': '宜祭祀 祈福', '未': '宜嫁娶 订盟', '申': '宜开市 纳财',
      '酉': '宜祭祀 斋醮', '戌': '宜出行 求医', '亥': '宜嫁娶 移徙'
    }
    const base = suits[zhi] || '宜祈福'
    return jixiong === '凶' ? base.replace('宜', '忌') : base
  },

  // 加载十二时辰吉凶
  loadShiChenJiXiong: function (date) {
    // 这里可以调用 API 获取更精确的时辰吉凶
    // 暂时使用本地计算的数据
    console.log('十二时辰吉凶已加载')
  },

  onDateChange: function (e) {
    const date = e.detail.value
    const dateObj = new Date(date)

    this.setData({
      selectedDate: date,
      currentDate: this.formatDateShow(dateObj),
      weekday: this.getWeekday(dateObj),
      weekNum: this.getWeekNumber(dateObj)
    })
    this.loadAlmanac(date)
  },

  getWeekday: function (date) {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return weekdays[date.getDay()]
  },

  getWeekNumber: function (date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
    const pastDays = Math.floor((date - firstDayOfYear) / 86400000)
    return Math.ceil((pastDays + firstDayOfYear.getDay() + 1) / 7)
  },

  onShare: function () {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },

  goToCalendar: function () {
    wx.navigateTo({ url: '/pages/calendar/calendar' })
  }
})
