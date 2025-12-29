import json
import os
import time
from datetime import datetime
from google import genai

def get_ai_data(client, title, description):
    # Strictly using Gemini 2.5 Flash Native Audio Preview
    model_id = "gemini-2.5-flash"
    prompt = f"Article: {title}. Desc: {description}. Task: Rate relevancy 1-10 for a tech enthusiast. Respond ONLY JSON: {{'score': 8}}"
    try:
        response = client.models.generate_content(model=model_id, contents=prompt)
        text = response.text.strip().replace("```json", "").replace("```", "")
        return json.loads(text)
    except Exception as e:
        print(f"AI Error: {e}")
        return {"score": 5}

def main():
    if not os.path.exists('raw_news.json'):
        print("raw_news.json missing.")
        return
        
    api_key = os.getenv('GEMINI_API_KEY')
    client = genai.Client(api_key=api_key)
    
    with open('raw_news.json', 'r') as f:
        data = json.load(f)
    
    articles = data.get('articles', [])
    print(f"Gemini 2.5 analyzing {len(articles)} stories...")
    
    for article in articles:
        res = get_ai_data(client, article.get('title',''), article.get('description',''))
        article['ai_score'] = res.get('score', 5)
        time.sleep(4) # Respecting Free Tier limits

    # Initial sort by AI score
    articles.sort(key=lambda x: x.get('ai_score', 0), reverse=True)
    
    output = {
        "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "articles": articles
    }
    
    with open('news.json', 'w') as f:
        json.dump(output, f, indent=4)
    print("AI Rank Complete.")

if __name__ == "__main__":
    main()
