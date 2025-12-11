/**
 * Signal Dashboard - Mean Reversion Signal Detection + Paper Trade Logging
 * 
 * Based on Berg & Rietz (2018) research:
 * - Longshots (<30%) tend to be underpriced at 1-3 week horizons → BUY
 * - Favorites (>70%) tend to be overpriced at 1-3 week horizons → SELL
 */

const GAMMA_API = 'https://gamma-api.polymarket.com';
const STORAGE_KEY = 'polymarket_paper_trades';

// Signal detection configuration
const CONFIG = {
    minVolume: 5000,           // Minimum 24h volume
    longShotThreshold: 0.30,   // Below this = longshot
    favoriteThreshold: 0.70,   // Above this = favorite
    minHorizonDays: 7,         // Minimum days to resolution
    maxHorizonDays: 30,        // Maximum days to resolution
    mispricingThresholds: {
        weak: 0.03,            // 3% mispricing
        moderate: 0.07,        // 7% mispricing
        strong: 0.12           // 12% mispricing
    }
};

// ==================== DATA FETCHING ====================

async function fetchMarkets() {
    try {
        const response = await fetch(`${GAMMA_API}/markets?active=true&limit=100`);
        if (!response.ok) throw new Error('Failed to fetch markets');
        return await response.json();
    } catch (error) {
        console.error('Error fetching markets:', error);
        throw error;
    }
}

// ==================== SIGNAL DETECTION ====================

function analyzeMarket(market) {
    // Skip if no price data
    const prices = market.outcomePrices;
    if (!prices || prices.length === 0) return null;

    // Get YES price (first outcome)
    const price = parseFloat(prices[0]);
    if (isNaN(price) || price <= 0 || price >= 1) return null;

    // Check volume threshold
    const volume = parseFloat(market.volume24hr || 0);
    if (volume < CONFIG.minVolume) return null;

    // Check horizon
    const horizonDays = getHorizonDays(market);
    if (horizonDays < CONFIG.minHorizonDays || horizonDays > CONFIG.maxHorizonDays) return null;

    // Determine signal based on Berg & Rietz thesis
    let signal = null;

    if (price < CONFIG.longShotThreshold) {
        // Longshot: typically underpriced → BUY
        const mispricing = estimateMispricing(price, 'longshot', horizonDays);
        signal = {
            direction: 'BUY',
            mispricing,
            thesis: 'Longshot underpriced at intermediate horizon'
        };
    } else if (price > CONFIG.favoriteThreshold) {
        // Favorite: typically overpriced → SELL
        const mispricing = estimateMispricing(price, 'favorite', horizonDays);
        signal = {
            direction: 'SELL',
            mispricing,
            thesis: 'Favorite overpriced at intermediate horizon'
        };
    }

    if (!signal || signal.mispricing < CONFIG.mispricingThresholds.weak) {
        return null;
    }

    // Determine strength
    let strength = 'weak';
    if (signal.mispricing >= CONFIG.mispricingThresholds.strong) {
        strength = 'strong';
    } else if (signal.mispricing >= CONFIG.mispricingThresholds.moderate) {
        strength = 'moderate';
    }

    return {
        marketId: market.id,
        conditionId: market.conditionId,
        question: market.question,
        direction: signal.direction,
        price: price,
        volume24h: volume,
        horizonDays: Math.round(horizonDays),
        mispricing: signal.mispricing,
        strength: strength,
        thesis: signal.thesis,
        timestamp: new Date().toISOString(),
        tokenId: market.clobTokenIds?.[0] || ''
    };
}

function estimateMispricing(price, type, horizonDays) {
    // Simplified mispricing estimation based on Berg & Rietz findings
    // The bias is strongest at 1-3 week horizons

    let baseMispricing;

    if (type === 'longshot') {
        // Longshots more underpriced at lower prices
        baseMispricing = (CONFIG.longShotThreshold - price) * 0.5;
    } else {
        // Favorites more overpriced at higher prices
        baseMispricing = (price - CONFIG.favoriteThreshold) * 0.4;
    }

    // Horizon adjustment: strongest at 10-21 days
    const horizonFactor = 1 - Math.abs(horizonDays - 14) / 21;

    return Math.max(0, baseMispricing * (0.7 + 0.6 * horizonFactor));
}

