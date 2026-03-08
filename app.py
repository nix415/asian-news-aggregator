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
import time
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone, timedelta
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

# Subreddits to monitor for live trending AAPI / Asian culture topics
REDDIT_SUBREDDITS = [
    "AsianAmerican",
    "kdrama",
    "kpop",
    "asianfood",
    "entrepreneur",
    "startups",
    "AAPI",
    "AsianBeauty",
    "japanlife",
    "korea",
]

# Module-level cache — Reddit is fetched once per hour, not on every request
_reddit_scored_keywords: dict = {}   # keyword → engagement score
_reddit_cache_time: float = 0.0
REDDIT_CACHE_SECONDS = 3600

_REDDIT_STOP_WORDS = {
    "the","and","for","are","was","that","this","with","have","from",
    "they","been","what","just","not","but","who","will","all","can",
    "her","his","him","she","how","its","our","out","one","get","now",
    "new","more","any","about","after","your","also","like","when",
}


def _fetch_single_subreddit(sub: str) -> list:
    """Fetch (keyword, engagement_score) pairs from one subreddit."""
    headers = {"User-Agent": "AsianFounded/1.0 (news aggregator)"}
    results = []
    try:
        resp = requests.get(
            f"https://www.reddit.com/r/{sub}/hot.json?limit=10",
            headers=headers,
            timeout=6,
        )
        if resp.status_code != 200:
            return results
        posts = resp.json().get("data", {}).get("children", [])
        for post in posts:
            data      = post.get("data", {})
            upvotes   = data.get("score", 0)
            comments  = data.get("num_comments", 0)
            if upvotes < 50:
                continue
            engagement = upvotes + comments * 2
            title = data.get("title", "").lower()
            words = re.findall(r"[a-z][a-z\-']{2,}", title)
            for w in words:
                results.append((w, engagement))
    except Exception as e:
        print(f"Reddit fetch error for r/{sub}: {e}")
    return results


def fetch_reddit_scored_keywords() -> dict:
    """
    Returns {keyword: max_engagement_score} from AAPI subreddits.
    Cached for 1 hour.
    """
    global _reddit_scored_keywords, _reddit_cache_time

    now = time.time()
    if _reddit_scored_keywords and (now - _reddit_cache_time) < REDDIT_CACHE_SECONDS:
        return _reddit_scored_keywords

    scored: dict = {}
    with ThreadPoolExecutor(max_workers=len(REDDIT_SUBREDDITS)) as executor:
        futures = [executor.submit(_fetch_single_subreddit, sub) for sub in REDDIT_SUBREDDITS]
        for future in as_completed(futures):
            for word, engagement in future.result():
                if word not in _REDDIT_STOP_WORDS:
                    scored[word] = max(scored.get(word, 0), engagement)

    _reddit_scored_keywords = scored
    _reddit_cache_time      = now
    print(f"Reddit: cached {len(scored)} scored keywords.")
    return scored


# ── Engagement scoring ───────────────────────────────────────────────────────

ENGAGEMENT_TRIGGERS = re.compile(
    r'\b(first asian|first aapi|record.breaking|historic|youngest|oldest|'
    r'largest|biggest|only asian|makes history|breaks record)\b',
    re.IGNORECASE,
)

SHAREABILITY_TRIGGERS = re.compile(
    r'\b(viral|exclusive|breaking|revealed|shocking|incredible|'
    r'sold out|waitlist|limited edition|must.see|you need)\b',
    re.IGNORECASE,
)

SOCIAL_TOPIC_SCORES = {
    "Lifestyle & New Openings": 14,
    "Culture":                  13,
    "Brand & Founder":          10,
    "Community":                8,
}


