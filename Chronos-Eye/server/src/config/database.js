require('dotenv').config()
const mysql = require('mysql2')
const path = require('path')
const logger = require('../utils/logger')

// MySQL 配置
const mysqlConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'chronos_eye',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}

let mysqlPool = null

// SQL 建表语句
const createTablesSQL = `
  CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    openid VARCHAR(255) UNIQUE NOT NULL,
    unionid VARCHAR(255),
    nickname VARCHAR(255),
    avatar VARCHAR(500),
    phone VARCHAR(20),
    gender INT DEFAULT 0,
    birthday DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )
`

const createHolidaysSQL = `
  CREATE TABLE IF NOT EXISTS holidays (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL,
    date_month INT,
    date_day INT,
    date_full DATE,
    lunar_month INT,
    lunar_day INT,
    is_leap INT DEFAULT 0,
    duration INT DEFAULT 1,
    is_official INT DEFAULT 0,
    official_days INT DEFAULT 0,
    description TEXT,
    customs TEXT,
    is_active INT DEFAULT 1,
    tip TEXT COMMENT '放假调休说明',
    remark TEXT COMMENT '调休上班日期',
    wage TEXT COMMENT '三倍工资日期',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )
`

const createUserCountdownsSQL = `
  CREATE TABLE IF NOT EXISTS user_countdowns (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    holiday_id INT,
    custom_name VARCHAR(100),
    custom_date DATE,
    custom_type VARCHAR(20) DEFAULT 'solar',
    custom_lunar_month INT,
    custom_lunar_day INT,
    is_recurring INT DEFAULT 0,
    reminder_days INT DEFAULT 1,
    is_enabled INT DEFAULT 1,
    sort_order INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_enabled (is_enabled)
  )
`

const createSchedulesSQL = `
  CREATE TABLE IF NOT EXISTS schedules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    is_all_day INT DEFAULT 0,
    repeat_type VARCHAR(20) DEFAULT 'none',
    repeat_end DATE,
    reminder_enabled INT DEFAULT 1,
    reminder_minutes INT DEFAULT 30,
    priority VARCHAR(20) DEFAULT 'normal',
    status VARCHAR(20) DEFAULT 'pending',
    completed_at DATETIME,
    color VARCHAR(20) DEFAULT '#667eea',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_start_time (start_time),
    INDEX idx_status (status)
  )
`

const createHistoryEventsSQL = `
  CREATE TABLE IF NOT EXISTS history_events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    month INT NOT NULL,
    day INT NOT NULL,
    year INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'other',
    country VARCHAR(10),
    is_featured INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_month_day (month, day),
    INDEX idx_category (category),
    INDEX idx_featured (is_featured)
  )
`

const createAlmanacDataSQL = `
  CREATE TABLE IF NOT EXISTS almanac_data (
    id INT PRIMARY KEY AUTO_INCREMENT,
    date DATE UNIQUE NOT NULL,
    lunar_year INT,
    lunar_month INT,
    lunar_day INT,
    ganzhi_year VARCHAR(20),
    ganzhi_month VARCHAR(20),
    ganzhi_day VARCHAR(20),
    zodiac VARCHAR(20),
    yi TEXT,
    ji TEXT,
    shen_sha VARCHAR(100),
    lucky_time VARCHAR(100),
    conflict_zodiac VARCHAR(20),
    lucky_direction VARCHAR(50),
    lucky_color VARCHAR(50),
    lucky_number VARCHAR(50),
    rating INT DEFAULT 3,
    -- 新增字段
    wuxing VARCHAR(50) COMMENT '五行',
    xingxiu VARCHAR(50) COMMENT '二十八星宿',
    caishen VARCHAR(50) COMMENT '财神方位',
    fushen VARCHAR(50) COMMENT '福神方位',
    xishen VARCHAR(50) COMMENT '喜神方位',
    yanggui VARCHAR(50) COMMENT '阳贵神方位',
    yingui VARCHAR(50) COMMENT '阴贵神方位',
    taishen VARCHAR(100) COMMENT '胎神方位',
    jianchu VARCHAR(20) COMMENT '建除十二神',
    jishen TEXT COMMENT '吉神宜趋',
    xiongshen TEXT COMMENT '凶神宜忌',
    pengzu VARCHAR(200) COMMENT '彭祖百忌',
    huangdi_year INT COMMENT '黄帝纪元年份',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_date (date)
  )
`

const createAlmanacTermsSQL = `
  CREATE TABLE IF NOT EXISTS almanac_terms (
    id INT PRIMARY KEY AUTO_INCREMENT,
    term_name VARCHAR(50) NOT NULL,
    term_order INT NOT NULL,
    lunar_month INT,
    lunar_day INT,
    origin TEXT,
    phenology TEXT,
    customs TEXT,
    health_tips TEXT,
    poetry VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_term_name (term_name)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='二十四节气百科表'
`

const createAlmanacTermDatesSQL = `
  CREATE TABLE IF NOT EXISTS almanac_term_dates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    year INT NOT NULL,
    term_name VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    time VARCHAR(10) DEFAULT '00:00',
    week INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_year_term (year, term_name),
    INDEX idx_date (date)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='二十四节气日期表'
`

const createUserMarkedDatesSQL = `
  CREATE TABLE IF NOT EXISTS user_marked_dates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    type VARCHAR(50) DEFAULT 'birthday',
    remark TEXT,
    photo VARCHAR(500),
    is_important INT DEFAULT 0,
    is_recurring INT DEFAULT 0,
    reminder_enabled INT DEFAULT 1,
    reminder_days INT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_date (date)
  )
`

