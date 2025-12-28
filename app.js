const NEWS_API_KEY = '88FuFm0CtPLLB6oeFMZnuD0uPKQ80tEZvlRwT8NU018'; // REQUIRED FOR LIVE SYNC

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
            status.innerText = "Loading...";
            const query = USER_INTERESTS.map(w => w.includes(' ') ? `"${w}"` : w).join(' OR ');
            const liveUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=relevancy&language=en&pageSize=100&apiKey=${NEWS_API_KEY}`;
            const response = await fetch(liveUrl);
            const data = await response.json();
            articles = data.articles || [];
        } else {
            status.innerText = "🤖 Loading AI Backlog...";
            const response = await fetch('./news.json');
            const data = await response.json();
            articles = data.articles || [];
        }

        const top50 = articles.filter(article => {
            const content = `${article.title} ${article.description} ${article.source.name}`.toLowerCase();
            const isBlocked = USER_IGNORED.some(w => content.includes(w.toLowerCase().trim()));
            return !isBlocked && article.ai_score !== 0; 
        }).slice(0, 50);

        container.innerHTML = '';
        top50.forEach(article => {
            const card = document.createElement('div');
            card.className = 'challenge-card';
            const scoreLabel = article.ai_score !== undefined ? `RELEVANCY: ${article.ai_score}/10` : `LIVE SYNC`;
            card.innerHTML = `<img src="${article.urlToImage || ''}" class="img-card"><div style="padding:1.5rem;"><div class="ai-score-badge">${scoreLabel}</div><h3>${article.title}</h3><p>${article.description || ''}</p><a href="${article.url}" target="_blank">READ MORE</a></div>`;
            container.appendChild(card);
        });
    } catch (err) { status.innerText = "Error loading feed."; }
}
document.addEventListener('DOMContentLoaded', init);
