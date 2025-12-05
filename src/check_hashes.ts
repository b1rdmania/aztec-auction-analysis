
import { ethers } from 'ethers';

const events = [
    "BidSubmitted(uint256,address,uint256,uint256)",
    "BidExited(uint256,address,uint256,uint256)",
    "CheckpointUpdated(uint256,uint256,uint24)"
];

events.forEach(e => {
    console.log(`${e} -> ${ethers.id(e)}`);
});
