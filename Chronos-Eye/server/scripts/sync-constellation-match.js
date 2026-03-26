/**
 * 从天行 API 获取星座配对数据并写入数据库
 * 使用方法：node scripts/sync-constellation-match.js [apiKey]
 * 如果 API 不可用，将使用本地生成方案
 */

require('dotenv').config()
const mysql = require('mysql2/promise')
const { getConstellationMatch, generateLocalConstellationMatch } = require('../src/services/tianapi')

// 12 星座中文名
const constellations = [
  '白羊座', '金牛座', '双子座', '巨蟹座',
  '狮子座', '处女座', '天秤座', '天蝎座',
  '射手座', '摩羯座', '水瓶座', '双鱼座'
]

// 天行 API 配置
const API_KEY = process.env.TIANAPI_KEY || process.argv[2] || ''

// 延迟函数（避免请求过快）
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 保存到数据库
async function saveMatch(connection, match) {
  try {
    await connection.execute(`
      INSERT INTO constellation_match (sign1, sign2, sign1_name, sign2_name, grade, title, content)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      sign1_name = VALUES(sign1_name),
      sign2_name = VALUES(sign2_name),
      grade = VALUES(grade),
      title = VALUES(title),
      content = VALUES(content),
      updated_at = CURRENT_TIMESTAMP
    `, [match.sign1, match.sign2, match.sign1_name, match.sign2_name, match.grade, match.title, match.content])
    return true
  } catch (error) {
    console.error(`保存 ${match.sign1}-${match.sign2} 失败：${error.message}`)
    return false
  }
}

// 将中文名转换为英文名
function getSignEnName(signCn) {
  const map = {
    '白羊座': 'aries', '金牛座': 'taurus', '双子座': 'gemini', '巨蟹座': 'cancer',
    '狮子座': 'leo', '处女座': 'virgo', '天秤座': 'libra', '天蝎座': 'scorpio',
    '射手座': 'sagittarius', '摩羯座': 'capricorn', '水瓶座': 'aquarius', '双鱼座': 'pisces'
  }
  return map[signCn] || signCn
}

// 主函数
async function main() {
  console.log('========== 星座配对数据同步 ==========')
  console.log(`API Key: ${API_KEY ? '已配置' : '未配置（将使用本地生成）'}`)

  console.log('正在连接数据库...')
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '47.102.152.82',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '_kIjZ9iVb@nt',
    database: process.env.DB_NAME || 'chronos_eye'
  })

  try {
    console.log('数据库连接成功!')
    console.log('开始获取星座配对数据...')
    console.log(`共需获取 ${constellations.length * (constellations.length - 1)} 组配对数据（排除同星座组合）`)

    let success = 0
    let failed = 0
    let apiCalls = 0
    let localGenerated = 0

    // 遍历所有星座组合
    for (let i = 0; i < constellations.length; i++) {
      for (let j = 0; j < constellations.length; j++) {
        const sign1 = constellations[i]
        const sign2 = constellations[j]

        // 跳过相同的星座组合
        if (sign1 === sign2) {
          continue
        }

        const sign1En = getSignEnName(sign1)
        const sign2En = getSignEnName(sign2)

        console.log(`正在获取：${sign1} ↔ ${sign2} ...`)

        let match = null
        let source = 'local'

        // 先尝试 API
        if (API_KEY) {
          try {
            const result = await getConstellationMatch(sign1En, sign2En)
            apiCalls++

            if (result) {
              match = result
              source = 'tianapi'
              console.log(`✓ API 成功：${sign1} ↔ ${sign2}`)
            } else {
              console.log(`✗ API 返回为空：${sign1} ↔ ${sign2}`)
            }
          } catch (error) {
            console.log(`✗ API 异常：${sign1} ↔ ${sign2} - ${error.message}`)
          }
        }

        // API 失败时使用本地生成
        if (!match) {
          match = generateLocalConstellationMatch(sign1En, sign2En)
          localGenerated++
          source = 'local'
          console.log(`✓ 本地生成：${sign1} ↔ ${sign2}`)
        }

        // 保存到数据库
        if (match) {
          const saved = await saveMatch(connection, match)
          if (saved) {
            success++
          } else {
            failed++
          }
        }

        // 每次请求后延迟 100ms
        await delay(100)
      }

      // 每完成一个星座的所有配对，显示进度
      console.log(`\n进度：${i + 1}/${constellations.length}，成功：${success}，失败：${failed}，API 调用：${apiCalls}，本地生成：${localGenerated}\n`)
    }

    console.log('\n========== 完成 ==========')
    console.log(`成功：${success} 组`)
    console.log(`失败：${failed} 组`)
    console.log(`API 调用次数：${apiCalls}`)
    console.log(`本地生成数量：${localGenerated}`)

    // 验证结果
    const [check] = await connection.query(`
      SELECT COUNT(*) as count FROM constellation_match
    `)
    console.log(`数据库中共有 ${check[0].count} 条配对记录`)

    // 显示示例数据
    console.log('\n数据示例:')
    const [samples] = await connection.query(`
      SELECT sign1_name, sign2_name, title, grade FROM constellation_match LIMIT 3
    `)
    samples.forEach(s => {
      console.log(`  ${s.sign1_name} ↔ ${s.sign2_name}: ${s.grade}`)
    })

  } catch (error) {
    console.error('执行失败:', error.message)
    throw error
  } finally {
    await connection.end()
  }
}

main().catch(console.error)
