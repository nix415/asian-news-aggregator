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

CATEGORIES = ["Founders", "Culture", "Entertainment", "Community"]

# Checked in order — first match wins
CATEGORY_KEYWORDS = {
    "Entertainment": [
        "kpop", "k-pop", "bts", "blackpink", "twice", "stray kids", "aespa",
        "k-drama", "kdrama", "webtoon", "anime", "manga", "hallyu", "idol",
        "entertainment", "actor", "actress", "film", "movie", "music",
        "concert", "album", "debut", "drama", "celebrity", "award", "oscar",
        "grammy", "emmy", "streaming", "netflix", "disney", "tv show",
    ],
    "Founders": [
        "founder", "startup", "venture", "ceo", "funding", "investor",
        "ipo", "acquisition", "business", "entrepreneur", "company",
        "tech", "silicon valley", "economy", "market", "revenue",
        "finance", "trade", "gdp", "stock", "investment", "unicorn",
        "incubator", "accelerator", "seed round", "series a",
    ],
    "Culture": [
        "culture", "heritage", "festival", "tradition", "food", "boba",
        "hmart", "h-mart", "99 ranch", "restaurant", "cuisine", "identity",
        "diaspora", "art", "exhibit", "museum", "literature", "fashion",
        "design", "architecture", "photography", "travel", "language",
    ],
    "Community": [
        "community", "aapi", "asian american", "immigration", "activism",
        "protest", "discrimination", "hate crime", "representation",
        "policy", "election", "government", "military", "diplomatic",
        "china", "japan", "korea", "taiwan", "hong kong", "singapore",
        "philippines", "vietnam", "thailand", "indonesia", "india",
        "beijing", "tokyo", "seoul", "manila", "bangkok", "jakarta",
        "malaysia", "cambodia", "myanmar", "pacific", "asia",
    ],
}

SOURCE_DEFAULT_CATEGORY = {
    "NBC Asian America":        "Community",
    "South China Morning Post": "Community",
    "Nikkei Asia":              "Founders",
    "The SF Standard":          "Founders",
    "Channel News Asia":        "Community",
    "NextShark":                "Culture",
    "AsAmNews":                 "Community",
    "The Korea Herald":         "Community",
    "Character Media":          "Entertainment",
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
                    articles.append({
                        "title": title,
                        "summary": short_summary,
                        "link": entry.get("link", "#"),
                        "source": source,
                        "published": published,
                        "image": extract_image(entry),
                        "trending_score": calculate_trending_score(published),
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
