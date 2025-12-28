async function init() {
    const container = document.getElementById('news-container');
    const status = document.getElementById('loading-status');

    try {
        const response = await fetch('./news.json');
        const data = await response.json();
        
        // Always take the top 50 (already sorted by AI in Python)
        const top50 = data.articles.slice(0, 50);

        status.innerText = `Top 50 most relevant stories loaded.`;
        
        container.innerHTML = '';
        top50.forEach(article => {
            if (article.ai_score === 0) return; // Hard-ignore 0 scores

            const card = document.createElement('div');
            card.className = 'challenge-card';
            card.innerHTML = `
                <img src="${article.urlToImage || 'https://via.placeholder.com/400x200'}" class="img-card">
                <div style="padding: 1.5rem;">
                    <div style="color: #007bff; font-weight: bold; font-size: 0.7rem;">Match Score: ${article.ai_score}/10</div>
                    <h3 style="font-size:1.1rem; margin: 10px 0;">${article.title}</h3>
                    <p style="font-size:0.85rem; color:#666;">${article.description || ''}</p>
                    <a href="${article.url}" target="_blank" class="nav-link" style="display:inline-block; margin-top:15px; font-size:0.75rem;">READ STORY</a>
                </div>
            `;
            container.appendChild(card);
        });

    } catch (err) {
        console.error("Sync error:", err);
    }
}

document.addEventListener('DOMContentLoaded', init);
