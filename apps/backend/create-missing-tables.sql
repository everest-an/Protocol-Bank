-- 创建批量支付表
CREATE TABLE IF NOT EXISTS batch_payments (
    batch_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_account_id UUID NOT NULL REFERENCES accounts(account_id),
    total_amount DECIMAL(20, 8) NOT NULL,
    total_recipients INTEGER NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    failed_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0
);

-- 创建批量支付明细表
CREATE TABLE IF NOT EXISTS batch_payment_items (
    item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES batch_payments(batch_id) ON DELETE CASCADE,
    to_account_id UUID REFERENCES accounts(account_id),
    to_address VARCHAR(255),
    amount DECIMAL(20, 8) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    category VARCHAR(100),
    note TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    transaction_id UUID REFERENCES transactions(transaction_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    error_message TEXT
);

-- 创建定时支付表
CREATE TABLE IF NOT EXISTS scheduled_payments (
    scheduled_payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_account_id UUID NOT NULL REFERENCES accounts(account_id),
    to_account_id UUID REFERENCES accounts(account_id),
    to_address VARCHAR(255),
    amount DECIMAL(20, 8) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    frequency VARCHAR(20) NOT NULL, -- 'once', 'daily', 'weekly', 'monthly', 'yearly'
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    next_execution TIMESTAMP NOT NULL,
    last_execution TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'paused', 'completed', 'cancelled'
    execution_count INTEGER DEFAULT 0,
    max_executions INTEGER,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建定时支付执行历史表
CREATE TABLE IF NOT EXISTS scheduled_payment_executions (
    execution_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheduled_payment_id UUID NOT NULL REFERENCES scheduled_payments(scheduled_payment_id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(transaction_id),
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL, -- 'success', 'failed'
    error_message TEXT,
    amount DECIMAL(20, 8) NOT NULL
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_batch_payments_account ON batch_payments(from_account_id);
CREATE INDEX IF NOT EXISTS idx_batch_payments_status ON batch_payments(status);
CREATE INDEX IF NOT EXISTS idx_batch_payment_items_batch ON batch_payment_items(batch_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_payments_account ON scheduled_payments(from_account_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_payments_next_execution ON scheduled_payments(next_execution);
CREATE INDEX IF NOT EXISTS idx_scheduled_payments_status ON scheduled_payments(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_payment_executions_scheduled ON scheduled_payment_executions(scheduled_payment_id);

-- 添加注释
COMMENT ON TABLE batch_payments IS '批量支付主表';
COMMENT ON TABLE batch_payment_items IS '批量支付明细表';
COMMENT ON TABLE scheduled_payments IS '定时支付表';
COMMENT ON TABLE scheduled_payment_executions IS '定时支付执行历史表';

SELECT 'Tables created successfully!' AS result;
