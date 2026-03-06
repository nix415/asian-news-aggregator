from flask import Flask, render_template, jsonify, request
import feedparser
import anthropic
from datetime import datetime, timezone
import re
from email.utils import parsedate_to_datetime

app = Flask(__name__)

RSS_FEEDS = {
    # --- AAPI Community & Culture ---
    "NBC Asian America": "https://www.nbcnews.com/id/3032091/device/rss/rss.xml",
    "NextShark": "https://nextshark.com/feed",
    "Character Media": "https://charactermedia.com/feed/",
    "AsAmNews": "https://asamnews.com/feed/",
    "Hyphen Magazine": "https://hyphenmagazine.com/rss.xml",
    
    # --- Business & Entrepreneurship ---
    "Nikkei Asia": "https://asia.nikkei.com/rss/feed/nar",
    "South China Morning Post": "https://www.scmp.com/rss/91/feed",
    "Forbes Asia": "https://www.forbes.com/asia/feed/",
    "TechNode (China Tech)": "https://technode.com/feed/",
    "e27 (SE Asia Startups)": "https://e27.co/feed/",
    
    # --- Entertainment & Pop Culture ---
    "Soompi (K-Pop & K-Drama)": "https://www.soompi.com/feed",
    "AllKpop": "https://www.allkpop.com/rss",
    "Anime News Network": "https://www.animenewsnetwork.com/news/rss.xml",
    "Koreaboo": "https://www.koreaboo.com/feed/",
    
    # --- Regional & Global News ---
    "CNA (Channel News Asia)": "https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml",
    "The Japan Times": "https://www.japantimes.co.jp/feed/",
    "Yonhap News (Korea)": "https://en.yna.co.kr/RSS/index.xml",
    "The Straits Times": "https://www.straitstimes.com/news/asia/rss.xml",
    "The SF Standard": "https://sfstandard.com/feed/",
    "The News Lens (Taiwan/Asia)": "https://international.thenewslens.com/rss"
}

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
    """Score 0-100 based on recency. Newer = higher score."""
    pub_date = parse_date(published_str)
    if not pub_date:
        return 30
    try:
        now = datetime.now(timezone.utc)
        if pub_date.tzinfo is None:
            pub_date = pub_date.replace(tzinfo=timezone.utc)
        hours_ago = (now - pub_date).total_seconds() / 3600
        if hours_ago < 2:
            return 98
        elif hours_ago < 6:
            return 90
        elif hours_ago < 12:
            return 80
        elif hours_ago < 24:
            return 70
        elif hours_ago < 48:
            return 55
        elif hours_ago < 72:
            return 40
        else:
            return max(10, int(30 - hours_ago / 24))
    except Exception:
        return 30


def extract_image(entry):
    """Try every common RSS image location, return URL or None."""
    # 1. media:content or media:thumbnail
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

    # 2. enclosures (podcasts/images)
    for enc in entry.get("enclosures", []):
        if enc.get("type", "").startswith("image"):
            return enc.get("href") or enc.get("url", "")

    # 3. Parse first <img> tag out of summary/content HTML
    html = entry.get("summary", "") or entry.get("content", [{}])[0].get("value", "") if entry.get("content") else entry.get("summary", "")
    match = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', html)
    if match:
        return match.group(1)

    return None

def fetch_articles():
    articles = []
    keywords = [
        "asian", "aapi", "kpop", "k-pop", "korean", "japanese", "chinese",
        "filipino", "vietnamese", "hmart", "h-mart", "99 ranch", "supermarket",
        "olympic", "medal", "founder", "boba", "community", "culture", "actor",
        "taiwan", "hong kong", "singapore", "thailand", "india", "indonesia"
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
                    short_summary = (clean_summary[:200] + "...") if len(clean_summary) > 200 else clean_summary
                    published = entry.get("published", "")
                    image_url = extract_image(entry)
                    articles.append({
                        "title": title,
                        "summary": short_summary,
                        "link": entry.get("link", "#"),
                        "source": source,
                        "published": published,
                        "image": image_url,
                        "trending_score": calculate_trending_score(published)
                    })
        except Exception as e:
            print(f"Error fetching {source}: {e}")

    return articles


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/articles")
def get_articles():
    articles = fetch_articles()
    return jsonify(articles)


@app.route("/api/generate-pitch", methods=["POST"])
def generate_pitch():
    data = request.json
    title = data.get("title", "")
    summary = data.get("summary", "")
    platform = data.get("platform", "twitter")

    platform_instructions = {
        "twitter": "Write a punchy tweet (max 240 chars). Use 2-3 relevant hashtags. Make it hook readers immediately. No fluff.",
        "instagram": "Write an engaging Instagram caption (2-4 sentences + line breaks). Add 8-10 relevant hashtags at the end. Use 1-2 emojis naturally.",
        "linkedin": "Write a professional LinkedIn post (3-4 sentences). Focus on why this matters for business/culture. No hashtag spam — max 3 hashtags."
    }

    prompt = f"""You are a social media strategist specializing in Asian American and Asian news content.

Article Title: {title}
Article Summary: {summary}
Platform: {platform.capitalize()}

Task: {platform_instructions.get(platform, platform_instructions["twitter"])}

Write ONLY the social media post. No intro, no explanation, no quotes around it."""

    try:
        client = anthropic.Anthropic()
        message = client.messages.create(
            model="claude-opus-4-5",
            max_tokens=300,
            messages=[{"role": "user", "content": prompt}]
        )
        pitch = message.content[0].text.strip()
        return jsonify({"pitch": pitch})
    except Exception as e:
        print(f"Anthropic API error: {e}")
        return jsonify({"error": "Could not generate pitch. Check your API key."}), 500


if __name__ == "__main__":
    app.run(debug=True)

app = app
