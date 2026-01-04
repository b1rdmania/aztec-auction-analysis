# Polymarket Systematic Trading Agent 🤖

A complete autonomous trading system for Polymarket prediction markets, combining behavioral finance research with systematic execution.

## ⚡ Quick Start - 3-Model Paper Trading Race 🏁

**NEW**: Run 3 different strategies simultaneously to find which works best!

```bash
# 1. Start all 3 models (Conservative, Moderate, Aggressive)
python3 scripts/start_models.py

# 2. Monitor performance in real-time
python3 scripts/monitor_models.py --loop

# 3. After 30 days, pick the winner!
```

**That's it!** All 3 models compete head-to-head for 30 days. Best one wins and goes live.

See: [`PAPER_TRADING_START.md`](./PAPER_TRADING_START.md) for full guide.

### Traditional Single-Model Start

```bash
# 1. Clone repository
git clone https://github.com/b1rdmania/aztec-auction-analysis.git
cd aztec-auction-analysis

# 2. Install execution engine
cd toolkit/execution-engine
pip install -e .

# 3. Install signal generators
cd ../mean-reversion && pip install -e .
cd ../volatility-alerts && pip install -e .
cd ../polymarket-data && pip install -e .

# 4. Start single model paper trading
python agents/systematic_trader.py --mode paper
```

## 📋 What's Inside

This project combines two major components:

### 1. Aztec Auction Analysis (TypeScript)
Real-time on-chain tracker for the Aztec Network token auction
- **Dashboard**: https://aztec-auction-analysis.vercel.app/
- Scans 200,000 blocks for bid events
- Categorizes by price sensitivity
- Provides transparency for Polymarket traders

### 2. Systematic Trading Infrastructure (Python)
Complete autonomous trading system based on behavioral finance research
- Mean reversion signals (Berg & Rietz 2018)
- Volatility monitoring
- Whale tracking
- Automated execution with risk management

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   SIGNAL GENERATION                      │
├─────────────────────────────────────────────────────────┤
│  • Mean Reversion (Longshot bias, Favorite overpricing) │
│  • Volatility Alerts (Price spikes > 10%)               │
│  • Whale Tracker (Smart money following)                │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  RISK MANAGEMENT                         │
├─────────────────────────────────────────────────────────┤
│  • Position limits ($500 max)                            │
│  • Total exposure cap ($2,000)                           │
│  • Drawdown monitoring (25% emergency stop)              │
│  • Spread checks (5% max)                                │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                 POSITION SIZING                          │
├─────────────────────────────────────────────────────────┤
│  • Kelly Criterion (fractional 0.25)                     │
│  • Edge-based calculation                                │
│  • Min/max limits enforced                               │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                    EXECUTION                             │
├─────────────────────────────────────────────────────────┤
│  • Polymarket Agents integration                         │
│  • Paper trading mode                                    │
│  • Live trading with wallet signing                      │
│  • Comprehensive logging                                 │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              MONITORING & REPORTING                      │
├─────────────────────────────────────────────────────────┤
│  • Live dashboard (P&L, positions, trades)               │
│  • SQLite database (queryable history)                   │
│  • JSON logs (audit trail)                               │
│  • Performance metrics (Sharpe, drawdown, win rate)      │
└─────────────────────────────────────────────────────────┘
```

## 📦 Components

### Core Trading Engine
- [`toolkit/execution-engine/`](toolkit/execution-engine/) - Main execution infrastructure
  - `orchestrator.py` - Trading loop coordinator
  - `executor.py` - Polymarket trade execution
  - `risk_manager.py` - Position and exposure limits
  - `position_sizer.py` - Kelly criterion implementation
  - `paper_trader.py` - Simulation mode
  - `trade_logger.py` - Comprehensive logging

### Signal Generators
- [`toolkit/mean-reversion/`](toolkit/mean-reversion/) - Behavioral bias signals
- [`toolkit/volatility-alerts/`](toolkit/volatility-alerts/) - Price spike detection
- [`toolkit/whale-tracker/`](toolkit/whale-tracker/) - Smart money monitoring

### Data Layer
- [`toolkit/polymarket-data/`](toolkit/polymarket-data/) - API client for Polymarket

### Trading Agent
- [`agents/systematic_trader.py`](agents/systematic_trader.py) - Main autonomous trading script

### Monitoring
- [`dashboard/trading/`](dashboard/trading/) - Live trading dashboard
- SQLite database for trade history
- JSON logs for audit trail

## 🎯 Trading Strategy

Based on academic research showing systematic biases in prediction markets:

| Signal Type | Logic | Academic Source |
|-------------|-------|-----------------|
| **Buy Longshot** | Contracts <30% underpriced at 1-3 week horizons | Berg & Rietz (2018) |
| **Sell Favorite** | Contracts >70% overpriced at 1-3 week horizons | Berg & Rietz (2018) |
| **Fade Spike** | Emotional overreaction creates reversion | De Bondt & Thaler (1985) |

### Key Insights
- 86.4% of Polymarket traders lose money
- Political markets more irrational than sports
- Partisan anchoring creates persistent mispricing
- Mean reversion at intermediate horizons (7-21 days)

## 🚀 Usage

### Paper Trading (Recommended First)

```bash
python agents/systematic_trader.py --mode paper --config config/trading.yaml
```

**Run for minimum 30 days** to validate strategy before live trading.

### Monitoring

View dashboard:
```bash
open dashboard/trading/index.html
```

Check performance:
```bash
sqlite3 data/trades.db "SELECT * FROM performance"
```

View logs:
```bash
tail -f logs/trading.log
```

### Emergency Stop

If anything goes wrong:
```bash
python scripts/emergency_stop.py
```

### Live Trading (After Validation)

1. **Setup wallet** (see [`WALLET_SETUP.md`](WALLET_SETUP.md))
2. **Fund with USDC** on Polygon
3. **Start small** (see [`GO_LIVE.md`](GO_LIVE.md))
4. **Monitor closely**

```bash
python agents/systematic_trader.py --mode live --config config/trading.yaml
```

## ⚙️ Configuration

Edit [`config/trading.yaml`](config/trading.yaml):

```yaml
trading:
  mode: paper  # paper | live

