-- Migration: Create Netting Engine Tables
-- Date: 2025-11-08
-- Description: Create tables for trades, settlement_batches, and participants

-- Trades table: stores all incoming trade instructions
CREATE TABLE IF NOT EXISTS trades (
    id SERIAL PRIMARY KEY,
    trade_id UUID UNIQUE NOT NULL,
    payer_address VARCHAR(42) NOT NULL,
    receiver_address VARCHAR(42) NOT NULL,
    amount NUMERIC(38, 18) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USDC',
    settlement_batch_id INT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Settlement batches table: stores netting results and signatures
CREATE TABLE IF NOT EXISTS settlement_batches (
    id SERIAL PRIMARY KEY,
    batch_id INT UNIQUE NOT NULL,
    window_start TIMESTAMP WITH TIME ZONE NOT NULL,
    window_end TIMESTAMP WITH TIME ZONE NOT NULL,
    positions JSONB NOT NULL,
    positions_hash VARCHAR(66) NOT NULL,
    signature VARCHAR(132) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'submitted',
    tx_hash VARCHAR(66),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Participants table: caches participant info from ClearingHouse.sol
CREATE TABLE IF NOT EXISTS participants (
    address VARCHAR(42) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    registered_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_batch_id ON trades(settlement_batch_id);
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON trades(created_at);
CREATE INDEX IF NOT EXISTS idx_settlement_batches_status ON settlement_batches(status);
CREATE INDEX IF NOT EXISTS idx_settlement_batches_window_end ON settlement_batches(window_end);

-- Comments
COMMENT ON TABLE trades IS 'Stores all incoming trade instructions from participants';
COMMENT ON TABLE settlement_batches IS 'Stores calculated net positions and settlement metadata';
COMMENT ON TABLE participants IS 'Caches participant information from ClearingHouse smart contract';
