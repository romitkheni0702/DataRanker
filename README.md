# Matrix (ThinkVest) — Equity Ranking Pipeline

A MERN app for scoring and ranking listed companies by industry-specific KPI templates.
An admin uploads a daily Screener.in export; users filter that snapshot and run it through
the ranking pipeline to get a fully ranked, colour-coded report grouped by sector template.
UI product name: **Matrix**.

> This README is a quick-start overview. `CLAUDE.md` in this directory has the full,
> continuously-maintained architecture reference (routes, models, key files) — check there
> for anything not covered below.

## What it does

1. **Format** — maps raw Screener.in columns to a standardized schema using a configurable mapping
2. **Map Industries** — joins companies to SCS sectors and KPI templates via a reference workbook
3. **Rank & Score** — scores each company per KPI (rank + percentile slab + weighted metric score),
   aggregates a total score, and writes one Excel sheet per template

## Stack

**MERN** — MongoDB · Express · React (CRA) · Node. The ranking pipeline (originally Python/pandas) is
ported to JavaScript and runs in-memory in the Express backend.

```
DataRanker/
├── client/                     # React frontend (CRA)
│   ├── src/api.js              # API base (REACT_APP_API_URL) + fetch helper
│   ├── src/auth.js             # JWT auth client (httpOnly cookie + localStorage token)
│   ├── src/App.js              # Router + global state + feature-flag context
│   ├── src/StockDashboard.jsx  # Results viewer (charts, table)
│   ├── src/KPILibraryEditor.js # Edit/save the per-user KPI library (Tier 1) via API
│   ├── src/theme/              # Design tokens (CSS vars) + light/dark ThemeContext
│   ├── src/pages/               # Landing, Pricing, Demo, About, Login, Signup, Screener,
│   │                            # Comparison, Settings, Account, CompanyDetail, Premium,
│   │                            # Upgrade, and Admin (Users/Plans/Logs/Content) pages
│   └── src/components/          # AppShell, ColumnMapper, GoogleButton, PaymentButton,
│                                # MarketingNav/Footer, PlanGate, ThemeToggle …
└── server/                     # Express + MongoDB backend
    ├── server.js               # Entry: env, DB, CORS, routes
    ├── config/db.js            # Mongoose connection
    ├── models/                 # User, KpiLibrary, ScreenerSnapshot, Plan, Payment,
    │                           # AdminLog, AppSettings, OtpToken, SiteContent
    ├── middleware/auth.js      # JWT cookie/header helpers + requireAuth/requireAdmin/requirePremium
    ├── controllers/authController.js
    ├── routes/                 # auth, plans, pipeline, kpiLibrary, screener, company,
    │                          # payment, adminUsers, adminPlans, adminLogs, adminSettings,
    │                          # siteContent, stats, results
    ├── core/config.js          # COLUMN_MAPPING (aliases), KPI config, output colors
    ├── core/kpiDefaults.js     # Default Tier 1 KPI rows seeded for new users
    ├── core/plans.js           # Fallback subscription tier data
    ├── services/               # formatter.js, mapper.js, ranker.js (pipeline) + kpiLibrary.js,
    │                          # industryMapping.js
    └── lib/                    # rank.js, io.js (pandas-equivalent helpers)
```

Note: `client/src/Dashboard.js` is legacy/unused — the pipeline upload flow now lives in
`pages/ScreenerPage.jsx`. It is not imported by `App.js`.

## Setup

Prerequisites: **Node.js 18+** and a reachable **MongoDB** (local, or a MongoDB Atlas URI).

### Backend (`server/`)

```bash
cd server
npm install
cp .env.example .env     # then set MONGO_URI and a strong JWT_SECRET
npm start                # http://localhost:8000   (npm run dev for auto-reload)
```

### Frontend (`client/`)

```bash
cd client
npm install
cp .env.example .env     # REACT_APP_API_URL defaults to http://localhost:8000
npm start                # http://localhost:3000
```

> Both services must be running. The backend won't start without a reachable MongoDB or a
> `JWT_SECRET`.

## Environment

Secrets live in gitignored `.env` files (commit only the `.env.example` templates):

- `server/.env` — `PORT`, `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES`, `CLIENT_ORIGIN`, `NODE_ENV`,
  `GOOGLE_CLIENT_ID`, `GMAIL_USER`/`GMAIL_APP_PASSWORD` (email/OTP sending), `RAZORPAY_KEY_ID`/
  `RAZORPAY_KEY_SECRET` (payments). Google, Gmail, and Razorpay are all optional — each feature
  degrades gracefully (hidden button / 503 / disabled OTP email) when its keys are unset.
- `client/.env` — `REACT_APP_API_URL`, `REACT_APP_SITE_URL` (SEO canonical URL),
  `REACT_APP_GOOGLE_CLIENT_ID`

## Auth & subscriptions

