const jwt = require('jsonwebtoken')

// JWT 认证中间件
function authMiddleware(req, res, next) {
  // 获取 Token
  const authHeader = req.headers.authorization
  const token = req.query.token || (authHeader && authHeader.replace('Bearer ', ''))

  if (!token) {
    return res.status(401).json({
      success: false,
      message: '未提供认证令牌'
    })
  }

  try {
    // 验证 Token（简化版，实际应使用 jwt.verify）
    // 格式：mock_token_{userId}_{timestamp}
    if (token.startsWith('mock_token_')) {
      const parts = token.split('_')
      if (parts.length >= 3) {
        const userId = parseInt(parts[2])
        if (!isNaN(userId)) {
          req.userId = userId
          return next()
        }
      }
    }

    // 如果使用真实 JWT，解注释下面代码：
    // const decoded = jwt.verify(token, process.env.JWT_SECRET)
    // req.userId = decoded.userId
    // next()

    return res.status(401).json({
      success: false,
      message: '无效的认证令牌'
    })
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: '认证令牌已过期',
      error: error.message
    })
  }
}

module.exports = authMiddleware
