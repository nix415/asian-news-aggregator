# Asian News Aggregator (AsianFounded)

A full-stack news app that pulls trending stories about AAPI culture, business, and lifestyle into one clean React interface.

## Why I built this

I built this during my **social media internship at [Asian Founded](https://www.instagram.com/asianfounded/)**, where part of my job was finding AAPI trending articles every day. Doing it manually was slow, so I had to bounce between a many tabs, RSS feeds, and Reddit threads just to find articles that would could maybe publish. I thought to myself, how about I streamline the whole workflow into one tool: an aggregator that surfaces the same stories I would have hand-picked, organized into editorial categories I could actually use for posts.

## Features

- Aggregates 15+ AAPI-focused RSS feeds (NBC Asian America, SCMP, Nikkei Asia, NextShark, Korea Herald, Japan Times, and more)
- Sorts stories into four editorial categories: **Brand & Founder, Culture, Community, Lifestyle & New Openings**
- Reddit trend signals to surface what audiences are actually engaging with
- Bookmarks and responsive UI
- Optional AI-assisted social copy generation (Anthropic Claude), exposed as an API endpoint — see [API endpoints](#api-endpoints)

## Tech stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router
- **Backend:** Python, Flask, feedparser
- **Optional services:** NewsAPI, YouTube Data API, Anthropic Claude, Supabase (archiving)
- **Deploy:** Vercel (static frontend + serverless API)

## Local development

You'll need **Node.js 20+** and **Python 3.11+**.

**Backend:**

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python api/app.py
```

**Frontend (separate terminal):**

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api/*` to Flask on port 5000.

## Environment variables

Create a `.env` file at the repo root (it is gitignored). All variables are optional — the app falls back to RSS-only mode if a key is missing.

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` | Claude — social pitch generation |
| `NEWS_API_KEY` | NewsAPI.org — supplemental headlines |
| `YOUTUBE_API_KEY` | YouTube Data API — related video metadata |
| `SUPABASE_URL` / `SUPABASE_KEY` | Optional Supabase project for archiving |
| `CRON_SECRET` | Required to enable the scheduled refresh route — without it `/api/cron/refresh` is locked (returns 401) |
| `ENABLE_GOOGLE_TRENDS` | Set to `true` to opt into Google Trends signals during the cron refresh (off by default; pytrends is slow/unreliable) |

## API endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/articles/cached` | Fast read of recent articles from Supabase, with a live RSS fallback. The frontend's primary source. |
| `GET /api/articles` | Live RSS + NewsAPI fetch, cached 5 minutes. |
| `GET /api/archive` | Archived articles from Supabase. Supports `?category=`, `?sort=popular|newest`, `?limit=`. |
| `GET /api/cron/refresh` | Warms the trend caches and refreshes Supabase. Auth via `CRON_SECRET`; the only path that performs the heavier trend fetches (Reddit/YouTube/Wikipedia, plus Google Trends when enabled). |
| `POST /api/generate-pitch` | AI-generated social copy for a story. API-only (not wired into the UI). Body: `{ "title", "summary", "platform": "twitter"|"instagram"|"linkedin" }`. Requires `ANTHROPIC_API_KEY`. |

To keep live requests well within the serverless time limit, the trend-keyword fetchers only read their in-memory caches on the read endpoints; the scheduled cron is the only path that (re)populates them.

## Deployment

Connect the repository to Vercel and add the environment variables in the project settings. `vercel.json` handles the build and routes `/api/*` to the Python serverless handler.

### Required setup for the feed to stay fresh

1. **Set `CRON_SECRET`** in the Vercel project settings. The refresh route fails closed, and Vercel Cron only sends its `Authorization: Bearer` token when this variable is set — without it `/api/cron/refresh` returns 401 and the feed stops updating.
2. **Create the database indexes once** in the Supabase SQL editor (the app does not create them itself). The full `news_articles` schema and indexes are documented in the docstring of `archive_to_supabase()` in `api/app.py`. The newest-first feed relies on:

   ```sql
   create index if not exists idx_news_articles_published
       on news_articles (published_at desc);
   ```

### Things to know

- **Feed ordering:** `/api/articles/cached` returns the 150 most recent articles by published date, so new stories always surface. Pages that want engagement ordering (Top Picks, the Category sort controls) re-rank client-side.
- **Cron cadence:** `vercel.json` schedules the refresh once per day at 14:00 UTC (Hobby plan limit). Upgrade to Pro for more frequent cron runs.
- **Supabase free tier** pauses a project after ~7 days of inactivity. The cached endpoint self-heals to a live RSS fetch so the site never goes blank, but the archive won't update while the project is paused.

---

**Maintainer:** [@nix415](https://github.com/nix415)
