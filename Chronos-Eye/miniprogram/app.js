const theme = require('./utils/theme.js')

App({
  onLaunch: async function () {
    console.log('魔法日历小程序启动')

    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'env-9gbp93eo58c28b9c',  // 替换为你的云环境ID
        traceUser: true
      })
    }

    // 初始化主题背景
    await this.initTheme()
  },

  /**
   * 初始化主题
   */
  async initTheme() {
    const result = await theme.initTheme()
    this.globalData.bgImageUrl = result.bgUrl
    this.globalData.themeConfig = result.config

    // 保存到本地，用于页面动态设置背景
    if (result.bgUrl) {
      wx.setStorageSync('globalBgUrl', result.bgUrl)
    } else {
      wx.removeStorageSync('globalBgUrl')
    }

    console.log('主题初始化完成', result)
  },

  /**
   * 切换主题
   */
  async switchTheme(themeId) {
    const result = await theme.switchTheme(themeId)
    if (result.success) {
      this.globalData.bgImageUrl = result.bgUrl
      this.globalData.themeConfig = result.config

      // 更新本地存储
      if (result.bgUrl) {
        wx.setStorageSync('globalBgUrl', result.bgUrl)
      } else {
        wx.removeStorageSync('globalBgUrl')
      }
    }
    return result
  },

  /**
   * 应用全局背景到页面
   * 在每个页面的 onShow 中调用
   */
  applyGlobalBackground(pageThis) {
    const bgUrl = wx.getStorageSync('globalBgUrl')
    if (bgUrl) {
      pageThis.setData({
        globalBgUrl: bgUrl
      })
    }
  },

  globalData: {
    userInfo: null,
    baseUrl: 'http://47.102.152.82:3000/api',  // 测试环境（HTTP）
    bgImageUrl: '',     // 全局背景图片URL
    themeConfig: null   // 当前主题配置
  }
})
