-- Protocol Bank Database Initialization Script
-- Version: 1.0
-- Date: 2025-11-14

-- ============================================================================
-- 1. Users and Authentication
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) UNIQUE NOT NULL,
  email VARCHAR(255),
  username VARCHAR(100),
  role VARCHAR(50) DEFAULT 'user',
  kyc_status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP
);

CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_users_email ON users(email);

-- ============================================================================
-- 2. Stream Payments
-- ============================================================================

CREATE TABLE IF NOT EXISTS stream_payments (
  id SERIAL PRIMARY KEY,
  stream_id VARCHAR(66) UNIQUE NOT NULL,
  sender_address VARCHAR(42) NOT NULL,
  recipient_address VARCHAR(42) NOT NULL,
  token_address VARCHAR(42) NOT NULL,
  token_symbol VARCHAR(10),
  amount DECIMAL(36, 18) NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  duration INTEGER NOT NULL,
  flow_rate DECIMAL(36, 18) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  withdrawn_amount DECIMAL(36, 18) DEFAULT 0,
  description TEXT,
  category VARCHAR(50),
  tx_hash VARCHAR(66),
  block_number BIGINT,
  network VARCHAR(50) DEFAULT 'sepolia',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stream_sender ON stream_payments(sender_address);
CREATE INDEX idx_stream_recipient ON stream_payments(recipient_address);
CREATE INDEX idx_stream_status ON stream_payments(status);
CREATE INDEX idx_stream_network ON stream_payments(network);

-- ============================================================================
-- 3. Batch Payments
-- ============================================================================

CREATE TABLE IF NOT EXISTS batch_payments (
  id SERIAL PRIMARY KEY,
  batch_id VARCHAR(66) UNIQUE NOT NULL,
  sender_address VARCHAR(42) NOT NULL,
  total_amount DECIMAL(36, 18) NOT NULL,
  recipient_count INTEGER NOT NULL,
  token_address VARCHAR(42) NOT NULL,
  token_symbol VARCHAR(10),
  status VARCHAR(20) DEFAULT 'pending',
  use_x402 BOOLEAN DEFAULT true,
  gas_saved DECIMAL(36, 18),
  tx_hash VARCHAR(66),
  block_number BIGINT,
  network VARCHAR(50) DEFAULT 'baseSepolia',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  executed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS batch_payment_items (
  id SERIAL PRIMARY KEY,
  batch_id VARCHAR(66) NOT NULL REFERENCES batch_payments(batch_id) ON DELETE CASCADE,
  recipient_address VARCHAR(42) NOT NULL,
  amount DECIMAL(36, 18) NOT NULL,
  category VARCHAR(50),
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  tx_hash VARCHAR(66),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_batch_sender ON batch_payments(sender_address);
CREATE INDEX idx_batch_status ON batch_payments(status);
CREATE INDEX idx_batch_network ON batch_payments(network);
CREATE INDEX idx_batch_items_batch ON batch_payment_items(batch_id);

-- ============================================================================
-- 4. Scheduled Payments
-- ============================================================================

CREATE TABLE IF NOT EXISTS scheduled_payments (
  id SERIAL PRIMARY KEY,
  flow_id VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sender_address VARCHAR(42) NOT NULL,
  flow_data JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  next_execution TIMESTAMP,
  last_execution TIMESTAMP,
  execution_count INTEGER DEFAULT 0,
  network VARCHAR(50) DEFAULT 'baseSepolia',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_scheduled_sender ON scheduled_payments(sender_address);
CREATE INDEX idx_scheduled_status ON scheduled_payments(status);
CREATE INDEX idx_scheduled_next_execution ON scheduled_payments(next_execution);

-- ============================================================================
-- 5. Transactions
-- ============================================================================

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  tx_hash VARCHAR(66) UNIQUE NOT NULL,
  from_address VARCHAR(42) NOT NULL,
  to_address VARCHAR(42) NOT NULL,
  amount DECIMAL(36, 18) NOT NULL,
  token_address VARCHAR(42),
  token_symbol VARCHAR(10),
  tx_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  block_number BIGINT,
  gas_used BIGINT,
  gas_price DECIMAL(36, 18),
  network VARCHAR(50) DEFAULT 'sepolia',
  category VARCHAR(50),
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  confirmed_at TIMESTAMP
);

CREATE INDEX idx_tx_hash ON transactions(tx_hash);
CREATE INDEX idx_tx_from ON transactions(from_address);
CREATE INDEX idx_tx_to ON transactions(to_address);
CREATE INDEX idx_tx_type ON transactions(tx_type);
CREATE INDEX idx_tx_status ON transactions(status);
CREATE INDEX idx_tx_network ON transactions(network);
CREATE INDEX idx_tx_created ON transactions(created_at);

-- ============================================================================
-- 6. Analytics
-- ============================================================================

CREATE TABLE IF NOT EXISTS analytics_snapshots (
  id SERIAL PRIMARY KEY,
  user_address VARCHAR(42) NOT NULL,
  snapshot_date DATE NOT NULL,
  total_income DECIMAL(36, 18) DEFAULT 0,
  total_expense DECIMAL(36, 18) DEFAULT 0,
  net_cash_flow DECIMAL(36, 18) DEFAULT 0,
  transaction_count INTEGER DEFAULT 0,
  network VARCHAR(50) DEFAULT 'sepolia',
  category_breakdown JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_address, snapshot_date, network)
);

CREATE INDEX idx_analytics_user ON analytics_snapshots(user_address);
CREATE INDEX idx_analytics_date ON analytics_snapshots(snapshot_date);
CREATE INDEX idx_analytics_network ON analytics_snapshots(network);

-- ============================================================================
-- 7. X402 Authorizations
-- ============================================================================

CREATE TABLE IF NOT EXISTS x402_authorizations (
  id SERIAL PRIMARY KEY,
  authorization_id VARCHAR(100) UNIQUE NOT NULL,
  from_address VARCHAR(42) NOT NULL,
  to_address VARCHAR(42) NOT NULL,
  amount DECIMAL(36, 18) NOT NULL,
  valid_after TIMESTAMP NOT NULL,
  valid_before TIMESTAMP NOT NULL,
  nonce VARCHAR(66) NOT NULL,
  signature VARCHAR(132) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  batch_id VARCHAR(66),
  tx_hash VARCHAR(66),
  network VARCHAR(50) DEFAULT 'baseSepolia',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  executed_at TIMESTAMP
);

CREATE INDEX idx_x402_from ON x402_authorizations(from_address);
CREATE INDEX idx_x402_batch ON x402_authorizations(batch_id);
CREATE INDEX idx_x402_status ON x402_authorizations(status);
CREATE INDEX idx_x402_network ON x402_authorizations(network);

-- ============================================================================
-- 8. Notifications
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_address VARCHAR(42) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal',
  is_read BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_address);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at);

