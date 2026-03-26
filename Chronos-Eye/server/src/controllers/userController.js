const { query, run } = require('../config/database')

// 微信登录（简化版，实际需对接微信 API）
async function wechatLogin(req, res) {
  try {
    const { code, nickname, avatar, gender } = req.body

    const openid = `mock_openid_${Date.now()}`

    let user = await query('SELECT * FROM users WHERE openid = ?', [openid])

    if (!user || user.length === 0) {
      const result = await run(
        'INSERT INTO users (openid, nickname, avatar, gender) VALUES (?, ?, ?, ?)',
        [openid, nickname || '时光用户', avatar || '', gender || 0]
      )
      user = await query('SELECT * FROM users WHERE id = ?', [result.lastInsertRowid])
    } else {
      await query(
        'UPDATE users SET nickname = ?, avatar = ?, gender = ? WHERE openid = ?',
        [nickname || user[0].nickname, avatar || user[0].avatar, gender || user[0].gender, openid]
      )
      user = await query('SELECT * FROM users WHERE openid = ?', [openid])
    }

    const token = `mock_token_${user[0].id}_${Date.now()}`

    res.json({
      success: true,
      data: {
        user: user[0],
        token
      }
    })
  } catch (error) {
    console.error('微信登录失败:', error)
    res.status(500).json({
      success: false,
      message: '微信登录失败',
      error: error.message
    })
  }
}

// 获取用户信息
async function getUserProfile(req, res) {
  try {
    // 从认证中间件获取 user_id
    const userId = req.userId
    const user = await query('SELECT * FROM users WHERE id = ?', [userId])

    if (!user || user.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }

    delete user[0].openid
    delete user[0].unionid

    res.json({
      success: true,
      data: user[0]
    })
  } catch (error) {
    console.error('获取用户信息失败:', error)
    res.status(500).json({
      success: false,
      message: '获取用户信息失败',
      error: error.message
    })
  }
}

// 更新用户信息
async function updateUserProfile(req, res) {
  try {
    // 从认证中间件获取 user_id
    const userId = req.userId
    const { nickname, phone, gender, birthday } = req.body

    await run(`
      UPDATE users
      SET nickname = ?, phone = ?, gender = ?, birthday = ?
      WHERE id = ?
    `, [nickname, phone, gender, birthday, userId])

    res.json({
      success: true,
      message: '更新成功'
    })
  } catch (error) {
    console.error('更新用户信息失败:', error)
    res.status(500).json({
      success: false,
      message: '更新用户信息失败',
      error: error.message
    })
  }
}

// 获取用户统计
async function getUserStats(req, res) {
  try {
    // 从认证中间件获取 user_id
    const userId = req.userId

    const scheduleStats = await query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
      FROM schedules
      WHERE user_id = ?
    `, [userId])

    const countdownStats = await query(`
      SELECT COUNT(*) as total FROM user_countdowns WHERE user_id = ? AND is_enabled = 1
    `, [userId])

    res.json({
      success: true,
      data: {
        schedules: scheduleStats[0],
        countdowns: countdownStats[0]
      }
    })
  } catch (error) {
    console.error('获取用户统计失败:', error)
    res.status(500).json({
      success: false,
      message: '获取用户统计失败',
      error: error.message
    })
  }
}

module.exports = {
  wechatLogin,
  getUserProfile,
  updateUserProfile,
  getUserStats
}
