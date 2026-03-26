/**
 * 生成星座配对数据并写入数据库（内置数据源）
 * 当第三方 API 不可用时使用此脚本
 */

require('dotenv').config()
const mysql = require('mysql2/promise')

// 12 星座
const constellations = [
  '白羊座', '金牛座', '双子座', '巨蟹座',
  '狮子座', '处女座', '天秤座', '天蝎座',
  '射手座', '摩羯座', '水瓶座', '双鱼座'
]

// 星座配对数据模板
const matchTemplates = {
  '白羊座': {
    '金牛座': {
      grade: '友情：★★ 爱情：★★★ 婚姻：★★ 亲情：★★',
      content: '节奏不同是你们天生的问题，一个冲动，一个慢半拍。白羊座的人喜欢用强烈的追求攻势去攻陷金牛座的人的心，但金牛座固执求稳的性格，必然会深思熟虑才肯接受追求。如果真是可以走在一起，大家不妨用双打网球的原理，一个补、一个攻，也许能够创出光明的前途。'
    },
    '双子座': {
      grade: '友情：★★★ 爱情：★★ 婚姻：★★ 亲情：★★',
      content: '风象双子的多变性和火象白羊的冲动性，让你们的生活充满新鲜感。白羊座欣赏双子座的聪明机灵，双子座则被白羊座的热情勇敢吸引。但要注意，白羊座不要太急躁，双子座不要太善变，互相理解才能长久。'
    },
    '巨蟹座': {
      grade: '友情：★★★ 爱情：★★★ 婚姻：★★★ 亲情：★★★',
      content: '巨蟹座温柔体贴，能给予白羊座需要的关怀和温暖；白羊座热情开朗，能带动巨蟹座走出情绪的低谷。一个愿意照顾，一个愿意被照顾，配合得相当好。但要注意巨蟹座不要太敏感，白羊座不要太直接。'
    },
    '狮子座': {
      grade: '友情：★★★★ 爱情：★★★★ 婚姻：★★★ 亲情：★★★',
      content: '同为火象星座，你们有着天然的默契。白羊座欣赏狮子座的霸气和领导力，狮子座喜欢白羊座的直率和冲劲。但两个都很强势，要注意互相谦让，不要总是争个高低。'
    },
    '处女座': {
      grade: '友情：★★ 爱情：★★ 婚姻：★★ 亲情：★★★',
      content: '处女座的细心谨慎与白羊座的冲动直率形成鲜明对比。白羊座可能觉得处女座太唠叨挑剔，处女座可能认为白羊座太鲁莽。需要双方都做出改变，学会欣赏对方的优点。'
    },
    '天秤座': {
      grade: '友情：★★★ 爱情：★★★ 婚姻：★★ 亲情：★★',
      content: '天秤座的优雅得体吸引白羊座，白羊座的热情直接也让天秤座感到新鲜。但天秤座犹豫不决的性格可能让急性子的白羊座很抓狂，需要互相理解和包容。'
    },
    '天蝎座': {
      grade: '友情：★★ 爱情：★★★★ 婚姻：★★★ 亲情：★★',
      content: '天蝎座的深沉神秘让白羊座充满探索欲，白羊座的光明磊落也让天蝎座感到安心。但天蝎座占有欲强，白羊座热爱自由，这点需要双方好好沟通协调。'
    },
    '射手座': {
      grade: '友情：★★★★ 爱情：★★★★ 婚姻：★★★ 亲情：★★★',
      content: '火象星座的完美配对！射手座和白羊座都热爱自由，喜欢冒险，对生活充满热情。你们的组合充满活力和乐趣，但也要注意不要过于冲动，偶尔也要静下心来规划未来。'
    },
    '摩羯座': {
      grade: '友情：★★ 爱情：★★ 婚姻：★★★ 亲情：★★★',
      content: '摩羯座的稳重务实与白羊座的热情冲动形成对比。短期可能互相吸引，但长期相处需要磨合。白羊座要学习摩羯座的耐心，摩羯座可以适当放松，享受生活的乐趣。'
    },
    '水瓶座': {
      grade: '友情：★★★ 爱情：★★★ 婚姻：★★ 亲情：★★',
      content: '水瓶座的独特思维和白羊座的直接行动力，可以产生很多火花。但水瓶座有时过于理性冷淡，可能让热情的白羊座感到失落。双方需要找到沟通和相处的平衡点。'
    },
    '双鱼座': {
      grade: '友情：★★★ 爱情：★★★ 婚姻：★★★ 亲情：★★★★',
      content: '双鱼座的温柔浪漫能软化白羊座的强硬态度，白羊座的勇敢担当能给双鱼座安全感。但双鱼座过于敏感多疑，白羊座过于直接，需要学会更温柔的表达方式。'
    }
  }
}

