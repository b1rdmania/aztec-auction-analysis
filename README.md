# Aztec Auction Analysis + Polymarket Trading Toolkit

Two interconnected projects for prediction market research and systematic trading:

1. **Aztec Auction Intelligence** (TypeScript) - On-chain transparency for Aztec token auction
2. **Polymarket Systematic Trading** (Python) - Autonomous trading based on behavioral finance

---

## 🎯 Project 1: Aztec Auction Analysis

**Live Dashboard**: https://aztec-auction-analysis.vercel.app/

Real-time on-chain tracker providing transparency for the Aztec Network token auction:
- Scans 200,000+ blocks for bid/exit events
- Categorizes bidders by price sensitivity ($0.85, $1.25, $2.50)
- Total active commitment tracking
- Helps Polymarket traders assess auction dynamics

**Tech**: TypeScript, ethers.js, Vercel

---

## 🤖 Project 2: Polymarket Trading Toolkit

Complete autonomous trading system with multi-model paper trading.

### ⚡ Quick Start - Docker (Recommended)

```bash
# Start all 3 models + dashboard in Docker
./scripts/docker.sh start

# View logs
./scripts/docker.sh logs

# Stop everything
./scripts/docker.sh stop
```

**Live Dashboard**: https://vercel-frontend-eight-omega.vercel.app
- Monitor all 3 models in real-time
- View P&L, win rates, trade history
- Access from anywhere (phone, laptop, etc.)

### Alternative: Local Setup

```bash
# Install packages
cd toolkit/execution-engine && pip install -e .
cd ../mean-reversion && pip install -e .
cd ../volatility-alerts && pip install -e .
cd ../polymarket-data && pip install -e .

# Start models
python3 scripts/start_models.py

# Monitor performance
python3 scripts/monitor_models.py --loop
```

---

## 📋 What's Inside - Trading System

### 🏗️ System Architecture

**Signal Generation** → **Risk Check** → **Position Sizing** → **Execution** → **Monitoring**

| Component | Purpose |
|-----------|---------|
| **Signals** | Mean reversion, volatility alerts, whale tracking |
| **Risk** | Position limits, exposure caps, spread checks |
| **Sizing** | Kelly Criterion for optimal bet sizing |
| **Execution** | Polymarket Agents integration (paper/live) |
| **Monitoring** | Dashboard, SQLite DB, JSON logs |

### 📦 Key Components

```
toolkit/
├── execution-engine/     # Core trading infrastructure
├── mean-reversion/       # Behavioral bias signals (Berg & Rietz 2018)
├── volatility-alerts/    # Price spike detection
├── whale-tracker/        # Smart money monitoring
└── polymarket-data/      # API client

agents/
└── systematic_trader.py  # Main trading bot

dashboard/trading/        # Live web dashboard
config/                   # 3 model configurations
data/                     # Trade databases + recordings
```

---

## 🎯 Trading Strategy

Based on academic research: **mean reversion** in prediction markets.

| Signal | Logic | Source |
|--------|-------|--------|
| Buy Longshot | Contracts <30% underpriced | Berg & Rietz (2018) |
| Sell Favorite | Contracts >70% overpriced | Berg & Rietz (2018) |
| Fade Spike | Price spikes >10% revert | De Bondt & Thaler (1985) |

**Key Facts**:
- 86.4% of Polymarket traders lose money
- Political markets have more irrational pricing
- Mean reversion works best at 7-21 day horizons

---

## 🔧 Usage

### Monitor Dashboard
**URL**: https://vercel-frontend-eight-omega.vercel.app
- View from anywhere (globally accessible)
- Real-time P&L, trades, win rates
- All 3 models compared

### Check Logs
```bash
# View specific model
docker compose logs moderate

# Check databases
sqlite3 data/trades_conservative.db "SELECT * FROM trades"
```

### Emergency Stop
```bash
python scripts/emergency_stop.py
```

### Configuration
Edit `config/active_conservative.yaml` (or moderate/aggressive):
```yaml
risk:
  max_position_usd: 200-800  # Based on model
  kelly_fraction: 0.15-0.35   # Conservative to aggressive
signals:
  mean_reversion:
    min_strength: STRONG/MODERATE/WEAK
```

