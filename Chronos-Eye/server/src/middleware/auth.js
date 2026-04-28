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
    // 验证 JWT Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = decoded.userId
    next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: '认证令牌无效或已过期'
    })
  }
}

module.exports = authMiddleware
