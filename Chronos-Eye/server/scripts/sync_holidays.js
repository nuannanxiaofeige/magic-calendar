/**
 * 天行 API 节假日数据同步脚本
 * 用法：node scripts/sync_holidays.js [year]
 * 例如：node scripts/sync_holidays.js 2026
 */

require('dotenv').config()
const mysql = require('mysql2/promise')
const dayjs = require('dayjs')
const https = require('https')

// 数据库配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'chronos_eye'
}

// 天行 API 配置
const TIANAPI_CONFIG = {
  key: process.env.TIANAPI_KEY || '',
  baseUrl: 'https://apis.tianapi.com'
}

/**
 * 调用天行 API
 */
async function requestTianapi(path, params = {}) {
  if (!TIANAPI_CONFIG.key) {
    console.error('错误：未配置天行 API Key')
    console.error('请在 .env 文件中设置 TIANAPI_KEY')
    return null
  }

  return new Promise((resolve, reject) => {
    const url = new URL(`${TIANAPI_CONFIG.baseUrl}${path}`)
    url.searchParams.append('key', TIANAPI_CONFIG.key)

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.append(key, value)
    }

    https.get(url.toString(), (res) => {
      let data = ''

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        try {
          const result = JSON.parse(data)
          if (result.code === 200) {
            resolve(result.result?.list || result.result || result.newlist)
          } else {
            console.error('天行 API 错误:', result.msg)
            resolve(null)
          }
        } catch (error) {
          reject(error)
        }
      })
    }).on('error', (error) => {
      reject(error)
    })
  })
}

/**
 * 获取节假日数据（按年）
 */
async function getHolidayInfo(year) {
  try {
    const result = await requestTianapi('/jiejiari/index', {
      type: '1',
      date: String(year)
    })

    if (!result) {
      return null
    }

    const holidays = []

    if (Array.isArray(result)) {
      for (const holiday of result) {
        const vacationStr = holiday.vacation || ''
        const remarkStr = holiday.remark || ''
        const wageStr = holiday.wage || ''

        const vacationDates = vacationStr ? vacationStr.split('|') : []
        const remarkDates = remarkStr ? remarkStr.split('|') : []
        const wageDates = wageStr ? wageStr.split('|') : []

        // 处理假期中的每一天
        for (const dateStr of vacationDates) {
          if (!dateStr) continue

          const isWorkDay = remarkDates.includes(dateStr)

          holidays.push({
            holiday: holiday.holiday || '',
            name: holiday.name || '',
            date: dateStr,
            weekday: 0,
            rest: isWorkDay ? 0 : 1,
            work: isWorkDay ? 1 : 0,
            type: 'festival',
            tip: holiday.tip || '',
            remark: remarkDates,
            wage: wageDates,
            rest_tip: holiday.rest || '',
            start: holiday.start || 0,
            end: holiday.end || 0,
            now: holiday.now || 0,
            vacation_dates: vacationDates.join('|'),
            work_dates: remarkDates.join('|'),
            wage_dates: wageDates.join('|')
          })
        }

        // 处理调休上班日（不在假期范围内的上班日）
        if (remarkDates.length > 0) {
          for (const dateStr of remarkDates) {
            if (!dateStr || vacationDates.includes(dateStr)) continue

            holidays.push({
              holiday: holiday.holiday || '',
              name: '调休上班',
              date: dateStr,
              weekday: 0,
              rest: 0,
              work: 1,
              type: 'festival',
              tip: holiday.tip || '',
              remark: remarkDates,
              wage: [],
              rest_tip: '',
              start: holiday.start || 0,
              end: holiday.end || 0,
              now: holiday.now || 0,
              vacation_dates: vacationDates.join('|'),
              work_dates: remarkDates.join('|'),
              wage_dates: wageDates.join('|')
            })
          }
        }
      }
    }

    return holidays
  } catch (error) {
    console.error('获取节假日数据失败:', error)
    return null
  }
}

