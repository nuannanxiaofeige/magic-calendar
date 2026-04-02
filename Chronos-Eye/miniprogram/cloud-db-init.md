# 云开发主题背景系统 - 集成指南

## 已创建的文件

- `utils/theme.js` - 主题服务，封装了主题的获取、切换、上传等方法
- `components/global-bg/` - 全局背景组件（4个文件）
- `cloud-db-init.md` - 本文档

## 集成步骤

### 1. 配置云环境ID

修改 `app.js` 中的云环境ID：

```javascript
// app.js
wx.cloud.init({
  env: '你的云环境ID',  // 例如：magic-calendar-xxx
  traceUser: true
})
```

云环境ID可以在微信云开发控制台 → 「设置」→ 「环境设置」中查看。

---

### 2. 创建云数据库集合

在微信云开发控制台中操作：

1. 进入「数据库」页面
2. 点击「+」创建集合，命名为 `theme_config`

---

### 3. 添加主题配置数据

在 `theme_config` 集合中添加以下示例数据：

```json
[
  {
    "_id": "spring",
    "name": "春日樱花",
    "type": "season",
    "value": "spring",
    "background": "cloud://your-env-id/backgrounds/spring.png",
    "isActive": true,
    "createTime": "2026-01-01"
  },
  {
    "_id": "summer",
    "name": "夏日海滩",
    "type": "season",
    "value": "summer",
    "background": "cloud://your-env-id/backgrounds/summer.png",
    "isActive": false,
    "createTime": "2026-01-01"
  },
  {
    "_id": "autumn",
    "name": "秋日枫叶",
    "type": "season",
    "value": "autumn",
    "background": "cloud://your-env-id/backgrounds/autumn.png",
    "isActive": false,
    "createTime": "2026-01-01"
  },
  {
    "_id": "winter",
    "name": "冬日暖阳",
    "type": "season",
    "value": "winter",
    "background": "cloud://your-env-id/backgrounds/winter.png",
    "isActive": false,
    "createTime": "2026-01-01"
  },
  {
    "_id": "spring_festival",
    "name": "春节红",
    "type": "festival",
    "value": "春节",
    "background": "cloud://your-env-id/backgrounds/spring_festival.png",
    "isActive": false,
    "createTime": "2026-01-01"
  },
  {
    "_id": "qixi",
    "name": "七夕浪漫",
    "type": "festival",
    "value": "七夕",
    "background": "cloud://your-env-id/backgrounds/qixi.png",
    "isActive": false,
    "createTime": "2026-01-01"
  }
]
```

---

### 4. 上传背景图片到云存储

1. 进入「云存储」页面
2. 创建 `backgrounds` 文件夹
3. 上传你的背景图片
   - 建议尺寸：1125x2436（iPhone）或 750x1334
   - 支持格式：PNG、JPG
4. 记录每张图片的云存储路径（`cloud://xxx/backgrounds/xxx.png`）

---

### 5. 更新主题配置的 background 字段

将第3步中添加的数据中的 `cloud://your-env-id/backgrounds/xxx.png` 替换为实际上传的图片路径。

---

### 6. 在其他页面使用全局背景

如果需要在其他页面也显示全局背景，按以下步骤修改：

#### 6.1 修改页面的 .js 文件

在 `onShow` 中添加：

```javascript
onShow: function () {
  const app = getApp()
  app.applyGlobalBackground(this)
},
```

#### 6.2 修改页面的 .wxml 文件

在页面最外层容器**内部**的顶部添加：

```xml
<!-- 全局背景 -->
<view class="global-bg" wx:if="{{globalBgUrl}}" style="background-image: url('{{globalBgUrl}}');"></view>
```

#### 6.3 修改页面的 .wxss 文件

添加全局背景样式：

```css
/* 全局背景 */
.global-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  background-size: cover;
  background-position: center top;
  background-attachment: fixed;
}
```

---

## 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| _id | string | 主题唯一ID |
| name | string | 主题显示名称 |
| type | string | 主题类型：season（季节）/ festival（节日）/ custom（自定义） |
| value | string | 主题值：spring/summer/autumn/winter 或具体节日名 |
| background | string | 云存储中的背景图片路径 |
| isActive | boolean | 是否为当前激活的主题 |
| createTime | string/Date | 创建时间 |

---

## 自动按日期切换主题（可选功能）

如果你想让主题根据日期自动切换，修改 `app.js` 的 `onLaunch`：

```javascript
onLaunch: async function () {
  // ... 其他初始化代码 ...

  // 初始化主题背景
  await this.initTheme()

  // 自动根据日期切换主题
  await this.autoSwitchThemeByDate()
},

// 根据当前日期自动切换主题
async autoSwitchThemeByDate() {
  const now = new Date()
  const month = now.getMonth() + 1

  // 根据月份判断季节
  let season = ''
  if (month >= 3 && month <= 5) season = 'spring'
  else if (month >= 6 && month <= 8) season = 'summer'
  else if (month >= 9 && month <= 11) season = 'autumn'
  else season = 'winter'

  // 查询是否有匹配的主题
  const themeResult = await theme.getThemeByDate('season', season)
  if (themeResult) {
    this.globalData.bgImageUrl = themeResult.bgUrl
    wx.setStorageSync('globalBgUrl', themeResult.bgUrl)
    console.log('已自动切换为', season, '主题')
  }
},
```

---

## API 说明

### theme.js 提供的接口

```javascript
const theme = require('./utils/theme.js')

// 获取当前激活的主题
theme.getCurrentTheme()

// 获取所有主题列表
theme.getAllThemes()

// 切换到指定主题
theme.switchTheme(themeId)

// 根据类型和值获取主题（如：节日、季节）
theme.getThemeByDate(type, value)

// 上传新背景图片
theme.uploadBackground(tempFilePath, themeData)
```

### app.js 提供的方法

```javascript
const app = getApp()

// 应用全局背景到页面（在 onShow 中调用）
app.applyGlobalBackground(this)

// 切换主题
app.switchTheme(themeId)

// 获取当前背景URL
app.globalData.bgImageUrl
```
