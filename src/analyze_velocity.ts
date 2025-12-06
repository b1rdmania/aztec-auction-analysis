
import * as fs from 'fs';
import * as path from 'path';
import { calculateFDV, q96ToEthPrice } from './utils';
import { ethers } from 'ethers';

const CACHE_PATH = path.join(__dirname, 'events_cache.json');

// Approx blocks per day: 7200 (12s block time)
// Approx blocks per hour: 300
const BLOCKS_PER_HOUR = 300;

async function main() {
    console.log("Analyzing Auction Velocity...");

    if (!fs.existsSync(CACHE_PATH)) {
        console.error("No cache found. Run index.ts first.");
        return;
    }

    const rawCache = fs.readFileSync(CACHE_PATH, 'utf8');
    const cache = JSON.parse(rawCache);

    const bidEvents = cache.bidEvents;
    const lastBlock = cache.lastBlock; // The latest block we scanned

    console.log(`Total Events: ${bidEvents.length}`);
    console.log(`Latest Block: ${lastBlock}`);

    // Filter for last 24 hours (7200 blocks)
    const oneDayAgoBlock = lastBlock - 7200;
    const recentBids = bidEvents.filter((e: any) => e.blockNumber >= oneDayAgoBlock);

    console.log(`Events in last 24h: ${recentBids.length}`);
    if (recentBids.length > 0) {
        console.log("Sample Event:", JSON.stringify(recentBids[0], null, 2));
    }

    // Aggregate by hour (bucket by block range)
    const hourlyVolume: { [hour: number]: number } = {};
    const buckets = 24;

    let totalRecentEth = 0;

    for (const bid of recentBids) {
        // Inverse bucket: 0 is "now", 23 is "23 hours ago"
        const blockDiff = lastBlock - bid.blockNumber;
        const hourBucket = Math.floor(blockDiff / BLOCKS_PER_HOUR);

        if (hourBucket < buckets) {
            const amount = Number(ethers.formatUnits(bid.args[3], 18)); // amount is 4th arg (id, owner, price, amount)
            if (!hourlyVolume[hourBucket]) hourlyVolume[hourBucket] = 0;
            hourlyVolume[hourBucket] += amount;
            totalRecentEth += amount;
        }
    }

    console.log("\n--- Hourly Inflow (ETH) ---");
    console.log("(Hour 0 = Last 60 mins)");

    for (let i = 0; i < buckets; i++) {
        const vol = hourlyVolume[i] || 0;
        // console.log(`Hour -${i}: ${vol.toFixed(2)} ETH`);
    }

    // Group into 4h chunks for cleaner output
    console.log("\n--- 4-Hour Windows ---");
    for (let i = 0; i < buckets; i += 4) {
        let chunkVol = 0;
        for (let j = 0; j < 4; j++) {
            chunkVol += (hourlyVolume[i + j] || 0);
        }
        console.log(`Hours -${i} to -${i + 3}: ${chunkVol.toFixed(2)} ETH`);
    }

    console.log(`\nTotal 24h Inflow: ${totalRecentEth.toFixed(2)} ETH`);
    const avgHourly = totalRecentEth / 24;
    console.log(`Average Hourly Rate: ${avgHourly.toFixed(2)} ETH/hr`);

    // Last 6h rate
    let last6hVol = 0;
    for (let i = 0; i < 6; i++) last6hVol += (hourlyVolume[i] || 0);
    console.log(`Last 6h Rate: ${(last6hVol / 6).toFixed(2)} ETH/hr (Total: ${last6hVol.toFixed(2)})`);

    // Projection
    const hoursRemaining = 22; // approx
    const projectedAdd = avgHourly * hoursRemaining;
    const projectedAddRecent = (last6hVol / 6) * hoursRemaining;

    console.log("\n--- Projections (22h Remaining) ---");
    console.log(`Based on 24h Avg: +${projectedAdd.toFixed(0)} ETH`);
    console.log(`Based on 6h Avg:  +${projectedAddRecent.toFixed(0)} ETH`);
}

main();
