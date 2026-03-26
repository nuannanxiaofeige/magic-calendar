/**
 * 更新现有黄历数据 - 填充缺失字段
 * 为现有记录填充：lunar_festival, term, solar_festival, conflict_sha
 */

require('dotenv').config()
const mysql = require('mysql2/promise')
const { Solar } = require('lunar-javascript')

async function updateExistingData() {
  console.log('正在连接数据库...')
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '47.102.152.82',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '_kIjZ9iVb@nt',
    database: process.env.DB_NAME || 'chronos_eye'
  })

  try {
    console.log('获取需要更新的数据...')
    const [rows] = await connection.query(`
      SELECT date FROM almanac_data
      WHERE (lunar_festival IS NULL OR lunar_festival = '')
         OR (term IS NULL OR term = '')
         OR (solar_festival IS NULL OR solar_festival = '')
      ORDER BY date
      LIMIT 1000
    `)

    console.log(`找到 ${rows.length} 条记录需要更新`)

    let updated = 0
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const date = new Date(row.date)
      const solar = Solar.fromDate(date)
      const lunar = solar.getLunar()

      // 农历节日
      const lunarFestivals = lunar.getFestivals() || []
      const lunar_festival = lunarFestivals.length > 0 ? lunarFestivals.join(',') : ''

      // 阳历节日
      const solarFestivals = solar.getFestivals() || []
      const solar_festival = solarFestivals.length > 0 ? solarFestivals.join(',') : ''

      // 节气
      const jieqi = lunar.getJieQi() || ''
      const term = jieqi

      // 冲煞
      const conflict_sha = lunar.getDaySha() || ''

      await connection.execute(`
        UPDATE almanac_data SET
          lunar_festival = COALESCE(NULLIF(?, ''), lunar_festival),
          term = COALESCE(NULLIF(?, ''), term),
          solar_festival = COALESCE(NULLIF(?, ''), solar_festival),
          conflict_sha = COALESCE(NULLIF(?, ''), conflict_sha)
        WHERE date = ?
      `, [lunar_festival, term, solar_festival, conflict_sha, row.date])

      updated++
      if (updated % 100 === 0) {
        console.log(`已更新 ${updated}/${rows.length} 条`)
      }
    }

    console.log(`\n更新完成！共更新 ${updated} 条记录`)

    // 验证更新结果
    const [check] = await connection.query(`
      SELECT COUNT(*) as count FROM almanac_data
      WHERE (lunar_festival IS NOT NULL AND lunar_festival != '')
         OR (term IS NOT NULL AND term != '')
         OR (solar_festival IS NOT NULL AND solar_festival != '')
    `)
    console.log(`有数据的记录总数：${check[0].count}`)

  } catch (error) {
    console.error('更新失败:', error.message)
    throw error
  } finally {
    await connection.end()
  }
}

updateExistingData()
