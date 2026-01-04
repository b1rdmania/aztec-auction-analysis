#!/usr/bin/env python3
"""
Multi-Model Dashboard API

FastAPI backend that serves trading data for the web dashboard.
"""

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
from pathlib import Path
from datetime import datetime, timedelta
from typing import List, Dict
import json

app = FastAPI(title="Polymarket Trading Dashboard")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).parent.parent
MODELS = ['conservative', 'moderate', 'aggressive']


def get_model_stats(model_name: str) -> Dict:
    """Get statistics for a model."""
    db_path = BASE_DIR / 'data' / f'trades_{model_name}.db'
    
    if not db_path.exists():
        return {
            'model': model_name,
            'status': 'No data yet',
            'total_trades': 0,
            'open_positions': 0,
            'winners': 0,
            'losers': 0,
            'win_rate': 0,
            'total_pnl': 0,
            'avg_pnl': 0,
            'best_trade': 0,
            'worst_trade': 0,
            'today_trades': 0,
            'today_pnl': 0,
            'last_trade': None,
        }
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Overall stats
        cursor.execute("""
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) as winners,
                SUM(CASE WHEN pnl <= 0 THEN 1 ELSE 0 END) as losers,
                SUM(pnl) as total_pnl,
                AVG(pnl) as avg_pnl,
                MAX(pnl) as best,
                MIN(pnl) as worst
            FROM trades WHERE status = 'CLOSED'
        """)
        
        row = cursor.fetchone()
        total = row[0] or 0
        winners = row[1] or 0
        losers = row[2] or 0
        total_pnl = row[3] or 0
        avg_pnl = row[4] or 0
        best = row[5] or 0
        worst = row[6] or 0
        
        # Open positions
        cursor.execute("SELECT COUNT(*) FROM trades WHERE status = 'OPEN'")
        open_positions = cursor.fetchone()[0] or 0
        
        # Today's stats
        today = datetime.now().date()
        cursor.execute("""
            SELECT COUNT(*), SUM(pnl) 
            FROM trades 
            WHERE DATE(created_at) = ? AND status = 'CLOSED'
        """, (today,))
        
        row = cursor.fetchone()
        today_trades = row[0] or 0
        today_pnl = row[1] or 0
        
        # Last trade
        cursor.execute("""
            SELECT market_question, pnl, created_at, status
            FROM trades 
            ORDER BY created_at DESC 
            LIMIT 1
        """)
        
        last_trade_row = cursor.fetchone()
        last_trade = None
        if last_trade_row:
            last_trade = {
                'market': last_trade_row[0],
                'pnl': last_trade_row[1],
                'time': last_trade_row[2],
                'status': last_trade_row[3]
            }
        
        conn.close()
        
        return {
            'model': model_name,
            'status': 'Running',
            'total_trades': total,
            'open_positions': open_positions,
            'winners': winners,
            'losers': losers,
            'win_rate': (winners / total * 100) if total > 0 else 0,
            'total_pnl': total_pnl,
            'avg_pnl': avg_pnl,
            'best_trade': best,
            'worst_trade': worst,
            'today_trades': today_trades,
            'today_pnl': today_pnl,
            'last_trade': last_trade,
        }
    
    except Exception as e:
        return {
            'model': model_name,
            'status': f'Error: {e}',
            'total_trades': 0,
            'winners': 0,
            'losers': 0,
            'win_rate': 0,
            'total_pnl': 0,
        }


def get_recent_trades(model_name: str, limit: int = 20) -> List[Dict]:
    """Get recent trades for a model."""
    db_path = BASE_DIR / 'data' / f'trades_{model_name}.db'
    
    if not db_path.exists():
        return []
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT 
                market_question,
                side,
                size,
                price,
                pnl,
                status,
                created_at,
                updated_at
            FROM trades
            ORDER BY created_at DESC
            LIMIT ?
        """, (limit,))
        
        trades = []
        for row in cursor.fetchall():
            trades.append({
                'market': row[0],
                'side': row[1],
                'size': row[2],
                'price': row[3],
                'pnl': row[4],
                'status': row[5],
                'created_at': row[6],
                'updated_at': row[7],
            })
        
        conn.close()
        return trades
    
    except Exception as e:
        return []


@app.get("/api/models")
async def get_all_models():
    """Get stats for all models."""
    return {
        'models': [get_model_stats(model) for model in MODELS],
        'timestamp': datetime.now().isoformat()
    }


@app.get("/api/model/{model_name}")
async def get_model(model_name: str):
    """Get detailed stats for one model."""
    if model_name not in MODELS:
        return {'error': 'Model not found'}
    
    return {
        'stats': get_model_stats(model_name),
        'recent_trades': get_recent_trades(model_name),
        'timestamp': datetime.now().isoformat()
    }


@app.get("/api/comparison")
async def get_comparison():
    """Get comparison data for all models."""
    models = [get_model_stats(model) for model in MODELS]
    
    return {
        'models': models,
        'aggregate': {
            'total_trades': sum(m['total_trades'] for m in models),
            'total_pnl': sum(m['total_pnl'] for m in models),
            'today_trades': sum(m['today_trades'] for m in models),
            'today_pnl': sum(m['today_pnl'] for m in models),
        },
        'timestamp': datetime.now().isoformat()
    }


@app.get("/api/health")
async def health():
    """Health check endpoint."""
    # Check if models are running
    pids_file = BASE_DIR / 'data' / 'model_pids.txt'
    running = pids_file.exists()
    
    return {
        'status': 'ok',
        'models_running': running,
        'timestamp': datetime.now().isoformat()
    }


@app.get("/")
async def root():
    """Serve the dashboard."""
    dashboard_path = BASE_DIR / 'dashboard' / 'trading' / 'index.html'
    if dashboard_path.exists():
        return FileResponse(dashboard_path)
    return {"message": "Dashboard not found. Run from project root."}


# Mount static files
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "dashboard" / "trading")), name="static")


if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Trading Dashboard API...")
    print("📊 Dashboard: http://localhost:8000")
    print("🔌 API Docs: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000)

