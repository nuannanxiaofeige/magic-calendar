/**
 * 创建天气诗句表并导入初始数据
 * 数据来源：天行 API - 天气诗句查询
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

// 天气诗句数据（每种天气 25 条）
const WEATHER_POETRY_DATA = {
  // 1. 风
  1: [
    { content: '夜来风雨声，花落知多少', author: '孟浩然', source: '春晓' },
    { content: '春风又绿江南岸，明月何时照我还', author: '王安石', source: '泊船瓜洲' },
    { content: '随风潜入夜，润物细无声', author: '杜甫', source: '春夜喜雨' },
    { content: '野火烧不尽，春风吹又生', author: '白居易', source: '赋得古原草送别' },
    { content: '相见时难别亦难，东风无力百花残', author: '李商隐', source: '无题' },
    { content: '人面不知何处去，桃花依旧笑春风', author: '崔护', source: '题都城南庄' },
    { content: '羌笛何须怨杨柳，春风不度玉门关', author: '王之涣', source: '凉州词' },
    { content: '春风得意马蹄疾，一日看尽长安花', author: '孟郊', source: '登科后' },
    { content: '等闲识得东风面，万紫千红总是春', author: '朱熹', source: '春日' },
    { content: '不知细叶谁裁出，二月春风似剪刀', author: '贺知章', source: '咏柳' },
    { content: '千里黄云白日曛，北风吹雁雪纷纷', author: '高适', source: '别董大' },
    { content: '风急天高猿啸哀，渚清沙白鸟飞回', author: '杜甫', source: '登高' },
    { content: '长风破浪会有时，直挂云帆济沧海', author: '李白', source: '行路难' },
    { content: '相见时难别亦难，东风无力百花残', author: '李商隐', source: '无题' },
    { content: '枯藤老树昏鸦，小桥流水人家，古道西风瘦马', author: '马致远', source: '天净沙·秋思' },
    { content: '爆竹声中一岁除，春风送暖入屠苏', author: '王安石', source: '元日' },
    { content: '迟日江山丽，春风花草香', author: '杜甫', source: '绝句' },
    { content: '秋风萧瑟，洪波涌起', author: '曹操', source: '观沧海' },
    { content: '风萧萧兮易水寒，壮士一去兮不复还', author: '荆轲', source: '易水歌' },
    { content: '居高声自远，非是藉秋风', author: '虞世南', source: '蝉' },
    { content: '东风夜放花千树，更吹落，星如雨', author: '辛弃疾', source: '青玉案·元夕' },
    { content: '北风卷地白草折，胡天八月即飞雪', author: '岑参', source: '白雪歌送武判官归京' },
    { content: '云淡风轻近午天，傍花随柳过前川', author: '程颢', source: '春日偶成' },
    { content: '风一更，雪一更，聒碎乡心梦不成', author: '纳兰性德', source: '长相思' },
    { content: '子规夜半犹啼血，不信东风唤不回', author: '王令', source: '送春' }
  ],
  // 2. 云
  2: [
    { content: '行到水穷处，坐看云起时', author: '王维', source: '终南别业' },
    { content: '曾经沧海难为水，除却巫山不是云', author: '元稹', source: '离思' },
    { content: '云想衣裳花想容，春风拂槛露华浓', author: '李白', source: '清平调' },
    { content: '只在此山中，云深不知处', author: '贾岛', source: '寻隐者不遇' },
    { content: '黄河远上白云间，一片孤城万仞山', author: '王之涣', source: '凉州词' },
    { content: '黑云压城城欲摧，甲光向日金鳞开', author: '李贺', source: '雁门太守行' },
    { content: '白云深处有人家，停车坐爱枫林晚', author: '杜牧', source: '山行' },
    { content: '总为浮云能蔽日，长安不见使人愁', author: '李白', source: '登金陵凤凰台' },
    { content: '不畏浮云遮望眼，自缘身在最高层', author: '王安石', source: '登飞来峰' },
    { content: '众鸟高飞尽，孤云独去闲', author: '李白', source: '独坐敬亭山' },
    { content: '云青青兮欲雨，水澹澹兮生烟', author: '李白', source: '梦游天姥吟留别' },
    { content: '晴空一鹤排云上，便引诗情到碧霄', author: '刘禹锡', source: '秋词' },
    { content: '云横秦岭家何在，雪拥蓝关马不前', author: '韩愈', source: '左迁至蓝关示侄孙湘' },
    { content: '三十功名尘与土，八千里路云和月', author: '岳飞', source: '满江红' },
    { content: '朝辞白帝彩云间，千里江陵一日还', author: '李白', source: '早发白帝城' },
    { content: '月下飞天镜，云生结海楼', author: '李白', source: '渡荆门送别' },
    { content: '浮云游子意，落日故人情', author: '李白', source: '送友人' },
    { content: '荡胸生曾云，决眦入归鸟', author: '杜甫', source: '望岳' },
    { content: '黄鹤一去不复返，白云千载空悠悠', author: '崔颢', source: '黄鹤楼' },
    { content: '野径云俱黑，江船火独明', author: '杜甫', source: '春夜喜雨' },
    { content: '气蒸云梦泽，波撼岳阳城', author: '孟浩然', source: '望洞庭湖赠张丞相' },
    { content: '晓镜但愁云鬓改，夜吟应觉月光寒', author: '李商隐', source: '无题' },
    { content: '锦城丝管日纷纷，半入江风半入云', author: '杜甫', source: '赠花卿' },
    { content: '云散月明谁点缀，天容海色本澄清', author: '苏轼', source: '六月二十日夜渡海' },
    { content: '卧看满天云不动，不知云与我俱东', author: '陈与义', source: '襄邑道中' }
  ],
  // 3. 雨
  3: [
    { content: '好雨知时节，当春乃发生', author: '杜甫', source: '春夜喜雨' },
    { content: '清明时节雨纷纷，路上行人欲断魂', author: '杜牧', source: '清明' },
    { content: '夜阑卧听风吹雨，铁马冰河入梦来', author: '陆游', source: '十一月四日风雨大作' },
    { content: '东边日出西边雨，道是无晴却有晴', author: '刘禹锡', source: '竹枝词' },
    { content: '空山新雨后，天气晚来秋', author: '王维', source: '山居秋暝' },
    { content: '小楼一夜听春雨，深巷明朝卖杏花', author: '陆游', source: '临安春雨初霁' },
    { content: '天街小雨润如酥，草色遥看近却无', author: '韩愈', source: '早春呈水部张十八员外' },
    { content: '沾衣欲湿杏花雨，吹面不寒杨柳风', author: '志南', source: '绝句' },
    { content: '春潮带雨晚来急，野渡无人舟自横', author: '韦应物', source: '滁州西涧' },
    { content: '南朝四百八十寺，多少楼台烟雨中', author: '杜牧', source: '江南春' },
    { content: '山河破碎风飘絮，身世浮沉雨打萍', author: '文天祥', source: '过零丁洋' },
    { content: '寒雨连江夜入吴，平明送客楚山孤', author: '王昌龄', source: '芙蓉楼送辛渐' },
    { content: '渭城朝雨浥轻尘，客舍青青柳色新', author: '王维', source: '送元二使安西' },
    { content: '水光潋滟晴方好，山色空蒙雨亦奇', author: '苏轼', source: '饮湖上初晴后雨' },
    { content: '青箬笠，绿蓑衣，斜风细雨不须归', author: '张志和', source: '渔歌子' },
    { content: '梧桐更兼细雨，到黄昏、点点滴滴', author: '李清照', source: '声声慢' },
    { content: '怒发冲冠，凭栏处、潇潇雨歇', author: '岳飞', source: '满江红' },
    { content: '落花人独立，微雨燕双飞', author: '晏几道', source: '临江仙' },
    { content: '雨里鸡鸣一两家，竹溪村路板桥斜', author: '王建', source: '雨过山村' },
    { content: '细雨鱼儿出，微风燕子斜', author: '杜甫', source: '水槛遣心' },
    { content: '秋阴不散霜飞晚，留得枯荷听雨声', author: '李商隐', source: '宿骆氏亭寄怀崔雍崔衮' },
    { content: '君问归期未有期，巴山夜雨涨秋池', author: '李商隐', source: '夜雨寄北' },
    { content: '殷勤昨夜三更雨，又得浮生一日凉', author: '苏轼', source: '鹧鸪天' },
    { content: '风雨替花愁，风雨罢，花也应休', author: '赵秉文', source: '青杏儿' },
    { content: '雨打梨花深闭门，忘了青春，误了青春', author: '唐寅', source: '一剪梅' }
  ],
  // 4. 雪
  4: [
    { content: '孤舟蓑笠翁，独钓寒江雪', author: '柳宗元', source: '江雪' },
    { content: '柴门闻犬吠，风雪夜归人', author: '刘长卿', source: '逢雪宿芙蓉山主人' },
    { content: '窗含西岭千秋雪，门泊东吴万里船', author: '杜甫', source: '绝句' },
    { content: '梅须逊雪三分白，雪却输梅一段香', author: '卢梅坡', source: '雪梅' },
    { content: '北国风光，千里冰封，万里雪飘', author: '毛泽东', source: '沁园春·雪' },
    { content: '欲渡黄河冰塞川，将登太行雪满山', author: '李白', source: '行路难' },
    { content: '忽如一夜春风来，千树万树梨花开', author: '岑参', source: '白雪歌送武判官归京' },
    { content: '千里黄云白日曛，北风吹雁雪纷纷', author: '高适', source: '别董大' },
    { content: '欲将轻骑逐，大雪满弓刀', author: '卢纶', source: '塞下曲' },
    { content: '云横秦岭家何在，雪拥蓝关马不前', author: '韩愈', source: '左迁至蓝关示侄孙湘' },
    { content: '草枯鹰眼疾，雪尽马蹄轻', author: '王维', source: '观猎' },
    { content: '北风卷地白草折，胡天八月即飞雪', author: '岑参', source: '白雪歌送武判官归京' },
    { content: '燕山雪花大如席，片片吹落轩辕台', author: '李白', source: '北风行' },
    { content: '遥知不是雪，为有暗香来', author: '王安石', source: '梅花' },
    { content: '晚来天欲雪，能饮一杯无', author: '白居易', source: '问刘十九' },
    { content: '终南阴岭秀，积雪浮云端', author: '祖咏', source: '终南望余雪' },
    { content: '有梅无雪不精神，有雪无诗俗了人', author: '卢梅坡', source: '雪梅其二' },
    { content: '乱石穿空，惊涛拍岸，卷起千堆雪', author: '苏轼', source: '念奴娇·赤壁怀古' },
    { content: '风雨送春归，飞雪迎春到', author: '毛泽东', source: '卜算子·咏梅' },
    { content: '楼船夜雪瓜洲渡，铁马秋风大散关', author: '陆游', source: '书愤' },
    { content: '三春白雪归青冢，万里黄河绕黑山', author: '柳中庸', source: '征人怨' },
    { content: '雪消门外千山绿，花发江边二月晴', author: '欧阳修', source: '春日西湖寄谢法曹歌' },
    { content: '飞雪带春风，裴回乱绕空', author: '刘方平', source: '春雪' },
    { content: '萦空渐觉光风转，坠雪犹含晓日红', author: '张谓', source: '早梅' },
    { content: '雪粉华，舞梨花，再不见烟村四五家', author: '关汉卿', source: '大德歌·冬景' }
  ],
  // 5. 霜
  5: [
    { content: '月落乌啼霜满天，江枫渔火对愁眠', author: '张继', source: '枫桥夜泊' },
    { content: '停车坐爱枫林晚，霜叶红于二月花', author: '杜牧', source: '山行' },
    { content: '荷尽已无擎雨盖，菊残犹有傲霜枝', author: '苏轼', source: '赠刘景文' },
    { content: '蒹葭苍苍，白露为霜', author: '诗经', source: '蒹葭' },
    { content: '羌管悠悠霜满地，人不寐，将军白发征夫泪', author: '范仲淹', source: '渔家傲·秋思' },
    { content: '霜严衣带断，指直不得结', author: '杜甫', source: '自京赴奉先县咏怀五百字' },
    { content: '鸡声茅店月，人迹板桥霜', author: '温庭筠', source: '商山早行' },
    { content: '客舍并州已十霜，归心日夜忆咸阳', author: '刘皂', source: '旅次朔方' },
    { content: '秋风萧瑟天气凉，草木摇落露为霜', author: '曹丕', source: '燕歌行' },
    { content: '一年好景君须记，最是橙黄橘绿时', author: '苏轼', source: '赠刘景文' },
    { content: '霜草苍苍虫切切，村南村北行人绝', author: '白居易', source: '村夜' },
    { content: '不知近水花先发，疑是经冬雪未销', author: '张谓', source: '早梅' },
    { content: '晓晴寒未起，霜叶满阶红', author: '白居易', source: '秋雨夜眠' },
    { content: '霜叶红于二月花，秋深客思迷', author: '杜牧', source: '山行' },
    { content: '风卷清云尽，空天万里霜', author: '元稹', source: '霜月' },
    { content: '初月如弓未上弦，分明挂在碧霄边', author: '缪氏子', source: '赋新月' },
    { content: '霜降碧天静，秋事促西风', author: '叶梦得', source: '水调歌头' },
    { content: '新霜著杨柳，落日下原隰', author: '贺铸', source: '寒夜思》' },
    { content: '霜重鼓寒声不起，半卷红旗临易水', author: '李贺', source: '雁门太守行' },
    { content: '金井梧桐秋叶黄，珠帘不卷夜来霜', author: '王昌龄', source: '长信秋词' },
    { content: '月落乌啼霜满天，孤舟一系故园心', author: '杜甫', source: '秋兴八首' },
    { content: '霜天秋晓，正紫塞故垒，黄云衰草', author: '蔡挺', source: '喜迁莺·霜天秋晓' },
    { content: '薄霜澄夜月，残雪带春风', author: '陈子昂', source: '春晚从李长史游开远林' },
    { content: '霜落荆门江树空，布帆无恙挂秋风', author: '李白', source: '秋下荆门' },
    { content: '霜禽欲下先偷眼，粉蝶如知合断魂', author: '林逋', source: '山园小梅' }
  ],
  // 6. 露
  6: [
    { content: '露从今夜白，月是故乡明', author: '杜甫', source: '月夜忆舍弟' },
    { content: '可怜九月初三夜，露似真珠月似弓', author: '白居易', source: '暮江吟' },
    { content: '青青园中葵，朝露待日晞', author: '汉乐府', source: '长歌行' },
    { content: '蒹葭苍苍，白露为霜', author: '诗经', source: '蒹葭' },
    { content: '道狭草木长，夕露沾我衣', author: '陶渊明', source: '归园田居' },
    { content: '玉碗盛残露，银灯点旧纱', author: '李贺', source: '过华清宫' },
    { content: '露沾薇省白，秋入蓼花红', author: '徐铉', source: '和王员外雪晴早朝' },
    { content: '风清听露惊，月静看花落', author: '谢朓', source: '游东堂咏桐诗' },
    { content: '露浓香径湿，花重锦官城', author: '杜甫', source: '春夜喜雨' },
    { content: '一枝秾艳露凝香，云雨巫山枉断肠', author: '李白', source: '清平调其二' },
    { content: '露华兰叶参差，春尽秋千院落', author: '晏几道', source: '清平乐' },
    { content: '露井桃花发，双双燕并飞', author: '李白', source: '宫中行乐词' },
    { content: '露气闻芳杜，歌声识采莲', author: '孟浩然', source: '渡扬子江' },
    { content: '露如微霰下前池，月过回塘万竹悲', author: '李商隐', source: '曲池' },
    { content: '露湿晴花春殿香，月明歌吹在昭阳', author: '李益', source: '宫怨' },
    { content: '露凝千片玉，蝉散一长枝', author: '李世民', source: '咏蝉' },
    { content: '露冕新承明主恩，山城别是武陵源', author: '刘长卿', source: '送台州李使君' },
    { content: '露下庭柯蝉响歇，纱碧如烟，烟里玲珑月', author: '周邦彦', source: '蝶恋花' },
    { content: '露条烟叶，惹长亭旧别', author: '刘一止', source: '喜迁莺·晓行' },
    { content: '露罥蛛丝，小楼阴堕月', author: '吴文英', source: '齐天乐·与冯深居登禹陵' },
    { content: '露蛩悲，青灯冷屋，翻书愁上鬓毛白', author: '洪咨夔', source: '满江红·中秋寄远' },
    { content: '露零难辨，星疏可数，人在水晶宫里', author: '晁补之', source: '永遇乐' },
    { content: '露桥闻笛，沉思前事，似梦里，泪暗滴', author: '周邦彦', source: '兰陵王·柳' },
    { content: '露洗华桐，烟霏丝柳，绿阴摇曳，荡春一色', author: '万俟咏', source: '三台·清明应制' },
    { content: '露叶翻翻，风枝袅袅，无限离情苦绪', author: '袁去华', source: '剑器近' }
  ],
  // 7. 雾
  7: [
    { content: '雾失楼台，月迷津渡', author: '秦观', source: '踏莎行·郴州旅舍' },
    { content: '日照香炉生紫烟，遥看瀑布挂前川', author: '李白', source: '望庐山瀑布' },
    { content: '烟笼寒水月笼沙，夜泊秦淮近酒家', author: '杜牧', source: '泊秦淮' },
    { content: '斜月沉沉藏海雾，碣石潇湘无限路', author: '张若虚', source: '春江花月夜' },
    { content: '雾縠云鬟，朝朝暮暮，阳台之下', author: '宋玉', source: '高唐赋' },
    { content: '晓雾将歇，猿鸟乱鸣', author: '陶弘景', source: '答谢中书书' },
    { content: '雾树溟潆叫乱鸦，湿云初变早来霞', author: '德元', source: '晓日' },
    { content: '雾青山影见，浪白雨声来', author: '刘长卿', source: '雨中登沛县楼' },
    { content: '雾暗长堤景，凄风故国心', author: '宋之问', source: '晚泊湘江' },
    { content: '雾披虎豹穴，水入鼋鼍宫', author: '宋之问', source: '始安秋日' },
    { content: '雾卷天山静，烟消太史空', author: '李世民', source: '赋秋日悬清光赐房玄龄' },
    { content: '雾交才洒地，风逆旋随篙', author: '杜甫', source: '渡江' },
    { content: '雾雨晦争泄，波涛怒相投', author: '韩愈', source: '洞庭湖阻风赠张十一署' },
    { content: '雾露晨侵骑，星霜夜满衣', author: '张籍', source: '送蛮客' },
    { content: '雾树行相引，莲峰望忽开', author: '元稹', source: '遣悲怀' },
    { content: '雾幌拂云旌，风轩度月明', author: '许浑', source: '游维山新兴寺' },
    { content: '雾色侵虚牖，霜华冷画屏', author: '温庭筠', source: '宿白盖峰寺寄僧' },
    { content: '雾浓烟重重，水远山长长', author: '白居易', source: '新乐府·上阳白发人' },
    { content: '雾晓起凫雁，日晚下牛羊', author: '杜牧', source: '郡斋独酌' },
    { content: '雾开虎豹文姿出，松隐龙蛇怪状孤', author: '张祜', source: '题朱兵部山居' },
    { content: '雾雨不成点，映空疑有无', author: '苏轼', source: '雨' },
    { content: '雾重千峰失，潮平两岸宽', author: '王湾', source: '次北固山下' },
    { content: '雾隐平郊树，风含广岸波', author: '杜甫', source: '暮春题瀼西新赁草屋' },
    { content: '雾昏临水寺，风急卷潮来', author: '刘禹锡', source: '始发富春' },
    { content: '雾薄云鬟湿，风清玉臂凉', author: '杜甫', source: '月夜' }
  ],
  // 8. 雷
  8: [
    { content: '雷声千嶂落，雨色万峰来', author: '李攀龙', source: '广阳山道中' },
    { content: '雷填风飒兮木萧萧，思公子兮徒离忧', author: '屈原', source: '山鬼' },
    { content: '雷车驾雨龙尽起，电行半空如狂矢', author: '陆游', source: '五月得雨稻苗尽立' },
    { content: '雷声忽送千峰雨，花气浑如百和香', author: '杜甫', source: '即事' },
    { content: '雷惊稚子笋，雨足妇姑蚕', author: '黄庭坚', source: '登快阁' },
    { content: '雷斧劈开山骨裂，电鞭抽断海腰长', author: '刘禹锡', source: '浪淘沙' },
    { content: '雷隐隐，感妾心，倾耳清听非车音', author: '傅玄', source: '杂言诗' },
    { content: '雷风有约春将半，桃李无言日正长', author: '陆游', source: '春日' },
    { content: '雷动风行惊蛰户，天开地辟转鸿钧', author: '陆游', source: '春晴泛舟' },
    { content: '雷光飞破天地昏，掣电挥戈争日月', author: '辛弃疾', source: '贺新郎' },
    { content: '雷声半夜驱龙起，雨脚千山送鹤归', author: '范成大', source: '题画卷' },
    { content: '雷惊雨洒一时苏，云压霜摧半年病', author: '范成大', source: '次韵时叙赋乐先生新居' },
    { content: '雷霆日已远，云雨竟何之', author: '杜甫', source: '过津口' },
    { content: '雷雨窈冥而未半，皦日笼光於绮寮', author: '左思', source: '蜀都赋' },
    { content: '雷鼓嘈嘈喧武昌，云旗猎猎过寻阳', author: '李白', source: '永王东巡歌' },
    { content: '雷风一啸天地春，元气淋漓障犹湿', author: '杜甫', source: '奉先刘少府新画山水障歌' },
    { content: '雷头风尾俱不忌，铁面冰霜那得热', author: '杨万里', source: '戏题》' },
    { content: '雷声送春归，雨气排夏来', author: '杨万里', source: '夏日杂兴》' },
    { content: '雷动三春蛰，涛翻八月秋', author: '刘禹锡', source: '送工部萧郎中刑部李郎中并以本官兼中丞分命充京西京北覆粮使' },
    { content: '雷池一过眼如新，雪浪翻空面面匀', author: '杨万里', source: '过扬子江' },
    { content: '雷塘风吹水色绿，檀娘唱尽歌行曲', author: '温庭筠', source: '蒋侯神歌' },
    { content: '雷辊夫差国，云翻海若家', author: '范成大', source: '次韵时叙赋乐先生新居' },
    { content: '雷斧劈开千仞壁，电鞭抽出半天云', author: '元好问', source: '台山杂咏' },
    { content: '雷惊电激语难闻，势挟风涛日夜闻', author: '苏轼', source: '八月七日初入赣过惶恐滩' },
    { content: '雷塘水乾禾黍满，宝钗耕出余鸾龙', author: '刘禹锡', source: '和浙西李大夫晚下北固山' }
  ],
  // 9. 晴
  9: [
    { content: '晴空一鹤排云上，便引诗情到碧霄', author: '刘禹锡', source: '秋词' },
    { content: '水光潋滟晴方好，山色空蒙雨亦奇', author: '苏轼', source: '饮湖上初晴后雨' },
    { content: '两岸青山相对出，孤帆一片日边来', author: '李白', source: '望天门山' },
    { content: '白日依山尽，黄河入海流', author: '王之涣', source: '登鹳雀楼' },
    { content: '日出江花红胜火，春来江水绿如蓝', author: '白居易', source: '忆江南' },
    { content: '两个黄鹂鸣翠柳，一行白鹭上青天', author: '杜甫', source: '绝句' },
    { content: '千里莺啼绿映红，水村山郭酒旗风', author: '杜牧', source: '江南春' },
    { content: '竹外桃花三两枝，春江水暖鸭先知', author: '苏轼', source: '惠崇春江晚景' },
    { content: '等闲识得东风面，万紫千红总是春', author: '朱熹', source: '春日' },
    { content: '春风得意马蹄疾，一日看尽长安花', author: '孟郊', source: '登科后' },
    { content: '胜日寻芳泗水滨，无边光景一时新', author: '朱熹', source: '春日' },
    { content: '草长莺飞二月天，拂堤杨柳醉春烟', author: '高鼎', source: '村居' },
    { content: '接天莲叶无穷碧，映日荷花别样红', author: '杨万里', source: '晓出净慈寺送林子方' },
    { content: '绿树村边合，青山郭外斜', author: '孟浩然', source: '过故人庄' },
    { content: '大漠孤烟直，长河落日圆', author: '王维', source: '使至塞上' },
    { content: '日照香炉生紫烟，遥看瀑布挂前川', author: '李白', source: '望庐山瀑布' },
    { content: '朝辞白帝彩云间，千里江陵一日还', author: '李白', source: '早发白帝城' },
    { content: '孤帆远影碧空尽，唯见长江天际流', author: '李白', source: '黄鹤楼送孟浩然之广陵' },
    { content: '落霞与孤鹜齐飞，秋水共长天一色', author: '王勃', source: '滕王阁序' },
    { content: '明月松间照，清泉石上流', author: '王维', source: '山居秋暝' },
    { content: '天街小雨润如酥，草色遥看近却无', author: '韩愈', source: '早春呈水部张十八员外' },
    { content: '最是一年春好处，绝胜烟柳满皇都', author: '韩愈', source: '早春呈水部张十八员外' },
    { content: '日长睡起无情思，闲看儿童捉柳花', author: '杨万里', source: '闲居初夏午睡起' },
    { content: '梅子金黄杏子肥，麦花雪白菜花稀', author: '范成大', source: '四时田园杂兴' },
    { content: '桃花流水鳜鱼肥，青箬笠绿蓑衣斜风细雨不须归', author: '张志和', source: '渔歌子' }
  ],
  // 10. 阴
  10: [
    { content: '山雨欲来风满楼，溪云初起日沉阁', author: '许浑', source: '咸阳城西楼晚眺' },
    { content: '黑云压城城欲摧，甲光向日金鳞开', author: '李贺', source: '雁门太守行' },
    { content: '总为浮云能蔽日，长安不见使人愁', author: '李白', source: '登金陵凤凰台' },
    { content: '不畏浮云遮望眼，自缘身在最高层', author: '王安石', source: '登飞来峰' },
    { content: '云横秦岭家何在，雪拥蓝关马不前', author: '韩愈', source: '左迁至蓝关示侄孙湘' },
    { content: '瀚海阑干百丈冰，愁云惨淡万里凝', author: '岑参', source: '白雪歌送武判官归京' },
    { content: '野径云俱黑，江船火独明', author: '杜甫', source: '春夜喜雨' },
    { content: '俄顷风定云墨色，秋天漠漠向昏黑', author: '杜甫', source: '茅屋为秋风所破歌' },
    { content: '千里黄云白日曛，北风吹雁雪纷纷', author: '高适', source: '别董大' },
    { content: '天平山上白云泉，云自无心水自闲', author: '白居易', source: '白云泉' },
    { content: '行到水穷处，坐看云起时', author: '王维', source: '终南别业' },
    { content: '只在此山中，云深不知处', author: '贾岛', source: '寻隐者不遇' },
    { content: '曾经沧海难为水，除却巫山不是云', author: '元稹', source: '离思' },
    { content: '浮云游子意，落日故人情', author: '李白', source: '送友人' },
    { content: '黄鹤一去不复返，白云千载空悠悠', author: '崔颢', source: '黄鹤楼' },
    { content: '云青青兮欲雨，水澹澹兮生烟', author: '李白', source: '梦游天姥吟留别' },
    { content: '明月出天山，苍茫云海间', author: '李白', source: '关山月' },
    { content: '月下飞天镜，云生结海楼', author: '李白', source: '渡荆门送别' },
    { content: '气蒸云梦泽，波撼岳阳城', author: '孟浩然', source: '望洞庭湖赠张丞相' },
    { content: '众鸟高飞尽，孤云独去闲', author: '李白', source: '独坐敬亭山' },
    { content: '锦江春色来天地，玉垒浮云变古今', author: '杜甫', source: '登楼' },
    { content: '白云回望合，青霭入看无', author: '王维', source: '终南山' },
    { content: '云开远见汉阳城，犹是孤帆一日程', author: '卢纶', source: '晚次鄂州' },
    { content: '云来气接巫峡长，月出寒通雪山白', author: '杜甫', source: '古柏行' },
    { content: '云移雉尾开宫扇，日绕龙鳞识圣颜', author: '杜甫', source: '秋兴八首' }
  ]
}

async function createWeatherPoetryTable() {
  try {
    console.log('=== 创建天气诗句表 ===\n')

    // 初始化数据库
    await initDatabase()
    console.log('数据库连接成功\n')

    // 创建天气诗句表
    console.log('1. 创建天气诗句表...')
    await query(`
      CREATE TABLE IF NOT EXISTS weather_poetry (
        id INT PRIMARY KEY AUTO_INCREMENT COMMENT '主键 ID',
        weather_type TINYINT NOT NULL COMMENT '天气类型：1=风，2=云，3=雨，4=雪，5=霜，6=露，7=雾，8=雷，9=晴，10=阴',
        weather_name VARCHAR(10) NOT NULL COMMENT '天气类型名称',
        content VARCHAR(255) NOT NULL COMMENT '诗句内容',
        author VARCHAR(100) NOT NULL COMMENT '作者',
        source VARCHAR(100) COMMENT '出处',
        is_featured TINYINT DEFAULT 0 COMMENT '是否精选',
        usage_count INT DEFAULT 0 COMMENT '使用次数',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_weather_type (weather_type),
        INDEX idx_featured (is_featured)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='天气诗句表'
    `)
    console.log('   表创建成功\n')

    // 检查是否已有数据
    const existing = await query('SELECT COUNT(*) as count FROM weather_poetry')
    if (existing[0].count > 0) {
      console.log(`已存在 ${existing[0].count} 条数据，跳过导入\n`)
      return
    }

    // 插入数据
    console.log('2. 导入天气诗句数据...')
    let totalCount = 0

    for (const [weatherType, poems] of Object.entries(WEATHER_POETRY_DATA)) {
      const weatherName = WEATHER_TYPES[weatherType]
      console.log(`   导入【${weatherName}】类诗句 ${poems.length} 条...`)

      for (const poem of poems) {
        await query(
          `INSERT INTO weather_poetry (weather_type, weather_name, content, author, source)
           VALUES (?, ?, ?, ?, ?)`,
          [parseInt(weatherType), weatherName, poem.content, poem.author, poem.source]
        )
        totalCount++
      }
    }

    console.log(`\n数据导入完成！共 ${totalCount} 条诗句`)
    console.log('\n天气类型分布:')

    const stats = await query(`
      SELECT weather_name, COUNT(*) as count
      FROM weather_poetry
      GROUP BY weather_type, weather_name
      ORDER BY weather_type
    `)
    console.table(stats)

  } catch (error) {
    console.error('错误:', error)
    throw error
  }
}

// 运行脚本
createWeatherPoetryTable().then(() => {
  console.log('\n脚本执行完成')
  process.exit(0)
}).catch(err => {
  console.error('脚本执行失败:', err)
  process.exit(1)
})