risk:
  max_position_usd: 500
  max_total_exposure_usd: 2000
  max_positions: 10
  kelly_fraction: 0.25

signals:
  mean_reversion:
    enabled: true
    min_strength: MODERATE
  volatility:
    enabled: true
    threshold_pct: 10.0

execution:
  check_interval_seconds: 300
  dry_run: true  # Set false for live trading
```

## 📊 Performance Metrics

Target metrics for validation:

| Metric | Target |
|--------|--------|
| Win Rate | > 55% |
| Avg Profit/Trade | > $25 |
| Sharpe Ratio | > 1.0 |
| Max Drawdown | < 20% |
| Execution Success | > 98% |

### 🔥 Lessons from Real Bot Builders

Based on [@the_smart_ape's successful Polymarket bot](https://twitter.com/the_smart_ape/status/2005576087875527082):

**Parameter selection is critical**:
- Conservative params: **+86% ROI** ✅
- Aggressive params: **-50% ROI** ❌

**We've integrated their lessons**:
- ✅ Live data recording (Polymarket's historical API is incomplete)
- ✅ Parameter sweep testing (test multiple configs at once)
- ✅ Realistic slippage simulation (0.2-0.5%)
- ✅ Execution quality tracking

See [`LESSONS_FROM_SMART_APE.md`](LESSONS_FROM_SMART_APE.md) for details.

## 🧪 Testing

### Backtesting on Historical Markets

**⚠️ Important**: Polymarket's historical API returns no data. See [`BACKTEST_REALITY.md`](./BACKTEST_REALITY.md).

```bash
# Option 1: Demo with synthetic data (validate code works)
python3 scripts/demo_backtest.py

# Option 2: Get Adjacent API for real historical data (paid)
export ADJACENT_API_KEY="your_key"
python3 toolkit/execution-engine/src/execution_engine/backtester.py --market trump-2024

# Option 3: Record your own (best - already enabled in paper mode)
python3 agents/systematic_trader.py --mode paper  # Automatically records
```

**Our Recommendation**: Start paper trading NOW. Don't wait for backtests. 30 days of paper trading > theoretical backtests.

See: [`BACKTESTING_GUIDE.md`](./BACKTESTING_GUIDE.md) | [`BACKTEST_REALITY.md`](./BACKTEST_REALITY.md)

### Unit Tests
```bash
cd toolkit/execution-engine
pytest tests/ -v
```

### Integration Tests
```bash
pytest tests/integration/ -v
```

### Parameter Sweep Testing
Test multiple configurations at once:
```bash
python toolkit/execution-engine/src/execution_engine/parameter_sweep.py --days 30
```

This tests 4 configs (ultra-conservative to aggressive) and tells you which works best.

See [`LESSONS_FROM_SMART_APE.md`](LESSONS_FROM_SMART_APE.md) for why this matters.

## 🔒 Security

- Never commit `.env` files
- Store private keys only in environment variables
- Use hardware wallet for large amounts
- Regular backups of trade database
- Monitor for unauthorized transactions

See [`WALLET_SETUP.md`](WALLET_SETUP.md) for complete security guide.

## 📚 Research

Comprehensive research database in [`research/`](research/):
- 6 academic themes
- 718-line quantitative guide
- Political betting strategies
- Polymarket ecosystem analysis

Key documents:
- [`THESIS.md`](THESIS.md) - Core trading thesis
- [`WHITEPAPER.md`](WHITEPAPER.md) - Full technical documentation
- [`research/quant_mean_reversion_guide.md`](research/quant_mean_reversion_guide.md) - Mathematical foundations

## 🚢 Deployment

### Docker

    ```bash
./scripts/deploy-docker.sh
    ```

### Systemd (Linux)

    ```bash
sudo cp scripts/systematic-trader.service /etc/systemd/system/
sudo systemctl enable systematic-trader
sudo systemctl start systematic-trader
```

See [`DEPLOYMENT.md`](DEPLOYMENT.md) for complete guide.

## 📈 Roadmap

- [x] Core execution engine
- [x] Mean reversion signals
- [x] Paper trading
- [x] Risk management
- [x] Logging & monitoring
- [x] Dashboard
- [x] Unit tests
- [x] Integration tests
- [x] Deployment configs
- [ ] **Paper trade validation (30 days)**
- [ ] Live trading launch
- [ ] Historical backtesting (requires Adjacent API)
- [ ] Advanced signal combinations
- [ ] Machine learning enhancements
- [ ] Multi-market arbitrage

## ⚠️ Disclaimer

**This is experimental trading software.**

- Not financial advice
- Use at your own risk
- No guarantees of profit
- Can result in loss of capital
- Thoroughly test before live trading

## 📄 License

MIT License - See [LICENSE](LICENSE.md)

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md)

## 📞 Support

- **Issues**: Open a GitHub issue
- **Security**: Email security concerns privately
- **Emergency**: Use emergency stop script

## 🙏 Acknowledgments

- Polymarket for the prediction market platform
- Academic researchers (Berg, Rietz, De Bondt, Thaler, Munger)
- Open source community

---

**Built with systematic discipline. Trade with caution. 🎯**
