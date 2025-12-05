
import { BigNumberish, ethers } from 'ethers';

export const Q96 = BigInt(2) ** BigInt(96);
export const TOTAL_SUPPLY_AZTEC = BigInt('10350000000'); // 10.35B

export function q96ToEthPrice(priceQ96: bigint): number {
    // priceQ96 = (ETH / Token) * 2^96
    // ETH / Token = priceQ96 / 2^96
    // We want precision, so let's convert to float carefully or keep as BigInt for sorting.
    // For display/bucketing, float is fine.

    // To avoid precision loss with BigInt division:
    // Multiply by a large scalar, divide, then convert to float and divide by scalar.
    const scalar = 1e18;
    const scaled = (priceQ96 * BigInt(scalar)) / Q96;
    return Number(scaled) / scalar;
}

export function calculateFDV(priceQ96: bigint): number {
    const ethPerToken = q96ToEthPrice(priceQ96);
    return ethPerToken * Number(TOTAL_SUPPLY_AZTEC);
}

// Contract Address
export const CCA_CONTRACT_ADDRESS = '0x608c4e792c65f5527b3f70715dea44d3b302f4ee';

// ABI for events
export const CCA_ABI = [
    "event BidSubmitted(uint256 indexed id, address indexed owner, uint256 price, uint128 amount)",
    "event BidExited(uint256 indexed bidId, address indexed owner, uint256 tokensFilled, uint256 currencyRefunded)"
];
