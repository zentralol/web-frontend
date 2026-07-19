# 🚀 Zentra Web Frontend

[English](./README.md) | **简体中文**

**Zentra Web Frontend** 是一个用于个性化旅行规划的 Next.js 应用。设置偏好、浏览人群热力图、规划路线，并与 AI 助手对话——围绕你的节奏、兴趣、无障碍需求与人群耐受度来规划行程。

---

## 📋 目录
- [✨ 功能](#-功能)
- [🚀 快速开始](#-快速开始)
  - [🔧 安装](#-安装)
  - [⚙️ 配置](#️-配置)
- [💻 使用](#-使用)
- [🧬 测试](#-测试)
- [🤝 贡献](#-贡献)
- [📝 许可证](#-许可证)
- [📧 联系](#-联系)

---

## ✨ 功能
- **Clerk 认证**：登录、注册与旅行偏好引导（onboarding）。
- **人群热力图**：在 `/map` 上通过 Google Maps 与后端预测展示实时热力与地点详情。
- **AI 行程助手**：在 `/assistant` 通过后端网关（`/api/v1/chat/stream`）进行流式对话。
- **路线、动态、收藏与设置**：规划行程、查看动态、收藏地点并管理账户偏好。

---

## 🚀 快速开始

### 🔧 安装
按以下步骤开始使用 **Zentra Web Frontend**：

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
将项目根目录的 `.env.example` 复制为 `.env` 并填写配置：

```bash
cp .env.example .env
```

主要环境变量：

| 变量 | 用途 |
|------|------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` | Clerk 认证 |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | 认证路由（默认 `/sign-in`、`/sign-up`） |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 客户端访问 |
| `SUPABASE_SERVICE_ROLE_KEY` | 服务端 Supabase 访问 |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Clerk `user.created` webhook 验签 |
| `MXROUTE_SERVER` / `MXROUTE_USERNAME` / `MXROUTE_PASSWORD` / `MXROUTE_FROM` | 欢迎邮件（MXroute SMTP） |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps（需启用 Routes API 与 Places API New） |
| `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` | 可选 Cloud Map ID（Advanced Markers） |
| `NEXT_PUBLIC_BACKEND_API_BASE_URL` | 后端源地址（请求走 `/api/v1`；默认 `http://localhost:3000`） |
| `NEXT_PUBLIC_IOS_APP_URL` / `NEXT_PUBLIC_ANDROID_APP_URL` | 应用商店横幅链接 |
| `DEEPSEEK_MODEL` | 新建会话的展示用模型标签 |

请勿提交真实密钥，将 `.env` 保留在本地。

地图与助手功能需要本地运行 Zentra 后端，或将 `NEXT_PUBLIC_BACKEND_API_BASE_URL` 指向可达的 API。聊天通过 `/api/v1/chat/stream` 流式传输，并使用调用方的 Clerk token。

---

## 💻 使用
使用方式如下：

1. 启动开发服务器：
   ```bash
   pnpm dev
   ```

2. 在浏览器打开 [http://localhost:3000](http://localhost:3000)。

3. 本地生产模式运行：
   ```bash
   pnpm build
   pnpm start
   ```

登录后常用路由：`/`（首页）、`/map`、`/assistant`、`/routes`、`/activity`、`/settings`。

---

## 🧬 测试
测试使用 Vitest。运行：

```bash
pnpm test
```

监听模式与覆盖率：

```bash
pnpm test:watch
pnpm test:coverage
```

---

## 🤝 贡献
欢迎贡献！步骤如下：

1. Fork 本仓库。

2. 创建新分支：
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. 提交更改：
   ```bash
   git commit -m "Add your awesome feature"
   ```

4. 推送到远程分支：
   ```bash
   git push origin feature/your-feature-name
   ```

5. 向 `zentralol/web-frontend` 发起 Pull Request。

---

## 📝 许可证
本项目为**私有项目**，保留所有权利。

---

## 📧 联系
问题或反馈：

- **GitHub Issues**：[Open an Issue](https://github.com/zentralol/web-frontend/issues)

---

由 Zentra 团队用 ❤️ 打造。编码愉快！
