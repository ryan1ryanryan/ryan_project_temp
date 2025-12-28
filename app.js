async function init() {
    const container = document.getElementById('news-container');
    const status = document.getElementById('loading-status');
    
    // 1. Get User Data
    const USER_INTERESTS = JSON.parse(localStorage.getItem('ryan_interest')) || [];
    const USER_IGNORED = JSON.parse(localStorage.getItem('ryan_ignore')) || [];
    
    // 2. Check if we are "Syncing" (Live) or "Browsing" (Backlog)
    const urlParams = new URLSearchParams(window.location.search);
    const isSyncing = urlParams.get('sync') === 'true';

    try {
        let articles = [];

        if (isSyncing && USER_INTERESTS.length > 0) {
            // --- LIVE SYNC MODE ---
            status.innerText = "🚀 AI is scanning the live web for your interests...";
            const query = USER_INTERESTS
                .map(word => word.includes(' ') ? `"${word}"` : word)
                .join(' OR ');
            
            const liveUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=relevancy&language=en&pageSize=100&apiKey=${NEWS_API_KEY}`;
            
            const response = await fetch(liveUrl);
            const data = await response.json();
            articles = data.articles || [];
        } else {
            // --- BACKLOG MODE (Default) ---
            status.innerText = "🤖 Loading your AI-curated backlog...";
            const response = await fetch('./news.json');
            const data = await response.json();
            articles = data.articles || [];
        }

        // 3. Apply the Smart Filter (Ignore logic)
        // This ensures that even in Live Sync, your "Ignores" still work
        const filteredArticles = articles.filter(article => {
            const content = `${article.title} ${article.description} ${article.source.name}`.toLowerCase();
            const isBlocked = USER_IGNORED.some(word => content.includes(word.toLowerCase().trim()));
            
            // If it's a backlog article, also check the AI score
            const isAiBlocked = article.ai_score === 0; 
            
            return !isBlocked && !isAiBlocked;
        });

        // 4. Take the top 50
        const top50 = filteredArticles.slice(0, 50);

        // 5. Render to UI
        status.innerText = isSyncing ? `Found ${top50.length} live matches.` : `Top 50 stories from your backlog.`;
        container.innerHTML = '';
        
        top50.forEach(article => {
            const card = document.createElement('div');
            card.className = 'challenge-card';
            // Use 10/10 for live sync results, otherwise use the AI score
            const scoreLabel = article.ai_score ? `AI RELEVANCY: ${article.ai_score}/10` : `LIVE MATCH`;
            
            card.innerHTML = `
                <img src="${article.urlToImage || 'https://via.placeholder.com/400x220?text=News'}" class="img-card" loading="lazy">
                <div style="padding: 1.5rem;">
                    <div class="ai-score-badge">${scoreLabel}</div>
                    <h3 style="font-size:1.15rem; margin-bottom:12px; line-height:1.3;">${article.title}</h3>
                    <p style="font-size:0.85rem; color:#555; margin-bottom:15px;">${article.description || ''}</p>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:0.7rem; color:#999;">${article.source.name}</span>
                        <a href="${article.url}" target="_blank" class="nav-link" style="font-size:0.7rem; font-weight:bold;">READ FULL →</a>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

    } catch (err) {
        status.innerText = "Error syncing with the AI.";
        console.error(err);
    }
}

document.addEventListener('DOMContentLoaded', init);
