Page({
  data: {
    provinces: [
      { name: '北京', code: 'beijing' },
      { name: '天津', code: 'tianjin' },
      { name: '上海', code: 'shanghai' },
      { name: '重庆', code: 'chongqing' },
      { name: '河北', code: 'hebei' },
      { name: '山西', code: 'shanxi' },
      { name: '辽宁', code: 'liaoning' },
      { name: '吉林', code: 'jilin' },
      { name: '黑龙江', code: 'heilongjiang' },
      { name: '江苏', code: 'jiangsu' },
      { name: '浙江', code: 'zhejiang' },
      { name: '安徽', code: 'anhui' },
      { name: '福建', code: 'fujian' },
      { name: '江西', code: 'jiangxi' },
      { name: '山东', code: 'shandong' },
      { name: '河南', code: 'henan' },
      { name: '湖北', code: 'hubei' },
      { name: '湖南', code: 'hunan' },
      { name: '广东', code: 'guangdong' },
      { name: '海南', code: 'hainan' },
      { name: '四川', code: 'sichuan' },
      { name: '贵州', code: 'guizhou' },
      { name: '云南', code: 'yunnan' },
      { name: '陕西', code: 'shaanxi' },
      { name: '甘肃', code: 'gansu' },
      { name: '青海', code: 'qinghai' },
      { name: '内蒙古', code: 'neimenggu' },
      { name: '广西', code: 'guangxi' },
      { name: '宁夏', code: 'ningxia' },
      { name: '新疆', code: 'xinjiang' },
      { name: '西藏', code: 'xizang' }
    ],
    provinceIndex: 0,

    // 油价数据
    priceData: {},
    priceChange: {},
    updateTime: '',

    // 国际油价
    internationalData: [],

    // 调价历史
    historyData: [],

    // UI 状态
    loading: false,
    loadingMore: false,
    showIntlModal: false,
    showHistoryModal: false,

    // 上次刷新时间
    lastRefresh: null
  },

  onLoad: function () {
    // 从本地缓存读取上次选择的省份
    const savedProvince = wx.getStorageSync('lastOilProvince')
    if (savedProvince) {
      const index = this.data.provinces.findIndex(p => p.code === savedProvince)
      if (index >= 0) {
        this.setData({ provinceIndex: index })
      }
    }
    this.loadData()
  },

  onPullDownRefresh: function () {
    this.loadData().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 加载所有数据
  loadData: async function () {
    this.setData({ loading: true })

    try {
      // 并行加载省份油价、国际油价、调价历史
      await Promise.all([
        this.loadOilPrice(),
        this.loadInternationalCrude(),
        this.loadAdjustmentHistory()
      ])

      this.setData({ lastRefresh: new Date() })
    } catch (error) {
      console.error('数据加载失败:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 手动刷新
  refreshData: function () {
    wx.showLoading({ title: '刷新中...' })
    this.loadData().then(() => {
      wx.hideLoading()
      wx.showToast({
        title: '刷新成功',
        icon: 'success'
      })
    })
  },

  // 省份切换
  onProvinceChange: function (e) {
    const index = e.detail.value
    const province = this.data.provinces[index]

    // 保存选择到本地缓存
    wx.setStorageSync('lastOilProvince', province.code)

    this.setData({ provinceIndex: index })
    this.loadOilPrice()
  },

  // 加载省份油价
  loadOilPrice: function () {
    const app = getApp()
    const provinceCode = this.data.provinces[this.data.provinceIndex].code

    return new Promise((resolve, reject) => {
      wx.request({
        url: `${app.globalData.baseUrl}/oil-price/${provinceCode}`,
        success: (res) => {
          console.log('油价 API 响应:', res)
          console.log('油价数据:', res.data)
          if (res.data.success && res.data.data) {
            const data = res.data.data

            // 解析价格和涨幅数据
            const priceData = {}
            const priceChange = {}

            // 处理 92/95/98/0 号油
            const types = ['89', '92', '95', '98', '0']
            for (const type of types) {
              // 优先查找 price_XX 格式，其次查找 XX 格式
              const priceKey1 = `price_${type}`
              const priceKey2 = type
              const changeKey = `change_${type}`

              if (data[priceKey1]) {
                priceData[type] = String(data[priceKey1])
              } else if (data[priceKey2]) {
                priceData[type] = String(data[priceKey2])
              }

              if (data[changeKey]) {
                priceChange[type] = String(data[changeKey])
              }
            }

            console.log('解析后的价格数据:', priceData)
            console.log('解析后的涨幅数据:', priceChange)

            this.setData({
              priceData,
              priceChange,
              updateTime: data.update_time ? this.formatDate(new Date(data.update_time)) : this.formatDate(new Date())
            })
          }
          resolve()
        },
        fail: (err) => {
          console.error('请求油价失败:', err)
          reject(err)
        }
      })
    })
  },

  // 加载国际油价
  loadInternationalCrude: function () {
    const app = getApp()

    return new Promise((resolve, reject) => {
      wx.request({
        url: `${app.globalData.baseUrl}/oil-price/international`,
        success: (res) => {
          console.log('国际油价 API 响应:', res)
          console.log('国际油价数据:', res.data)
          if (res.data.success && res.data.data) {
            console.log('国际油价数组长度:', res.data.data.length)
            this.setData({
              internationalData: res.data.data
            })
            console.log('setData 后 internationalData:', this.data.internationalData)
          }
          resolve()
        },
        fail: (err) => {
          console.error('请求国际油价失败:', err)
          reject(err)
        }
      })
    })
  },

  // 加载调价历史
  loadAdjustmentHistory: function () {
    const app = getApp()

    return new Promise((resolve, reject) => {
      wx.request({
        url: `${app.globalData.baseUrl}/oil-price/history?limit=10`,
        success: (res) => {
          console.log('调价历史 API 响应:', res)
          console.log('调价历史数据:', res.data)
          if (res.data.success && res.data.data) {
            console.log('调价历史数组长度:', res.data.data.length)
            this.setData({
              historyData: res.data.data
            })
            console.log('setData 后 historyData:', this.data.historyData)
          }
          resolve()
        },
        fail: (err) => {
          console.error('请求调价历史失败:', err)
          reject(err)
        }
      })
    })
  },

  // 显示国际油价详情
  showMoreInternational: function () {
    this.setData({ showIntlModal: true })
  },

  hideIntlModal: function () {
    this.setData({ showIntlModal: false })
  },

  // 显示调价历史详情
  showMoreHistory: function () {
    // 加载更多历史数据
    if (this.data.historyData.length < 50) {
      this.loadMoreHistory()
    }
    this.setData({ showHistoryModal: true })
  },

  hideHistoryModal: function () {
    this.setData({ showHistoryModal: false })
  },

  // 加载更多调价历史
  loadMoreHistory: function () {
    if (this.data.loadingMore) return

    this.setData({ loadingMore: true })
    const app = getApp()

    wx.request({
      url: `${app.globalData.baseUrl}/oil-price/history?limit=50`,
      success: (res) => {
        if (res.data.success && res.data.data) {
          this.setData({
            historyData: res.data.data
          })
        }
      },
      complete: () => {
        this.setData({ loadingMore: false })
      }
    })
  },

  // 阻止事件冒泡
  stopPropagation: function () {},

  // 格式化日期
  formatDate: function (date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  // 页面卸载时清理
  onUnload: function () {
    // 清理可能的定时器
  }
})
