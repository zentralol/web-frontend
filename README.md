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

**Crowd-Aware Travel Planning for Manhattan**

**English** | [简体中文](./README.zh-CN.md)

</div>

---

**Zentra Web Frontend** is the Next.js web client for Zentra — personalized, crowd-aware travel planning for Manhattan. 🗽 Tell it your pace, interests, budget, accessibility needs, and how much of a crowd you can stand; it gives you back a live crowd map, side-by-side routes, and an AI assistant that actually knows when the High Line is packed. ✨

---

## 📋 Table of Contents

- [✨ Features](#-features)
- [🔎 How It Works](#-how-it-works)
- [🧰 Tech Stack](#-tech-stack)
- [🚀 Getting Started](#-getting-started)
  - [🧩 Prerequisites](#-prerequisites)
  - [🔧 Installation](#-installation)
  - [⚙️ Configuration](#️-configuration)
- [💻 Usage](#-usage)
- [📁 Project Structure](#-project-structure)
- [🔗 External Integrations](#-external-integrations)
- [🧬 Testing](#-testing)
- [🤝 Contributing](#-contributing)
- [📝 License](#-license)
- [📧 Contact](#-contact)

---

## ✨ Features

- **🗺️ Crowd-aware map** (`/map`) — Browse attractions with search, category groups, and live busyness badges. Toggle an H3 crowd heatmap covering "Now" plus up to eight Manhattan-local hours, and sort by recommended, near me, A–Z, or quiet areas.
- **🤫 Quiet-time intelligence** — Every location panel shows current busyness, a next-6-hours forecast, quieter windows across 24 hours, and quieter nearby areas worth walking to instead.
- **🚶 Multi-mode route planning** (`/routes`) — Pick origin and destination by Places autocomplete, map click, or current location, then compare walking, transit, and cycling options on a polyline map. **Take me there** hands off straight from the map.
- **💬 Streaming AI assistant** (`/assistant`) — A real chat thread with Markdown replies, thinking and tool-status UI, place cards, and suggested prompts. Hit **Save trip** and the itinerary lands on your Activity page.
- **📊 Activity dashboard** (`/activity`) — An eight-window crowd forecast for where you are, the five busiest and quietest scenic landmarks, and every trip you've saved (editable title, note, and target time).
- **🎯 Five-step onboarding** — Travel pace, interests, budget range, crowd tolerance, and mobility / dietary / inclusion needs — all editable later from Settings.
- **❤️ Favorites and settings** (`/settings`) — Heart any attraction, Google place, or raw coordinate from the map; reopen saved places on the map or in a route; leave notes.
- **📬 Automatic welcome email** — A Clerk `user.created` webhook fires a welcome email through MXroute, with idempotent delivery tracking.
- **📱 Smart app banner** — On non-desktop viewports, an optional (and dismissible) App Store / Play Store banner.

---

## 🔎 How It Works

This repository is the **web frontend** (`zentralol/web-frontend`). At runtime, three things are talking to each other: 🔀

- **This Next.js app** serves pages, Clerk auth, Supabase-backed data (through server routes and actions), and Google Maps / Routes.
- **The Express backend** at `NEXT_PUBLIC_BACKEND_API_BASE_URL` handles crowd predictions, quieter-area recommendations, and the AI chat stream — all under the `/api/v1` prefix, authenticated with the user's Clerk session token as `Authorization: Bearer …`.
- **The AI agent service** is reached only through the backend gateway (`POST /api/v1/chat/stream`). The frontend never holds an agent secret. 🔒

Access is gated in two layers by the Clerk middleware in `proxy.ts`: `/`, `/sign-in`, `/sign-up`, and `/api/webhooks/clerk` are public; everything else needs a session, and users who haven't finished onboarding get routed to `/onboarding` first.

> 📍 **Coverage note:** crowd prediction is Manhattan-only. Anything outside surfaces as *"Predictions are currently available for Manhattan only."*

---

## 🧰 Tech Stack

| Area | Packages / tools |
|------|------------------|
| Framework | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 4, Lucide icons |
| Auth | Clerk (`@clerk/nextjs`) |
| Data | Supabase JS (server uses service-role client) |
| Maps | `@vis.gl/react-google-maps`, `h3-js` |
| AI chat UI | Vercel AI SDK (`ai`, `@ai-sdk/react`) |
| Markdown | `react-markdown`, `remark-gfm`, `react-syntax-highlighter` |
| Analytics | `@vercel/speed-insights` |
| Package manager | pnpm |
| Tests | Vitest 4, Testing Library, jsdom |

---

## 🚀 Getting Started

### 🧩 Prerequisites

The app boots without these, but map busyness, quieter recommendations, and the assistant need them: ⚠️

- The **Zentra Express backend** running locally, or `NEXT_PUBLIC_BACKEND_API_BASE_URL` pointed at a reachable API.
- A **Supabase** project with the tables and data listed under [External Integrations](#-external-integrations).
- **Google Cloud** credentials with **Routes API** and **Places API (New)** enabled.

### 🔧 Installation

1. Clone the repository:
   ```bash
   git clone git@github.com:zentralol/web-frontend.git
   ```

2. Enter the project directory:
   ```bash
   cd web-frontend
   ```

3. Install dependencies:
   ```bash
   pnpm install
   ```

### ⚙️ Configuration

```bash
cp .env.example .env
```

Then fill in the values below — and never commit secrets. 🙈

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Sign-in path (default `/sign-in`) |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Sign-up path (default `/sign-up`) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | Post sign-in redirect (default `/`) |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | Post sign-up redirect (default `/`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (used with service role on the server) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Listed in `.env.example` for Supabase projects |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side Supabase access used by this app |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Verify Clerk `user.created` webhook |
| `MXROUTE_SERVER` / `MXROUTE_USERNAME` / `MXROUTE_PASSWORD` / `MXROUTE_FROM` | Welcome email via MXroute |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Maps UI + Routes compute API |
| `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` | Optional Cloud Map ID (documented in `.env.example`) |
| `NEXT_PUBLIC_BACKEND_API_BASE_URL` | Express backend origin (default `http://localhost:3000`; paths use `/api/v1`) |
| `NEXT_PUBLIC_IOS_APP_URL` / `NEXT_PUBLIC_ANDROID_APP_URL` | Smart app banner store links |
| `DEEPSEEK_MODEL` | Model label stored on new conversations (default `deepseek-v4-flash`) |

To test the welcome email, point Clerk's `user.created` webhook at your deployed `/api/webhooks/clerk`. 📮

---

## 💻 Usage

Start the dev server — Next.js defaults to port **3000**, so give the backend a different origin if both run locally: 🏃

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

For a production-like local run:

```bash
pnpm build
pnpm start
```

Linting: `pnpm lint`.

### 🧭 App Routes

| Path | Access | Purpose |
|------|--------|---------|
| `/` | Public | Landing or personalized home |
| `/sign-in`, `/sign-up` | Public | Clerk authentication |
| `/onboarding` | Signed in | Preference wizard |
| `/welcome-back` | Signed in | Post-onboarding landing |
| `/map` | Signed in + onboarded | Crowd-aware map workspace |
| `/routes` | Signed in + onboarded | Multi-mode route planner |
| `/assistant` | Signed in + onboarded | Redirect to a conversation |
| `/assistant/[conversationId]` | Signed in + onboarded | AI chat thread |
| `/activity` | Signed in + onboarded | Forecast, landmarks, saved trips |
| `/settings` | Signed in + onboarded | Places, feedback, preferences |

Navbar tabs: **Map**, **Routes**, **Assistant**, **Activity**, **Settings**.

### 🔗 Deep Links

| Pattern | Effect |
|---------|--------|
| `/map?q=…` | Prefill attraction search |
| `/map?id={attractionId}` | Open that attraction |
| `/map?lat&lng&name&address&placeId` | Open an arbitrary location |
| `/routes?destLat&destLng&destLabel` | Prefill destination (origin = current location, best effort) |
| `/assistant/{conversationId}` | Open a chat thread |
| `/sign-in?redirect_url=…` | Return URL after sign-in |

---

## 📁 Project Structure

```
web-frontend/
├── app/                 # App Router pages, layouts, loading UI, API routes
├── components/          # UI: map, routes, assistant, activity, onboarding, settings, …
├── lib/                 # Domain logic: backend client, map, assistant, attractions, …
├── supabase/            # Supabase-related project files
├── public/              # Static assets
├── proxy.ts             # Clerk middleware + onboarding redirects
├── vitest.config.ts
├── package.json
├── README.md
└── README.zh-CN.md
```

---

## 🔗 External Integrations

### 🛰️ Express backend

Everything below sits under `/api/v1` on `NEXT_PUBLIC_BACKEND_API_BASE_URL` and carries Clerk Bearer auth from the browser:

| Backend path | Used for |
|--------------|----------|
| `POST /predictions` | Current busyness at a lat/lng |
| `GET /predictions/forecast` | Hourly / windowed crowd forecast |
| `POST /recommendations` | Quieter nearby areas |
| `POST /recommendations/quiet-times` | Quieter visit windows for a place |
| `POST /chat/stream` | Assistant SSE stream |

### 🗄️ Supabase

Server-side access uses `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`.

| Table | Usage |
|-------|-------|
| `onboarding_preferences` | Onboarding / settings / middleware gate |
| `attractions` | Catalog for map, home, activity |
| `attraction_predictions` | Crowd badges and top landmarks |
| `heatmap_predictions` | Map heatmap |
| `conversations`, `messages` | Assistant history |
| `favorite_places` | Saved places |
| `saved_itineraries` | Trips saved from the assistant |
| `welcome_email_deliveries` | Welcome email delivery ledger |

### 🌍 Google Maps, Clerk, and MXroute

- **Google Maps** — Map UI plus Places / Geocoding for place selection and reverse geocoding; Routes API powers walk / transit / bicycle planning via `POST /api/routes/compute`.
- **Clerk** — Session auth for pages and backend calls, plus webhook signing for the welcome email.
- **MXroute** — SMTP API behind the welcome email.

---

## 🧬 Testing

Tests run on Vitest: 🧪

```bash
pnpm test           # single run
pnpm test:watch     # watch mode
pnpm test:coverage  # with coverage
```

Config lives in `vitest.config.ts` (Node by default; some component tests use jsdom). Coverage spans map/heatmap, favorites, recommendations, assistant stream/transport, itineraries, webhook/email, and related units.

---

## 🤝 Contributing

Contributions are welcome! 🎉

1. Fork the repository.

2. Create a branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. Commit your changes:
   ```bash
   git commit -m "Add your awesome feature"
   ```

4. Push the branch:
   ```bash
   git push origin feature/your-feature-name
   ```

5. Open a pull request against `zentralol/web-frontend`. 🚀

---

## 📝 License

This project is **private**. All rights reserved. 🔐

---

## 📧 Contact

Questions or feedback? Reach out:

- **GitHub Issues**: [Open an Issue](https://github.com/zentralol/web-frontend/issues) 🐛
- **Email**: [hi@zentra.lol](mailto:hi@zentra.lol) 📩 (also available as *Help & feedback* in Settings)

---

Made with ❤️ by the Zentra team. Happy coding! 🎉
