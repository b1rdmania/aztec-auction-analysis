
import { ethers } from 'ethers';
import { CCA_ABI, CCA_CONTRACT_ADDRESS, calculateFDV, q96ToEthPrice } from './utils';
import * as fs from 'fs';
import * as path from 'path';

// Use a public RPC - Ankr usually reliable for free tier
const RPC_URL = 'https://eth.llamarpc.com';

async function main() {
    console.log('Starting Aztec Auction Analysis...');
    const provider = new ethers.JsonRpcProvider(RPC_URL);

    const contract = new ethers.Contract(CCA_CONTRACT_ADDRESS, CCA_ABI, provider) as any;

    // 1. Fetch All BidSubmitted Events
    console.log('Fetching BidSubmitted events...');
    // The contract might be new, so we can start from a recent block or 0 (0 is safer if we don't know creation block, but slower).
    // Checking create block or just using a reasonable recent block (contract likely deployed recently for this Dec sale).
    // Let's assume fetching from "earliest" is okay for this script, or we can try to find start block dynamically if it's too slow.
    // Ethers filter "fromBlock: 0" works but might be slow. 
    // Optimization: The sale started recently (Dec 2-6). 
    // Let's look back ~30,000 blocks (approx 4-5 days) to ensure we cover the start.
    // Fetch current block
    const currentBlock = await provider.getBlockNumber();
    console.log(`Current Block: ${currentBlock}`);

    // Look back ~200,000 blocks (approx 28 days) to cover contributor phase
    const startBlock = currentBlock - 200000;
    const endBlock = currentBlock;
    const CHUNK_SIZE = 500;

    const bidEvents: any[] = [];
    const exitEvents: any[] = [];

    const bidFilter = contract.filters.BidSubmitted();
    const exitFilter = contract.filters.BidExited();

    console.log(`Querying events from ${startBlock} to ${endBlock} in chunks of ${CHUNK_SIZE}...`);

    for (let from = startBlock; from <= endBlock; from += CHUNK_SIZE) {
        const to = Math.min(from + CHUNK_SIZE - 1, endBlock);
        console.log(`  Fetching ${from} to ${to}...`);

        try {
            // Fetch Bids
            const bids = await contract.queryFilter(bidFilter, from, to);
            bidEvents.push(...bids);

            // Fetch Exits
            const exits = await contract.queryFilter(exitFilter, from, to);
            exitEvents.push(...exits);

            // Small delay to be nice to RPC
            await new Promise(r => setTimeout(r, 200));
        } catch (e) {
            console.error(`  Failed to fetch chunk ${from}-${to}:`, e);
            // Determine if we should abort or continue (maybe partial data is okay? No, missing bids is bad).
            // Let's try one retry
            try {
                console.log(`  Retrying chunk ${from}-${to}...`);
                await new Promise(r => setTimeout(r, 1000));
                const bids = await contract.queryFilter(bidFilter, from, to);
                bidEvents.push(...bids);
                const exits = await contract.queryFilter(exitFilter, from, to);
                exitEvents.push(...exits);
            } catch (retryE) {
                console.error(`  Retry failed for ${from}-${to}. Skipping.`);
            }
        }
    }

    console.log(`Found ${bidEvents.length} distinct bid submissions.`);
    console.log(`Found ${exitEvents.length} exit events.`);

    // Map exits by bidId
    const refundsDetails = new Map<string, bigint>();
    // NOTE: BidExited gives "currencyRefunded". 
    // We need to know which bidID it matches.
    // Event signature: BidExited(uint256 indexed bidId, address indexed owner, uint256 tokensFilled, uint256 currencyRefunded)

    for (const event of exitEvents) {
        if ('args' in event) {
            const bidId = event.args[0].toString(); // args[0] is bidId
            const currencyRefunded = BigInt(event.args[3]); // args[3] is currencyRefunded

            const currentRefund = refundsDetails.get(bidId) || BigInt(0);
            refundsDetails.set(bidId, currentRefund + currencyRefunded);
        }
    }

    // 3. Process Bids
    interface ProcessedBid {
        id: string;
        owner: string;
        priceQ96: bigint;
        amountWei: bigint;
        refundedWei: bigint;
        netAmountWei: bigint;
        fdvEth: number;
        category: 'Market' | 'Limit' | 'Floor-ish';
    }

    const processedBids: ProcessedBid[] = [];

    // Thresholds (in ETH FDV)
    // Let's verify the distribution first, but let's set some initial heuristic.
    // "Market" bids are usually maxint or extremely high.
    // Let's say anything > 100 Trillion FDV is definitely market.
    // But usually "Market" button sends MAX_UINT or similar.
    // Let's look for the delineations.

    const bids: any[] = []; // Temporary holding

    for (const event of bidEvents) {
        if ('args' in event) {
            const id = event.args[0].toString();
            const owner = event.args[1];
            const priceQ96 = BigInt(event.args[2]);
            const amountWei = BigInt(event.args[3]);

            const refunded = refundsDetails.get(id) || BigInt(0);
            const net = amountWei - refunded;

            if (net <= BigInt(0)) continue; // Fully refunded/exited

            bids.push({ id, owner, priceQ96, net, amountWei, refunded });
        }
    }

    // Determine thresholds dynamically or static?
    // Let's calculate FDV for all and pick logical breaks.
    const dataPoints = bids.map(b => {
        const fdv = calculateFDV(b.priceQ96);
        return { ...b, fdv };
    });

    // Simple sorting to see huge jumps
    dataPoints.sort((a, b) => a.fdv - b.fdv);

    // Heuristic: 
    // Market: FDV > 1,000,000 ETH (approx 3-4B USD is sane, 1M ETH is ~3B USD. Wait, 1M ETH is huge).
    // Current ETH price ~3000? 1M ETH = 3B USD.
    // A "Market" bid usually sets the price to effectively infinity.
    // Let's set the "Market" threshold at > 100x reasonable valuation.
    // If Aztec is aiming for 1B-10B FDV (approx 300k - 3m ETH total supply value? No. 
    // 10B AZTEC * 0.0001 ETH = 1M ETH FDV.
    // Let's say "Market" is FDV > 100,000,000 ETH (crazy high).

    const MARKET_THRESHOLD_ETH_FDV = 10_000_000; // 10M ETH FDV is likely way above any limit price.

    let marketSum = BigInt(0);
    let limitSum = BigInt(0);
    let floorSum = BigInt(0); // Optional separate bucket

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
            owner: b.owner,
            priceQ96: b.priceQ96,
            amountWei: b.amountWei,
            refundedWei: b.refunded,
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

    // CSV Output for deeper inspection
    const csvContent = "Current,FDV_ETH,Amount_ETH,Category\n" +
        processedBids.map(b => `${b.netAmountWei},${b.fdvEth},${ethers.formatEther(b.netAmountWei)},${b.category}`).join('\n');

    // Check output dir
    const outDir = path.join(__dirname, '../output');
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir);
    }
    fs.writeFileSync(path.join(outDir, 'bids_analysis.csv'), csvContent);
    console.log(`Detailed CSV written to output/bids_analysis.csv`);

    // JSON Output for Dashboard
    const dashboardDir = path.join(__dirname, '../dashboard');
    if (!fs.existsSync(dashboardDir)) {
        fs.mkdirSync(dashboardDir);
    }

    const totalEth = parseFloat(ethers.formatEther(netTotal));
    const marketEth = parseFloat(ethers.formatEther(marketSum));
    const limitEth = parseFloat(ethers.formatEther(limitSum));
    const marketShare = (marketEth / totalEth) * 100;
    const limitShare = (limitEth / totalEth) * 100;

    // specific formatting for recent bids
    // We want the LAST added bids (most recent block numbers).
    // Note: Event fetching was chronological (startBlock to endBlock).
    // So distinct bids are roughly chronological. Reversing gives most recent.
    const recentBids = processedBids.slice().reverse().slice(0, 10).map(b => ({
        amount: parseFloat(ethers.formatEther(b.netAmountWei)).toFixed(2),
        category: b.category,
        id: b.id
    }));

    const dashboardData = {
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

    fs.writeFileSync(path.join(dashboardDir, 'data.json'), JSON.stringify(dashboardData, null, 2));
    console.log(`Dashboard data written to dashboard/data.json`);
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
