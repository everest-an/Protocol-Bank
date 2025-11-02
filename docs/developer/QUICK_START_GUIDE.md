# Protocol Bank 快速启动指南
# Protocol Bank Quick Start Guide

**最后更新**: 2025-10-30  
**预计时间**: 15 分钟

---

## 🚀 快速开始

### 前提条件

- Node.js 22.x
- MetaMask 钱包
- Sepolia ETH（从 faucet 获取）

---

## 📦 安装

### 1. 克隆仓库

```bash
git clone https://github.com/everest-an/Protocol-Bank.git
cd Protocol-Bank
```

### 2. 安装前端依赖

```bash
npm install
# 或
pnpm install
```

### 3. 安装合约依赖

```bash
cd contracts/ethereum
npm install
cd ../..
```

---

## 🔧 配置

### 1. 前端环境变量

创建 `.env` 文件：

```bash
# Alchemy RPC URL (已配置)
VITE_ALCHEMY_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/N-UzzxYZbLPikS4Fc6pqC

# 合约地址（部署后更新）
VITE_STREAM_PAYMENT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
VITE_MOCK_USDC_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
VITE_STAKED_ESCROW_ADDRESS=0x44a55360BaBc86d6443471Aa473E9Fa693037f04
```

### 2. 合约环境变量

编辑 `contracts/ethereum/.env`：

```bash
# Sepolia RPC URL
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/N-UzzxYZbLPikS4Fc6pqC

# 您的私钥（从 MetaMask 导出）
PRIVATE_KEY=0x你的私钥

# Etherscan API Key（用于验证合约）
ETHERSCAN_API_KEY=你的API密钥

# Gas 报告
REPORT_GAS=true
```

⚠️ **警告**: 永远不要提交真实的私钥到 Git！

---

## 🏃 运行

### 开发模式

```bash
# 启动前端开发服务器
npm run dev

# 访问 http://localhost:5173
```

### 生产构建

```bash
# 构建前端
npm run build

# 预览构建结果
npm run preview
```

---

## 🔗 部署智能合约

### 1. 获取 Sepolia ETH

访问以下任一 faucet：
- https://sepoliafaucet.com/
- https://www.infura.io/faucet/sepolia
- https://faucet.quicknode.com/ethereum/sepolia

### 2. 编译合约

```bash
cd contracts/ethereum
npx hardhat compile
```

### 3. 部署到 Sepolia

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

输出示例：
```
Deploying contracts with account: 0x你的地址
Account balance: 0.5 ETH

Mock USDC deployed to: 0x...
Mock DAI deployed to: 0x...
StreamPayment deployed to: 0x...

Deployment info saved to: sepolia-1730123456789.json
```

### 4. 验证合约

```bash
# 验证 Mock USDC
npx hardhat verify --network sepolia <USDC_ADDRESS> "Mock USDC" "USDC" 6

# 验证 Mock DAI
npx hardhat verify --network sepolia <DAI_ADDRESS> "Mock DAI" "DAI" 18

# 验证 StreamPayment
npx hardhat verify --network sepolia <STREAM_PAYMENT_ADDRESS>
```

### 5. 更新前端配置

编辑 `/src/config/contracts.js`：

```javascript
export const STREAM_PAYMENT_CONTRACT = {
  address: '0x你部署的StreamPayment地址',
  network: 'sepolia',
  chainId: 11155111
}

export const MOCK_USDC_CONTRACT = {
  address: '0x你部署的MockUSDC地址',
  network: 'sepolia',
  chainId: 11155111,
  symbol: 'USDC',
  decimals: 6
}
```

---

## 🌐 访问应用

### 在线版本

访问 https://www.protocolbanks.com

### 本地版本

访问 http://localhost:5173

---

## 🎮 使用指南

### 1. 连接钱包

1. 点击右上角 "Connect Wallet"
2. 选择 "Connect with MetaMask"
3. 在 MetaMask 中确认连接
4. 确保网络切换到 Sepolia

### 2. 切换语言

1. 点击右上角语言按钮（🇺🇸 EN 或 🇨🇳 ZH）
2. 选择您喜欢的语言
3. 页面会自动更新

### 3. 查看支付网络

1. 访问 "Payments" 页面
2. 查看 Flow Payment Network 可视化
3. 使用鼠标拖拽和滚轮缩放
4. 点击节点查看详情

### 4. 管理供应商

