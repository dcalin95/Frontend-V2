-- 📊 Migration: Create AI Trading Tables
-- Description: Create tables pentru AI Trading system (trades, signals, strategies, performance)
-- Date: 2026-01-08

-- Trades Table
CREATE TABLE IF NOT EXISTS trades (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  signal_id INTEGER REFERENCES signals(id) ON DELETE SET NULL,
  token_in VARCHAR(50) NOT NULL,
  token_out VARCHAR(50) NOT NULL,
  amount_in DECIMAL(18, 8) NOT NULL,
  amount_out DECIMAL(18, 8),
  entry_price DECIMAL(18, 8) NOT NULL,
  exit_price DECIMAL(18, 8),
  stop_loss DECIMAL(18, 8),
  take_profit DECIMAL(18, 8),
  tx_hash VARCHAR(66) UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'executed', 'failed', 'closed')),
  pnl DECIMAL(18, 8),
  created_at TIMESTAMP DEFAULT NOW(),
  executed_at TIMESTAMP,
  closed_at TIMESTAMP
);

CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_status ON trades(status);
CREATE INDEX idx_trades_created_at ON trades(created_at);
CREATE INDEX idx_trades_token_in_out ON trades(token_in, token_out);

-- Signals Table
CREATE TABLE IF NOT EXISTS signals (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  token VARCHAR(50) NOT NULL,
  signal VARCHAR(10) NOT NULL CHECK (signal IN ('buy', 'sell', 'hold')),
  confidence DECIMAL(5, 4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  reasoning TEXT,
  entry_price DECIMAL(18, 8),
  stop_loss DECIMAL(18, 8),
  take_profit DECIMAL(18, 8),
  priority INTEGER DEFAULT 50,
  valid BOOLEAN DEFAULT true,
  validation_errors JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_signals_user_id ON signals(user_id);
CREATE INDEX idx_signals_token ON signals(token);
CREATE INDEX idx_signals_signal ON signals(signal);
CREATE INDEX idx_signals_created_at ON signals(created_at);
CREATE INDEX idx_signals_valid ON signals(valid);

-- Strategies Table
CREATE TABLE IF NOT EXISTS strategies (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('trend-following', 'mean-reversion', 'arbitrage', 'volume-analysis', 'market-making')),
  config JSONB NOT NULL DEFAULT '{}',
  enabled BOOLEAN DEFAULT true,
  risk_level VARCHAR(20) DEFAULT 'balanced' CHECK (risk_level IN ('conservative', 'balanced', 'aggressive')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_strategies_user_id ON strategies(user_id);
CREATE INDEX idx_strategies_type ON strategies(type);
CREATE INDEX idx_strategies_enabled ON strategies(enabled);
CREATE INDEX idx_strategies_created_at ON strategies(created_at);

-- Performance Table
CREATE TABLE IF NOT EXISTS performance (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  total_profit DECIMAL(18, 8) DEFAULT 0,
  total_loss DECIMAL(18, 8) DEFAULT 0,
  win_rate DECIMAL(5, 4),
  profit_factor DECIMAL(10, 4),
  sharpe_ratio DECIMAL(10, 4),
  max_drawdown DECIMAL(5, 4),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_performance_user_id ON performance(user_id);
CREATE INDEX idx_performance_period_start ON performance(period_start);
CREATE INDEX idx_performance_period_end ON performance(period_end);
CREATE INDEX idx_performance_created_at ON performance(created_at);

-- Bots Table (pentru tracking bot instances)
CREATE TABLE IF NOT EXISTS bots (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  bot_id VARCHAR(255) UNIQUE NOT NULL,
  config JSONB NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'stopped' CHECK (status IN ('running', 'stopped', 'error')),
  started_at TIMESTAMP,
  stopped_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_bots_user_id ON bots(user_id);
CREATE INDEX idx_bots_bot_id ON bots(bot_id);
CREATE INDEX idx_bots_status ON bots(status);
CREATE INDEX idx_bots_created_at ON bots(created_at);

