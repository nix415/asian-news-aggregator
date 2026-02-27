from flask import Flask, render_template, jsonify, request
import feedparser
import random
from datetime import datetime

app = Flask(__name__)

RSS_FEEDS = {
    "NBC Asian America": "https://www.nbcnews.com/id/3032091/device/rss/rss.xml",
    "South China Morning Post": "https://www.scmp.com/rss/91/feed",
    "Nikkei Asia": "https://asia.nikkei.com/rss/feed/nar"
}

def fetch_feeds():
    """Fetch and parse all RSS feeds."""
    articles = []
    
    for source_name, feed_url in RSS_FEEDS.items():
        try:
            feed = feedparser.parse(feed_url)
            for entry in feed.entries[:10]:
                summary = entry.get('summary', entry.get('description', ''))
                if len(summary) > 200:
                    summary = summary[:200] + '...'
                
                published = entry.get('published', entry.get('updated', ''))
                
                articles.append({
                    'id': hash(entry.get('link', '')),
                    'title': entry.get('title', 'No Title'),
                    'summary': summary,
                    'link': entry.get('link', '#'),
                    'source': source_name,
                    'published': published
                })
        except Exception as e:
            print(f"Error fetching {source_name}: {e}")
    
    return articles

def generate_social_pitch(title, summary):
    """Simulate AI-generated social media pitch."""
    hooks = [
        "Breaking news you need to know about! 🌏",
        "This is why it matters for our community 💪",
        "Here's what's happening in Asia right now 📰",
        "Important update from across the Pacific 🌊",
        "Your daily dose of Asian news 🗞️"
    ]
    
    ctas = [
        "Tap the link to read more! 🔗",
        "What do you think? Drop a comment below! 💬",
        "Share this with someone who should know! 📲",
        "Stay informed, stay connected! ✨",
        "Link in bio for the full story! 👆"
    ]
    
    hook = random.choice(hooks)
    cta = random.choice(ctas)
    
    short_title = title[:80] + "..." if len(title) > 80 else title
    
    pitch = f"{hook}\n\n{short_title}\n\n{cta}\n\n#AsianNews #Asia #Breaking #News #Community"
    
    return pitch

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/articles')
def get_articles():
    articles = fetch_feeds()
    return jsonify(articles)

@app.route('/api/generate-pitch', methods=['POST'])
def generate_pitch():
    data = request.json
    title = data.get('title', '')
    summary = data.get('summary', '')
    pitch = generate_social_pitch(title, summary)
    return jsonify({'pitch': pitch})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
