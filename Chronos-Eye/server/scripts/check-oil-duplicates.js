#!/usr/bin/env node
/**
 * 检查油价表重复数据
 */
const { query, initDatabase } = require('../src/config/database')

async function check() {
  await initDatabase()

  console.log('=== 检查 oil_province_price 表数据 ===\n')

  // 1. 总数据量
  const totalResult = await query('SELECT COUNT(*) as count FROM oil_province_price')
  console.log(`总记录数：${totalResult[0].count}`)

  // 2. 按日期统计
  const dateStats = await query(`
    SELECT price_date, COUNT(*) as count
    FROM oil_province_price
    GROUP BY price_date
    ORDER BY price_date DESC
  `)

  console.log('\n按日期分布:')
  dateStats.forEach(row => {
    console.log(`  ${row.price_date}: ${row.count} 条`)
  })

  // 3. 检查重复（同省份 + 同日期）
  const duplicates = await query(`
    SELECT province_code, price_date, COUNT(*) as cnt
    FROM oil_province_price
    GROUP BY province_code, price_date
    HAVING COUNT(*) > 1
  `)

  if (duplicates.length > 0) {
    console.log('\n⚠️  发现重复数据：')
    duplicates.forEach(row => {
      console.log(`  ${row.province_code} - ${row.price_date}: ${row.cnt} 条`)
    })
  } else {
    console.log('\n✓ 没有发现重复数据（同一省份同一日期多条记录）')
  }

  // 4. 每个省份的最新日期
  const latestPerProvince = await query(`
    SELECT province_code, MAX(price_date) as latest_date
    FROM oil_province_price
    GROUP BY province_code
  `)

  console.log('\n各省份最新数据日期:')
  latestPerProvince.forEach(row => {
    console.log(`  ${row.province_code}: ${row.latest_date}`)
  })

  process.exit(0)
}

check()
