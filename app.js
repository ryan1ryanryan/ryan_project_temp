// CONFIGURATION
const NEWS_API_KEY = 'YOUR_NEWS_API_KEY'; // Replace with your real key
let allArticles = [];
let currentIndex = 0;
const ARTICLES_PER_PAGE = 20;

async function init() {
    const container = document.getElementById('news-container');
    const status = document.getElementById('loading-status');
    
    // Check if we were sent here to "Sync"
    const urlParams = new URLSearchParams(window.location.search);
    const isSyncing = urlParams.get('sync') === 'true';

    const USER_INTERESTS = JSON.parse(localStorage.getItem('ryan_interest')) || [];
    const USER_IGNORED = JSON.parse(localStorage.getItem('ryan_ignore')) || [];

    try {
        if (isSyncing && USER_INTERESTS.length > 0) {
            status.innerText = "Connecting to Live News API...";
            // REACTIVE FETCH: Search specifically for your interests
            const query = USER_INTERESTS.join(' OR ');
            const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&pageSize=100&apiKey=${NEWS_API_KEY}`;
            
            const response = await fetch(url);
            const data = await response.json();
            allArticles = data.articles || [];
        } else {
            status.innerText = "Loading AI-Processed Feed...";
            // STATIC FALLBACK: Load the pre-processed GitHub file
            const response = await fetch('./news.json');
            const data = await response.json();
            allArticles = data.articles || [];
        }

        // Apply "Ignore" filters to the results
        allArticles = allArticles.filter(article => {
            const content = `${article.title} ${article.description} ${article.ai_tags || ''}`.toLowerCase();
            return !USER_IGNORED.some(word => content.includes(word.toLowerCase()));
        });

        status.innerText = `Found ${allArticles.length} matching stories.`;
        renderNextBatch(true);

    } catch (err) {
        status.innerText = "Error syncing news. Check your API key.";
        console.error(err);
    }
}

function renderNextBatch(clear = false) {
    const container = document.getElementById('news-container');
    if (clear) container.innerHTML = '';

    const batch = allArticles.slice(currentIndex, currentIndex + ARTICLES_PER_PAGE);
    
    batch.forEach(article => {
        const card = document.createElement('div');
        card.className = 'challenge-card';
        card.innerHTML = `
            <img src="${article.urlToImage || 'https://via.placeholder.com/400x200?text=No+Image'}" class="img-card">
            <div style="padding: 1.5rem;">
                <h3 style="margin-bottom:10px; font-size:1.1rem;">${article.title}</h3>
                <p style="font-size:0.85rem; color:#666;">${article.description || 'No description available.'}</p>
                <a href="${article.url}" target="_blank" class="nav-link" style="display:inline-block; margin-top:15px; font-size:0.7rem; font-weight:bold;">OPEN STORY</a>
            </div>
        `;
        container.appendChild(card);
    });

    currentIndex += ARTICLES_PER_PAGE;
    updateLoadMoreButton();
}

function updateLoadMoreButton() {
    let btn = document.getElementById('load-more-btn');
    if (!btn && allArticles.length > ARTICLES_PER_PAGE) {
        btn = document.createElement('button');
        btn.id = 'load-more-btn';
        btn.innerText = "LOAD MORE";
        btn.className = "nav-link"; // Using your existing style
        btn.style = "display:block; margin: 40px auto; padding: 10px 40px; border-radius:30px; cursor:pointer; background:#000; color:#fff; border:none;";
        btn.onclick = () => renderNextBatch();
        document.querySelector('.main').appendChild(btn);
    }
    if (btn) btn.style.display = (currentIndex >= allArticles.length) ? 'none' : 'block';
}

document.addEventListener('DOMContentLoaded', init);