const createConstellationFortuneSQL = `
  CREATE TABLE IF NOT EXISTS constellation_fortune (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键 ID',
    date DATE NOT NULL COMMENT '日期',
    sign VARCHAR(20) NOT NULL COMMENT '星座英文名',
    sign_name VARCHAR(10) NOT NULL COMMENT '星座中文名',
    -- 今日运势指数 (0-100)
    overall INT DEFAULT 0 COMMENT '综合指数',
    love INT DEFAULT 0 COMMENT '爱情指数',
    work INT DEFAULT 0 COMMENT '工作指数',
    wealth INT DEFAULT 0 COMMENT '财富指数',
    health INT DEFAULT 0 COMMENT '健康指数',
    -- 幸运元素
    lucky_color VARCHAR(50) DEFAULT NULL COMMENT '幸运颜色',
    lucky_number INT DEFAULT NULL COMMENT '幸运数字',
    lucky_direction VARCHAR(50) DEFAULT NULL COMMENT '幸运方位',
    match_sign VARCHAR(20) DEFAULT NULL COMMENT '贵人星座',
    -- 运势描述
    summary TEXT COMMENT '今日概述',
    yi TEXT COMMENT '宜',
    ji TEXT COMMENT '忌',
    -- 周运指数 (0-100)
    week_overall INT DEFAULT 0 COMMENT '周综合指数',
    week_love INT DEFAULT 0 COMMENT '周爱情指数',
    week_work INT DEFAULT 0 COMMENT '周工作指数',
    week_wealth INT DEFAULT 0 COMMENT '周财富指数',
    week_health INT DEFAULT 0 COMMENT '周健康指数',
    week_summary TEXT COMMENT '周运势概述',
    week_lucky_color VARCHAR(50) DEFAULT NULL COMMENT '周幸运颜色',
    week_lucky_number INT DEFAULT NULL COMMENT '周幸运数字',
    -- 月运指数 (0-100)
    month_overall INT DEFAULT 0 COMMENT '月综合指数',
    month_love INT DEFAULT 0 COMMENT '月爱情指数',
    month_work INT DEFAULT 0 COMMENT '月工作指数',
    month_wealth INT DEFAULT 0 COMMENT '月财富指数',
    month_health INT DEFAULT 0 COMMENT '月健康指数',
    month_summary TEXT COMMENT '月运势概述',
    month_lucky_color VARCHAR(50) DEFAULT NULL COMMENT '月幸运颜色',
    month_lucky_number INT DEFAULT NULL COMMENT '月幸运数字',
    -- 年运指数 (0-100)
    year_overall INT DEFAULT 0 COMMENT '年综合指数',
    year_love INT DEFAULT 0 COMMENT '年爱情指数',
    year_work INT DEFAULT 0 COMMENT '年工作指数',
    year_wealth INT DEFAULT 0 COMMENT '年财富指数',
    year_health INT DEFAULT 0 COMMENT '年健康指数',
    year_summary TEXT COMMENT '年运势概述',
    -- 时间戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_date_sign (date, sign),
    INDEX idx_date (date)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='星座运势表'
`

const createConstellationMatchSQL = `
  CREATE TABLE IF NOT EXISTS constellation_match (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键 ID',
    sign1 VARCHAR(20) NOT NULL COMMENT '第一个星座（英文名）',
    sign2 VARCHAR(20) NOT NULL COMMENT '第二个星座（英文名）',
    sign1_name VARCHAR(20) NOT NULL COMMENT '第一个星座中文名',
    sign2_name VARCHAR(20) NOT NULL COMMENT '第二个星座中文名',
    title VARCHAR(100) DEFAULT NULL COMMENT '标题',
    grade TEXT COMMENT '点评（友情、爱情、婚姻、亲情评分）',
    content TEXT COMMENT '配对内容解说',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_sign1_sign2 (sign1, sign2),
    INDEX idx_sign1 (sign1),
    INDEX idx_sign2 (sign2)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='星座配对表'
`

const createOilProvincePriceSQL = `
  CREATE TABLE IF NOT EXISTS oil_province_price (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '主键 ID',
    province VARCHAR(20) NOT NULL COMMENT '省份名称',
    province_code VARCHAR(20) NOT NULL COMMENT '省份代码',
    price_89 DECIMAL(5,2) COMMENT '89 号汽油价格',
    price_92 DECIMAL(5,2) COMMENT '92 号汽油价格',
    price_95 DECIMAL(5,2) COMMENT '95 号汽油价格',
    price_98 DECIMAL(5,2) COMMENT '98 号汽油价格',
    price_0 DECIMAL(5,2) COMMENT '0 号柴油价格',
    change_89 DECIMAL(5,2) COMMENT '89 号涨幅',
    change_92 DECIMAL(5,2) COMMENT '92 号涨幅',
    change_95 DECIMAL(5,2) COMMENT '95 号涨幅',
    change_98 DECIMAL(5,2) COMMENT '98 号涨幅',
    change_0 DECIMAL(5,2) COMMENT '0 号涨幅',
    price_date DATE NOT NULL COMMENT '数据日期',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_province_date (province_code, price_date),
    INDEX idx_province (province)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='全国各省油价数据表'
`

const createOilInternationalSQL = `
  CREATE TABLE IF NOT EXISTS oil_international (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '主键 ID',
    oil_name VARCHAR(50) NOT NULL COMMENT '油品名称',
    price DECIMAL(10,2) COMMENT '最新价格',
    \`change\` DECIMAL(10,2) COMMENT '涨跌额',
    change_percent VARCHAR(20) COMMENT '涨跌幅',
    prev_close DECIMAL(10,2) COMMENT '昨收',
    high DECIMAL(10,2) COMMENT '最高',
    low DECIMAL(10,2) COMMENT '最低',
    update_time DATETIME COMMENT '更新时间',
    data_date DATE NOT NULL COMMENT '数据日期',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY uk_oil_date (oil_name, data_date),
    INDEX idx_oil_name (oil_name),
    INDEX idx_data_date (data_date)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='国际原油价格表'
`

