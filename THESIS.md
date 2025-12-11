# The Alpha Thesis

## Political Prediction Markets Are Structurally Irrational

---

### The Edge

Prediction markets are supposed to be efficient.  
They're not.

Political markets in particular exhibit **consistent, measurable, exploitable irrationality** because of:

| Bias | Effect | Exploitability |
|------|--------|----------------|
| **Partisan anchoring** | People bet their preferences, not beliefs | Prices drift from fundamentals |
| **Emotional overreaction** | Panic selling, FOMO buying on news | Mean reversion windows |
| **Thin liquidity** | Small trades move prices disproportionately | Whales create dislocations |
| **Slow correction** | No arbitrage mechanism, no shorting | Mispricings persist |
| **Longshot bias** | Favorites overpriced, longshots underpriced | Systematic edge at extremes |

**86.4% of Polymarket users lose money.**  
The winners aren't smarter. They're systematic.

---

### The Thesis

> **We can systematically trade emotional overreaction in prediction markets using a detection system that identifies mispricing, measures drift, and times mean reversion.**

That's the entire product.  
Everything else is scaffolding.

---

### What Creates the Opportunity

**Political markets are more irrational than sports markets because:**

1. **Participants bet their identity**, not their analysis
2. **Events are rare** — less learning, more anchoring  
3. **Liquidity is thin** — prices overshoot on small volume
4. **No natural corrective mechanism** — no sophisticated market makers, no short selling
5. **Information is asymmetric** — insiders exist, but sentiment moves faster than facts

**Result:** Prices deviate from fundamentals. They stay wrong. Then they correct.

The correction is the trade.

---

### The System

We built a machine that detects those moments.

**It does four things:**

| Capability | What It Detects |
|------------|-----------------|
| **Volatility detection** | Price spikes > threshold in < time window |
| **Mean reversion signals** | Longshots underpriced, favorites overpriced at 1-3 week horizons |
| **Whale tracking** | Large trades that move markets before retail reacts |
| **Drift measurement** | Gap between sentiment and price stability |

**The output is a trade signal:**  
- Which market  
- Which direction  
- Entry price  
- Expected reversion time  
- Position size (Kelly-adjusted)

---

### The Academic Foundation

This isn't a hunch. It's backed by research:

| Source | Finding |
|--------|---------|
| **Berg & Rietz (2018)** | Longshots systematically underpriced at intermediate horizons |
| **De Bondt & Thaler (1985)** | Extreme price moves followed by predictable reversals |
| **Munger (1995)** | 25 cognitive biases that explain persistent irrationality |

The theory is proven.  
What's been missing is the detection infrastructure.

Now we have it.

---

### Proof of Concept: Aztec Auction

We applied this framework to the Aztec Network token auction:

- Scanned 200,000 blocks of on-chain data
- Classified ~20,000 ETH of commitments by price sensitivity
- Published real-time dashboard showing "sticky floor" demand
- Created **asymmetric information** that Polymarket traders used

**Result:** An information tool that induced trades.

This is replicable. Any auction. Any token sale. Any event with on-chain data and a prediction market.

---

### The Plan

**Phase 1: Validate (Now)**  
- Paper trade mean reversion signals  
- Track win rate, expected value, drawdown  
- Benchmark against random entry  

**Phase 2: Prove (30 days)**  
- Publish daily signal dashboards  
- Build public track record  
- Document edge decay  

**Phase 3: Monetize (60-90 days)**  
- **Option A:** Trade own capital  
- **Option B:** Launch managed fund via PolyFund  
- **Option C:** Sell signal API  
- **Option D:** License to trading desks  

We pick one after validation. Not before.

---

### What We Have Today

| Component | Status | Purpose |
|-----------|--------|---------|
| Data pipeline | ✅ Live | Pull real-time prices, orderbooks |
| Volatility monitor | ✅ Built | Detect price spikes |
| Signal generator | ✅ Built | Mean reversion opportunities |
| Whale tracker | ✅ Built | Smart money detection |
| Auction scanner | ✅ Deployed | Asymmetric info extraction |
| Research database | ✅ Complete | 6 academic themes, quantitative guide |

**Total infrastructure:** ~1,700 lines of production Python, 300 lines TypeScript, deployed dashboard.

---

### What's Missing

| Gap | Impact | Fix |
|-----|--------|-----|
| Historical backtest | Can't quantify expected return | Adjacent API key ($TBD) |
| Live P&L tracking | No proof of edge | Paper trade for 30 days |
| Distribution | No users yet | Landing page, signal dashboard |

---

### The Ask

Depends on the audience:

**For a partner:**  
> "We have a thesis, a system, and infrastructure. We need capital and distribution."

**For a fund:**  
> "We have a systematic approach to an inefficient market. We want to run a strategy."

**For ourselves:**  
> "Validate first. Trade second. Monetize third."

---

### Bottom Line

Prediction markets are emotional, slow, and exploitable.

We've built the detection layer.

Now we prove it works.

---

*Updated: 2025-12-11*
