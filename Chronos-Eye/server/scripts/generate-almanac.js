// 使用 lunar-javascript 库生成完整的黄历数据
require('dotenv').config()
const mysql = require('mysql2/promise')
const { Lunar, Solar, ShouXing, EightChar } = require('lunar-javascript')

// 建除十二神名称
const JIAN_CHU_NAMES = ['建', '除', '满', '平', '定', '执', '破', '危', '成', '收', '开', '闭']

// 二十八星宿名称（按顺序循环）
const XING_XIU_NAMES = [
  '角木蛟', '亢金龙', '氐土貉', '房日兔', '心月狐', '尾火虎', '箕水豹',
  '斗木獬', '牛金牛', '女土蝠', '虚日鼠', '危月燕', '室火猪', '壁水貐',
  '奎木狼', '娄金狗', '胃土雉', '昴日鸡', '毕月乌', '觜火猴', '参水猿',
  '井木犴', '鬼金羊', '柳土獐', '星日马', '张月鹿', '翼火蛇', '轸水蚓'
]

// 五行纳音
const WU_XING_NAMES = [
  '海中金', '炉中火', '大林木', '路旁土', '剑锋金', '山头火',
  '涧下水', '城头土', '白蜡金', '杨柳木', '泉中水', '屋上土',
  '霹雳火', '松柏木', '长流水', '砂中金', '山下火', '平地木',
  '壁上土', '金箔金', '覆灯火', '天河水', '大驿土', '钗钏金',
  '桑柘木', '大溪水', '砂中土', '天上火', '石榴木', '大海水'
]

// 黄道十二神
const ZHI_XING_MAP = {
  '建': '青龙',
  '除': '明堂',
  '满': '天刑',
  '平': '朱雀',
  '定': '金匮',
  '执': '天德',
  '破': '白虎',
  '危': '玉堂',
  '成': '天牢',
  '收': '玄武',
  '开': '司命',
  '闭': '勾陈'
}

// 计算建除十二神（基于月支和日支）
function getJianChu(lunar) {
  const monthZhi = lunar.getMonthZhi()
  const dayZhi = lunar.getDayZhi()

  // 月支索引（寅=0, 卯=1, ...）
  const monthZhiIndex = (monthZhi + 3) % 12
  // 日支索引
  const dayZhiIndex = dayZhi

  // 建除十二神从月支对应的日支开始为"建"
  let jianChuIndex = (dayZhiIndex - monthZhiIndex + 12) % 12
  return JIAN_CHU_NAMES[jianChuIndex]
}

// 计算二十八星宿（基于日期）
function getXingXiu(lunar) {
  // 使用 lunar-javascript 的 getXiu 方法
  return lunar.getXiu() + '日' + getAnimalFromXiu(lunar.getXiu())
}

// 从星宿名获取动物名
function getAnimalFromXiu(xiuName) {
  const animals = {
    '角': '蛟', '亢': '龙', '氐': '貉', '房': '兔', '心': '狐', '尾': '虎', '箕': '豹',
    '斗': '獬', '牛': '牛', '女': '蝠', '虚': '鼠', '危': '燕', '室': '猪', '壁': '貐',
    '奎': '狼', '娄': '狗', '胃': '雉', '昴': '鸡', '毕': '乌', '觜': '猴', '参': '猿',
    '井': '犴', '鬼': '羊', '柳': '獐', '星': '马', '张': '鹿', '翼': '蛇', '轸': '蚓'
  }
  return animals[xiuName] || ''
}

// 计算纳音五行
function getNaYinWuXing(lunar) {
  // 使用 lunar-javascript 的 getDayNaYin 方法
  return lunar.getDayNaYin()
}

// 格式化彭祖百忌
function formatPengZu(lunar) {
  const ganzhiDay = lunar.getDayInGanZhi()
  const gan = ganzhiDay.charAt(0)
  const zhi = ganzhiDay.charAt(1)

  // 天干忌讳
  const ganJi = {
    '甲': '甲不开仓财物耗散',
    '乙': '乙不栽植千株不长',
    '丙': '丙不修灶必见灾殃',
    '丁': '丁不剃头头必生疮',
    '戊': '戊不受田田主不祥',
    '己': '己不破券二比并亡',
    '庚': '庚不经络织机虚张',
    '辛': '辛不合酱主人不尝',
    '壬': '壬不泱水更难提防',
    '癸': '癸不词讼理弱敌强'
  }

  // 地支忌讳
  const zhiJi = {
    '子': '子不问卜自惹祸殃',
    '丑': '丑不冠带主不还乡',
    '寅': '寅不祭祀神鬼不尝',
    '卯': '卯不穿井水泉不香',
    '辰': '辰不哭泣必主重丧',
    '巳': '巳不远行财物伏藏',
    '午': '午不苫盖屋主更张',
    '未': '未不服药毒气入肠',
    '申': '申不安床鬼祟入房',
    '酉': '酉不宴客醉坐颠狂',
    '戌': '戌不吃犬作怪上床',
    '亥': '亥不嫁娶不利新郎'
  }

  return (ganJi[gan] || '') + ' ' + (zhiJi[zhi] || '')
}

