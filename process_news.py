import json
import os
import requests
import time

def get_ai_tags(title, description):
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        return "General"

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    
    # POWER PROMPT: This forces Gemini to identify affiliations
    prompt = (
        f"Analyze this news. Title: {title}. Description: {description}. "
        "Return a comma-separated list of 5 categories/entities. "
        "CRITICAL: If a person is mentioned, you MUST include their political party or affiliation "
        "(e.g., if Trump is mentioned, include 'Republican'; if Biden is mentioned, include 'Democrat'). "
        "Example: Politics, Republican, Trump, Election, US News."
    )

    payload = {"contents": [{"parts": [{"text": prompt}]}]}

    try:
        response = requests.post(url, json=payload, timeout=10)
        result = response.json()
        return result['candidates'][0]['content']['parts'][0]['text']
    except Exception as e:
        print(f"AI Error: {e}")
        return "General"

def main():
    # We read from the raw fetch and save to the enriched file
    if not os.path.exists('raw_news.json'):
        print("Raw news file not found.")
        return

    with open('raw_news.json', 'r') as f:
        data = json.load(f)

    articles = data.get('articles', [])
    print(f"AI Tagging {len(articles)} articles...")

    for i, article in enumerate(articles):
        article['ai_tags'] = get_ai_tags(article.get('title', ''), article.get('description', ''))
        # Respect free-tier rate limits
        time.sleep(1) 

    with open('news.json', 'w') as f:
        json.dump(data, f, indent=4)
    print("Done! news.json is now AI-enriched.")

if __name__ == "__main__":
    main()
