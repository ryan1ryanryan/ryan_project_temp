const NEWS_API_KEY = '88FuFm0CtPLLB6oeFMZnuD0uPKQ80tEZvlRwT8NU018'; 

async function init() {
    const container = document.getElementById('news-container');
    const status = document.getElementById('loading-status');
    
    const USER_INTERESTS = (JSON.parse(localStorage.getItem('ryan_interest')) || [])
        .map(w => w.trim().toLowerCase())
        .filter(w => w.length > 0);

    const USER_IGNORED = (JSON.parse(localStorage.getItem('ryan_ignore')) || [])
        .map(w => w.trim().toLowerCase())
        .filter(w => w.length > 0);

    try {
        status.innerText = "Simmering the sauce...";
        const response = await fetch('./news.json');
        const data = await response.json();
        let articles = data.articles || [];

        // 1. FILTER: Block stories based on Title, Desc, or Source Name
        let workingList = articles.filter(article => {
            const sourceName = article.source?.name || "";
            const textToSearch = `${article.title} ${article.description} ${sourceName}`.toLowerCase();
            const isIgnored = USER_IGNORED.some(word => textToSearch.includes(word));
            return !isIgnored; 
        });

        // 2. SORT: Prioritize interests to the top
        workingList.sort((a, b) => {
            const aSource = a.source?.name || "";
            const bSource = b.source?.name || "";
            const aText = `${a.title} ${a.description} ${aSource}`.toLowerCase();
            const bText = `${b.title} ${b.description} ${bSource}`.toLowerCase();
            
            const aMatch = USER_INTERESTS.some(word => aText.includes(word));
            const bMatch = USER_INTERESTS.some(word => bText.includes(word));
            
            if (aMatch && !bMatch) return -1;
            if (!aMatch && bMatch) return 1;
            return (b.ai_score || 0) - (a.ai_score || 0);
        });

        container.innerHTML = '';

        workingList.slice(0, 50).forEach(article => {
            const card = document.createElement('div');
            card.className = 'challenge-card';
            
            const sourceName = article.source?.name || "";
            const textToSearch = `${article.title} ${article.description} ${sourceName}`.toLowerCase();
            const isMatch = USER_INTERESTS.some(word => textToSearch.includes(word));
            
            // Logic: ONLY show badge if it's a Keyword Match. 
            // Generic AI scores (like 5/10) are now hidden.
            let badgeHtml = '';
            if (isMatch) {
                badgeHtml = `<div style="background:#dcfce7; color:#166534; padding:4px 12px; border-radius:20px; font-size:0.75rem; font-weight:800; display:inline-block; margin-bottom:10px; border:1px solid #bbf7d0;">⭐ MATCH</div>`;
            }

            card.innerHTML = `
                <img src="${article.urlToImage || 'https://via.placeholder.com/400x220'}" class="img-card" onerror="this.src='https://via.placeholder.com/400x220'">
                <div style="padding:1.5rem;">
                    ${badgeHtml}
                    <h3 style="font-size:1.1rem; margin-bottom:10px; line-height:1.3; font-weight:bold; color: #1e293b;">${article.title}</h3>
                    <p style="font-size:0.9rem; color:#475569; line-height:1.5;">${article.description || ''}</p>
                    <a href="${article.url}" target="_blank" style="color:#2b67ff; font-weight:bold; text-decoration:none; display:inline-block; margin-top:15px; border-bottom: 2px solid #e0e7ff;">READ FULL STORY →</a>
                </div>
            `;
            container.appendChild(card);
        });
        
        status.innerText = ``;
        
    } catch (err) { 
        status.innerText = "Ready."; 
    }
}
document.addEventListener('DOMContentLoaded', init);
