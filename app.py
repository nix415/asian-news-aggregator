from flask import Flask, render_template, jsonify, request
import feedparser
import random

app = Flask(__name__)

RSS_FEEDS = {
    "NBC Asian America": "https://www.nbcnews.com/id/3032091/device/rss/rss.xml",
    "South China Morning Post": "https://www.scmp.com/rss/91/feed",
    "Nikkei Asia": "https://asia.nikkei.com/rss/feed/nar", 
    "The SF Standard": "https://sfstandard.com/feed/",
    "Channel News Asia": "https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml"
}

def fetch_articles():
    articles = []
    
    # 1. Define your "Asian-founded" vibe keywords here (must be lowercase)
    keywords = [
        "asian", "aapi", "kpop", "k-pop", "korean", "japanese", "chinese", 
        "filipino", "vietnamese", "hmart", "h-mart", "99 ranch", "supermarket", 
        "olympic", "medal", "founder", "boba", "community", "culture", "actor"
    ]
    
    for source, url in RSS_FEEDS.items():
        try:
            feed = feedparser.parse(url)
            
            # 2. Grab the top 30 recent articles to cast a wider net
            for entry in feed.entries[:30]:
                title = entry.get("title", "No Title")
                summary = entry.get("summary", entry.get("description", ""))
                
                # 3. Combine title and summary and make it lowercase for scanning
                search_text = (title + " " + summary).lower()
                
                # 4. If ANY keyword is found in the text, keep the article!
                if any(word in search_text for word in keywords):
                    if summary:
                        summary = summary[:200] + "..." if len(summary) > 200 else summary
                    articles.append({
                        "title": title,
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
