"""
AsianFounded News Backend
─────────────────────────
Environment variables required (set in Vercel dashboard or .env):

  ANTHROPIC_API_KEY  — Anthropic Claude API
  SUPABASE_URL       — e.g. https://xxxx.supabase.co
  SUPABASE_KEY       — anon/service-role key from your Supabase project settings
  NEWS_API_KEY       — from newsapi.org (free tier works)
"""

import os
import re
import requests
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

import feedparser
import anthropic
from flask import Flask, jsonify, render_template, request
from supabase import create_client, Client

app = Flask(__name__)

# ── Supabase client ───────────────────────────────────────────────────────────
SUPABASE_URL: str = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY: str = os.environ.get("SUPABASE_KEY", "")
supabase: Client | None = None

if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    print("WARNING: SUPABASE_URL / SUPABASE_KEY not set — archiving disabled.")

# ── NewsAPI key ───────────────────────────────────────────────────────────────
NEWS_API_KEY: str = os.environ.get("NEWS_API_KEY", "")

# ── RSS feeds ─────────────────────────────────────────────────────────────────
RSS_FEEDS = {
    "NBC Asian America":        "https://www.nbcnews.com/id/3032091/device/rss/rss.xml",
    "South China Morning Post": "https://www.scmp.com/rss/91/feed",
    "Nikkei Asia":              "https://asia.nikkei.com/rss/feed/nar",
    "The SF Standard":          "https://sfstandard.com/feed/",
    "Channel News Asia":        "https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml",
    "NextShark":                "https://nextshark.com/feed",
    "AsAmNews":                 "https://asamnews.com/feed/",
    "The Korea Herald":         "https://www.koreaherald.com/rss/newsAll",
    "Character Media":          "https://charactermedia.com/feed/",
}

# ── Categories ────────────────────────────────────────────────────────────────
CATEGORIES = ["Brand & Founder", "Culture", "Community", "Lifestyle & New Openings"]

CATEGORY_KEYWORDS = {
    "Brand & Founder": [
        "founder", "brand", "startup", "ceo", "funding", "investor",
        "ipo", "acquisition", "business", "entrepreneur", "company",
        "beauty", "fashion", "skincare", "cosmetics", "apparel", "clothing",
        "home goods", "lifestyle brand", "direct-to-consumer", "dtc",
        "asian-owned", "asian owned", "small business", "boutique",
        "revenue", "investment", "unicorn", "series a", "seed round",
        "product launch", "collection", "collaboration", "collab",
    ],
    "Culture": [
        "culture", "heritage", "festival", "tradition", "identity",
        "diaspora", "art", "exhibit", "museum", "literature",
        "design", "architecture", "photography", "language",
        "kpop", "k-pop", "bts", "blackpink", "hallyu", "idol",
        "k-drama", "kdrama", "anime", "manga", "webtoon",
        "film", "movie", "music", "concert", "album", "drama",
        "celebrity", "actor", "actress", "award", "entertainment",
    ],
    "Community": [
        "community", "aapi", "asian american", "immigration", "activism",
        "protest", "discrimination", "hate crime", "representation",
        "policy", "election", "government", "diplomatic",
        "china", "japan", "korea", "taiwan", "hong kong", "singapore",
        "philippines", "vietnam", "thailand", "indonesia", "india",
        "beijing", "tokyo", "seoul", "manila", "bangkok", "jakarta",
        "malaysia", "cambodia", "myanmar", "pacific", "asia",
    ],
    "Lifestyle & New Openings": [
        "restaurant", "opening", "new opening", "grand opening", "pop-up",
        "popup", "cafe", "boba", "food", "cuisine", "dining",
        "hmart", "h-mart", "99 ranch", "grocery", "supermarket",
        "wellness", "spa", "fitness", "yoga", "travel", "hotel",
        "bar", "lounge", "bakery", "dessert", "ramen", "sushi",
        "korean bbq", "bubble tea", "night market", "food hall",
        "interior", "decor", "home", "living", "lifestyle",
    ],
}

