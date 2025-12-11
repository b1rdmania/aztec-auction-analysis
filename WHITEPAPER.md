# Project Whitepaper
## Prediction Market Trading Infrastructure

*Board Summary & Strategic Options*

---

## Executive Summary

Over the past sessions, we have built a **comprehensive prediction market research and trading infrastructure** spanning two parallel workstreams:

1. **Aztec Auction Intelligence** — Real-time on-chain analysis of the Aztec Network token auction
2. **Polymarket Trading Toolkit** — Modular infrastructure for systematic volatility trading

The combined output includes:
- **4 Python packages** (ready for deployment as APIs)
- **1 TypeScript scanner** (on-chain data extraction)
- **1 live dashboard** (deployed to Vercel)
- **6 research themes** (academic foundation)
- **718-line quantitative trading guide**

This document consolidates everything built for board review and strategic planning.

---

## What We Built

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     PREDICTION MARKET INFRASTRUCTURE                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    AZTEC WORKSTREAM                          │    │
│  │                                                              │    │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │    │
│  │  │ On-Chain    │───►│ Data        │───►│ Dashboard   │      │    │
│  │  │ Scanner     │    │ Pipeline    │    │ (Vercel)    │      │    │
│  │  │ (TypeScript)│    │             │    │             │      │    │
│  │  └─────────────┘    └─────────────┘    └─────────────┘      │    │
│  │        │                                                     │    │
│  │        ▼                                                     │    │
│  │  ┌─────────────┐                                             │    │
│  │  │ 6.8MB       │                                             │    │
│  │  │ Event Cache │                                             │    │
│  │  └─────────────┘                                             │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                   POLYMARKET TOOLKIT                         │    │
│  │                                                              │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │    │
│  │  │ polymarket- │  │ volatility- │  │ mean-       │          │    │
│  │  │ data        │  │ alerts      │  │ reversion   │          │    │
│  │  │ (client)    │  │ (monitor)   │  │ (signals)   │          │    │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘          │    │
│  │         │                │                │                  │    │
│  │         └────────────────┴────────┬───────┘                  │    │
│  │                                   │                          │    │
│  │                          ┌────────▼────────┐                 │    │
│  │                          │ whale-tracker   │                 │    │
│  │                          │ (smart money)   │                 │    │
│  │                          └─────────────────┘                 │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    RESEARCH DATABASE                         │    │
│  │                                                              │    │
│  │  • 6 Academic Research Themes                                │    │
│  │  • 718-line Quantitative Trading Guide                       │    │
│  │  • Polymarket Ecosystem Map                                  │    │
│  │  • Key Findings & Next Actions                               │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component 1: Aztec Auction Intelligence

### Purpose

Real-time transparency on the Aztec Network token auction — providing independent analysis of on-chain commitments that Polymarket traders can use to inform their positions.

### What It Does

| Capability | Implementation | Output |
|------------|---------------|--------|
| **Scan blockchain** | TypeScript + ethers.js | Raw event extraction |
| **Parse bid events** | `BidSubmitted`, `BidExited` | 200k block window |
| **Classify bids** | Market (>10M FDV) vs Limit | Demand segmentation |
| **Calculate totals** | Net = Gross - Refunds | Active commitments |
| **Visualize** | HTML dashboard | Public-facing display |

### Technical Details

**Contract:** `0x608c...4ee` (Aztec CCA on Ethereum Mainnet)

**Data Pipeline:**
```
Flashbots RPC → Event Logs → Parse & Classify → JSON → Dashboard
```

**Output Schema:**
```typescript
interface ProcessedBid {
  id: string;
  amountWei: bigint;
  netAmountWei: bigint;
  fdvEth: number;
  category: 'Market' | 'Limit' | 'Floor-ish';
}
```

**Cache:** 6.8MB `events_cache.json` (all historical events)

### Current Metrics (as of Dec 6)

