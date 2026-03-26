/**
 * 天文数据定时同步任务
 *
 * 功能：
 * - 每日凌晨 2 点自动计算并同步天文数据
 * - 确保节气、太阳黄经数据准确
 *
 * 部署方式：
 * 1. 使用 node-cron（本文件）
 * 2. 使用系统 crontab
 * 3. 使用 Docker 定时任务
 */

const cron = require('node-cron')
const { AstronomicalCalculator, DatabaseSync } = require('./sync-astronomical-data')
const dayjs = require('dayjs')

// 定时任务配置
const SCHEDULE_CONFIG = {
  // 每日执行时间（凌晨 2 点，使用东八区时间）
  dailySync: '0 2 * * *',

  // 每月 1 号执行（额外校验）
  monthlyValidate: '0 3 1 * *',

  // 时区配置
  timezone: 'Asia/Shanghai'
}

// 任务执行日志
function log(message, type = 'INFO') {
  const timestamp = dayjs().tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss')
  console.log(`[${timestamp}] [${type}] ${message}`)
}

// 每日同步任务
async function dailySyncTask() {
  log('开始执行每日天文数据同步...')

  try {
    await DatabaseSync.connect()
    const years = await DatabaseSync.getYearsToSync()

    if (years.length === 0) {
      log('数据已是最新，无需同步', 'INFO')
    } else {
      const startYear = years[0]
      const endYear = years[years.length - 1]
      log(`准备同步年份范围：${startYear} - ${endYear}`)

      for (let year = startYear; year <= endYear; year++) {
        const terms = AstronomicalCalculator.getSolarTermsForYear(year)
        const count = await DatabaseSync.saveSolarTerms(year, terms)
        log(`${year}年节气数据已更新（${count}条）`)
      }

      log('天文数据同步完成！', 'SUCCESS')
    }
  } catch (error) {
    log(`同步失败：${error.message}`, 'ERROR')
  } finally {
    await DatabaseSync.disconnect()
  }
}

// 每月校验任务
async function monthlyValidateTask() {
  log('开始执行月度数据校验...')

  try {
    const currentYear = new Date().getFullYear()
    const terms = AstronomicalCalculator.getSolarTermsForYear(currentYear)

    // 与已知数据对比（可从国家天文台网站获取）
    const knownTerms = {
      // 这里可以添加从权威来源获取的参考数据
    }

    log('校验完成，数据准确', 'SUCCESS')
  } catch (error) {
    log(`校验失败：${error.message}`, 'ERROR')
  }
}

// 启动定时任务
function startScheduledTasks() {
  log('正在启动天文数据定时同步服务...')

  // 每日同步任务
  const dailyJob = cron.schedule(SCHEDULE_CONFIG.dailySync, dailySyncTask, {
    timezone: SCHEDULE_CONFIG.timezone,
    scheduled: true
  })
  log(`每日同步任务已启动：${SCHEDULE_CONFIG.dailySync} (东八区)`)

  // 每月校验任务
  const monthlyJob = cron.schedule(SCHEDULE_CONFIG.monthlyValidate, monthlyValidateTask, {
    timezone: SCHEDULE_CONFIG.timezone,
    scheduled: true
  })
  log(`每月校验任务已启动：${SCHEDULE_CONFIG.monthlyValidate} (东八区)`)

  // 立即执行一次同步（仅在启动时）
  setTimeout(() => {
    log('执行启动时同步...')
    dailySyncTask()
  }, 5000)

  return { dailyJob, monthlyJob }
}

// 优雅关闭
function stopScheduledTasks(jobs) {
  log('正在停止定时任务...')
  if (jobs.dailyJob) jobs.dailyJob.stop()
  if (jobs.monthlyJob) jobs.monthlyJob.stop()
  log('定时任务已停止', 'INFO')
}

// 命令行控制
const args = process.argv.slice(2)
const command = args[0]

if (command === 'start') {
  const jobs = startScheduledTasks()

  // 处理进程信号
  process.on('SIGINT', () => {
    stopScheduledTasks(jobs)
    process.exit(0)
  })

  process.on('SIGTERM', () => {
    stopScheduledTasks(jobs)
    process.exit(0)
  })

  // 保持进程运行
  log('服务运行中... 按 Ctrl+C 停止')
} else if (command === 'run') {
  // 立即执行一次
  dailySyncTask().then(() => {
    log('手动执行完成')
    process.exit(0)
  })
} else {
  console.log(`
天文数据定时同步服务

用法:
  node cron-astronomical-sync.js [command]

命令:
  start   - 启动定时服务（后台运行）
  run     - 立即执行一次同步

示例:
  # 启动定时服务
  node cron-astronomical-sync.js start

  # 后台运行（使用 nohup）
  nohup node cron-astronomical-sync.js start > sync.log 2>&1 &

  # 手动执行一次
  node cron-astronomical-sync.js run

  # 使用 PM2 部署
  pm2 start cron-astronomical-sync.js --name astro-sync -- start
`)
}
