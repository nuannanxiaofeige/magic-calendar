App({
  onLaunch: function () {
    console.log('时光之眼小程序启动')
  },
  globalData: {
    userInfo: null,
    // baseUrl: 'http://47.102.152.82:3000/api',  // 测试环境（HTTP）
    baseUrl: 'https://your-domain.com/api'  // 生产环境（HTTPS）- 上线前修改为实际域名
  }
})
