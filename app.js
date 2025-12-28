// CONFIGURATION
const NEWS_API_KEY = 'YOUR_API_KEY_HERE'; // Add your NewsAPI key here
let allArticles = [];
let currentIndex = 0;
const ARTICLES_PER_PAGE = 20;

async function init() {
    const status = document.getElementById('loading-status');
    const urlParams = new URLSearchParams(window.location.search);
    const isSyncing = urlParams.get('sync') === 'true';

    const USER_INTERESTS = JSON.parse(localStorage.getItem('ryan_interest')) || [];
    const USER_IGNORED = JSON.parse(localStorage.getItem('ryan_ignore')) || [];

    try {
        if (isSyncing && USER_INTERESTS.length > 0) {
            // REACTIVE MODE: Dynamic fetch from NewsAPI
            status.innerText = "🚀 AI is scanning the live web for your interests...";
            const query = USER_INTERESTS.join(' OR ');
            const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&pageSize=100&apiKey=${NEWS_API_KEY}`;
            
            const response = await fetch(url);
            const data = await response.json();
            allArticles = data.articles || [];
        } else {
            // DEFAULT MODE: Load the AI-processed news.json
            status.innerText = "🤖 Loading AI-Categorized feed...";
            const response = await fetch('./news.json');
            const data = await response.json();
            allArticles = data.articles || [];
        }

        // AGGRESSIVE FILTERING
        allArticles = allArticles.filter(article => {
            const aiTags = (article.ai_tags || "").toLowerCase();
            const source = (article.source.name || "").toLowerCase();
            const content = `${article.title} ${article.description} ${source} ${aiTags}`.toLowerCase();

            // If any of your ignore keywords are in the text OR the AI's hidden tags
            const isBlocked = USER_IGNORED.some(word => content.includes(word.toLowerCase().trim()));
            return !isBlocked;
        });

        status.innerText = `AI ready. Found ${allArticles.length} matching stories.`;
        renderNextBatch(true);

    } catch (err) {
        status.innerText = "Sync failed. Check API keys and GitHub Actions.";
        console.error(err);
    }
}

function renderNextBatch(clear = false) {
    const container = document.getElementById('news-container');
    if (clear) {
        container.innerHTML = '';
        currentIndex = 0;
    }

    const batch = allArticles.slice(currentIndex, currentIndex + ARTICLES_PER_PAGE);
    
    batch.forEach(article => {
        const card = document.createElement('div');
        card.className = 'challenge-card';
        card.innerHTML = `
            <img src="${article.urlToImage || 'https://via.placeholder.com/400x200?text=News'}" class="img-card">
            <div style="padding: 1.5rem;">
                <h3 style="font-size:1.1rem; margin-bottom:10px;">${article.title}</h3>
                <p style="font-size:0.85rem; color:#666; line-height:1.4;">${article.description || ''}</p>
                <div style="margin-top:10px;">
                    <a href="${article.url}" target="_blank" class="nav-link" style="font-size:0.7rem; font-weight:bold;">READ STORY</a>
                </div>
            </div>
        `;
        container.appendChild(card);
    });

    currentIndex += ARTICLES_PER_PAGE;
    manageLoadMore();
}

function manageLoadMore() {
    let btn = document.getElementById('load-more-btn');
    if (!btn && allArticles.length > ARTICLES_PER_PAGE) {
        btn = document.createElement('button');
        btn.id = 'load-more-btn';
        btn.innerText = "LOAD MORE";
        btn.className = "nav-link";
        btn.style = "display:block; margin: 40px auto; padding: 12px 40px; border-radius:30px; background:#000; color:#fff; border:none; cursor:pointer;";
        btn.onclick = () => renderNextBatch();
        document.querySelector('.main').appendChild(btn);
    }
    if (btn) btn.style.display = (currentIndex >= allArticles.length) ? 'none' : 'block';
}

document.addEventListener('DOMContentLoaded', init);
