const jwt = require('jsonwebtoken')
const { query, run } = require('../config/database')

// 允许更新的字段白名单 + 长度限制
const ALLOWED_UPDATE_FIELDS = {
  nickname: { type: 'string', max: 50 },
  phone: { type: 'string', max: 20 },
  gender: { type: 'number', min: 0, max: 2 },
  birthday: { type: 'string', max: 10 }
}

/**
 * 校验并过滤用户输入字段
 * @returns {{ fields: object, values: array }} 或 null（校验失败）
 */
function validateAndFilterFields(body) {
  const fields = {}
  const values = []

  for (const [key, rule] of Object.entries(ALLOWED_UPDATE_FIELDS)) {
    if (body[key] === undefined || body[key] === null) continue

    if (rule.type === 'string') {
      const str = String(body[key])
      if (str.length > rule.max) {
        return { error: `${key} 长度超过限制` }
      }
      fields[key] = str
      values.push(str)
    } else if (rule.type === 'number') {
      const num = Number(body[key])
      if (isNaN(num) || num < rule.min || num > rule.max) {
        return { error: `${key} 值不在有效范围` }
      }
      fields[key] = num
      values.push(num)
    }
  }

  return { fields, values }
}

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

    // 生成真实 JWT token
    const token = jwt.sign(
      { userId: user[0].id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

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
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误'
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
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误'
    })
  }
}

// 更新用户信息
async function updateUserProfile(req, res) {
  try {
    // 从认证中间件获取 user_id
    const userId = req.userId

    // 校验并过滤输入字段
    const result = validateAndFilterFields(req.body)
    if (!result) {
      return res.status(400).json({
        success: false,
        message: '参数校验失败'
      })
    }
    if (result.error) {
      return res.status(400).json({
        success: false,
        message: result.error
      })
    }

    const { fields, values } = result

    // 无有效字段则直接返回
    if (Object.keys(fields).length === 0) {
      return res.json({
        success: true,
        message: '更新成功'
      })
    }

    // 动态构建 SET 子句（白名单字段，安全）
    const setClauses = Object.keys(fields).map(key => `${key} = ?`).join(', ')
    const setValues = Object.values(fields)

    await run(
      `UPDATE users SET ${setClauses} WHERE id = ?`,
      [...setValues, userId]
    )

    res.json({
      success: true,
      message: '更新成功'
    })
  } catch (error) {
    console.error('更新用户信息失败:', error)
    res.status(500).json({
      success: false,
      message: '更新用户信息失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误'
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
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误'
    })
  }
}

module.exports = {
  wechatLogin,
  getUserProfile,
  updateUserProfile,
  getUserStats
}
