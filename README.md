# Asian News Aggregator (AsianFounded)

A full-stack news app that pulls trending stories about AAPI culture, business, and lifestyle into one clean React interface.

## Why I built this

I built this during my **social media internship at [Asian Founded](https://www.instagram.com/asianfounded/)**, where part of my job was finding AAPI trending articles every day. Doing it manually was slow, so I had to bounce between a many tabs, RSS feeds, and Reddit threads just to find articles that would could maybe publish. I thought to myself, how about I streamline the whole workflow into one tool: an aggregator that surfaces the same stories I would have hand-picked, organized into editorial categories I could actually use for posts.

## Features

- Aggregates 15+ AAPI-focused RSS feeds (NBC Asian America, SCMP, Nikkei Asia, NextShark, Korea Herald, Japan Times, and more)
- Sorts stories into four editorial categories: **Brand & Founder, Culture, Community, Lifestyle & New Openings**
- Reddit trend signals to surface what audiences are actually engaging with
- Optional AI-assisted social copy generation for Twitter, Instagram, and LinkedIn (Anthropic Claude)
- Bookmarks, dark mode, and responsive UI

## Tech stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router
- **Backend:** Python, Flask, feedparser
- **Optional services:** NewsAPI, YouTube Data API, Anthropic Claude, Supabase (archiving)
- **Deploy:** Vercel (static frontend + serverless API)

## Local development

You'll need **Node.js 20+** and **Python 3.11+**.

**Backend:**

```bash
cd api
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python app.py
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
| `CRON_SECRET` | Secret for scheduled refresh routes |

## Deployment

Connect the repository to Vercel and add the environment variables in the project settings. `vercel.json` handles the build and routes `/api/*` to the Python serverless handler.

---

**Maintainer:** [@nix415](https://github.com/nix415)
