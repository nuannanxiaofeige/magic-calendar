/**
 * API 请求工具函数
 */

// 获取全局 baseUrl
function getBaseUrl() {
  const app = getApp()
  return app.globalData.baseUrl || 'http://localhost:3000/api'
}

/**
 * 封装 wx.request
 * @param {string} endpoint - API 端点路径（不包含 baseUrl）
 * @param {object} options - 请求配置
 * @returns {Promise}
 */
function request(endpoint, options = {}) {
  return new Promise((resolve, reject) => {
    const url = `${getBaseUrl()}${endpoint}`

    wx.request({
      url: url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        ...(options.header || {})
      },
      success: (res) => {
        resolve(res)
      },
      fail: (err) => {
        console.error(`API 请求失败：${url}`, err)
        reject(err)
      }
    })
  })
}

/**
 * GET 请求
 * @param {string} endpoint - API 端点路径
 * @param {object} data - 请求参数
 * @returns {Promise}
 */
function get(endpoint, data = {}) {
  return request(endpoint, {
    method: 'GET',
    data: data
  })
}

/**
 * POST 请求
 * @param {string} endpoint - API 端点路径
 * @param {object} data - 请求数据
 * @returns {Promise}
 */
function post(endpoint, data = {}) {
  return request(endpoint, {
    method: 'POST',
    data: data
  })
}

module.exports = {
  getBaseUrl,
  request,
  get,
  post
}