/**
 * 获取节气数据
 */
async function getTermInfo(year) {
  try {
    const terms = []
    const termNames = ['立春', '雨水', '惊蛰', '春分', '清明', '谷雨',
                       '立夏', '小满', '芒种', '夏至', '小暑', '大暑',
                       '立秋', '处暑', '白露', '秋分', '寒露', '霜降',
                       '立冬', '小雪', '大雪', '冬至', '小寒', '大寒']

    const termOrderMap = {}
    termNames.forEach((name, index) => {
      termOrderMap[name] = index + 1
    })

    for (const termName of termNames) {
      const result = await requestTianapi('/jieqi/index', { word: termName, year: String(year) })

      if (result && result.date && result.date.gregdate) {
        const termYear = parseInt(result.date.gregdate.split('-')[0])
        if (termYear === year) {
          const dateObj = new Date(result.date.gregdate)
          terms.push({
            name: result.name || termName,
            date: result.date.gregdate,
            time: '00:00',
            week: dateObj.getDay(),
            order: termOrderMap[termName]
          })
        }
      }

      await new Promise(resolve => setTimeout(resolve, 500))
    }

    return terms
  } catch (error) {
    console.error('获取节气数据失败:', error)
    return null
  }
}

/**
 * 保存节假日数据到数据库
 */
async function saveHolidayData(connection, holidayData, year) {
  let insertCount = 0
  let updateCount = 0
  let deleteCount = 0

  // 先删除该年份的现有节假日数据（保留农历和公历节日）
  const deleteResult = await connection.query(
    'DELETE FROM holidays WHERE year = ? AND type = ?',
    [year, 'festival']
  )
  deleteCount = deleteResult[0].affectedRows || 0
  console.log(`  已删除 ${deleteCount} 条 ${year} 年的旧节假日数据`)

  // 获取星期映射
  const weekdayMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

  for (const holiday of holidayData) {
    const dateObj = new Date(holiday.date)
    const weekday = dateObj.getDay()
    const month = dateObj.getMonth() + 1
    const day = dateObj.getDate()

    // 检查是否已存在
    const existing = await connection.query(
      'SELECT id FROM holidays WHERE date_full = ?',
      [holiday.date]
    )

    if (existing[0].length === 0) {
      await connection.query(`
        INSERT INTO holidays (
          holiday_str, name, date_full, type,
          date_month, date_day, weekday,
          is_official, is_rest, is_work,
          vacation_dates, work_dates, wage_dates,
          tip, rest_tip,
          start, end, now,
          year, is_active, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())
      `, [
        holiday.holiday,
        holiday.name,
        holiday.date,
        holiday.type,
        month,
        day,
        weekday,
        holiday.name !== '调休上班' ? 1 : 0,
        holiday.rest,
        holiday.work,
        holiday.vacation_dates,
        holiday.work_dates,
        holiday.wage_dates,
        holiday.tip,
        holiday.rest_tip,
        holiday.start,
        holiday.end,
        holiday.now,
        year
      ])
      insertCount++
    } else {
      await connection.query(`
        UPDATE holidays SET
          holiday_str = ?, name = ?, type = ?,
          date_month = ?, date_day = ?, weekday = ?,
          is_official = ?, is_rest = ?, is_work = ?,
          vacation_dates = ?, work_dates = ?, wage_dates = ?,
          tip = ?, rest_tip = ?,
          start = ?, end = ?, now = ?,
          year = ?, updated_at = NOW()
        WHERE date_full = ?
      `, [
        holiday.holiday,
        holiday.name,
        holiday.type,
        month,
        day,
        weekday,
        holiday.name !== '调休上班' ? 1 : 0,
        holiday.rest,
        holiday.work,
        holiday.vacation_dates,
        holiday.work_dates,
        holiday.wage_dates,
        holiday.tip,
        holiday.rest_tip,
        holiday.start,
        holiday.end,
        holiday.now,
        year,
        holiday.date
      ])
      updateCount++
    }
  }

  return { insertCount, updateCount }
}

