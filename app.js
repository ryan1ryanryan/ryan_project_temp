const NEWS_API_KEY = '88FuFm0CtPLLB6oeFMZnuD0uPKQ80tEZvlRwT8NU018'; 

async function init() {
    const container = document.getElementById('news-container');
    const status = document.getElementById('loading-status');
    const urlParams = new URLSearchParams(window.location.search);
    const isSyncing = urlParams.get('sync') === 'true';
    
    // Retrieve Interests and Ignores
    const USER_INTERESTS = JSON.parse(localStorage.getItem('ryan_interest')) || [];
    const USER_IGNORED = JSON.parse(localStorage.getItem('ryan_ignore')) || [];

    try {
        let articles = [];
        
        if (isSyncing && USER_INTERESTS.length > 0) {
            status.innerText = `Syncing live news for ${USER_INTERESTS.length} interests...`;
            const query = USER_INTERESTS.join(' OR ');
            const liveUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&pageSize=100&apiKey=${NEWS_API_KEY}`;
            const response = await fetch(liveUrl);
            const data = await response.json();
            articles = data.articles || [];
            
            // Fallback to backlog if no live results found
            if (articles.length === 0) {
                const backResponse = await fetch('./news.json');
                const backData = await backResponse.json();
                articles = backData.articles || [];
            }
        } else {
            status.innerText = "Loading feed...";
            const response = await fetch('./news.json');
            const data = await response.json();
            articles = data.articles || [];
        }

        const filtered = articles.filter(article => {
            const content = `${article.title} ${article.description} ${article.source?.name}`.toLowerCase();
            return !USER_IGNORED.some(w => content.includes(w.toLowerCase()));
        });

        container.innerHTML = '';
        
        filtered.slice(0, 50).forEach(article => {
            const card = document.createElement('div');
            card.className = 'challenge-card';
            
            // Logic to hide the Relevancy badge if no interests exist
            const hasInterests = USER_INTERESTS.length > 0;
            const scoreBadge = hasInterests 
                ? `<div style="background:#f5f3ff; color:#7c3aed; padding:4px 10px; border-radius:12px; font-size:0.7rem; font-weight:bold; display:inline-block; margin-bottom:10px; border:1px solid #ddd6fe;">AI RANK: ${article.ai_score || 5}/10</div>`
                : '';

            card.innerHTML = `
                <img src="${article.urlToImage || 'https://via.placeholder.com/400x220'}" class="img-card">
                <div style="padding:1.5rem;">
                    ${scoreBadge}
                    <h3 style="font-size:1.1rem; line-height:1.3; margin-bottom:10px;">${article.title}</h3>
                    <p style="font-size:0.9rem; color:#4b5563; line-height:1.5;">${article.description || ''}</p>
                    <a href="${article.url}" target="_blank" style="color:#7c3aed; font-weight:bold; text-decoration:none; display:inline-block; margin-top:15px;">READ FULL STORY →</a>
                </div>
            `;
            container.appendChild(card);
        });
        
        status.innerText = filtered.length > 0 ? "Feed updated." : "No stories found.";
        
    } catch (err) { 
        status.innerText = "Error loading feed."; 
    }
}
document.addEventListener('DOMContentLoaded', init);
