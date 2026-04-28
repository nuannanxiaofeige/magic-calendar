#!/usr/bin/env node
/**
 * 历史事件数据导入脚本 - 导入到远程数据库
 * 从 SQL 文件读取并导入到 history_events 表
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const dbConfig = require('./db-config');

// SQL 文件路径
const sqlFilePath = path.join(__dirname, 'history_events_full.sql');

async function importHistoryEvents() {
  let connection;

  try {
    // 1. 连接数据库
    console.log('正在连接远程数据库...');
    connection = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功！');

    // 2. 读取 SQL 文件
    console.log('读取 SQL 文件:', sqlFilePath);
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');

    // 3. 解析 SQL 语句，提取 VALUES 数据
    const insertRegex = /INSERT INTO history_events.*?VALUES\s*([\s\S]*?);/g;
    let match;
    let totalEvents = 0;
    let successCount = 0;
    let dupCount = 0;
    let errorCount = 0;

    console.log('开始导入数据...');

    // 4. 逐个执行 INSERT 语句
    while ((match = insertRegex.exec(sqlContent)) !== null) {
      const valuesSection = match[1];

      // 解析每个值元组
      const valueRegex = /\([^)]+\)/g;
      const valueMatches = valuesSection.match(valueRegex);

      if (valueMatches) {
        for (const valueStr of valueMatches) {
          totalEvents++;
          const values = parseValues(valueStr);

          try {
            await connection.execute(
              `INSERT INTO history_events (month, day, year, title, description, category, country, is_featured)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              values
            );
            successCount++;

            if (successCount % 200 === 0) {
              console.log(`  已导入 ${successCount} 条记录...`);
            }
          } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') {
              dupCount++;
            } else {
              console.error(`  导入错误：${err.message}`);
              errorCount++;
            }
          }
        }
      }
    }

    console.log('\n=== 导入完成 ===');
    console.log(`总事件数：${totalEvents}`);
    console.log(`成功导入：${successCount}`);
    console.log(`跳过 (重复): ${dupCount}`);
    console.log(`其他错误：${errorCount}`);

    // 5. 验证数据
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM history_events');
    console.log(`\n表中总记录数：${rows[0].count}`);

    // 6. 按分类统计
    const [categoryStats] = await connection.query(`
      SELECT category, COUNT(*) as count
      FROM history_events
      GROUP BY category
      ORDER BY count DESC
    `);
    console.log('\n按分类统计:');
    categoryStats.forEach(stat => {
      console.log(`  ${stat.category}: ${stat.count}`);
    });

    // 7. 按国家统计
    const [countryStats] = await connection.query(`
      SELECT country, COUNT(*) as count
      FROM history_events
      GROUP BY country
      ORDER BY count DESC
      LIMIT 10
    `);
    console.log('\n按国家统计 (前 10):');
    countryStats.forEach(stat => {
      console.log(`  ${stat.country}: ${stat.count}`);
    });

  } catch (err) {
    console.error('发生错误:', err.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n数据库连接已关闭');
    }
  }
}

// 解析 SQL 值字符串
function parseValues(valueStr) {
  let str = valueStr.trim().slice(1, -1);
  const values = [];
  let current = '';
  let inQuotes = false;
  let escape = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (escape) {
      current += char;
      escape = false;
      continue;
    }

    if (char === '\\') {
      escape = true;
      current += char;
      continue;
    }

    if (char === "'" && !escape) {
      inQuotes = !inQuotes;
      current += char;
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(parseValue(current.trim()));
      current = '';
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    values.push(parseValue(current.trim()));
  }

  return values;
}

// 解析单个值
function parseValue(str) {
  if (/^\d+$/.test(str)) {
    return parseInt(str, 10);
  }
  if (str.startsWith("'") && str.endsWith("'")) {
    return str.slice(1, -1).replace(/\\'/g, "'").replace(/''/g, "'");
  }
  return str;
}

// 运行导入
importHistoryEvents();