| Metric | Value |
|--------|-------|
| Total Active Commitments | ~19,588 ETH |
| Market Demand (>10M FDV) | ~8,255 ETH (42.1%) |
| Limit Demand | ~11,333 ETH (57.9%) |
| "Sticky Floor" | 42.1% price-insensitive |

### Deployment

- **Dashboard:** [aztec-auction-analysis.vercel.app](https://aztec-auction-analysis.vercel.app) (or similar)
- **GitHub:** [github.com/b1rdmania/aztec-auction-analysis](https://github.com/b1rdmania/aztec-auction-analysis)

---

## Component 2: Polymarket Trading Toolkit

### Purpose

Modular, open-source Python packages for prediction market research and systematic trading.

### Package Summary

| Package | Lines | Purpose | Key Classes |
|---------|-------|---------|-------------|
| **polymarket-data** | ~200 | Read-only API client | `PolymarketClient`, `Market`, `Orderbook` |
| **volatility-alerts** | ~600 | Real-time price monitoring | `AlertMonitor`, `Alert`, `AlertHandler` |
| **mean-reversion** | ~500 | Trading signal generation | `SignalGenerator`, `Signal`, `SignalType` |
| **whale-tracker** | ~400 | Large trade monitoring | `WhaleMonitor`, `Trade`, `TraderProfile` |

**Total:** ~1,700 lines of production-ready Python code

### Package Details

#### 1. polymarket-data

```python
from polymarket_data import PolymarketClient

client = PolymarketClient()

# Get trending markets
trending = await client.get_trending_markets(limit=10)

# Get market orderbook
orderbook = await client.get_orderbook(token_id="...")

# Get price history (requires Adjacent API for historical)
history = await client.get_price_history(market_id="...")
```

**Features:**
- No authentication required (public APIs only)
- Async-first design with `httpx`
- Typed models with dataclasses
- Rate limiting and retries

#### 2. volatility-alerts

```python
from volatility_alerts import AlertMonitor, AlertConfig

config = AlertConfig(
    price_threshold_pct=10.0,  # Alert on 10%+ moves
    volume_threshold=50_000,   # High volume markets only
    check_interval=60          # Check every minute
)

monitor = AlertMonitor(config)
monitor.add_handler(ConsoleHandler())
await monitor.start()
```

**Alert Types:**
- `PRICE_SPIKE` — Large price movement detected
- `WIDE_SPREAD` — Spread exceeds threshold
- `CLOSING_SOON` — Market approaching resolution

**Handlers:**
- Console (default)
- Webhook (extensible)
- Discord/Telegram (planned)

#### 3. mean-reversion

```python
from mean_reversion import SignalGenerator, SignalConfig

config = SignalConfig(
    min_mispricing_pct=5.0,
    min_volume=10_000,
    horizon_min_days=7,
    horizon_max_days=21
)

generator = SignalGenerator(config)
signals = await generator.scan(limit=50)

for signal in signals:
    print(f"{signal.market_question}: {signal.signal_type} @ {signal.strength}")
```

**Signal Logic (Based on Berg & Rietz 2018):**

| Price Zone | Horizon | Bias | Signal |
|------------|---------|------|--------|
| <30% (Longshot) | 1-3 weeks | Underpriced | BUY |
| >70% (Favorite) | 1-3 weeks | Overpriced | SELL |
| 30-70% | Any | Fair | NO_TRADE |

**Output:**
```python
@dataclass
class Signal:
    market_id: str
    market_question: str
    signal_type: SignalType  # BUY, SELL, NO_TRADE
    direction: SignalDirection
    strength: SignalStrength  # WEAK, MODERATE, STRONG
    current_price: float
    mispricing_estimate: float
    horizon_days: int
    token_id: str
    timestamp: datetime
```

#### 4. whale-tracker

```python
from whale_tracker import WhaleMonitor, WatchlistConfig

config = WatchlistConfig(
    min_trade_size=1_000,
    whale_threshold=10_000,
    wallets=["0x...", "0x..."]  # Known whale addresses
)

monitor = WhaleMonitor(config)

# Get large trades
trades = await monitor.get_large_trades(hours=24)

# Get top traders
traders = await monitor.get_top_traders(limit=10)

# Scan for whale alerts
alerts = await monitor.scan_for_whales()
```

**Data Sources:**
- Gamma API (public markets)
- PredictFolio leaderboard (known whales)
- On-chain indexing (requires Dune/RPC for full data)

---

## Component 3: Research Database

### Academic Themes Collected

| Theme | File | Key Insight |
|-------|------|-------------|
| **1. Prediction Market Accuracy** | `theme1-prediction-market-accuracy.md` | Markets are efficient on average but systematically wrong at extremes |
| **2. Biases in In-Play Betting** | `theme2-biases-inplay-betting.md` | Emotional overreaction creates exploitable windows |
| **3. Governance & Internal Control** | `theme3-governance-internal-control.md` | Organizational behavior patterns |
| **4. AI Forecasting** | `theme4-ai-forecasting.md` | ML approaches to improving prediction |
| **5. Corruption & Procurement** | `theme5-corruption-procurement.md` | Information asymmetries and manipulation |
| **6. General References** | `theme6-general-references.md` | Academic sources and methodologies |

### Core Research Documents

#### Quantitative Mean Reversion Guide (718 lines)

Complete trading system documentation including:

1. **Mean Reversion Theory** — De Bondt & Thaler (1985)
2. **Ornstein-Uhlenbeck Process** — Mathematical model
3. **Half-Life Calculation** — When to expect reversion
4. **ADF Testing** — Statistical validation
5. **Z-Score System** — Entry/exit signals
6. **Kelly Criterion** — Position sizing
7. **Market Overreaction Effect** — Behavioral basis
8. **Which Markets Are Most Emotional?** — Target selection
9. **Sports Betting Parallels** — In-play dynamics
10. **Complete Trading System** — Production-ready Python code

#### Key Findings

```
                                  POLYMARKET TRADER STATISTICS
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   86.4% of users LOSE money                                             │
│   Only 13.6% are profitable                                             │
│   Most winners made <$100                                               │
│                                                                         │
│   TOP WINNERS:                                                          │
│   • Theo4: $22M+                                                        │
│   • Fredi9999: $16M+                                                    │
│   • "French Whale": $80M+ (wagered $30M on Trump)                       │
│                                                                         │
│   THE EDGE EXISTS — but concentrated in top traders                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Research Foundation: The Trading Thesis

### Core Hypothesis

**Prediction markets exhibit behavioral biases that create systematically exploitable mean reversion opportunities, particularly in political markets.**

### Academic Support

| Source | Finding | Application |
|--------|---------|-------------|
| **Berg & Rietz (2018)** | Longshots underpriced at 1-3 week horizons | Buy <30% contracts |
| **De Bondt & Thaler (1985)** | Extreme moves followed by reversals | Fade panic |
| **Munger (1995)** | 25 cognitive biases create irrationality | Explains why edge exists |

### Why Political Markets?

| Factor | Sports | Political |
|--------|--------|-----------|
| Liquidity | Higher | Often thin |
| Manipulation risk | Lower | Higher |
| **Partisan bias** | Minimal | **Strong** |
| Event frequency | Daily | Rare |
| Historical accuracy | Better | Worse |

**Political markets are MORE irrational because:**
1. Participants bet their preferences, not beliefs
2. Low liquidity amplifies moves
3. Rare events = less learning
4. Partisan anchoring persists

---

## Ecosystem Intelligence

### External Tools Mapped

```
                    ┌─────────────────┐
                    │   POLYMARKET    │
                    │  (Core Platform) │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│   Adjacent    │  │  PredictFolio │  │    PolyFund   │
│   (News API)  │  │  (Analytics)  │  │   (Funds)     │
│               │  │               │  │               │
│ • OHLCV Data  │  │ • Leaderboard │  │ • Managed $   │
│ • News Links  │  │ • Wallet Track│  │ • Perf Fees   │
└───────────────┘  └───────────────┘  └───────────────┘
        │                    │                    
        ▼                    ▼                    
┌───────────────┐  ┌───────────────┐  
│  Nevua        │  │  Dune         │  
│  (Alerts)     │  │  (On-chain)   │  
└───────────────┘  └───────────────┘  
```

### Data Source Assessment

| Need | Solution | Status |
|------|----------|--------|
| Real-time prices | Polymarket API (free) | ✅ Implemented |
| Historical OHLCV | Adjacent API (paid) | 🔶 Needs key |
| Whale tracking | PredictFolio | ✅ Leaderboard scraped |
| Real-time alerts | Our `volatility-alerts` | ✅ Built |
| On-chain trades | Dune Analytics | 🔶 SQL queries ready |
| News-to-price | Adjacent API | 🔶 Needs key |

---

## Monetization Angles

### Reference: How PizzINT Monetizes

We analyzed [pizzint.watch](https://pizzint.watch) as a comparable project:

| Method | Their Implementation | Applicability |
|--------|---------------------|---------------|
| **Polymarket Affiliate** | Invisible `?via=` link rewriting | ✅ Easy to add |
| **Crypto Token** | $PPW on bags.fm | ⚠️ Regulatory risk |
| **Ads** | `ads.pizzint@gmail.com` | ✅ If traffic grows |
| **API Access** | "API access available" | ✅ Our toolkit is ready |

### Our Options

#### Option A: API-as-a-Service

```
┌─────────────────────────────────────────────────────────────────────┐
│                      PAID API TIERS                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  FREE TIER                  PRO TIER                 ENTERPRISE      │
│  ─────────                  ────────                 ──────────      │
│  • 100 calls/day            • 10,000 calls/day       • Unlimited     │
│  • Public markets           • All markets            • Dedicated     │
│  • No signals               • Mean reversion         • Custom feeds  │
│  • Best-effort              • Whale alerts           • SLA           │
│                             • Historical data                        │
│                                                                      │
│  $0/mo                      $49/mo                   $499/mo         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Pros:** Recurring revenue, scalable, low marginal cost
**Cons:** Need traffic/awareness, support burden

#### Option B: Managed Trading Fund (PolyFund)

```
1. Create a public fund on PolyFund
2. Trade with our mean-reversion strategy
3. Attract depositors through track record
4. Earn 20% performance fee on profits
```

**Pros:** Aligned incentives, scales with AUM
**Cons:** Regulatory uncertainty, need to prove strategy first

#### Option C: Affiliate Revenue

```javascript
// Add to any Polymarket link on our sites
var via = "ourtag";
if(host === 'polymarket.com'){
  u.searchParams.set('via', via);
}
```

**Pros:** Passive, zero effort
**Cons:** Low revenue unless massive traffic

#### Option D: Research Consulting

Package our research database + toolkit for:
- Crypto funds wanting prediction market exposure
- Academic researchers
- Journalists covering prediction markets

**Pros:** High ticket, immediate
**Cons:** Not scalable, time-intensive

---

## Strategic Next Steps

### Immediate (This Week)

| Action | Effort | Impact |
|--------|--------|--------|
| Deploy toolkit as hosted API | 1 day | Enables monetization testing |
| Add Polymarket affiliate links | 30 min | Passive revenue starts |
| Contact Adjacent for API key | 1 email | Unlocks historical data |
| Paper trade mean-reversion | Ongoing | Validates strategy |

### Short-Term (1 Month)

| Action | Effort | Impact |
|--------|--------|--------|
| Build historical backtest with Adjacent data | 1 week | Quantify expected returns |
| Add Discord/Telegram handlers to alerts | 2 days | Distribution channel |
| Create landing page for toolkit | 2 days | Lead generation |
| Study top 10 PredictFolio traders | 3 days | Refine strategy |

### Medium-Term (3 Months)

| Action | Effort | Impact |
|--------|--------|--------|
| Launch PolyFund if strategy validates | 2 weeks | AUM-based revenue |
| Publish API pricing page | 1 day | Start charging |
| Build public signal dashboard | 1 week | Traffic driver |
| Automate Aztec-style analysis for other auctions | 1 week | Reusable product |

---

## File Inventory

### Repository Structure

```
aztec-auction-analysis/
├── README.md                          # Project overview
├── ABOUT.md                          # Extended documentation
├── WHITEPAPER.md                     # This document
├── package.json                      # Node dependencies
├── tsconfig.json                     # TypeScript config
├── vercel.json                       # Deployment config
│
├── src/                              # Aztec on-chain scanner
│   ├── index.ts                      # Main scanner (294 lines)
│   ├── utils.ts                      # Contract ABI, helpers
│   ├── analyze_velocity.ts           # Velocity analysis
│   ├── build_static.ts               # Static site builder
│   └── events_cache.json             # 6.8MB event cache
│
├── dashboard/                        # Frontend
│   ├── index.html                    # Main dashboard
│   ├── style.css                     # Aztec design system
│   ├── app.js                        # Dashboard logic
│   ├── data.json                     # Processed data
│   └── toolkit/                      # Toolkit subpage
│
├── toolkit/                          # Python packages
│   ├── README.md                     # Toolkit overview
│   ├── polymarket-data/              # Data client
│   │   ├── pyproject.toml
│   │   └── src/polymarket_data/
│   │       ├── __init__.py
│   │       ├── client.py
│   │       └── models.py
│   ├── volatility-alerts/            # Alert system
│   │   ├── pyproject.toml
│   │   └── src/volatility_alerts/
│   │       ├── __init__.py
│   │       ├── config.py
│   │       ├── monitor.py            # 344 lines
│   │       ├── models.py
│   │       ├── handlers.py
│   │       └── cli.py
│   ├── mean-reversion/               # Signal generator
│   │   ├── pyproject.toml
│   │   └── src/mean_reversion/
│   │       ├── __init__.py
│   │       ├── config.py
│   │       ├── generator.py          # 295 lines
│   │       └── models.py
│   └── whale-tracker/                # Smart money tracking
│       ├── pyproject.toml
│       └── src/whale_tracker/
│           ├── __init__.py
│           ├── config.py
│           ├── monitor.py            # 191 lines
│           ├── models.py
│           └── cli.py
│
└── research/                         # Research database
    ├── polymarket_key_findings.md
    ├── polymarket_ecosystem.md
    ├── quant_mean_reversion_guide.md  # 718 lines
    ├── political_betting_guide.md
    ├── polymarket_data_research.md
    ├── munger-25-biases.md
    ├── berg-rietz-2018-longshots-overconfidence.md
    └── papers/
        ├── theme1-prediction-market-accuracy.md
        ├── theme2-biases-inplay-betting.md
        ├── theme3-governance-internal-control.md
        ├── theme4-ai-forecasting.md
        ├── theme5-corruption-procurement.md
        ├── theme6-general-references.md
        └── pizzint-analysis.md
```

---

## Summary

We have built a **complete prediction market trading infrastructure** with:

| Component | Completeness | Next Step |
|-----------|--------------|-----------|
| On-chain scanner | ✅ Production | Automate updates |
| Dashboard | ✅ Deployed | Add more visualizations |
| Data client | ✅ Ready | Deploy as API |
| Volatility alerts | ✅ Ready | Add notification channels |
| Mean reversion signals | ✅ Ready | Backtest with historical data |
| Whale tracker | ✅ Ready | Add on-chain indexing |
| Research database | ✅ Comprehensive | Continue collecting |

**The infrastructure is built. The question is: what do we want to do with it?**

---

*Document generated: 2025-12-11*
*Repository: github.com/b1rdmania/aztec-auction-analysis*
