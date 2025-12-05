# Aztec Auction Tracker (Experimental)

**Tracks on-chain commitments for the Aztec Network public auction.**

> [!WARNING]
> **DISCLAIMER: EXPERIMENTAL TOOL.**
> This project categorizes raw on-chain events (`BidSubmitted`, `BidExited`). **It has NOT been wargamed** against adversarial edge cases. Use at your own risk. This is not financial advice.

## Objective
Provide transparency on "Total Active Commitments" (Open Interest) for the [Polymarket Event](https://polymarket.com/event/aztec-public-sale-total-commitments).

**[Open Live Dashboard](https://aztec-analysis.vercel.app/)** | **[Read About the Project](ABOUT.md)**

---

## Methodology

We scan the **Aztec Continuous Clearing Auction (CCA)** contract on Ethereum Mainnet.

*   **Contract**: `0x608c...4ee`
*   **Window**: Last **200,000 Blocks** (~30 Days). Covers "Contributor" (Nov 7) and "Public" (Dec 2) phases.

### Classification
Bids are bucketed by their `limitPrice`:

1.  **Market Bids ("The Floor")**
    *   **Logic**: Implied Valuation > **10,000,000 ETH FDV**.
    *   **Meaning**: Effectively "Infinity." User accepts *any* clearing price.

2.  **Limit Bids**
    *   **Logic**: Specific price limit below the Market threshold.
    *   **Meaning**: Price-sensitive demand.

### Calculation
**Net Commitments** = `Total Bids` (Gross) - `Refunds` (Exits).

---

## Verification Instructions

1.  **Clone**
    ```bash
    git clone https://github.com/b1rdmania/aztec-auction-analysis.git
    cd aztec-auction-analysis
    ```
2.  **Install**
    ```bash
    npm install
    ```
3.  **Run** (Generates `dashboard/data.json`)
    ```bash
    npx ts-node src/index.ts
    ```
