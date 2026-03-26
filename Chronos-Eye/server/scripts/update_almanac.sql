-- 为现有 almanac_data 表添加新字段
ALTER TABLE almanac_data
ADD COLUMN wuxing VARCHAR(50) COMMENT '五行' AFTER rating,
ADD COLUMN xingxiu VARCHAR(50) COMMENT '二十八星宿' AFTER wuxing,
ADD COLUMN caishen VARCHAR(50) COMMENT '财神方位' AFTER xingxiu,
ADD COLUMN fushen VARCHAR(50) COMMENT '福神方位' AFTER caishen,
ADD COLUMN xishen VARCHAR(50) COMMENT '喜神方位' AFTER fushen,
ADD COLUMN yanggui VARCHAR(50) COMMENT '阳贵神方位' AFTER xishen,
ADD COLUMN yingui VARCHAR(50) COMMENT '阴贵神方位' AFTER yanggui,
ADD COLUMN taishen VARCHAR(100) COMMENT '胎神方位' AFTER yingui,
ADD COLUMN jianchu VARCHAR(20) COMMENT '建除十二神' AFTER taishen,
ADD COLUMN jishen TEXT COMMENT '吉神宜趋' AFTER jianchu,
ADD COLUMN xiongshen TEXT COMMENT '凶神宜忌' AFTER jishen,
ADD COLUMN pengzu VARCHAR(200) COMMENT '彭祖百忌' AFTER xiongshen,
ADD COLUMN huangdi_year INT COMMENT '黄帝纪元年份' AFTER pengzu;

-- 更新 2026 年 3 月的黄历数据（完整数据）
UPDATE almanac_data SET
  wuxing = '沙中金',
  xingxiu = '胃土雉',
  caishen = '东北',
  fushen = '正北',
  xishen = '东北',
  yanggui = '西南',
  yingui = '正南',
  taishen = '占门碓房内北',
  jianchu = '收日',
  jishen = '月德 时德 民日 益后 金匮 鸣吠',
  xiongshen = '河魁 死神 天吏 致死',
  pengzu = '壬不泱水更难提防 戌不吃犬作怪上床',
  huangdi_year = 4723
WHERE date = '2026-03-17';

UPDATE almanac_data SET
  wuxing = '海中金',
  xingxiu = '昴日鸡',
  caishen = '正东',
  fushen = '东北',
  xishen = '西北',
  yanggui = '东北',
  yingui = '西南',
  taishen = '栖门厕所龟房北',
  jianchu = '开日',
  jishen = '天德 月德 天恩 宽厚',
  xiongshen = '天牢 黑道',
  pengzu = '癸不词讼理弱敌强 亥不嫁娶不利新郎',
  huangdi_year = 4723
WHERE date = '2026-03-18';

UPDATE almanac_data SET
  wuxing = '海中金',
  xingxiu = '毕月乌',
  caishen = '西南',
  fushen = '西南',
  xishen = '东南',
  yanggui = '正东',
  yingui = '正东',
  taishen = '占门床房内南',
  jianchu = '闭日',
  jishen = '月恩 四相 相日 天后 天巫 福德 普护',
  xiongshen = '元武 复日',
  pengzu = '甲不开仓财物耗散 子不问卜自惹祸殃',
  huangdi_year = 4723
WHERE date = '2026-03-19';

UPDATE almanac_data SET
  wuxing = '炉中火',
  xingxiu = '觜火猴',
  caishen = '正西',
  fushen = '西北',
  xishen = '西南',
  yanggui = '正西',
  yingui = '西北',
  taishen = '厨灶栖房内南',
  jianchu = '建日',
  jishen = '天恩 阳德 三合 天喜 天医',
  xiongshen = '朱雀 月破',
  pengzu = '乙不栽植千株不长 丑不冠带主不还乡',
  huangdi_year = 4723
WHERE date = '2026-03-20';

UPDATE almanac_data SET
  wuxing = '炉中火',
  xingxiu = '参水猿',
  caishen = '东北',
  fushen = '正北',
  xishen = '东北',
  yanggui = '西南',
  yingui = '正南',
  taishen = '占门碓房内北',
  jianchu = '除日',
  jishen = '月空 天恩 要安 金堂',
  xiongshen = '天刑',
  pengzu = '丙不修灶必见灾殃 寅不祭祀神鬼不尝',
  huangdi_year = 4723
WHERE date = '2026-03-21';

UPDATE almanac_data SET
  wuxing = '大林木',
  xingxiu = '井木犴',
  caishen = '正东',
  fushen = '东北',
  xishen = '西北',
  yanggui = '东北',
  yingui = '西南',
  taishen = '栖门厕所龟房北',
  jianchu = '满日',
  jishen = '天德合 月德合 天赦 天愿',
  xiongshen = '勾陈',
  pengzu = '丁不剃头头必生疮 卯不穿井水泉不香',
  huangdi_year = 4723
