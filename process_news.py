import json
import os
import time
from google import genai

def get_ai_data(client, title, description, likes, ignores):
    # Using the model you just verified
    model_id = "gemini-2.5-flash"
    
    prompt = (
        f"Article Title: {title}. Description: {description}. "
        f"User Interests: {likes}. User Blocks: {ignores}. "
        "Task: Rate relevancy 1-10 based on semantic distance. "
        "Respond ONLY in valid JSON format: {'score': 8, 'tags': 'tech'}"
    )

    try:
        # The exact call you verified works
        response = client.models.generate_content(
            model=model_id, 
            contents=prompt
        )
        
        # Clean the response text to ensure it's pure JSON
        res_text = response.text
        clean_json = res_text.replace("```json", "").replace("```", "").strip()
        return json.loads(clean_json.replace("'", '"')) 
        
    except Exception as e:
        print(f"🔴 AI processing failed for this article: {str(e)}")
        return {"score": 5, "tags": "error"}

def main():
    if not os.path.exists('raw_news.json'):
        print("raw_news.json not found. Run the fetch step first.")
        return

    # Initialize the client with your key from GitHub Secrets
    api_key = os.getenv('GEMINI_API_KEY')
    client = genai.Client(api_key=api_key)

    with open('raw_news.json', 'r') as f:
        data = json.load(f)

    likes = os.getenv('USER_LIKES', 'tech, samsung, gaming')
    ignores = os.getenv('USER_IGNORED', 'politics, gossip')
    articles = data.get('articles', [])
    processed = []

    print(f"AI Analyzing {len(articles)} articles using verified Gemini 2.5 SDK...")

    for article in articles:
        # Pass the verified client into the helper function
        res = get_ai_data(client, article.get('title',''), article.get('description',''), likes, ignores)
        article['ai_score'] = res.get('score', 5)
        processed.append(article)
        
        # Sleep to stay within free tier limits (15 requests per minute)
        time.sleep(4) 

    # Sort: Highest AI relevancy at the top
    processed.sort(key=lambda x: x.get('ai_score', 0), reverse=True)
    
    data['articles'] = processed
    with open('news.json', 'w') as f:
        json.dump(data, f, indent=4)
    print("Success: news.json is now AI-ranked and ready for GitHub Pages.")

if __name__ == "__main__":
    main()
