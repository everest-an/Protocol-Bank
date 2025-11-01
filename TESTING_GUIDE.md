# Protocol Bank 测试指南

## 当前开发状态

### ✅ 已完成的工作

#### 1. 智能合约部署（Sepolia 测试网）
- **StreamPayment 合约**: `0x642B0c309358D083EE83748b4C22572aa28AebF7`
- **MockUSDC 合约**: `0x51eDB4f010A695fb727C537F0B2463E632d4b026`
- **MockDAI 合约**: `0xc4844510f5954a27db7452754604C074a07066Fb`

#### 2. 测试钱包配置
- **地址**: `0x66794fC75C351ad9677cB00B2043868C11dfcadA`
- **ETH 余额**: 0.096 ETH（足够支付 gas）
- **USDC 余额**: 1,000,000 USDC（测试币）
- **DAI 余额**: 1,000,000 DAI（测试币）

#### 3. 前端集成
- ✅ 创建了完整的合约交互服务层（`streamPaymentService.js`）
- ✅ 创建了 CreateStreamModal 组件
- ✅ 集成到 FlowPaymentVisualization 页面
- ✅ 添加了"Create Stream"按钮

#### 4. 链上测试
- ✅ 成功创建了测试流支付（Stream ID: 0）
- ✅ 交易哈希: `0x4bdacf32ad01f2de038cfa05d9cf8a7764af2038251c02f73d8e9f1f281e72a9`

## 本地开发环境

### 启动开发服务器

```bash
cd /home/ubuntu/Protocol-Bank
npm run dev
```

服务器将在 `http://localhost:5173` 或 `http://localhost:5174` 启动

### 访问地址

**本地**: http://localhost:5173
**公网**: https://5173-ivn27ux1317ucw3gofr3f-4499548a.manus-asia.computer

## 测试流程

### Phase 1: 连接钱包测试

1. **打开网站**
   - 访问开发服务器地址
   - 等待页面加载完成

2. **连接 MetaMask**
   - 点击右上角"Connect Wallet"按钮
   - 在 MetaMask 中选择账户
   - 确认连接

3. **切换到 Sepolia 网络**
   - 如果不在 Sepolia，点击"Switch to Sepolia"
   - 在 MetaMask 中确认网络切换

4. **退出测试模式**
   - 页面默认显示测试数据
   - 点击"Exit Test Mode"按钮
   - 页面将切换到真实数据模式（当前为空）

### Phase 2: 创建流支付测试

1. **点击"Create Stream"按钮**（蓝色按钮）

2. **填写表单**：
   - **Recipient Address**: 输入接收方地址
     - 测试地址: `0x742d35cc595f0beb595f0beb595f0beb595f0beb`
     - 或使用任意有效的以太坊地址
   
   - **Token**: 选择代币
     - USDC - Mock USDC
     - DAI - Mock DAI
   
   - **Amount**: 输入金额
     - 示例: `100` (100 USDC 或 100 DAI)
   
   - **Duration**: 输入持续时间（秒）
     - 最少: `3600` (1 小时)
     - 示例: `7200` (2 小时)
     - 示例: `86400` (24 小时)
   
   - **Stream Name**: 输入流名称
     - 示例: "Test Payment Stream"
     - 示例: "Monthly Salary Payment"

3. **提交创建**
   - 点击"Create Stream"按钮
   - 等待处理

4. **MetaMask 确认**
   
   **第一笔交易 - 代币授权**:
   - MetaMask 会弹出授权请求
   - 这是授权 StreamPayment 合约使用你的 USDC/DAI
   - 点击"Confirm"确认
   - 等待交易确认（约 10-20 秒）
   
   **第二笔交易 - 创建流**:
   - 授权完成后，MetaMask 会再次弹出
   - 这是实际创建流支付的交易
   - 点击"Confirm"确认
   - 等待交易确认（约 10-20 秒）

5. **查看结果**
   - 成功后会显示绿色提示框
   - 显示 Stream ID 和交易哈希
   - 可以点击"View on Etherscan"查看链上记录

### Phase 3: 查看流支付详情

（待实现 - 下一步开发）

1. 在页面上显示所有流支付列表
2. 点击查看详情
3. 显示：
   - 发送方和接收方
   - 总金额和已提取金额
   - 开始时间和结束时间
   - 当前可提取金额
   - 流状态（活跃/暂停/已取消）

### Phase 4: 提取资金测试