1. 访问 "Suppliers" 页面
2. 查看供应商列表
3. 点击 "Details" 查看详情
4. 使用搜索和过滤功能

### 5. 查看分析

1. 访问 "Analytics" 页面
2. 查看财务统计
3. 查看分类支出图表
4. 导出 CSV 或 PDF 报告

### 6. 测试模式

默认启用测试模式，显示模拟数据：
- 调整供应商数量滑块
- 选择不同的 Demo Case
- 点击 "Refresh" 刷新数据
- 点击 "Exit Test Mode" 切换到真实数据

---

## 🧪 测试

### 运行前端测试

```bash
npm run test
```

### 运行合约测试

```bash
cd contracts/ethereum
npx hardhat test
```

### 运行安全审计

```bash
cd contracts/ethereum
slither .
```

---

## 📚 文档

### 主要文档

- **README.md** - 项目概述
- **PROJECT_STATUS_REPORT.md** - 项目状态报告
- **FRONTEND_FUNCTIONALITY_TEST.md** - 前端测试报告
- **SECURITY_AUDIT_REPORT.md** - 安全审计报告
- **SEPOLIA_DEPLOYMENT_GUIDE.md** - 部署指南

### 技术文档

- **AGENT_SDK_DESIGN.md** - Agent SDK 设计
- **AGENT_MARKET_DESIGN.md** - Agent Market 设计
- **ECONOMIC_MODEL.md** - 经济模型
- **MAINNET_DEPLOYMENT_PLAN.md** - 主网部署计划

---

## 🐛 故障排除

### 问题 1: "Cannot find module"

**解决方案**:
```bash
rm -rf node_modules package-lock.json
npm install
```

### 问题 2: "Network error"

**解决方案**:
1. 检查 MetaMask 是否连接到 Sepolia
2. 检查 RPC URL 是否正确
3. 尝试切换网络后再切换回来

### 问题 3: "Insufficient funds"

**解决方案**:
1. 访问 Sepolia faucet 获取测试 ETH
2. 等待几分钟后重试

### 问题 4: "Transaction failed"

**解决方案**:
1. 检查 Gas 费用是否足够
2. 检查合约地址是否正确
3. 查看浏览器控制台错误信息

---

## 📞 获取帮助

### 社区支持

- **Discord**: 点击网站上的 "Join Discord" 按钮
- **GitHub Issues**: https://github.com/everest-an/Protocol-Bank/issues
- **技术支持**: https://help.manus.im

### 报告 Bug

1. 访问 GitHub Issues
2. 点击 "New Issue"
3. 选择 "Bug Report" 模板
4. 填写详细信息
5. 提交 Issue

---

## 🎯 下一步

完成快速启动后，您可以：

1. **探索功能** - 测试所有页面和功能
2. **阅读文档** - 深入了解架构和设计
3. **部署合约** - 部署您自己的合约实例
4. **贡献代码** - 提交 Pull Request
5. **参与社区** - 加入 Discord 讨论

---

## 🌟 功能亮点

- ✅ **多语言支持** - 6 种语言（EN, ZH, ES, FR, DE, JA）
- ✅ **实时可视化** - Flow Payment Network 图表
- ✅ **智能合约集成** - 完整的 Web3 功能
- ✅ **ERC-8004 支持** - Trustless Agents 标准
- ✅ **安全审计** - 15 个漏洞已修复
- ✅ **性能优化** - 66% 加载速度提升
- ✅ **响应式设计** - 桌面和移动端适配

---

## 📊 系统要求

### 最低要求

- Node.js 18.x+
- 2GB RAM
- 1GB 磁盘空间
- 现代浏览器（Chrome, Firefox, Safari, Edge）

### 推荐配置

- Node.js 22.x
- 4GB RAM
- 2GB 磁盘空间
- Chrome 浏览器 + MetaMask 扩展

---

## 🔐 安全提示

1. ✅ 永远不要分享您的私钥
2. ✅ 使用测试钱包进行开发
3. ✅ 不要在测试网钱包中存放真实资金
4. ✅ 定期备份您的助记词
5. ✅ 启用 MetaMask 的安全功能

---

## 📝 更新日志

### v0.9.0 (2025-10-30)

- ✅ 前端测试完成（5.0/5.0）
- ✅ 安全审计完成
- ✅ 性能优化完成
- ✅ 多语言支持
- ✅ Vercel 部署成功

---

**享受使用 Protocol Bank！** 🎉

如有任何问题，请随时联系我们。

