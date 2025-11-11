-- X402 Payment Protocol Tables
-- Migration: 003_create_x402_tables
-- Created: 2025-11-11

-- Table: x402_payments
-- Stores all X402 payment authorizations and their settlement status
CREATE TABLE IF NOT EXISTS x402_payments (
  id SERIAL PRIMARY KEY,
  
  -- Authorization details
  nonce VARCHAR(66) UNIQUE NOT NULL,
  signer VARCHAR(42) NOT NULL,
  receiver VARCHAR(42) NOT NULL,
  amount NUMERIC(78, 0) NOT NULL, -- Support up to uint256
  token VARCHAR(42) NOT NULL,
  valid_after BIGINT NOT NULL DEFAULT 0,
  valid_before BIGINT NOT NULL,
  
  -- Signature
  signature TEXT NOT NULL,
  
  -- Settlement status
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  -- Status values: 'pending', 'batched', 'settled', 'failed', 'expired'
  
  tx_hash VARCHAR(66),
  batch_id INTEGER,
  
  -- Metadata
  api_path VARCHAR(255),
  user_id INTEGER,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  batched_at TIMESTAMP,
  settled_at TIMESTAMP,
  
  -- Indexes
  CONSTRAINT fk_batch FOREIGN KEY (batch_id) REFERENCES x402_batches(id)
);

-- Indexes for x402_payments
CREATE INDEX idx_x402_payments_nonce ON x402_payments(nonce);
CREATE INDEX idx_x402_payments_signer ON x402_payments(signer);
CREATE INDEX idx_x402_payments_status ON x402_payments(status);
CREATE INDEX idx_x402_payments_created_at ON x402_payments(created_at);
CREATE INDEX idx_x402_payments_batch_id ON x402_payments(batch_id);

-- Table: x402_batches
-- Stores batch settlement transactions
CREATE TABLE IF NOT EXISTS x402_batches (
  id SERIAL PRIMARY KEY,
  
  -- Batch details
  payment_count INTEGER NOT NULL,
  total_amount NUMERIC(78, 0) NOT NULL,
  token VARCHAR(42) NOT NULL,
  
  -- Transaction details
  tx_hash VARCHAR(66) UNIQUE,
  gas_used BIGINT,
  gas_price NUMERIC(78, 0),
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  -- Status values: 'pending', 'submitted', 'confirmed', 'failed'
  
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  submitted_at TIMESTAMP,
  confirmed_at TIMESTAMP
);

-- Indexes for x402_batches
CREATE INDEX idx_x402_batches_status ON x402_batches(status);
CREATE INDEX idx_x402_batches_created_at ON x402_batches(created_at);
CREATE INDEX idx_x402_batches_tx_hash ON x402_batches(tx_hash);

-- Table: x402_api_pricing
-- Stores pricing configuration for different API endpoints
CREATE TABLE IF NOT EXISTS x402_api_pricing (
  id SERIAL PRIMARY KEY,
  
  -- API endpoint
  api_path VARCHAR(255) UNIQUE NOT NULL,
  method VARCHAR(10) NOT NULL DEFAULT 'GET',
  
  -- Pricing
  price NUMERIC(78, 0) NOT NULL,
  token VARCHAR(42) NOT NULL,
  
  -- Configuration
  expiry_duration INTEGER NOT NULL DEFAULT 3600, -- seconds
  enabled BOOLEAN NOT NULL DEFAULT true,
  
  -- Metadata
  description TEXT,
  category VARCHAR(50),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for x402_api_pricing
CREATE INDEX idx_x402_api_pricing_api_path ON x402_api_pricing(api_path);
CREATE INDEX idx_x402_api_pricing_enabled ON x402_api_pricing(enabled);

-- Table: x402_nonces
-- Tracks used nonces to prevent replay attacks
CREATE TABLE IF NOT EXISTS x402_nonces (
  nonce VARCHAR(66) PRIMARY KEY,
  used_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

-- Index for x402_nonces
CREATE INDEX idx_x402_nonces_expires_at ON x402_nonces(expires_at);

-- Function: Clean up expired nonces
CREATE OR REPLACE FUNCTION cleanup_expired_nonces()
RETURNS void AS $$
BEGIN
  DELETE FROM x402_nonces WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Insert default API pricing
INSERT INTO x402_api_pricing (api_path, method, price, token, description, category)
VALUES
  ('/api/v1/stream-payment', 'POST', '1000000', '0x036CbD53842c5426634e7929541eC2318f3dCF7e', 'Create stream payment', 'stream'),
  ('/api/v1/stream-payment/batch', 'POST', '5000000', '0x036CbD53842c5426634e7929541eC2318f3dCF7e', 'Batch create stream payments', 'stream'),
  ('/api/v1/analytics/report', 'GET', '500000', '0x036CbD53842c5426634e7929541eC2318f3dCF7e', 'Generate analytics report', 'analytics')
ON CONFLICT (api_path) DO NOTHING;

-- Comments
COMMENT ON TABLE x402_payments IS 'Stores X402 payment authorizations';
COMMENT ON TABLE x402_batches IS 'Stores batch settlement transactions';
COMMENT ON TABLE x402_api_pricing IS 'API endpoint pricing configuration';
COMMENT ON TABLE x402_nonces IS 'Tracks used nonces for replay attack prevention';
