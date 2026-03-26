const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function insertData() {
  const connection = await mysql.createConnection({
    host: '47.102.152.82',
    port: 3306,
    user: 'root',
    password: '_kIjZ9iVb@nt',
    database: 'chronos_eye'
  });

  const sqlPath = path.join(__dirname, 'insert_solar_festivals.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // 分割 SQL 语句，按分号分隔
  const statements = sql.split(';');

  let success = 0;
  let errors = 0;

  for (const stmt of statements) {
    const trimmed = stmt.trim();
    // 跳过空语句、注释和 USE 语句
    if (!trimmed || trimmed.startsWith('--') || trimmed.startsWith('USE')) {
      continue;
    }
    try {
      await connection.execute(trimmed);
      success++;
      console.log('OK:', trimmed.substring(0, 60) + '...');
    } catch (err) {
      console.error('Error:', err.message);
      errors++;
    }
  }

  console.log('\n========== 执行完成 ==========');
  console.log('成功:', success, '条');
  console.log('失败:', errors, '条');

  // 验证结果
  const [rows] = await connection.execute('SELECT type, COUNT(*) as count FROM holidays GROUP BY type');
  console.log('\n当前数据库节日统计:');
  console.log(rows);

  await connection.end();
}

insertData().catch(console.error);
