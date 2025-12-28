let allFilteredArticles = [];
let currentIndex = 0;
const ARTICLES_PER_PAGE = 20;

// Semantic Map (The "Fake AI" brain)
const RELATED_TERMS = {
    "republican": ["trump", "gop", "desantis", "conservative"],
    "democrat": ["biden", "harris", "liberal", "donkey"],
    "tech": ["apple", "google", "microsoft", "silicon valley"]
};

async function loadRyanNews() {
    try {
        const response = await fetch('./news.json');
        const data = await response.json();
        
        const USER_INTERESTS = JSON.parse(localStorage.getItem('ryan_interest')) || [];
        const USER_IGNORED = JSON.parse(localStorage.getItem('ryan_ignore')) || [];

        // 1. Enhanced Filter Logic
        allFilteredArticles = data.articles.filter(article => {
            const content = `${article.title} ${article.description} ${article.source.name}`.toLowerCase();

            // Check Ignored + Related Terms
            for (let word of USER_IGNORED) {
                if (content.includes(word.toLowerCase())) return false;
                
                // If the ignored word has related terms, block those too
                if (RELATED_TERMS[word.toLowerCase()]) {
                    const related = RELATED_TERMS[word.toLowerCase()];
                    if (related.some(r => content.includes(r))) return false;
                }
            }

            if (USER_INTERESTS.length === 0) return true;
            return USER_INTERESTS.some(word => content.includes(word.toLowerCase()));
        });

        // 2. Initial Render
        currentIndex = 0;
        renderNextBatch(true); // true = clear container
        
    } catch (err) {
        console.error("Fetch error:", err);
    }
}

function renderNextBatch(clear = false) {
    const container = document.getElementById('news-container');
    if (clear) container.innerHTML = '';

    const nextBatch = allFilteredArticles.slice(currentIndex, currentIndex + ARTICLES_PER_PAGE);
    
    nextBatch.forEach(article => {
        const card = document.createElement('div');
        card.className = 'challenge-card';
        card.innerHTML = `
            <img src="${article.urlToImage || 'https://via.placeholder.com/400x250'}" class="img-card">
            <div style="padding: 1.5rem;">
                <h3 style="font-size: 1.1rem;">${article.title}</h3>
                <p style="font-size: 0.85rem; color: #666;">${article.description || ''}</p>
                <a href="${article.url}" target="_blank" class="nav-link" style="display:inline-block; margin-top:10px; font-size:0.75rem;">READ MORE</a>
            </div>
        `;
        container.appendChild(card);
    });

    currentIndex += ARTICLES_PER_PAGE;

    // Manage "Load More" Button
    updateLoadMoreButton();
}

function updateLoadMoreButton() {
    let btn = document.getElementById('load-more-btn');
    
    // Create button if it doesn't exist
    if (!btn) {
        btn = document.createElement('button');
        btn.id = 'load-more-btn';
        btn.className = 'nav-link';
        btn.style = 'display: block; margin: 2rem auto; border: none; cursor: pointer; background: #333; color: white;';
        btn.innerText = 'LOAD MORE';
        btn.onclick = () => renderNextBatch();
        document.querySelector('.main').appendChild(btn);
    }

    // Hide button if no more articles
    btn.style.display = (currentIndex >= allFilteredArticles.length) ? 'none' : 'block';
}

document.addEventListener('DOMContentLoaded', loadRyanNews);
