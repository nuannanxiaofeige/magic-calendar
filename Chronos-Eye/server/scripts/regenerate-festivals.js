/**
 * 重新生成所有节日和节气数据（使用时区正确的日期）
 */

require('dotenv').config()
const mysql = require('mysql2/promise')
const { Solar } = require('lunar-javascript')

async function regenerateFestivals() {
  console.log('正在连接数据库...')
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'chronos_eye'
  })

  try {
    console.log('获取所有记录...')
    const [allRows] = await connection.query(`
      SELECT id, date FROM almanac_data ORDER BY date
    `)

    console.log(`总共 ${allRows.length} 条记录`)

    let updated = 0
    const batchSize = 500

    for (let i = 0; i < allRows.length; i += batchSize) {
      const batch = allRows.slice(i, i + batchSize)

      for (const row of batch) {
        // 将 UTC 日期转换为北京时间，然后提取年月日
        const utcDate = new Date(row.date)
        const bjTime = new Date(utcDate.getTime() + 8 * 3600000)
        const year = bjTime.getUTCFullYear()
        const month = bjTime.getUTCMonth() + 1
        const day = bjTime.getUTCDate()

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
            lunar_festival = ?,
            term = ?,
            jieqi = ?,
            solar_festival = ?,
            conflict_sha = ?
          WHERE id = ?
        `, [lunar_festival, term, term, solar_festival, conflict_sha, row.id])

        updated++
      }

      console.log(`已处理 ${updated}/${allRows.length} 条`)
    }

    console.log(`\n更新完成！共更新 ${updated} 条记录`)

  } catch (error) {
    console.error('更新失败:', error.message)
    throw error
  } finally {
    await connection.end()
  }
}

regenerateFestivals()
