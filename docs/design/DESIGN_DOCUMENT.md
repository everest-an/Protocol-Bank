# Protocol Bank - 项目设计文档

**版本**: 1.0  
**日期**: 2025-11-08  
**作者**: Manus AI

---

## 1. 系统架构

### 1.1. 高层架构

Protocol Bank采用分层架构,将前端、后端和区块链分离,通过API进行通信。

![High-Level Architecture](https://github.com/everest-an/Protocol-Bank/raw/main/docs/design/high_level_architecture.png)

- **用户层**: 提供Web界面,用户通过浏览器与平台交互。
- **应用层**: 后端服务处理业务逻辑,管理数据库和消息队列。
- **区块链层**: 智能合约在以太坊上执行核心的支付和结算逻辑。
- **集成层**: 通过网关与外部清算网络(如Fedwire)和第三方服务(如Chainalysis)集成。

### 1.2. 数据库设计

使用PostgreSQL关系型数据库,核心表结构如下:

| 表名 | 字段 | 描述 |
|---|---|---|
| `users` | `id`, `username`, `wallet_address`, `kyc_status` | 用户信息 |
| `accounts` | `id`, `user_id`, `balance`, `currency` | 用户账户 |
| `transactions` | `id`, `sender_id`, `receiver_id`, `amount`, `status`, `tx_hash` | 交易记录 |
| `suppliers` | `id`, `user_id`, `name`, `wallet_address` | 供应商信息 |
| `scheduled_payments` | `id`, `user_id`, `cron_expression`, `amount` | 定时支付任务 |

---

## 2. UI/UX 设计

### 2.1. 配色方案

- **主色调**: 蓝紫色渐变 (`#3B82F6` → `#8B5CF6`),营造科技感和信任感。
- **强调色**: 绿色 (`#10B981`),用于成功状态和流支付卡片。
- **中性色**: 灰色系,用于文本和背景。

### 2.2. 核心界面设计

#### **支付网络可视化**
- **目标**: 直观展示复杂的支付关系和资金流动。
- **设计**: 使用HTML5 Canvas绘制的动态网络图谱。
  - **节点**: 公司和供应商用不同颜色和大小的圆点表示。
  - **连接线**: 代表支付关系,线的粗细表示交易金额。
  - **动画**: 橙色粒子沿连接线流动,模拟资金流。
  - **交互**: 支持缩放、拖动、点击节点查看详情。

#### **仪表板**
- **目标**: 提供关键财务指标的概览。
- **设计**: 采用卡片式布局,每个卡片显示一个KPI(如总支付额、供应商数量)。

### 2.3. 待完善的设计

- **移动端适配**: 当前的界面主要为桌面端设计,需要为移动端进行专门的优化。
- **双滑轨过滤器**: 需要设计一个直观的UI,让用户可以方便地通过拖动滑块来过滤金额和日期范围。
- **空状态和加载状态**: 需要为所有数据区域设计更友好的空状态和加载动画。

---

## 3. 智能合约设计

### 3.1. `StreamPayment.sol`
- **标准**: 遵循EIP-1620流式支付标准。
- **核心功能**: `createStream`, `withdrawFromStream`, `cancelStream`。
- **特点**: 资金在流创建时被锁定在合约中,收款人可以随时提取已累积的资金。

### 3.2. `ClearingHouse.sol` (待开发)
- **目标**: 实现多方净额结算,减少链上交易数量。
- **设计思路**: 
  1. 参与方将资金存入合约。
  2. 在链下进行大量的支付指令交换。
  3. 定期(如每天)将所有支付进行净额计算。
  4. 在链上执行最终的净额结算,一次性完成所有资金划转。
- **挑战**: 需要确保链下消息传递的安全性和不可篡改性。

---

## 4. 安全设计

### 4.1. 应用安全
- **认证**: 使用JWT (JSON Web Tokens) 进行API认证。
- **输入验证**: 对所有用户输入进行严格的验证和清理,防止XSS和SQL注入。
- **依赖安全**: 定期使用`pnpm audit`检查并修复依赖库的安全漏洞。

### 4.2. 智能合约安全
- **最佳实践**: 遵循ConsenSys的智能合约安全最佳实践。
- **检查-生效-交互模式**: 防止重入攻击。
- **访问控制**: 使用OpenZeppelin的`Ownable`合约限制特权操作。
- **安全审计**: 在主网部署前,必须由知名的第三方安全公司进行完整的审计。

---

## 5. 参考资料

- [1] [Protocol Bank Whitepaper v2.0](https://github.com/everest-an/Protocol-Bank/blob/main/docs/design/protocol_bank_complete_whitepaper.md)
- [2] [Figma 设计稿](https://www.figma.com/community/file/12345...)
