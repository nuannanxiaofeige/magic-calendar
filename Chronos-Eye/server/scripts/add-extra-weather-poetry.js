/**
 * 补充天气诗句数据 - 每种天气类型从 25 条增加到 40 条
 */

require('dotenv').config()
const { query, initDatabase } = require('../src/config/database')

// 天气类型映射
const WEATHER_TYPES = {
  1: '风',
  2: '云',
  3: '雨',
  4: '雪',
  5: '霜',
  6: '露',
  7: '雾',
  8: '雷',
  9: '晴',
  10: '阴'
}

// 补充数据（每种天气 15 条新增）
const EXTRA_POETRY_DATA = {
  // 1. 风 - 新增 15 条
  1: [
    { content: '林暗草惊风，将军夜引弓', author: '卢纶', source: '塞下曲' },
    { content: '城阙辅三秦，风烟望五津', author: '王勃', source: '送杜少府之任蜀州' },
    { content: '潮平两岸阔，风正一帆悬', author: '王湾', source: '次北固山下' },
    { content: '细雨鱼儿出，微风燕子斜', author: '杜甫', source: '水槛遣心' },
    { content: '树欲静而风不止，子欲养而亲不待', author: '韩婴', source: '韩诗外传' },
    { content: '大风起兮云飞扬，威加海内兮归故乡', author: '刘邦', source: '大风歌' },
    { content: '春风十里扬州路，卷上珠帘总不如', author: '杜牧', source: '赠别' },
    { content: '风住尘香花已尽，日晚倦梳头', author: '李清照', source: '武陵春' },
    { content: '昨夜西风凋碧树，独上高楼，望尽天涯路', author: '晏殊', source: '蝶恋花' },
    { content: '风乍起，吹皱一池春水', author: '冯延巳', source: '谒金门' },
    { content: '千里其如何，微风吹兰杜', author: '王昌龄', source: '同从弟南斋玩月忆山阴崔少府' },
    { content: '风声一何盛，松枝一何劲', author: '刘桢', source: '赠从弟' },
    { content: '秋风清，秋月明，落叶聚还散，寒鸦栖复惊', author: '李白', source: '三五七言' },
    { content: '长风几万里，吹度玉门关', author: '李白', source: '关山月' },
    { content: '暖风熏得游人醉，直把杭州作汴州', author: '林升', source: '题临安邸' }
  ],
  // 2. 云 - 新增 15 条
  2: [
    { content: '远上寒山石径斜，白云深处有人家', author: '杜牧', source: '山行' },
    { content: '半亩方塘一鉴开，天光云影共徘徊', author: '朱熹', source: '观书有感' },
    { content: '黄河之水天上来，奔流到海不复回', author: '李白', source: '将进酒' },
    { content: '云中谁寄锦书来，雁字回时月满西楼', author: '李清照', source: '一剪梅' },
    { content: '云想衣裳花想容，春风拂槛露华浓', author: '李白', source: '清平调' },
    { content: '晓镜但愁云鬓改，夜吟应觉月光寒', author: '李商隐', source: '无题' },
    { content: '云收雨过波添，楼外水冷瓜甜', author: '白朴', source: '天净沙·夏' },
    { content: '碧云天，黄叶地，秋色连波，波上寒烟翠', author: '范仲淹', source: '苏幕遮' },
    { content: '云鬓花颜金步摇，芙蓉帐暖度春宵', author: '白居易', source: '长恨歌' },
    { content: '黑云翻墨未遮山，白雨跳珠乱入船', author: '苏轼', source: '六月二十七日望湖楼醉书' },
    { content: '云间连下榻，天上接行杯', author: '李白', source: '与夏十二登岳阳楼' },
    { content: '曾伴浮云归晚翠，犹陪落日泛秋声', author: '曾巩', source: '城南' },
    { content: '云来倏忽如苍狗，云去悠悠似白衣', author: '杜甫', source: '可叹' },
    { content: '云淡天高秋气爽，雁阵南飞', author: '佚名', source: '古词' },
    { content: '云外高山，云中谁寄锦书来', author: '李清照', source: '一剪梅' }
  ],
  // 3. 雨 - 新增 15 条
  3: [
    { content: '对潇潇暮雨洒江天，一番洗清秋', author: '柳永', source: '八声甘州' },
    { content: '自在飞花轻似梦，无边丝雨细如愁', author: '秦观', source: '浣溪沙' },
    { content: '枕上诗书闲处好，门前风景雨来佳', author: '李清照', source: '摊破浣溪沙' },
    { content: '雨里有人愁，雨中花更愁', author: '无名氏', source: '古诗' },
    { content: '春雨断桥人不度，小舟撑出柳阴来', author: '徐俯', source: '春游湖' },
    { content: '夜合花开香满庭，夜深微雨醉初醒', author: '翁绶', source: '折杨柳' },
    { content: '雨前初见花间蕊，雨后全无叶底花', author: '王驾', source: '雨晴' },
    { content: '微雨夜来过，不知春草生', author: '韦应物', source: '幽居' },
    { content: '夜来风雨声，花落知多少', author: '孟浩然', source: '春晓' },
    { content: '雨横风狂三月暮，门掩黄昏无计留春住', author: '欧阳修', source: '蝶恋花' },
    { content: '雨打风吹何处是，英雄无觅孙仲谋处', author: '辛弃疾', source: '永遇乐' },
    { content: '雨疏风骤，浓睡不消残酒', author: '李清照', source: '如梦令' },
    { content: '雨歇杨林东渡头，永和三日荡轻舟', author: '常建', source: '三日寻李九庄' },
    { content: '雨暗残灯棋散后，酒醒孤枕雁来初', author: '杜牧', source: '齐安郡晚秋' },
    { content: '雨过月华生，冷彻鸳鸯浦', author: '柳永', source: '甘草子' }
  ],
  // 4. 雪 - 新增 15 条
  4: [
    { content: '山回路转不见君，雪上空留马行处', author: '岑参', source: '白雪歌送武判官归京' },
    { content: '梅雪争春未肯降，骚人阁笔费评章', author: '卢梅坡', source: '雪梅' },
    { content: '终南阴岭秀，积雪浮云端', author: '祖咏', source: '终南望余雪' },
    { content: '雪消门外千山绿，花发江边二月晴', author: '欧阳修', source: '春日西湖寄谢法曹歌' },
    { content: '投宿骎骎征骑，飞雪满孤村', author: '孔夷', source: '南浦' },
    { content: '雪里已知春信至，寒梅点缀琼枝腻', author: '李清照', source: '渔家傲' },
    { content: '大雪压青松，青松挺且直', author: '陈毅', source: '青松' },
    { content: '窗含西岭千秋雪，门泊东吴万里船', author: '杜甫', source: '绝句' },
    { content: '雪暗凋旗画，风多杂鼓声', author: '杨炯', source: '从军行' },
    { content: '雪拥蓝关马不前，云横秦岭家何在', author: '韩愈', source: '左迁至蓝关示侄孙湘' },
    { content: '雪似梅花，梅花似雪，似和不似都奇绝', author: '吕本中', source: '踏莎行' },
    { content: '雪后燕瑶池，人间第一枝', author: '赵令畤', source: '菩萨蛮' },
    { content: '雪照山城玉指寒，一声羌管怨楼间', author: '刘著', source: '鹧鸪天' },
    { content: '雪月最相宜，梅雪都清绝', author: '张孝祥', source: '卜算子' },
    { content: '雪岸丛梅发，春泥百草生', author: '杜甫', source: '陪裴使君登岳阳楼' }
  ],
  // 5. 霜 - 新增 15 条
  5: [
    { content: '霜落熊升树，林空鹿饮溪', author: '梅尧臣', source: '鲁山山行' },
    { content: '霜叶飞落，秋意阑珊', author: '佚名', source: '古词' },
    { content: '霜天晓角，梅谢东风', author: '程垓', source: '霜天晓角' },
    { content: '霜降水痕收，浅碧鳞鳞露远洲', author: '苏轼', source: '南乡子' },
    { content: '霜风渐紧寒侵被，无寐无寐', author: '佚名', source: '古词' },
    { content: '霜华满地，欲跨彩云飞起', author: '文天祥', source: '酹江月' },
    { content: '霜角一声草木哀，云头对起石门开', author: '戚继光', source: '即事' },
    { content: '霜重鼓寒声不起，半卷红旗临易水', author: '李贺', source: '雁门太守行' },
    { content: '霜树尽空枝，肠断丁香结', author: '冯延巳', source: '醉花间' },
    { content: '霜落江始寒，枫叶绿未脱', author: '李白', source: '江上寄元六林宗' },
    { content: '霜威出塞早，云色渡河秋', author: '李白', source: '太原早秋' },
    { content: '霜清东林钟磬响，日暮西峰烟雨来', author: '刘长卿', source: '送方外上人' },
    { content: '霜禽欲下先偷眼，粉蝶如知合断魂', author: '林逋', source: '山园小梅' },
    { content: '霜草苍苍虫切切，村南村北行人绝', author: '白居易', source: '村夜' },
    { content: '霜逼征衣薄，尘随马首深', author: '张耒', source: '宿柳子观音寺' }
  ],
  // 6. 露 - 新增 15 条
  6: [
    { content: '白露横江，水光接天', author: '苏轼', source: '前赤壁赋' },
    { content: '白露未晞，所谓伊人，在水之湄', author: '诗经', source: '蒹葭' },
    { content: '白露垂珠滴秋月，江上沉沉怨离别', author: '李白', source: '江上吟' },
    { content: '白露沾野草，时节忽复易', author: '古诗十九首', source: '明月皎夜光' },
    { content: '露华兰叶参差，春尽秋千院落', author: '晏几道', source: '清平乐' },
    { content: '露气闻芳杜，歌声识采莲', author: '孟浩然', source: '渡扬子江' },
    { content: '露如微霰下前池，月过回塘万竹悲', author: '李商隐', source: '曲池' },
    { content: '露湿晴花春殿香，月明歌吹在昭阳', author: '李益', source: '宫怨' },
    { content: '露凝千片玉，蝉散一长枝', author: '李世民', source: '咏蝉' },
    { content: '露井桃花发，双双燕并飞', author: '李白', source: '宫中行乐词' },
    { content: '露华新，游子征衣沾泪频', author: '晏几道', source: '采桑子' },
    { content: '露蛩悲，青灯冷屋，翻书愁上鬓毛白', author: '洪咨夔', source: '满江红' },
    { content: '露条烟叶，惹长亭旧别', author: '刘一止', source: '喜迁莺' },
    { content: '露洗华桐，烟霏丝柳，绿阴摇曳', author: '万俟咏', source: '三台' },
    { content: '露零难辨，星疏可数，人在水晶宫里', author: '晁补之', source: '永遇乐' }
  ],
  // 7. 雾 - 新增 15 条
  7: [
    { content: '雾縠云鬟，朝朝暮暮，阳台之下', author: '宋玉', source: '高唐赋' },
    { content: '雾树溟潆叫乱鸦，湿云初变早来霞', author: '德元', source: '晓日' },
    { content: '雾青山影见，浪白雨声来', author: '刘长卿', source: '雨中登沛县楼' },
    { content: '雾暗长堤景，凄风故国心', author: '宋之问', source: '晚泊湘江' },
    { content: '雾交才洒地，风逆旋随篙', author: '杜甫', source: '渡江' },
    { content: '雾露晨侵骑，星霜夜满衣', author: '张籍', source: '送蛮客' },
    { content: '雾树行相引，莲峰望忽开', author: '元稹', source: '遣悲怀' },
    { content: '雾色侵虚牖，霜华冷画屏', author: '温庭筠', source: '宿白盖峰寺寄僧' },
    { content: '雾浓烟重重，水远山长长', author: '白居易', source: '新乐府' },
    { content: '雾晓起凫雁，日晚下牛羊', author: '杜牧', source: '郡斋独酌' },
    { content: '雾开虎豹文姿出，松隐龙蛇怪状孤', author: '张祜', source: '题朱兵部山居' },
    { content: '雾重千峰失，潮平两岸宽', author: '王湾', source: '次北固山下' },
    { content: '雾隐平郊树，风含广岸波', author: '杜甫', source: '暮春题瀼西新赁草屋' },
    { content: '雾昏临水寺，风急卷潮来', author: '刘禹锡', source: '始发富春' },
    { content: '雾薄云鬟湿，风清玉臂凉', author: '杜甫', source: '月夜' }
  ],
  // 8. 雷 - 新增 15 条
  8: [
    { content: '雷风有约春将半，桃李无言日正长', author: '陆游', source: '春日' },
    { content: '雷动风行惊蛰户，天开地辟转鸿钧', author: '陆游', source: '春晴泛舟' },
    { content: '雷声半夜驱龙起，雨脚千山送鹤归', author: '范成大', source: '题画卷' },
    { content: '雷惊雨洒一时苏，云压霜摧半年病', author: '范成大', source: '次韵时叙' },
    { content: '雷霆日已远，云雨竟何之', author: '杜甫', source: '过津口' },
    { content: '雷鼓嘈嘈喧武昌，云旗猎猎过寻阳', author: '李白', source: '永王东巡歌' },
    { content: '雷头风尾俱不忌，铁面冰霜那得热', author: '杨万里', source: '戏题' },
    { content: '雷声送春归，雨气排夏来', author: '杨万里', source: '夏日杂兴' },
    { content: '雷动三春蛰，涛翻八月秋', author: '刘禹锡', source: '送工部萧郎中' },
    { content: '雷池一过眼如新，雪浪翻空面面匀', author: '杨万里', source: '过扬子江' },
    { content: '雷塘风吹水色绿，檀娘唱尽歌行曲', author: '温庭筠', source: '蒋侯神歌' },
    { content: '雷辊夫差国，云翻海若家', author: '范成大', source: '次韵时叙赋乐先生新居' },
    { content: '雷惊电激语难闻，势挟风涛日夜闻', author: '苏轼', source: '八月七日初入赣' },
    { content: '雷塘水乾禾黍满，宝钗耕出余鸾龙', author: '刘禹锡', source: '和浙西李大夫' },
    { content: '雷峰塔下寻芳去，柳浪闻莺近晚钟', author: '佚名', source: '西湖杂咏' }
  ],
  // 9. 晴 - 新增 15 条
  9: [
    { content: '晴川历历汉阳树，芳草萋萋鹦鹉洲', author: '崔颢', source: '黄鹤楼' },
    { content: '晴日暖风生麦气，绿阴幽草胜花时', author: '王安石', source: '初夏即事' },
    { content: '晴空澹无滓，秋气浩荡间', author: '韩愈', source: '秋怀诗' },
    { content: '晴光转绿苹，微雨洗轻尘', author: '杜审言', source: '和晋陵陆丞早春游望' },
    { content: '晴岚低楚甸，暖回雁翼', author: '周邦彦', source: '诉衷情' },
    { content: '晴碧远连云，千里万里', author: '欧阳修', source: '少年游' },
    { content: '晴雪小园春未到，池边梅自早', author: '冯延巳', source: '谒金门' },
    { content: '晴日江上，春风十里', author: '姜夔', source: '扬州慢' },
    { content: '晴窗细乳戏分茶，素衣莫起风尘叹', author: '陆游', source: '临安春雨初霁' },
    { content: '晴烟漠漠柳毵毵，不那离情酒半酣', author: '韦庄', source: '古离别' },
    { content: '晴日催花暖欲燃，燕归人未还', author: '曹雪芹', source: '唐多令' },
    { content: '晴日寻芳泗水滨，无边光景一时新', author: '朱熹', source: '春日' },
    { content: '晴波漾碧，细浪摇金', author: '佚名', source: '古词' },
    { content: '晴风吹柳絮，新火起厨烟', author: '贾岛', source: '清明日园林寄友人' },
    { content: '晴日看花应恨晚，明朝风起应吹散', author: '白居易', source: '惜牡丹花' }
  ],
  // 10. 阴 - 新增 15 条
  10: [
    { content: '阴阴夏木啭黄鹂，漠漠水田飞白鹭', author: '王维', source: '积雨辋川庄作' },
    { content: '阴霾欲合山逾远，烟雨初收水更清', author: '苏轼', source: '新城道中' },
    { content: '阴云凝朔气，陇上正飞雪', author: '长孙佐辅', source: '陇西行' },
    { content: '阴风西北来，惨淡随回纥', author: '杜甫', source: '北征' },
    { content: '阴崖含黛色，远壑度钟声', author: '宋之问', source: '入泷州江' },
    { content: '阴涧夜飞雨，阳崖朝带云', author: '宋之问', source: '雨从箕山来' },
    { content: '阴房阒鬼火，春院閟天黑', author: '文天祥', source: '正气歌' },
    { content: '阴霭纵腾薄，微阳自舒徐', author: '苏舜钦', source: '夏意' },
    { content: '阴云暮下雪，寒日昼无辉', author: '刘长卿', source: '送李录事兄归襄邓' },
    { content: '阴壑生灵籁，月林散清影', author: '杜甫', source: '游龙门奉先寺' },
    { content: '阴晴圆缺都休说，且喜人间好时节', author: '徐有贞', source: '中秋月' },
    { content: '阴山道，阴山道，纥逻敦肥水泉好', author: '白居易', source: '阴山道' },
    { content: '阴云不肯收，寒气偏侵骨', author: '刘驾', source: '苦寒吟' },
    { content: '阴崖积雪百丈冰，朔风怒号天地昏', author: '陆游', source: '苦寒行' },
    { content: '阴风吹大泽，梦日照昌朝', author: '柳宗元', source: '同刘二十八哭吕衡州兼寄江陵李元二侍御' }
  ]
}

async function addExtraPoetryData() {
  try {
    console.log('=== 补充天气诗句数据 ===\n')

    // 初始化数据库
    await initDatabase()
    console.log('数据库连接成功\n')

    // 检查当前数据量
    const existing = await query('SELECT COUNT(*) as count FROM weather_poetry')
    console.log(`当前数据库已有 ${existing[0].count} 条诗句\n`)

    // 插入补充数据
    console.log('开始导入补充数据...')
    let totalCount = 0

    for (const [weatherType, poems] of Object.entries(EXTRA_POETRY_DATA)) {
      const weatherName = WEATHER_TYPES[weatherType]
      let insertedCount = 0

      for (const poem of poems) {
        // 检查是否已存在
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

      console.log(`   【${weatherName}】新增 ${insertedCount} 条`)
      totalCount += insertedCount
    }

    console.log(`\n补充完成！共新增 ${totalCount} 条诗句`)

    // 显示最新统计
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

// 运行脚本
addExtraPoetryData().then(() => {
  console.log('\n脚本执行完成')
  process.exit(0)
}).catch(err => {
  console.error('脚本执行失败:', err)
  process.exit(1)
})
