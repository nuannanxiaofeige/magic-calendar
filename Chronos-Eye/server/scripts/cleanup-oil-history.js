#!/usr/bin/env node
/**
 * 清理油价历史数据，只保留每个省份的最新一条
 */
const { query, initDatabase } = require('../src/config/database')

async function cleanup() {
  await initDatabase()

  console.log('=== 清理油价历史数据 ===\n')

  // 1. 清理前的数据
  const beforeResult = await query('SELECT COUNT(*) as count FROM oil_province_price')
  console.log(`清理前总记录数：${beforeResult[0].count}`)

  // 2. 删除每个省份的非最新数据
  console.log('\n开始删除历史数据，保留每个省份的最新一条...')

  const deleteResult = await query(`
    DELETE p1 FROM oil_province_price p1
    INNER JOIN (
      SELECT province_code, MAX(price_date) as max_date
      FROM oil_province_price
      GROUP BY province_code
    ) p2 ON p1.province_code = p2.province_code
    WHERE p1.price_date < p2.max_date
  `)

  console.log(`已删除 ${deleteResult.affectedRows} 条历史记录`)

  // 3. 清理后的数据
  const afterResult = await query('SELECT COUNT(*) as count FROM oil_province_price')
  console.log(`\n清理后总记录数：${afterResult[0].count}`)

  // 4. 验证每个省份只有一条数据
  const verifyResult = await query(`
    SELECT province_code, COUNT(*) as cnt, MAX(price_date) as latest_date
    FROM oil_province_price
    GROUP BY province_code
    ORDER BY province_code
  `)

  console.log('\n各省份数据:')
  verifyResult.forEach(row => {
    const status = row.cnt > 1 ? '⚠️ 多条' : '✓'
    console.log(`  ${status} ${row.province_code}: ${row.cnt} 条，最新 ${row.latest_date}`)
  })

  // 5. 检查是否有重复
  const duplicates = await query(`
    SELECT province_code, price_date, COUNT(*) as cnt
    FROM oil_province_price
    GROUP BY province_code, price_date
    HAVING COUNT(*) > 1
  `)

  if (duplicates.length > 0) {
    console.log('\n⚠️  仍有重复数据（同一省份同一日期多条记录）')
    duplicates.forEach(row => {
      console.log(`  ${row.province_code} - ${row.price_date}: ${row.cnt} 条`)
    })
  } else {
    console.log('\n✓ 没有重复数据')
  }

  console.log('\n清理完成！')
  process.exit(0)
}

cleanup()
