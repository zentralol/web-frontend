# 🚀 Zentra Web Frontend

[English](./README.md) | **简体中文**

**Zentra Web Frontend** 是 Zentra 的 Next.js Web 客户端，面向曼哈顿的个性化旅行规划。用户可设置出行节奏、兴趣、无障碍与人群偏好，随后浏览人群热力图、对比路线、与 AI 助手对话，并查看动态与已保存行程。

---

## 📋 目录

- [🔎 概览](#-概览)
- [🧰 技术栈](#-技术栈)
- [✨ 功能](#-功能)
- [🧭 应用路由](#-应用路由)
- [🔗 外部集成](#-外部集成)
- [📁 项目结构](#-项目结构)
- [🚀 快速开始](#-快速开始)
  - [🔧 安装](#-安装)
  - [⚙️ 配置](#️-配置)
  - [🧩 前置条件](#-前置条件)
- [💻 使用](#-使用)
- [🧬 测试](#-测试)
- [🤝 贡献](#-贡献)
- [📝 许可证](#-许可证)
- [📧 联系](#-联系)

---

## 🔎 概览

本仓库是 **Web 前端**（`zentralol/web-frontend`）。运行时行为如下：

- 浏览器访问 **本 Next.js 应用** 获取页面、Clerk 认证、经服务端路由/Action 访问的 Supabase 数据，以及 Google Maps / Routes。
- 受保护的人群预测、更安静区域推荐与 AI 对话流，请求发往 **Express 后端**（`NEXT_PUBLIC_BACKEND_API_BASE_URL`）的 `/api/v1` 前缀，并携带用户 Clerk 会话令牌：`Authorization: Bearer …`。
- 聊天经后端网关流式转发（`POST /api/v1/chat/stream`）至内部 AI agent 服务。前端不会用单独的 agent 密钥直连 agent。

人群预测在 UI 中以曼哈顿为覆盖范围；超出覆盖时会提示 “Predictions are currently available for Manhattan only.”

---

## 🧰 技术栈

| 领域 | 包 / 工具 |
|------|-----------|
| 框架 | Next.js 16、React 19、TypeScript |
| 样式 | Tailwind CSS 4、Lucide 图标 |
| 认证 | Clerk（`@clerk/nextjs`） |
| 数据 | Supabase JS（服务端使用 service-role 客户端） |
| 地图 | `@vis.gl/react-google-maps`、`h3-js` |
| AI 聊天 UI | Vercel AI SDK（`ai`、`@ai-sdk/react`） |
| Markdown | `react-markdown`、`remark-gfm`、`react-syntax-highlighter` |
| 分析 | `@vercel/speed-insights` |
| 包管理 | pnpm |
| 测试 | Vitest 4、Testing Library、jsdom |

---

## ✨ 功能

### 认证与引导

- Clerk 登录 / 注册页面与导航栏弹窗；已登录用户显示 `UserButton`。
- `proxy.ts` 中的 Clerk 中间件：公开路由为 `/`、`/sign-in`、`/sign-up`、`/api/webhooks/clerk`。其余路由需会话（否则重定向到 `/sign-in?redirect_url=…`）。
- 未完成引导 → `/onboarding`；已完成用户访问 `/onboarding` → `/welcome-back`。
- 五步引导向导将偏好写入 Supabase `onboarding_preferences`：
  - 出行节奏（relaxed / moderate / packed）
  - 兴趣（美食、自然、历史、艺术、夜生活、购物、建筑、本地文化）
  - 预算区间
  - 人群耐受度
  - 行动、饮食与包容性需求

### 首页

- 未登录：落地文案与前往 `/assistant`、`/map` 的 CTA。
- 已登录且完成引导：个性化欢迎、景点搜索 → `/map?q=…`、最多三条兴趣匹配推荐 → `/map?id=…`，以及地图与设置入口。

### 地图（`/map`）

- 浏览景点（搜索、分类、人群徽章）。
- 排序：推荐、靠近我、A–Z、安静区域。
- Google 地图：按分类着色的标记、定位、点击选点。
- 人群热力图开关（偏好存于 `localStorage`）：经 `/api/map/heatmap` 的 H3 多边形；时间选项为「现在」及最多八个曼哈顿本地小时。
- 附近更安静区域：后端 `POST /api/v1/recommendations`。
- 地点面板：当前繁忙度与未来 6 小时预测（`/api/v1/predictions` 与 `/predictions/forecast`）、24 小时更安静时段（`/api/v1/recommendations/quiet-times`）、收藏、**带我去** → `/routes?destLat&destLng&destLabel`。
- Deep link：`?q=`、`?id=`、`?lat&lng&name&address&placeId`。

### 路线（`/routes`）

- 起点 / 终点：Places 自动完成、地图点选或当前位置。
- 经 `POST /api/routes/compute`（Google Routes API）规划步行 / 公交 / 骑行。
- 折线地图、模式切换、支持时分享。
- Deep link：`/routes?destLat&destLng&destLabel`（尽量将起点设为当前位置）。
- 代码中默认起终点标签标注为 mock data（High Line → Washington Square Park）。

### 助手（`/assistant`）

- 入口创建或打开最新会话：`/assistant/{conversationId}`。
- 侧栏：会话列表、新建、软删除（含空会话 / 最后会话规则）、乐观标题。
- 流式对话：后端 `POST /api/v1/chat/stream`，`clientType: "web"`，可选 lat/lng。
- Markdown 回复、思考 / 工具状态 UI、地点卡片、推荐提问。
- **保存行程** 将地点卡片写入 `saved_itineraries`（在 Activity 可见）。
- 历史存于 Supabase `conversations` / `messages`；新建会话写入 `DEEPSEEK_MODEL` 元数据（仅展示；真实模型调用由 agent 负责）。

### 动态（`/activity`）

- 基于用户坐标的八窗口人群预测（后端 predictions）。
- 来自 `attraction_predictions` 的前五处风景地标（最忙 / 最安静），带 Take me there。
- 已保存行程：编辑标题、备注、目标时间；删除；在路线中打开地点。

### 设置与收藏

- `favorite_places` 中的已存地点（备注、在地图 / 路线打开、移除）。
- 地图上可收藏（景点、Google place 或坐标身份）。
- 帮助与反馈：`mailto:hi@zentra.lol`。
- 可编辑与引导相同的旅行偏好字段。

### 欢迎邮件

- Clerk webhook `POST /api/webhooks/clerk` 在 `user.created` 时通过 MXroute SMTP 发送欢迎邮件。
- 投递状态记录在 `welcome_email_deliveries`（幂等预约 / 提交）。

### 应用商店横幅

- 非桌面视口下，若配置了 `NEXT_PUBLIC_IOS_APP_URL` / `NEXT_PUBLIC_ANDROID_APP_URL`，显示可选商店横幅；关闭状态存于 `localStorage`。

---

## 🧭 应用路由

| 路径 | 访问 | 用途 |
|------|------|------|
| `/` | 公开 | 落地页或个性化首页 |
| `/sign-in`、`/sign-up` | 公开 | Clerk 认证 |
| `/onboarding` | 已登录 | 偏好引导 |
| `/welcome-back` | 已登录 | 引导完成后落地 |
| `/map` | 已登录 + 已引导 | 人群地图工作区 |
| `/routes` | 已登录 + 已引导 | 多模式路线规划 |
| `/assistant` | 已登录 + 已引导 | 重定向到会话 |
| `/assistant/[conversationId]` | 已登录 + 已引导 | AI 对话 |
| `/activity` | 已登录 + 已引导 | 预测、地标、已存行程 |
| `/settings` | 已登录 + 已引导 | 地点、反馈、偏好 |

导航标签：Map、Routes、Assistant、Activity、Settings。

---

## 🔗 外部集成

### Express 后端（`NEXT_PUBLIC_BACKEND_API_BASE_URL`）

下列路径均在 `/api/v1` 下，并由浏览器携带 Clerk Bearer：

| 后端路径 | 用途 |
|----------|------|
| `POST /predictions` | 某 lat/lng 的当前繁忙度 |
| `GET /predictions/forecast` | 分时 / 分窗口人群预测 |
| `POST /recommendations` | 附近更安静区域 |
| `POST /recommendations/quiet-times` | 某地点的更安静时段 |
| `POST /chat/stream` | 助手 SSE 流 |

### Supabase

服务端使用 `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`。

| 表 | 用途 |
|----|------|
| `onboarding_preferences` | 引导 / 设置 / 中间件门禁 |
| `attractions` | 地图、首页、动态目录 |
| `attraction_predictions` | 人群徽章与热门地标 |
| `heatmap_predictions` | 地图热力 |
| `conversations`、`messages` | 助手历史 |
| `favorite_places` | 收藏地点 |
| `saved_itineraries` | 从助手保存的行程 |
| `welcome_email_deliveries` | 欢迎邮件投递账本 |

### Google Maps

- 地图 UI 与 Places / Geocoding（选点与逆地理）。
- Routes API 用于步行 / 公交 / 骑行（`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`；需在 Google Cloud 启用 Routes API 与 Places API New）。

### Clerk

- 页面与后端调用的会话认证；欢迎邮件 webhook 验签（`CLERK_WEBHOOK_SIGNING_SECRET`）。

### MXroute

- 欢迎邮件 SMTP API（`MXROUTE_SERVER`、`MXROUTE_USERNAME`、`MXROUTE_PASSWORD`、`MXROUTE_FROM`）。

---

## 📁 项目结构

```
web-frontend/
├── app/                 # App Router 页面、布局、loading、API 路由
├── components/          # UI：map、routes、assistant、activity、onboarding、settings 等
├── lib/                 # 领域逻辑：backend 客户端、map、assistant、attractions 等
├── supabase/            # Supabase 相关项目文件
├── public/              # 静态资源
├── proxy.ts             # Clerk 中间件与引导重定向
├── vitest.config.ts
├── package.json
├── README.md
└── README.zh-CN.md
```

---

## 🚀 快速开始

### 🔧 安装

1. 克隆仓库：
   ```bash
   git clone git@github.com:zentralol/web-frontend.git
   ```

2. 进入项目目录：
   ```bash
   cd web-frontend
   ```

3. 安装依赖：
   ```bash
   pnpm install
   ```

### ⚙️ 配置

```bash
cp .env.example .env
```

填写配置（勿提交密钥）：

| 变量 | 用途 |
|------|------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk 公钥 |
| `CLERK_SECRET_KEY` | Clerk 密钥 |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | 登录路径（默认 `/sign-in`） |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | 注册路径（默认 `/sign-up`） |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | 登录后回跳（默认 `/`） |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | 注册后回跳（默认 `/`） |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL（服务端与 service role 一并使用） |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 列于 `.env.example` 的 Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | 本应用服务端 Supabase 访问 |
| `CLERK_WEBHOOK_SIGNING_SECRET` | 校验 Clerk `user.created` webhook |
| `MXROUTE_SERVER` / `MXROUTE_USERNAME` / `MXROUTE_PASSWORD` / `MXROUTE_FROM` | MXroute 欢迎邮件 |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | 地图 UI + Routes 计算 |
| `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` | 可选 Cloud Map ID（见 `.env.example` 说明） |
| `NEXT_PUBLIC_BACKEND_API_BASE_URL` | Express 后端源（默认 `http://localhost:3000`；路径使用 `/api/v1`） |
| `NEXT_PUBLIC_IOS_APP_URL` / `NEXT_PUBLIC_ANDROID_APP_URL` | 应用商店横幅链接 |
| `DEEPSEEK_MODEL` | 新建会话的模型标签（默认 `deepseek-v4-flash`） |

测试欢迎邮件时，将 Clerk 的 `user.created` webhook 指向已部署的 `/api/webhooks/clerk`。

### 🧩 前置条件

地图繁忙度、更安静推荐与助手需要：

- 运行 Zentra Express 后端，或将 `NEXT_PUBLIC_BACKEND_API_BASE_URL` 指向可达 API。
- 应用所用的 Supabase 表与数据可用（景点、预测等）。
- Google Cloud 已启用 Routes API 与 Places API（New），用于路线与地点搜索。

---

## 💻 使用

启动开发服务器（Next.js 默认端口 **3000**——若与后端同机同端口，请为后端使用不同源）：

```bash
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000)。

本地类生产运行：

```bash
pnpm build
pnpm start
```

另有：`pnpm lint`。

### Deep link

| 模式 | 效果 |
|------|------|
| `/map?q=…` | 预填景点搜索 |
| `/map?id={attractionId}` | 打开指定景点 |
| `/map?lat&lng&name&address&placeId` | 打开任意位置 |
| `/routes?destLat&destLng&destLabel` | 预填终点 |
| `/assistant/{conversationId}` | 打开对话 |
| `/sign-in?redirect_url=…` | 登录后回跳 |

---

## 🧬 测试

使用 Vitest：

```bash
pnpm test
pnpm test:watch
pnpm test:coverage
```

配置见 `vitest.config.ts`（默认 Node；部分组件测试使用 jsdom）。覆盖 map/heatmap、favorites、recommendations、assistant stream/transport、itineraries、webhook/email 等相关单元。

---

## 🤝 贡献

1. Fork 本仓库。
2. 创建分支：
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. 提交更改：
   ```bash
   git commit -m "Add your awesome feature"
   ```
4. 推送分支：
   ```bash
   git push origin feature/your-feature-name
   ```
5. 向 `zentralol/web-frontend` 发起 Pull Request。

---

## 📝 许可证

本项目为**私有项目**，保留所有权利。

---

## 📧 联系

- **GitHub Issues**：[Open an Issue](https://github.com/zentralol/web-frontend/issues)
- **邮箱**：[hi@zentra.lol](mailto:hi@zentra.lol)（设置页 Help & feedback）

---

由 Zentra 团队用 ❤️ 打造。编码愉快！
