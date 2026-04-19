# Asian News Aggregator (AsianFounded)

A full-stack news discovery app focused on **AAPI stories, Asian diaspora media, culture, and lifestyle**. It aggregates articles from trusted RSS sources, enriches them with optional NewsAPI and YouTube metadata, and serves a fast **React** frontend with category browsing, bookmarks, and AI-assisted social copy.

## Why it exists

Recruiters and visitors can see end-to-end ownership: **data ingestion and normalization**, **keyword-based categorization**, **caching and cron-friendly refresh**, and a **polished client** with routing, dark mode, and local persistence.

## Features

- **Multi-source RSS pipeline** — NBC Asian America, SCMP, Nikkei Asia, NextShark, Korea Herald, Japan Times, culture and lifestyle feeds, and more.
- **Four editorial-style categories** — Brand & Founder, Culture, Community, Lifestyle & New Openings — driven by configurable keyword rules and source defaults.
- **Trend signals** — Reddit hot-topic scraping (cached) to surface engagement-weighted themes alongside headlines.
- **Optional integrations** — NewsAPI.org, YouTube Data API, Anthropic Claude (e.g. platform-specific post drafts via `/api/generate-pitch`).
- **Supabase** — optional article archiving when `SUPABASE_URL` and `SUPABASE_KEY` are set.
- **Scheduled refresh** — Vercel Cron can hit a protected refresh endpoint when `CRON_SECRET` is configured.
- **Frontend** — React 19, TypeScript, Vite, Tailwind CSS v4, React Router, lazy-loaded routes, bookmarks (localStorage), and responsive navigation.

## Tech stack

| Layer | Choices |
|--------|---------|
| API | Python 3, Flask, feedparser, requests, Anthropic SDK, Supabase client |
| UI | React, TypeScript, Vite, Tailwind CSS |
| Deploy | Vercel (static frontend + serverless API; see `vercel.json`) |

## Project layout

```
api/app.py          # Flask app: feeds, categorization, APIs, cron helpers
frontend/           # Vite + React SPA
vercel.json         # Build output and /api rewrite to the Flask handler
```

A legacy `app.py` at the repo root mirrors the API for older setups; **Vercel targets `api/app.py`**.

## Local development

**Prerequisites:** Node.js 20+, Python 3.11+ (recommended), and optional API keys in a **`.env`** file at the repo root (never commit it; it is gitignored).

1. **Backend** (from the `api` directory):

   ```bash
   cd api
   python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   python app.py
   ```

   Flask serves on **http://127.0.0.1:5000** by default.

2. **Frontend** (separate terminal):

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   Vite proxies `/api/*` to `http://127.0.0.1:5000` (see `frontend/vite.config.ts`).

## Environment variables

Set these in **`.env`** locally or in the **Vercel project settings** for production:

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` | Claude — social pitch generation |
| `NEWS_API_KEY` | NewsAPI.org — supplemental headlines |
| `YOUTUBE_API_KEY` | YouTube Data API — related video metadata |
| `SUPABASE_URL` / `SUPABASE_KEY` | Optional Supabase project for archiving |
| `CRON_SECRET` | Bearer or query secret for scheduled refresh routes |

The app degrades gracefully when optional keys are missing (RSS-only mode still works).

## Deployment

Connect the repository to **Vercel**, set the environment variables above, and deploy. `vercel.json` defines the frontend build and rewrites `/api/*` to the Python handler.

## License

Private / portfolio use unless you add an explicit license.

---

**Maintainer:** [@nix415](https://github.com/nix415) — portfolio-grade full-stack product demo.
