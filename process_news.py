import json
import os
import requests
import time

def get_ai_data(title, description, likes, ignores):
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        print("❌ Missing GEMINI_API_KEY environment variable")
        return {"score": 0, "tags": "NoAPIKey"}
        
    # Use a known working model name
    model_id = "gemini-2.0-flash-exp"  # Updated to valid model
    url = f"https://generativelanguage.googleapis.com/v1/models/{model_id}:generateContent?key={api_key}"
    
    prompt = (
        f"Article: {title}. Desc: {description}. "
        f"User Likes: {likes}. User Ignores: {ignores}. "
        "Task: Rate relevancy 1-10 based on semantic meaning. "
        "Respond ONLY in JSON format: {{'score': 8, 'tags': 'tech'}}"
    )

    try:
        headers = {'Content-Type': 'application/json'}
        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }],
            "generationConfig": {
                "responseMimeType": "application/json"
            }
        }
        
        print(f"🔍 Sending request to Gemini API...")
        
        response = requests.post(url, json=payload, headers=headers, timeout=15)
        
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ API ERROR {response.status_code}")
            print(f"   Full Response: {response.text}")
            print(f"   Headers: {dict(response.headers)}")
            return {"score": 0, "tags": f"HTTP{response.status_code}"}

        res_json = response.json()
        
        # Handle blocked content
        if 'candidates' not in res_json or not res_json['candidates']:
            print("⚠️  No candidates in response")
            return {"score": 0, "tags": "NoCandidates"}
            
        res_text = res_json['candidates'][0]['content']['parts'][0]['text']
        print(f"✅ AI Response: {res_text[:100]}...")
        
        # Clean JSON response
        clean_json = res_text.strip().replace("``````", "")
        parsed = json.loads(clean_json.replace("'", '"'))
        return parsed
        
    except requests.exceptions.Timeout:
        print("⏰ Request timeout")
        return {"score": 0, "tags": "Timeout"}
    except requests.exceptions.RequestException as e:
        print(f"🌐 Network error: {str(e)}")
        return {"score": 0, "tags": "Network"}
    except json.JSONDecodeError as e:
        print(f"🔧 JSON parse error: {str(e)}")
        print(f"Raw AI response: {res_text}")
        return {"score": 0, "tags": "JSONError"}
    except KeyError as e:
        print(f"🔧 Missing expected field: {str(e)}")
        print(f"Response structure: {res_json}")
        return {"score": 0, "tags": "BadStructure"}
    except Exception as e:
        print(f"🔴 Unexpected error: {str(e)}")
        return {"score": 0, "tags": "SystemError"}

def main():
    if not os.path.exists('raw_news.json'):
        print("❌ Raw news file 'raw_news.json' not found.")
        return
        
    with open('raw_news.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Get user preferences from environment
    likes = os.getenv('USER_LIKES', 'samsung, tech, gaming')
    ignores = os.getenv('USER_IGNORED', 'trump, politics')
    
    articles = data.get('articles', [])
    if not articles:
        print("❌ No articles found in raw_news.json")
        return
        
    processed = []
    print(f"🤖 AI Analyzing {len(articles)} articles with Gemini...")

    for i, article in enumerate(articles):
        print(f"\n[{i+1}/{len(articles)}] Processing: {article.get('title', 'No Title')[:60]}...")
        
        res = get_ai_data(
            article.get('title', ''), 
            article.get('description', ''), 
            likes, 
            ignores
        )
        
        article['ai_score'] = res.get('score', 0)
        article['ai_tags'] = res.get('tags', 'unknown')
        processed.append(article)
        
        print(f"   Score: {res.get('score', 0)}, Tags: {res.get('tags', 'N/A')}")
        
        # Rate limit: 15 RPM free tier = 4s between calls
        if i < len(articles) - 1:
            print("⏳ Rate limit sleep...")
            time.sleep(4)

    # Sort by score (highest first)
    processed.sort(key=lambda x: x.get('ai_score', 0), reverse=True)
    
    data['articles'] = processed
    
    # Save processed results
    with open('news.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)
    
    print(f"\n✅ Complete! Top article score: {processed[0].get('ai_score', 0) if processed else 0}")
    print("📁 Saved to 'news.json'")

if __name__ == "__main__":
    main()
