/**
 * 导入 2026-2035 年农历数据到数据库
 */

require('dotenv').config()
const fs = require('fs')
const path = require('path')
const { query, run, initDatabase } = require('../src/config/database')

// 读取 lunar_data_2026_2035.json
const lunarDataPath = path.join(__dirname, 'lunar_data_2026_2035.json')
const lunarData = JSON.parse(fs.readFileSync(lunarDataPath, 'utf-8'))

console.log(`读取到 ${lunarData.length} 条农历数据`)

// 检查 almanac_data 表结构，确保有所需字段
async function checkTableStructure() {
  console.log('检查表结构...')

  // 检查是否有 term 字段
  const columns = await query(`SHOW COLUMNS FROM almanac_data`)
  const columnNames = columns.map(c => c.Field)

  const requiredColumns = ['term', 'solar_festival', 'lunar_festival']
  const missingColumns = requiredColumns.filter(col => !columnNames.includes(col))

  if (missingColumns.length > 0) {
    console.log('添加缺失的字段...')
    for (const col of missingColumns) {
      if (col === 'term') {
        await run(`ALTER TABLE almanac_data ADD COLUMN term VARCHAR(50) AFTER lunar_day`)
      } else if (col === 'solar_festival') {
        await run(`ALTER TABLE almanac_data ADD COLUMN solar_festival VARCHAR(100) AFTER term`)
      } else if (col === 'lunar_festival') {
        await run(`ALTER TABLE almanac_data ADD COLUMN lunar_festival VARCHAR(100) AFTER solar_festival`)
      }
      console.log(`  添加字段：${col}`)
    }
  }

  console.log('表结构检查完成')
}

// 导入数据
async function importLunarData() {
  try {
    console.log('开始导入农历数据...')

    // 检查表结构
    await checkTableStructure()

    let successCount = 0
    let updateCount = 0
    let errorCount = 0

    for (const record of lunarData) {
      try {
        // 检查是否已存在
        const existing = await query('SELECT id FROM almanac_data WHERE date = ?', [record.date])

        if (existing && existing.length > 0) {
          // 更新现有记录
          await run(`
            UPDATE almanac_data SET
              lunar_year = ?,
              lunar_month = ?,
              lunar_day = ?,
              ganzhi_year = ?,
              zodiac = ?,
              term = ?,
              solar_festival = ?,
              lunar_festival = ?
            WHERE date = CONVERT_TZ(?, '+00:00', '+08:00')
          `, [
            record.lunar_year,
            record.lunar_month,
            record.lunar_day,
            record.ganzhi_year,
            record.zodiac,
            record.term,
            record.solar_festival,
            record.lunar_festival,
            record.date
          ])
          updateCount++
        } else {
          // 插入新记录
          await run(`
            INSERT INTO almanac_data (
              date, lunar_year, lunar_month, lunar_day,
              ganzhi_year, zodiac,
              term, solar_festival, lunar_festival,
              created_at
            ) VALUES (CONVERT_TZ(?, '+00:00', '+08:00'), ?, ?, ?, ?, ?, ?, ?, ?, NOW())
          `, [
            record.date,
            record.lunar_year,
            record.lunar_month,
            record.lunar_day,
            record.ganzhi_year,
            record.zodiac,
            record.term,
            record.solar_festival,
            record.lunar_festival
          ])
          successCount++
        }
      } catch (error) {
        console.error(`导入 ${record.date} 失败:`, error.message)
        errorCount++
      }
    }

    console.log('\n========== 导入完成 ==========')
    console.log(`新增记录：${successCount}`)
    console.log(`更新记录：${updateCount}`)
    console.log(`失败记录：${errorCount}`)
    console.log(`总计：${lunarData.length}`)

    // 验证数据
    console.log('\n验证数据...')
    const count = await query('SELECT COUNT(*) as total FROM almanac_data')
    console.log(`数据库中总记录数：${count[0].total}`)

    // 抽样检查
    console.log('\n抽样检查...')
    const samples = await query(`
      SELECT date, lunar_year, lunar_month, lunar_day, ganzhi_year, zodiac, term, solar_festival, lunar_festival
      FROM almanac_data
      WHERE date IN ('2026-02-06', '2026-03-08', '2028-04-04', '2030-10-01')
      ORDER BY date
    `)

    for (const row of samples) {
      console.log(`${row.date}: 农历${row.lunar_year}年${row.lunar_month}月${row.lunar_day}日 | 干支:${row.ganzhi_year} | 生肖:${row.zodiac} | 节气:${row.term || '-'} | 节日:${row.lunar_festival || row.solar_festival || '-'}`)
    }

  } catch (error) {
    console.error('导入失败:', error)
    throw error
  }
}

// 主函数
async function main() {
  try {
    await initDatabase()
    await importLunarData()
    process.exit(0)
  } catch (error) {
    console.error('程序执行失败:', error)
    process.exit(1)
  }
}

main()
