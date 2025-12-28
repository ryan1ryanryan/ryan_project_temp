import json
import os
import requests
import time

def get_relevancy_score(title, description, likes, ignores):
    api_key = os.getenv('GEMINI_API_KEY')
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    
    prompt = (
        f"Article Title: {title}. Description: {description}. "
        f"User Likes: {likes}. User Ignores: {ignores}. "
        "Task: 1. Rate relevancy to 'Likes' from 1-10. "
        "2. If it matches an 'Ignore' or a related concept (e.g., Trump -> Fox News), score it 0. "
        "3. Provide exactly 3 tags. "
        "Respond ONLY in this JSON format: {'score': 8, 'tags': ['tag1', 'tag2']}"
    )

    try:
        response = requests.post(url, json={"contents": [{"parts": [{"text": prompt}]}]}, timeout=10)
        # Parse the JSON response from Gemini
        res_text = response.json()['candidates'][0]['content']['parts'][0]['text']
        return json.loads(res_text.replace("'", '"')) 
    except:
        return {"score": 5, "tags": ["General"]}

def main():
    with open('raw_news.json', 'r') as f:
        data = json.load(f)

    # These would be passed from your GitHub Secrets or a text file
    likes = os.getenv('USER_LIKES', 'gaming, tech')
    ignores = os.getenv('USER_IGNORED', 'politics, trump')

    articles = data.get('articles', [])
    scored_articles = []

    for article in articles:
        ai_data = get_relevancy_score(article.get('title',''), article.get('description',''), likes, ignores)
        article['ai_score'] = ai_data['score']
        article['ai_tags'] = ", ".join(ai_data['tags'])
        scored_articles.append(article)
        time.sleep(2) # Rate limit protection

    # SORT: Highest score first
    scored_articles.sort(key=lambda x: x['ai_score'], reverse=True)

    data['articles'] = scored_articles
    with open('news.json', 'w') as f:
        json.dump(data, f, indent=4)

if __name__ == "__main__":
    main()
