// 1. Setup your lists
const INTERESTED_KEYWORDS = ["technology", "coding", "ai", "space"]; 
const IGNORED_KEYWORDS = ["sports", "gossip", "politics"];

async function loadRyanNews() {
    try {
        const response = await fetch('./news.json');
        const data = await response.json();
        const container = document.getElementById('news-container');
        
        // READ FROM LOCAL STORAGE (The "Cache")
        // If the user hasn't added anything yet, it defaults to an empty list []
        const USER_IGNORED = JSON.parse(localStorage.getItem('ryan_ignore_list')) || [];
        const USER_INTERESTS = JSON.parse(localStorage.getItem('ryan_interest_list')) || [];

        const filtered = data.articles.filter(article => {
            const content = (article.title + " " + article.description + " " + article.source.name).toLowerCase();
            
            // 1. Check for Ignored Keywords or News Sites
            const isBlocked = USER_IGNORED.some(word => content.includes(word.toLowerCase()));
            if (isBlocked) return false;

            // 2. If user has NO interests set, show everything (clean slate)
            if (USER_INTERESTS.length === 0) return true;

            // 3. Otherwise, check for interests
            return USER_INTERESTS.some(word => content.includes(word.toLowerCase()));
        });
        // 3. Clear placeholders and Render
        container.innerHTML = ''; 

        filtered.forEach(article => {
            const card = document.createElement('div');
            card.className = 'challenge-card';
            
            card.innerHTML = `
                <img src="${article.urlToImage || 'https://via.placeholder.com/400x250'}" 
     alt="news" 
     class="img-card">
<h3>${article.title}</h3>
                <p>${article.description || 'No description provided.'}</p>
                
                <div style="padding: 0 1.5rem 1.5rem; display: flex; justify-content: space-between; align-items: center;">
                    <a href="${article.url}" target="_blank" class="nav-link" style="font-size: 0.8rem;">READ MORE</a>
                    <button onclick="ignoreArticle('${article.url}')" 
                            style="background:none; border:none; color:#ff4d4d; cursor:pointer; font-weight:bold;">
                            ✕ IGNORE
                    </button>
                </div>
            `;
            container.appendChild(card);
        });

    } catch (error) {
        console.error("News feed not ready yet. Ensure news.json exists in your repo.", error);
    }
}

// 4. Persistence Function
function ignoreArticle(url) {
    const hidden = JSON.parse(localStorage.getItem('ryan_ignored_urls')) || [];
    hidden.push(url);
    localStorage.setItem('ryan_ignored_urls', JSON.stringify(hidden));
    
    // Refresh the feed immediately to hide the card
    loadRyanNews();
}

// Initialize
document.addEventListener('DOMContentLoaded', loadRyanNews);