// 方位转换
function getDirectionName(position) {
  const directions = {
    1: '正北', 2: '东北', 3: '正东', 4: '东南',
    5: '正南', 6: '西南', 7: '正西', 8: '西北'
  }
  return directions[position] || ''
}

// 生成单日的黄历数据
function generateDayAlmanac(date) {
  // 从 Solar 创建 Lunar
  const solar = Solar.fromDate(date)
  const lunar = solar.getLunar()
  const eightChar = lunar.getEightChar()

  // 获取基本信息
  const ganzhiYear = lunar.getYearInGanZhi()
  const ganzhiMonth = lunar.getMonthInGanZhi()
  const ganzhiDay = lunar.getDayInGanZhi()
  const ganzhiHour = eightChar.getTime() // 时柱干支
  const zodiac = lunar.getYearShengXiao()

  // 获取宜忌
  const yi = lunar.getDayYi().join(' ')
  const ji = lunar.getDayJi().join(' ')
  const yueJi = '' // 月忌

  // 获取建除十二神
  const jianchu = lunar.getZhiXing()

  // 获取值神（基于建除十二神）
  const zhishen = ZHI_XING_MAP[jianchu] || ''

  // 获取二十八星宿
  const xingxiu = getXingXiu(lunar)

  // 获取纳音五行
  const wuxing = getNaYinWuXing(lunar)

  // 获取彭祖百忌
  const pengzu = formatPengZu(lunar)

  // 获取方位（使用 Desc 版本直接返回方位名称）
  const xishen = lunar.getDayPositionXiDesc()
  const fushen = lunar.getDayPositionFuDesc()
  const caishen = lunar.getDayPositionCaiDesc()
  const yanggui = lunar.getDayPositionYangGuiDesc()
  const yingui = lunar.getDayPositionYinGuiDesc()
  const taishen = lunar.getDayPositionTaiSuiDesc() || ''

  // 获取冲煞
  const chong = lunar.getDayChong() // 返回生肖
  const sha = lunar.getDaySha() // 返回煞的方向

  // 获取吉神宜趋和凶神宜忌
  const jishen = lunar.getDayJiShen().join(' ')
  const xiongshen = lunar.getDayXiongSha().join(' ')

  // 黄帝纪元（基于 2026 年为 4723 年推算）
  const huangdiYear = 4723 + (date.getFullYear() - 2026)

  // 星座
  const constellation = solar.getXingZuo()

  // 节气
  const jieqi = lunar.getJieQi() || ''

  // 农历节日
  const lunarFestivals = lunar.getFestivals() || []
  const lunar_festival = lunarFestivals.length > 0 ? lunarFestivals.join(',') : ''

  // 阳历节日
  const solarFestivals = solar.getFestivals() || []
  const solar_festival = solarFestivals.length > 0 ? solarFestivals.join(',') : ''

  // 获取 term（从 almanac_term_dates 表查询，在插入时填充）
  const term = jieqi // 节气即为 term

  // 计算吉日评分（简单的算法）
  let rating = 3
  if (jianchu === '开' || jianchu === '成' || jianchu === '定') {
    rating = 5
  } else if (jianchu === '破' || jianchu === '闭') {
    rating = 2
  } else if (jishen.includes('天德') || jishen.includes('月德')) {
    rating = 4
  }

  return {
    date: date.toISOString().split('T')[0],
    lunar_year: lunar.getYear(),
    lunar_month: lunar.getMonth(),
    lunar_day: lunar.getDay(),
    ganzhi_year: ganzhiYear,
    ganzhi_month: ganzhiMonth,
    ganzhi_day: ganzhiDay,
    ganzhi_hour: ganzhiHour,
    zodiac: zodiac,
    yi: yi,
    ji: ji,
    yue_ji: yueJi,
    shen_sha: zhishen,
    rating: rating,
    wuxing: wuxing,
    year_na_yin: eightChar.getYearNaYin(),
    month_na_yin: eightChar.getMonthNaYin(),
    day_na_yin: eightChar.getDayNaYin(),
    hour_na_yin: eightChar.getTimeNaYin(),
    xingxiu: xingxiu,
    constellation: constellation,
    jieqi: jieqi,
    term: term,
    lunar_festival: lunar_festival,
    solar_festival: solar_festival,
    caishen: caishen,
    fushen: fushen,
    xishen: xishen,
    yanggui: yanggui,
    yingui: yingui,
    taishen: taishen,
    jianchu: jianchu,
    jishen: jishen,
    xiongshen: xiongshen,
    pengzu: pengzu,
    huangdi_year: huangdiYear,
    conflict_zodiac: chong,
    conflict_sha: sha
  }
}

