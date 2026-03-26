# 星座数据同步指南

## 概述

本项目使用天行数据 API 获取星座配对数据，并存储到 MySQL 数据库中。

## 数据库表

### constellation_match (星座配对表)

存储 12 星座之间的配对数据，共 132 条记录（12×11，排除相同星座）。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 ID |
| sign1 | VARCHAR(20) | 第一个星座（中文） |
| sign2 | VARCHAR(20) | 第二个星座（中文） |
| grade | VARCHAR(100) | 点评（友情、爱情、婚姻、亲情评分） |
| title | VARCHAR(50) | 标题 |
| content | TEXT | 配对内容解说 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

## 执行步骤

### 1. 创建数据库表

```bash
cd /Users/lifei/Chronos-Eye/server
mysql -u root -p chronos_eye < sql/create_constellation_match_table.sql
```

### 2. 同步星座配对数据

```bash
node scripts/sync-constellation-match.js
```

脚本会自动使用 `.env` 文件中的 `TIANAPI_KEY` 配置。

执行完成后，数据库中将有 132 条星座配对数据。

### 3. 重启服务器

```bash
pm2 restart chronos-eye
```

## API 接口

### 星座配对查询

**接口**: `GET /api/constellation-match/match`

**参数**:
- `sign1` (必需): 第一个星座（支持中文或英文）
- `sign2` (可选): 第二个星座（支持中文或英文）

**示例**:
```bash
# 查询白羊座和金牛座的配对
curl "http://localhost:3000/api/constellation-match/match?sign1=aries&sign2=taurus"

# 查询白羊座与其他所有星座的配对
curl "http://localhost:3000/api/constellation-match/match?sign1=白羊座"

# 使用中文查询
curl "http://localhost:3000/api/constellation-match/match?sign1=白羊座&sign2=金牛座"
```

**返回示例**:
```json
{
  "success": true,
  "data": {
    "sign1": "白羊座",
    "sign2": "金牛座",
    "grade": "友情：★★ 爱情：★★★ 婚姻：★★ 亲情：★★",
    "title": "白羊座：金牛座",
    "content": "节奏不同是你们天生的问题..."
  }
}
```

### 星座列表

**接口**: `GET /api/constellation-match/list`

**返回**: 12 星座完整列表（包含英文名、中文名、符号）

## 星座对照表

| 英文 | 中文 | 符号 | 日期范围 |
|------|------|------|----------|
| aries | 白羊座 | ♈ | 3.21-4.19 |
| taurus | 金牛座 | ♉ | 4.20-5.20 |
| gemini | 双子座 | ♊ | 5.21-6.21 |
| cancer | 巨蟹座 | ♋ | 6.22-7.22 |
| leo | 狮子座 | ♌ | 7.23-8.22 |
| virgo | 处女座 | ♍ | 8.23-9.22 |
| libra | 天秤座 | ♎ | 9.23-10.23 |
| scorpio | 天蝎座 | ♏ | 10.24-11.22 |
| sagittarius | 射手座 | ♐ | 11.23-12.21 |
| capricorn | 摩羯座 | ♑ | 12.22-1.19 |
| aquarius | 水瓶座 | ♒ | 1.20-2.18 |
| pisces | 双鱼座 | ♓ | 2.19-3.20 |

## 注意事项

1. **API 调用频率**: 脚本内置 200ms 延迟，避免请求过快
2. **API 配额**: 如果返回"API 可用次数不足"，脚本会自动等待 60 秒
3. **数据更新**: 可定期执行脚本更新配对数据
4. **错误处理**: 失败的请求会记录日志，可重新执行脚本补充数据

## 故障排查

### API Key 无效
检查 `.env` 文件中的 `TIANAPI_KEY` 配置是否正确

### 数据库连接失败
检查 MySQL 服务是否运行，数据库配置是否正确

### 数据不完整
重新执行同步脚本，脚本会自动跳过已存在的数据
