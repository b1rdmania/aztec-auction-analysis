
import { ethers } from 'ethers';
import { CCA_CONTRACT_ADDRESS } from './utils';
import * as fs from 'fs';

const RPC_URL = 'https://eth.llamarpc.com';

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const endBlock = await provider.getBlockNumber();
    const startBlock = endBlock - 500; // Last 500 blocks

    console.log(`fetching logs from ${startBlock} to ${endBlock} for ${CCA_CONTRACT_ADDRESS}`);

    const logs = await provider.getLogs({
        address: CCA_CONTRACT_ADDRESS,
        fromBlock: startBlock,
        toBlock: endBlock
    });

    console.log(`Found ${logs.length} logs.`);

    // Group by topic0
    const topicCounts: { [key: string]: number } = {};
    const sampleLogs: { [key: string]: any } = {};

    for (const log of logs) {
        const t0 = log.topics[0];
        topicCounts[t0] = (topicCounts[t0] || 0) + 1;
        if (!sampleLogs[t0]) sampleLogs[t0] = log;
    }

    console.log('Topic Counts:', topicCounts);
    console.log('Sample Logs:', JSON.stringify(sampleLogs, null, 2));
}

main().catch(console.error);
