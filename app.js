const NEWS_API_KEY = '88FuFm0CtPLLB6oeFMZnuD0uPKQ80tEZvlRwT8NU018'; 

async function init() {
    const container = document.getElementById('news-container');
    const status = document.getElementById('loading-status');
    const urlParams = new URLSearchParams(window.location.search);
    const isSyncing = urlParams.get('sync') === 'true';
    const USER_INTERESTS = JSON.parse(localStorage.getItem('ryan_interest')) || [];
    const USER_IGNORED = JSON.parse(localStorage.getItem('ryan_ignore')) || [];

    try {
        let articles = [];
        if (isSyncing && USER_INTERESTS.length > 0) {
            status.innerText = "Syncing with Gemini 2.5...";
            const query = USER_INTERESTS.join(' OR ');
            const liveUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&pageSize=100&apiKey=${NEWS_API_KEY}`;
            const response = await fetch(liveUrl);
            const data = await response.json();
            articles = data.articles || [];
        } else {
            status.innerText = "Loading..";
            const response = await fetch('./news.json');
            const data = await response.json();
            articles = data.articles || [];
        }

        const filtered = articles.filter(article => {
            const content = `${article.title} ${article.description}`.toLowerCase();
            return !USER_IGNORED.some(w => content.includes(w.toLowerCase()));
        });

        container.innerHTML = '';
        filtered.slice(0, 50).forEach(article => {
            const card = document.createElement('div');
            card.className = 'challenge-card';
            const score = article.ai_score !== undefined ? article.ai_score : 5;
            
            card.innerHTML = `
                <img src="${article.urlToImage || 'https://via.placeholder.com/400x220'}" class="img-card">
                <div style="padding:1.5rem;">
                    <div class="ai-score-badge" style="background:#f5f3ff; color:#7c3aed; padding:4px 12px; border-radius:20px; font-size:0.7rem; font-weight:800; display:inline-block; margin-bottom:10px; border: 1px solid #ddd6fe;">
                        GEMINI 2.5 RELEVANCY: ${score}/10
                    </div>
                    <h3 style="font-size:1.15rem; margin-bottom:10px; line-height:1.3;">${article.title}</h3>
                    <p style="font-size:0.9rem; color:#4b5563; line-height:1.5;">${article.description || ''}</p>
                    <a href="${article.url}" target="_blank" style="display:inline-block; margin-top:20px; color:#7c3aed; text-decoration:none; font-weight:bold; border-bottom: 2px solid #ddd6fe;">VIEW FULL REPORT →</a>
                </div>
            `;
            container.appendChild(card);
        });
        status.innerText = isSyncing ? `Found ${filtered.length} stories.` : "Ready.";
    } catch (err) { status.innerText = "Error loading feed."; }
}
document.addEventListener('DOMContentLoaded', init);