/**
 * 保存节气数据到数据库
 */
async function saveTermData(connection, termData, year) {
  let insertCount = 0
  let updateCount = 0

  for (const term of termData) {
    const existing = await connection.query(
      'SELECT id FROM almanac_term_dates WHERE year = ? AND term_name = ?',
      [year, term.name]
    )

    if (existing[0].length === 0) {
      await connection.query(`
        INSERT INTO almanac_term_dates (
          year, term_name, term_order, date, time, week, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW())
      `, [
        year,
        term.name,
        term.order,
        term.date,
        term.time,
        term.week
      ])
      insertCount++
    } else {
      await connection.query(`
        UPDATE almanac_term_dates SET
          term_order = ?, date = ?, time = ?, week = ?, updated_at = NOW()
        WHERE year = ? AND term_name = ?
      `, [
        term.order,
        term.date,
        term.time,
        term.week,
        year,
        term.name
      ])
      updateCount++
    }
  }

  return { insertCount, updateCount }
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2)
  let year = args[0] ? parseInt(args[0]) : dayjs().add(1, 'year').year()

  if (!year || isNaN(year)) {
    console.error('错误：无效的年份')
    console.error('用法：node scripts/sync_holidays.js [year]')
    console.error('例如：node scripts/sync_holidays.js 2026')
    process.exit(1)
  }

  console.log('========================================')
  console.log(`开始同步 ${year}年 节假日和节气数据`)
  console.log('========================================')

  let connection
  try {
    // 连接数据库
    connection = await mysql.createConnection(dbConfig)
    console.log('数据库连接成功')

    // 检查表是否存在
    const [tables] = await connection.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = ? AND table_name IN ('holidays', 'almanac_term_dates')",
      [dbConfig.database]
    )

    if (tables.length < 2) {
      console.error('\n错误：数据表不存在！')
      console.error('请先执行 SQL 脚本创建表：server/sql/holidays redesign.sql')
      console.error('\n执行方式:')
      console.error(`  mysql -u${dbConfig.user} -p ${dbConfig.database} < server/sql/holidays\\ redesign.sql`)
      await connection.end()
      process.exit(1)
    }
    console.log('数据表检查通过')

    // 同步节假日数据
    console.log(`\n[1/2] 获取 ${year}年 节假日数据...`)
    const holidayData = await getHolidayInfo(year)

    if (!holidayData || holidayData.length === 0) {
      console.error('  警告：未获取到节假日数据')
      console.error('  请检查 TIANAPI_KEY 是否正确配置')
    } else {
      console.log(`  获取到 ${holidayData.length} 条节假日记录`)
      console.log('  正在保存到数据库...')
      const holidayResult = await saveHolidayData(connection, holidayData, year)
      console.log(`  节假日保存完成：新增 ${holidayResult.insertCount} 条，更新 ${holidayResult.updateCount} 条`)
    }

    // 暂停 3 秒，避免 API 频率超限
    console.log('\n  暂停 3 秒后获取节气数据...')
    await new Promise(resolve => setTimeout(resolve, 3000))

    // 同步节气数据
    console.log(`\n[2/2] 获取 ${year}年 节气数据...`)
    const termData = await getTermInfo(year)

    if (!termData || termData.length === 0) {
      console.error('  警告：未获取到节气数据')
    } else {
      console.log(`  获取到 ${termData.length} 条节气记录`)
      console.log('  正在保存到数据库...')
      const termResult = await saveTermData(connection, termData, year)
      console.log(`  节气保存完成：新增 ${termResult.insertCount} 条，更新 ${termResult.updateCount} 条`)
    }

    console.log('\n========================================')
    console.log(`同步完成！${year}年 数据已写入数据库`)
    console.log('========================================')

  } catch (error) {
    console.error('\n同步失败:', error)
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

// 运行
main()
