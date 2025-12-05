import * as fs from 'fs';
import * as path from 'path';

async function main() {
    console.log('Building Static Dashboard from existing data...');

    const dashboardDir = path.join(__dirname, '../dashboard');
    const dataPath = path.join(dashboardDir, 'data.json');

    if (!fs.existsSync(dataPath)) {
        console.error("No data.json found!");
        process.exit(1);
    }

    const dashboardData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log(`Loaded data (Last Updated: ${dashboardData.lastUpdated})`);

    // Inject into HTML for Static Hosting
    const htmlPath = path.join(dashboardDir, 'index.html');
    let htmlContent = fs.readFileSync(htmlPath, 'utf8');

    // Stats
    htmlContent = htmlContent.replace(/id="val-total"[^>]*>.*?<\/div>/, `id="val-total">${dashboardData.stats.totalEth}</div>`);
    htmlContent = htmlContent.replace(/id="val-market"[^>]*>.*?<\/div>/, `id="val-market" style="color: var(--color-orchid);">${dashboardData.stats.marketEth}</div>`);
    htmlContent = htmlContent.replace(/id="val-limit"[^>]*>.*?<\/div>/, `id="val-limit">${dashboardData.stats.limitEth}</div>`);

    // Timestamp
    const dateStr = new Date(dashboardData.lastUpdated).toUTCString();
    htmlContent = htmlContent.replace(/id="timestamp">.*?<\/span>/, `id="timestamp">${dateStr}</span>`);

    // Note
    htmlContent = htmlContent.replace(/class="stat-note"[^>]*>.*?<\/div>/s, `class="stat-note" style="margin-top: 20px; font-family: var(--font-mono); font-size: 0.8rem;">\n                    Scanned 200k Blocks. Refreshed: ${dateStr}\n                </div>`);

    // Chart
    htmlContent = htmlContent.replace(/<div class="bar-value">.*?%<\/div>\s*<div class="bar market"/, `<div class="bar-value">${dashboardData.stats.marketShare}%</div>\n                        <div class="bar market"`);
    htmlContent = htmlContent.replace(/class="bar market" style="height: .*?;"/, `class="bar market" style="height: ${dashboardData.stats.marketShare}%;"`);

    htmlContent = htmlContent.replace(/<div class="bar-value">.*?%<\/div>\s*<div class="bar limit"/, `<div class="bar-value">${dashboardData.stats.limitShare}%</div>\n                        <div class="bar limit"`);
    htmlContent = htmlContent.replace(/class="bar limit" style="height: .*?;"/, `class="bar limit" style="height: ${dashboardData.stats.limitShare}%;"`);

    htmlContent = htmlContent.replace(/<div style="font-family: var\(--font-heading-h1\); font-size: 4rem; line-height: 1;">.*?%<\/div>/, `<div style="font-family: var(--font-heading-h1); font-size: 4rem; line-height: 1;">${dashboardData.stats.marketShare}%</div>`);

    // Feed
    const feedHtml = dashboardData.recentBids.map((bid: any) => {
        const tagClass = bid.category === 'Market' ? 'market-tag' : 'limit-tag';
        return `
                <li class="feed-item">
                    <span class="feed-time">ID: ...${bid.id.slice(-6)}</span>
                    <span class="feed-amount">${bid.amount} ETH</span>
                    <span class="feed-type ${tagClass}">${bid.category.toUpperCase()}</span>
                </li>`;
    }).join('');

    htmlContent = htmlContent.replace(/id="feed-list">[\s\S]*?<\/ul>/, `id="feed-list">${feedHtml}\n            </ul>`);

    fs.writeFileSync(htmlPath, htmlContent);
    console.log(`Stats injected into dashboard/index.html`);
}

main();
