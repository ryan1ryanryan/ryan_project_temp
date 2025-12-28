import json
import os
import requests
import time

def get_ai_data(title, description, likes, ignores):
    api_key = os.getenv('GEMINI_API_KEY')
    # Updated to the new Gemini 2.5 Native Audio Dialog Preview model
    # Note: Model version '12-2025' is the current stable preview for December
    model_id = "gemini-2.5-flash-native-audio-preview-12-2025"
    url = f"https://generativelanguage.googleapis.com/v1/models/{model_id}:generateContent?key={api_key}"
    
    prompt = (
        f"Article: {title}. Desc: {description}. "
        f"User Likes: {likes}. User Ignores: {ignores}. "
        "Task: Rate relevancy 1-10 based on semantic meaning. "
        "Respond ONLY in JSON format: {'score': 8, 'tags': 'tech'}"
    )

    try:
        headers = {'Content-Type': 'application/json'}
        payload = {"contents": [{"parts": [{"text": prompt}]}]}
        
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        
        if response.status_code != 200:
            print(f"❌ API Error {response.status_code}: {response.text}")
            return {"score": 5, "tags": "Error"}

        res_json = response.json()
        res_text = res_json['candidates'][0]['content']['parts'][0]['text']
        
        # Strip potential markdown formatting from AI response
        clean_json = res_text.replace("```json", "").replace("```", "").strip()
        return json.loads(clean_json.replace("'", '"')) 
        
    except Exception as e:
        print(f"🔴 System Failure: {str(e)}")
        return {"score": 5, "tags": "System Error"}

def main():
    if not os.path.exists('raw_news.json'):
        print("Raw news file not found.")
        return
        
    with open('raw_news.json', 'r') as f:
        data = json.load(f)

    # Preferences retrieved from GitHub environment
    likes = os.getenv('USER_LIKES', 'samsung, tech, gaming')
    ignores = os.getenv('USER_IGNORED', 'trump, politics')
    articles = data.get('articles', [])
    processed = []

    print(f"AI Analyzing {len(articles)} articles using Gemini 2.5 Native Audio Dialog...")

    for i, article in enumerate(articles):
        res = get_ai_data(article.get('title',''), article.get('description',''), likes, ignores)
        article['ai_score'] = res.get('score', 5)
        processed.append(article)
        
        # Free Tier Rate Limit handling (15 requests per minute)
        time.sleep(4) 

    # Sort so the highest semantic matches appear at the top
    processed.sort(key=lambda x: x.get('ai_score', 0), reverse=True)
    
    data['articles'] = processed
    with open('news.json', 'w') as f:
        json.dump(data, f, indent=4)
    print("AI update complete using the latest model.")

if __name__ == "__main__":
    main()
