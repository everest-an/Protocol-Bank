# Sepolia 测试网部署指南

**Protocol Bank Smart Contract Deployment Guide**

---

## 前提条件

### 1. 准备钱包

您需要一个有 Sepolia ETH 的钱包：

1. **获取 Sepolia ETH**
   - 访问 [Sepolia Faucet](https://sepoliafaucet.com/)
   - 或访问 [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
   - 或访问 [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia)
   - 输入您的钱包地址
   - 等待接收测试 ETH（通常 0.5 ETH）

2. **导出私钥**
   - 在 MetaMask 中：Account Details → Export Private Key
   - ⚠️ **警告**：永远不要分享或提交真实的私钥！

### 2. 配置环境变量

编辑 `contracts/ethereum/.env` 文件：

```bash
# Sepolia RPC URL (已配置 Alchemy)
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/N-UzzxYZbLPikS4Fc6pqC

# 您的私钥（替换 YOUR_PRIVATE_KEY_HERE）
PRIVATE_KEY=0x你的私钥

# Etherscan API Key（用于合约验证）
# 访问 https://etherscan.io/myapikey 获取
ETHERSCAN_API_KEY=你的API密钥

# Gas 报告
REPORT_GAS=true
```

⚠️ **安全提示**：
- 不要将 `.env` 文件提交到 Git
- 使用测试钱包，不要使用主网钱包
- 部署后立即删除 `.env` 中的私钥

---

## 部署步骤

### Step 1: 安装依赖

```bash
cd contracts/ethereum
npm install
```

### Step 2: 编译合约

```bash
npx hardhat compile
```

预期输出：
```
Compiled 15 Solidity files successfully
```

### Step 3: 部署到 Sepolia

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

预期输出：
```
Starting deployment...

Deploying contracts with account: 0x你的地址
Account balance: 0.5 ETH

Deploying Mock USDC...
Mock USDC deployed to: 0x...

Deploying Mock DAI...
Mock DAI deployed to: 0x...

Deploying StreamPayment contract...
StreamPayment deployed to: 0x...

Minting test tokens...
Minted 1,000,000 USDC to deployer
Minted 1,000,000 DAI to deployer

=== Deployment Summary ===
Network: sepolia
Deployer: 0x你的地址

Contract Addresses:
- Mock USDC: 0x...
- Mock DAI: 0x...
- StreamPayment: 0x...

Deployment info saved to: sepolia-1730123456789.json

=== Deployment Complete ===
```

### Step 4: 验证合约（可选但推荐）

```bash
# 验证 Mock USDC
npx hardhat verify --network sepolia <MOCK_USDC_ADDRESS> "Mock USDC" "USDC" 6

# 验证 Mock DAI
npx hardhat verify --network sepolia <MOCK_DAI_ADDRESS> "Mock DAI" "DAI" 18

# 验证 StreamPayment
npx hardhat verify --network sepolia <STREAM_PAYMENT_ADDRESS>
```

预期输出：
```
Successfully verified contract StreamPayment on Etherscan.
https://sepolia.etherscan.io/address/0x...#code
```

---

## 部署后配置

### 1. 更新前端配置

编辑 `/src/config/contracts.js`：

```javascript
export const CONTRACTS = {
  SEPOLIA: {
    CHAIN_ID: 11155111,
    RPC_URL: 'https://eth-sepolia.g.alchemy.com/v2/N-UzzxYZbLPikS4Fc6pqC',
    
    // 更新为实际部署的地址
    STREAM_PAYMENT: '0x你部署的StreamPayment地址',
    MOCK_USDC: '0x你部署的MockUSDC地址',
    MOCK_DAI: '0x你部署的MockDAI地址',
  }
};
```

### 2. 更新合约 ABI

复制生成的 ABI 文件：

```bash
# 从 artifacts 复制 ABI 到前端
cp contracts/ethereum/artifacts/contracts/streaming/StreamPayment.sol/StreamPayment.json \
   src/contracts/StreamPaymentABI.json
```

### 3. 测试部署

访问 Sepolia Etherscan 查看合约：

```
https://sepolia.etherscan.io/address/<YOUR_CONTRACT_ADDRESS>
```

---

## 故障排除

### 问题 1: "insufficient funds for gas"

**原因**: 钱包中没有足够的 Sepolia ETH

**解决方案**:
1. 访问 Sepolia Faucet 获取测试 ETH
2. 等待几分钟后重试

### 问题 2: "nonce too low"

**原因**: 交易 nonce 冲突

**解决方案**:
```bash
# 重置 Hardhat 网络
npx hardhat clean
# 重新部署
npx hardhat run scripts/deploy.js --network sepolia
```

### 问题 3: "invalid API key"

**原因**: Etherscan API Key 无效或未配置

**解决方案**:
1. 访问 https://etherscan.io/myapikey
2. 创建新的 API Key
3. 更新 `.env` 文件中的 `ETHERSCAN_API_KEY`

### 问题 4: 编译错误

**原因**: OpenZeppelin 依赖未安装

**解决方案**:
```bash
cd contracts/ethereum
npm install @openzeppelin/contracts
npx hardhat compile
```

---

## 部署信息

部署信息会自动保存到 `contracts/ethereum/deployments/` 目录：

```json
{
  "network": "sepolia",
  "deployer": "0x...",
  "timestamp": "2025-10-30T...",
  "contracts": {
    "mockUSDC": "0x...",
    "mockDAI": "0x...",
    "streamPayment": "0x..."
  }
}
```

---

## 下一步

1. ✅ 合约已部署到 Sepolia
2. ✅ 合约已在 Etherscan 上验证
3. 🔄 更新前端配置
4. 🔄 测试前端功能
5. 🔄 部署前端到 Vercel

---

## 安全检查清单

- [ ] 使用测试钱包（不是主网钱包）
- [ ] 私钥未提交到 Git
- [ ] 合约已在 Etherscan 上验证
- [ ] 部署地址已记录
- [ ] 前端配置已更新
- [ ] 功能已测试

---

## 联系方式

- **GitHub**: https://github.com/everest-an/Protocol-Bank
- **网站**: https://www.protocolbanks.com
- **技术支持**: https://help.manus.im

---

**部署时间**: 预计 5-10 分钟  
**Gas 消耗**: 约 0.01-0.05 Sepolia ETH  
**状态**: 准备就绪 ✅

