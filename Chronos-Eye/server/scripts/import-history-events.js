const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const dbConfig = require('./db-config');

async function importHistoryEvents() {
  let connection;

  try {
    // 连接数据库
    console.log('正在连接数据库...');
    connection = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功！');

    // 读取 SQL 文件
    const sqlFilePath = path.join(__dirname, 'history_data_full.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    console.log('SQL 文件读取成功');

    // 解析 SQL 文件，提取 INSERT 语句中的值
    const insertMatch = sqlContent.match(/INSERT INTO history_events .* VALUES\s*([\s\S]+)/i);
    if (!insertMatch) {
      throw new Error('无法解析 INSERT 语句');
    }

    const valuesString = insertMatch[1].trim();

    // 解析每条记录
    const records = [];
    const regex = /\((\d+),\s*(\d+),\s*(\d+),\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*(\d+)\)/g;
    let match;

    while ((match = regex.exec(valuesString)) !== null) {
      records.push({
        month: parseInt(match[1]),
        day: parseInt(match[2]),
        year: parseInt(match[3]),
        title: match[4],
        description: match[5],
        category: match[6],
        country: match[7],
        is_featured: parseInt(match[8])
      });
    }

    console.log(`解析到 ${records.length} 条历史记录`);

    // 插入数据
    const sql = `INSERT INTO history_events (month, day, year, title, description, category, country, is_featured)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    let successCount = 0;
    let errorCount = 0;

    console.log('开始导入数据...');

    for (const record of records) {
      try {
        await connection.execute(sql, [
          record.month,
          record.day,
          record.year,
          record.title,
          record.description,
          record.category,
          record.country,
          record.is_featured
        ]);
        successCount++;

        if (successCount % 100 === 0) {
          console.log(`已导入 ${successCount} 条记录...`);
        }
      } catch (err) {
        // 忽略重复记录错误
        if (err.code !== 'ER_DUP_ENTRY') {
          console.error(`导入失败：${record.title}`, err.message);
        }
        errorCount++;
      }
    }

    console.log('\n========== 导入完成 ==========');
    console.log(`成功导入：${successCount} 条`);
    console.log(`跳过/失败：${errorCount} 条`);
    console.log('===============================');

    // 验证数据
    const [rows] = await connection.query('SELECT COUNT(*) as total FROM history_events');
    console.log(`数据库中历史事件总数：${rows[0].total}`);

    // 按月份统计
    const [monthStats] = await connection.query(`
      SELECT month, COUNT(*) as count
      FROM history_events
      GROUP BY month
      ORDER BY month
    `);
    console.log('\n各月份数据量：');
    monthStats.forEach(stat => {
      console.log(`  ${stat月}日：${stat.count} 条`);
    });

  } catch (error) {
    console.error('导入过程中出错:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n数据库连接已关闭');
    }
  }
}

// 运行导入
importHistoryEvents().catch(console.error);