SOURCE_DEFAULT_CATEGORY = {
    "NBC Asian America":        "Community",
    "South China Morning Post": "Community",
    "Nikkei Asia":              "Brand & Founder",
    "The SF Standard":          "Brand & Founder",
    "Channel News Asia":        "Community",
    "NextShark":                "Culture",
    "AsAmNews":                 "Community",
    "The Korea Herald":         "Community",
    "Character Media":          "Culture",
}

# ── Viral / social signal keywords ───────────────────────────────────────────
VIRAL_KEYWORDS = [
    "founder", "startup", "brand", "launch", "collab", "collaboration",
    "asian-owned", "asian owned", "small business", "entrepreneur",
    "boba", "bubble tea", "hmart", "h-mart", "99 ranch", "ramen",
    "korean bbq", "dim sum", "matcha", "mochi", "night market",
    "k-pop", "kpop", "bts", "blackpink", "twice", "aespa", "stray kids",
    "k-drama", "kdrama", "hallyu", "anime", "webtoon",
    "viral", "trending", "tiktok", "tik tok", "instagram", "reels",
    "sold out", "waitlist", "pop-up", "popup", "limited edition",
    "representation", "first asian", "historic", "record-breaking",
    "aapi", "asian american", "pride", "activist", "movement",
]

SOCIAL_BOOST_AMOUNT = 40


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def assign_category(title: str, summary: str, source: str) -> str:
    text = (title + " " + summary).lower()
    for category, kws in CATEGORY_KEYWORDS.items():
        if any(kw in text for kw in kws):
            return category
    return SOURCE_DEFAULT_CATEGORY.get(source, "Community")


def parse_date(date_str: str):
    if not date_str:
        return None
    for parser in (
        parsedate_to_datetime,
        lambda s: datetime.fromisoformat(s.replace("Z", "+00:00")),
    ):
        try:
            return parser(date_str)
        except Exception:
            pass
    return None


def to_iso(date_str: str):
    """Convert any date string to ISO-8601 for Supabase."""
    dt = parse_date(date_str)
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


def calculate_trending_score(published_str: str) -> int:
    pub_date = parse_date(published_str)
    if not pub_date:
        return 30
    try:
        now = datetime.now(timezone.utc)
        if pub_date.tzinfo is None:
            pub_date = pub_date.replace(tzinfo=timezone.utc)
        hours_ago = (now - pub_date).total_seconds() / 3600
        if hours_ago < 2:   return 98
        if hours_ago < 6:   return 90
        if hours_ago < 12:  return 80
        if hours_ago < 24:  return 70
        if hours_ago < 48:  return 55
        if hours_ago < 72:  return 40
        return max(10, int(30 - hours_ago / 24))
    except Exception:
        return 30


def get_social_boost_score(title: str, summary: str):
    """Returns (social_boost: bool, bonus: int)."""
    text = (title + " " + summary).lower()
    if any(kw in text for kw in VIRAL_KEYWORDS):
        return True, SOCIAL_BOOST_AMOUNT
    return False, 0


def extract_image(entry):
    media = entry.get("media_content", [])
    if media:
        for m in media:
            url = m.get("url", "")
            if url and any(url.lower().endswith(ext) for ext in (".jpg", ".jpeg", ".png", ".webp", ".gif")):
                return url
        if media[0].get("url"):
            return media[0]["url"]
    media_thumb = entry.get("media_thumbnail", [])
    if media_thumb and media_thumb[0].get("url"):
        return media_thumb[0]["url"]
    for enc in entry.get("enclosures", []):
        if enc.get("type", "").startswith("image"):
            return enc.get("href") or enc.get("url", "")
    html = (
        entry.get("content", [{}])[0].get("value", "")
        if entry.get("content")
        else entry.get("summary", "")
    )
    match = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', html)
    return match.group(1) if match else None


# ─────────────────────────────────────────────────────────────────────────────
# Supabase archiving
# ─────────────────────────────────────────────────────────────────────────────

