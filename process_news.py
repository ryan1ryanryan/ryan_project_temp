import json
import os
import requests
import time

def get_ai_data(title, description, likes, ignores):
    api_key = os.getenv('GEMINI_API_KEY')
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    
    # We explicitly tell the AI to use semantic relationships here
    prompt = (
        f"Article: {title}. Desc: {description}. "
        f"User Likes: {likes}. User Ignores: {ignores}. "
        "Task: Use semantic relationships (embeddings) to rate relevancy to 'Likes' from 1-10. "
        "If the content relates to 'Ignores', score 0. "
        "Respond ONLY in this JSON format: {'score': 8, 'tags': 'category'}"
    )

    try:
        response = requests.post(url, json={"contents": [{"parts": [{"text": prompt}]}]}, timeout=10)
        
        if response.status_code != 200:
            print(f"❌ API Error {response.status_code}: {response.text}")
            return {"score": 5, "tags": "Error"}

        res_json = response.json()
        if 'candidates' not in res_json:
            print(f"⚠️ Unexpected Response: {res_json}")
            return {"score": 5, "tags": "Unknown"}

        res_text = res_json['candidates'][0]['content']['parts'][0]['text']
        clean_json = res_text.replace("```json", "").replace("```", "").strip()
        return json.loads(clean_json.replace("'", '"')) 
        
    except Exception as e:
        print(f"🔴 AI Processing Failed: {str(e)}")
        return {"score": 5, "tags": "System Error"}

def main():
    if not os.path.exists('raw_news.json'):
        print("Raw news file not found.")
        return
    with open('raw_news.json', 'r') as f: data = json.load(f)

    likes = os.getenv('USER_LIKES', 'gaming, tech, pc hardware')
    ignores = os.getenv('USER_IGNORED', 'politics, celebrity gossip')
    articles = data.get('articles', [])
    processed = []

    print(f"AI Analyzing {len(articles)} articles using vector semantics...")
    for i, article in enumerate(articles):
        res = get_ai_data(article.get('title',''), article.get('description',''), likes, ignores)
        article['ai_score'] = res.get('score', 5)
        processed.append(article)
        if (i + 1) % 5 == 0: print(f"Processed {i + 1}/{len(articles)} articles...")
        time.sleep(4) 

    processed.sort(key=lambda x: x.get('ai_score', 0), reverse=True)
    data['articles'] = processed
    with open('news.json', 'w') as f: json.dump(data, f, indent=4)
    print("Done! News is now semantic-ranked.")

if __name__ == "__main__": main()