// 生成配对内容
function generateMatchContent(sign1, sign2) {
  // 检查是否有预设数据
  if (matchTemplates[sign1] && matchTemplates[sign1][sign2]) {
    return {
      grade: matchTemplates[sign1][sign2].grade,
      content: matchTemplates[sign1][sign2].content,
      title: `${sign1}：${sign2}`
    }
  }

  // 反向查找
  if (matchTemplates[sign2] && matchTemplates[sign2][sign1]) {
    return {
      grade: matchTemplates[sign2][sign1].grade,
      content: matchTemplates[sign2][sign1].content,
      title: `${sign1}：${sign2}`
    }
  }

  // 使用通用模板生成
  return generateGenericMatch(sign1, sign2)
}

// 生成通用配对内容
function generateGenericMatch(sign1, sign2) {
  const signElements = {
    '白羊座': '火', '狮子座': '火', '射手座': '火',
    '金牛座': '土', '处女座': '土', '摩羯座': '土',
    '双子座': '风', '天秤座': '风', '水瓶座': '风',
    '巨蟹座': '水', '天蝎座': '水', '双鱼座': '水'
  }

  const element1 = signElements[sign1]
  const element2 = signElements[sign2]

  const compatibility = {
    '火火': { grade: '★★★★', desc: '同为火象星座，你们热情奔放，充满活力。但要注意控制脾气，避免不必要的争吵。' },
    '火土': { grade: '★★★', desc: '火与土的组合，稳重与激情并存。需要双方互相理解和包容，找到相处的平衡点。' },
    '火风': { grade: '★★★★', desc: '火借风势，风助火威。你们是相得益彰的组合，生活充满乐趣和激情。' },
    '火水': { grade: '★★★', desc: '水火既相克又相济。热情与温柔的碰撞，需要学会互相迁就和理解。' },
    '土土': { grade: '★★★★', desc: '同为土象星座，踏实稳重是你们的共同点。细水长流的感情最为长久。' },
    '土风': { grade: '★★', desc: '土象的务实与风象的多变形成对比。需要双方都做出改变，学会欣赏差异。' },
    '土水': { grade: '★★★★', desc: '土能容水，水能润土。温柔体贴与稳重可靠的完美结合。' },
    '风风': { grade: '★★★★', desc: '同为风象星座，思维活跃，沟通顺畅。但也要注意不要太过于理性而忽略感受。' },
    '风水': { grade: '★★★', desc: '风的自由与水的敏感，需要找到相处的平衡点。多沟通，多理解。' },
    '水水': { grade: '★★★★★', desc: '同为水象星座，情感丰富，直觉敏锐。你们能深刻理解彼此的内心世界。' }
  }

  // 确保元素顺序一致
  const key = element1 > element2 ? `${element2}${element1}` : `${element1}${element2}`
  const result = compatibility[key] || { grade: '★★★', desc: '每个星座组合都有其独特之处，关键是互相理解和包容。' }

  return {
    grade: `友情：${result.grade} 爱情：${result.grade} 婚姻：${result.grade} 亲情：${result.grade}`,
    content: `${sign1}与${sign2}的组合：${result.desc}`,
    title: `${sign1}：${sign2}`
  }
}

async function main() {
  console.log('正在连接数据库...')
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '47.102.152.82',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '_kIjZ9iVb@nt',
    database: process.env.DB_NAME || 'chronos_eye'
  })

  try {
    console.log('开始生成星座配对数据...')

    let inserted = 0
    let skipped = 0

    for (let i = 0; i < constellations.length; i++) {
      for (let j = 0; j < constellations.length; j++) {
        const sign1 = constellations[i]
        const sign2 = constellations[j]

        // 跳过相同的星座
        if (sign1 === sign2) continue

        const match = generateMatchContent(sign1, sign2)

        try {
          await connection.execute(`
            INSERT INTO constellation_match (sign1, sign2, grade, title, content)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            grade = VALUES(grade),
            title = VALUES(title),
            content = VALUES(content)
          `, [sign1, sign2, match.grade, match.title, match.content])
          inserted++
          console.log(`✓ ${sign1} ↔ ${sign2}`)
        } catch (error) {
          skipped++
          console.log(`✗ ${sign1} ↔ ${sign2}: ${error.message}`)
        }
      }
    }

    console.log(`\n========== 完成 ==========`)
    console.log(`插入：${inserted} 条`)
    console.log(`跳过：${skipped} 条`)

    // 验证结果
    const [check] = await connection.query(`SELECT COUNT(*) as count FROM constellation_match`)
    console.log(`数据库中共有 ${check[0].count} 条配对记录`)

  } catch (error) {
    console.error('执行失败:', error.message)
    throw error
  } finally {
    await connection.end()
  }
}

main().catch(console.error)
