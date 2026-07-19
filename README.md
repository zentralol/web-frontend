# 🚀 Zentra Web Frontend

**English** | [简体中文](./README.zh-CN.md)

**Zentra Web Frontend** is a Next.js app for personalized travel planning. Set your preferences, explore crowd-aware maps, build routes, and chat with an AI assistant that plans trips around your pace, interests, accessibility needs, and crowd tolerance.

---

## 📋 Table of Contents
- [✨ Features](#-features)
- [🚀 Getting Started](#-getting-started)
  - [🔧 Installation](#-installation)
  - [⚙️ Configuration](#️-configuration)
- [💻 Usage](#-usage)
- [🧬 Testing](#-testing)
- [🤝 Contributing](#-contributing)
- [📝 License](#-license)
- [📧 Contact](#-contact)

---

## ✨ Features
- **Clerk auth**: Sign-in, sign-up, and onboarding for travel preferences.
- **Crowd-aware map**: Live heatmap and location detail on `/map` via Google Maps and backend predictions.
- **AI trip assistant**: Streaming chat on `/assistant` through the backend gateway (`/api/v1/chat/stream`).
- **Routes, activity, favorites, and settings**: Plan itineraries, review activity, save places, and manage account preferences.

---

## 🚀 Getting Started

### 🔧 Installation
To get started with **Zentra Web Frontend**, follow these steps:

1. Clone the repository:
   ```bash
   git clone git@github.com:zentralol/web-frontend.git
   ```

2. Navigate to the project directory:
   ```bash
   cd web-frontend
   ```

3. Install the dependencies:
   ```bash
   pnpm install
   ```

### ⚙️ Configuration
Copy `.env.example` to `.env` in the project root and fill in the values:

```bash
cp .env.example .env
```

Key environment variables:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` | Clerk authentication |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Auth route paths (defaults: `/sign-in`, `/sign-up`) |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client access |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side Supabase access |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Clerk `user.created` webhook verification |
| `MXROUTE_SERVER` / `MXROUTE_USERNAME` / `MXROUTE_PASSWORD` / `MXROUTE_FROM` | Welcome email via MXroute SMTP |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps (enable Routes API + Places API New) |
| `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` | Optional Cloud Map ID for Advanced Markers |
| `NEXT_PUBLIC_BACKEND_API_BASE_URL` | Backend origin (requests use `/api/v1`; default `http://localhost:3000`) |
| `NEXT_PUBLIC_IOS_APP_URL` / `NEXT_PUBLIC_ANDROID_APP_URL` | Smart app banner store links |
| `DEEPSEEK_MODEL` | Display/metadata model label for new conversations |

Do not commit real secrets. Keep `.env` local.

For map and assistant features, run the Zentra backend locally (or point `NEXT_PUBLIC_BACKEND_API_BASE_URL` at a reachable API). Chat streams through `/api/v1/chat/stream` using the caller's Clerk token.

---

## 💻 Usage
Here’s how to use **Zentra Web Frontend**:

1. Start the development server:
   ```bash
   pnpm dev
   ```

2. Open [http://localhost:3000](http://localhost:3000) in your browser.

3. For a production-like local run:
   ```bash
   pnpm build
   pnpm start
   ```

Useful routes once signed in: `/` (home), `/map`, `/assistant`, `/routes`, `/activity`, `/settings`.

---

## 🧬 Testing
Tests use Vitest. Run them with:

```bash
pnpm test
```

Watch mode and coverage:

```bash
pnpm test:watch
pnpm test:coverage
```

---

## 🤝 Contributing
We welcome contributions! If you'd like to contribute, please follow these steps:

1. Fork the repository.

2. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. Commit your changes:
   ```bash
   git commit -m "Add your awesome feature"
   ```

4. Push to the branch:
   ```bash
   git push origin feature/your-feature-name
   ```

5. Open a pull request against `zentralol/web-frontend`.

---

## 📝 License
This project is **private**. All rights reserved.

---

## 📧 Contact
Questions or feedback:

- **GitHub Issues**: [Open an Issue](https://github.com/zentralol/web-frontend/issues)

---

Made with ❤️ by the Zentra team. Happy coding!
