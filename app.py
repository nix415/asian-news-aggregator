from flask import Flask, render_template, jsonify, request
import feedparser
import random

app = Flask(__name__)

RSS_FEEDS = {
    "NBC Asian America": "https://www.nbcnews.com/id/3032091/device/rss/rss.xml",
    "South China Morning Post": "https://www.scmp.com/rss/91/feed",
    "Nikkei Asia": "https://asia.nikkei.com/rss/feed/nar", 
    "The San Francisco Standard": "https://sfstandard.com/feed/"
}

def fetch_articles():
    articles = []
    for source, url in RSS_FEEDS.items():
        try:
            feed = feedparser.parse(url)
            for entry in feed.entries[:10]:
                summary = entry.get("summary", entry.get("description", ""))
                if summary:
                    summary = summary[:200] + "..." if len(summary) > 200 else summary
                articles.append({
                    "title": entry.get("title", "No Title"),
                    "summary": summary,
                    "link": entry.get("link", "#"),
                    "source": source,
                    "published": entry.get("published", "")
                })
        except Exception as e:
            print(f"Error fetching {source}: {e}")
    return articles

def generate_social_pitch(title, summary):
    pitches = [
        f"🌏 Breaking: {title[:80]}... This is a must-read for anyone following Asian news. Tap the link to stay informed! #AsianNews #CurrentEvents",
        f"📰 {title[:60]}... Here's what you need to know about the latest developments in Asia. Don't miss this! #Asia #News",
        f"🔥 Hot off the press: {title[:70]}... Stay ahead of the curve with this important update. #AsianAmerican #WorldNews",
        f"✨ Must-read alert! {title[:65]}... This story is making waves across Asia. Check it out! #Breaking #AsiaNews",
        f"🌐 Your daily Asia update: {title[:60]}... Get the full story and share your thoughts! #GlobalNews #Asia"
    ]
    return random.choice(pitches)

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
    pitch = generate_social_pitch(title, summary)
    return jsonify({"pitch": pitch})

if __name__ == "__main__":
    app.run(debug=True)

app = app
