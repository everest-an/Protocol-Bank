-- AML (Anti-Money Laundering) Module Database Schema

-- 黑名单表
CREATE TABLE IF NOT EXISTS aml_blacklist (
  id SERIAL PRIMARY KEY,
  address VARCHAR(255) NOT NULL UNIQUE,
  entity_name VARCHAR(255),
  risk_level VARCHAR(50) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  reason TEXT NOT NULL,
  source VARCHAR(100), -- OFAC, UN, EU, etc.
  added_by VARCHAR(255),
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

-- 风险规则表
CREATE TABLE IF NOT EXISTS aml_rules (
  id SERIAL PRIMARY KEY,
  rule_name VARCHAR(255) NOT NULL UNIQUE,
  rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN ('amount_threshold', 'frequency', 'velocity', 'pattern', 'geographic', 'custom')),
  description TEXT,
  conditions JSONB NOT NULL, -- 规则条件（JSON格式）
  risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 交易风险评分表
CREATE TABLE IF NOT EXISTS aml_transaction_scores (
  id SERIAL PRIMARY KEY,
  transaction_id VARCHAR(255) NOT NULL UNIQUE,
  total_risk_score INTEGER NOT NULL CHECK (total_risk_score >= 0 AND total_risk_score <= 100),
  risk_level VARCHAR(50) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  risk_factors JSONB, -- 触发的风险因素
  triggered_rules JSONB, -- 触发的规则列表
  is_flagged BOOLEAN DEFAULT FALSE,
  is_blocked BOOLEAN DEFAULT FALSE,
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMP,
  review_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 可疑交易报告 (STR - Suspicious Transaction Report)
CREATE TABLE IF NOT EXISTS aml_suspicious_reports (
  id SERIAL PRIMARY KEY,
  report_id VARCHAR(255) NOT NULL UNIQUE,
  transaction_id VARCHAR(255) NOT NULL,
  account_id VARCHAR(255) NOT NULL,
  report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('STR', 'SAR', 'CTR')),
  risk_score INTEGER NOT NULL,
  description TEXT NOT NULL,
  evidence JSONB, -- 证据和详细信息
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'under_review', 'filed', 'dismissed', 'escalated')),
  filed_to VARCHAR(255), -- 报告提交给的监管机构
  filed_at TIMESTAMP,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 审计日志表
