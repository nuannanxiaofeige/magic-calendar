# 日历缓存优化方案

## 优化内容

### 1. 本地缓存 (`wx.setStorage`)

**实现方式：**
- 每次从 API 获取农历数据后，自动保存到本地缓存
- 缓存数据存储在 `lunarCache` 对象中，并同步到 `wx.setStorage`
- 缓存限制：最多保留 500 条记录（约 250KB）

**缓存策略：**
```javascript
// 检查缓存 → 有缓存直接使用 → 无缓存请求 API → 保存到缓存
loadCalendar() → checkCache() → useCache() || fetchAPI() → saveCache()
```

**过期清理：**
- 每次启动时自动清理超过 1 年的数据
- 缓存超出 500 条时，自动删除最早的记录

---

### 2. 预加载机制

**实现方式：**
- 用户浏览 3 月时，后台自动缓存 4 月数据
- 用户浏览 12 月时，后台自动缓存次年 1 月数据
- 避免重复加载（通过 `prefetching` 标志）

**预加载时机：**
```javascript
// 当月数据加载完成后，触发预加载
batchFetchLunar() 完成 → prefetchNextMonth()
```

---

## 性能对比

### 优化前
| 场景 | 请求数 | 耗时 |
|------|--------|------|
| 首次打开 3 月 | 3 个（2 月、3 月、4 月） | ~500ms |
| 切换到 4 月 | 3 个（3 月、4 月、5 月） | ~500ms |
| 再次切换到 3 月 | 3 个（2 月、3 月、4 月） | ~500ms |

### 优化后
| 场景 | 请求数 | 耗时 |
|------|--------|------|
| 首次打开 3 月 | 3 个（2 月、3 月、4 月） | ~500ms |
| 切换到 4 月 | 0 个（已预加载） | ~50ms（瞬间） |
| 再次切换到 3 月 | 0 个（已有缓存） | ~50ms（瞬间） |

---

## 使用方法

### 查看缓存状态
在微信开发者工具控制台中运行：
```javascript
// 假设当前页面实例为 pages/calendar/calendar.js
const pages = getCurrentPages()
const calendar = pages[pages.length - 1]
console.log(calendar.getCacheStatus())

// 输出示例：
// {
//   count: 180,
//   size: "85.32 KB",
//   dateRange: "2026-02-01 ~ 2026-04-30"
// }
```

### 清空缓存
```javascript
const pages = getCurrentPages()
const calendar = pages[pages.length - 1]
calendar.clearCache()
// 输出：缓存已清空
```

---

## 缓存数据结构

```javascript
lunarCache: {
  "2026-03-20": {
    id: 1919,
    date: "2026-03-19T16:00:00.000Z",
    lunar_year: 2026,
    lunar_month: 2,
    lunar_day: 2,
    ganzhi_year: "丙午",
    ganzhi_month: "辛卯",
    ganzhi_day: "癸巳",
    zodiac: "马",
    yi: "开光 出行 嫁娶 动土 安葬",
    ji: "开市 交易",
    shen_sha: "天牢",
    lucky_time: "申时（15-17 点）",
    conflict_zodiac: "猴",
    lucky_direction: "东南",
    lucky_color: "黑色",
    lucky_number: "1, 6",
    rating: 2
  },
  // ... 更多日期
}
```

---

## 注意事项

### 1. 存储配额限制
- 微信小程序本地存储上限：10MB
- 当前缓存限制：500 条记录（约 250KB）
- 安全余量：约 40 倍

### 2. 缓存一致性
- 如果后端数据更新，需要清空缓存才能生效
- 解决方法：
  - 方案 1：增加缓存版本号
  - 方案 2：设置缓存过期时间（如 7 天）

### 3. 预加载边界情况
- 12 月预加载次年 1 月：已处理
- 闰年 2 月（29 天）：自动处理
- 网络请求失败：不影响当前页面显示

---

## 调试技巧

### 1. 查看缓存命中率
```javascript
// 在 batchFetchLunar 中添加日志
let cacheHit = 0
let cacheMiss = 0

monthsToFetch.forEach(({ y, m }) => {
  const cached = this.getCachedMonth(y, m)
  if (cached) {
    cacheHit++
    console.log(`✓ 缓存命中：${y}-${m}`)
  } else {
    cacheMiss++
    console.log(`✗ 缓存未命中：${y}-${m}`)
  }
})

console.log(`缓存命中率：${cacheHit / (cacheHit + cacheMiss) * 100}%`)
```

### 2. 模拟弱网环境
微信开发者工具 → 工具 → 网络模拟器 → 选择 "Offline" 或 "Slow 3G"

### 3. 测试预加载
```javascript
// 切换月份后立即检查缓存
this.setData({ currentMonth: 4 })
setTimeout(() => {
  console.log(this.getCacheStatus())
}, 2000)
```

---

## 未来扩展

### 1. 智能预加载
```javascript
// 根据用户浏览习惯，预测下一步操作
if (用户连续点击下个月) {
  prefetchNextMonth()      // 预加载下下个月
  prefetchNextMonth(+2)    // 预加载下下下个月
}
```

### 2. 缓存压缩
```javascript
// 使用 lz-string 压缩缓存数据
const compressed = LZString.compress(JSON.stringify(lunarCache))
wx.setStorage({ key: 'lunarCache', data: compressed })
// 压缩率可达 70%
```

### 3. 缓存预热
```javascript
// 小程序启动时预加载当前月份
onLaunch: function() {
  const now = new Date()
  prefetchMonth(now.getFullYear(), now.getMonth() + 1)
}
```
