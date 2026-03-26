# 星座功能技能包

## 星座运势同步

### 用法

下次你可以直接用自然语言命令：

| 你想做 | 直接说 |
|--------|--------|
| 从指定日期开始同步 | "同步星座运势从 2028-01-01 开始，用 300 次 API" |
| 继续同步 | "继续同步星座运势，用 200 次 API" |
| 同步指定月份范围 | "同步 2028 年 1 月到 6 月的星座运势" |
| 同步未来 N 个月 | "同步未来 3 个月的星座运势" |

### 执行命令

```bash
cd /Users/lifei/Chronos-Eye/server

# 从指定日期开始，到指定年月，限制 API 调用次数
node scripts/sync-future-constellation.js --from YYYY-MM-DD --to YYYY-MM --max-api N

# 同步未来 N 个月
node scripts/sync-future-constellation.js N

# 同步到指定年月
node scripts/sync-future-constellation.js YYYY-MM
```

### 参数说明

- `--from YYYY-MM-DD`: 从指定日期开始（如 `--from 2028-01-01`）
- `--to YYYY-MM`: 同步到指定年月（如 `--to 2028-12`）
- `--max-api N` 或 `--limit N`: 最大 API 调用次数限制（默认 500）

### 注意事项

1. 每次 API 调用 = 1 个星座 × 1 天，12 星座 = 12 条数据/天
2. 每月约 360-372 次 API 调用（30-31 天 × 12 星座）
3. 脚本会自动跳过数据库中已存在的数据
4. 达到 API 上限后会自动停止，可以再次执行继续同步


## 星座配对同步

### 用法

| 你想做 | 直接说 |
|--------|--------|
| 同步所有星座配对数据 | "同步星座配对数据" |
| 查询配对 | "查询白羊座和天秤座的配对" |

### 执行命令

```bash
cd /Users/lifei/Chronos-Eye/server

# 同步全部 12x12 星座配对数据（144 组，扣除同星座 12 组 = 132 组）
node scripts/sync-constellation-match.js
```

### API 端点

```bash
# 查询两个星座的配对
GET /api/constellation/match?sign1=aries&sign2=taurus

# 查询某星座与所有其他星座的配对
GET /api/constellation/match/:sign/all

# 查询所有星座配对数据
GET /api/constellation/match/all
```

### 注意事项

1. 共 132 组配对数据（12x12 扣除 12 组同星座）
2. 每次 API 调用 = 1 组配对
3. 脚本会自动跳过已存在的数据（使用 ON DUPLICATE KEY UPDATE）
4. 建议首次全量同步，后续按需更新
