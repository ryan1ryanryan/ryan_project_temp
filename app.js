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
            status.innerText = "Scanning live news...";
            const query = USER_INTERESTS.map(w => w.includes(' ') ? `"${w}"` : w).join(' OR ');
            const liveUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=relevancy&language=en&pageSize=100&apiKey=${NEWS_API_KEY}`;
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
            const content = `${article.title} ${article.description} ${article.source.name}`.toLowerCase();
            const isBlocked = USER_IGNORED.some(w => content.includes(w.toLowerCase().trim()));
            return !isBlocked && article.ai_score !== 0; 
        });

        const top50 = filtered.slice(0, 50);
        status.innerText = isSyncing ? `Found ${top50.length} matching live stories.` : `carefully curated`;

        container.innerHTML = '';
        top50.forEach(article => {
            const card = document.createElement('div');
            card.className = 'challenge-card';
            const scoreLabel = article.ai_score !== undefined ? `AI RELEVANCY: ${article.ai_score}/10` : `LIVE MATCH`;
            
            card.innerHTML = `
                <img src="${article.urlToImage || 'https://via.placeholder.com/400x220'}" class="img-card">
                <div style="padding:1.5rem;">
                    <div class="ai-score-badge" style="background:#eef2ff; color:#4f46e5; padding:4px 10px; border-radius:12px; font-size:0.7rem; font-weight:bold; display:inline-block; margin-bottom:10px;">
                        ${scoreLabel}
                    </div>
                    <h3 style="font-size:1.15rem; margin-bottom:12px;">${article.title}</h3>
                    <p style="font-size:0.85rem; color:#555; margin-bottom:15px;">${article.description || ''}</p>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:0.7rem; color:#999;">${article.source.name}</span>
                        <a href="${article.url}" target="_blank" style="font-size:0.7rem; font-weight:bold; color: #4f46e5;">READ FULL →</a>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (err) { status.innerText = "Error loading feed."; }
}
document.addEventListener('DOMContentLoaded', init);