function getHorizonDays(market) {
    const endDate = market.endDate || market.endDateIso;
    if (!endDate) return 999;

    const end = new Date(endDate);
    const now = new Date();
    const diffMs = end - now;

    return diffMs / (1000 * 60 * 60 * 24);
}

// ==================== PAPER TRADE LOGGING ====================

function getLoggedSignals() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

function saveLoggedSignals(signals) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(signals));
}

function logSignal(signal) {
    const signals = getLoggedSignals();

    // Check if already logged (by market ID)
    if (signals.some(s => s.marketId === signal.marketId)) {
        return false;
    }

    signals.unshift({
        ...signal,
        loggedAt: new Date().toISOString(),
        entryPrice: signal.price,
        status: 'pending',
        exitPrice: null,
        pnl: null
    });

    saveLoggedSignals(signals);
    return true;
}

function clearHistory() {
    if (confirm('Clear all paper trade history?')) {
        localStorage.removeItem(STORAGE_KEY);
        renderHistory();
        updateStats();
    }
}

async function updateSignalOutcomes() {
    const signals = getLoggedSignals();
    let updated = false;

    for (const signal of signals) {
        if (signal.status !== 'pending') continue;

        try {
            const response = await fetch(`${GAMMA_API}/markets/${signal.marketId}`);
            if (!response.ok) continue;

            const market = await response.json();

            // Check if resolved
            if (market.closed || market.resolved) {
                const finalPrice = parseFloat(market.outcomePrices?.[0] || 0);
                signal.exitPrice = finalPrice;
                signal.status = 'resolved';

                // Calculate P&L (assuming $100 position)
                const positionSize = 100;
                if (signal.direction === 'BUY') {
                    signal.pnl = (finalPrice - signal.entryPrice) * positionSize;
                } else {
                    signal.pnl = (signal.entryPrice - finalPrice) * positionSize;
                }

                updated = true;
            } else {
                // Update current price for visualization
                signal.currentPrice = parseFloat(market.outcomePrices?.[0] || signal.entryPrice);
            }
        } catch (error) {
            console.warn('Error updating signal:', error);
        }
    }

    if (updated) {
        saveLoggedSignals(signals);
    }

    return signals;
}

// ==================== UI RENDERING ====================

function renderSignals(signals) {
    const container = document.getElementById('signals-container');
    const loggedIds = new Set(getLoggedSignals().map(s => s.marketId));

    if (signals.length === 0) {
        container.innerHTML = '<div class="loading">No signals found matching criteria</div>';
        return;
    }

    container.innerHTML = signals.map(signal => `
        <div class="signal-card ${signal.direction.toLowerCase()}">
            <span class="signal-direction ${signal.direction.toLowerCase()}">${signal.direction}</span>
            <div class="signal-market">${truncate(signal.question, 80)}</div>
            <span class="signal-strength ${signal.strength}">${signal.strength}</span>
            <div class="signal-meta">
                <div class="signal-meta-item">
                    <div class="signal-meta-label">Price</div>
                    <div class="signal-meta-value">${(signal.price * 100).toFixed(0)}¢</div>
                </div>
                <div class="signal-meta-item">
                    <div class="signal-meta-label">Horizon</div>
                    <div class="signal-meta-value">${signal.horizonDays}d</div>
                </div>
                <div class="signal-meta-item">
                    <div class="signal-meta-label">Volume</div>
                    <div class="signal-meta-value">$${formatNumber(signal.volume24h)}</div>
                </div>
            </div>
            <button 
                class="log-btn ${loggedIds.has(signal.marketId) ? 'logged' : ''}" 
                onclick="handleLog('${signal.marketId}')"
                ${loggedIds.has(signal.marketId) ? 'disabled' : ''}>
                ${loggedIds.has(signal.marketId) ? '✓ Logged' : 'Log Signal'}
            </button>
        </div>
    `).join('');
}

