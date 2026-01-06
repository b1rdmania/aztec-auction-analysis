# Aztec Auction Analysis

TypeScript-based analysis tool for Aztec/Canton blockchain auction smart contracts on Ethereum mainnet.

**by [b1rdmania](https://github.com/b1rdmania)**

## 🎯 Overview

This project analyzes on-chain auction data from Aztec's smart contracts, tracking bidding patterns, price movements, and market dynamics.

## 🚀 Features

- Real-time blockchain data fetching
- Bid analysis and tracking
- Price velocity calculations
- FDV (Fully Diluted Valuation) analysis
- Event caching for performance
- Interactive dashboard

## 🏗️ Architecture

```
TypeScript Analysis Engine
    ↓
Ethereum JSON-RPC (Flashbots)
    ↓
CCA Smart Contract
    ↓
Dashboard Visualization
```

## 🛠️ Quick Start

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/b1rdmania/aztec-auction-analysis.git
cd aztec-auction-analysis
```

2. **Install dependencies**
```bash
npm install
```

3. **Build the project**
```bash
npm run build
```

4. **Run analysis**
```bash
npm start
```

5. **Open dashboard**
Open `dashboard/index.html` in your browser to view the analysis.

## 📊 Dashboard

The dashboard provides:
- Live auction data
- Bid tracking
- Price analysis
- Velocity metrics
- Market signals

## 📁 Project Structure

```
src/
├── index.ts           # Main analysis entry point
├── utils.ts           # Contract ABI and helper functions
├── analyze_velocity.ts # Price velocity analysis
├── check_hashes.ts    # Hash verification
└── build_static.ts    # Static site generation

dashboard/
├── index.html         # Main dashboard
├── app.js            # Dashboard logic
├── style.css         # Styling
└── markets/          # Market-specific views
```

## 🔧 Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run analysis
npm start
```

## 📚 Documentation

- [ABOUT.md](ABOUT.md) - Project overview
- [THESIS.md](THESIS.md) - Research thesis
- [WHITEPAPER.md](WHITEPAPER.md) - Technical whitepaper

## 🤝 Contributing

This is a personal research project. Suggestions and feedback are welcome via issues.

## 📄 License

MIT License

## 🔗 Links

- [GitHub Repository](https://github.com/b1rdmania/aztec-auction-analysis)
- [My GitHub](https://github.com/b1rdmania)
- [Aztec Network](https://aztec.network/)

---

## 🆕 Related Projects

For Polymarket prediction market trading, see:
- [polymarket-ai-trading](https://github.com/b1rdmania/polymarket-ai-trading) - AI-assisted Polymarket trading protocol

---

**Note**: This tool is for research and analysis purposes only.
