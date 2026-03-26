const mysql = require('mysql2/promise');

const dbConfig = {
  host: '47.102.152.82',
  port: 3306,
  user: 'root',
  password: '_kIjZ9iVb@nt',
  database: 'chronos_eye'
};

async function cleanDuplicates() {
  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功！');

    // 删除前统计
    const [before] = await connection.query('SELECT COUNT(*) as total FROM history_events');
    console.log(`\n删除前记录总数：${before[0].total}`);

    // 删除重复记录，保留 ID 最小的那条
    await connection.query(`
      DELETE t1 FROM history_events t1
      INNER JOIN history_events t2
      WHERE t1.id > t2.id
        AND t1.month = t2.month
        AND t1.day = t2.day
        AND t1.year = t2.year
        AND t1.title = t2.title
    `);
    console.log('重复记录已删除');

    // 删除后统计
    const [after] = await connection.query('SELECT COUNT(*) as total FROM history_events');
    console.log(`\n删除后记录总数：${after[0].total}`);
    console.log(`共删除：${before[0].total - after[0].total} 条重复记录`);

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

    // 验证是否还有重复
    const [duplicates] = await connection.query(`
      SELECT month, day, year, title, COUNT(*) as cnt
      FROM history_events
      GROUP BY month, day, year, title
      HAVING cnt > 1
    `);
    if (duplicates.length > 0) {
      console.log(`\n警告：仍有 ${duplicates.length} 条重复记录`);
    } else {
      console.log('\n无重复记录，数据已清理干净');
    }

  } catch (error) {
    console.error('清理失败:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n数据库连接已关闭');
    }
  }
}

cleanDuplicates().catch(console.error);
