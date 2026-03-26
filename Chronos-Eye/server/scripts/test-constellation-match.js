/**
 * 测试星座配对 API
 * 使用方法：node scripts/test-constellation-match.js
 */

require('dotenv').config()
const { getConstellationMatch, getAllConstellationMatches, constellationMap, generateLocalConstellationMatch } = require('../src/services/tianapi')

async function test() {
  console.log('========== 测试星座配对 API ==========\n')

  // 测试 1: 双人模式 - 白羊座 + 金牛座（API）
  console.log('【测试 1】双人模式：白羊座 vs 金牛座 (API)')
  try {
    const match1 = await getConstellationMatch('aries', 'taurus')
    if (match1) {
      console.log('✓ 成功获取配对数据:')
      console.log(`  标题：${match1.title}`)
      console.log(`  评分：${match1.grade}`)
      console.log(`  内容：${match1.content.substring(0, 50)}...`)
    } else {
      console.log('✗ API 返回为空，将使用本地生成')
    }
  } catch (error) {
    console.log(`✗ 错误：${error.message}`)
  }

  console.log()

  // 测试 1b: 双人模式 - 本地生成
  console.log('【测试 1b】双人模式：白羊座 vs 金牛座 (本地生成)')
  try {
    const localMatch1 = generateLocalConstellationMatch('aries', 'taurus')
    console.log('✓ 成功生成本地配对数据:')
    console.log(`  标题：${localMatch1.title}`)
    console.log(`  评分：${localMatch1.grade}`)
    console.log(`  内容：${localMatch1.content.substring(0, 50)}...`)
  } catch (error) {
    console.log(`✗ 错误：${error.message}`)
  }

  console.log()

  // 测试 2: 单人模式 - 白羊座（all=1）
  console.log('【测试 2】批量模式：白羊座与所有星座 (API)')
  try {
    const matches = await getAllConstellationMatches('aries')
    if (matches && matches.length > 0) {
      console.log(`✓ 成功获取 ${matches.length} 条配对数据`)
      console.log('  前 3 条示例:')
      for (let i = 0; i < Math.min(3, matches.length); i++) {
        const m = matches[i]
        console.log(`    - ${m.title}`)
      }
    } else if (matches) {
      console.log(`✓ 返回单个结果：${matches.title}`)
    } else {
      console.log('✗ API 返回为空')
    }
  } catch (error) {
    console.log(`✗ 错误：${error.message}`)
  }

  console.log()

  // 测试 3: 本地生成所有配对
  console.log('【测试 3】本地生成：白羊座与所有星座配对')
  const allSigns = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces']
  const localMatches = []
  for (const sign2 of allSigns) {
    if (sign2 !== 'aries') {
      localMatches.push(generateLocalConstellationMatch('aries', sign2))
    }
  }
  console.log(`✓ 成功生成 ${localMatches.length} 条配对数据`)
  console.log('  前 3 条示例:')
  for (let i = 0; i < Math.min(3, localMatches.length); i++) {
    const m = localMatches[i]
    console.log(`    - ${m.title}: ${m.grade}`)
  }

  console.log()

  // 测试 4: 双人模式 - 天秤座 + 射手座
  console.log('【测试 4】双人模式：天秤座 vs 射手座 (本地生成)')
  try {
    const match2 = generateLocalConstellationMatch('libra', 'sagittarius')
    if (match2) {
      console.log('✓ 成功生成配对数据:')
      console.log(`  标题：${match2.title}`)
      console.log(`  评分：${match2.grade}`)
    } else {
      console.log('✗ 生成失败')
    }
  } catch (error) {
    console.log(`✗ 错误：${error.message}`)
  }

  console.log()

  // 测试 5: 同元素配对
  console.log('【测试 5】同元素配对：白羊座 vs 狮子座 (火象)')
  try {
    const match3 = generateLocalConstellationMatch('aries', 'leo')
    if (match3) {
      console.log('✓ 成功生成配对数据:')
      console.log(`  标题：${match3.title}`)
      console.log(`  内容：${match3.content.substring(0, 60)}...`)
    }
  } catch (error) {
    console.log(`✗ 错误：${error.message}`)
  }

  console.log('\n========== 测试完成 ==========')
}

test().catch(console.error)
