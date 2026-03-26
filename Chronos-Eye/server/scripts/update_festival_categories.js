// 更新节日分类数据
const mysql = require('mysql2/promise');

async function updateFestivalCategories() {
  const connection = await mysql.createConnection({
    host: '47.102.152.82',
    port: 3306,
    user: 'root',
    password: '_kIjZ9iVb@nt',
    database: 'chronos_eye'
  });

  // 添加 category 字段
  try {
    await connection.execute(`ALTER TABLE holidays ADD COLUMN category VARCHAR(50) DEFAULT '' COMMENT '节日分类：chinese-中国节日，international-国际节日，western-西方节日，national-各国国庆'`);
    console.log('category 字段添加成功');
  } catch (e) {
    console.log('category 字段可能已存在');
  }

  // 中国节日
  const chineseFestivals = ['青年节', '建党节', '建军节', '记者节', '护士节', '医生节', '全民健身日', '全国爱眼日', '全国爱牙日', '程序员节', '光棍节', '抗日战争胜利纪念日', '烈士纪念日', '国家公祭日'];
  await connection.execute(
    `UPDATE holidays SET category = 'chinese' WHERE name IN (?)`,
    [chineseFestivals]
  );

  // 国际节日（世界/国际开头的）
  const internationalFestivals = ['国际元旦', '国际劳动节', '国际妇女节', '国际儿童节', '国际和平日', '国际志愿者日', '国际人权日', '国际禁毒日', '国际残疾人日', '国际老年人日', '国际青年日', '国际妇女权益日', '世界地球日', '世界环境日', '世界湿地日', '世界森林日', '世界水日', '世界气象日', '世界卫生日', '世界图书日', '世界红十字日', '世界无烟日', '世界海洋日', '世界难民日', '世界人口日', '世界土著人民日', '世界扫盲日', '世界预防自杀日', '世界阿尔茨海默病日', '世界教师日', '世界精神卫生日', '世界粮食日', '世界糖尿病日', '世界男性健康日', '世界艾滋病日', '世界足球日'];
  await connection.execute(
    `UPDATE holidays SET category = 'international' WHERE name IN (?)`,
    [internationalFestivals]
  );

  // 西方传统节日
  const westernFestivals = ['情人节', '白色情人节', '愚人节', '复活节', '母亲节', '父亲节', '万圣节', '感恩节', '圣诞节', '平安夜', '节礼日', '圣帕特里克节', '狂欢节', '啤酒节'];
  await connection.execute(
    `UPDATE holidays SET category = 'western' WHERE name IN (?)`,
    [westernFestivals]
  );

  // 各国国庆日
  const nationalFestivals = ['美国独立日', '法国国庆日', '英国国庆日'];
  await connection.execute(
    `UPDATE holidays SET category = 'national' WHERE name IN (?)`,
    [nationalFestivals]
  );

  // 法定节假日的 category 设为 festival
  await connection.execute(
    `UPDATE holidays SET category = 'festival' WHERE type = 'festival'`
  );

  console.log('\n分类更新完成！');

  // 验证结果
  const [rows] = await connection.execute(`SELECT category, COUNT(*) as count FROM holidays WHERE category != '' GROUP BY category`);
  console.log('\n各类别节日统计:');
  console.log(rows);

  await connection.end();
}

updateFestivalCategories().catch(console.error);
