import json
import os
import requests
import time

def get_ai_tags(title, description):
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        return "General"

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    
    # This prompt tells Gemini to understand the context (e.g., Trump = Republican)
    prompt = (
        f"Analyze this news. Title: {title}. Description: {description}. "
        "Return a comma-separated list of 5 categories/entities related to this. "
        "Include political parties, industries, and key people mentioned. "
        "Example: Politics, Republican, Trump, Election, US News."
    )

    payload = {
        "contents": [{"parts": [{"text": prompt}]}]
    }

    try:
        # We use a timeout to ensure the Action doesn't hang
        response = requests.post(url, json=payload, timeout=10)
        result = response.json()
        return result['candidates'][0]['content']['parts'][0]['text']
    except Exception as e:
        print(f"AI Error: {e}")
        return "General"

def main():
    if not os.path.exists('raw_news.json'):
        print("No raw news found.")
        return

    with open('raw_news.json', 'r') as f:
        data = json.load(f)

    articles = data.get('articles', [])
    print(f"Processing {len(articles)} articles with Gemini...")

    for i, article in enumerate(articles):
        # We add the AI tags to the article object
        article['ai_tags'] = get_ai_tags(article.get('title', ''), article.get('description', ''))
        
        # Optional: Print progress in GitHub logs
        if (i + 1) % 10 == 0:
            print(f"Processed {i + 1} articles...")
        
        # Free tier rate limiting: wait a tiny bit between calls
        time.sleep(1) 

    with open('news.json', 'w') as f:
        json.dump(data, f, indent=4)
    print("AI tagging complete. news.json saved.")

if __name__ == "__main__":
    main()
