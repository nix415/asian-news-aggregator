# Asian News Aggregator

A modern news aggregator for tracking Asian-related news from trusted sources.

## Features

- **RSS Feed Integration**: Aggregates news from NBC Asian America, South China Morning Post, and Nikkei Asia
- **Modern UI**: Clean, professional design with Tailwind CSS and Inter font
- **Source Filtering**: Filter articles by source
- **Social Media Pitch Generator**: Generate Instagram/X captions with one click
- **Copy to Clipboard**: Easily copy generated pitches

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the application:
```bash
python app.py
```

3. Open your browser and go to `http://localhost:5000`

## Folder Structure

```
news-aggregator/
├── app.py              # Flask backend
├── requirements.txt    # Python dependencies
├── README.md          # This file
└── templates/
    └── index.html     # Frontend template
```

## API Endpoints

- `GET /` - Serves the main page
- `GET /api/articles` - Returns all articles from RSS feeds
- `POST /api/generate-pitch` - Generates a social media pitch for an article

## RSS Sources

- NBC Asian America
- South China Morning Post (Asia section)
- Nikkei Asia
