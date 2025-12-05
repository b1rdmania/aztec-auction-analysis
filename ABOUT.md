# About Aztec Auction Intelligence

**Transparency for the Open Market.**

## The Event
The **Aztec Network** is conducting a public token sale via a continuous clearing auction on Ethereum Mainnet. This event effectively determines the market's initial valuation of the network.

## The Problem
Understanding the "true" demand is difficult due to:
1.  **Opaque Data**: Raw blockchain events are hard to parse manually.
2.  **Order Types**: The auction accepts both "Limit" bids and effectively "Market" bids (high limit price).
3.  **Active vs. Refunded**: Simply summing deposits ignores users who have exited.

## The Solution
This project is an **experimental open-source intelligence tool** designed to:
*   Parse `BidSubmitted` and `BidExited` events directly from the blockchain.
*   Categorize demand into "Market" (Floor) and "Limit" (Price Sensitive).
*   Provide a clear, verifiable "Open Interest" number for observers and Polymarket participants.

## Disclaimer
**This software is experimental.** It has been created to provide estimation data. It has **not** been wargamed against complex adversarial smart contract interactions (e.g., flash loan manipulation of event emission, though unlikely in this specific contract design).

**This is NOT financial advice.**

## Live Dashboard
**[https://aztec-analysis.vercel.app/](https://aztec-analysis.vercel.app/)**
