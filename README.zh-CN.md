<div align="center">

<img src="public/zentra-logo.png" alt="Zentra Logo" width="128" />

# 🚀 Zentra Web Frontend

[![Next.js](https://img.shields.io/badge/Next.js-16.2-000000.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4.svg)](https://tailwindcss.com/)
[![Clerk](https://img.shields.io/badge/Clerk-Auth-6C47FF.svg)](https://clerk.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E.svg)](https://supabase.com/)
[![Google Maps](https://img.shields.io/badge/Google_Maps-Platform-4285F4.svg)](https://developers.google.com/maps)
[![Vitest](https://img.shields.io/badge/Vitest-4-6E9F18.svg)](https://vitest.dev/)

**面向曼哈顿的人群感知旅行规划**

[English](./README.md) | **简体中文**

</div>

---

**Zentra Web Frontend** 是 Zentra 的 Next.js Web 客户端，面向曼哈顿的个性化、人群感知旅行规划。🗽 告诉它你的出行节奏、兴趣、预算、无障碍需求，以及你能忍受多拥挤的人群；它会回给你一张实时人群地图、可并排对比的路线，以及一个真的知道 High Line 什么时候人挤人的 AI 助手。✨

---

## 📋 目录

- [✨ 功能](#-功能)
- [🔎 工作原理](#-工作原理)
- [🧰 技术栈](#-技术栈)
- [🚀 快速开始](#-快速开始)
  - [🧩 前置条件](#-前置条件)
  - [🔧 安装](#-安装)
  - [⚙️ 配置](#️-配置)
- [💻 使用](#-使用)
- [📁 项目结构](#-项目结构)
- [🔗 外部集成](#-外部集成)
- [🧬 测试](#-测试)
- [🤝 贡献](#-贡献)
- [📝 许可证](#-许可证)
- [📧 联系](#-联系)

---

## ✨ 功能

- **🗺️ 人群感知地图**（`/map`）—— 浏览景点，支持搜索、分类分组与实时人群徽章。可开启 H3 人群热力图，覆盖「现在」及最多八个曼哈顿本地小时；排序支持推荐、靠近我、A–Z、安静区域。
- **🤫 安静时段洞察** —— 每个地点面板都会显示当前繁忙度、未来 6 小时预测、24 小时内更安静的时间窗口，以及附近值得改去的更安静区域。
- **🚶 多模式路线规划**（`/routes`）—— 通过 Places 自动补全、地图点选或当前位置设定起终点，然后在折线地图上对比步行、公交与骑行方案。**带我去** 可从地图直接跳转。
- **💬 流式 AI 助手**（`/assistant`）—— 真正的会话线程，支持 Markdown 回复、思考与工具状态 UI、地点卡片和推荐提问。点击 **保存行程**，行程会出现在动态页。
- **📊 动态面板**（`/activity`）—— 基于你所在位置的八窗口人群预测、最忙与最安静的五处风景地标，以及你保存过的每一段行程（标题、备注、目标时间均可编辑）。
- **🎯 五步引导** —— 出行节奏、兴趣、预算区间、人群耐受度，以及行动 / 饮食 / 包容性需求 —— 之后都可在设置页修改。
- **❤️ 收藏与设置**（`/settings`）—— 在地图上收藏任意景点、Google place 或原始坐标；在地图或路线中重新打开已存地点；可添加备注。
- **📬 自动欢迎邮件** —— Clerk `user.created` webhook 通过 MXroute 发送欢迎邮件，并做幂等投递追踪。
- **📱 应用商店横幅** —— 在非桌面视口下显示可选、可关闭的 App Store / Play Store 横幅。

---

## 🔎 工作原理

本仓库是 **Web 前端**（`zentralol/web-frontend`）。运行时有三方在互相通信：🔀

- **本 Next.js 应用** 负责页面、Clerk 认证、经服务端路由 / Action 访问的 Supabase 数据，以及 Google Maps / Routes。
- **Express 后端**（`NEXT_PUBLIC_BACKEND_API_BASE_URL`）负责人群预测、更安静区域推荐与 AI 对话流 —— 全部在 `/api/v1` 前缀下，并携带用户的 Clerk 会话令牌：`Authorization: Bearer …`。
- **AI agent 服务** 只能经由后端网关（`POST /api/v1/chat/stream`）访问。前端不持有任何 agent 密钥。🔒

访问控制由 `proxy.ts` 中的 Clerk 中间件分两层把关：`/`、`/sign-in`、`/sign-up`、`/api/webhooks/clerk` 为公开路由；其余路由需要会话，且未完成引导的用户会先被导向 `/onboarding`。

> 📍 **覆盖范围说明：** 人群预测仅覆盖曼哈顿。范围之外会提示 *「Predictions are currently available for Manhattan only.」*

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

## 🚀 快速开始

### 🧩 前置条件

没有这些应用也能启动，但地图繁忙度、更安静推荐与助手功能需要它们：⚠️

- 本地运行 **Zentra Express 后端**，或将 `NEXT_PUBLIC_BACKEND_API_BASE_URL` 指向可达的 API。
- 一个 **Supabase** 项目，包含 [外部集成](#-外部集成) 中列出的表与数据。
- 已启用 **Routes API** 与 **Places API（New）** 的 **Google Cloud** 凭据。

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

然后填写下列配置 —— 切勿提交密钥。🙈

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

测试欢迎邮件时，将 Clerk 的 `user.created` webhook 指向已部署的 `/api/webhooks/clerk`。📮

---

## 💻 使用

启动开发服务器 —— Next.js 默认使用端口 **3000**，若后端也在本机运行，请为其指定不同的源：🏃

```bash
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000)。

本地类生产运行：

```bash
pnpm build
pnpm start
```

代码检查：`pnpm lint`。

### 🧭 应用路由

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

导航标签：**Map**、**Routes**、**Assistant**、**Activity**、**Settings**。

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

## 🔗 外部集成

### 🛰️ Express 后端

下列路径均位于 `NEXT_PUBLIC_BACKEND_API_BASE_URL` 的 `/api/v1` 之下，并由浏览器携带 Clerk Bearer：

| 后端路径 | 用途 |
|----------|------|
| `POST /predictions` | 某 lat/lng 的当前繁忙度 |
| `GET /predictions/forecast` | 分时 / 分窗口人群预测 |
| `POST /recommendations` | 附近更安静区域 |
| `POST /recommendations/quiet-times` | 某地点的更安静时段 |
| `POST /chat/stream` | 助手 SSE 流 |

### 🗄️ Supabase

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

### 🌍 Google Maps、Clerk 与 MXroute

- **Google Maps** —— 地图 UI 以及用于选点与逆地理的 Places / Geocoding；Routes API 经 `POST /api/routes/compute` 提供步行 / 公交 / 骑行规划。
- **Clerk** —— 页面与后端调用的会话认证，以及欢迎邮件的 webhook 验签。
- **MXroute** —— 欢迎邮件背后的 SMTP API。

---

## 🧬 测试

测试基于 Vitest：🧪

```bash
pnpm test           # 单次运行
pnpm test:watch     # 监听模式
pnpm test:coverage  # 带覆盖率
```

配置见 `vitest.config.ts`（默认 Node；部分组件测试使用 jsdom）。覆盖范围包括 map/heatmap、favorites、recommendations、assistant stream/transport、itineraries、webhook/email 等相关单元。

---

## 🤝 贡献

欢迎贡献！🎉

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

5. 向 `zentralol/web-frontend` 发起 Pull Request。🚀

---

## 📝 许可证

本项目为**私有项目**，保留所有权利。🔐

---

## 📧 联系

有问题或反馈？欢迎联系：

- **GitHub Issues**：[Open an Issue](https://github.com/zentralol/web-frontend/issues) 🐛
- **邮箱**：[hi@zentra.lol](mailto:hi@zentra.lol) 📩（设置页的 *Help & feedback* 同样可用）

---

由 Zentra 团队用 ❤️ 打造。编码愉快！🎉
