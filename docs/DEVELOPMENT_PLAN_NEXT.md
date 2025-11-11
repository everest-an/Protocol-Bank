# Protocol Bank - 剩余功能开发计划

**制定日期:** 2025年11月12日  
**预计完成:** 2025年11月15日  
**基于文档:** PRD v1.0, 功能文档, 技术文档

---

## 📊 当前状态

### 已完成的功能 ✅
- Stream Payment Dashboard (统计卡片、网络图、交易列表)
- 交易列表筛选和分页
- 创建单个支付流表单
- 批量创建(CSV导入)
- 支付流管理(Pause/Resume/Stop/Cancel)
- Etherscan数据集成
- X402支付基础设施(90%)
- StreamPayment合约部署

### 待完成的功能 📝
- 网络图交互增强
- 类别筛选
- X402合约部署
- 批量支付功能
- 定时支付功能
- 财务分析功能
- 供应商管理功能
- 自动化功能

---

## 🎯 开发优先级

根据PRD和功能文档,按照以下优先级开发:

### Phase 1: 完善Stream Payment (高优先级 🔴)
**预计时间:** 4-6小时

1. **网络图交互增强**
   - 节点拖动功能
   - 节点点击详情弹窗
   - 图表缩放功能
   - 预计: 2-3小时

2. **类别筛选功能**
   - 添加category字段到数据模型
   - 创建类别筛选器UI
   - 预设类别(AI服务、市场营销、物流、原材料等)
   - 集成到交易列表
   - 预计: 1-2小时

3. **X402合约部署**
   - 获取Base Sepolia测试ETH
   - 部署X402BatchSettlement
   - 更新前端配置
   - 预计: 0.5-1小时

### Phase 2: 批量支付功能 (高优先级 🔴)
**预计时间:** 3-4小时

1. **批量支付页面**
   - 创建BatchPaymentPage组件
   - 批量地址输入
   - 金额分配
   - 代币选择
   - Gas费用估算

2. **批量支付执行**
   - 批量转账逻辑
   - 进度追踪
   - 成功/失败统计
   - 交易历史记录

### Phase 3: 定时支付功能 (中优先级 🟡)
**预计时间:** 4-5小时

1. **定时支付创建**
   - 创建定时支付表单
   - 时间调度器
   - 重复规则设置
   - 预计: 2小时

2. **定时支付管理**
   - 定时支付列表
   - 启用/禁用
   - 编辑/删除
   - 执行历史
   - 预计: 2-3小时

### Phase 4: 财务分析功能 (中优先级 🟡)
**预计时间:** 4-6小时

1. **数据分析**
   - 支付趋势图
   - 供应商分布图
   - 类别统计
   - 时间序列分析

2. **报表生成**
   - 月度报表
   - 季度报表
   - 自定义报表
   - 导出功能

### Phase 5: 供应商管理 (中优先级 🟡)
**预计时间:** 3-4小时

1. **供应商CRUD**
   - 添加供应商
   - 编辑供应商信息
   - 删除供应商
   - 供应商列表

2. **供应商详情**
   - 支付历史
   - 统计信息
   - 关联支付流

### Phase 6: 自动化功能 (低优先级 🟢)
**预计时间:** 6-8小时

1. **工作流编辑器**
   - 触发器设置
   - 条件判断
   - 动作执行

2. **自动化规则**
   - 自动支付
   - 自动提醒
   - 自动报表

---

## 📅 详细开发计划

### Day 3 (今天) - Stream Payment完善

#### 任务1: 网络图交互增强 (2-3小时)

**文件修改:**
- `apps/frontend/src/components/EnterprisePaymentNetworkV2.jsx`

**功能实现:**

1. **节点拖动** (1小时)
```javascript
// 添加拖动事件处理
const drag = d3.drag()
  .on('start', dragstarted)
  .on('drag', dragged)
  .on('end', dragended);

node.call(drag);
```

2. **节点点击详情** (1小时)
```javascript
// 添加点击事件
node.on('click', (event, d) => {
  showNodeDetails(d);
});

// 创建详情弹窗组件
function NodeDetailsModal({ node, onClose }) {
  // 显示节点详细信息
}
```

3. **图表缩放** (0.5-1小时)
```javascript
// 添加缩放功能
const zoom = d3.zoom()
  .scaleExtent([0.5, 3])
  .on('zoom', zoomed);

svg.call(zoom);
```

#### 任务2: 类别筛选功能 (1-2小时)

**文件修改:**
- `apps/frontend/src/components/StreamPaymentDashboard.jsx`
- `apps/backend/src/models/streamPayment.js`
- `apps/backend/src/database/migrations/004_add_category_field.sql`

**功能实现:**

1. **数据库迁移** (0.5小时)
```sql
ALTER TABLE stream_payments ADD COLUMN category VARCHAR(50);
CREATE INDEX idx_stream_payments_category ON stream_payments(category);
```

2. **类别筛选器UI** (0.5小时)
```javascript
const CATEGORIES = [
  'AI Services',
  'Marketing',
  'Logistics',
  'Raw Materials',
  'Software',
  'Consulting',
  'Other'
];

<select value={selectedCategory} onChange={handleCategoryChange}>
  <option value="">All Categories</option>
  {CATEGORIES.map(cat => (
    <option key={cat} value={cat}>{cat}</option>
  ))}
</select>
```

