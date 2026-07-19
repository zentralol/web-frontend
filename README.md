# 🚀 Zentra Web Frontend

**English** | [简体中文](./README.zh-CN.md)

**Zentra Web Frontend** is the Next.js web client for Zentra — personalized travel planning for Manhattan. Users set pace, interests, accessibility and crowd preferences, then explore a crowd-aware map, compare routes, chat with an AI assistant, and review activity and saved trips.

---

## 📋 Table of Contents

- [🔎 Overview](#-overview)
- [🧰 Tech Stack](#-tech-stack)
- [✨ Features](#-features)
- [🧭 App Routes](#-app-routes)
- [🔗 External Integrations](#-external-integrations)
- [📁 Project Structure](#-project-structure)
- [🚀 Getting Started](#-getting-started)
  - [🔧 Installation](#-installation)
  - [⚙️ Configuration](#️-configuration)
  - [🧩 Prerequisites](#-prerequisites)
- [💻 Usage](#-usage)
- [🧬 Testing](#-testing)
- [🤝 Contributing](#-contributing)
- [📝 License](#-license)
- [📧 Contact](#-contact)

---

## 🔎 Overview

This repository is the **web frontend** (`zentralol/web-frontend`). In the running app:

- The browser talks to **this Next.js app** for pages, Clerk auth, Supabase-backed data (via server routes/actions), and Google Maps / Routes.
- Protected crowd prediction, quieter-area recommendations, and AI chat stream go to the **Express backend** at `NEXT_PUBLIC_BACKEND_API_BASE_URL` under the `/api/v1` prefix, with the user’s Clerk session token as `Authorization: Bearer …`.
- Chat is streamed through the backend gateway (`POST /api/v1/chat/stream`), which forwards to the internal AI agent service. The frontend does not call the agent with a separate secret.

Crowd prediction coverage in the UI is Manhattan-focused; out-of-coverage responses surface as “Predictions are currently available for Manhattan only.”

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

## ✨ Features

### Auth and onboarding

- Clerk sign-in / sign-up pages and navbar modal buttons; signed-in users get a `UserButton`.
- Clerk middleware in `proxy.ts`: public routes are `/`, `/sign-in`, `/sign-up`, and `/api/webhooks/clerk`. Other routes require a session (redirect to `/sign-in?redirect_url=…`).
- Incomplete onboarding redirects to `/onboarding`. Completed users visiting `/onboarding` go to `/welcome-back`.
- Five-step onboarding wizard stores preferences in Supabase `onboarding_preferences`:
  - Travel pace (relaxed / moderate / packed)
  - Interests (food, nature, history, art, nightlife, shopping, architecture, local culture)
  - Budget range
  - Crowd tolerance
  - Mobility, dietary, and inclusion needs

### Home

- Signed out: landing copy and CTAs to `/assistant` and `/map`.
- Signed in and onboarded: personalized welcome, attraction search → `/map?q=…`, up to three interest-matched recommendations → `/map?id=…`, links to map and settings.

### Map (`/map`)

- Browse attractions (search, category groups, crowd badges).
- Sort modes: recommended, near me, A–Z, quiet areas.
- Google Map with category-colored markers, locate-me, and click-to-select.
- Crowd heatmap toggle (preference in `localStorage`): H3 polygons from `/api/map/heatmap`, time options “Now” plus up to eight Manhattan-local hours.
- Quieter nearby areas via backend `POST /api/v1/recommendations`.
- Location panel: current busyness and next-6-hours forecast (`/api/v1/predictions` and `/predictions/forecast`), quieter times over 24 hours (`/api/v1/recommendations/quiet-times`), save to favorites, **Take me there** → `/routes?destLat&destLng&destLabel`.
- Deep links: `?q=`, `?id=`, `?lat&lng&name&address&placeId`.

### Routes (`/routes`)

- Origin and destination via Places autocomplete, map pick, or current location.
- Plan walk / transit / bicycle options through `POST /api/routes/compute` (Google Routes API).
- Polyline map, mode switcher, share when supported.
- Deep link: `/routes?destLat&destLng&destLabel` (best-effort origin = current location).
- Default origin/destination labels in code are marked as mock data (High Line → Washington Square Park).

### Assistant (`/assistant`)

- Entry creates or opens the newest conversation at `/assistant/{conversationId}`.
- Sidebar: list conversations, new chat, soft-delete (with empty/last-chat rules), optimistic titles.
- Streaming chat to backend `POST /api/v1/chat/stream` with `clientType: "web"` and optional lat/lng.
- Markdown replies, thinking / tool status UI, place cards, suggested prompts.
- **Save trip** persists place-card payloads to `saved_itineraries` (visible on Activity).
- Conversation history in Supabase `conversations` / `messages`; `DEEPSEEK_MODEL` is stored as metadata on create (display only; the agent owns the model call).

### Activity (`/activity`)

- Crowd forecast (eight windows) for the user’s coordinates via backend predictions.
- Top five scenic landmarks from Supabase `attraction_predictions` (busiest / quietest), with Take me there links.
- Saved trips: edit title, note, target time; delete; open places on routes.

### Settings and favorites

- Saved places from `favorite_places` (notes, open on map / routes, remove).
- Heart / save from the map (attraction, Google place, or coordinate identity).
- Help & feedback: `mailto:hi@zentra.lol`.
- Edit the same travel preferences as onboarding.

### Welcome email

- Clerk webhook `POST /api/webhooks/clerk` on `user.created` sends a welcome email via MXroute SMTP.
- Delivery state tracked in `welcome_email_deliveries` (idempotent reserve / submit).

### Smart app banner

- On non-desktop viewports, optional App Store / Play Store banner when `NEXT_PUBLIC_IOS_APP_URL` / `NEXT_PUBLIC_ANDROID_APP_URL` are set; dismiss stored in `localStorage`.

---

## 🧭 App Routes

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

Navbar tabs: Map, Routes, Assistant, Activity, Settings.

---

## 🔗 External Integrations

### Express backend (`NEXT_PUBLIC_BACKEND_API_BASE_URL`)

All paths below are under `/api/v1` and use Clerk Bearer auth from the browser:

| Backend path | Used for |
|--------------|----------|
| `POST /predictions` | Current busyness at a lat/lng |
| `GET /predictions/forecast` | Hourly / windowed crowd forecast |
| `POST /recommendations` | Quieter nearby areas |
| `POST /recommendations/quiet-times` | Quieter visit windows for a place |
| `POST /chat/stream` | Assistant SSE stream |

### Supabase

Server-side access uses `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`.

| Table | Usage |
|-------|--------|
| `onboarding_preferences` | Onboarding / settings / middleware gate |
| `attractions` | Catalog for map, home, activity |
| `attraction_predictions` | Crowd badges and top landmarks |
| `heatmap_predictions` | Map heatmap |
| `conversations`, `messages` | Assistant history |
| `favorite_places` | Saved places |
| `saved_itineraries` | Trips saved from the assistant |
| `welcome_email_deliveries` | Welcome email delivery ledger |

### Google Maps

- Map UI and Places / Geocoding for place selection and reverse geocoding.
- Routes API for walk / transit / bicycle (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`; enable Routes API and Places API New in Google Cloud).

### Clerk

- Session auth for pages and backend calls; webhook signing for welcome email (`CLERK_WEBHOOK_SIGNING_SECRET`).

### MXroute

- Welcome email SMTP API (`MXROUTE_SERVER`, `MXROUTE_USERNAME`, `MXROUTE_PASSWORD`, `MXROUTE_FROM`).

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

## 🚀 Getting Started

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

Fill in values (do not commit secrets):

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

Point Clerk’s `user.created` webhook at your deployed `/api/webhooks/clerk` when testing welcome email.

### 🧩 Prerequisites

For map busyness, quieter recommendations, and the assistant:

- Run the Zentra Express backend (or set `NEXT_PUBLIC_BACKEND_API_BASE_URL` to a reachable API).
- Supabase tables and data used by the app must be available (attractions, predictions, etc.).
- Google Cloud credentials with Routes API and Places API (New) enabled for routing and place search.

---

## 💻 Usage

Start the development server (Next.js default port **3000** — use a different backend origin if both run locally on the same port):

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Production-like local run:

```bash
pnpm build
pnpm start
```

Also available: `pnpm lint`.

### Deep links

| Pattern | Effect |
|---------|--------|
| `/map?q=…` | Prefill attraction search |
| `/map?id={attractionId}` | Open that attraction |
| `/map?lat&lng&name&address&placeId` | Open an arbitrary location |
| `/routes?destLat&destLng&destLabel` | Prefill destination |
| `/assistant/{conversationId}` | Open a chat thread |
| `/sign-in?redirect_url=…` | Return URL after sign-in |

---

## 🧬 Testing

Tests use Vitest:

```bash
pnpm test
pnpm test:watch
pnpm test:coverage
```

Config: `vitest.config.ts` (Node by default; some component tests use jsdom). Coverage includes map/heatmap, favorites, recommendations, assistant stream/transport, itineraries, webhook/email, and related units.

---

## 🤝 Contributing

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
5. Open a pull request against `zentralol/web-frontend`.

---

## 📝 License

This project is **private**. All rights reserved.

---

## 📧 Contact

- **GitHub Issues**: [Open an Issue](https://github.com/zentralol/web-frontend/issues)
- **Email**: [hi@zentra.lol](mailto:hi@zentra.lol) (Help & feedback in Settings)

---

Made with ❤️ by the Zentra team. Happy coding!