const createOilAdjustmentHistorySQL = `
  CREATE TABLE IF NOT EXISTS oil_adjustment_history (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '主键 ID',
    \`rank\` INT COMMENT '排名',
    adjust_date DATE NOT NULL COMMENT '调整日期',
    gasoline_price INT COMMENT '汽油价格 (元/吨)',
    gasoline_change INT COMMENT '汽油涨跌 (元/吨)',
    diesel_price INT COMMENT '柴油价格 (元/吨)',
    diesel_change INT COMMENT '柴油涨跌 (元/吨)',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_adjust_date (adjust_date),
    INDEX idx_gasoline (gasoline_price),
    INDEX idx_diesel (diesel_price)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='油价调整历史表'
`

const createOilProvincePriceLatestSQL = `
  CREATE TABLE IF NOT EXISTS oil_province_price_latest (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '主键 ID',
    province VARCHAR(20) NOT NULL COMMENT '省份名称',
    province_code VARCHAR(20) NOT NULL UNIQUE COMMENT '省份代码 (如 beijing、shanghai)',
    price_89 DECIMAL(5,2) COMMENT '89 号汽油价格',
    price_92 DECIMAL(5,2) COMMENT '92 号汽油价格',
    price_95 DECIMAL(5,2) COMMENT '95 号汽油价格',
    price_98 DECIMAL(5,2) COMMENT '98 号汽油价格',
    price_0 DECIMAL(5,2) COMMENT '0 号柴油价格',
    change_89 VARCHAR(20) COMMENT '89 号涨幅',
    change_92 VARCHAR(20) COMMENT '92 号涨幅',
    change_95 VARCHAR(20) COMMENT '95 号涨幅',
    change_98 VARCHAR(20) COMMENT '98 号涨幅',
    change_0 VARCHAR(20) COMMENT '0 号涨幅',
    price_date DATE NOT NULL COMMENT '数据日期',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_province (province),
    INDEX idx_price_date (price_date)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='全国各省最新油价表'
`

const createTiangouDiarySQL = `
  CREATE TABLE IF NOT EXISTS tiangou_diary (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '主键 ID',
    content TEXT NOT NULL COMMENT '舔狗日记内容',
    source VARCHAR(50) DEFAULT 'tianapi' COMMENT '数据来源',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_created_at (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='舔狗日记表'
`

const createWorkerDiarySQL = `
  CREATE TABLE IF NOT EXISTS worker_diary (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '主键 ID',
    content TEXT NOT NULL COMMENT '打工者日记内容',
    source VARCHAR(50) DEFAULT 'manual' COMMENT '数据来源',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_created_at (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='打工者日记表'
`

// 初始化 MySQL 数据库
async function initMySQL() {
  try {
    mysqlPool = mysql.createPool(mysqlConfig)

    // 测试连接
    const connection = await mysqlPool.promise().getConnection()
    logger.log('MySQL 数据库连接成功')

    // 创建表
    await connection.query(createTablesSQL)
    await connection.query(createHolidaysSQL)
    await connection.query(createUserCountdownsSQL)
    await connection.query(createSchedulesSQL)
    await connection.query(createHistoryEventsSQL)
    await connection.query(createAlmanacDataSQL)
    await connection.query(createAlmanacTermsSQL)
    await connection.query(createAlmanacTermDatesSQL)
    await connection.query(createUserMarkedDatesSQL)
    await connection.query(createConstellationFortuneSQL)
    await connection.query(createConstellationMatchSQL)
    await connection.query(createOilProvincePriceSQL)
    await connection.query(createOilInternationalSQL)
    await connection.query(createOilAdjustmentHistorySQL)
    await connection.query(createOilProvincePriceLatestSQL)
    await connection.query(createTiangouDiarySQL)
    await connection.query(createWorkerDiarySQL)

    logger.log('MySQL 数据表创建完成')

    // 检查是否需要初始化示例数据
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM holidays')
    if (!rows[0] || rows[0].count === 0) {
      await initSampleData(connection)
    }

    // 检查打工者日记表是否有数据
    const [workerRows] = await connection.query('SELECT COUNT(*) as count FROM worker_diary')
    if (!workerRows[0] || workerRows[0].count === 0) {
      logger.log('正在初始化打工者日记数据...')
      await connection.query(`INSERT INTO worker_diary (content) VALUES
        ('早安，打工人！今天也要加油搬砖哦～'),
        ('上班就是喜欢摸鱼，工资就是精神损失费。'),
        ('每天起床都要念一遍：我不是为了老板而活，我是为了工资而活。'),
        ('打工人的日常：早起、挤地铁、上班、摸鱼、下班、熬夜、睡觉、循环。'),
        ('别人上班是为了生活，我上班是为了还花呗。'),
        ('打工人，打工魂，打工都是人上人。今天也是努力打工的一天！'),
        ('上班最痛苦的不是工作本身，而是明明不想干了但还要继续干。'),
        ('每天上班的路上都在想：我为什么要上班？然后告诉自己：因为穷。'),
        ('打工人的愿望：上班不干活，干活不加班，加班有钱拿。'),
        ('上班就是拿命换钱，下班就是拿钱续命。'),
        ('今天不想上班，明天也不想，后天也是，大后天也是……'),
        ('打工人的一天：早上不想起，晚上不想睡，白天不想动，晚上不想停。'),
        ('上班就是为了下班，下班就是为了第二天继续上班。'),
        ('工资就像大姨妈，一个月来一次，一周就没了。'),
        ('打工人的真实写照：上班等下班，下班等周末，周末等放假。'),
        ('每天上班第一件事：打开电脑，然后发呆。'),
        ('上班最开心的事：摸鱼没人发现，下班没人加班。'),
        ('打工人的一天：早上靠咖啡续命，晚上靠酒精麻痹。'),
        ('上班就是为了证明自己不上班会饿死。'),
        ('打工人的日常：一边抱怨上班累，一边努力上班。')
      `)
      logger.log('打工者日记数据初始化完成')
    }

    connection.release()
    logger.log('MySQL 数据库初始化完成')
  } catch (error) {
    console.error('MySQL 数据库初始化失败:', error.message)
    throw error
  }
}

