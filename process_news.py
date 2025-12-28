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
        "Task: Rate relevancy to 'Likes' 1-10. If matches 'Ignores' or related items, score 0. "
        "Respond ONLY in this JSON format: {'score': 8, 'tags': 'gaming'}"
    )

    try:
        response = requests.post(url, json={"contents": [{"parts": [{"text": prompt}]}]}, timeout=10)
        
        # Check if the API returned an error code (like 429 for rate limits or 403 for bad keys)
        if response.status_code != 200:
            print(f"❌ API Error {response.status_code}: {response.text}")
            return {"score": 5, "tags": "Error"}

        res_json = response.json()
        
        # Verify if 'candidates' exists in the response
        if 'candidates' not in res_json:
            print(f"⚠️ Unexpected Response Structure: {res_json}")
            return {"score": 5, "tags": "Unknown"}

        res_text = res_json['candidates'][0]['content']['parts'][0]['text']
        
        # Clean potential markdown formatting from AI response
        clean_json = res_text.replace("```json", "").replace("```", "").strip()
        return json.loads(clean_json.replace("'", '"')) 
        
    except Exception as e:
        # THIS IS THE LOGGING YOU NEEDED
        print(f"🔴 AI Processing Failed: {str(e)}")
        return {"score": 5, "tags": "System Error"}

def main():
    if not os.path.exists('raw_news.json'):
        print("Raw news file not found.")
        return
        
    with open('raw_news.json', 'r') as f:
        data = json.load(f)

    # Use the preferences set in GitHub environment
    likes = os.getenv('USER_LIKES', 'gaming')
    ignores = os.getenv('USER_IGNORED', 'politics')

    articles = data.get('articles', [])
    processed = []

    print(f"AI Tagging {len(articles)} articles...")

    for i, article in enumerate(articles):
        res = get_ai_data(article.get('title',''), article.get('description',''), likes, ignores)
        article['ai_score'] = res.get('score', 5)
        processed.append(article)
        
        # Show progress in GitHub Actions log
        if (i + 1) % 5 == 0:
            print(f"Processed {i + 1}/{len(articles)} articles...")
            
        # Respect free-tier rate limits (15 requests per minute)
        time.sleep(4) 

    # Sort so highest relevancy is at the top
    processed.sort(key=lambda x: x.get('ai_score', 0), reverse=True)
    
    data['articles'] = processed
    with open('news.json', 'w') as f:
        json.dump(data, f, indent=4)
    print("Done! news.json is now AI-enriched.")

if __name__ == "__main__":
    main()
