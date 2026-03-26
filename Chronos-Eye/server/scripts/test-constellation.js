/**
 * 星座运势 API 测试脚本
 * 用于测试天行数据星座运势 API 的集成
 */

require('dotenv').config()
const { getConstellationFortune, getConstellationMatch, constellationMap } = require('./src/services/tianapi')

async function testConstellationAPI() {
  console.log('=== 天行数据星座 API 测试 ===\n')

  // 测试 1：获取白羊座今日运势
  console.log('测试 1: 获取白羊座今日运势')
  const today = new Date().toISOString().split('T')[0]
  const ariesFortune = await getConstellationFortune('aries', today)
  console.log('白羊座运势:', JSON.stringify(ariesFortune, null, 2))

  // 等待 200ms
  await new Promise(resolve => setTimeout(resolve, 200))

  // 测试 2：获取金牛座今日运势
  console.log('\n测试 2: 获取金牛座今日运势')
  const taurusFortune = await getConstellationFortune('taurus', today)
  console.log('金牛座运势:', JSON.stringify(taurusFortune, null, 2))

  // 等待 200ms
  await new Promise(resolve => setTimeout(resolve, 200))

  // 测试 3：星座配对（白羊座 vs 金牛座）
  console.log('\n测试 3: 星座配对（白羊座 vs 金牛座）')
  const match = await getConstellationMatch('aries', 'taurus')
  console.log('配对结果:', JSON.stringify(match, null, 2))

  console.log('\n=== 测试完成 ===')
}

// 运行测试
testConstellationAPI().catch(console.error)