// 初始化示例数据
async function initSampleData(connection) {
  logger.log('正在初始化 MySQL 示例数据...')

  // 法定节假日
  await connection.query(`INSERT INTO holidays (name, type, date_full, is_official, official_days, description, customs) VALUES
    ('元旦', 'festival', '2026-01-01', 1, 1, '公历新年', '跨年庆祝、许愿'),
    ('春节', 'festival', '2027-02-08', 1, 7, '中国最重要的传统节日', '贴春联、包饺子、拜年、放鞭炮'),
    ('清明节', 'festival', '2026-04-05', 1, 1, '祭祀祖先的节日', '扫墓、祭祖、踏青'),
    ('劳动节', 'festival', '2026-05-01', 1, 1, '国际劳动节', '休假、旅游'),
    ('端午节', 'festival', '2026-06-19', 1, 1, '纪念屈原的节日', '吃粽子、赛龙舟、挂艾草'),
    ('中秋节', 'festival', '2026-09-25', 1, 1, '团圆的节日', '赏月、吃月饼、家人团聚'),
    ('国庆节', 'festival', '2026-10-01', 1, 7, '中华人民共和国成立纪念日', '观看升旗仪式、旅游')
  `)

  // 公历节日
  await connection.query(`INSERT INTO holidays (name, type, date_month, date_day, description, customs) VALUES
    ('情人节', 'solar', 2, 14, '西方情人节', '送巧克力、约会'),
    ('妇女节', 'solar', 3, 8, '国际劳动妇女节', '给女性送礼'),
    ('愚人节', 'solar', 4, 1, '西方愚人节', '开玩笑、恶作剧'),
    ('母亲节', 'solar', 5, 10, '感谢母亲的节日', '送康乃馨、陪伴母亲'),
    ('儿童节', 'solar', 6, 1, '国际儿童节', '给孩子送礼、出游'),
    ('父亲节', 'solar', 6, 15, '感谢父亲的节日', '送领带、陪伴父亲'),
    ('教师节', 'solar', 9, 10, '感谢老师的节日', '送贺卡、祝福老师'),
    ('圣诞节', 'solar', 12, 25, '西方传统节日', '装饰圣诞树、交换礼物')
  `)

  // 农历节日
  await connection.query(`INSERT INTO holidays (name, type, lunar_month, lunar_day, description, customs) VALUES
    ('春节', 'lunar', 1, 1, '农历新年，最重要的传统节日', '贴春联、包饺子、拜年、放鞭炮'),
    ('元宵节', 'lunar', 1, 15, '农历正月十五', '吃元宵、赏花灯、猜灯谜'),
    ('龙抬头', 'lunar', 2, 2, '农历二月初二', '理发、吃猪头肉'),
    ('七夕节', 'lunar', 7, 7, '中国情人节，牛郎织女相会', '乞巧、拜织女'),
    ('中元节', 'lunar', 7, 15, '鬼节', '祭祀祖先、放河灯'),
    ('重阳节', 'lunar', 9, 9, '老人节', '登高、赏菊、敬老'),
    ('腊八节', 'lunar', 12, 8, '农历腊月初八', '喝腊八粥'),
    ('小年', 'lunar', 12, 23, '祭灶日', '祭灶神、扫尘')
  `)

  // 黄历数据
  await connection.query(`INSERT INTO almanac_data (date, lunar_year, lunar_month, lunar_day, ganzhi_year, ganzhi_month, ganzhi_day, zodiac, yi, ji, shen_sha, lucky_time, conflict_zodiac, lucky_direction, lucky_color, lucky_number, rating) VALUES
    ('2026-03-17', 2026, 2, 8, '丙午', '辛卯', '壬戌', '马', '祭祀 祈福 求嗣 开光', '出行 嫁娶 入宅', '青龙', '辰时（7-9 点）', '龙', '正东', '红色', '3, 8', 4),
    ('2026-03-18', 2026, 2, 9, '丙午', '辛卯', '癸亥', '马', '嫁娶 祭祀 开光 出行', '动土 安葬', '明堂', '巳时（9-11 点）', '蛇', '正南', '黄色', '5, 0', 5),
    ('2026-03-19', 2026, 2, 10, '丙午', '辛卯', '甲子', '马', '祈福 求嗣 开光 解除', '嫁娶 入宅 动土', '天刑', '午时（11-13 点）', '马', '西南', '白色', '4, 9', 3),
    ('2026-03-20', 2026, 2, 11, '丙午', '辛卯', '乙丑', '马', '开光 祭祀 祈福 求嗣', '安床 动土 破土', '朱雀', '未时（13-15 点）', '羊', '正西', '绿色', '3, 8', 4),
    ('2026-03-21', 2026, 2, 12, '丙午', '辛卯', '丙寅', '马', '祭祀 祈福 斋醮 赴任', '开仓 嫁娶 安葬', '金匮', '申时（15-17 点）', '猴', '西北', '黑色', '1, 6', 3),
    ('2026-03-22', 2026, 2, 13, '丙午', '辛卯', '丁卯', '马', '嫁娶 祭祀 祈福 求嗣', '开光 安床 动土', '天德', '酉时（17-19 点）', '鸡', '正北', '白色', '4, 9', 5),
    ('2026-03-23', 2026, 2, 14, '丙午', '辛卯', '戊辰', '马', '祈福 求嗣 开光 解除 扫除', '嫁娶 入宅 动土 安葬', '白虎', '戌时（19-21 点）', '狗', '正东', '红色', '2, 7', 2),
    ('2026-03-24', 2026, 2, 15, '丙午', '辛卯', '己巳', '马', '祭祀 祈福 求嗣 开光 出行', '动土 安床 安葬', '玉堂', '亥时（21-23 点）', '猪', '正南', '黄色', '5, 0', 4),
    ('2026-03-25', 2026, 2, 16, '丙午', '辛卯', '庚午', '马', '开光 祭祀 祈福 嫁娶 出行', '动土 破土 安葬', '天牢', '子时（23-1 点）', '鼠', '西南', '白色', '4, 9', 3),
    ('2026-03-26', 2026, 2, 17, '丙午', '辛卯', '辛未', '马', '祭祀 祈福 求嗣 开光 解除', '嫁娶 入宅 动土', '玄武', '丑时（1-3 点）', '牛', '正西', '绿色', '3, 8', 4),
    ('2026-03-27', 2026, 2, 18, '丙午', '辛卯', '壬申', '马', '祈福 求嗣 开光 出行 赴任', '嫁娶 动土 安葬', '司命', '寅时（3-5 点）', '虎', '西北', '黑色', '1, 6', 3),
    ('2026-03-28', 2026, 2, 19, '丙午', '辛卯', '癸酉', '马', '嫁娶 祭祀 祈福 求嗣 开光', '动土 安床 安葬', '勾陈', '卯时（5-7 点）', '兔', '正北', '白色', '4, 9', 5),
    ('2026-03-29', 2026, 2, 20, '丙午', '辛卯', '甲戌', '马', '祭祀 祈福 求嗣 开光 解除', '嫁娶 入宅 动土', '青龙', '辰时（7-9 点）', '龙', '正东', '红色', '3, 8', 4),
    ('2026-03-30', 2026, 2, 21, '丙午', '辛卯', '乙亥', '马', '开光 祭祀 祈福 出行 赴任', '嫁娶 动土 安葬', '明堂', '巳时（9-11 点）', '蛇', '正南', '黄色', '5, 0', 3)
  `)

  // 历史事件数据（按分类）
  await connection.query(`INSERT INTO history_events (month, day, year, title, description, category, country, is_featured) VALUES
    -- 政治类
    (10, 1, 1949, '中华人民共和国成立', '1949 年 10 月 1 日，毛泽东主席在天安门城楼上庄严宣告中华人民共和国中央人民政府成立，标志着新中国的诞生。', 'politics', 'CN', 1),
    (8, 1, 1927, '南昌起义', '1927 年 8 月 1 日，中国共产党领导部分国民革命军在江西南昌举行武装起义，打响了武装反抗国民党反动派的第一枪。', 'politics', 'CN', 1),
    (7, 1, 1921, '中国共产党成立', '1921 年 7 月 23 日，中国共产党第一次全国代表大会在上海召开，宣告中国共产党的正式成立。', 'politics', 'CN', 1),
    (12, 26, 1893, '毛泽东诞辰', '1893 年 12 月 26 日，毛泽东同志出生于湖南湘潭韶山冲，伟大的马克思主义者，伟大的无产阶级革命家、战略家、理论家。', 'politics', 'CN', 1),
    (3, 18, 1871, '巴黎公社成立', '1871 年 3 月 18 日，巴黎公社成立，这是人类历史上第一个无产阶级政权。', 'politics', 'FR', 1),
    (3, 18, 1662, '郑成功收复台湾', '1662 年 3 月 18 日，郑成功率军收复台湾，结束了荷兰在台湾的殖民统治。', 'politics', 'CN', 1),
    -- 科技类
    (3, 18, 1965, '苏联发射联盟号飞船', '1965 年 3 月 18 日，苏联发射联盟号飞船，宇航员列昂诺夫完成人类首次太空行走。', 'technology', 'RU', 1),
    (7, 20, 1969, '阿波罗 11 号登月', '1969 年 7 月 20 日，美国阿波罗 11 号成功登月，阿姆斯特朗成为首个踏上月球的人类。', 'technology', 'US', 1),
    (4, 1, 1976, '苹果公司成立', '1976 年 4 月 1 日，史蒂夫·乔布斯等人在美国加州创立苹果公司。', 'technology', 'US', 0),
    -- 文化类
    (4, 23, 1564, '莎士比亚诞生', '1564 年 4 月 23 日，英国文学巨匠威廉·莎士比亚诞生，被誉为"人类文学奥林匹斯山上的宙斯"。', 'culture', 'UK', 1),
    (12, 5, 1901, '迪士尼诞生', '1901 年 12 月 5 日，世界动画大师华特·迪士尼诞生，创造了米老鼠等经典卡通形象。', 'culture', 'US', 0),
    (8, 15, 1935, '猫王诞生', '1935 年 8 月 15 日，美国摇滚乐之王埃尔维斯·普雷斯利诞生。', 'culture', 'US', 0),
    -- 体育类
    (7, 23, 2021, '东京奥运会开幕', '2021 年 7 月 23 日，第 32 届夏季奥林匹克运动会在日本东京开幕。', 'sports', 'JP', 1),
    (8, 8, 2008, '北京奥运会开幕', '2008 年 8 月 8 日，第 29 届夏季奥林匹克运动会在北京开幕，中国代表团获得 51 枚金牌。', 'sports', 'CN', 1),
    (6, 15, 1958, '贝利世界杯首秀', '1958 年 6 月 15 日，17 岁的贝利在瑞典世界杯完成国家队首秀，开启球王传奇。', 'sports', 'BR', 0)
  `)

  // 二十四节气百科数据
  await connection.query(`INSERT INTO almanac_terms (term_name, term_order, lunar_month, lunar_day, origin, phenology, customs, health_tips, poetry) VALUES
    ('立春', 1, 1, 8, '立春是二十四节气之首，标志着春天的开始。立，始也；春，代表着温暖、生长。立春后阳气开始上升，万物复苏。', '一候东风解冻，二候蜇虫始振，三候鱼陟负冰。东风送暖，大地开始解冻；蛰居的虫类慢慢苏醒；河里的冰开始融化。', '咬春：吃春饼、春卷，寓意迎接春天。打春牛：用鞭子抽打泥塑春牛，象征春耕开始。戴春鸡：儿童头戴春鸡布偶，祈求健康。', '春季养肝，宜多吃辛甘发散之品，如韭菜、香菜、豆芽等。保持心情舒畅，适当运动，早睡早起。', '京兆年高胜七日，宜春幡胜贴门庭。东风已绿瀛洲草，紫殿红楼觉春好。'),
    ('雨水', 2, 1, 20, '雨水节气意味着降水开始增多，冰雪融化。此时气温回升，冰雪消融，降水形式由雪转为雨，故名雨水。', '一候獭祭鱼，二候鸿雁来，三候草木萌动。水獭开始捕鱼；大雁从南方飞回北方；草木开始萌发新芽。', '占稻色：通过爆炒糯谷米花预测稻谷收成。拉保保：给孩子认干爹干妈，祈求健康。回娘屋：出嫁女儿回娘家。', '雨水后湿气渐重，宜健脾祛湿。可食用山药、莲子、芡实等。注意腰腿保暖，预防风湿病。', '好雨知时节，当春乃发生。随风潜入夜，润物细无声。'),
    ('惊蛰', 3, 2, 5, '惊蛰意为春雷惊醒蛰伏的昆虫。此时气温回升较快，春雷乍动，惊醒蛰伏于地下冬眠的昆虫。', '一候桃始华，二候仓庚鸣，三候鹰化为鸠。桃花开始盛开；黄鹂鸟开始鸣叫；鹰开始躲起来繁育，布谷鸟活跃起来。', '祭白虎：祭拜纸绘白虎，化解是非。打小人：用鞋底拍打纸人，驱赶霉运。炒虫：将谷物炒熟，象征消灭害虫。', '惊蛰时节肝阳之气渐旺，宜养肝护肝。多吃清淡食物，少食辛辣。可食用梨子润肺止咳。', '微雨众卉新，一雷惊蛰始。田家几日闲，耕种从此起。'),
    ('春分', 4, 2, 20, '春分日昼夜平分，此后白天渐长。分者半也，这一天全球昼夜等长。春分后太阳直射点继续北移，北半球昼长夜短。', '一候玄鸟至，二候雷乃发声，三候始电。燕子从南方飞回；天空开始打雷；闪电开始出现。', '竖蛋：春分这天最容易把鸡蛋竖立起来。祭日：古代帝王祭太阳神。吃春菜：采摘并食用春季野菜。', '春分时节阴阳平衡，宜保持人体阴阳平衡。饮食宜寒热搭配，忌大寒大热。保持心情愉快，预防肝气郁结。', '日月阳阴两均天，玄鸟不辞桃花寒。从来今日竖鸡子，川上良人放纸鸢。'),
    ('清明', 5, 3, 5, '清明含"清洁明净"之意，此时气候清爽温暖，草木萌发。清明既是节气也是传统节日，是祭祖扫墓的重要日子。', '一候桐始华，二候田鼠化为鹌，三候虹始见。桐树开始开花；田鼠躲回洞穴；雨后天空出现彩虹。', '扫墓祭祖：祭奠祖先，寄托哀思。踏青：春游赏花，亲近自然。插柳：门楣插柳枝，驱邪避鬼。放风筝：放飞晦气，祈求好运。', '清明时节易肝旺脾弱，宜养肝健脾。可食用菠菜、山药等。注意防风保暖，预防感冒。', '清明时节雨纷纷，路上行人欲断魂。借问酒家何处有，牧童遥指杏花村。'),
    ('谷雨', 6, 3, 20, '谷雨意为"雨生百谷"，此时降水明显增加，谷物茁壮成长。谷雨是春季最后一个节气，此后气温升高加快。', '一候萍始生，二候鸣鸠拂其羽，三候戴胜降于桑。浮萍开始生长；布谷鸟开始鸣叫；戴胜鸟出现在桑树上。', '祭海：渔民祭拜海神，祈求平安。食香椿：谷雨时香椿最嫩。喝谷雨茶：采摘新茶饮用，清火明目。', '谷雨时节湿气较重，宜祛湿健脾。可食用薏米、赤小豆等。注意关节保暖，预防风湿。', '不风不雨正晴和，翠竹亭亭好节柯。最爱晚凉佳客至，一壶新茗泡松萝。'),
    ('立夏', 7, 4, 5, '立夏表示夏天的开始，万物至此皆已长大。立，始也；夏，大也。立夏后气温明显升高，雷雨增多。', '一候蝼蝈鸣，二候蚯蚓出，三候王瓜生。蝼蝈开始鸣叫；蚯蚓从土里钻出；王瓜开始结果。', '称人：称体重，祈求健康不瘦。尝新：品尝新收获的蔬果。斗蛋：儿童斗鸡蛋游戏，祈求平安。', '夏季养心，宜清淡饮食，多吃苦味食物如苦瓜、莲子心。保证充足睡眠，适当午休。', '槐柳阴初密，帘栊暑尚微。绿阴铺野换新光，薰风初昼长。'),
    ('小满', 8, 4, 21, '小满意味着麦类等夏熟作物籽粒开始饱满但未成熟。小满时节雨水增多，江河渐满，故称小满。', '一候苦菜秀，二候靡草死，三候麦秋至。苦菜开花；喜阴的细草枯死；麦子即将成熟。', '祭车神：祭祀水车神，祈求风调雨顺。抢水：村民合力引水灌溉。食苦菜：吃苦菜清热解毒。', '小满时节湿热交加，宜清热祛湿。可食用冬瓜、丝瓜等。注意饮食卫生，预防肠道疾病。', '夜莺啼绿柳，皓月醒长空。最爱垄头麦，迎风笑落红。'),
    ('芒种', 9, 5, 5, '芒种意为"有芒的麦子快收，有芒的稻子可种"，是农事最繁忙的时节。芒种后气温升高，降水增多。', '一候螳螂生，二候鹏始鸣，三候反舌无声。螳螂破卵而出；伯劳鸟开始鸣叫；反舌鸟停止鸣叫。', '送花神：祭祀花神，感谢赐福。安苗：用麦苗祭祀，祈求丰收。煮梅：青梅煮酒，驱除疲劳。', '芒种时节暑热渐盛，宜清淡饮食，多喝水。可适当吃酸味食物生津止渴。注意防暑降温。', '时雨及芒种，四野皆插秧。家家麦饭美，处处菱歌长。'),
    ('夏至', 10, 5, 21, '夏至日太阳直射北回归线，是北半球白天最长的一天。夏至后太阳直射点南移，但天气继续变热。', '一候鹿角解，二候蝉始鸣，三候半夏生。雄鹿的角开始脱落；蝉开始鸣叫；半夏草开始生长。', '祭神祀祖：祈求丰收安康。食面：有"冬至饺子夏至面"的习俗。互赠礼物：亲友之间互赠夏礼。', '夏至时节心火旺盛，宜清热解暑。可食用西瓜、绿豆汤等。避免贪凉，预防空调病。', '昼晷已云极，宵漏自此长。未及施政教，所忧变炎凉。'),
    ('小暑', 11, 6, 7, '小暑意为天气开始炎热但还未到最热。小暑时节高温多雨，是农作物生长最快的时期。', '一候温风至，二候蟋蟀居宇，三候鹰始鸷。热风扑面；蟋蟀躲到屋檐下避暑；老鹰开始搏击长空。', '晒伏：晾晒衣物书籍，防潮防霉。食藕：食用新鲜莲藕，清热凉血。吃饺子：改善食欲，补充营养。', '小暑时节暑湿较重，宜健脾祛湿。可食用薏米、白扁豆等。避免长时间吹空调，预防热伤风。', '倏忽温风至，因循小暑来。竹喧先觉雨，山暗已闻雷。'),
    ('大暑', 12, 6, 23, '大暑是一年中最热的时节，高温酷热，雷雨频繁。大暑时节农作物生长最快，同时也是旱涝灾害多发期。', '一候腐草为萤，二候土润溽暑，三候大雨时行。萤火虫在腐草上产卵；土壤湿润空气湿热；时常有大的雷雨。', '斗蟋蟀：民间娱乐活动。送大暑船：渔民祭祀海神，祈求平安。喝伏茶：饮用清热解毒的凉茶。', '大暑时节酷热难耐，宜清热解暑。可食用绿豆汤、西瓜等。避免剧烈运动，预防中暑。', '赤日几时过，清风无处寻。经书聊枕籍，瓜李漫浮沉。'),
    ('立秋', 13, 7, 7, '立秋表示秋天的开始，万物开始从繁茂成长趋向萧索成熟。立秋后阳气渐收，阴气渐长。', '一候凉风至，二候白露生，三候寒蝉鸣。凉爽的风开始吹拂；早晨出现雾气；寒蝉开始鸣叫。', '贴秋膘：吃肉进补，弥补夏天的消耗。晒秋：晾晒收获的农作物。啃秋：吃西瓜，迎接秋天。', '秋季养肺，宜多吃滋阴润燥的食物，如梨、百合、银耳等。保持充足睡眠，早睡早起。', '一叶梧桐一报秋，稻花田里话丰收。虽非盛夏还伏虎，更有寒蝉唱不休。'),
    ('处暑', 14, 7, 23, '处暑意为"出暑"，表示炎热的夏天即将过去。处暑后气温逐渐下降，秋高气爽。', '一候鹰乃祭鸟，二候天地始肃，三候禾乃登。老鹰开始捕食鸟类；天地间万物开始凋零；庄稼成熟收获。', '放河灯：祭奠逝者，寄托思念。开渔节：渔民出海捕鱼，祈求丰收。吃鸭子：滋阴润燥，补充营养。', '处暑时节秋燥渐起，宜滋阴润肺。可食用蜂蜜、梨、百合等。注意补充水分，预防便秘。', '离离暑云散，袅袅凉风起。池上秋又来，荷花半成子。'),
    ('白露', 15, 8, 7, '白露意味着天气转凉，清晨出现露水。白露后气温下降加快，水汽在地面和植物上凝结成白色的露珠。', '一候鸿雁来，二候玄鸟归，三候群鸟养羞。大雁从北方飞回；燕子飞回南方；鸟儿开始储存食物过冬。', '祭禹王：祭祀治水英雄大禹。饮白露茶：饮用白露时节的茶，清香甘甜。吃龙眼：滋补身体，美容养颜。', '白露时节阴气渐重，宜保暖防寒。可食用温热食物，如红枣、桂圆等。注意足部保暖，预防寒从脚起。', '白露秋风夜，雁南飞一行。露从今夜白，月是故乡明。'),
    ('秋分', 16, 8, 23, '秋分日昼夜平分，此后白天渐短。秋分后太阳直射点继续南移，北半球昼短夜长。', '一候雷始收声，二候蛰虫坯户，三候水始涸。雷声减少；昆虫开始躲进洞穴；河流水量减少。', '祭月：祭拜月神，祈求团圆。吃秋菜：食用秋季时令蔬菜。竖蛋：和春分一样可以竖鸡蛋。', '秋分时节阴阳平衡，宜保持人体阴阳平衡。饮食宜滋阴润肺，如芝麻、核桃、糯米等。', '自古逢秋悲寂寥，我言秋日胜春朝。晴空一鹤排云上，便引诗情到碧霄。'),
    ('寒露', 17, 9, 8, '寒露意味着露水增多且更冷，即将凝结成霜。寒露后气温明显下降，北方进入深秋，南方也开始转凉。', '一候鸿雁来宾，二候雀入大水为蛤，三候菊有黄华。大雁全部到达南方；鸟儿躲藏起来；菊花开始盛开。', '登高：登山远眺，强身健体。赏红叶：观赏秋季红叶美景。饮菊花酒：饮用菊花泡制的酒，延年益寿。', '寒露时节寒气加重，宜保暖防寒。可食用温热食物，如羊肉、牛肉等。注意关节保暖，预防风湿。', '萧疏桐叶上，月白露初团。冷竹风成韵，荒街叶作堆。'),
    ('霜降', 18, 9, 23, '霜降意味着天气渐冷，开始出现霜冻。霜降是秋季最后一个节气，此后天气转冷，万物萧条。', '一候豺乃祭兽，二候草木黄落，三候蜇虫咸俯。豺狼开始捕食储备过冬；草木枯黄凋落；昆虫全部躲藏起来冬眠。', '赏菊：观赏菊花，饮酒赋诗。吃柿子：有"霜降吃柿子，冬天不感冒"的说法。进补：食用温热食物，为过冬做准备。', '霜降时节寒气较重，宜温补养阳。可食用羊肉、核桃、板栗等。注意保暖，预防心脑血管疾病。', '霜降水痕收，浅碧鳞鳞露远洲。酒力渐消风力软，飕飕，破帽多情却恋头。'),
    ('立冬', 19, 10, 7, '立冬表示冬天的开始，万物进入休养、收藏状态。立，始也；冬，终也，表示万物收藏。', '一候水始冰，二候地始冻，三候雉入大水为蜃。河水开始结冰；土地开始冻结；野鸡躲进水中变成大蛤。', '迎冬：古代帝王举行迎冬仪式。补冬：食用温热食物进补。吃饺子：有"立冬补冬，补嘴空"的说法。', '冬季养肾，宜多吃温补食物，如羊肉、核桃、黑芝麻等。保证充足睡眠，早睡晚起。', '北风潜入悄无声，未品浓秋已立冬。画木依稀如昨日，梅魂松韵忆前踪。'),
    ('小雪', 20, 10, 22, '小雪意味着开始下雪但雪量不大。小雪后气温继续下降，北方开始降雪，南方也开始转冷。', '一候虹藏不见，二候天气上升地气下降，三候闭塞而成冬。彩虹消失；天地之气不通；万物失去生机进入寒冬。', '腌腊肉：腌制腊肉香肠，准备过年。吃糍粑：食用糯米糍粑，祭祀牛王。晒鱼干：制作鱼干储备过冬。', '小雪时节阴寒渐盛，宜温阳散寒。可食用温热食物，如羊肉、韭菜等。注意头部和足部保暖，预防感冒。', '花雪随风不厌看，更多还肯失林峦。愁人正在书窗下，一片飞来一片寒。'),
    ('大雪', 21, 11, 7, '大雪意味着降雪量增多，地面可能积雪。大雪后气温更低，北方进入严寒，南方也开始寒冷。', '一候鹖鴠不鸣，二候虎始交，三候荔挺出。寒号鸟停止鸣叫；老虎开始求偶；兰草开始抽芽。', '观赏封河：欣赏河流冰封的美景。滑冰滑雪：冬季运动娱乐。进补：食用温热食物，增强抵抗力。', '大雪时节严寒来临，宜补肾填精。可食用黑色食物，如黑豆、黑米、黑芝麻等。注意保暖，预防呼吸道疾病。', '大雪压青松，青松挺且直。要知松高洁，待到雪化时。'),
    ('冬至', 22, 11, 22, '冬至日太阳直射南回归线，是北半球白天最短的一天。冬至后太阳直射点北移，白天渐长。', '一候蚯蚓结，二候麋角解，三候水泉动。蚯蚓蜷缩身体；麋鹿的角开始脱落；山中的泉水开始流动。', '祭祖：祭奠祖先，祈求平安。吃饺子：北方有"冬至不端饺子碗，冻掉耳朵没人管"的说法。吃汤圆：南方有"冬至圆"的习俗。', '冬至时节阴气最盛，宜温阳补肾。可食用羊肉、狗肉等温热食物。注意保暖，预防心脑血管疾病。', '天时人事日相催，冬至阳生春又来。刺绣五纹添弱线，吹葭六琯动浮灰。'),
    ('小寒', 23, 12, 5, '小寒意味着天气开始寒冷但还未到最冷。小寒时节冷空气活动频繁，气温较低。', '一候雁北乡，二候鹊始巢，三候雉始雊。大雁开始向北迁徙；喜鹊开始筑巢；野鸡开始鸣叫求偶。', '冰戏：滑冰等冰雪运动。吃腊八粥：农历腊月初八食用腊八粥。画图数九：绘制九九消寒图，记录冬天。', '小寒时节严寒加剧，宜温阳散寒。可食用温热食物，如羊肉、狗肉等。注意头部和足部保暖，预防冻疮。', '小寒连大吕，欢鹊垒新巢。拾食寻河曲，衔紫绕树梢。'),
    ('大寒', 24, 12, 20, '大寒是一年中最冷的时节，严寒酷冷，风雪交加。大寒后冬季即将结束，春天即将来临。', '一候鸡乳，二候征鸟厉疾，三候水泽腹坚。母鸡开始孵蛋；猛禽捕食更加凶猛；水域完全冻结。', '蒸酿糯米饭：食用温热糯米饭，御寒保暖。除尘：大扫除，迎接新年。赶集：采购年货，准备过年。', '大寒时节阴寒极盛，宜温阳补阳。可食用温热食物，如羊肉、狗肉、辣椒等。注意全身保暖，保持心情舒畅。', '蜡树银山炫皎光，朔风独啸静三江。老农犹喜高天雪，况有来年麦果香。')
  `)

  logger.log('MySQL 示例数据初始化完成')
}

// 主初始化函数
async function initDatabase() {
  await initMySQL()
}

// MySQL 查询函数
async function queryMySQL(sql, params = []) {
  if (!mysqlPool) return []

  try {
    const [rows] = await mysqlPool.promise().query(sql, params)
    return rows
  } catch (error) {
    console.error('MySQL 查询错误:', error.message)
    return []
  }
}

// MySQL 执行函数
async function runMySQL(sql, params = []) {
  if (!mysqlPool) return { lastInsertRowid: 0 }

  try {
    const [result] = await mysqlPool.promise().query(sql, params)
    return { lastInsertRowid: result.insertId }
  } catch (error) {
    console.error('MySQL 执行错误:', error.message)
    return { lastInsertRowid: 0 }
  }
}

// 统一导出
const query = queryMySQL
const run = runMySQL

// 获取数据库连接池
function getPool() {
  return mysqlPool
}

module.exports = {
  query,
  run,
  initDatabase,
  getPool
}