3. **筛选逻辑集成** (0.5小时)
```javascript
const filteredStreams = streams.filter(stream => {
  if (selectedCategory && stream.category !== selectedCategory) {
    return false;
  }
  // ... 其他筛选条件
  return true;
});
```

#### 任务3: X402合约部署 (等待测试ETH)

**前置条件:**
- 获取Base Sepolia测试ETH

**部署步骤:**
```bash
cd /home/ubuntu/Protocol-Bank/contracts/ethereum
npx hardhat run scripts/deploy-x402-batch-settlement.js --network baseSepolia
```

**更新配置:**
- `apps/frontend/src/services/x402ClientService.js`
- `apps/backend/src/config/x402Config.js`

---

### Day 4 - 批量支付功能

#### 任务1: 批量支付页面 (2小时)

**新建文件:**
- `apps/frontend/src/pages/BatchPaymentPageV2.jsx`
- `apps/frontend/src/components/BatchPaymentForm.jsx`

**功能:**
- 批量地址输入(CSV或手动)
- 金额分配(平均分配/自定义)
- 代币选择
- Gas费用估算
- 批量转账按钮

#### 任务2: 批量支付执行 (2小时)

**新建文件:**
- `apps/backend/src/controllers/batchPaymentController.js`
- `apps/backend/src/routes/batchPaymentRoutes.js`

**功能:**
- 批量转账逻辑
- 进度追踪
- 成功/失败统计
- 交易历史记录

---

### Day 5 - 定时支付功能

#### 任务1: 定时支付创建 (2小时)

**新建文件:**
- `apps/frontend/src/components/ScheduledPaymentForm.jsx`
- `apps/backend/src/models/scheduledPayment.js`

**功能:**
- 时间调度器
- 重复规则(每天/每周/每月)
- cron表达式生成

#### 任务2: 定时支付管理 (2-3小时)

**新建文件:**
- `apps/frontend/src/pages/ScheduledPaymentPageV3.jsx`
- `apps/backend/src/services/schedulerService.js`

**功能:**
- 使用BullMQ实现任务调度
- 定时支付列表
- 启用/禁用
- 执行历史

---

### Day 6 - 财务分析功能

#### 任务1: 数据分析 (3小时)

**新建文件:**
- `apps/frontend/src/pages/FinancialAnalyticsV2.jsx`
- `apps/frontend/src/components/charts/PaymentTrendChart.jsx`
- `apps/frontend/src/components/charts/SupplierDistributionChart.jsx`

**功能:**
- 使用Chart.js或Recharts
- 支付趋势图
- 供应商分布图
- 类别统计

#### 任务2: 报表生成 (2-3小时)

**新建文件:**
- `apps/backend/src/services/reportService.js`

**功能:**
- 月度报表
- 季度报表
- PDF导出

---

### Day 7 - 供应商管理和自动化

#### 任务1: 供应商管理 (3-4小时)

**修改文件:**
- `apps/frontend/src/pages/SuppliersPageFixed.jsx`

**功能:**
- CRUD操作
- 支付历史
- 统计信息

#### 任务2: 自动化基础 (3-4小时)

**修改文件:**
- `apps/frontend/src/pages/Automation.jsx`

**功能:**
- 工作流编辑器
- 触发器设置
- 动作执行

---

## 🛠️ 技术栈

### 前端
- React 18
- Vite
- TailwindCSS
- D3.js (网络图)
- Chart.js / Recharts (图表)
- Ethers.js v6

### 后端
- Node.js
- Express
- PostgreSQL
- BullMQ (任务调度)
- JWT认证

### 智能合约
- Solidity 0.8.20
- Hardhat
- OpenZeppelin
- Ethers.js

---

## 📝 开发规范

### 代码规范
- 使用ESLint
- 遵循Airbnb代码风格
- 组件使用函数式组件
- 使用Hooks管理状态

### Git规范
- Commit message格式: `feat/fix/docs: description`
- 每个功能一个commit
- 及时push到GitHub

### 测试规范
- 单元测试(Jest)
- 集成测试
- 端到端测试(Cypress)

---

## 🎯 成功指标

### 功能完整性
- [ ] 所有PRD中的核心功能实现
- [ ] 所有功能通过测试
- [ ] 无严重bug

### 性能指标
- [ ] 页面加载时间 < 2秒
- [ ] 交易确认时间 < 30秒
- [ ] 支持1000+并发用户

### 用户体验
- [ ] 响应式设计
- [ ] 深色模式支持
- [ ] 多语言支持(中英文)

---

## 📞 需要的支持

1. **Base Sepolia测试ETH**
   - 用于部署X402合约

2. **API Keys**
   - Etherscan API Key (合约验证)
   - Alchemy/Infura API Key (RPC)

3. **生产环境**
   - 域名
   - SSL证书
   - 服务器配置

---

## 🚀 立即开始

### 第一个任务: 网络图交互增强

**开始时间:** 现在  
**预计完成:** 2-3小时

**步骤:**
1. 修改EnterprisePaymentNetworkV2.jsx
2. 添加拖动功能
3. 添加点击详情
4. 添加缩放功能
5. 测试
6. 提交到GitHub

准备好开始了吗? 🎯
