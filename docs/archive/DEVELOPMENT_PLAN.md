# Protocol Bank - 完整开发计划

## 当前状态总结

### ✅ 已完成的功能

1. **智能合约部署**
   - StreamPayment 合约已部署到 Sepolia 测试网
   - MockUSDC 和 MockDAI 测试代币已部署
   - 合约地址已配置到前端

2. **前端基础功能**
   - Flow Payment 页面（流支付可视化）
   - Suppliers 页面（供应商管理）
   - Analytics 页面（数据分析）
   - Agent Market 页面（AI 代理市场）
   - Batch Payment 页面（批量支付）
   - Scheduled Payment 页面（定时支付）

3. **UI 优化**
   - 导航栏布局修复
   - 测试数据优化（12 个供应商，20 笔支付）
   - 数据一致性保证（仪表板、表格、网络图同步）

### ❌ 需要完善的功能

根据用户提供的 API 文档，需要实现以下核心模块：

## 模块开发计划

### Phase 1: 后端服务基础架构

**目标**：创建 Node.js + Express 后端服务，支持所有 API 接口

**技术栈**：
- Node.js + Express
- PostgreSQL 数据库
- JWT 认证
- Web3.js（与智能合约交互）

**文件结构**：
```
backend/
├── src/
│   ├── config/          # 配置文件
│   ├── models/          # 数据库模型
│   ├── routes/          # API 路由
│   ├── controllers/     # 业务逻辑
│   ├── middleware/      # 中间件
│   ├── services/        # 服务层
│   └── utils/           # 工具函数
├── package.json
└── server.js
```

### Phase 2: 账户管理模块

**API 接口**：
- `POST /api/v1/account/create` - 创建账户
- `GET /api/v1/account/{account_id}` - 获取账户信息
- `PUT /api/v1/account/{account_id}/update` - 更新账户信息
- `POST /api/v1/account/{account_id}/deposit` - 存款
- `POST /api/v1/account/{account_id}/withdraw` - 取款

**数据库表**：
```sql
CREATE TABLE accounts (
  account_id UUID PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50),
  balance DECIMAL(20, 8) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'USD',
  wallet_address VARCHAR(42),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Phase 3: 交易系统模块

**API 接口**：
- `POST /api/v1/transaction/transfer` - 发起转账
- `GET /api/v1/transaction/{transaction_id}` - 查询交易
- `GET /api/v1/transaction/history/{account_id}` - 获取交易历史

**数据库表**：
```sql
CREATE TABLE transactions (
  transaction_id UUID PRIMARY KEY,
  from_account_id UUID REFERENCES accounts(account_id),
  to_account_id UUID REFERENCES accounts(account_id),
  amount DECIMAL(20, 8) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  payment_method VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending',
  tx_hash VARCHAR(66),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Phase 4: 风控模块

**API 接口**：
- `POST /api/v1/risk/scan` - 风控扫描
- `POST /api/v1/risk/flag` - 标记可疑交易
- `GET /api/v1/risk/report` - 查询风控报告

**数据库表**：
```sql
CREATE TABLE risk_assessments (
  assessment_id UUID PRIMARY KEY,
  transaction_id UUID REFERENCES transactions(transaction_id),
  risk_level VARCHAR(20),
  risk_score DECIMAL(5, 2),
  flags JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Phase 5: 数据分析模块

**API 接口**：
- `POST /api/v1/analytics/transaction` - 提交交易数据分析
- `GET /api/v1/analytics/user/{user_id}` - 获取用户行为分析
- `POST /api/v1/analytics/alert` - 设置异常警报规则

**数据库表**：
```sql
CREATE TABLE analytics_reports (
  report_id UUID PRIMARY KEY,
  user_id UUID REFERENCES accounts(account_id),
  report_type VARCHAR(50),
  data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE alert_rules (
  rule_id UUID PRIMARY KEY,
  threshold DECIMAL(20, 8),
  alert_type VARCHAR(50),
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Phase 6: KYC/AML 模块

**API 接口**：
- `POST /api/v1/kyc/verify` - 提交 KYC 验证
- `GET /api/v1/kyc/status/{user_id}` - 查询 KYC 状态
- `POST /api/v1/aml/check` - AML 检测

**数据库表**：
```sql
CREATE TABLE kyc_verifications (
  verification_id UUID PRIMARY KEY,
  user_id UUID REFERENCES accounts(account_id),
  document_type VARCHAR(50),
  document_number VARCHAR(100),
  document_image TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  verified_on TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE aml_checks (
  check_id UUID PRIMARY KEY,
  transaction_id UUID REFERENCES transactions(transaction_id),
  status VARCHAR(20),
  risk_level VARCHAR(20),
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Phase 7: 前端集成

**需要更新的页面**：
1. **Dashboard** - 显示账户余额、交易历史
2. **Suppliers** - 集成账户管理和 KYC
3. **Payments** - 集成交易系统和风控
4. **Analytics** - 集成数据分析模块
5. **Settings** - 添加 KYC/AML 设置

### Phase 8: 测试和部署

**测试计划**：
1. 单元测试（Jest）
2. 集成测试（Supertest）
3. 端到端测试（Cypress）
4. 性能测试（Artillery）

**部署计划**：
1. 后端部署到 Railway/Render
2. 数据库部署到 Supabase/Neon
3. 前端部署到 Vercel/Netlify
4. 智能合约已部署到 Sepolia

## 开发优先级

### 高优先级（立即开始）
1. ✅ 创建后端服务基础架构
2. ✅ 实现账户管理模块
3. ✅ 实现交易系统模块

### 中优先级（第二阶段）
4. ✅ 实现风控模块
5. ✅ 实现数据分析模块

### 低优先级（第三阶段）
6. ✅ 实现 KYC/AML 模块
7. ✅ 前端集成
8. ✅ 测试和部署

## 时间估算

- Phase 1: 2-3 小时（后端基础架构）
- Phase 2: 2-3 小时（账户管理）
- Phase 3: 2-3 小时（交易系统）
- Phase 4: 2-3 小时（风控）
- Phase 5: 2-3 小时（数据分析）
- Phase 6: 2-3 小时（KYC/AML）
- Phase 7: 3-4 小时（前端集成）
- Phase 8: 2-3 小时（测试和部署）

**总计**: 约 17-24 小时

## 下一步行动

1. **立即开始**: 创建后端服务基础架构
2. **并行开发**: 前端和后端同时进行
3. **持续测试**: 每个模块完成后立即测试
4. **迭代优化**: 根据测试结果持续优化

---

**备注**: 由于时间和 token 限制，我会优先实现核心功能，确保系统可用性。