-- ============================================================================
-- 9. API Keys (for backend services)
-- ============================================================================

CREATE TABLE IF NOT EXISTS api_keys (
  id SERIAL PRIMARY KEY,
  key_hash VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  permissions JSONB,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_active ON api_keys(is_active);

-- ============================================================================
-- 10. Audit Logs
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_address VARCHAR(42),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id VARCHAR(100),
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON audit_logs(user_address);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- ============================================================================
-- 11. KYC/AML
-- ============================================================================

CREATE TABLE IF NOT EXISTS kyc_records (
  id SERIAL PRIMARY KEY,
  user_address VARCHAR(42) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  date_of_birth DATE,
  country VARCHAR(2),
  document_type VARCHAR(50),
  document_number VARCHAR(100),
  verification_status VARCHAR(20) DEFAULT 'pending',
  risk_score INTEGER,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_kyc_user ON kyc_records(user_address);
CREATE INDEX idx_kyc_status ON kyc_records(verification_status);

-- ============================================================================
-- 12. System Configuration
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_config (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  is_encrypted BOOLEAN DEFAULT false,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default configurations
INSERT INTO system_config (key, value, description) VALUES
  ('default_network', 'baseSepolia', 'Default blockchain network'),
  ('x402_enabled', 'true', 'Enable X402 batch settlement'),
  ('maintenance_mode', 'false', 'System maintenance mode'),
  ('max_batch_size', '50', 'Maximum batch payment size')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 13. Views for Analytics
-- ============================================================================

-- Daily transaction summary
CREATE OR REPLACE VIEW daily_transaction_summary AS
SELECT
  DATE(created_at) as date,
  from_address,
  network,
  COUNT(*) as transaction_count,
  SUM(CASE WHEN tx_type = 'income' THEN amount ELSE 0 END) as total_income,
  SUM(CASE WHEN tx_type = 'expense' THEN amount ELSE 0 END) as total_expense,
  SUM(CASE WHEN tx_type = 'income' THEN amount ELSE -amount END) as net_cash_flow
FROM transactions
WHERE status = 'confirmed'
GROUP BY DATE(created_at), from_address, network;

-- User payment statistics
CREATE OR REPLACE VIEW user_payment_stats AS
SELECT
  sender_address as user_address,
  network,
  COUNT(*) as total_streams,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_streams,
  SUM(amount) as total_amount,
  AVG(duration) as avg_duration
FROM stream_payments
GROUP BY sender_address, network;

-- ============================================================================
-- 14. Functions
-- ============================================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update trigger to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stream_payments_updated_at BEFORE UPDATE ON stream_payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_batch_payments_updated_at BEFORE UPDATE ON batch_payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_payments_updated_at BEFORE UPDATE ON scheduled_payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kyc_records_updated_at BEFORE UPDATE ON kyc_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 15. Sample Data (for development)
-- ============================================================================

-- Uncomment to insert sample data for testing
/*
INSERT INTO users (wallet_address, email, username, role, kyc_status) VALUES
  ('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', 'alice@example.com', 'alice', 'user', 'verified'),
  ('0x5B38Da6a701c568545dCfcB03FcB875f56beddC4', 'bob@example.com', 'bob', 'user', 'verified'),
  ('0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2', 'charlie@example.com', 'charlie', 'admin', 'verified');
*/

-- ============================================================================
-- End of initialization script
-- ============================================================================

-- Display table summary
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
