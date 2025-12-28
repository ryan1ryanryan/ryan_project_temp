async function init() {
    const container = document.getElementById('news-container');
    const status = document.getElementById('loading-status');

    try {
        // 1. Fetch the pre-sorted news.json from your GitHub
        const response = await fetch('./news.json');
        const data = await response.json();
        
        // 2. Take the first 50 (Python already sorted these by score)
        const top50 = data.articles.slice(0, 50);

        status.innerText = `Displaying the 50 most relevant stories for you.`;
        
        container.innerHTML = '';
        top50.forEach(article => {
            // We ignore anything the AI scored as a 0 (Total Block)
            if (article.ai_score === 0) return;

            const card = document.createElement('div');
            card.className = 'challenge-card';
            card.innerHTML = `
                <img src="${article.urlToImage || 'https://via.placeholder.com/400x220?text=News'}" class="img-card" loading="lazy">
                <div style="padding: 1.5rem;">
                    <div class="ai-score-badge">AI RELEVANCY: ${article.ai_score}/10</div>
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
        status.innerText = "Error loading your AI feed.";
        console.error(err);
    }
}

document.addEventListener('DOMContentLoaded', init);