CREATE TABLE IF NOT EXISTS aml_audit_logs (
  id SERIAL PRIMARY KEY,
  log_id VARCHAR(255) NOT NULL UNIQUE,
  event_type VARCHAR(100) NOT NULL, -- transaction_flagged, rule_triggered, blacklist_added, etc.
  entity_type VARCHAR(50) NOT NULL, -- transaction, account, rule, etc.
  entity_id VARCHAR(255) NOT NULL,
  details JSONB,
  performed_by VARCHAR(255),
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 账户风险档案表
CREATE TABLE IF NOT EXISTS aml_account_profiles (
  id SERIAL PRIMARY KEY,
  account_id VARCHAR(255) NOT NULL UNIQUE,
  risk_score INTEGER NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level VARCHAR(50) NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  total_transactions INTEGER DEFAULT 0,
  total_volume DECIMAL(20, 8) DEFAULT 0,
  flagged_transactions INTEGER DEFAULT 0,
  last_transaction_at TIMESTAMP,
  last_risk_assessment_at TIMESTAMP,
  risk_factors JSONB, -- 风险因素统计
  is_monitored BOOLEAN DEFAULT FALSE,
  is_restricted BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 地理风险表
CREATE TABLE IF NOT EXISTS aml_geographic_risks (
  id SERIAL PRIMARY KEY,
  country_code VARCHAR(3) NOT NULL UNIQUE,
  country_name VARCHAR(255) NOT NULL,
  risk_level VARCHAR(50) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  reasons TEXT[],
  source VARCHAR(100), -- FATF, World Bank, etc.
  is_sanctioned BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_blacklist_address ON aml_blacklist(address);
CREATE INDEX IF NOT EXISTS idx_blacklist_risk_level ON aml_blacklist(risk_level);
CREATE INDEX IF NOT EXISTS idx_blacklist_active ON aml_blacklist(is_active);

CREATE INDEX IF NOT EXISTS idx_rules_type ON aml_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_rules_active ON aml_rules(is_active);

CREATE INDEX IF NOT EXISTS idx_transaction_scores_transaction ON aml_transaction_scores(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_scores_risk_level ON aml_transaction_scores(risk_level);
CREATE INDEX IF NOT EXISTS idx_transaction_scores_flagged ON aml_transaction_scores(is_flagged);
CREATE INDEX IF NOT EXISTS idx_transaction_scores_blocked ON aml_transaction_scores(is_blocked);

CREATE INDEX IF NOT EXISTS idx_suspicious_reports_transaction ON aml_suspicious_reports(transaction_id);
CREATE INDEX IF NOT EXISTS idx_suspicious_reports_account ON aml_suspicious_reports(account_id);
CREATE INDEX IF NOT EXISTS idx_suspicious_reports_status ON aml_suspicious_reports(status);
CREATE INDEX IF NOT EXISTS idx_suspicious_reports_created ON aml_suspicious_reports(created_at);

CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON aml_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON aml_audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON aml_audit_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_account_profiles_account ON aml_account_profiles(account_id);
CREATE INDEX IF NOT EXISTS idx_account_profiles_risk_level ON aml_account_profiles(risk_level);
CREATE INDEX IF NOT EXISTS idx_account_profiles_monitored ON aml_account_profiles(is_monitored);

CREATE INDEX IF NOT EXISTS idx_geographic_risks_country ON aml_geographic_risks(country_code);
CREATE INDEX IF NOT EXISTS idx_geographic_risks_risk_level ON aml_geographic_risks(risk_level);

-- 插入默认AML规则
INSERT INTO aml_rules (rule_name, rule_type, description, conditions, risk_score, is_active) VALUES
('Large Transaction', 'amount_threshold', 'Transactions exceeding $10,000', '{"threshold": 10000, "currency": "USD"}', 30, TRUE),
('High Frequency', 'frequency', 'More than 10 transactions in 1 hour', '{"count": 10, "period": "1 hour"}', 40, TRUE),
('Rapid Velocity', 'velocity', 'Total volume exceeding $50,000 in 24 hours', '{"amount": 50000, "period": "24 hours"}', 50, TRUE),
('Round Amount', 'pattern', 'Transactions with round amounts (e.g., $10,000.00)', '{"pattern": "round_amount", "threshold": 1000}', 20, TRUE),
('Structuring Pattern', 'pattern', 'Multiple transactions just below reporting threshold', '{"pattern": "structuring", "threshold": 9000, "count": 3}', 70, TRUE),
('High Risk Country', 'geographic', 'Transactions involving high-risk countries', '{"risk_level": "high"}', 60, TRUE),
('Sanctioned Country', 'geographic', 'Transactions involving sanctioned countries', '{"sanctioned": true}', 90, TRUE),
('Blacklist Match', 'custom', 'Transaction involving blacklisted address', '{"type": "blacklist"}', 100, TRUE)
ON CONFLICT (rule_name) DO NOTHING;

-- 插入示例高风险国家（基于FATF灰名单）
INSERT INTO aml_geographic_risks (country_code, country_name, risk_level, risk_score, reasons, source, is_sanctioned) VALUES
('PRK', 'North Korea', 'critical', 100, ARRAY['FATF Black List', 'UN Sanctions', 'High risk of money laundering'], 'FATF', TRUE),
('IRN', 'Iran', 'critical', 100, ARRAY['FATF Black List', 'International Sanctions'], 'FATF', TRUE),
('SYR', 'Syria', 'critical', 95, ARRAY['UN Sanctions', 'High risk jurisdiction'], 'UN', TRUE),
('AFG', 'Afghanistan', 'high', 80, ARRAY['FATF Grey List', 'High risk of terrorism financing'], 'FATF', FALSE),
('MMR', 'Myanmar', 'high', 75, ARRAY['FATF Grey List', 'Weak AML controls'], 'FATF', FALSE),
('YEM', 'Yemen', 'high', 80, ARRAY['High risk jurisdiction', 'Weak regulatory framework'], 'FATF', FALSE)
ON CONFLICT (country_code) DO NOTHING;

-- 创建触发器：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_aml_blacklist_updated_at BEFORE UPDATE ON aml_blacklist FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_aml_rules_updated_at BEFORE UPDATE ON aml_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_aml_transaction_scores_updated_at BEFORE UPDATE ON aml_transaction_scores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_aml_suspicious_reports_updated_at BEFORE UPDATE ON aml_suspicious_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_aml_account_profiles_updated_at BEFORE UPDATE ON aml_account_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_aml_geographic_risks_updated_at BEFORE UPDATE ON aml_geographic_risks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 完成
SELECT 'AML database schema initialized successfully' AS status;
