async function init() {
    const container = document.getElementById('news-container');
    const status = document.getElementById('loading-status');
    
    // 1. Check if the user clicked "Sync"
    const urlParams = new URLSearchParams(window.location.search);
    const isSyncing = urlParams.get('sync') === 'true';

    // 2. Get Interests and Ignores from Storage
    const USER_INTERESTS = JSON.parse(localStorage.getItem('ryan_interest')) || [];
    const USER_IGNORED = JSON.parse(localStorage.getItem('ryan_ignore')) || [];

    try {
        let articles = [];

        if (isSyncing && USER_INTERESTS.length > 0) {
            // --- LIVE MODE ---
            status.innerText = "🚀 Fetching live results for your interests...";
            const query = USER_INTERESTS
                .map(word => word.includes(' ') ? `"${word}"` : word)
                .join(' OR ');
            
            // Note: Added sortBy=relevancy to find the best 'Gaming' matches first
            const liveUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=relevancy&language=en&pageSize=100&apiKey=${NEWS_API_KEY}`;
            
            const response = await fetch(liveUrl);
            const data = await response.json();
            articles = data.articles || [];
        } else {
            // --- BACKLOG MODE ---
            status.innerText = "🤖 Loading AI-sorted backlog...";
            const response = await fetch('./news.json');
            const data = await response.json();
            articles = data.articles || [];
        }

        // 3. Filter and Render
        container.innerHTML = '';
        
        // Take the top 50 that aren't ignored
        const displayList = articles.filter(article => {
            const content = `${article.title} ${article.description} ${article.source.name}`.toLowerCase();
            const isBlocked = USER_IGNORED.some(word => content.includes(word.toLowerCase().trim()));
            
            // Only hide if the AI explicitly gave it a 0. 
            // If the score is missing (live news), we show it anyway.
            return !isBlocked && article.ai_score !== 0; 
        }).slice(0, 50);

        displayList.forEach(article => {
            const card = document.createElement('div');
            card.className = 'challenge-card';
            
            // Handle missing scores for live news
            const scoreDisplay = article.ai_score !== undefined ? `AI RELEVANCY: ${article.ai_score}/10` : "LIVE MATCH";

            card.innerHTML = `
                <img src="${article.urlToImage || 'https://via.placeholder.com/400x220'}" class="img-card">
                <div style="padding: 1.5rem;">
                    <div class="ai-score-badge">${scoreDisplay}</div>
                    <h3>${article.title}</h3>
                    <p>${article.description || ''}</p>
                    <a href="${article.url}" target="_blank" class="nav-link">READ MORE</a>
                </div>
            `;
            container.appendChild(card);
        });

    } catch (err) {
        status.innerText = "Sync failed. Check your NewsAPI key.";
        console.error(err);
    }
}
