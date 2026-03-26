const mysql = require('mysql2/promise');

const dbConfig = {
  host: '47.102.152.82',
  port: 3306,
  user: 'root',
  password: '_kIjZ9iVb@nt',
  database: 'chronos_eye'
};

async function fixCategory() {
  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功！');

    // 先查询现有分类
    const [existingCategories] = await connection.query(`
      SELECT DISTINCT category FROM history_events
    `);
    console.log('现有分类:', existingCategories.map(c => c.category));

    // 修改 ENUM 类型，包含所有现有分类 + disaster
    await connection.query(`
      ALTER TABLE history_events
      MODIFY COLUMN category ENUM('politics', 'military', 'science', 'culture', 'sports', 'entertainment', 'economy', 'other', 'disaster', 'technology') DEFAULT 'other'
    `);
    console.log('分类字段已更新，添加 disaster 和 technology 类型');

    // 重新导入失败的事件数据
    const failedEvents = [
      { month: 11, day: 23, year: 1531, title: '陕西大地震', description: '1531 年 11 月 23 日，陕西华县发生 8 级大地震，死亡约 83 万人，是人类历史上死亡人数最多的地震。', category: 'disaster', country: 'CN', is_featured: 1 },
      { month: 5, day: 18, year: 1980, title: '圣海伦斯火山爆发', description: '1980 年 5 月 18 日，美国华盛顿州圣海伦斯火山爆发，造成 57 人死亡。', category: 'disaster', country: 'US', is_featured: 0 },
      { month: 7, day: 28, year: 1976, title: '唐山大地震', description: '1976 年 7 月 28 日，中国河北唐山发生 7.8 级大地震，造成 24 万多人死亡。', category: 'disaster', country: 'CN', is_featured: 1 },
      { month: 2, day: 6, year: 2023, title: '土耳其大地震', description: '2023 年 2 月 6 日，土耳其南部发生 7.8 级强震，造成数万人死亡。', category: 'disaster', country: 'TR', is_featured: 0 },
      { month: 8, day: 21, year: 1986, title: '喀麦隆毒气泄漏', description: '1986 年 8 月 21 日，喀麦隆尼奥斯湖释放大量二氧化碳，造成约 1700 人死亡。', category: 'disaster', country: 'CM', is_featured: 0 },
      { month: 8, day: 24, year: 79, title: '维苏威火山爆发', description: '公元 79 年 8 月 24 日，意大利维苏威火山爆发，庞贝古城被火山灰掩埋。', category: 'disaster', country: 'IT', is_featured: 1 },
      { month: 8, day: 26, year: 1883, title: '喀拉喀托火山爆发', description: '1883 年 8 月 26 日，印度尼西亚喀拉喀托火山爆发，引发海啸造成 3.6 万人死亡。', category: 'disaster', country: 'ID', is_featured: 1 },
      { month: 9, day: 1, year: 1923, title: '关东大地震', description: '1923 年 9 月 1 日，日本关东地区发生 7.9 级大地震，造成约 10 万人死亡。', category: 'disaster', country: 'JP', is_featured: 0 },
      { month: 9, day: 19, year: 1985, title: '墨西哥城大地震', description: '1985 年 9 月 19 日，墨西哥城发生 8.0 级大地震，造成约 1 万人死亡。', category: 'disaster', country: 'MX', is_featured: 0 },
      { month: 10, day: 8, year: 1871, title: '芝加哥大火', description: '1871 年 10 月 8 日，美国芝加哥发生特大火灾，全城几乎被焚毁。', category: 'disaster', country: 'US', is_featured: 0 },
      { month: 10, day: 13, year: 1972, title: '乌拉圭空军 571 号航班坠毁', description: '1972 年 10 月 13 日，乌拉圭空军航班在安第斯山脉坠毁，幸存者靠吃同伴遗体存活 72 天。', category: 'disaster', country: 'UY', is_featured: 0 },
      { month: 9, day: 8, year: 1900, title: '德克萨斯飓风', description: '1900 年 9 月 8 日，美国德克萨斯州加尔维斯顿遭遇飓风，造成约 6000 人死亡。', category: 'disaster', country: 'US', is_featured: 0 },
      { month: 11, day: 1, year: 1755, title: '里斯本大地震', description: '1755 年 11 月 1 日，葡萄牙里斯本发生 8.5 级大地震，造成约 6 万人死亡。', category: 'disaster', country: 'PT', is_featured: 1 },
      { month: 11, day: 13, year: 1985, title: '哥伦比亚火山爆发', description: '1985 年 11 月 13 日，哥伦比亚内瓦多德鲁伊斯火山爆发，造成约 2.5 万人死亡。', category: 'disaster', country: 'CO', is_featured: 0 },
      { month: 11, day: 21, year: 1980, title: '拉斯维加斯米高梅酒店火灾', description: '1980 年 11 月 21 日，拉斯维加斯米高梅大酒店发生大火，造成 87 人死亡。', category: 'disaster', country: 'US', is_featured: 0 },
      { month: 12, day: 3, year: 1984, title: '博帕尔毒气泄漏', description: '1984 年 12 月 3 日，印度博帕尔联合碳化物工厂发生毒气泄漏，造成约 2.5 万人死亡。', category: 'disaster', country: 'IN', is_featured: 1 },
      { month: 12, day: 26, year: 2004, title: '印度洋海啸', description: '2004 年 12 月 26 日，印度尼西亚苏门答腊附近海域发生 9.1 级地震，引发海啸，造成约 23 万人死亡。', category: 'disaster', country: 'ID', is_featured: 1 },
      { month: 12, day: 8, year: 1863, title: '阿斯帕西娅剧院火灾', description: '1863 年 12 月 8 日，智利圣地亚哥阿斯帕西娅剧院发生火灾，造成约 2000 人死亡。', category: 'disaster', country: 'CL', is_featured: 0 }
    ];

    const sql = `INSERT INTO history_events (month, day, year, title, description, category, country, is_featured)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    let successCount = 0;
    for (const event of failedEvents) {
      try {
        await connection.execute(sql, [
          event.month,
          event.day,
          event.year,
          event.title,
          event.description,
          event.category,
          event.country,
          event.is_featured
        ]);
        successCount++;
        console.log(`✓ ${event.title}`);
      } catch (err) {
        console.error(`✗ ${event.title}: ${err.message}`);
      }
    }

    console.log(`\n成功补导入 ${successCount} 条灾难事件`);

    // 验证数据
    const [rows] = await connection.query('SELECT COUNT(*) as total FROM history_events');
    console.log(`\n数据库中历史事件总数：${rows[0].total}`);

    // 按分类统计
    const [categoryStats] = await connection.query(`
      SELECT category, COUNT(*) as count
      FROM history_events
      GROUP BY category
      ORDER BY count DESC
    `);
    console.log('\n各分类数据量：');
    categoryStats.forEach(stat => {
      console.log(`  ${stat.category}: ${stat.count} 条`);
    });

    // 按月份统计
    const [monthStats] = await connection.query(`
      SELECT month, COUNT(*) as count
      FROM history_events
      GROUP BY month
      ORDER BY month
    `);
    console.log('\n各月份数据量：');
    monthStats.forEach(stat => {
      console.log(`  ${stat.month}月：${stat.count} 条`);
    });

  } catch (error) {
    console.error('操作失败:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n数据库连接已关闭');
    }
  }
}

fixCategory().catch(console.error);
