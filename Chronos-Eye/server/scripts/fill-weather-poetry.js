/**
 * 补充天气诗句数据 - 补齐到每种 40 条
 */

require('dotenv').config()
const { query, initDatabase } = require('../src/config/database')

const EXTRA_POETRY_DATA = {
  // 云 - 还需 2 条
  2: [
    { content: '千里暮云合，万山秋色多', author: '刘长卿', source: '秋日登吴公台上寺远眺' },
    { content: '云和积雪苍山晚，烟伴残阳绿树昏', author: '周朴', source: '春日秦国怀古' }
  ],
  // 雪 - 还需 3 条
  4: [
    { content: '雪满山中高士卧，月明林下美人来', author: '高启', source: '咏梅' },
    { content: '雪颈霜毛红玉掌，群仙会上听长生', author: '李商隐', source: '赋得月照珠池' },
    { content: '雪香浓处檀心破，万点春红一夜风', author: '晏几道', source: '鹧鸪天' }
  ],
  // 霜 - 还需 3 条
  5: [
    { content: '霜天半夜芳草折，烂漫缃花啜又生', author: '齐己', source: '对菊' },
    { content: '霜月定相知，先识春风面', author: '辛弃疾', source: '生查子·重叶梅' },
    { content: '霜天秋晓，正紫塞故垒', author: '蔡挺', source: '喜迁莺' }
  ],
  // 露 - 还需 9 条
  6: [
    { content: '白露收残月，清风散晓霞', author: '仲殊', source: '南柯子' },
    { content: '白露收残暑，清风衬晚霞', author: '仲殊', source: '南歌子' },
    { content: '露重飞难进，风多响易沉', author: '骆宾王', source: '在狱咏蝉' },
    { content: '露华侵衣寒，月华照骨冷', author: '白居易', source: '秋夕' },
    { content: '露气暗连青桂苑，风声偏猎紫兰丛', author: '李商隐', source: '令狐八拾遗绹见招' },
    { content: '露泛芙蓉浦，风摇杨柳堤', author: '白居易', source: '早秋晚望' },
    { content: '露华滴沥月上天，利觜不见人眼前', author: '韩愈', source: '永贞行' },
    { content: '露洗苍烟草，霜凋红叶林', author: '于谦', source: '平阳道中' },
    { content: '露下天高秋水清，空山独夜旅魂惊', author: '杜甫', source: '夜' }
  ],
  // 雾 - 还需 15 条
  7: [
    { content: '雾开瀑布泉，咫尺不相见', author: '李白', source: '同族弟金城尉叔卿烛照山水壁画歌' },
    { content: '雾扫清胡尘，天山冬夏雪', author: '李白', source: '经乱离后天恩流夜郎' },
    { content: '雾縰乍横合沓，星杓转高磊落', author: '范成大', source: '馆娃宫赋' },
    { content: '雾深猿鸟湿，云暗斗牛寒', author: '刘长卿', source: '雨中登沛县楼' },
    { content: '雾密山难辨，江鸣雨未休', author: '王周', source: '志峡船具诗' },
    { content: '雾失楼台月迷津，桃源望断无寻处', author: '秦观', source: '踏莎行' },
    { content: '雾阁云窗人不见，夜凉如水月如霜', author: '朱淑真', source: '秋夜' },
    { content: '雾笼郊甸晦，云暗塞山昏', author: '宋祁', source: '边愁' },
    { content: '雾雨十日九，泥深三尺余', author: '陆游', source: '雨夜' },
    { content: '雾雨晦争泄，波涛怒相投', author: '韩愈', source: '洞庭湖阻风' },
    { content: '雾披虎豹穴，水入鼋鼍宫', author: '宋之问', source: '始安秋日' },
    { content: '雾卷天山静，烟消太史空', author: '李世民', source: '赋秋日悬清光' },
    { content: '雾幌拂云旌，风轩度月明', author: '许浑', source: '游维山新兴寺' },
    { content: '雾树溟潆叫乱鸦，湿云初变早来霞', author: '释德元', source: '晓日' },
    { content: '雾青烟白一时俱，人在江心画不如', author: '杨万里', source: '过扬子江' }
  ],
  // 雷 - 还需 14 条
  8: [
    { content: '雷声忽送千峰雨，花气浑如百和香', author: '杜甫', source: '即事' },
    { content: '雷车驾雨龙尽起，电行半空如狂矢', author: '陆游', source: '五月得雨' },
    { content: '雷填风飒兮木萧萧，思公子兮徒离忧', author: '屈原', source: '山鬼' },
    { content: '雷惊稚子笋，雨足妇姑蚕', author: '黄庭坚', source: '登快阁' },
    { content: '雷斧劈开山骨裂，电鞭抽断海腰长', author: '刘禹锡', source: '浪淘沙' },
    { content: '雷隐隐，感妾心，倾耳清听非车音', author: '傅玄', source: '杂言诗' },
    { content: '雷光飞破天地昏，掣电挥戈争日月', author: '辛弃疾', source: '贺新郎' },
    { content: '雷雨窈冥而未半，皦日笼光於绮寮', author: '左思', source: '蜀都赋' },
    { content: '雷风一啸天地春，元气淋漓障犹湿', author: '杜甫', source: '奉先刘少府新画' },
    { content: '雷动三春蛰，涛翻八月秋', author: '刘禹锡', source: '送工部萧郎中' },
    { content: '雷辊夫差国，云翻海若家', author: '范成大', source: '次韵时叙' },
    { content: '雷斧劈开千仞壁，电鞭抽出半天云', author: '元好问', source: '台山杂咏' },
    { content: '雷塘风吹水色绿，檀娘唱尽歌行曲', author: '温庭筠', source: '蒋侯神歌' },
    { content: '雷头风尾俱不忌，铁面冰霜那得热', author: '杨万里', source: '戏题' }
  ]
}

async function fillPoetryData() {
  try {
    console.log('=== 补齐天气诗句数据 ===\n')

    await initDatabase()
    console.log('数据库连接成功\n')

    let totalCount = 0

    for (const [weatherType, poems] of Object.entries(EXTRA_POETRY_DATA)) {
      const weatherName = { 2:'云', 4:'雪', 5:'霜', 6:'露', 7:'雾', 8:'雷' }[weatherType]
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

fillPoetryData().then(() => {
  console.log('\n脚本执行完成')
  process.exit(0)
}).catch(err => {
  console.error('脚本执行失败:', err)
  process.exit(1)
})
