async function loadRyanNews() {
    const container = document.getElementById('news-container');
    const statsBar = document.getElementById('stats-bar');

    try {
        const response = await fetch('./news.json');
        if (!response.ok) throw new Error("Database not found");
        const data = await response.json();

        // 1. Load User Training from LocalStorage
        const USER_INTERESTS = JSON.parse(localStorage.getItem('ryan_interest')) || [];
        const USER_IGNORED = JSON.parse(localStorage.getItem('ryan_ignore')) || [];
        const MANUAL_HIDDEN = JSON.parse(localStorage.getItem('ryan_manual_hidden')) || [];

        // 2. Filter Logic
        const filtered = data.articles.filter(article => {
            // Check if hidden manually
            if (MANUAL_HIDDEN.includes(article.url)) return false;

            // Combine title, description, and source for searching
            const content = `${article.title} ${article.description} ${article.source.name}`.toLowerCase();

            // Ignore Logic (Block Trump, ABC News, etc)
            if (USER_IGNORED.some(word => content.includes(word))) return false;

            // Interest Logic (Only show if matches interest)
            // If interest list is empty, we show all (except ignores)
            if (USER_INTERESTS.length === 0) return true;
            return USER_INTERESTS.some(word => content.includes(word));
        });

        // 3. Update Stats
        statsBar.innerText = `Showing ${filtered.length} articles matching your interests. Blocks: ${USER_IGNORED.length}`;

        // 4. Render Cards
        container.innerHTML = '';
        if (filtered.length === 0) {
            container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 3rem;">No news matches your filters. Try adding more interests in <a href="settings.html">Training</a>.</p>`;
            return;
        }

        filtered.forEach(article => {
            const card = document.createElement('div');
            card.className = 'challenge-card';
            card.innerHTML = `
                <img src="${article.urlToImage || 'https://via.placeholder.com/400x250?text=News'}" class="img-card" alt="news">
                <div style="padding: 1rem 1.5rem;">
                    <span style="font-size: 0.7rem; color: #999; text-transform: uppercase; letter-spacing: 1px;">${article.source.name}</span>
                    <h3 style="margin: 10px 0;">${article.title}</h3>
                    <p style="font-size: 0.9rem; color: #555;">${article.description || ''}</p>
                </div>
                <div style="padding: 0 1.5rem 1.5rem; display: flex; justify-content: space-between; align-items: center;">
                    <a href="${article.url}" target="_blank" class="nav-link" style="font-size: 0.8rem; font-weight: bold;">READ STORY</a>
                    <button onclick="manualHide('${article.url}')" style="background:none; border:none; color:#ccc; cursor:pointer; font-size: 0.7rem;">REMOVE</button>
                </div>
            `;
            container.appendChild(card);
        });

    } catch (err) {
        console.error(err);
        container.innerHTML = `<p style="grid-column: 1/-1; text-align: center;">Error loading news. Ensure GitHub Actions finished successfully.</p>`;
    }
}

function manualHide(url) {
    const hidden = JSON.parse(localStorage.getItem('ryan_manual_hidden')) || [];
    hidden.push(url);
    localStorage.setItem('ryan_manual_hidden', JSON.stringify(hidden));
    loadRyanNews();
}

document.addEventListener('DOMContentLoaded', loadRyanNews);
