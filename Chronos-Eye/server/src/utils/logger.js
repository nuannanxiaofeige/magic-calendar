/**
 * 简易日志工具
 * 生产环境抑制 console.log，减少日志噪音
 * 可通过 FORCE_LOG=1 环境变量强制输出
 */
const isDev = process.env.NODE_ENV !== 'production'
const forceLog = process.env.FORCE_LOG === '1'

function shouldLog() {
  return isDev || forceLog
}

const logger = {
  log(...args) {
    if (shouldLog()) {
      console.log(...args)
    }
  },
  info(...args) {
    if (shouldLog()) {
      console.log(...args)
    }
  },
  warn(...args) {
    console.warn(...args)
  },
  error(...args) {
    console.error(...args)
  }
}

module.exports = logger
