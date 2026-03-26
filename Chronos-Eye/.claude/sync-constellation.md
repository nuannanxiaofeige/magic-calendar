# sync-constellation - 星座运势同步

同步星座运势数据到数据库。

## 用法

下次你可以直接用自然语言命令：

| 你想做 | 直接说 |
|--------|--------|
| 从指定日期开始同步 | "同步星座运势从 2028-01-01 开始，用 300 次 API" |
| 继续同步 | "继续同步星座运势，用 200 次 API" |
| 同步指定月份范围 | "同步 2028 年 1 月到 6 月的星座运势" |
| 同步未来 N 个月 | "同步未来 3 个月的星座运势" |

## 底层命令

```bash
cd /Users/lifei/Chronos-Eye/server

# 从指定日期开始，到指定年月，限制 API 调用次数
node scripts/sync-future-constellation.js --from YYYY-MM-DD --to YYYY-MM --max-api N

# 同步未来 N 个月
node scripts/sync-future-constellation.js N

# 同步到指定年月
node scripts/sync-future-constellation.js YYYY-MM
```

## 参数说明

- `--from YYYY-MM-DD`: 从指定日期开始（如 `--from 2028-01-01`）
- `--to YYYY-MM`: 同步到指定年月（如 `--to 2028-12`）
- `--max-api N` 或 `--limit N`: 最大 API 调用次数限制（默认 500）

## 注意事项

1. 每次 API 调用 = 1 个星座 × 1 天，12 星座 = 12 条数据/天
2. 每月约 360-372 次 API 调用（30-31 天 × 12 星座）
3. 脚本会自动跳过数据库中已存在的数据
4. 达到 API 上限后会自动停止，可以再次执行继续同步