def archive_to_supabase(articles: list) -> None:
    """
    Upsert articles into the `news_articles` table.
    Conflict key: `link` (unique URL = unique article).

    Run this SQL once in your Supabase SQL Editor to create the table:

        create table if not exists news_articles (
            id               bigserial primary key,
            title            text not null,
            summary          text,
            link             text unique not null,
            source           text,
            category         text,
            image            text,
            published_at     timestamptz,
            popularity_score integer default 0,
            social_boost     boolean default false,
            created_at       timestamptz default now()
        );

        create index if not exists idx_news_articles_category
            on news_articles (category);
        create index if not exists idx_news_articles_popularity
            on news_articles (popularity_score desc);
    """
    if not supabase:
        return

    rows = [
        {
            "title":            a["title"],
            "summary":          a.get("summary", ""),
            "link":             a["link"],
            "source":           a.get("source", ""),
            "category":         a.get("category", "Community"),
            "image":            a.get("image"),
            "published_at":     to_iso(a.get("published", "")),
            "popularity_score": a.get("popularity_score", a.get("trending_score", 0)),
            "social_boost":     a.get("social_boost", False),
        }
        for a in articles
        if a.get("link")
    ]

    if not rows:
        return

    try:
        for i in range(0, len(rows), 100):
            supabase.table("news_articles").upsert(
                rows[i : i + 100],
                on_conflict="link",
            ).execute()
        print(f"Archived {len(rows)} articles to Supabase.")
    except Exception as e:
        print(f"Supabase archive error: {e}")


# ─────────────────────────────────────────────────────────────────────────────
# NewsAPI — top popular articles about Asian Entrepreneurs
# ─────────────────────────────────────────────────────────────────────────────

