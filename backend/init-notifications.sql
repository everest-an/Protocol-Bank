-- Notifications Module Database Schema

-- 通知表
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  notification_id VARCHAR(255) NOT NULL UNIQUE,
  account_id UUID NOT NULL,
  notification_type VARCHAR(100) NOT NULL CHECK (notification_type IN (
    'transaction_completed', 'transaction_failed', 'transaction_pending',
    'batch_payment_completed', 'batch_payment_failed',
    'scheduled_payment_executed', 'scheduled_payment_failed',
    'kyc_approved', 'kyc_rejected', 'kyc_additional_info_required',
    'aml_flagged', 'aml_blocked', 'aml_review_required',
    'account_created', 'account_suspended', 'account_activated',
    'security_alert', 'system_maintenance', 'other'
  )),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB, -- Additional data related to the notification
  priority VARCHAR(50) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  is_sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 通知订阅表
CREATE TABLE IF NOT EXISTS notification_subscriptions (
  id SERIAL PRIMARY KEY,
  account_id UUID NOT NULL,
  notification_type VARCHAR(100) NOT NULL,
  channel VARCHAR(50) NOT NULL CHECK (channel IN ('websocket', 'email', 'sms', 'push')),
  is_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(account_id, notification_type, channel)
);

-- WebSocket会话表
CREATE TABLE IF NOT EXISTS websocket_sessions (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL UNIQUE,
  account_id UUID NOT NULL,
  socket_id VARCHAR(255) NOT NULL,
  connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  disconnected_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_notifications_account ON notifications(account_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_subscriptions_account ON notification_subscriptions(account_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_type ON notification_subscriptions(notification_type);
CREATE INDEX IF NOT EXISTS idx_subscriptions_enabled ON notification_subscriptions(is_enabled);

CREATE INDEX IF NOT EXISTS idx_websocket_account ON websocket_sessions(account_id);
CREATE INDEX IF NOT EXISTS idx_websocket_socket ON websocket_sessions(socket_id);
CREATE INDEX IF NOT EXISTS idx_websocket_active ON websocket_sessions(is_active);

-- 创建触发器
CREATE TRIGGER update_notification_subscriptions_updated_at 
BEFORE UPDATE ON notification_subscriptions 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入默认订阅配置（可选）
-- 用户可以自定义订阅偏好

-- 完成
SELECT 'Notifications database schema initialized successfully' AS status;
