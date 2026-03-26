require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { initDatabase, DB_TYPE } = require('./config/database')
const scheduler = require('./services/scheduler')

// 初始化数据库
initDatabase().then(() => {
  console.log(`当前使用数据库：${DB_TYPE}`)
  // 启动定时任务（每月底同步下月数据）
  scheduler.startScheduler()
  console.log('[定时任务] 已启动，将在每月 25 日及以后自动同步下月数据')

  // 启动油价同步任务（每 6 小时执行一次）
  scheduler.startOilPriceScheduler()
}).catch(err => {
  console.error('数据库初始化失败:', err)
})

const app = express()

// 中间件
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 导入路由
const holidayRoutes = require('./routes/holiday')
const scheduleRoutes = require('./routes/schedule')
const almanacRoutes = require('./routes/almanac')
const userRoutes = require('./routes/user')
const historyRoutes = require('./routes/history')
const termRoutes = require('./routes/term')
const calendarRoutes = require('./routes/calendar')
const constellationRoutes = require('./routes/constellation')
const constellationMatchRoutes = require('./routes/constellation-match')
const oilPriceRoutes = require('./routes/oil-price')
const idiomQuizRoutes = require('./routes/idiom-quiz')
const tiangouDiaryRoutes = require('./routes/tiangou-diary')
const workerDiaryRoutes = require('./routes/worker-diary')
const weatherPoetryRoutes = require('./routes/weather-poetry')

// 使用路由
app.use('/api/holidays', holidayRoutes)
app.use('/api/schedules', scheduleRoutes)
app.use('/api/almanac', almanacRoutes)
app.use('/api/users', userRoutes)
app.use('/api/history', historyRoutes)
app.use('/api/terms', termRoutes)
app.use('/api/calendar', calendarRoutes)
app.use('/api/constellation', constellationRoutes)
app.use('/api/constellation-match', constellationMatchRoutes)
app.use('/api/oil-price', oilPriceRoutes)
app.use('/api/idiom-quiz', idiomQuizRoutes)
app.use('/api/tiangou-diary', tiangouDiaryRoutes)
app.use('/api/worker-diary', workerDiaryRoutes)
app.use('/api/weather-poetry', weatherPoetryRoutes)

// 健康检查接口
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器运行在端口 ${PORT}`)
  console.log(`环境：${process.env.NODE_ENV || 'development'}`)
  console.log(`API 地址：http://localhost:${PORT}`)
  console.log(`局域网访问地址：http://$(getLocalIP()):${PORT}`)
})
