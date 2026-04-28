/**
 * 主题服务 - 云开发主题背景管理
 */

const defaultBg = ''  // 默认无背景

/**
 * 获取当前激活的主题配置
 */
async function getCurrentTheme() {
  try {
    const db = wx.cloud.database()
    const res = await db.collection('theme_config')
      .where({ isActive: true })
      .limit(1)
      .get()

    if (res.data && res.data.length > 0) {
      const theme = res.data[0]
      return theme
    }
    return null
  } catch (e) {
    console.error('获取主题配置失败', e)
    return null
  }
}

/**
 * 获取背景图临时链接
 * @param {string} fileId - 云存储文件ID
 */
async function getBackgroundUrl(fileId) {
  if (!fileId) {
    return null
  }

  // 去除可能的空格
  fileId = String(fileId).trim()
  try {
    const res = await wx.cloud.getTempFileURL({
      fileList: [fileId]
    })

    if (res.fileList[0].tempFileURL) {
      return res.fileList[0].tempFileURL
    }
    return null
  } catch (e) {
    console.error("获取背景 URL 失败", e)
    return null
  }
}
/**
 * 初始化主题 - 小程序启动时调用
 */
async function initTheme() {
  const config = await getCurrentTheme()

  if (config && config.background) {
    const bgUrl = await getBackgroundUrl(config.background)
    return {
      bgUrl: bgUrl || '',
      config: config
    }
  }

  return {
    bgUrl: defaultBg,
    config: null
  }
}

/**
 * 获取所有主题列表
 */
async function getAllThemes() {
  try {
    const db = wx.cloud.database()
    const res = await db.collection('theme_config').get()
    return res.data || []
  } catch (e) {
    console.error('获取主题列表失败', e)
    return []
  }
}

/**
 * 切换主题
 * @param {string} themeId - 主题文档ID
 */
async function switchTheme(themeId) {
  try {
    const db = wx.cloud.database()

    // 关闭所有主题
    await db.collection('theme_config').where({ isActive: true }).update({
      data: { isActive: false }
    })

    // 开启指定主题
    await db.collection('theme_config').doc(themeId).update({
      data: { isActive: true }
    })

    // 获取新的主题配置
    const config = await getCurrentTheme()
    if (config && config.background) {
      const bgUrl = await getBackgroundUrl(config.background)
      return { success: true, bgUrl: bgUrl || '', config }
    } else {
      return { success: true, bgUrl: '', config: null }
    }
  } catch (e) {
    console.error('切换主题失败', e)
    return { success: false, error: e.message }
  }
}

/**
 * 获取节日/季节对应的背景
 * @param {string} type - 'festival' | 'season'
 * @param {string} value - 节日名或季节名
 */
async function getThemeByDate(type, value) {
  try {
    const db = wx.cloud.database()
    const res = await db.collection('theme_config')
      .where({
        type: type,
        value: value,
        isActive: true
      })
      .limit(1)
      .get()

    if (res.data && res.data.length > 0) {
      const config = res.data[0]
      const bgUrl = await getBackgroundUrl(config.background)
      return { bgUrl: bgUrl || '', config }
    }
    return null
  } catch (e) {
    console.error('获取日期主题失败', e)
    return null
  }
}

/**
 * 上传背景图片到云存储并添加主题配置
 * @param {string} tempFilePath - 临时文件路径
 * @param {object} themeData - 主题配置数据
 */
async function uploadBackground(tempFilePath, themeData) {
  try {
    const cloudPath = `backgrounds/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.png`
    const uploadResult = await wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: tempFilePath
    })

    // 添加到主题配置集合
    const db = wx.cloud.database()
    await db.collection('theme_config').add({
      data: {
        ...themeData,
        background: uploadResult.fileID,
        createTime: db.serverDate()
      }
    })

    return { success: true, fileId: uploadResult.fileID }
  } catch (e) {
    console.error('上传背景失败', e)
    return { success: false, error: e.message }
  }
}

module.exports = {
  getCurrentTheme,
  getBackgroundUrl,
  initTheme,
  getAllThemes,
  switchTheme,
  getThemeByDate,
  uploadBackground,
  defaultBg
}
