from flask import Flask, render_template, jsonify, request
import feedparser
import anthropic
from datetime import datetime, timezone
import re
from email.utils import parsedate_to_datetime

app = Flask(__name__)

RSS_FEEDS = {
    "NBC Asian America": "https://www.nbcnews.com/id/3032091/device/rss/rss.xml",
    "South China Morning Post": "https://www.scmp.com/rss/91/feed",
    "Nikkei Asia": "https://asia.nikkei.com/rss/feed/nar",
    "The SF Standard": "https://sfstandard.com/feed/",
    "Channel News Asia": "https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml",
    "NextShark": "https://nextshark.com/feed",
    "AsAmNews": "https://asamnews.com/feed/",
    "The Korea Herald": "https://www.koreaherald.com/rss/newsAll",
    "Character Media": "https://charactermedia.com/feed/",
}

CATEGORIES = ["Brand & Founder", "Culture", "Community", "Lifestyle & New Openings"]

# Checked in order — first match wins
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
        "popup", "café", "cafe", "boba", "food", "cuisine", "dining",
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


def assign_category(title: str, summary: str, source: str) -> str:
    text = (title + " " + summary).lower()
    for category, kws in CATEGORY_KEYWORDS.items():
        if any(kw in text for kw in kws):
            return category
    return SOURCE_DEFAULT_CATEGORY.get(source, "Community")


def parse_date(date_str):
    if not date_str:
        return None
    try:
        return parsedate_to_datetime(date_str)
    except Exception:
        pass
    try:
        return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
    except Exception:
        pass
    return None


def calculate_trending_score(published_str):
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


# Keywords that signal high virality on Instagram, TikTok, and Reddit
# for the Asian Founded audience. Tune this list as trends evolve.
VIRAL_KEYWORDS = [
    # Brand / founder moments
    "founder", "startup", "brand", "launch", "collab", "collaboration",
    "asian-owned", "asian owned", "small business", "entrepreneur",
    # Food & lifestyle magnets
    "boba", "bubble tea", "hmart", "h-mart", "99 ranch", "ramen",
    "korean bbq", "dim sum", "matcha", "mochi", "night market",
    # Culture / entertainment drivers
    "k-pop", "kpop", "bts", "blackpink", "twice", "aespa", "stray kids",
    "k-drama", "kdrama", "hallyu", "anime", "webtoon",
    # Social-first topics
    "viral", "trending", "tiktok", "tik tok", "instagram", "reels",
    "sold out", "waitlist", "pop-up", "popup", "limited edition",
    "representation", "first asian", "historic", "record-breaking",
    # Community energy
    "aapi", "asian american", "pride", "activist", "movement",
]

SOCIAL_BOOST_AMOUNT = 40


def get_social_boost_score(title: str, summary: str) -> tuple[bool, int]:
    """
    Returns (social_boost: bool, bonus: int).
    Checks title + summary against VIRAL_KEYWORDS.
    If 1+ match → social_boost=True, bonus=SOCIAL_BOOST_AMOUNT.
    """
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
    html = (entry.get("content", [{}])[0].get("value", "")
            if entry.get("content") else entry.get("summary", ""))
    match = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', html)
    if match:
        return match.group(1)
    return None


def fetch_articles():
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
                title = entry.get("title", "No Title")
                summary = entry.get("summary", entry.get("description", ""))
                clean_summary = re.sub(r'<[^>]+>', '', summary).strip()
                search_text = (title + " " + clean_summary).lower()

                if any(word in search_text for word in keywords):
                    short_summary = (clean_summary[:220] + "...") if len(clean_summary) > 220 else clean_summary
                    published = entry.get("published", "")
                    base_score = calculate_trending_score(published)
                    social_boost, bonus = get_social_boost_score(title, clean_summary)
                    articles.append({
                        "title": title,
                        "summary": short_summary,
                        "link": entry.get("link", "#"),
                        "source": source,
                        "published": published,
                        "image": extract_image(entry),
                        "trending_score": min(base_score + bonus, 100),
                        "social_boost": social_boost,
                        "category": assign_category(title, clean_summary, source),
                    })
        except Exception as e:
            print(f"Error fetching {source}: {e}")

    return articles


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/articles")
def get_articles():
    return jsonify(fetch_articles())


@app.route("/api/generate-pitch", methods=["POST"])
def generate_pitch():
    data = request.json
    title = data.get("title", "")
    summary = data.get("summary", "")
    platform = data.get("platform", "twitter")
    instructions = {
        "twitter":   "Punchy tweet, max 240 chars, 2-3 hashtags.",
        "instagram": "Instagram caption, 2-4 sentences, 8-10 hashtags at end.",
        "linkedin":  "Professional post, 3-4 sentences, max 3 hashtags.",
    }
    prompt = f"Social media strategist for Asian American news.\nTitle: {title}\nSummary: {summary}\nPlatform: {platform.capitalize()}\nTask: {instructions.get(platform, instructions['twitter'])}\nWrite ONLY the post."
    try:
        client = anthropic.Anthropic()
        msg = client.messages.create(model="claude-opus-4-5", max_tokens=300,
                                     messages=[{"role": "user", "content": prompt}])
        return jsonify({"pitch": msg.content[0].text.strip()})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)

app = app
