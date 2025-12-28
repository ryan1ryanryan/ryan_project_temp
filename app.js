let allFilteredArticles = [];
let currentIndex = 0;
const ARTICLES_PER_PAGE = 20;

async function loadRyanNews() {
    const container = document.getElementById('news-container');

    try {
        const response = await fetch('./news.json');
        if (!response.ok) throw new Error("news.json not found");
        const data = await response.json();

        // 1. Get user preferences from LocalStorage
        const USER_INTERESTS = JSON.parse(localStorage.getItem('ryan_interest')) || [];
        const USER_IGNORED = JSON.parse(localStorage.getItem('ryan_ignore')) || [];
        const MANUAL_HIDDEN = JSON.parse(localStorage.getItem('ryan_manual_hidden')) || [];

        // 2. Filter Logic (Using the new AI Tags)
        allFilteredArticles = data.articles.filter(article => {
            // Skip manually hidden
            if (MANUAL_HIDDEN.includes(article.url)) return false;

            // Search everything: Title, Desc, Source, AND Gemini's AI Tags
            const aiTags = (article.ai_tags || "").toLowerCase();
            const source = (article.source.name || "").toLowerCase();
            const content = `${article.title} ${article.description} ${source} ${aiTags}`.toLowerCase();

            // BLOCK LOGIC: If any ignore keyword is in the content OR AI tags
            const isBlocked = USER_IGNORED.some(word => content.includes(word.toLowerCase()));
            if (isBlocked) return false;

            // INTEREST LOGIC: If list empty, show all. If not, must match interest.
            if (USER_INTERESTS.length === 0) return true;
            return USER_INTERESTS.some(word => content.includes(word.toLowerCase()));
        });

        // 3. Initial Display
        currentIndex = 0;
        renderNextBatch(true);

    } catch (err) {
        console.error(err);
        container.innerHTML = `<p style="grid-column: 1/-1; text-align: center;">Waiting for AI Sync... Check GitHub Actions.</p>`;
    }
}

function renderNextBatch(clear = false) {
    const container = document.getElementById('news-container');
    if (clear) container.innerHTML = '';

    const nextBatch = allFilteredArticles.slice(currentIndex, currentIndex + ARTICLES_PER_PAGE);
    
    nextBatch.forEach(article => {
        const card = document.createElement('div');
        card.className = 'challenge-card';
        
        // We can display the AI Tags as a small badge for transparency
        const tags = article.ai_tags ? article.ai_tags.split(',').slice(0,3) : [];
        const tagHtml = tags.map(t => `<span style="background:#eee; padding:2px 6px; border-radius:4px; font-size:0.6rem; margin-right:4px;">${t.trim()}</span>`).join('');

        card.innerHTML = `
            <img src="${article.urlToImage || 'https://via.placeholder.com/400x250'}" class="img-card">
            <div style="padding: 1.5rem;">
                <div style="margin-bottom: 8px;">${tagHtml}</div>
                <h3 style="font-size: 1.1rem; margin-bottom: 10px;">${article.title}</h3>
                <p style="font-size: 0.85rem; color: #666; line-height: 1.4;">${article.description || ''}</p>
            </div>
            <div style="padding: 0 1.5rem 1.5rem; display: flex; justify-content: space-between; align-items: center;">
                <a href="${article.url}" target="_blank" class="nav-link" style="font-size:0.75rem; font-weight:bold;">READ MORE</a>
                <button onclick="manualHide('${article.url}')" style="background:none; border:none; color:#ccc; cursor:pointer; font-size: 0.7rem;">✕ REMOVE</button>
            </div>
        `;
        container.appendChild(card);
    });

    currentIndex += ARTICLES_PER_PAGE;
    manageLoadMoreButton();
}

function manageLoadMoreButton() {
    let btn = document.getElementById('load-more-btn');
    
    if (!btn) {
        btn = document.createElement('button');
        btn.id = 'load-more-btn';
        btn.style = "display:block; margin: 30px auto; padding: 12px 30px; border-radius: 30px; border: 1px solid #ddd; background: white; cursor: pointer; font-family: inherit; font-weight: bold;";
        btn.innerText = "LOAD MORE";
        btn.onclick = () => renderNextBatch();
        // Insert after the grid
        document.getElementById('news-container').after(btn);
    }

    // Hide if no more articles to show
    btn.style.display = (currentIndex >= allFilteredArticles.length) ? 'none' : 'block';
}

function manualHide(url) {
    const hidden = JSON.parse(localStorage.getItem('ryan_manual_hidden')) || [];
    hidden.push(url);
    localStorage.setItem('ryan_manual_hidden', JSON.stringify(hidden));
    loadRyanNews(); 
}

document.addEventListener('DOMContentLoaded', loadRyanNews);