（待实现 - 下一步开发）

1. 切换到接收方钱包
2. 查看可提取金额
3. 点击"Withdraw"按钮
4. 确认交易
5. 查看余额变化

## 常见问题排查

### 问题 1: MetaMask 未安装
**症状**: 点击"Connect Wallet"没有反应
**解决**: 
1. 安装 MetaMask 浏览器扩展
2. 访问 https://metamask.io/download/

### 问题 2: 不在 Sepolia 网络
**症状**: 显示"Please switch to Sepolia network"
**解决**:
1. 点击"Switch to Sepolia"按钮
2. 或手动在 MetaMask 中切换网络

### 问题 3: 没有测试 ETH
**症状**: 交易失败，提示 insufficient funds
**解决**:
1. 访问 Sepolia 水龙头获取测试 ETH
2. 推荐: https://sepoliafaucet.com/
3. 或: https://www.alchemy.com/faucets/ethereum-sepolia

### 问题 4: 交易卡住
**症状**: MetaMask 显示"Pending"很久
**解决**:
1. 等待 1-2 分钟
2. 如果仍然卡住，可以在 MetaMask 中"Speed Up"交易
3. 或"Cancel"交易后重试

### 问题 5: 合约调用失败
**症状**: 显示红色错误信息
**解决**:
1. 检查表单是否填写正确
2. 确保 Duration 至少 3600 秒
3. 确保 Amount 大于 0
4. 查看浏览器控制台的详细错误信息

## 下一步开发计划

### Phase 1: 完善流支付功能 ✅ (进行中)
- ✅ 创建流支付
- ⚠️ 查看流支付列表
- ⚠️ 查看流支付详情
- ⚠️ 提取资金
- ⚠️ 暂停/恢复流
- ⚠️ 取消流支付

### Phase 2: 修复 Flow Payment (Stake) 页面
- 创建独立的托管支付组件
- 实现里程碑管理
- 添加 VC/LP 监控功能

### Phase 3: 完善 Suppliers 页面
- 集成智能合约
- 实现供应商注册
- 显示真实的供应商数据

### Phase 4: 完善 Batch Payment 功能
- 开发 BatchPayment 合约
- 实现 CSV 上传和解析
- 批量转账功能

### Phase 5: 完善 Scheduled Payment 功能
- 实现工作流引擎
- 集成 Chainlink Automation（可选）
- 或开发后端定时任务服务

### Phase 6: 完善 Agent Market 功能
- 实现 ERC-8004 标准
- 代理注册和管理
- 代理市场交互

### Phase 7: 后端服务开发
- Node.js API 服务器
- PostgreSQL 数据库
- 链上事件监听
- 定时任务调度

### Phase 8: 生产部署
- 部署到主网或 Polygon
- 配置 CDN 和域名
- 性能优化
- 安全审计

## 合约地址速查

### Sepolia 测试网

| 合约 | 地址 | Etherscan |
|------|------|-----------|
| StreamPayment | `0x642B0c309358D083EE83748b4C22572aa28AebF7` | [查看](https://sepolia.etherscan.io/address/0x642B0c309358D083EE83748b4C22572aa28AebF7) |
| MockUSDC | `0x51eDB4f010A695fb727C537F0B2463E632d4b026` | [查看](https://sepolia.etherscan.io/address/0x51eDB4f010A695fb727C537F0B2463E632d4b026) |
| MockDAI | `0xc4844510f5954a27db7452754604C074a07066Fb` | [查看](https://sepolia.etherscan.io/address/0xc4844510f5954a27db7452754604C074a07066Fb) |

### 测试钱包

| 项目 | 值 |
|------|-----|
| 地址 | `0x66794fC75C351ad9677cB00B2043868C11dfcadA` |
| ETH | 0.096 ETH |
| USDC | 1,000,000 USDC |
| DAI | 1,000,000 DAI |

## 技术栈

### 前端
- React 18
- Vite 6
- TailwindCSS
- ethers.js 6
- Radix UI

### 智能合约
- Solidity 0.8.20
- Hardhat
- OpenZeppelin
- Sepolia 测试网

### 计划中的后端
- Node.js + Express
- PostgreSQL
- ethers.js
- Bull (任务队列)

## 联系方式

如有问题，请查看：
- GitHub Issues: https://github.com/everest-an/Protocol-Bank/issues
- 项目文档: /home/ubuntu/Protocol-Bank/README.md