WHERE date = '2026-03-22';

UPDATE almanac_data SET
  wuxing = '大林木',
  xingxiu = '鬼金羊',
  caishen = '西南',
  fushen = '西南',
  xishen = '东南',
  yanggui = '正东',
  yingui = '正东',
  taishen = '占门床房内南',
  jianchu = '平日',
  jishen = '天恩 三合 天喜 天医 天德',
  xiongshen = '青龙',
  pengzu = '戊不受田田主不祥 辰不哭泣必主重丧',
  huangdi_year = 4723
WHERE date = '2026-03-23';

UPDATE almanac_data SET
  wuxing = '路旁土',
  xingxiu = '柳土獐',
  caishen = '正西',
  fushen = '西北',
  xishen = '西南',
  yanggui = '正西',
  yingui = '西北',
  taishen = '厨灶栖房内南',
  jianchu = '定日',
  jishen = '天愿 天赦 天福',
  xiongshen = '明堂',
  pengzu = '己不破券二比并亡 巳不远行财物伏藏',
  huangdi_year = 4723
WHERE date = '2026-03-24';

UPDATE almanac_data SET
  wuxing = '路旁土',
  xingxiu = '星日马',
  caishen = '东北',
  fushen = '正北',
  xishen = '东北',
  yanggui = '西南',
  yingui = '正南',
  taishen = '占门碓房内北',
  jianchu = '执日',
  jishen = '四相 天德 月德 天恩',
  xiongshen = '天刑',
  pengzu = '庚不经络织机虚张 午不苫盖屋主更张',
  huangdi_year = 4723
WHERE date = '2026-03-25';

UPDATE almanac_data SET
  wuxing = '剑锋金',
  xingxiu = '张月鹿',
  caishen = '正东',
  fushen = '东北',
  xishen = '西北',
  yanggui = '东北',
  yingui = '西南',
  taishen = '栖门厕所龟房北',
  jianchu = '破日',
  jishen = '天恩 天月二合 天医',
  xiongshen = '朱雀 岁破',
  pengzu = '辛不合酱主人不尝 未不服药毒气入肠',
  huangdi_year = 4723
WHERE date = '2026-03-26';

UPDATE almanac_data SET
  wuxing = '剑锋金',
  xingxiu = '翼火蛇',
  caishen = '西南',
  fushen = '西南',
  xishen = '东南',
  yanggui = '正东',
  yingui = '正东',
  taishen = '占门床房内南',
  jianchu = '危日',
  jishen = '天恩 天喜 天医 天贵',
  xiongshen = '天牢',
  pengzu = '壬不泱水更难提防 申不安床鬼祟入房',
  huangdi_year = 4723
WHERE date = '2026-03-27';

UPDATE almanac_data SET
  wuxing = '山头火',
  xingxiu = '轸水蚓',
  caishen = '正西',
  fushen = '西北',
  xishen = '西南',
  yanggui = '正西',
  yingui = '西北',
  taishen = '厨灶栖房内南',
  jianchu = '成日',
  jishen = '天恩 三合 天喜 天医 天德',
  xiongshen = '玄武',
  pengzu = '癸不词讼理弱敌强 酉不宴客醉坐颠狂',
  huangdi_year = 4723
WHERE date = '2026-03-28';

UPDATE almanac_data SET
  wuxing = '山头火',
  xingxiu = '角木蛟',
  caishen = '东北',
  fushen = '正北',
  xishen = '东北',
  yanggui = '西南',
  yingui = '正南',
  taishen = '占门碓房内北',
  jianchu = '收日',
  jishen = '月恩 四相 相日',
  xiongshen = '司命',
  pengzu = '甲不开仓财物耗散 戌不吃犬作怪上床',
  huangdi_year = 4723
WHERE date = '2026-03-29';

UPDATE almanac_data SET
  wuxing = '涧下水',
  xingxiu = '亢金龙',
  caishen = '正东',
  fushen = '东北',
  xishen = '西北',
  yanggui = '东北',
  yingui = '西南',
  taishen = '栖门厕所龟房北',
  jianchu = '开日',
  jishen = '天德 月德 天恩 宽厚',
  xiongshen = '勾陈',
  pengzu = '乙不栽植千株不长 亥不嫁娶不利新郎',
  huangdi_year = 4723
WHERE date = '2026-03-30';

UPDATE almanac_data SET
  wuxing = '涧下水',
  xingxiu = '氐土貉',
  caishen = '西南',
  fushen = '西南',
  xishen = '东南',
  yanggui = '正东',
  yingui = '正东',
  taishen = '占门床房内南',
  jianchu = '闭日',
  jishen = '月恩 四相 相日 天后 天巫 福德',
  xiongshen = '青龙',
  pengzu = '丙不修灶必见灾殃 子不问卜自惹祸殃',
  huangdi_year = 4723
WHERE date = '2026-03-31';