function renderHistory() {
    const tbody = document.getElementById('history-body');
    const signals = getLoggedSignals();

    if (signals.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; opacity: 0.5;">No signals logged yet</td></tr>';
        return;
    }

    tbody.innerHTML = signals.map(signal => {
        const currentOrExit = signal.status === 'resolved'
            ? `${(signal.exitPrice * 100).toFixed(0)}¢`
            : `${((signal.currentPrice || signal.entryPrice) * 100).toFixed(0)}¢`;

        let pnlDisplay = '--';
        let pnlClass = 'outcome-pending';

        if (signal.status === 'resolved') {
            pnlDisplay = signal.pnl >= 0 ? `+$${signal.pnl.toFixed(2)}` : `-$${Math.abs(signal.pnl).toFixed(2)}`;
            pnlClass = signal.pnl >= 0 ? 'outcome-win' : 'outcome-loss';
        }

        return `
            <tr>
                <td>${formatDate(signal.loggedAt)}</td>
                <td style="max-width: 300px;">${truncate(signal.question, 50)}</td>
                <td><span class="signal-direction ${signal.direction.toLowerCase()}" style="position: static; font-size: 0.7rem;">${signal.direction}</span></td>
                <td>${(signal.entryPrice * 100).toFixed(0)}¢</td>
                <td>${currentOrExit}</td>
                <td class="${pnlClass}">${pnlDisplay}</td>
                <td class="${signal.status === 'resolved' ? (signal.pnl >= 0 ? 'outcome-win' : 'outcome-loss') : 'outcome-pending'}">
                    ${signal.status === 'resolved' ? (signal.pnl >= 0 ? 'WIN' : 'LOSS') : 'Pending'}
                </td>
            </tr>
        `;
    }).join('');
}

function updateStats() {
    const signals = getLoggedSignals();
    const resolved = signals.filter(s => s.status === 'resolved');
    const wins = resolved.filter(s => s.pnl > 0);
    const totalPnl = resolved.reduce((sum, s) => sum + (s.pnl || 0), 0);

    document.getElementById('stat-total').textContent = signals.length;
    document.getElementById('stat-resolved').textContent = resolved.length;
    document.getElementById('stat-winrate').textContent = resolved.length > 0
        ? `${((wins.length / resolved.length) * 100).toFixed(0)}%`
        : '--';
    document.getElementById('stat-pnl').textContent = totalPnl >= 0
        ? `+$${totalPnl.toFixed(0)}`
        : `-$${Math.abs(totalPnl).toFixed(0)}`;
}

// ==================== HELPERS ====================

function truncate(str, len) {
    return str.length > len ? str.substring(0, len) + '...' : str;
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
    return num.toFixed(0);
}

function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ==================== MAIN ====================

let currentSignals = [];

async function loadSignals() {
    const container = document.getElementById('signals-container');
    container.innerHTML = '<div class="loading">Scanning markets...</div>';

    try {
        // Fetch markets
        const markets = await fetchMarkets();

        // Analyze each market
        const signals = markets
            .map(analyzeMarket)
            .filter(Boolean)
            .sort((a, b) => b.mispricing - a.mispricing);

        currentSignals = signals;

        // Render
        renderSignals(signals);
        document.getElementById('last-updated').textContent = new Date().toLocaleTimeString();

        // Update outcomes for logged signals
        await updateSignalOutcomes();
        renderHistory();
        updateStats();

    } catch (error) {
        container.innerHTML = `<div class="error-msg">Error: ${error.message}. Try refreshing.</div>`;
    }
}

function handleLog(marketId) {
    const signal = currentSignals.find(s => s.marketId === marketId);
    if (signal && logSignal(signal)) {
        renderSignals(currentSignals);
        renderHistory();
        updateStats();
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadSignals();
    renderHistory();
    updateStats();
});

// Expose for onclick handlers
window.loadSignals = loadSignals;
window.handleLog = handleLog;
window.clearHistory = clearHistory;
