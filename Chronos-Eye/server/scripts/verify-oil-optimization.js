#!/usr/bin/env node
/**
 * 油价数据表优化验证脚本
 */
const { query, initDatabase } = require('../src/config/database')

async function verify() {
  await initDatabase()

  console.log('=== 油价数据表优化验证 ===\n')

  // 1. 检查 oil_province_price 表结构
  console.log('1. oil_province_price 表结构:')
  const provinceDesc = await query('DESC oil_province_price')
  const changeFields = provinceDesc.filter(row => row.Field.startsWith('change'))
  changeFields.forEach(row => {
    console.log(`   ${row.Field}: ${row.Type}`)
  })

  // 2. 检查 oil_international 表结构
  console.log('\n2. oil_international 表结构:')
  const internationalDesc = await query('DESC oil_international')
  const fields = ['price', 'change', 'prev_close', 'high', 'low', 'update_time']
  fields.forEach(field => {
    const row = internationalDesc.find(r => r.Field === field)
    if (row) {
      console.log(`   ${row.Field}: ${row.Type}`)
    }
  })

  // 3. 检查索引
  console.log('\n3. 索引检查:')
  const provinceIndexes = await query('SHOW INDEX FROM oil_province_price')
  const hasProvinceUnique = provinceIndexes.some(idx => idx.Key_name === 'uk_province_date')
  console.log(`   oil_province_price 唯一约束：${hasProvinceUnique ? '✓ 存在' : '✗ 不存在'}`)

  const internationalIndexes = await query('SHOW INDEX FROM oil_international')
  const hasInternationalUnique = internationalIndexes.some(idx => idx.Key_name === 'uk_oil_date')
  console.log(`   oil_international 唯一约束：${hasInternationalUnique ? '✓ 存在' : '✗ 不存在'}`)

  // 4. 检查数据
  console.log('\n4. 数据统计:')
  const provinceCount = await query('SELECT COUNT(*) as count FROM oil_province_price')
  console.log(`   oil_province_price: ${provinceCount[0].count} 条`)

  const latestCount = await query('SELECT COUNT(*) as count FROM oil_province_price_latest')
  console.log(`   oil_province_price_latest: ${latestCount[0].count} 条`)

  const internationalCount = await query('SELECT COUNT(*) as count FROM oil_international')
  console.log(`   oil_international: ${internationalCount[0].count} 条`)

  // 5. 显示国际原油数据
  console.log('\n5. 国际原油数据示例:')
  const internationalData = await query('SELECT oil_name, price, `change` FROM oil_international LIMIT 5')
  internationalData.forEach(row => {
    console.log(`   ${row.oil_name}: ${row.price} (涨跌：${row.change})`)
  })

  console.log('\n=== 验证完成 ===')
  process.exit(0)
}

verify()
