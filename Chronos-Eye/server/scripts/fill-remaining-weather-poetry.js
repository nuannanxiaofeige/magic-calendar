/**
 * 补充雾和雷的诗句数据
 */

require('dotenv').config()
const { query, initDatabase } = require('../src/config/database')

const EXTRA_POETRY_DATA = {
  // 雾 - 还需 5 条
  7: [
    { content: '雾失楼台，月迷津渡，桃源望断无寻处', author: '秦观', source: '踏莎行·郴州旅舍' },
    { content: '斜月沉沉藏海雾，碣石潇湘无限路', author: '张若虚', source: '春江花月夜' },
    { content: '晓雾将歇，猿鸟乱鸣；夕日欲颓，沉鳞竞跃', author: '陶弘景', source: '答谢中书书' },
    { content: '雾露分明下，云门咫尺开', author: '杜甫', source: '雨' },
    { content: '江雾纷纷侵客鬓，山猿夜夜叫人心', author: '张说', source: '岳州夜坐' }
  ],
  // 雷 - 还需 14 条
  8: [
    { content: '雷声千嶂落，雨色万峰来', author: '李攀龙', source: '广阳山道中' },
    { content: '雷惊天地龙蛇蛰，雨足郊原草木柔', author: '黄庭坚', source: '清明' },
    { content: '雷公激电摧天鼓，海若翻波涌雪涛', author: '宋褧', source: '钱唐怀古' },
    { content: '雷声震天地，电光闪日月', author: '邵雍', source: '观棋大吟' },
    { content: '雷吼涛惊白石山，石鲸眼裂长蛟死', author: '杜甫', source: '可叹' },
    { content: '雷车隐隐碾晴空，万里炎蒸一洗空', author: '陆游', source: '夏夜风雨' },
    { content: '雷公先唱歌，有雨也不多', author: '民间谚语', source: '农谚' },
    { content: '雷动九渊蛰龙起，风云万里大鹏抟', author: '陆游', source: '读史' },
    { content: '雷起蛰龙知岁换，雨收残雪见春回', author: '陆游', source: '立春' },
    { content: '雷奔电卷不可遏，天旋地转何时休', author: '刘基', source: '梁父吟' },
    { content: '雷蛰潜藏待春动，云开雾散见天青', author: '王阳明', source: '咏史' },
    { content: '雷轰电掣争毫发，虎斗龙争战古今', author: '罗贯中', source: '三国演义' },
    { content: '雷霆雨露俱是天恩，富贵穷通皆由命定', author: '施耐庵', source: '水浒传' },
    { content: '雷峰夕照红欲燃，苏堤春晓柳含烟', author: '佚名', source: '西湖十景' }
  ]
}

async function fillRemainingPoetry() {
  try {
    console.log('=== 补充雾和雷诗句 ===\n')

    await initDatabase()

    let totalCount = 0

    for (const [weatherType, poems] of Object.entries(EXTRA_POETRY_DATA)) {
      const weatherName = { 7:'雾', 8:'雷' }[weatherType]
      let insertedCount = 0

      for (const poem of poems) {
        const exists = await query(
          'SELECT id FROM weather_poetry WHERE content = ? AND weather_type = ?',
          [poem.content, parseInt(weatherType)]
        )

        if (exists.length === 0) {
          await query(
            `INSERT INTO weather_poetry (weather_type, weather_name, content, author, source)
             VALUES (?, ?, ?, ?, ?)`,
            [parseInt(weatherType), weatherName, poem.content, poem.author, poem.source]
          )
          insertedCount++
        }
      }

      console.log(`【${weatherName}】新增 ${insertedCount} 条`)
      totalCount += insertedCount
    }

    console.log(`\n共新增 ${totalCount} 条诗句`)

    console.log('\n当前数据分布:')
    const stats = await query(`
      SELECT weather_name, COUNT(*) as count
      FROM weather_poetry
      GROUP BY weather_type, weather_name
      ORDER BY weather_type
    `)
    console.table(stats)

    const total = await query('SELECT COUNT(*) as count FROM weather_poetry')
    console.log(`\n总计：${total[0].count} 条诗句`)

  } catch (error) {
    console.error('错误:', error)
    throw error
  }
}

fillRemainingPoetry().then(() => {
  console.log('\n脚本执行完成')
  process.exit(0)
}).catch(err => {
  console.error('脚本执行失败:', err)
  process.exit(1)
})
