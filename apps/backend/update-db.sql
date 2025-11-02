-- 添加批量支付表
CREATE TABLE IF NOT EXISTS batch_payments (
  batch_id UUID PRIMARY KEY,
  from_account_id UUID REFERENCES accounts(account_id),
  total_amount DECIMAL(20, 8) NOT NULL,
  total_recipients INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 为 transactions 表添加 batch_id 列
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS batch_id UUID;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_batch_payments_from_account ON batch_payments(from_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_batch_id ON transactions(batch_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);

-- 添加定时支付表
CREATE TABLE IF NOT EXISTS scheduled_payments (
  schedule_id UUID PRIMARY KEY,
  from_account_id UUID REFERENCES accounts(account_id),
  to_account_id UUID REFERENCES accounts(account_id),
  amount DECIMAL(20, 8) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  payment_method VARCHAR(50),
  schedule_type VARCHAR(20) NOT NULL, -- 'once', 'daily', 'weekly', 'monthly'
  schedule_time TIMESTAMP,
  cron_expression VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'paused', 'completed', 'cancelled'
  last_executed_at TIMESTAMP,
  next_execution_at TIMESTAMP,
  execution_count INTEGER DEFAULT 0,
  max_executions INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_scheduled_payments_from_account ON scheduled_payments(from_account_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_payments_status ON scheduled_payments(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_payments_next_execution ON scheduled_payments(next_execution_at);
