const mysql = require('mysql2/promise');

const dbConfig = require('./db-config')

async function resetAndImport() {
  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功！\n');

    // 1. 清空表
    console.log('正在清空表...');
    await connection.query('TRUNCATE TABLE history_events');
    await connection.query('ALTER TABLE history_events AUTO_INCREMENT = 1');
    console.log('表已清空，ID 重置为 1\n');

    // 2. 读取 SQL 文件
    const fs = require('fs');
    const path = require('path');
    const sqlFilePath = path.join(__dirname, 'history_data_full.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    console.log('SQL 文件读取成功');

    // 3. 解析 INSERT 语句
    const insertMatch = sqlContent.match(/INSERT INTO history_events .* VALUES\s*([\s\S]+)/i);
    if (!insertMatch) {
      throw new Error('无法解析 INSERT 语句');
    }

    const valuesString = insertMatch[1].trim();

    // 4. 解析每条记录
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

    console.log(`解析到 ${records.length} 条历史记录\n`);

    // 5. 检查每天的数据量
    const dailyCount = {};
    records.forEach(r => {
      const key = `${r.month}-${r.day}`;
      dailyCount[key] = (dailyCount[key] || 0) + 1;
    });

    const needMore = [];
    Object.entries(dailyCount).forEach(([key, count]) => {
      if (count < 3) {
        const [month, day] = key.split('-').map(Number);
        needMore.push({ month, day, count });
      }
    });

    if (needMore.length > 0) {
      console.log(`有 ${needMore.length} 天不足 3 条记录，需要补充\n`);
      needMore.forEach(d => {
        console.log(`  ${d.month}月${d.day}日：${d.count}条`);
      });
      console.log('\n继续导入现有数据，之后再补充缺失的...\n');
    }

    // 6. 插入数据
    const sql = `INSERT INTO history_events (month, day, year, title, description, category, country, is_featured)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    let successCount = 0;
    let dupCount = 0;

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
      } catch (err) {
        if (err.code !== 'ER_DUP_ENTRY') {
          console.error(`导入失败：${record.title}`, err.message);
        }
        dupCount++;
      }
    }

    console.log(`\n========== 导入完成 ==========`);
    console.log(`成功导入：${successCount} 条`);
    console.log(`重复跳过：${dupCount} 条`);

    // 7. 验证数据
    const [rows] = await connection.query('SELECT COUNT(*) as total FROM history_events');
    console.log(`\n数据库中历史事件总数：${rows[0].total}`);

    // 8. 按月份统计
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

    // 9. 检查每天的数据量
    const [dailyStats] = await connection.query(`
      SELECT month, day, COUNT(*) as count
      FROM history_events
      GROUP BY month, day
      ORDER BY month, day
    `);

    let daysWithLessThan3 = 0;
    const underSupply = [];
    dailyStats.forEach(s => {
      if (s.count < 3) {
        daysWithLessThan3++;
        underSupply.push(s);
      }
    });

    console.log(`\n每天至少 3 条的天数：${366 - daysWithLessThan3} 天`);
    console.log(`不足 3 条的天数：${daysWithLessThan3} 天`);

    if (underSupply.length > 0) {
      console.log('\n需要补充的日期：');
      underSupply.forEach(s => {
        console.log(`  ${s.month}月${s.day}日：${s.count}条`);
      });
    }

    // 10. 查询最小和最大 ID
    const [idRange] = await connection.query('SELECT MIN(id) as min_id, MAX(id) as max_id FROM history_events');
    console.log(`\nID 范围：${idRange[0].min_id} - ${idRange[0].max_id}`);

  } catch (error) {
    console.error('操作失败:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n数据库连接已关闭');
    }
  }
}

resetAndImport().catch(console.error);
