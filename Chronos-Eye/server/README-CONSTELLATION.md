# 星座功能使用说明

## 功能概述

本项目已集成天行数据 API，支持以下星座相关功能：

1. **星座运势查询** - 获取 12 星座的完整运势数据
   - **今日运势**：综合指数、爱情指数、工作指数、财运指数、健康指数、幸运颜色、幸运数字、贵人星座、今日概述
   - **本周运势**：综合指数、爱情指数、工作指数、财运指数、健康指数、幸运颜色、幸运数字、周运势概述
   - **本月运势**：综合指数、爱情指数、工作指数、财运指数、健康指数、幸运颜色、幸运数字、月运势概述
   - **年度运势**：综合指数、爱情指数、工作指数、财运指数、健康指数、年度运势概述、守护星
2. **星座配对查询** - 查询两个星座的配对指数和详细解析
3. **数据库缓存** - 自动将 API 数据缓存到 MySQL 数据库，避免重复调用
4. **每月同步** - **每月初（1-3 日）自动同步当月 12 星座的运势数据**，避免每天调用 API

## API 接口

### 1. 获取完整运势（今日 + 本周 + 本月 + 年度）

```
GET /api/constellation/:sign/full
```

**返回示例：**
```json
{
  "success": true,
  "data": {
    "sign": "aries",
    "sign_name": "白羊座",
    "today": {
      "totalScore": 80,
      "overall": 80,
      "love": 75,
      "work": 85,
      "wealth": 70,
      "health": 78,
      "luckyColor": "红色",
      "luckyNumber": 7,
      "matchSign": "狮子座",
      "description": "今天旺盛的精力会驱使着你排除万难...",
      "motto": "勇往直前，无畏挑战"
    },
    "week": {
      "totalScore": 75,
      "overall": 75,
      "love": 70,
      "work": 80,
      "wealth": 65,
      "health": 75,
      "luckyColor": "蓝色",
      "luckyNumber": 5,
      "description": "本周整体运势平稳上升..."
    },
    "month": {
      "totalScore": 72,
      "overall": 72,
      "love": 68,
      "work": 78,
      "wealth": 62,
      "health": 70,
      "luckyColor": "绿色",
      "luckyNumber": 3,
      "description": "本月整体运势较好..."
    },
    "year": {
      "totalScore": 78,
      "overall": 78,
      "love": 75,
      "work": 82,
      "wealth": 70,
      "health": 76,
      "description": "2026 年是白羊座充满机遇的一年...",
      "rulingPlanet": "火星",
      "rulingPlanetDesc": "行动力与决断力的象征"
    }
  },
  "source": "cache"
}
```

### 2. 获取指定类型运势

```
GET /api/constellation/:sign/:dateType
```

**参数：**
- `sign` - 星座英文名
- `dateType` - 日期类型（today, tomorrow, week, month, year）

### 3. 批量获取 12 星座今日运势

```
GET /api/constellation/all/today
```

### 4. 星座配对查询

```
GET /api/constellation-match/match?sign1=aries&sign2=taurus
```

### 5. 获取星座列表

```
GET /api/constellation-match/list
```

## 数据库表结构

### 星座运势表 (constellation_fortune)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 ID |
| date | DATE | 日期 |
| sign | VARCHAR(20) | 星座英文名 |
| sign_name | VARCHAR(10) | 星座中文名 |
| overall | INT | 综合指数 (今日) |
| love | INT | 爱情指数 (今日) |
| work | INT | 工作指数 (今日) |
| wealth | INT | 财富指数 (今日) |
| health | INT | 健康指数 (今日) |
| lucky_color | VARCHAR(50) | 幸运颜色 |
| lucky_number | INT | 幸运数字 |
| match_sign | VARCHAR(20) | 贵人星座 |
| summary | TEXT | 今日概述 |
| week_overall | INT | 周综合指数 |
| week_love | INT | 周爱情指数 |
| week_work | INT | 周工作指数 |
| week_wealth | INT | 周财富指数 |
| week_health | INT | 周健康指数 |
| week_summary | TEXT | 周运势概述 |
| week_lucky_color | VARCHAR(50) | 周幸运颜色 |
| week_lucky_number | INT | 周幸运数字 |
| month_overall | INT | 月综合指数 |
| month_love | INT | 月爱情指数 |
| month_work | INT | 月工作指数 |
| month_wealth | INT | 月财富指数 |
| month_health | INT | 月健康指数 |
| month_summary | TEXT | 月运势概述 |
| month_lucky_color | VARCHAR(50) | 月幸运颜色 |
| month_lucky_number | INT | 月幸运数字 |
| year_overall | INT | 年综合指数 |
| year_love | INT | 年爱情指数 |
| year_work | INT | 年工作指数 |
| year_wealth | INT | 年财富指数 |
| year_health | INT | 年健康指数 |
| year_summary | TEXT | 年运势概述 |

### 升级现有数据库

如果已有旧版数据库，运行以下命令升级：

```bash
cd server
node scripts/upgrade-constellation-table.js
```

或手动执行 SQL：
```bash
mysql -u root -p chronos_eye < sql/alter_constellation_add_period_mysql.sql
```

## 手动同步星座运势

### 初始化当前月份数据

```bash
cd server
node scripts/init-constellation.js
```

### 同步指定月份

```bash
node scripts/sync-constellation.js 2026-04
```

## 定时任务

系统会在**每月初（1-3 日）凌晨 3 点**自动同步当月 12 星座的运势数据。

## 星座中英文名对照表

| 英文名 | 中文名 |
|--------|--------|
| aries | 白羊座 |
| taurus | 金牛座 |
| gemini | 双子座 |
| cancer | 巨蟹座 |
| leo | 狮子座 |
| virgo | 处女座 |
| libra | 天秤座 |
| scorpio | 天蝎座 |
| sagittarius | 射手座 |
| capricorn | 摩羯座 |
| aquarius | 水瓶座 |
| pisces | 双鱼座 |

## 注意事项

1. **API Key 配置**：需要在 `.env` 文件中配置 `TIANAPI_KEY=30b92001a007855fe7ea7328e8754e2a`
2. **免费配额**：天行 API 免费套餐为 30 次/天
   - 每月初同步全月数据需要约 360 次 API 调用（30 天 × 12 星座）
   - 建议在服务启动时手动执行一次同步，或者分多天逐步同步
3. **缓存机制**：优先从数据库缓存读取，没有缓存时才调用 API
4. **错误处理**：API 调用失败时会自动使用本地生成的运势数据作为后备
5. **每月同步**：定时任务在每月初（1-3 日）凌晨 3 点执行，避免每天调用 API

## 相关文件

- `src/services/tianapi.js` - 天行 API 服务（包含星座运势和配对接口）
- `src/services/scheduler.js` - 定时任务服务
- `src/routes/constellation.js` - 星座运势路由
- `src/routes/constellation-match.js` - 星座配对路由
- `src/config/database.js` - 数据库配置（包含建表语句）
- `sql/create_constellation_table.sql` - 星座运势表 SQL
- `sql/alter_constellation_add_period_mysql.sql` - 升级表结构 SQL
- `scripts/init-constellation.js` - 初始化脚本
- `scripts/sync-constellation.js` - 同步脚本
- `scripts/upgrade-constellation-table.js` - 表结构升级脚本
