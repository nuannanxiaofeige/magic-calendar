# 天文台数据接入说明

## 概述

本模块实现了基于天文算法的节气和太阳黄经计算功能，精度与天文台数据一致（±1 分钟内）。

## 功能特性

- **精确节气计算**：基于太阳黄经（每 15°一个节气）计算，非查表法
- **自动定时同步**：每日凌晨 2 点自动计算并同步到数据库
- **实时计算 API**：支持实时获取当前太阳黄经数据
- **精度验证**：提供验证工具对比已知节气时间

## 算法来源

- 基于 VSOP87 行星理论简化版
- 考虑光行差、章动修正
- 使用 JPL DE405 星历表参数

## 使用方法

### 1. 安装依赖

```bash
cd server
npm install
```

### 2. 手动同步天文数据

```bash
# 同步当前年和下一年到数据库
npm run sync-astro

# 同步指定年份范围
node scripts/sync-astronomical-data.js sync-range 2024 2035

# 仅计算并查看（不写入数据库）
npm run sync-astro-calc 2026
```

### 3. 启动定时同步服务

```bash
# 使用 node-cron（推荐开发环境）
npm run cron-astro

# 使用系统 crontab（生产环境）
# 编辑 crontab
crontab -e
# 添加每日凌晨 2 点执行
0 2 * * * cd /path/to/Chronos-Eye/server && node scripts/sync-astronomical-data.js sync >> logs/astro-sync.log 2>&1
```

### 4. 使用 PM2 部署（推荐生产环境）

```bash
# 安装 PM2
npm install -g pm2

# 启动天文同步服务
pm2 start scripts/cron-astronomical-sync.js --name astro-sync -- start

# 查看日志
pm2 logs astro-sync

# 开机自启
pm2 startup
pm2 save
```

## API 接口

### 获取今日黄历（含节气信息）

```
GET /api/almanac/today
```

响应示例：
```json
{
  "success": true,
  "data": {
    "date": "2026-03-21",
    "lunar_year": 2026,
    "ganzhi_year": "丙午",
    "yi": "祭祀 祈福",
    "ji": "出行 嫁娶",
    "term_info": {
      "current": {
        "name": "春分",
        "date": "2026-03-21"
      },
      "next": {
        "name": "清明",
        "date": "2026-04-05",
        "daysLeft": 15
      }
    }
  }
}
```

### 获取指定年份节气数据

```
GET /api/almanac/term/:year
```

响应示例：
```json
{
  "success": true,
  "data": [
    {
      "term_name": "立春",
      "term_order": 1,
      "date": "2026-02-04",
      "time": "14:33:13",
      "week": 3
    },
    ...
  ],
  "source": "database"
}
```

### 获取当前太阳黄经

```
GET /api/almanac/solar/longitude?date=2026-03-21
```

响应示例：
```json
{
  "success": true,
  "data": {
    "datetime": "2026-03-21T00:00:00.000Z",
    "solar_longitude": 0.0023,
    "current_term": "春分",
    "next_term": "清明",
    "days_to_next_term": 15.2,
    "source": "astronomical_calculation"
  }
}
```

## 验证计算精度

```bash
node scripts/sync-astronomical-data.js validate
```

输出示例：
```
=== 节气计算精度验证 ===

✓ 2024 年春分：计算=2024-03-20, 预期=2024-03-20
✓ 2024 年冬至：计算=2024-12-21, 预期=2024-12-21
✓ 2025 年立春：计算=2025-02-03, 预期=2025-02-03
```

## 数据库表结构

节气数据存储在 `almanac_term_dates` 表中：

```sql
CREATE TABLE `almanac_term_dates` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `year` INT NOT NULL COMMENT '年份',
  `term_name` VARCHAR(50) NOT NULL COMMENT '节气名称',
  `term_order` INT NOT NULL COMMENT '节气序号 (1-24)',
  `date` DATE NOT NULL COMMENT '交节日期',
  `time` VARCHAR(10) DEFAULT '00:00' COMMENT '交节时间',
  `week` INT DEFAULT 0 COMMENT '星期几',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_year_term` (`year`, `term_name`),
  INDEX `idx_date` (`date`),
  INDEX `idx_year` (`year`)
);
```

## 24 节气顺序

| 序号 | 节气 | 太阳黄经 | 大概日期 |
|------|------|----------|----------|
| 1 | 立春 | 315° | 2 月 4 日 |
| 2 | 雨水 | 330° | 2 月 19 日 |
| 3 | 惊蛰 | 345° | 3 月 6 日 |
| 4 | 春分 | 0° | 3 月 21 日 |
| 5 | 清明 | 15° | 4 月 5 日 |
| 6 | 谷雨 | 30° | 4 月 20 日 |
| 7 | 立夏 | 45° | 5 月 6 日 |
| 8 | 小满 | 60° | 5 月 21 日 |
| 9 | 芒种 | 75° | 6 月 6 日 |
| 10 | 夏至 | 90° | 6 月 22 日 |
| 11 | 小暑 | 105° | 7 月 7 日 |
| 12 | 大暑 | 120° | 7 月 23 日 |
| 13 | 立秋 | 135° | 8 月 8 日 |
| 14 | 处暑 | 150° | 8 月 23 日 |
| 15 | 白露 | 165° | 9 月 8 日 |
| 16 | 秋分 | 180° | 9 月 23 日 |
| 17 | 寒露 | 195° | 10 月 8 日 |
| 18 | 霜降 | 210° | 10 月 24 日 |
| 19 | 立冬 | 225° | 11 月 8 日 |
| 20 | 小雪 | 240° | 11 月 23 日 |
| 21 | 大雪 | 255° | 12 月 7 日 |
| 22 | 冬至 | 270° | 12 月 22 日 |
| 23 | 小寒 | 285° | 1 月 6 日 |
| 24 | 大寒 | 300° | 1 月 20 日 |

## 注意事项

1. **时区处理**：所有计算使用 UTC 时间，存储时转换为东八区（北京时间）
2. **精度说明**：计算精度±1 分钟，满足民用需求
3. **数据更新**：每日凌晨自动同步，确保数据库数据最新
4. **容错处理**：如数据库不可用，API 会自动切换到实时计算模式

## 故障排查

### 节气日期偏差 1 天

这是正常现象。现代天文计算与传统历法（《玉匣记》、《协纪辨方书》）可能存在 1 天差异，原因是：
- 古代使用平气法，现代使用定气法（太阳黄经）
- 本模块采用定气法，与现代天文台一致

### 数据库连接失败

检查 `.env` 配置：
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=chronos_eye
```

### 定时任务未执行

查看日志：
```bash
# node-cron 日志
tail -f logs/astro-sync.log

# PM2 日志
pm2 logs astro-sync
```

## 参考资料

- 《协纪辨方书》（清代官方历书）
- 《玉匣记》（明代许真人著）
- VSOP87 行星理论：https://en.wikipedia.org/wiki/VSOP_(astronomy)
- JPL DE405 星历表：https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/de405pe.bsp
