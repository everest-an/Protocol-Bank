# X402 Batch Settlement - Base Sepolia 部署指南

本指南专门介绍如何将 X402 批量结算系统部署到 Base Sepolia 测试网。

---

## 📋 前置要求

### 1. 环境准备

**必需软件**:
- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Git

**安装依赖**:
```bash
cd contracts/ethereum
pnpm install
```

### 2. 获取测试 ETH

**Base Sepolia Faucet**:
- 访问: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
- 连接钱包并申请测试 ETH
- 至少需要 0.001 ETH 用于部署

**其他 Faucet**:
- https://faucet.quicknode.com/base/sepolia
- https://www.alchemy.com/faucets/base-sepolia

### 3. 配置环境变量

创建 `.env` 文件:
```bash
cd contracts/ethereum
cp .env.example .env
```

编辑 `.env` 文件:
```env
# Private Key (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Base Sepolia RPC URL
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# Etherscan API Key (for verification)
ETHERSCAN_API_KEY=your_etherscan_api_key

# Optional: Alchemy API Key
ALCHEMY_API_KEY=your_alchemy_api_key
```

⚠️ **安全提示**:
- 不要在主网使用测试私钥
- 不要将 `.env` 文件提交到 Git
- 使用专门的测试钱包

---

## 🚀 部署步骤

### 一键部署 (推荐)

```bash
cd contracts/ethereum

# 部署到 Base Sepolia
npx hardhat run scripts/deploy-x402-base-sepolia.js --network baseSepolia
```

**部署过程**:
1. ✅ 检查账户余额
2. ✅ 部署 MockUSDC_EIP3009 合约
3. ✅ 铸造 100,000 测试 USDC
4. ✅ 部署 X402BatchSettlement 合约
5. ✅ 等待区块确认
6. ✅ 在 BaseScan 上验证合约
7. ✅ 保存部署信息到文件
8. ✅ 生成前端和后端配置

---

## 🔧 配置前端

### 1. 更新环境变量

编辑 `apps/frontend/.env`:
```env
# Base Sepolia Network
VITE_BASE_SEPOLIA_CHAIN_ID=84532
VITE_BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# X402 Contracts (替换为实际部署的地址)
VITE_BASE_SEPOLIA_X402_ADDRESS=0x...
VITE_BASE_SEPOLIA_USDC_ADDRESS=0x...
```

### 2. 更新前端配置

编辑 `apps/frontend/src/services/x402Service.js`:
```javascript
export const X402_CONFIG = {
  // ... existing config ...
  
  // Base Sepolia
  baseSepolia: {
    chainId: 84532,
    batchSettlementAddress: process.env.VITE_BASE_SEPOLIA_X402_ADDRESS,
    usdcAddress: process.env.VITE_BASE_SEPOLIA_USDC_ADDRESS,
    rpcUrl: 'https://sepolia.base.org',
    explorerUrl: 'https://sepolia.basescan.org'
  }
};
```

---

## ✅ 验证部署

### 1. 检查合约

访问 BaseScan 查看合约:
- MockUSDC: https://sepolia.basescan.org/address/[YOUR_USDC_ADDRESS]
- X402BatchSettlement: https://sepolia.basescan.org/address/[YOUR_X402_ADDRESS]

### 2. 测试批量结算

```bash
npx hardhat run scripts/test-batch-settlement.js --network baseSepolia
```

### 3. 前端测试

1. 启动前端: `cd apps/frontend && pnpm dev`
2. 连接钱包到 Base Sepolia
3. 访问 Batch Payment 页面
4. 点击 "Get Test USDC"
5. 创建批量支付并执行

---

## 📚 相关资源

- Base Sepolia 文档: https://docs.base.org
- BaseScan: https://sepolia.basescan.org
- Faucet: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

---

**最后更新**: 2025-11-14  
**版本**: 1.0
