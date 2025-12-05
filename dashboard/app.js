```
// Basic interaction or data loading can go here.
// For now, the artifact is static based on the analysis results found in the previous step.

console.log("Aztec Intelligence Dashboard Loaded");

async function loadData() {
    try {
        const response = await fetch('./data.json');
        const data = await response.json();

        // Format Date
        const dateStr = new Date(data.lastUpdated).toUTCString();

        // Update Header Timestamp
        const headerTs = document.getElementById('timestamp');
        if (headerTs) headerTs.textContent = dateStr;

        // Update Stats
        document.getElementById('val-total').textContent = data.stats.totalEth;
        document.getElementById('val-market').textContent = data.stats.marketEth;
        document.getElementById('val-limit').textContent = data.stats.limitEth;

        // Update Note
        const note = document.querySelector('.stat-note');
        if (note) note.textContent = `Scanned 200k Blocks.Refreshed: ${ dateStr } `;

        // Update Chart
        document.querySelector('.bar-group:nth-child(1) .bar-value').textContent = `${ data.stats.marketShare }% `;
        document.querySelector('.bar-group:nth-child(1) .bar').style.height = `${ data.stats.marketShare }% `;
        
        document.querySelector('.bar-group:nth-child(2) .bar-value').textContent = `${ data.stats.limitShare }% `;
        document.querySelector('.bar-group:nth-child(2) .bar').style.height = `${ data.stats.limitShare }% `;

        document.querySelector('.viz-container div[style*="font-size: 4rem"]').textContent = `${ data.stats.marketShare }% `;

        // Update Feed
        const feedList = document.getElementById('feed-list');
        feedList.innerHTML = '';
        data.recentBids.forEach(bid => {
            const li = document.createElement('li');
            li.className = 'feed-item';
            
            const tagClass = bid.category === 'Market' ? 'market-tag' : 'limit-tag';
            
            li.innerHTML = `
    < span class="feed-time" > ID: ...${ bid.id.slice(-6) }</span >
                <span class="feed-amount">${bid.amount} ETH</span>
                <span class="feed-type ${tagClass}">${bid.category.toUpperCase()}</span>
`;
            feedList.appendChild(li);
        });

    } catch (e) {
        console.error("Failed to load dashboard data", e);
    }
}

loadData();

// Modal Logic
const modal = document.getElementById('methodology-modal');
const overlay = document.getElementById('modal-overlay');
const openBtn = document.getElementById('open-methodology');
const closeBtn = document.getElementById('close-modal');

openBtn.addEventListener('click', (e) => {
    e.preventDefault();
    modal.style.display = 'block';
    overlay.style.display = 'block';
});

function closeModal() {
    modal.style.display = 'none';
    overlay.style.display = 'none';
}

closeBtn.addEventListener('click', closeModal);
overlay.addEventListener('click', closeModal);

