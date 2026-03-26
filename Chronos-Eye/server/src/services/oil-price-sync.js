/**
 * 油价数据同步服务
 * 调用 Python 爬虫获取油价数据，同步到数据库
 */
const { exec } = require('child_process')
const { query, initDatabase } = require('../config/database')
const path = require('path')

// 确保数据库已初始化
initDatabase().catch(err => console.error('[油价同步] 数据库初始化失败:', err))

/**
 * 执行 Python 脚本并获取结果
 */
function runPythonScript(scriptCode) {
  return new Promise((resolve, reject) => {
    // 使用虚拟环境的 Python
    const pythonCmd = path.join(__dirname, '../../venv/bin/python3')
    const child = exec(`${pythonCmd} -c "${scriptCode.replace(/"/g, '\\"')}"`, {
      cwd: path.join(__dirname, '../../scripts'),
      env: { ...process.env, PYTHONPATH: path.join(__dirname, '../../scripts') }
    }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Python 执行失败：${error.message}\n${stderr}`))
        return
      }
      try {
        const result = JSON.parse(stdout.trim())
        resolve(result)
      } catch (e) {
        console.log('Python 输出:', stdout)
        reject(new Error(`JSON 解析失败：${stdout.trim()}`))
      }
    })
  })
}

/**
 * 同步省份油价到数据库
 */
async function syncProvinceOilPrice(provinceCode, provinceName, priceDate) {
  try {
    const script = `
import sys
sys.path.insert(0, '.')
from oil_price_crawler import get_province_oil_price
import json

data = get_province_oil_price('${provinceCode}')
print(json.dumps(data) if data else 'null')
    `

    const data = await runPythonScript(script)

    if (!data) {
      console.log(`[油价同步] ${provinceName} 获取失败，跳过`)
      return { success: false, province: provinceName, reason: '获取失败' }
    }

    // 插入或更新数据库
    await query(`
      INSERT INTO oil_province_price (
        province, province_code,
        price_89, price_92, price_95, price_98, price_0,
        change_89, change_92, change_95, change_98, change_0,
        price_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        price_89 = VALUES(price_89),
        price_92 = VALUES(price_92),
        price_95 = VALUES(price_95),
        price_98 = VALUES(price_98),
        price_0 = VALUES(price_0),
        change_89 = VALUES(change_89),
        change_92 = VALUES(change_92),
        change_95 = VALUES(change_95),
        change_98 = VALUES(change_98),
        change_0 = VALUES(change_0),
        updated_at = CURRENT_TIMESTAMP
    `, [
      data['province'],
      data['province_code'],
      data['price_89'] || null,
      data['price_92'] || null,
      data['price_95'] || null,
      data['price_98'] || null,
      data['price_0'] || null,
      data['change_89'] || null,
      data['change_92'] || null,
      data['change_95'] || null,
      data['change_98'] || null,
      data['change_0'] || null,
      priceDate
    ])

    console.log(`[油价同步] ${provinceName}: 92#${data['price_92'] || '--'} (涨跌:${data['change_92'] || '--'})`)
    return { success: true, province: provinceName, data }
  } catch (error) {
    console.error(`[油价同步] ${provinceName} 失败：`, error.message)
    return { success: false, province: provinceName, reason: error.message }
  }
}

/**
 * 同步所有省份油价到数据库
 */
async function syncAllProvincesOilPrice(priceDate = null) {
  const startDate = priceDate || new Date().toISOString().split('T')[0]
  console.log(`[油价同步] 开始同步 ${startDate} 油价数据...`)

  const provinceMap = {
    'beijing': '北京', 'shanghai': '上海', 'tianjin': '天津', 'chongqing': '重庆',
    'guangdong': '广东', 'jiangsu': '江苏', 'zhejiang': '浙江', 'shandong': '山东',
    'henan': '河南', 'hebei': '河北', 'hunan': '湖南', 'hubei': '湖北',
    'sichuan': '四川', 'shaanxi': '陕西', 'anhui': '安徽', 'fujian': '福建',
    'jiangxi': '江西', 'liaoning': '辽宁', 'heilongjiang': '黑龙江', 'jilin': '吉林',
    'shanxi': '山西', 'hainan': '海南', 'guizhou': '贵州', 'yunnan': '云南',
    'gansu': '甘肃', 'qinghai': '青海', 'neimenggu': '内蒙古', 'guangxi': '广西',
    'ningxia': '宁夏', 'xinjiang': '新疆', 'xizang': '西藏'
  }

  const results = {
    success: 0,
    fail: 0,
    total: Object.keys(provinceMap).length,
    details: []
  }

  // 逐个省份同步（避免并发过高）
  for (const [code, name] of Object.entries(provinceMap)) {
    const result = await syncProvinceOilPrice(code, name, startDate)
    results.details.push(result)
    if (result.success) {
      results.success++
    } else {
      results.fail++
    }
    // 每次请求后延迟 300ms，避免请求过快
    await new Promise(resolve => setTimeout(resolve, 300))
  }

  console.log(`[油价同步] 省份油价完成：成功 ${results.success}/${results.total}，失败 ${results.fail}`)
  return results
}

/**
 * 同步国际原油价格到数据库
 */
async function syncInternationalCrude(priceDate = null) {
  const dataDate = priceDate || new Date().toISOString().split('T')[0]
  console.log(`[油价同步] 开始同步国际原油价格...`)

  try {
    const script = `
import sys
sys.path.insert(0, '.')
from oil_price_crawler import get_international_crude
import json

data = get_international_crude()
print(json.dumps(data) if data else 'null')
    `

    const data = await runPythonScript(script)

    if (!data || data.length === 0) {
      console.log('[油价同步] 国际原油获取失败')
      return { success: false, count: 0 }
    }

    let insertCount = 0
    for (const item of data) {
      try {
        await query(`
          INSERT INTO oil_international (
            oil_name, price, \`change\`, change_percent,
            prev_close, high, low, update_time, data_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            price = VALUES(price),
            \`change\` = VALUES(\`change\`),
            change_percent = VALUES(change_percent),
            prev_close = VALUES(prev_close),
            high = VALUES(high),
            low = VALUES(low),
            update_time = VALUES(update_time),
            updated_at = CURRENT_TIMESTAMP
        `, [
          item.name,
          item.price,
          item.change,
          item.change_percent,
          item.prev_close,
          item.high,
          item.low,
          item.update_time,
          dataDate
        ])
        insertCount++
        console.log(`  - ${item.name}: ${item.price}`)
      } catch (error) {
        console.error(`  插入失败 ${item.name}:`, error.message)
      }
    }

    console.log(`[油价同步] 国际原油完成：成功 ${insertCount}/${data.length}`)
    return { success: true, count: insertCount }
  } catch (error) {
    console.error('[油价同步] 国际原油失败:', error.message)
    return { success: false, reason: error.message, count: 0 }
  }
}

/**
 * 同步油价调整历史到数据库
 */
async function syncAdjustmentHistory() {
  console.log(`[油价同步] 开始同步油价调整历史...`)

  try {
    const script = `
import sys
sys.path.insert(0, '.')
from oil_price_crawler import get_adjustment_history
import json

data = get_adjustment_history()
print(json.dumps(data) if data else 'null')
    `

    const data = await runPythonScript(script)

    if (!data || data.length === 0) {
      console.log('[油价同步] 调整历史获取失败')
      return { success: false, count: 0 }
    }

    let insertCount = 0
    let updateCount = 0
    for (const item of data) {
      try {
        // 检查是否已存在
        const existing = await query('SELECT id FROM oil_adjustment_history WHERE adjust_date = ?', [item.date])

        if (existing.length === 0) {
          await query(`
            INSERT INTO oil_adjustment_history (
              rank, adjust_date, gasoline_price, gasoline_change,
              diesel_price, diesel_change
            ) VALUES (?, ?, ?, ?, ?, ?)
          `, [
            item.rank,
            item.date,
            item.gasoline_price,
            item.gasoline_change,
            item.diesel_price,
            item.diesel_change
          ])
          insertCount++
        } else {
          await query(`
            UPDATE oil_adjustment_history SET
              rank = ?, gasoline_price = ?, gasoline_change = ?,
              diesel_price = ?, diesel_change = ?,
              updated_at = CURRENT_TIMESTAMP
            WHERE adjust_date = ?
          `, [
            item.rank,
            item.gasoline_price,
            item.gasoline_change,
            item.diesel_price,
            item.diesel_change,
            item.date
          ])
          updateCount++
        }
        console.log(`  - ${item.date}: 汽油${item.gasoline_price} (${item.gasoline_change > 0 ? '+' : ''}${item.gasoline_change})`)
      } catch (error) {
        console.error(`  插入失败 ${item.date}:`, error.message)
      }
    }

    console.log(`[油价同步] 调整历史完成：新增 ${insertCount} 条，更新 ${updateCount} 条`)
    return { success: true, insert: insertCount, update: updateCount }
  } catch (error) {
    console.error('[油价同步] 调整历史失败:', error.message)
    return { success: false, reason: error.message, count: 0 }
  }
}

/**
 * 执行完整同步（所有数据）
 */
async function syncAllOilData() {
  console.log('\n' + '='.repeat(60))
  console.log('[油价同步] 开始执行完整同步任务')
  console.log('='.repeat(60))

  const startDate = new Date().toISOString().split('T')[0]

  // 1. 同步省份油价到历史表
  const provinceResult = await syncAllProvincesOilPrice(startDate)

  // 2. 同步国际原油
  const internationalResult = await syncInternationalCrude(startDate)

  // 3. 同步调整历史
  const historyResult = await syncAdjustmentHistory()

  // 4. 刷新最新油价表
  const latestResult = await refreshLatestOilTable()

  console.log('\n' + '='.repeat(60))
  console.log('[油价同步] 完整同步任务完成')
  console.log('='.repeat(60))
  console.log(`  省份油价：成功 ${provinceResult.success}/${provinceResult.total}`)
  console.log(`  国际原油：成功 ${internationalResult.count} 条`)
  console.log(`  调整历史：新增 ${historyResult.insert} 条，更新 ${historyResult.update} 条`)
  console.log(`  最新油价表：成功 ${latestResult.success}/${latestResult.total} 条`)

  return {
    province: provinceResult,
    international: internationalResult,
    history: historyResult,
    latest: latestResult
  }
}

/**
 * 刷新最新油价表（从历史表中同步每个省份的最新数据）
 */
async function refreshLatestOilTable() {
  console.log('[油价同步] 开始刷新最新油价表...')

  try {
    // 使用 INSERT ... ON DUPLICATE KEY UPDATE
    // 从历史表中获取每个省份的最新数据，然后更新到最新表
    const result = await query(`
      INSERT INTO oil_province_price_latest (
        province, province_code,
        price_89, price_92, price_95, price_98, price_0,
        change_89, change_92, change_95, change_98, change_0,
        price_date, created_at, updated_at
      )
      SELECT
        p1.province, p1.province_code,
        p1.price_89, p1.price_92, p1.price_95, p1.price_98, p1.price_0,
        p1.change_89, p1.change_92, p1.change_95, p1.change_98, p1.change_0,
        p1.price_date, NOW(), NOW()
      FROM oil_province_price p1
      INNER JOIN (
        SELECT province_code, MAX(price_date) as max_date
        FROM oil_province_price
        GROUP BY province_code
      ) p2 ON p1.province_code = p2.province_code AND p1.price_date = p2.max_date
      ON DUPLICATE KEY UPDATE
        province = VALUES(province),
        price_89 = VALUES(price_89),
        price_92 = VALUES(price_92),
        price_95 = VALUES(price_95),
        price_98 = VALUES(price_98),
        price_0 = VALUES(price_0),
        change_89 = VALUES(change_89),
        change_92 = VALUES(change_92),
        change_95 = VALUES(change_95),
        change_98 = VALUES(change_98),
        change_0 = VALUES(change_0),
        price_date = VALUES(price_date),
        updated_at = NOW()
    `)

    console.log(`[油价同步] 最新油价表刷新完成：影响 ${result.affectedRows || 0} 条记录`)
    return { success: result.affectedRows || 0, total: 31 }
  } catch (error) {
    console.error('[油价同步] 刷新最新油价表失败:', error.message)
    return { success: 0, total: 31, error: error.message }
  }
}

/**
 * 获取最新油价数据（从最新表）
 */
async function getLatestOilPrice(provinceCode) {
  // 先从最新表查询
  let rows = await query(`
    SELECT * FROM oil_province_price_latest
    WHERE province_code = ?
  `, [provinceCode])

  if (rows.length > 0) {
    const row = rows[0]
    return {
      province: row.province,
      province_code: row.province_code,
      '89': row.price_89?.toString() || null,
      '92': row.price_92?.toString() || null,
      '95': row.price_95?.toString() || null,
      '98': row.price_98?.toString() || null,
      '0': row.price_0?.toString() || null,
      'change_89': row.change_89,
      'change_92': row.change_92,
      'change_95': row.change_95,
      'change_98': row.change_98,
      'change_0': row.change_0,
      update_time: row.price_date
    }
  }

  // 如果最新表没有，尝试从历史表获取（向后兼容）
  rows = await query(`
    SELECT * FROM oil_province_price
    WHERE province_code = ?
    ORDER BY price_date DESC
    LIMIT 1
  `, [provinceCode])

  if (rows.length === 0) return null

  const row = rows[0]
  return {
    province: row.province,
    province_code: row.province_code,
    '89': row.price_89?.toString() || null,
    '92': row.price_92?.toString() || null,
    '95': row.price_95?.toString() || null,
    '98': row.price_98?.toString() || null,
    '0': row.price_0?.toString() || null,
    'change_89': row.change_89,
    'change_92': row.change_92,
    'change_95': row.change_95,
    'change_98': row.change_98,
    'change_0': row.change_0,
    update_time: row.price_date
  }
}

/**
 * 获取历史油价数据（从历史表）
 * @param {string} provinceCode - 省份代码
 * @param {string} startDate - 开始日期
 * @param {string} endDate - 结束日期
 */
async function getHistoricalOilPrice(provinceCode, startDate, endDate) {
  const rows = await query(`
    SELECT * FROM oil_province_price
    WHERE province_code = ?
      AND price_date >= ?
      AND price_date <= ?
    ORDER BY price_date DESC
  `, [provinceCode, startDate, endDate])

  return rows.map(row => ({
    province: row.province,
    province_code: row.province_code,
    '89': row.price_89?.toString() || null,
    '92': row.price_92?.toString() || null,
    '95': row.price_95?.toString() || null,
    '98': row.price_98?.toString() || null,
    '0': row.price_0?.toString() || null,
    'change_89': row.change_89,
    'change_92': row.change_92,
    'change_95': row.change_95,
    'change_98': row.change_98,
    'change_0': row.change_0,
    update_time: row.price_date
  }))
}

/**
 * 获取国际原油最新数据
 */
async function getLatestInternationalCrude() {
  const rows = await query(`
    SELECT * FROM oil_international
    ORDER BY data_date DESC, update_time DESC
  `)

  return rows.map(row => ({
    oil_name: row.oil_name,
    price: row.price,
    change: row.change,
    change_percent: row.change_percent,
    update_time: row.update_time
  }))
}

/**
 * 获取油价调整历史
 */
async function getAdjustmentHistory(limit = 20) {
  const rows = await query(`
    SELECT * FROM oil_adjustment_history
    ORDER BY adjust_date DESC
    LIMIT ?
  `, [limit])

  return rows
}

module.exports = {
  syncAllOilData,
  syncAllProvincesOilPrice,
  syncInternationalCrude,
  syncAdjustmentHistory,
  refreshLatestOilTable,
  getLatestOilPrice,
  getHistoricalOilPrice,
  getLatestInternationalCrude,
  getAdjustmentHistory
}
