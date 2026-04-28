const mysql = require('mysql2/promise');

const dbConfig = require('./db-config')

async function finalCheck() {
  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功！\n');

    // 总记录数
    const [total] = await connection.query('SELECT COUNT(*) as count FROM history_events');
    console.log(`当前总记录数：${total[0].count}`);

    // 按 ID 分段统计
    const [before807] = await connection.query('SELECT COUNT(*) as count FROM history_events WHERE id < 807');
    const [after807] = await connection.query('SELECT COUNT(*) as count FROM history_events WHERE id >= 807');
    console.log(`\nID < 807 的记录：${before807[0].count} 条`);
    console.log(`ID >= 807 的记录：${after807[0].count} 条`);

    // 检查每天的数据量
    const [dailyStats] = await connection.query(`
      SELECT month, day, COUNT(*) as count
      FROM history_events
      GROUP BY month, day
      ORDER BY month, day
    `);

    let daysWithLessThan2 = 0;
    let daysWith2OrMore = 0;
    const stats = { daysWithLessThan2: [], daysWith2OrMore: [] };

    dailyStats.forEach(s => {
      if (s.count < 2) {
        daysWithLessThan2++;
        if (daysWithLessThan2 <= 10) stats.daysWithLessThan2.push(`${s.month}月${s.day}日: ${s.count}条`);
      } else {
        daysWith2OrMore++;
      }
    });

    console.log(`\n满足每天至少 2 条的天数：${daysWith2OrMore} 天`);
    console.log(`少于 2 条的天数：${daysWithLessThan2} 天`);
    if (stats.daysWithLessThan2.length > 0) {
      console.log('少于 2 条的日期（前 10 个）：', stats.daysWithLessThan2.join(', '));
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

finalCheck().catch(console.error);
