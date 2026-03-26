const express = require('express')
const router = express.Router()
const userController = require('../controllers/userController')
const authMiddleware = require('../middleware/auth')

// 微信登录（不需要认证）
router.post('/login/wechat', userController.wechatLogin)

// 获取用户信息（需要认证）
router.get('/profile', authMiddleware, userController.getUserProfile)

// 更新用户信息（需要认证）
router.put('/profile', authMiddleware, userController.updateUserProfile)

// 获取用户统计（需要认证）
router.get('/stats', authMiddleware, userController.getUserStats)

module.exports = router
