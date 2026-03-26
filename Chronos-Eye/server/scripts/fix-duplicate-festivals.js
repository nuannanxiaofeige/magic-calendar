/**
 * 修复重复节日问题
 * 清除被错误复制到相邻日期的节日和节气数据
 */

require('dotenv').config()
const mysql = require('mysql2/promise')
const { Solar } = require('lunar-javascript')

async function fixDuplicateFestivals() {
  console.log('正在连接数据库...')
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '47.102.152.82',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '_kIjZ9iVb@nt',
    database: process.env.DB_NAME || 'chronos_eye'
  })

  try {
    console.log('获取所有有节日/节气的记录...')
    const [rows] = await connection.query(`
      SELECT id, date, lunar_festival, term, jieqi, solar_festival
      FROM almanac_data
      WHERE lunar_festival IS NOT NULL AND lunar_festival != ''
         OR term IS NOT NULL AND term != ''
         OR solar_festival IS NOT NULL AND solar_festival != ''
      ORDER BY date
    `)

    console.log(`找到 ${rows.length} 条记录有节日/节气数据`)

    let fixed = 0
    const updates = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const currentDate = new Date(row.date)
      const nextRow = rows[i + 1]

      if (!nextRow) continue

      const nextDate = new Date(nextRow.date)
      const diffDays = (nextDate - currentDate) / (1000 * 60 * 60 * 24)

      // 只处理相邻的日期（相差 1 天）
      if (diffDays !== 1) continue

      // 检查是否有相同的节日或节气
      const sameLunarFestival = row.lunar_festival && row.lunar_festival === nextRow.lunar_festival
      const sameTerm = row.term && row.term === nextRow.term
      const sameJieqi = row.jieqi && row.jieqi === nextRow.jieqi
      const sameSolarFestival = row.solar_festival && row.solar_festival === nextRow.solar_festival

      // 如果有重复，清除后一天的数据
      if (sameLunarFestival || sameTerm || sameJieqi || sameSolarFestival) {
        const clearLunar = sameLunarFestival ? '' : nextRow.lunar_festival
        const clearTerm = sameTerm ? '' : nextRow.term
        const clearJieqi = sameJieqi ? '' : nextRow.jieqi
        const clearSolar = sameSolarFestival ? '' : nextRow.solar_festival

        updates.push({
          id: nextRow.id,
          lunar_festival: clearLunar,
          term: clearTerm,
          jieqi: clearJieqi,
          solar_festival: clearSolar
        })
      }
    }

    console.log(`发现 ${updates.length} 条重复记录，正在修复...`)

    // 批量更新
    for (const update of updates) {
      await connection.execute(`
        UPDATE almanac_data SET
          lunar_festival = ?,
          term = ?,
          jieqi = ?,
          solar_festival = ?
        WHERE id = ?
      `, [update.lunar_festival, update.term, update.jieqi, update.solar_festival, update.id])
      fixed++
    }

    console.log(`修复完成！共修复 ${fixed} 条重复记录`)

    // 验证结果
    const [check] = await connection.query(`
      SELECT COUNT(*) as count FROM almanac_data
      WHERE lunar_festival IS NOT NULL AND lunar_festival != ''
         OR term IS NOT NULL AND term != ''
         OR solar_festival IS NOT NULL AND solar_festival != ''
    `)
    console.log(`修复后有节日/节气数据的记录总数：${check[0].count}`)

  } catch (error) {
    console.error('修复失败:', error.message)
    throw error
  } finally {
    await connection.end()
  }
}

fixDuplicateFestivals()
