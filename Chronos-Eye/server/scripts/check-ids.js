const mysql = require('mysql2/promise');

const dbConfig = require('./db-config')

async function checkIds() {
  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功！\n');

    // 查询 ID 范围
    const [minMax] = await connection.query('SELECT MIN(id) as min_id, MAX(id) as max_id, COUNT(*) as total FROM history_events');
    console.log(`ID 范围：${minMax[0].min_id} - ${minMax[0].max_id}`);
    console.log(`记录总数：${minMax[0].total}`);
    console.log(`如果连续应该有 ${minMax[0].max_id - minMax[0].min_id + 1} 条，实际 ${minMax[0].total} 条`);
    console.log(`缺失了 ${minMax[0].max_id - minMax[0].min_id + 1 - minMax[0].total} 条\n`);

    // 查询最小的 10 条记录
    const [first10] = await connection.query('SELECT id, month, day, year, title FROM history_events ORDER BY id ASC LIMIT 10');
    console.log('最小的 10 条记录：');
    first10.forEach(r => console.log(`  ID ${r.id}: ${r.year}年${r.month}月${r.day}日 ${r.title}`));

    // 查询 ID 间隙
    const [gaps] = await connection.query(`
      SELECT a.id + 1 as gap_start, b.id - 1 as gap_end, (b.id - a.id - 1) as missing_count
      FROM history_events a
      JOIN history_events b ON b.id = (SELECT MIN(id) FROM history_events WHERE id > a.id)
      WHERE b.id - a.id > 1
      ORDER BY a.id
      LIMIT 20
    `);
    if (gaps.length > 0) {
      console.log('\nID 间隙（前 20 个）：');
      gaps.forEach(g => console.log(`  缺失 ID ${g.gap_start} - ${g.gap_end} (${g.missing_count}条)`));
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

checkIds().catch(console.error);