def fetch_newsapi_popular(query: str = "Asian entrepreneurs", page_size: int = 10) -> list:
    """
    Fetches the most popular articles from NewsAPI /everything.
    sortBy=popularity surfaces articles with the highest engagement.
    Returns articles normalised to our standard schema.
    """
    if not NEWS_API_KEY:
        print("NEWS_API_KEY not set — skipping NewsAPI fetch.")
        return []

    try:
        resp = requests.get(
            "https://newsapi.org/v2/everything",
            params={
                "q":        query,
                "sortBy":   "popularity",
                "pageSize": page_size,
                "language": "en",
                "apiKey":   NEWS_API_KEY,
            },
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        print(f"NewsAPI error: {e}")
        return []

    articles = []
    for item in data.get("articles", []):
        title      = item.get("title") or "No Title"
        summary    = item.get("description") or item.get("content") or ""
        clean_summ = re.sub(r"<[^>]+>", "", summary).strip()
        short_summ = (clean_summ[:220] + "...") if len(clean_summ) > 220 else clean_summ
        published  = item.get("publishedAt", "")
        source     = (item.get("source") or {}).get("name", "NewsAPI")
        link       = item.get("url", "#")
        image      = item.get("urlToImage")

        base_score          = calculate_trending_score(published)
        social_boost, bonus = get_social_boost_score(title, clean_summ)

        articles.append({
            "title":            title,
            "summary":          short_summ,
            "link":             link,
            "source":           source,
            "published":        published,
            "image":            image,
            "trending_score":   min(base_score + bonus, 100),
            "social_boost":     social_boost,
            "category":         assign_category(title, clean_summ, source),
            "popularity_score": 100,   # NewsAPI popularity endpoint = highest score
        })

    return articles


# ─────────────────────────────────────────────────────────────────────────────
# RSS fetching
# ─────────────────────────────────────────────────────────────────────────────

def fetch_rss_articles() -> list:
    articles = []
    keywords = [
        "asian", "aapi", "kpop", "k-pop", "korean", "japanese", "chinese",
        "filipino", "vietnamese", "hmart", "h-mart", "99 ranch",
        "olympic", "medal", "founder", "boba", "community", "culture", "actor",
        "taiwan", "hong kong", "singapore", "thailand", "india", "indonesia",
    ]

    for source, url in RSS_FEEDS.items():
        try:
            feed = feedparser.parse(url)
            for entry in feed.entries[:30]:
                title       = entry.get("title", "No Title")
                summary     = entry.get("summary", entry.get("description", ""))
                clean_summ  = re.sub(r"<[^>]+>", "", summary).strip()
                search_text = (title + " " + clean_summ).lower()

                if not any(kw in search_text for kw in keywords):
                    continue

                short_summ          = (clean_summ[:220] + "...") if len(clean_summ) > 220 else clean_summ
                published           = entry.get("published", "")
                base_score          = calculate_trending_score(published)
                social_boost, bonus = get_social_boost_score(title, clean_summ)
                final_score         = min(base_score + bonus, 100)

                articles.append({
                    "title":            title,
                    "summary":          short_summ,
                    "link":             entry.get("link", "#"),
                    "source":           source,
                    "published":        published,
                    "image":            extract_image(entry),
                    "trending_score":   final_score,
                    "social_boost":     social_boost,
                    "category":         assign_category(title, clean_summ, source),
                    "popularity_score": final_score,
                })
        except Exception as e:
            print(f"Error fetching {source}: {e}")

    return articles


# ─────────────────────────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/articles")
def get_articles():
    """
    Live feed: fetch RSS + NewsAPI popular, archive to Supabase, return combined.
    """
    rss_articles     = fetch_rss_articles()
    popular_articles = fetch_newsapi_popular()

    seen, combined = set(), []
    for a in rss_articles + popular_articles:
        if a["link"] not in seen:
            seen.add(a["link"])
            combined.append(a)

    archive_to_supabase(combined)
    return jsonify(combined)


@app.route("/api/archive")
def get_archive():
    """
    Archive view: returns all articles from Supabase ordered by popularity_score.
    Query params:
      ?category=Culture        filter by category
      ?sort=popular|newest     sort order (default: popular)
      ?limit=200               max rows (capped at 500)
    """
    if not supabase:
        return jsonify({"error": "Supabase not configured"}), 503

    category = request.args.get("category")
    sort     = request.args.get("sort", "popular")
    limit    = min(int(request.args.get("limit", 200)), 500)

    try:
        query = supabase.table("news_articles").select("*").limit(limit)

        if category:
            query = query.eq("category", category)

        if sort == "newest":
            query = query.order("published_at", desc=True)
        else:
            query = query.order("popularity_score", desc=True)

        rows = query.execute().data or []

        articles = [
            {
                "title":            r.get("title", ""),
                "summary":          r.get("summary", ""),
                "link":             r.get("link", "#"),
                "source":           r.get("source", ""),
                "published":        r.get("published_at", ""),
                "image":            r.get("image"),
                "trending_score":   r.get("popularity_score", 0),
                "social_boost":     r.get("social_boost", False),
                "category":         r.get("category", "Community"),
                "popularity_score": r.get("popularity_score", 0),
            }
            for r in rows
        ]

        return jsonify(articles)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/generate-pitch", methods=["POST"])
def generate_pitch():
    data     = request.json
    title    = data.get("title", "")
    summary  = data.get("summary", "")
    platform = data.get("platform", "twitter")
    instructions = {
        "twitter":   "Punchy tweet, max 240 chars, 2-3 hashtags.",
        "instagram": "Instagram caption, 2-4 sentences, 8-10 hashtags at end.",
        "linkedin":  "Professional post, 3-4 sentences, max 3 hashtags.",
    }
    prompt = (
        f"Social media strategist for Asian American news.\n"
        f"Title: {title}\nSummary: {summary}\n"
        f"Platform: {platform.capitalize()}\n"
        f"Task: {instructions.get(platform, instructions['twitter'])}\n"
        f"Write ONLY the post."
    )
    try:
        client = anthropic.Anthropic()
        msg = client.messages.create(
            model="claude-opus-4-5", max_tokens=300,
            messages=[{"role": "user", "content": prompt}],
        )
        return jsonify({"pitch": msg.content[0].text.strip()})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)

app = app