---

## 📊 Performance Targets

| Metric | Target |
|--------|--------|
| Win Rate | > 55% |
| Avg Profit/Trade | > $25 |
| Sharpe Ratio | > 1.0 |
| Max Drawdown | < 20% |

### 🔥 Real-World Lessons

Based on [@the_smart_ape's bot](https://twitter.com/the_smart_ape/status/2005576087875527082):
- Conservative params: **+86% ROI** ✅
- Aggressive params: **-50% ROI** ❌

**Parameter selection is everything!** That's why we test 3 models in parallel.

See: [`LESSONS_FROM_SMART_APE.md`](LESSONS_FROM_SMART_APE.md)

---

## 🧪 Testing & Validation

### Paper Trading (Current)
✅ Running 30-day paper trading validation now
- 3 models competing head-to-head
- Recording live market data for future backtesting
- Dashboard: https://vercel-frontend-eight-omega.vercel.app

### Backtesting
⚠️ **Reality Check**: Polymarket's historical API is incomplete/empty

**Options**:
1. Use synthetic data: `python3 scripts/demo_backtest.py`
2. Wait for our recorded data (30 days from now)
3. Use Adjacent API (paid service)

See: [`BACKTEST_REALITY.md`](BACKTEST_REALITY.md)

---

## 🚢 Deployment

### Current Setup (Active)
- **Docker** containers on macOS (3 models + API)
- **Cloudflare Tunnel** for API access
- **Vercel** for dashboard hosting

### Future: Raspberry Pi
When your Pi arrives:
- Copy project over
- Run 24/7 for ~$5/year electricity
- Complete guide: [`PI_COMPLETE_GUIDE.md`](PI_COMPLETE_GUIDE.md)

---

## 📚 Documentation

### Essential Reading
- [`THESIS.md`](THESIS.md) - Why this works
- [`WHITEPAPER.md`](WHITEPAPER.md) - Technical architecture
- [`PAPER_TRADING_START.md`](PAPER_TRADING_START.md) - Multi-model setup
- [`LESSONS_FROM_SMART_APE.md`](LESSONS_FROM_SMART_APE.md) - Real bot insights

### Research
- [`research/quant_mean_reversion_guide.md`](research/quant_mean_reversion_guide.md) - Math foundations
- [`research/papers/`](research/papers/) - 6 academic themes

### Operations
- [`WALLET_SETUP.md`](WALLET_SETUP.md) - Security guide
- [`GO_LIVE.md`](GO_LIVE.md) - Live trading checklist
- [`DEPLOYMENT.md`](DEPLOYMENT.md) - Deployment options

---

## 🔒 Security

- ✅ Never commit `.env` files
- ✅ Private keys in environment variables only
- ✅ Hardware wallet for large amounts
- ✅ Regular database backups
- ⚠️ This is your money - be paranoid!

## 📈 Status & Roadmap

### ✅ Complete
- Core execution engine with risk management
- 3-model paper trading system
- Live dashboard (Docker + Vercel)
- Signal generators (mean reversion, volatility, whale)
- Comprehensive logging & monitoring

### 🚧 In Progress
- **30-day paper trading validation** (currently running)
- Live market data recording

### 🔮 Future
- Live trading launch (after validation)
- Machine learning signal enhancements
- Multi-market arbitrage
- Historical backtesting (needs Adjacent API)

---

## ⚠️ Disclaimer

**This is experimental trading software.**

- Not financial advice
- Use at your own risk
- Can result in loss of capital
- Test thoroughly before live trading

---

## 📞 Quick Links

| Link | Purpose |
|------|---------|
| 📊 [Dashboard](https://vercel-frontend-eight-omega.vercel.app) | Live trading monitoring |
| 🐛 [Issues](https://github.com/b1rdmania/aztec-auction-analysis/issues) | Report bugs |
| 📧 Security | Email privately for vulnerabilities |
| 🚨 Emergency | `python scripts/emergency_stop.py` |

---

**Built with systematic discipline. Trade with patience. 🎯**

*Note: GitHub repo name will be updated to reflect dual nature (Aztec + Polymarket)*
