Page({
  data: {
    globalBgUrl: '',
    currentYear: 2026,
    currentMonth: 3,
    lunarYear: '',
    lunarMonthText: '',
    weekdays: ['日', '一', '二', '三', '四', '五', '六'],
    days: [],
    selectedDate: '',
    selectedDateInfo: null,
    festivals: [],
    loading: false,  // 加载状态
    baseUrl: ''
  },

  onLoad: function () {
    // 强制清除旧缓存（解决农历日期错误问题）
    this.clearCache()
    // 初始化 baseUrl
    this.setData({ baseUrl: getApp().globalData.baseUrl })
    this.initCalendar()
    this.loadCachedData()  // 加载缓存数据
    // 定期清理过期缓存（每次启动时检查）
    setTimeout(() => this.clearExpiredCache(), 1000)
    // 打印当前缓存状态
    setTimeout(() => {
      console.log('[onLoad] 缓存状态:', Object.keys(this.lunarCache).length, '条')
      const sampleKeys = Object.keys(this.lunarCache).slice(0, 3)
      sampleKeys.forEach(key => {
        console.log('[onLoad] lunarCache[' + key + ']:', this.lunarCache[key])
      })
    }, 2000)
  },

  onShow: function () {
    const app = getApp()
    app.applyGlobalBackground(this)
    this.loadCachedData()
  },

  // 加载缓存数据
  loadCachedData: function () {
    const that = this
    try {
      wx.getStorage({
        key: 'lunarCache',
        success: function (res) {
          if (res.data) {
            that.lunarCache = res.data
          }
        }
      })
    } catch (e) {
      // 缓存不存在或读取失败，忽略
    }
  },

  // 保存缓存数据
  saveCacheToStorage: function () {
    try {
      // 只保留最近的缓存（限制 500 条）
      const cacheKeys = Object.keys(this.lunarCache)
      if (cacheKeys.length > 500) {
        // 保留最近的 500 条（按日期排序）
        const sortedKeys = cacheKeys.sort().slice(-500)
        const newCache = {}
        sortedKeys.forEach(key => {
          newCache[key] = this.lunarCache[key]
        })
        this.lunarCache = newCache
      }
      wx.setStorage({
        key: 'lunarCache',
        data: this.lunarCache
      })
    } catch (e) {
      // 存储失败（可能超出配额），忽略
    }
  },

  // 清理过期缓存（删除超过 1 年的数据）
  clearExpiredCache: function () {
    const now = new Date()
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
    const oneYearLater = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())

    const expiredKeys = []
    Object.keys(this.lunarCache).forEach(key => {
      const cacheDate = new Date(key)
      if (cacheDate < oneYearAgo || cacheDate > oneYearLater) {
        expiredKeys.push(key)
      }
    })

    expiredKeys.forEach(key => {
      delete this.lunarCache[key]
    })

    if (expiredKeys.length > 0) {
      this.saveCacheToStorage()
      console.log(`清理了 ${expiredKeys.length} 条过期缓存`)
    }
  },

  // 清空缓存（用于调试或用户手动清理）
  clearCache: function () {
    this.lunarCache = {}
    wx.removeStorage({ key: 'lunarCache' })
    console.log('缓存已清空')
  },

  // 获取缓存状态（用于调试）
  getCacheStatus: function () {
    const keys = Object.keys(this.lunarCache)
    const size = JSON.stringify(this.lunarCache).length
    const minDate = keys.length > 0 ? keys.sort()[0] : 'N/A'
    const maxDate = keys.length > 0 ? keys.sort().reverse()[0] : 'N/A'

    return {
      count: keys.length,
      size: `${(size / 1024).toFixed(2)} KB`,
      dateRange: `${minDate} ~ ${maxDate}`
    }
  },

  initCalendar: function () {
    // 强制清除旧缓存，确保使用最新的节气数据
    console.log('[initCalendar] 强制清除缓存')
    this.clearCache()

    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const todayStr = this.formatDate(year, month, now.getDate())

    this.setData({
      currentYear: year,
      currentMonth: month,
      lunarYear: year,
      lunarMonthText: '一',
      selectedDate: todayStr
    })
    this.renderCalendar(year, month, todayStr)
    this.loadTodayAlmanac()
    this.loadNearbyFestivals()
  },

  // 渲染日历
  renderCalendar: function (year, month, selectedDate) {
    const that = this
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    const startWeek = firstDay.getDay()
    const totalDays = lastDay.getDate()
    const today = new Date()

    // 如果没有传入 selectedDate，使用当前的
    if (selectedDate === undefined) {
      selectedDate = this.data.selectedDate
    }

    const days = []

    // 添加上月剩余天数（确保第一行有 7 天）
    // 修复：正确处理 1 月份的上月（应该是上一年的 12 月）
    const prevMonthLastDay = new Date(year, month - 1, 0).getDate()
    const prevYear = month === 1 ? year - 1 : year
    const prevMonth = month === 1 ? 12 : month - 1
    for (let i = startWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i
      const fullDate = this.formatDate(prevYear, prevMonth, day)
      days.push({
        day: day,
        lunar: '',
        term: '',
        isToday: false,
        isSelected: selectedDate === fullDate,
        hasEvent: false,
        isRestDay: false,
        isFestival: false,
        isNextMonth: false,
        isPrevMonth: true,
        fullDate: fullDate,
        disabled: true,
        needLunar: true
      })
    }

    // 添加当月天数
    for (let i = 1; i <= totalDays; i++) {
      const fullDate = this.formatDate(year, month, i)
      const isToday = today.getFullYear() === year && today.getMonth() + 1 === month && today.getDate() === i
      const isWeekend = new Date(year, month - 1, i).getDay() % 6 === 0

      days.push({
        day: i,
        lunar: '',
        term: '',
        isToday: isToday,
        isSelected: selectedDate === fullDate,
        hasEvent: false,
        isRestDay: isWeekend,
        isFestival: false,
        isNextMonth: false,
        fullDate: fullDate,
        disabled: false,
        needLunar: true
      })
    }

    // 添加下月开始天数（7×5=35 格，如果不满 35 格则补齐）
    // 修复：正确处理 12 月份的下月（应该是下一年的 1 月）
    const nextYear = month === 12 ? year + 1 : year
    const nextMonth = month === 12 ? 1 : month + 1
    const remaining = 35 - days.length
    for (let i = 1; i <= remaining; i++) {
      days.push({
        day: i,
        lunar: '',
        term: '',
        isToday: false,
        isSelected: selectedDate === this.formatDate(nextYear, nextMonth, i),
        hasEvent: false,
        isRestDay: false,
        isFestival: false,
        isNextMonth: true,
        fullDate: this.formatDate(nextYear, nextMonth, i),
        disabled: true,
        needLunar: true
      })
    }

    this.setData({ days }, () => {
      // 批量获取农历数据
      this.batchFetchLunar(year, month)
    })
  },

  // 批量获取农历数据（带缓存和预加载）
  batchFetchLunar: function (year, month, skipPrefetch) {
    const that = this
    const firstDay = new Date(year, month - 1, 1)
    const totalDays = new Date(year, month, 0).getDate()
    const prevMonthLastDay = new Date(year, month - 1, 0).getDate()
    const startWeek = firstDay.getDay()

    // 获取前一个月、当月、后一个月的农历数据
    const monthsToFetch = [
      { y: month === 1 ? year - 1 : year, m: month === 1 ? 12 : month - 1 },
      { y: year, m: month },
      { y: month === 12 ? year + 1 : year, m: month === 12 ? 1 : month + 1 }
    ]

    let pending = monthsToFetch.length
    const almanacMap = {}
    let hasCacheHit = false
    let hasNetworkRequest = false

    monthsToFetch.forEach(({ y, m }) => {
      const cacheKey = `${y}-${m}`

      // 检查缓存中是否有这个月的数据
      const cachedMonthData = this.getCachedMonth(y, m)
      if (cachedMonthData && cachedMonthData.length > 0) {
        // 使用缓存数据
        for (let day = 1; day <= cachedMonthData.length; day++) {
          const dateKey = that.formatDate(y, m, day)
          const item = cachedMonthData[day - 1]
          almanacMap[dateKey] = item
          console.log(`缓存：${dateKey} => 农历${item.lunar_month}月${item.lunar_day}日 ${item.lunar_festival || ''}`)
        }
        pending--
        hasCacheHit = true
        if (pending === 0) {
          that.updateDaysWithLunar(almanacMap, year, month, prevMonthLastDay, startWeek, totalDays)
          that.saveCacheToStorage()
        }
        return
      }

      // 需要从网络获取
      hasNetworkRequest = true
      wx.request({
        url: `${this.data.baseUrl}/almanac/month/${y}/${m}`,
        success: function (res) {
          console.log(`API 返回 ${y}年${m}月 数据:`, res.data.data.length, '条记录')
          if (res.data.success && res.data.data && Array.isArray(res.data.data)) {
            res.data.data.forEach(item => {
              // 确保 date 字段格式正确
              let dateKey = item.date
              if (!dateKey) {
                // 如果 item.date 不存在，使用 formatted_date
                dateKey = item.formatted_date
              }
              // 标准化日期格式为 YYYY-MM-DD
              // 如果 dateKey 已经是 YYYY-MM-DD 格式，直接使用
              if (dateKey && typeof dateKey === 'string' && dateKey.match(/^\d{4}-\d{2}-\d{2}$/)) {
                // 已经是正确的格式
              } else if (dateKey && typeof dateKey === 'string') {
                const d = new Date(dateKey)
                if (!isNaN(d.getTime())) {
                  dateKey = that.formatDate(d.getFullYear(), d.getMonth() + 1, d.getDate())
                }
              }
              almanacMap[dateKey] = item
              that.lunarCache[dateKey] = item
              console.log(`缓存数据：${dateKey} => 农历${item.lunar_month}月${item.lunar_day}日 term=${item.term || '-'} jieqi=${item.jieqi || '-'}`)
            })
          }
        },
        complete: function () {
          pending--
          if (pending === 0) {
            that.updateDaysWithLunar(almanacMap, year, month, prevMonthLastDay, startWeek, totalDays)
            that.saveCacheToStorage()
            if (!skipPrefetch) {
              that.prefetchNextMonth(year, month)
            }
          }
        }
      })
    })

    // 如果全部命中缓存，立即更新
    if (hasCacheHit && !hasNetworkRequest) {
      this.updateDaysWithLunar(almanacMap, year, month, prevMonthLastDay, startWeek, totalDays)
    }

    // 超时处理（5 秒后强制更新）
    setTimeout(() => {
      if (pending > 0) {
        pending = 0
        that.updateDaysWithLunar(almanacMap, year, month, prevMonthLastDay, startWeek, totalDays)
        that.saveCacheToStorage()
      }
    }, 5000)
  },

  // 从缓存获取指定月份的数据
  getCachedMonth: function (year, month) {
    const cached = []
    const daysInMonth = new Date(year, month, 0).getDate()

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = this.formatDate(year, month, day)
      if (this.lunarCache[dateKey]) {
        // 检查缓存数据是否有 term 字段（确保是新格式的缓存）
        const item = this.lunarCache[dateKey]
        if (item.term !== undefined || item.jieqi !== undefined) {
          cached.push(item)
        } else {
          // 缓存数据是旧格式，返回 null 强制重新获取
          console.log(`[getCachedMonth] ${dateKey} 缓存数据缺少 term/jieqi 字段，强制刷新`)
          return null
        }
      }
    }

    return cached.length === daysInMonth ? cached : null
  },

  // 预加载下下个月数据
  prefetchNextMonth: function (year, month) {
    const nextYear = month === 12 ? year + 1 : year
    const nextMonth = month === 12 ? 1 : month + 1

    // 检查是否已经缓存
    const cached = this.getCachedMonth(nextYear, nextMonth)
    if (cached) return  // 已有缓存，不需要预加载

    // 检查是否正在加载
    if (this.prefetching && this.prefetching === `${nextYear}-${nextMonth}`) return
    this.prefetching = `${nextYear}-${nextMonth}`

    wx.request({
      url: `${this.data.baseUrl}/almanac/month/${nextYear}/${nextMonth}`,
      success: function (res) {
        if (res.data.success && res.data.data && Array.isArray(res.data.data)) {
          res.data.data.forEach(item => {
            const d = new Date(item.date)
            const dateKey = this.formatDate(d.getFullYear(), d.getMonth() + 1, d.getDate())
            this.lunarCache[dateKey] = item
          })
          this.saveCacheToStorage()
        }
      }.bind(this),
      complete: function () {
        this.prefetching = null
      }.bind(this)
    })
  },

  // 更新日历数据（带农历和节气）
  updateDaysWithLunar: function (almanacMap, year, month, prevMonthLastDay, startWeek, totalDays) {
    const { days } = this.data
    const today = new Date()

    console.log(`[updateDaysWithLunar] 开始更新 almanacMap 数据量：${Object.keys(almanacMap).length}`)
    console.log(`[updateDaysWithLunar] 参数：year=${year}, month=${month}, startWeek=${startWeek}, totalDays=${totalDays}`)

    // 打印 almanacMap 中的前几条数据用于调试
    const sampleKeys = Object.keys(almanacMap).slice(0, 3)
    sampleKeys.forEach(key => {
      console.log(`[updateDaysWithLunar] almanacMap[${key}]:`, almanacMap[key])
    })

    // 更新上月日期
    // days 数组中上月日期的索引是 0 到 startWeek-1
    // 日期顺序：prevMonthLastDay-(startWeek-1), ..., prevMonthLastDay-1, prevMonthLastDay
    // 即：如果 startWeek=5, prevMonthLastDay=30，则日期是 26,27,28,29,30
    // 修复：正确处理 1 月份的上月（应该是上一年的 12 月）
    const prevYear = month === 1 ? year - 1 : year
    const prevMonth = month === 1 ? 12 : month - 1
    for (let idx = 0; idx < startWeek; idx++) {
      const day = prevMonthLastDay - (startWeek - 1 - idx)
      const fullDate = this.formatDate(prevYear, prevMonth, day)
      const lunar = almanacMap[fullDate]
      if (lunar) {
        const display = this.getFullDisplayText(lunar, prevYear, prevMonth, day)
        days[idx].displayText = display.text
        days[idx].displayType = display.type
        days[idx].isFestival = (display.type === 'festival')
        days[idx].isOfficial = lunar.is_official === 1
      } else {
        // 使用简单农历计算
        const simple = this.simpleLunarCalc(prevYear, prevMonth, day)
        const display = this.getFullDisplayText(simple, prevYear, prevMonth, day)
        days[idx].displayText = display.text
        days[idx].displayType = display.type
        days[idx].isFestival = (display.type === 'festival')
        days[idx].isOfficial = false
      }
      days[idx].needLunar = false
    }

    // 更新当月日期
    for (let i = 0; i < totalDays; i++) {
      const idx = startWeek + i
      const day = i + 1
      const fullDate = this.formatDate(year, month, day)
      const lunar = almanacMap[fullDate]
      const isToday = today.getFullYear() === year && today.getMonth() + 1 === month && today.getDate() === day

      if (lunar) {
        const display = this.getFullDisplayText(lunar, year, month, day)
        days[idx].displayText = display.text
        days[idx].displayType = display.type
        days[idx].isFestival = (display.type === 'festival')
        days[idx].isOfficial = lunar.is_official === 1
      } else {
        // 使用简单农历计算
        const simple = this.simpleLunarCalc(year, month, day)
        const display = this.getFullDisplayText(simple, year, month, day)
        days[idx].displayText = display.text
        days[idx].displayType = display.type
        days[idx].isFestival = (display.type === 'festival')
        days[idx].isOfficial = false
      }
      days[idx].isToday = isToday
      days[idx].needLunar = false
    }

    // 更新下月日期
    // 修复：正确处理 12 月份的下月（应该是下一年的 1 月）
    const nextYear = month === 12 ? year + 1 : year
    const nextMonth = month === 12 ? 1 : month + 1
    const remaining = 35 - startWeek - totalDays
    console.log(`更新下月日期：${remaining}天，startWeek=${startWeek}, totalDays=${totalDays}`)
    for (let i = 0; i < remaining; i++) {
      const idx = startWeek + totalDays + i
      const day = i + 1
      const fullDate = this.formatDate(nextYear, nextMonth, day)
      console.log(`  下月第${i+1}天：${fullDate}, almanacMap 有数据：${!!almanacMap[fullDate]}`)
      const lunar = almanacMap[fullDate]
      if (lunar) {
        const display = this.getFullDisplayText(lunar, nextYear, nextMonth, day)
        days[idx].displayText = display.text
        days[idx].displayType = display.type
        days[idx].isFestival = (display.type === 'festival')
        days[idx].isOfficial = lunar.is_official === 1
      } else {
        // 使用简单农历计算
        const simple = this.simpleLunarCalc(nextYear, nextMonth, day)
        const display = this.getFullDisplayText(simple, nextYear, nextMonth, day)
        days[idx].displayText = display.text
        days[idx].displayType = display.type
        days[idx].isFestival = (display.type === 'festival')
        days[idx].isOfficial = false
      }
      days[idx].needLunar = false
    }

    this.setData({ days })

    // 更新头部农历显示（使用当月第一天的农历）
    const firstDayDate = this.formatDate(year, month, 1)
    const firstDayLunar = almanacMap[firstDayDate]
    if (firstDayLunar) {
      const lunarMonths = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊']
      this.setData({
        lunarYear: firstDayLunar.lunar_year,
        lunarMonthText: lunarMonths[firstDayLunar.lunar_month - 1] || '正'
      })
    } else {
      // 使用简单计算
      const simple = this.simpleLunarCalc(year, month, 1)
      this.setData({
        lunarYear: simple.lunar_year,
        lunarMonthText: lunarMonths[simple.lunar_month - 1] || '正'
      })
    }
  },

  // 获取农历显示文本（仅农历日期，用于 fallback）
  getLunarDisplayText: function (lunar) {
    // 农历初一显示月份名称
    if (lunar.lunar_day === 1) {
      const lunarMonths = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月']
      return lunarMonths[lunar.lunar_month - 1] || '正月'
    }

    // 其他日期显示农历日
    const lunarDays = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
      '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
      '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十']
    return lunarDays[lunar.lunar_day - 1] || ''
  },

  // 获取完整的显示文本（优先节日/节气）
  getFullDisplayText: function (lunar, year, month, day) {
    console.log(`[getFullDisplayText] 检查 ${year}-${month}-${day}:`, lunar)

    // 先检查阳历节日
    const solarFestival = this.getFestivalName(day, month)
    if (solarFestival) {
      console.log(`[getFullDisplayText] ${year}-${month}-${day} 匹配阳历节日：${solarFestival}`)
      return { type: 'festival', text: solarFestival }
    }

    // 检查后端返回的农历节日（优先使用 API 数据）
    if (lunar.lunar_festival) {
      console.log(`[getFullDisplayText] ${year}-${month}-${day} 匹配农历节日：${lunar.lunar_festival}`)
      return { type: 'festival', text: lunar.lunar_festival }
    }

    // 检查本地农历节日（后备方案）
    const lunarFestival = this.getLunarFestivalName(lunar.lunar_month, lunar.lunar_day)
    if (lunarFestival) {
      console.log(`[getFullDisplayText] ${year}-${month}-${day} 匹配本地农历节日：${lunarFestival}`)
      return { type: 'festival', text: lunarFestival }
    }

    // 检查节气：优先使用 API 返回的 term 或 jieqi（必须有值）
    // 只有当 API 返回了节气时才使用 API 数据，否则使用本地计算
    const apiTerm = lunar.term || lunar.jieqi
    if (apiTerm && apiTerm.trim()) {
      console.log(`[getFullDisplayText] ${year}-${month}-${day} 匹配 API 节气：${apiTerm}`)
      return { type: 'term', text: apiTerm }
    }

    // API 没有返回节气时，使用本地计算
    const localTerm = this.getTermByDate(year, month, day)
    if (localTerm) {
      console.log(`[getFullDisplayText] ${year}-${month}-${day} 匹配本地节气：${localTerm}`)
      return { type: 'term', text: localTerm }
    }

    // 返回农历日期
    const lunarText = this.getLunarDisplayText(lunar)
    console.log(`[getFullDisplayText] ${year}-${month}-${day} 返回农历：${lunarText}`)
    return { type: 'lunar', text: lunarText }
  },

  // 调试：打印农历数据
  debugLunarData: function (lunar, year, month, day) {
    console.log(`日期：${year}-${month}-${day}`)
    console.log(`农历：${lunar.lunar_month}月${lunar.lunar_day}日, 类型：month=${typeof lunar.lunar_month}, day=${typeof lunar.lunar_day}`)
    console.log(`阳历节日：${this.getFestivalName(day, month)}`)
    console.log(`农历节日：${this.getLunarFestivalName(lunar.lunar_month, lunar.lunar_day)}`)
    console.log(`节气：${this.getTermByDate(year, month, day)}`)
  },

  // 上个月
  prevMonth: function () {
    let { currentYear, currentMonth } = this.data
    if (currentMonth === 1) {
      currentMonth = 12
      currentYear--
    } else {
      currentMonth--
    }
    this.setData({
      currentYear,
      currentMonth,
      lunarYear: currentYear,
      lunarMonthText: '一'
    })
    this.renderCalendar(currentYear, currentMonth, this.data.selectedDate)
  },

  // 下个月
  nextMonth: function () {
    let { currentYear, currentMonth } = this.data
    if (currentMonth === 12) {
      currentMonth = 1
      currentYear++
    } else {
      currentMonth++
    }
    this.setData({
      currentYear,
      currentMonth,
      lunarYear: currentYear,
      lunarMonthText: '一'
    })
    this.renderCalendar(currentYear, currentMonth, this.data.selectedDate)
  },

  // 点击日期
  onDayTap: function (e) {
    const { date } = e.currentTarget.dataset
    if (!date) return

    const { currentYear, currentMonth } = this.data
    const clickedDate = new Date(date)
    const clickedMonth = clickedDate.getMonth() + 1
    const clickedYear = clickedDate.getFullYear()

    // 如果点击的是其他月份的日期，切换月份
    if (clickedYear !== currentYear || clickedMonth !== currentMonth) {
      this.setData({
        currentYear: clickedYear,
        currentMonth: clickedMonth,
        lunarYear: clickedYear,
        lunarMonthText: '一'
      })
      // 直接传入 selectedDate，不依赖 setData 的异步更新
      this.renderCalendar(clickedYear, clickedMonth, date)
    } else {
      this.setData({ selectedDate: date })
      this.renderCalendar(currentYear, currentMonth, date)
    }

    this.loadDateAlmanac(date)
  },

  // 加载今日黄历
  loadTodayAlmanac: function () {
    const that = this
    const { currentYear, currentMonth } = this.data
    const date = this.formatDate(currentYear, currentMonth, 1)

    wx.request({
      url: `${this.data.baseUrl}/almanac/month/${currentYear}/${currentMonth}`,
      success: function (res) {
        if (res.data.success && res.data.data && res.data.data.length > 0) {
          const firstDayAlmanac = res.data.data[0]
          const lunarMonths = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊']
          that.setData({
            lunarYear: firstDayAlmanac.lunar_year,
            lunarMonthText: lunarMonths[firstDayAlmanac.lunar_month - 1] || '正'
          })
        }
      }
    })
  },

  // 加载指定日期黄历
  loadDateAlmanac: function (date) {
    const that = this
    wx.request({
      url: `${this.data.baseUrl}/almanac/${date}`,
      success: function (res) {
        if (res.data.success && res.data.data) {
          const almanac = res.data.data
          that.setData({
            selectedDateInfo: {
              solar: date,
              lunar: `农历${almanac.lunar_year}年${almanac.lunar_month}月${almanac.lunar_day}日`,
              yi: almanac.yi,
              ji: almanac.ji,
              events: []
            }
          })
          that.loadHistoryEvents(date)
        } else {
          // API 无数据时使用简单计算
          const dateObj = new Date(date)
          const lunar = that.simpleLunarCalc(dateObj.getFullYear(), dateObj.getMonth() + 1, dateObj.getDate())
          that.setData({
            selectedDateInfo: {
              solar: date,
              lunar: `农历${lunar.year}年${lunar.month}月${lunar.day}`,
              yi: '暂无数据',
              ji: '暂无数据',
              events: []
            }
          })
        }
      },
      fail: function () {
        // 请求失败时使用简单计算
        const dateObj = new Date(date)
        const lunar = that.simpleLunarCalc(dateObj.getFullYear(), dateObj.getMonth() + 1, dateObj.getDate())
        that.setData(prev => ({
          selectedDateInfo: {
            solar: date,
            lunar: `农历${lunar.year}年${lunar.month}月${lunar.day}`,
            yi: '暂无数据',
            ji: '暂无数据',
            events: []
          }
        }))
      }
    })
  },

  // 加载历史事件
  loadHistoryEvents: function (date) {
    const that = this
    wx.request({
      url: `${this.data.baseUrl}/history/today/list?date=${date}`,
      success: function (res) {
        if (res.data.success && res.data.data) {
          that.setData(prev => ({
            selectedDateInfo: {
              ...prev.selectedDateInfo,
              events: res.data.data.slice(0, 3)
            }
          }))
        }
      }
    })
  },

  // 加载近期节日
  loadNearbyFestivals: function () {
    const that = this
    wx.request({
      url: `${this.data.baseUrl}/holidays/recent?limit=3`,
      success: function (res) {
        if (res.data.success && res.data.data) {
          const festivals = res.data.data.map(item => ({
            id: item.id,
            name: item.name,
            icon: that.getHolidayIcon(item.name),
            daysLeft: item.days_left
          }))
          that.setData({ festivals })
        }
      }
    })
  },

  // 获取节日图标
  getHolidayIcon: function (name) {
    const icons = {
      '春节': '🧧', '元宵': '🏮', '清明': '🌸', '端午': '🫔',
      '七夕': '💕', '中秋': '🌕', '国庆': '🇨🇳', '元旦': '🎉',
      '情人': '💕', '儿童': '🧸', '教师': '📚', '圣诞': '🎄'
    }
    for (const [key, icon] of Object.entries(icons)) {
      if (name.includes(key)) return icon
    }
    return '📅'
  },

  // 格式化日期
  formatDate: function (year, month, day) {
    const m = String(month).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    return `${year}-${m}-${d}`
  },

  // 获取节日名称
  getFestivalName: function (day, month) {
    const festivals = {
      '1-1': '元旦', '2-14': '情人节', '3-8': '妇女节', '4-1': '愚人节',
      '5-1': '劳动节', '6-1': '儿童节', '7-1': '建党节', '8-1': '建军节',
      '9-10': '教师节', '10-1': '国庆节', '12-25': '圣诞节'
    }
    return festivals[`${month}-${day}`] || ''
  },

  // 获取农历节日名称
  getLunarFestivalName: function (lunarMonth, lunarDay) {
    const lunarFestivals = {
      '1-1': '春节',
      '1-15': '元宵',
      '2-2': '龙抬头',
      '5-5': '端午',
      '7-7': '七夕',
      '7-15': '中元',
      '8-15': '中秋',
      '9-9': '重阳',
      '10-1': '寒衣',
      '12-8': '腊八',
      '12-23': '小年',
      '12-30': '除夕'
    }
    // 确保是数字类型
    const m = Number(lunarMonth)
    const d = Number(lunarDay)
    return lunarFestivals[`${m}-${d}`] || ''
  },

  // 获取节气名称
  getTermName: function (term) {
    const terms = {
      '1': '小寒', '2': '大寒', '3': '立春', '4': '雨水',
      '5': '惊蛰', '6': '春分', '7': '清明', '8': '谷雨',
      '9': '立夏', '10': '小满', '11': '芒种', '12': '夏至',
      '13': '小暑', '14': '大暑', '15': '立秋', '16': '处暑',
      '17': '白露', '18': '秋分', '19': '寒露', '20': '霜降',
      '21': '立冬', '22': '小雪', '23': '大雪', '24': '冬至'
    }
    return terms[term] || ''
  },

  // 计算指定日期的节气（2000-2030 年精确值）
  getTermByDate: function (year, month, day) {
    // 节气日期表（2000-2030 年）
    const termData = {
      2025: { '1-5': '小寒', '1-20': '大寒', '2-3': '立春', '2-18': '雨水', '3-5': '惊蛰', '3-20': '春分', '4-4': '清明', '4-19': '谷雨', '5-5': '立夏', '5-20': '小满', '6-5': '芒种', '6-21': '夏至', '7-7': '小暑', '7-22': '大暑', '8-7': '立秋', '8-22': '处暑', '9-7': '白露', '9-22': '秋分', '10-8': '寒露', '10-23': '霜降', '11-7': '立冬', '11-22': '小雪', '12-7': '大雪', '12-21': '冬至' },
      2026: { '1-5': '小寒', '1-20': '大寒', '2-4': '立春', '2-18': '雨水', '3-5': '惊蛰', '3-20': '春分', '4-5': '清明', '4-20': '谷雨', '5-5': '立夏', '5-21': '小满', '6-5': '芒种', '6-21': '夏至', '7-7': '小暑', '7-23': '大暑', '8-7': '立秋', '8-23': '处暑', '9-7': '白露', '9-23': '秋分', '10-8': '寒露', '10-23': '霜降', '11-7': '立冬', '11-22': '小雪', '12-7': '大雪', '12-22': '冬至' },
      2027: { '1-5': '小寒', '1-20': '大寒', '2-4': '立春', '2-19': '雨水', '3-6': '惊蛰', '3-21': '春分', '4-5': '清明', '4-20': '谷雨', '5-6': '立夏', '5-21': '小满', '6-6': '芒种', '6-21': '夏至', '7-7': '小暑', '7-23': '大暑', '8-8': '立秋', '8-23': '处暑', '9-8': '白露', '9-23': '秋分', '10-8': '寒露', '10-24': '霜降', '11-8': '立冬', '11-23': '小雪', '12-7': '大雪', '12-22': '冬至' },
      2028: { '1-6': '小寒', '1-21': '大寒', '2-5': '立春', '2-19': '雨水', '3-5': '惊蛰', '3-20': '春分', '4-4': '清明', '4-19': '谷雨', '5-5': '立夏', '5-20': '小满', '6-5': '芒种', '6-21': '夏至', '7-7': '小暑', '7-22': '大暑', '8-7': '立秋', '8-22': '处暑', '9-7': '白露', '9-22': '秋分', '10-8': '寒露', '10-23': '霜降', '11-7': '立冬', '11-22': '小雪', '12-7': '大雪', '12-21': '冬至' },
      2029: { '1-5': '小寒', '1-20': '大寒', '2-3': '立春', '2-18': '雨水', '3-5': '惊蛰', '3-20': '春分', '4-4': '清明', '4-19': '谷雨', '5-5': '立夏', '5-20': '小满', '6-5': '芒种', '6-21': '夏至', '7-7': '小暑', '7-22': '大暑', '8-7': '立秋', '8-22': '处暑', '9-7': '白露', '9-23': '秋分', '10-8': '寒露', '10-23': '霜降', '11-7': '立冬', '11-22': '小雪', '12-7': '大雪', '12-22': '冬至' },
      2030: { '1-5': '小寒', '1-20': '大寒', '2-4': '立春', '2-18': '雨水', '3-6': '惊蛰', '3-21': '春分', '4-5': '清明', '4-20': '谷雨', '5-6': '立夏', '5-21': '小满', '6-6': '芒种', '6-21': '夏至', '7-7': '小暑', '7-23': '大暑', '8-8': '立秋', '8-23': '处暑', '9-8': '白露', '9-23': '秋分', '10-8': '寒露', '10-24': '霜降', '11-8': '立冬', '11-23': '小雪', '12-7': '大雪', '12-22': '冬至' }
    }

    const key = `${month}-${day}`
    // 对于 2025-2030 年，只使用精确数据，不使用 fallback
    if (year >= 2025 && year <= 2030) {
      if (termData[year] && termData[year][key]) {
        return termData[year][key]
      }
      return '' // 精确数据中没有就是没有节气
    }

    // 其他年份使用近似计算
    const termDates = {
      '1-6': '小寒', '1-20': '大寒',
      '2-4': '立春', '2-19': '雨水',
      '3-5': '惊蛰', '3-20': '春分',
      '4-4': '清明', '4-19': '谷雨',
      '5-5': '立夏', '5-20': '小满',
      '6-5': '芒种', '6-21': '夏至',
      '7-7': '小暑', '7-22': '大暑',
      '8-7': '立秋', '8-22': '处暑',
      '9-7': '白露', '9-22': '秋分',
      '10-8': '寒露', '10-23': '霜降',
      '11-7': '立冬', '11-22': '小雪',
      '12-7': '大雪', '12-21': '冬至'
    }
    return termDates[key] || ''
  },

  // 是否是节日
  isFestival: function (day, month) {
    const currentMonth = month !== undefined ? month : this.data.currentMonth
    return !!this.getFestivalName(day, currentMonth)
  },

  // 农历数据缓存
  lunarCache: {},
  prefetching: null,  // 正在预加载的月份

  // 从 API 获取农历信息
  fetchLunarInfo: function (year, month, day, callback) {
    const that = this
    const date = this.formatDate(year, month, day)

    // 检查缓存
    if (this.lunarCache[date]) {
      callback(this.lunarCache[date])
      return
    }

    wx.request({
      url: `${this.data.baseUrl}/almanac/${date}`,
      success: function (res) {
        if (res.data.success && res.data.data) {
          const lunarMonths = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊']
          const lunarDays = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
            '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
            '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十']

          const data = res.data.data
          const lunar = {
            year: data.lunar_year,
            month: lunarMonths[data.lunar_month - 1] || '正',
            day: lunarDays[data.lunar_day - 1] || '初一'
          }
          that.lunarCache[date] = lunar
          callback(lunar)
        } else {
          // API 无数据时使用简单计算
          const simple = that.simpleLunarCalc(year, month, day)
          that.lunarCache[date] = simple
          callback(simple)
        }
      },
      fail: function () {
        const simple = that.simpleLunarCalc(year, month, day)
        that.lunarCache[date] = simple
        callback(simple)
      }
    })
  },

  // 简单农历计算（后备方案）- 使用更精确的算法
  simpleLunarCalc: function (year, month, day) {
    const lunarMonths = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊']
    const lunarDays = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
      '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
      '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十']

    // 农历 1900-2100 年数据表
    // 每个月份数据格式：0xXXXX
    // 高 4 位：闰月月份（0 表示无闰月）
    // 低 12 位：13 个月的大小月情况（1 为大月 30 天，0 为小月 29 天）
    const lunarInfo = [
      0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2, // 1900-1909
      0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977, // 1910-1919
      0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970, // 1920-1929
      0x06566, 0x0d4a0, 0x0ea50, 0x16a95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950, // 1930-1939
      0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557, // 1940-1949
      0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0, // 1950-1959
      0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0, // 1960-1969
      0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6, // 1970-1979
      0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570, // 1980-1989
      0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x05ac0, 0x0ab60, 0x096d5, 0x092e0, // 1990-1999
      0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5, // 2000-2009
      0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930, // 2010-2019
      0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530, // 2020-2029
      0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45, // 2030-2039
      0x0b5a0, 0x056d0, 0x055b3, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0, // 2040-2049
      0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0, // 2050-2059
      0x092e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4, // 2060-2069
      0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0, // 2070-2079
      0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160, // 2080-2089
      0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252, // 2090-2099
      0x0d520, 0x05570, 0x04b63, 0x04b60, 0x0a4b6, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0, // 2100-2109
    ]

    // 获取农历年总天数
    const getLunarYearDays = (idx) => {
      const info = lunarInfo[idx]
      let sum = 0
      for (let i = 0; i < 12; i++) {
        sum += (info & (0x8000 >> i)) ? 30 : 29
      }
      const leap = (info >> 4) & 0xf
      if (leap > 0) {
        sum += (info & (0x8000 >> leap)) ? 30 : 29
      }
      return sum
    }

    // 获取农历月天数
    const getLunarMonthDays = (idx, m) => {
      return (lunarInfo[idx] & (0x8000 >> (m - 1))) ? 30 : 29
    }

    // 获取闰月月份
    const getLeapMonth = (idx) => (lunarInfo[idx] >> 4) & 0xf

    // 基准日期：1900 年 1 月 31 日，农历 1900 年正月初一
    const baseDate = new Date(1900, 0, 31)
    const targetDate = new Date(year, month - 1, day)
    let offset = Math.floor((targetDate - baseDate) / 86400000)

    // 农历年索引（0 = 1900 年）
    let yearIdx = year - 1900
    if (yearIdx < 0) yearIdx = 0
    if (yearIdx >= lunarInfo.length) yearIdx = lunarInfo.length - 1

    // 计算从 1900 年到目标年份前一天的总天数
    let daysPassed = 0
    for (let i = 0; i < yearIdx; i++) {
      daysPassed += getLunarYearDays(i)
    }

    // 在当年中的偏移
    let yearOffset = offset - daysPassed

    // 农历月
    let lunarMonth = 1
    let leapMonth = getLeapMonth(yearIdx)
    let hasLeapMonth = leapMonth > 0

    while (yearOffset >= 0) {
      let monthDays = getLunarMonthDays(yearIdx, lunarMonth)
      yearOffset -= monthDays

      if (yearOffset >= 0) {
        lunarMonth++
        // 检查是否需要插入闰月
        if (hasLeapMonth && lunarMonth === leapMonth + 1) {
          // 这是闰月
          let leapDays = getLunarMonthDays(yearIdx, leapMonth)
          yearOffset -= leapDays
          if (yearOffset >= 0) {
            lunarMonth++ // 过了闰月，进入下一个月
          } else {
            // 在闰月中
            lunarMonth-- // 标记为闰月（用负数或其他方式）
            break
          }
        }
      } else {
        break
      }
    }

    // 农历日
    const lunarDay = yearOffset + getLunarMonthDays(yearIdx, lunarMonth) + 1

    return {
      lunar_year: year,
      lunar_month: lunarMonth,
      lunar_day: lunarDay,
      year: lunarYear,
      month: lunarMonths[Math.max(0, Math.min(lunarMonth - 1, 11))] || '正',
      day: lunarDays[Math.max(0, Math.min(lunarDay - 1, 29))] || '初一'
    }
  },

  // 农历计算（1900-2100 年）- 从缓存或 API 获取
  getLunarInfo: function (year, month, day) {
    const date = this.formatDate(year, month, day)
    return this.lunarCache[date] || null
  },

  // 获取农历年天数
  getLunarYearDays: function (lunarInfo, year) {
    let sum = 348
    const info = lunarInfo[year - 1900]
    for (let i = 0x8000; i > 0x8; i >>= 1) {
      sum += (info & i) ? 1 : 0
    }
    return sum + this.getLeapMonthDays(lunarInfo, year)
  },

  // 获取农历月天数
  getLunarMonthDays: function (lunarInfo, year, month) {
    const info = lunarInfo[year - 1900]
    return (info & (0x10000 >> month)) ? 30 : 29
  },

  // 获取闰月月份
  getLeapMonth: function (lunarInfo, year) {
    return lunarInfo[year - 1900] & 0xf
  },

  // 获取闰月天数
  getLeapMonthDays: function (lunarInfo, year) {
    const leap = this.getLeapMonth(lunarInfo, year)
    if (leap === 0) return 0
    const info = lunarInfo[year - 1900]
    return (info & (0x10000 >> leap)) ? 30 : 29
  }
})
