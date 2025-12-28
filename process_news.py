import json
import os
import requests
import time

def get_ai_data(title, description, likes, ignores):
    api_key = os.getenv('GEMINI_API_KEY')
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    
    prompt = (
        f"Article: {title}. Desc: {description}. "
        f"User Likes: {likes}. User Ignores: {ignores}. "
        "Task: Rate relevancy to 'Likes' 1-10. If matches 'Ignores' or related items (e.g. Trump/Fox News), score 0. "
        "Respond ONLY in this JSON format: {'score': 8, 'tags': 'gaming'}"
    )

    try:
        response = requests.post(url, json={"contents": [{"parts": [{"text": prompt}]}]}, timeout=10)
        res_text = response.json()['candidates'][0]['content']['parts'][0]['text']
        return json.loads(res_text.replace("'", '"')) 
    except:
        return {"score": 5, "tags": "General"}

def main():
    if not os.path.exists('raw_news.json'): return
    with open('raw_news.json', 'r') as f: data = json.load(f)

    likes = os.getenv('USER_LIKES', 'gaming')
    ignores = os.getenv('USER_IGNORED', 'politics')

    articles = data.get('articles', [])
    processed = []

    for article in articles:
        res = get_ai_data(article.get('title',''), article.get('description',''), likes, ignores)
        article['ai_score'] = res.get('score', 5)
        processed.append(article)
        time.sleep(4) # Respect Gemini free-tier limits

    processed.sort(key=lambda x: x.get('ai_score', 0), reverse=True)
    data['articles'] = processed
    with open('news.json', 'w') as f: json.dump(data, f, indent=4)

if __name__ == "__main__": main()
