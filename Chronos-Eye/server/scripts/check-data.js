const mysql = require('mysql2/promise');

const dbConfig = require('./db-config');

async function checkData() {
  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功！');

    // 总记录数
    const [rows] = await connection.query('SELECT COUNT(*) as total FROM history_events');
    console.log(`\n数据库中历史事件总数：${rows[0].total}`);

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

    // 检查是否有重复记录
    const [duplicates] = await connection.query(`
      SELECT month, day, year, title, COUNT(*) as cnt
      FROM history_events
      GROUP BY month, day, year, title
      HAVING cnt > 1
      ORDER BY cnt DESC
      LIMIT 10
    `);
    if (duplicates.length > 0) {
      console.log('\n可能存在的重复记录：');
      duplicates.forEach(d => {
        console.log(`  ${d.year}年${d.month}月${d.day}日 ${d.title} (${d.cnt}条)`);
      });
    }

  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n数据库连接已关闭');
    }
  }
}

checkData().catch(console.error);