// 主函数
async function generateAlmanacData() {
  console.log('开始生成黄历数据...')

  // 创建数据库连接
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'chronos_eye'
  })

  try {
    // 生成 2024-2070 年的黄历数据
    const startDate = new Date('2024-01-01')
    const endDate = new Date('2070-12-31')

    let currentDate = new Date(startDate)
    let count = 0
    let insertCount = 0

    while (currentDate <= endDate) {
      const almanac = generateDayAlmanac(currentDate)

      // 检查是否已存在
      const [existing] = await connection.query(
        'SELECT id FROM almanac_data WHERE date = ?',
        [almanac.date]
      )

      if (existing.length === 0) {
        // 插入新数据
        await connection.query(`
          INSERT INTO almanac_data (
            date, lunar_year, lunar_month, lunar_day,
            ganzhi_year, ganzhi_month, ganzhi_day, ganzhi_hour, zodiac,
            yi, ji, yue_ji, shen_sha, rating,
            wuxing, year_na_yin, month_na_yin, day_na_yin, hour_na_yin,
            xingxiu, constellation, jieqi,
            caishen, fushen, xishen, yanggui, yingui, taishen,
            jianchu, jishen, xiongshen, pengzu, huangdi_year,
            conflict_zodiac
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          almanac.date,
          almanac.lunar_year,
          almanac.lunar_month,
          almanac.lunar_day,
          almanac.ganzhi_year,
          almanac.ganzhi_month,
          almanac.ganzhi_day,
          almanac.ganzhi_hour,
          almanac.zodiac,
          almanac.yi,
          almanac.ji,
          almanac.yue_ji,
          almanac.shen_sha,
          almanac.rating,
          almanac.wuxing,
          almanac.year_na_yin,
          almanac.month_na_yin,
          almanac.day_na_yin,
          almanac.hour_na_yin,
          almanac.xingxiu,
          almanac.constellation,
          almanac.jieqi,
          almanac.caishen,
          almanac.fushen,
          almanac.xishen,
          almanac.yanggui,
          almanac.yingui,
          almanac.taishen,
          almanac.jianchu,
          almanac.jishen,
          almanac.xiongshen,
          almanac.pengzu,
          almanac.huangdi_year,
          almanac.conflict_zodiac
        ])
        insertCount++
      } else {
        // 更新现有数据
        await connection.query(`
          UPDATE almanac_data SET
            lunar_year = ?, lunar_month = ?, lunar_day = ?,
            ganzhi_year = ?, ganzhi_month = ?, ganzhi_day = ?, ganzhi_hour = ?, zodiac = ?,
            yi = ?, ji = ?, yue_ji = ?, shen_sha = ?, rating = ?,
            wuxing = ?, year_na_yin = ?, month_na_yin = ?, day_na_yin = ?, hour_na_yin = ?,
            xingxiu = ?, constellation = ?, jieqi = ?,
            caishen = ?, fushen = ?, xishen = ?, yanggui = ?, yingui = ?, taishen = ?,
            jianchu = ?, jishen = ?, xiongshen = ?, pengzu = ?, huangdi_year = ?,
            conflict_zodiac = ?
          WHERE date = ?
        `, [
          almanac.lunar_year,
          almanac.lunar_month,
          almanac.lunar_day,
          almanac.ganzhi_year,
          almanac.ganzhi_month,
          almanac.ganzhi_day,
          almanac.ganzhi_hour,
          almanac.zodiac,
          almanac.yi,
          almanac.ji,
          almanac.yue_ji,
          almanac.shen_sha,
          almanac.rating,
          almanac.wuxing,
          almanac.year_na_yin,
          almanac.month_na_yin,
          almanac.day_na_yin,
          almanac.hour_na_yin,
          almanac.xingxiu,
          almanac.constellation,
          almanac.jieqi,
          almanac.caishen,
          almanac.fushen,
          almanac.xishen,
          almanac.yanggui,
          almanac.yingui,
          almanac.taishen,
          almanac.jianchu,
          almanac.jishen,
          almanac.xiongshen,
          almanac.pengzu,
          almanac.huangdi_year,
          almanac.conflict_zodiac,
          almanac.date
        ])
      }

      count++
      currentDate.setDate(currentDate.getDate() + 1)

      // 每 100 天输出一次进度
      if (count % 100 === 0) {
        console.log(`已处理 ${count} 天，新增/更新 ${insertCount} 条`)
      }
    }

    console.log(`\n生成完成！`)
    console.log(`总共处理：${count} 天`)
    console.log(`新增/更新：${insertCount} 条记录`)
    console.log(`日期范围：${startDate.toISOString().split('T')[0]} 至 ${endDate.toISOString().split('T')[0]}`)

  } catch (error) {
    console.error('生成失败:', error.message)
    throw error
  } finally {
    await connection.end()
  }
}

// 运行生成
generateAlmanacData().catch(console.error)