def calculate_engagement_score(
    title: str,
    summary: str,
    published: str,
    category: str,
    has_image: bool,
) -> tuple:
    """
    Multi-factor score (0-100) predicting how well an article would perform
    as a social media post. Returns (popularity_score, social_boost).

    Factors:
      - Recency          0-20   fresher content performs better
      - Reddit heat      0-30   topics with real Reddit engagement
      - Content signals  0-20   milestone language, shareability, questions
      - Visual potential  0-10   articles with images get 2-3x more engagement
      - Topic category   0-15   food/kpop/lifestyle outperform on social
      - Title quality     0-5   optimal length for social sharing
    """
    text  = (title + " " + summary).lower()
    score = 0

    # ── Recency (0-20) ──
    pub_date = parse_date(published)
    if pub_date:
        now = datetime.now(timezone.utc)
        if pub_date.tzinfo is None:
            pub_date = pub_date.replace(tzinfo=timezone.utc)
        hours_ago = max(0, (now - pub_date).total_seconds() / 3600)
        if   hours_ago < 3:    score += 20
        elif hours_ago < 6:    score += 18
        elif hours_ago < 12:   score += 16
        elif hours_ago < 24:   score += 14
        elif hours_ago < 48:   score += 12
        elif hours_ago < 72:   score += 10
        elif hours_ago < 168:  score += 8   # 1 week
        elif hours_ago < 336:  score += 6   # 2 weeks
        elif hours_ago < 720:  score += 5   # 1 month
        else:                  score += 3
    else:
        score += 5

    # ── Reddit heat (0-30) ──
    reddit = fetch_reddit_scored_keywords()
    if reddit:
        matched_scores = [eng for kw, eng in reddit.items() if kw in text]
        if matched_scores:
            top_engagement = max(matched_scores)
            match_count    = len(matched_scores)
            heat = min(30, int(
                min(top_engagement / 500, 1.0) * 20
                + min(match_count / 5, 1.0) * 10
            ))
            score += heat

    # ── Content signals (0-20) ──
    if ENGAGEMENT_TRIGGERS.search(title + " " + summary):
        score += 10
    if SHAREABILITY_TRIGGERS.search(title + " " + summary):
        score += 6
    if "?" in title:
        score += 4

    # ── Visual potential (0-10) ──
    if has_image:
        score += 10

    # ── Topic category (0-15) ──
    score += SOCIAL_TOPIC_SCORES.get(category, 5)

    # ── Title quality (0-5) ──
    title_len = len(title)
    if 40 <= title_len <= 100:
        score += 5
    elif 25 <= title_len <= 120:
        score += 3

    social_boost = score >= 55
    return min(score, 100), social_boost


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
        if hours_ago < 2:    return 98
        if hours_ago < 6:    return 90
        if hours_ago < 12:   return 80
        if hours_ago < 24:   return 70
        if hours_ago < 48:   return 60
        if hours_ago < 72:   return 50
        if hours_ago < 168:  return 40  # 1 week
        if hours_ago < 336:  return 32  # 2 weeks
        if hours_ago < 720:  return 25  # 1 month
        return max(15, int(25 - hours_ago / 48))
    except Exception:
        return 30


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
# NewsAPI — popular AAPI articles across multiple queries
# ─────────────────────────────────────────────────────────────────────────────

NEWSAPI_QUERIES = [
    "Asian American",
    "Asian entrepreneurs OR Asian-owned business",
    "K-pop OR K-drama OR anime",
    "Asian food OR boba OR ramen OR Korean BBQ",
    "AAPI OR Asian representation",
]

NEWSAPI_PAGE_SIZE = 30


def _fetch_newsapi_query(query: str) -> list:
    """Fetch one NewsAPI query. Safe to call from a thread."""
    date_from = (datetime.now(timezone.utc) - timedelta(days=30)).strftime("%Y-%m-%d")
    try:
        resp = requests.get(
            "https://newsapi.org/v2/everything",
            params={
                "q":        query,
                "sortBy":   "popularity",
                "pageSize": NEWSAPI_PAGE_SIZE,
                "language": "en",
                "from":     date_from,
                "apiKey":   NEWS_API_KEY,
            },
            timeout=10,
        )
        resp.raise_for_status()
        return resp.json().get("articles", [])
    except Exception as e:
        print(f"NewsAPI error for '{query}': {e}")
        return []


def fetch_newsapi_popular() -> list:
    """
    Fetches popular articles from NewsAPI across multiple AAPI-related queries
    in parallel. Each query targets a different facet of AAPI content.
    Results are AAPI-filtered and deduped by URL.
    """
    if not NEWS_API_KEY:
        print("NEWS_API_KEY not set — skipping NewsAPI fetch.")
        return []

    raw_items = []
    with ThreadPoolExecutor(max_workers=len(NEWSAPI_QUERIES)) as executor:
        futures = [executor.submit(_fetch_newsapi_query, q) for q in NEWSAPI_QUERIES]
        for future in as_completed(futures):
            raw_items.extend(future.result())

    seen, articles = set(), []
    for item in raw_items:
        title      = item.get("title") or "No Title"
        link       = item.get("url", "#")
        if link in seen:
            continue
        seen.add(link)

        summary    = item.get("description") or item.get("content") or ""
        clean_summ = re.sub(r"<[^>]+>", "", summary).strip()

        if not AAPI_FILTER_PATTERN.search(title + " " + clean_summ):
            continue

        short_summ = (clean_summ[:220] + "...") if len(clean_summ) > 220 else clean_summ
        published  = item.get("publishedAt", "")
        source     = (item.get("source") or {}).get("name", "NewsAPI")
        image      = item.get("urlToImage")
        category   = assign_category(title, clean_summ, source)

        trending = calculate_trending_score(published)
        popularity, social_boost = calculate_engagement_score(
            title, clean_summ, published, category, bool(image),
        )

        articles.append({
            "title":            title,
            "summary":          short_summ,
            "link":             link,
            "source":           source,
            "published":        published,
            "image":            image,
            "trending_score":   trending,
            "social_boost":     social_boost,
            "category":         category,
            "popularity_score": popularity,
        })

    return articles


