// 插入农历节日数据
const mysql = require('mysql2/promise');

async function insertLunarFestivals() {
  const connection = await mysql.createConnection({
    host: '47.102.152.82',
    port: 3306,
    user: 'root',
    password: '_kIjZ9iVb@nt',
    database: 'chronos_eye'
  });

  // 删除现有的 lunar 类型数据
  await connection.execute("DELETE FROM holidays WHERE type = 'lunar'");

  // 插入农历节日
  const lunarFestivals = [
    { name: '春节', month: 1, day: 1, desc: '农历新年，最重要的传统节日', customs: '贴春联、包饺子、拜年、放鞭炮' },
    { name: '元宵节', month: 1, day: 15, desc: '农历正月十五', customs: '吃元宵、赏花灯、猜灯谜' },
    { name: '龙抬头', month: 2, day: 2, desc: '农历二月初二', customs: '理发、吃猪头肉' },
    { name: '寒食节', month: 3, day: 1, desc: '清明节前一天，禁烟火吃冷食', customs: '禁烟火、吃冷食、祭扫' },
    { name: '端午节', month: 5, day: 5, desc: '纪念屈原', customs: '吃粽子、赛龙舟、挂艾草' },
    { name: '七夕节', month: 7, day: 7, desc: '中国情人节，牛郎织女相会', customs: '乞巧、拜织女' },
    { name: '中元节', month: 7, day: 15, desc: '鬼节', customs: '祭祀祖先、放河灯' },
    { name: '中秋节', month: 8, day: 15, desc: '团圆节', customs: '赏月、吃月饼、家人团聚' },
    { name: '重阳节', month: 9, day: 9, desc: '老人节', customs: '登高、赏菊、敬老' },
    { name: '腊八节', month: 12, day: 8, desc: '农历腊月初八', customs: '喝腊八粥' },
    { name: '小年', month: 12, day: 23, desc: '祭灶日', customs: '祭灶神、扫尘' },
    { name: '冬至', month: 11, day: 1, desc: '二十四节气之一，白天最短', customs: '吃饺子、吃汤圆、数九' }
  ];

  for (const festival of lunarFestivals) {
    await connection.execute(
      `INSERT INTO holidays (name, type, date_month, date_day, description, customs, is_active)
       VALUES (?, 'lunar', ?, ?, ?, ?, 1)`,
      [festival.name, festival.month, festival.day, festival.desc, festival.customs]
    );
  }

  console.log('农历节日插入完成！');

  const [rows] = await connection.execute("SELECT type, COUNT(*) as count FROM holidays GROUP BY type");
  console.log('当前数据库节日统计:');
  console.log(rows);

  await connection.end();
}

insertLunarFestivals().catch(console.error);