- Real signup/login with **JWT stored in an httpOnly cookie** (XSS-resistant), plus a copy in
  `localStorage` sent as `Authorization: Bearer` for cross-domain support. Optional **Google
  Sign-In**. OTP-based email verification, password reset, and password/email change.
- Each user has a `plan` (default `"standard"`), a `trialEndsAt` (90 days from signup), and a
  `paidUntil` set/extended by successful Razorpay payments. `GET /plans` serves plan documents
  (admin-editable) for the Pricing page; `server/core/plans.js` is only the fallback if no `Plan`
  documents exist yet.

## API

All routes are mounted without a common prefix (e.g. `POST /auth/signup`, not `/api/auth/signup`).

| Method | Endpoint                         | Auth        | Purpose                                          |
|--------|----------------------------------|-------------|---------------------------------------------------|
| POST   | `/auth/signup`                   | —           | Create account (plan=standard), set cookie        |
| POST   | `/auth/login`                    | —           | Log in, set cookie                                |
| POST   | `/auth/google`                   | —           | Sign in / register via Google Identity Services   |
| GET    | `/auth/me`                       | ✓           | Current user                                      |
| POST   | `/auth/logout`                   | —           | Clear cookie                                      |
| POST   | `/auth/verify-email` / `resend-verification` | ✓  | OTP email verification                    |
| POST   | `/auth/forgot-password` / `reset-password`   | —  | OTP-based password reset                  |
| POST   | `/auth/request-otp` / `change-password`      | ✓  | OTP-based password change                 |
| PUT    | `/auth/profile`                  | ✓           | Update profile                                    |
| GET    | `/plans`                         | —           | Subscription tiers (from DB, falls back to defaults) |
| GET/POST/PUT/DELETE | `/admin/plans[/:planId]`  | admin       | CRUD for Plan documents                      |
| GET    | `/column-mapping`                | —           | Canonical output→source column mapping (aliases)  |
| POST   | `/run-pipeline`                  | ✓ premium   | Run pipeline on an ad-hoc CSV upload, return XLSX |
| GET    | `/kpi-library`                   | ✓           | Current user's Tier 1 KPIs (seeds defaults on first call) |
| PUT    | `/kpi-library`                   | ✓           | Save the user's Tier 1 KPIs                       |
| POST   | `/admin/screener`                | admin       | Upload/replace the daily screener snapshot        |
| GET    | `/screener`                      | ✓           | Current snapshot (`columns`, `rows`, metadata)    |
| GET    | `/screener/download`             | ✓           | Download the original uploaded snapshot file      |
| POST   | `/screener/run-pipeline`         | ✓           | Run pipeline on filtered snapshot rows, return XLSX |
| GET    | `/company/:symbol`, `/isin/:isin`, `/:symbol/summary`, `/:symbol/history`, `/:symbol/full` | ✓ | Yahoo Finance quote/fundamentals/OHLCV |
| POST   | `/payment/create-order` / `/payment/verify` | ✓    | Razorpay order creation + HMAC verification |
| GET/PATCH/DELETE | `/admin/users[/:id]`   | admin       | User management                                   |
| GET    | `/admin/logs`                    | admin       | Merged payment + admin-action audit log           |
| GET/PUT | `/admin/settings`, GET `/app-config` | admin / ✓ | Feature-flag settings                        |
| GET/PUT | `/site-content`, `/admin/site-content` | — / admin | Editable marketing site content            |
| GET    | `/stats`                         | —           | Public usage stats                                |
| POST   | `/results/email-summary`         | ✓           | Email a ranked results summary                    |
| GET    | `/promo`                         | —           | Active promo banner content                       |

## Usage

1. **Admin uploads the daily snapshot** — `/app/screener` (admin only): upload the Screener.in
   export; it replaces the singleton snapshot everyone filters against.
2. **Set up KPIs** — `/app/kpi-editor`: every account starts with a default Tier 1 KPI library
   (seeded from the canonical set); edit and **Save** it.
3. **Filter & run** — `/app/screener`: filter/search the snapshot (DSL filter, search bar,
   pagination), then **Run Pipeline**. The industry-mapping workbook is bundled with the
   backend — scoring uses your saved KPI library.
4. **Explore** — `/app/results` for the interactive dashboard, `/app/comparison` to compare
   2–6 companies side by side, `/app/company/:symbol` for a live quote/fundamentals page.

> Premium/Enterprise users can instead upload an ad-hoc CSV directly via `POST /run-pipeline`
> without going through the shared screener snapshot.

## KPI scoring logic

For each KPI in a template:
- `_Rank` — rank within the template group (1 = best; direction-aware)
- `_Percentile_Slab` — percentile bucket in steps of 10 (100 = best, 10 = worst)
- `_Metric_Score` — `Percentile_Slab × (Weight% / 100)`

`Total_Final_Score` = sum of all `_Metric_Score` columns. `Company_Rank` = rank by that score descending.
