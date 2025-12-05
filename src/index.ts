import { ethers } from 'ethers';
import { CCA_ABI, CCA_CONTRACT_ADDRESS, calculateFDV, q96ToEthPrice } from './utils';
import * as fs from 'fs';
import * as path from 'path';

// Use a public RPC - Flashbots
const RPC_URL = 'https://rpc.flashbots.net';

async function main() {
    console.log('Starting Aztec Auction Analysis...');

    // JSON Output for Dashboard
    const dashboardDir = path.join(__dirname, '../dashboard');
    if (!fs.existsSync(dashboardDir)) {
        fs.mkdirSync(dashboardDir);
    }

    let dashboardData: any;

    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        // const provider = ethers.getDefaultProvider('mainnet');

        const contract = new ethers.Contract(CCA_CONTRACT_ADDRESS, CCA_ABI, provider) as any;

        // 1. Fetch All BidSubmitted Events
        console.log('Fetching BidSubmitted events...');
        const currentBlock = await provider.getBlockNumber();
        console.log(`Current Block: ${currentBlock}`);

        // Cache Handling
        const cachePath = path.join(__dirname, 'events_cache.json');
        let cachedData = { lastBlock: 0, bidEvents: [] as any[], exitEvents: [] as any[] };

        if (fs.existsSync(cachePath)) {
            try {
                const rawCache = fs.readFileSync(cachePath, 'utf8');
                cachedData = JSON.parse(rawCache);
                console.log(`Loaded cached events up to block ${cachedData.lastBlock}`);
                console.log(`Cached Bids: ${cachedData.bidEvents.length}, Cached Exits: ${cachedData.exitEvents.length}`);
            } catch (e) {
                console.error("Cache corrupted, starting fresh.");
            }
        }

        // Determine start block
        // If we have cache, start from cache.lastBlock + 1
        // If not, look back 200k blocks (approx 28 days)
        let startBlock = cachedData.lastBlock > 0 ? cachedData.lastBlock + 1 : currentBlock - 200000;
        const endBlock = currentBlock;

        // If older than lookback, reset to lookback (safety) unless we trust cache fully. 
        // We trust cache.

        const CHUNK_SIZE = 2000; // Increased chunk size to reduce request count

        // We will append to these
        const bidEvents = [...cachedData.bidEvents];
        const exitEvents = [...cachedData.exitEvents];

        const bidFilter = contract.filters.BidSubmitted();
        const exitFilter = contract.filters.BidExited();

        if (startBlock > endBlock) {
            console.log("Cache is up to date.");
        } else {
            console.log(`Querying events from ${startBlock} to ${endBlock} in chunks of ${CHUNK_SIZE}...`);

            for (let from = startBlock; from <= endBlock; from += CHUNK_SIZE) {
                const to = Math.min(from + CHUNK_SIZE - 1, endBlock);
                if (from % (CHUNK_SIZE * 5) === 0) process.stdout.write('.');

                try {
                    // Fetch Bids
                    const bids = await contract.queryFilter(bidFilter, from, to);
                    // Simplify events for storage (remove circular refs etc if needed, but ethers objects usually fine if serialized carefully)
                    // We map them to plain objects to be safe for JSON
                    const plainBids = bids.map((e: any) => ({
                        args: e.args,
                        blockNumber: e.blockNumber,
                        transactionHash: e.transactionHash,
                        logIndex: e.logIndex
                    }));
                    bidEvents.push(...plainBids);

                    // Fetch Exits
                    const exits = await contract.queryFilter(exitFilter, from, to);
                    const plainExits = exits.map((e: any) => ({
                        args: e.args,
                        blockNumber: e.blockNumber,
                        transactionHash: e.transactionHash,
                        logIndex: e.logIndex
                    }));
                    exitEvents.push(...plainExits);

                    // Small delay to be nice to RPC
                    await new Promise(r => setTimeout(r, 200));

                    // Progressive Cache Save (every chunk or so? maybe every 10 chunks)
                    // Helper for BigInt serialization
                    const replacer = (key: string, value: any) =>
                        typeof value === 'bigint' ? value.toString() : value;

                    fs.writeFileSync(cachePath, JSON.stringify({
                        lastBlock: to,
                        bidEvents: bidEvents,
                        exitEvents: exitEvents
                    }, replacer, 2));

                } catch (e) {
                    console.error(`\nFailed chunk ${from}-${to}. Stopping here to preserve cache.`);
                    console.error(e);
                    break; // Stop fetching, but proceed with analysis of what we have!
                }
            }
        }
        console.log('\nDone fetching.');

        console.log(`Total Bid Events: ${bidEvents.length}`);
        console.log(`Total Exit Events: ${exitEvents.length}`);

        // Map exits by bidId
        const refundsDetails = new Map<string, bigint>();
        for (const event of exitEvents) {
            if ('args' in event) {
                const bidId = event.args[0].toString();
                const currencyRefunded = BigInt(event.args[3]);
                const currentRefund = refundsDetails.get(bidId) || BigInt(0);
                refundsDetails.set(bidId, currentRefund + currencyRefunded);
            }
        }

        // 3. Process Bids
        interface ProcessedBid {
            id: string;
            amountWei: bigint;
            netAmountWei: bigint;
            fdvEth: number;
            category: 'Market' | 'Limit' | 'Floor-ish';
        }

        const processedBids: ProcessedBid[] = [];

        // Thresholds (in ETH FDV)
        const bids: any[] = [];

        for (const event of bidEvents) {
            if ('args' in event) {
                const id = event.args[0].toString();
                const owner = event.args[1];
                const priceQ96 = BigInt(event.args[2]);
                const amountWei = BigInt(event.args[3]);

                const refunded = refundsDetails.get(id) || BigInt(0);
                const net = amountWei - refunded;

                if (net <= BigInt(0)) continue;

                bids.push({ id, owner, priceQ96, net, amountWei, refunded });
            }
        }

        const dataPoints = bids.map(b => {
            const fdv = calculateFDV(b.priceQ96);
            return { ...b, fdv };
        });

        dataPoints.sort((a, b) => a.fdv - b.fdv);

        const MARKET_THRESHOLD_ETH_FDV = 10_000_000;

        let marketSum = BigInt(0);
        let limitSum = BigInt(0);

        for (const b of dataPoints) {
            let category: 'Market' | 'Limit' | 'Floor-ish';

            if (b.fdv > MARKET_THRESHOLD_ETH_FDV) {
                category = 'Market';
                marketSum += b.net;
            } else {
                category = 'Limit';
                limitSum += b.net;
            }

            processedBids.push({
                id: b.id,
                amountWei: b.amountWei,
                netAmountWei: b.net,
                fdvEth: b.fdv,
                category
            });
        }

        console.log('--- Analysis Results ---');
        console.log(`Total Bids Processed: ${processedBids.length}`);

        const netTotal = marketSum + limitSum;
        console.log(`Total Active ETH Committed: ${ethers.formatEther(netTotal)} ETH`);
        console.log(`Market Bids (> ${MARKET_THRESHOLD_ETH_FDV.toLocaleString()} ETH FDV): ${ethers.formatEther(marketSum)} ETH`);
        console.log(`Limit Bids: ${ethers.formatEther(limitSum)} ETH`);

        const totalEth = parseFloat(ethers.formatEther(netTotal));
        const marketEth = parseFloat(ethers.formatEther(marketSum));
        const limitEth = parseFloat(ethers.formatEther(limitSum));
        const marketShare = (marketEth / totalEth) * 100;
        const limitShare = (limitEth / totalEth) * 100;

        const recentBids = processedBids.slice().reverse().slice(0, 10).map(b => ({
            amount: parseFloat(ethers.formatEther(b.netAmountWei)).toFixed(2),
            category: b.category,
            id: b.id
        }));

        dashboardData = {
            lastUpdated: new Date().toISOString(),
            stats: {
                totalEth: totalEth.toLocaleString('en-US', { maximumFractionDigits: 0 }),
                marketEth: marketEth.toLocaleString('en-US', { maximumFractionDigits: 0 }),
                limitEth: limitEth.toLocaleString('en-US', { maximumFractionDigits: 0 }),
                marketShare: marketShare.toFixed(1),
                limitShare: limitShare.toFixed(1)
            },
            recentBids: recentBids
        };

    } catch (error) {
        console.error("RPC Fetch Failed or Analysis Error:", error);
        console.log("Attempting to use existing data.json for HTML regeneration...");

        const dataPath = path.join(dashboardDir, 'data.json');
        if (fs.existsSync(dataPath)) {
            dashboardData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            console.log("Loaded existing data.json.");
        } else {
            console.error("No existing data.json found. Cannot build dashboard.");
            process.exit(1);
        }
    }

    if (!dashboardData) {
        console.error("No dashboard data available.");
        return;
    }

    // Inject into HTML for Static Hosting
    const htmlPath = path.join(dashboardDir, 'index.html');
    let htmlContent = fs.readFileSync(htmlPath, 'utf8');

    htmlContent = htmlContent.replace(/id="val-total"[^>]*>.*?<\/div>/, `id="val-total">${dashboardData.stats.totalEth}</div>`);
    htmlContent = htmlContent.replace(/id="val-market"[^>]*>.*?<\/div>/, `id="val-market" style="color: var(--color-orchid);">${dashboardData.stats.marketEth}</div>`);
    htmlContent = htmlContent.replace(/id="val-limit"[^>]*>.*?<\/div>/, `id="val-limit">${dashboardData.stats.limitEth}</div>`);

    // Use the lastUpdated from data, but format nicely
    const dateStr = new Date(dashboardData.lastUpdated).toUTCString();
    htmlContent = htmlContent.replace(/id="timestamp">.*?<\/span>/, `id="timestamp">${dateStr}</span>`);

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
    console.log(`Static HTML injected into dashboard/index.html with data from ${dashboardData.lastUpdated}`);

    // Always update data.json if we can, to keep it fresh for next fallback
    fs.writeFileSync(path.join(dashboardDir, 'data.json'), JSON.stringify(dashboardData, null, 2));
    console.log(`Dashboard data written to dashboard/data.json`);
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
