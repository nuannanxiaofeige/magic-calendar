const mysql = require('mysql2/promise');

const dbConfig = {
  host: '47.102.152.82',
  port: 3306,
  user: 'root',
  password: '_kIjZ9iVb@nt',
  database: 'chronos_eye'
};

async function checkAllTables() {
  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功！\n');

    // 列出所有表
    const [tables] = await connection.query('SHOW TABLES');
    console.log('数据库中的所有表：');
    tables.forEach(t => {
      const tableName = Object.values(t)[0];
      console.log(`  - ${tableName}`);
    });

    // 查询每个表的记录数
    console.log('\n各表记录数：');
    for (const tableRow of tables) {
      const tableName = Object.values(tableRow)[0];
      const [rows] = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      console.log(`  ${tableName}: ${rows[0].count} 条`);
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

checkAllTables().catch(console.error);