# ─────────────────────────────────────────────────────────────────────────────
# AAPI relevance filtering
# ─────────────────────────────────────────────────────────────────────────────

AAPI_NATIVE_SOURCES = {
    "NBC Asian America",
    "NextShark",
    "AsAmNews",
    "Character Media",
}

AAPI_KEYWORDS = [
    # Identity & advocacy
    "asian", "aapi", "aanhpi", "asian american", "pacific islander",
    "asian owned", "asian-owned",
    # Ethnicities & demonyms
    "korean", "japanese", "chinese", "filipino", "vietnamese",
    "cambodian", "laotian", "burmese", "hmong", "thai", "malaysian",
    "bangladeshi", "nepali", "sri lankan", "taiwanese", "indonesian",
    "singaporean",
    # Countries & regions
    "taiwan", "hong kong", "singapore", "thailand", "india", "indonesia",
    "china", "japan", "korea", "philippines", "vietnam", "cambodia",
    "myanmar", "malaysia", "bangladesh", "nepal", "sri lanka",
    # Cities / neighbourhoods
    "beijing", "tokyo", "seoul", "manila", "bangkok", "jakarta",
    "chinatown", "koreatown", "japantown", "little saigon",
    "little tokyo", "little manila",
    # K-pop / K-drama / entertainment
    "kpop", "k-pop", "bts", "blackpink", "twice", "aespa", "stray kids",
    "k-drama", "kdrama", "hallyu", "anime", "manga", "webtoon",
    # Food & brands
    "hmart", "h-mart", "99 ranch", "boba", "bubble tea", "ramen",
    "korean bbq", "dim sum", "matcha", "mochi", "night market",
    "pho", "sushi", "dumpling",
]

AAPI_FILTER_PATTERN = re.compile(
    r'\b(' + '|'.join(re.escape(kw) for kw in sorted(AAPI_KEYWORDS, key=len, reverse=True)) + r')\b',
    re.IGNORECASE,
)


# ─────────────────────────────────────────────────────────────────────────────
# RSS fetching
# ─────────────────────────────────────────────────────────────────────────────

def _fetch_single_feed(source: str, url: str) -> list:
    """Fetch and process a single RSS feed. Safe to call from a thread."""
    is_aapi_native = source in AAPI_NATIVE_SOURCES
    articles = []
    try:
        feed = feedparser.parse(url)
        for entry in feed.entries[:30]:
            title       = entry.get("title", "No Title")
            summary     = entry.get("summary", entry.get("description", ""))
            clean_summ  = re.sub(r"<[^>]+>", "", summary).strip()

            if not is_aapi_native:
                search_text = title + " " + clean_summ
                if not AAPI_FILTER_PATTERN.search(search_text):
                    continue

            short_summ = (clean_summ[:220] + "...") if len(clean_summ) > 220 else clean_summ
            published  = entry.get("published", "")
            image      = extract_image(entry)
            category   = assign_category(title, clean_summ, source)

            trending   = calculate_trending_score(published)
            popularity, social_boost = calculate_engagement_score(
                title, clean_summ, published, category, bool(image),
            )

            articles.append({
                "title":            title,
                "summary":          short_summ,
                "link":             entry.get("link", "#"),
                "source":           source,
                "published":        published,
                "image":            image,
                "trending_score":   trending,
                "social_boost":     social_boost,
                "category":         category,
                "popularity_score": popularity,
            })
    except Exception as e:
        print(f"Error fetching {source}: {e}")
    return articles


def fetch_rss_articles() -> list:
    articles = []
    with ThreadPoolExecutor(max_workers=len(RSS_FEEDS)) as executor:
        futures = {
            executor.submit(_fetch_single_feed, src, url): src
            for src, url in RSS_FEEDS.items()
        }
        for future in as_completed(futures):
            articles.extend(future.result())
    return articles


# ─────────────────────────────────────────────────────────────────────────────
# Article response cache
# ─────────────────────────────────────────────────────────────────────────────
_articles_cache: list = []
_articles_cache_time: float = 0.0
ARTICLES_CACHE_SECONDS = 300  # 5 minutes


# ─────────────────────────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/articles")
def get_articles():
    """
    Live feed: fetch RSS + NewsAPI popular in parallel, archive to Supabase,
    return combined. Cached for 5 minutes to avoid hammering external APIs.
    """
    global _articles_cache, _articles_cache_time

    now = time.time()
    if _articles_cache and (now - _articles_cache_time) < ARTICLES_CACHE_SECONDS:
        return jsonify(_articles_cache)

    with ThreadPoolExecutor(max_workers=2) as executor:
        rss_future  = executor.submit(fetch_rss_articles)
        news_future = executor.submit(fetch_newsapi_popular)
        rss_articles     = rss_future.result()
        popular_articles = news_future.result()

    seen, combined = set(), []
    for a in rss_articles + popular_articles:
        if a["link"] not in seen:
            seen.add(a["link"])
            combined.append(a)

    _articles_cache      = combined
    _articles_cache_time = now

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
