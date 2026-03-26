# Chronos Eye - 时光之眼

日期查询多功能小程序，融合历史、生活、社交、AI 技术与节假日倒计时。

## 项目结构

```
Chronos-Eye/
├── miniprogram/       # 原生微信小程序（可直接运行）
│   ├── pages/
│   │   ├── index/         # 首页
│   │   ├── countdown/     # 倒计时页面
│   │   ├── schedule/      # 日程管理页面
│   │   └── almanac/       # 黄历页面
│   ├── utils/         # 工具函数
│   ├── assets/        # 静态资源
│   ├── app.js         # 小程序入口
│   ├── app.json       # 小程序配置
│   └── project.config.json
│
├── frontend/          # Taro 跨端前端项目（需编译）
│   └── src/
│
├── server/            # Node.js 后端服务
│   ├── src/
│   │   ├── controllers/   # 控制器
│   │   ├── routes/        # 路由
│   │   └── config/        # 数据库配置
│   └── data/              # SQLite 数据库
│
└── xx.md            # 项目策划文档
```

## 一期功能（已完成）

### 核心功能

1. **节假日倒计时**
   - 法定节假日倒计时卡片
   - 支持添加自定义倒计时
   - 倒计时列表展示

2. **日程管理**
   - 创建/编辑/删除日程
   - 日程优先级（高/中/低）
   - 日程状态管理（待办/已完成/已取消）
   - 月度统计看板

3. **黄历查询**
   - 今日黄历
   - 宜忌展示
   - 吉时、神煞、幸运颜色等

4. **首页**
   - 日期展示（公历 + 农历）
   - 倒计时卡片快捷展示
   - 快捷功能入口

## 快速开始

### 1. 启动后端服务

```bash
cd server
npm run dev
```

后端运行在 `http://localhost:3000`
使用 SQLite 数据库，无需额外安装

### 2. 打开微信小程序

1. 下载并打开 **微信开发者工具**
2. 导入 `miniprogram` 目录
3. 在详情中填入你的 AppID（或使用测试号）
4. 编译运行即可看到效果

### 3. 前端（可选）

Taro 版本需要修复 Node.js v23 兼容性问题，建议使用原生小程序版本。

## API 接口

| 接口 | 描述 |
|------|------|
| `GET /api/holidays` | 获取节假日列表 |
| `GET /api/holidays/countdown/list` | 获取倒计时列表 |
| `POST /api/holidays/countdown/add` | 添加倒计时 |
| `GET /api/schedules` | 获取日程列表 |
| `POST /api/schedules` | 创建日程 |
| `GET /api/almanac/today` | 获取今日黄历 |
| `GET /api/almanac/:date` | 获取指定日期黄历 |

## 开发计划

### 二期功能
- 文化内容社区
- 企业服务模块
- 社交分享增强
- 节假日倒计时个性化扩展

### 三期功能
- AI 深度集成（语音查询）
- 商业化功能
- AR 交互

## License

MIT
