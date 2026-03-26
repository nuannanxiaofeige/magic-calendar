#!/usr/bin/env node
/**
 * 油价数据表结构优化迁移脚本
 * 用法：node scripts/migrate-oil-tables-optimize.js
 *
 * 优化内容：
 * 1. 修改省份油价表的涨幅字段为 DECIMAL(5,2)
 * 2. 修改国际原油表的价格字段为 DECIMAL(10,2)（先清空数据）
 * 3. 修改国际原油表的 update_time 为 DATETIME
 * 4. 添加唯一约束 (oil_name, data_date)
 */

const { query, initDatabase } = require('../src/config/database')

async function migrate() {
  try {
    console.log('=== 开始执行油价数据表结构优化 ===\n')

    // 初始化数据库
    await initDatabase()

    // ============================================
    // 1. 修改省份油价表的涨幅字段为 DECIMAL
    // ============================================
    console.log('[1/5] 修改省份油价表涨幅字段类型...')
    await query(`
      ALTER TABLE oil_province_price
      MODIFY COLUMN change_89 DECIMAL(5,2) DEFAULT NULL COMMENT '89 号涨幅',
      MODIFY COLUMN change_92 DECIMAL(5,2) DEFAULT NULL COMMENT '92 号涨幅',
      MODIFY COLUMN change_95 DECIMAL(5,2) DEFAULT NULL COMMENT '95 号涨幅',
      MODIFY COLUMN change_98 DECIMAL(5,2) DEFAULT NULL COMMENT '98 号涨幅',
      MODIFY COLUMN change_0 DECIMAL(5,2) DEFAULT NULL COMMENT '0 号涨幅'
    `)
    console.log('  ✓ 省份油价表涨幅字段已修改为 DECIMAL(5,2)')

    // ============================================
    // 2. 备份并清空国际原油表
    // ============================================
    console.log('\n[2/5] 备份国际原油表数据...')
    const oldData = await query('SELECT * FROM oil_international')
    console.log(`  ✓ 已备份 ${oldData.length} 条记录`)

    console.log('\n[3/5] 清空国际原油表（数据将在之后重新同步）...')
    await query('TRUNCATE TABLE oil_international')
    console.log('  ✓ 国际原油表已清空')

    // ============================================
    // 4. 修改国际原油表的字段类型
    // ============================================
    console.log('\n[4/5] 修改国际原油表字段类型...')
    await query(`
      ALTER TABLE oil_international
      MODIFY COLUMN price DECIMAL(10,2) DEFAULT NULL COMMENT '最新价格',
      MODIFY COLUMN \`change\` DECIMAL(10,2) DEFAULT NULL COMMENT '涨跌额',
      MODIFY COLUMN prev_close DECIMAL(10,2) DEFAULT NULL COMMENT '昨收价',
      MODIFY COLUMN high DECIMAL(10,2) DEFAULT NULL COMMENT '最高价',
      MODIFY COLUMN low DECIMAL(10,2) DEFAULT NULL COMMENT '最低价',
      MODIFY COLUMN update_time DATETIME DEFAULT NULL COMMENT '更新时间'
    `)
    console.log('  ✓ 国际原油表字段类型已修改')

    // ============================================
    // 5. 添加唯一约束
    // ============================================
    console.log('\n[5/5] 添加唯一约束 (oil_name, data_date)...')
    try {
      await query(`
        ALTER TABLE oil_international
        ADD UNIQUE KEY uk_oil_date (oil_name, data_date)
      `)
      console.log('  ✓ 唯一约束添加成功')
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('  ℹ 唯一约束已存在，跳过')
      } else {
        throw error
      }
    }

    // ============================================
    // 验证修改结果
    // ============================================
    console.log('\n=== 验证修改结果 ===')

    const provinceDesc = await query('DESC oil_province_price')
    console.log('\noil_province_price 表结构:')
    const changeFields = provinceDesc.filter(row => row.Field.startsWith('change'))
    changeFields.forEach(row => {
      console.log(`  ${row.Field}: ${row.Type}`)
    })

    const internationalDesc = await query('DESC oil_international')
    console.log('\noil_international 表结构:')
    internationalDesc.forEach(row => {
      if (['price', 'change', 'prev_close', 'high', 'low', 'update_time'].includes(row.Field)) {
        console.log(`  ${row.Field}: ${row.Type}`)
      }
    })

    const indexes = await query('SHOW INDEX FROM oil_international')
    console.log('\noil_international 索引:')
    indexes.forEach(idx => {
      if (idx.Key_name === 'uk_oil_date') {
        console.log(`  UNIQUE KEY ${idx.Key_name}: ${idx.Column_name}`)
      }
    })

    console.log('\n=== 优化完成 ===')
    console.log('\n优化内容总结：')
    console.log('  1. 省份油价涨幅字段：VARCHAR(20) → DECIMAL(5,2)')
    console.log('  2. 国际原油价格字段：VARCHAR(50) → DECIMAL(10,2)（已清空旧数据）')
    console.log('  3. 国际原油更新时间：VARCHAR(30) → DATETIME')
    console.log('  4. 添加唯一约束：UNIQUE KEY (oil_name, data_date)')
    console.log('\n下一步操作：')
    console.log('  运行定时同步或手动执行同步以重新获取国际原油数据')
    console.log('  node -e "require(\'./src/services/oil-price-sync\').syncInternationalCrude()"')

    process.exit(0)
  } catch (error) {
    console.error('\n❌ 迁移失败:', error.message)
    console.error(error)
    process.exit(1)
  }
}

migrate()
