/**
 * 更新所有黄历数据 - 填充缺失字段
 * 为所有记录填充：lunar_festival, term, solar_festival, conflict_sha
 */

require('dotenv').config()
const mysql = require('mysql2/promise')
const { Solar } = require('lunar-javascript')

async function updateAllData() {
  console.log('正在连接数据库...')
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'chronos_eye'
  })

  try {
    console.log('获取所有需要更新的数据...')
    const [allRows] = await connection.query(`
      SELECT id, date FROM almanac_data
      WHERE (lunar_festival IS NULL OR lunar_festival = '')
         OR (term IS NULL OR term = '')
         OR (solar_festival IS NULL OR solar_festival = '')
      ORDER BY date
    `)

    console.log(`找到 ${allRows.length} 条记录需要更新`)

    let updated = 0
    const batchSize = 500

    for (let i = 0; i < allRows.length; i += batchSize) {
      const batch = allRows.slice(i, i + batchSize)
      const updatePromises = batch.map(async (row) => {
        const date = new Date(row.date)
        // 修复时区问题，确保使用正确的日期
        const year = date.getUTCFullYear()
        const month = date.getUTCMonth() + 1
        const day = date.getUTCDate()

        const solar = Solar.fromYmd(year, month, day)
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
          WHERE id = ?
        `, [lunar_festival, term, solar_festival, conflict_sha, row.id])

        return 1
      })

      await Promise.all(updatePromises)
      updated += batch.length
      console.log(`已更新 ${updated}/${allRows.length} 条`)
    }

    console.log(`\n更新完成！共更新 ${updated} 条记录`)

    // 验证更新结果
    const [check] = await connection.query(`
      SELECT COUNT(*) as count FROM almanac_data
      WHERE lunar_festival IS NOT NULL AND lunar_festival != ''
         OR term IS NOT NULL AND term != ''
         OR solar_festival IS NOT NULL AND solar_festival != ''
    `)
    console.log(`有节日/节气数据的记录总数：${check[0].count}`)

  } catch (error) {
    console.error('更新失败:', error.message)
    throw error
  } finally {
    await connection.end()
  }
}

updateAllData()
