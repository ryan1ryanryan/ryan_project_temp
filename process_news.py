import json
import os
import requests
import time

def get_ai_data(title, description, likes, ignores):
    api_key = os.getenv('GEMINI_API_KEY')
    # Updated to the standard v1 endpoint for better stability
    url = f"https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key={api_key}"
    
    prompt = (
        f"Article: {title}. Desc: {description}. "
        f"User Likes: {likes}. User Ignores: {ignores}. "
        "Task: Rate relevancy 1-10 based on semantic meaning. "
        "Respond ONLY in JSON: {'score': 8, 'tags': 'tech'}"
    )

    try:
        response = requests.post(url, json={"contents": [{"parts": [{"text": prompt}]}]}, timeout=10)
        
        # This will now catch that 404 and print the exact reason
        if response.status_code != 200:
            print(f"❌ API Error {response.status_code} at {url}: {response.text}")
            return {"score": 5, "tags": "Error"}

        res_json = response.json()
        res_text = res_json['candidates'][0]['content']['parts'][0]['text']
        clean_json = res_text.replace("```json", "").replace("```", "").strip()
        return json.loads(clean_json.replace("'", '"')) 
        
    except Exception as e:
        print(f"🔴 System Failure: {str(e)}")
        return {"score": 5, "tags": "System Error"}

def main():
    if not os.path.exists('raw_news.json'): return
    with open('raw_news.json', 'r') as f: data = json.load(f)

    likes = os.getenv('USER_LIKES', 'samsung, tech')
    ignores = os.getenv('USER_IGNORED', 'trump, politics')

    articles = data.get('articles', [])
    processed = []

    print(f"Starting AI Scan for {len(articles)} articles...")

    for i, article in enumerate(articles):
        res = get_ai_data(article.get('title',''), article.get('description',''), likes, ignores)
        article['ai_score'] = res.get('score', 5)
        processed.append(article)
        
        # Slow down to avoid hitting rate limits on the free tier
        time.sleep(4) 

    processed.sort(key=lambda x: x.get('ai_score', 0), reverse=True)
    data['articles'] = processed
    with open('news.json', 'w') as f:
        json.dump(data, f, indent=4)
    print("AI update complete.")

if __name__ == "__main__":
    main()
