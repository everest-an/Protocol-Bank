# 智能合约集成文档
# Smart Contract Integration Guide

## 概述 / Overview

本文档说明如何在 Protocol Bank 应用中集成和使用智能合约。

This document explains how to integrate and use smart contracts in the Protocol Bank application.

---

## 合约配置 / Contract Configuration

### 1. 环境变量配置

创建 `.env` 文件（已在 `.gitignore` 中）：

```env
# Alchemy RPC Configuration
VITE_ALCHEMY_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# Sepolia Network Configuration
VITE_SEPOLIA_CHAIN_ID=11155111

# Smart Contract Addresses
VITE_STAKED_ESCROW_ADDRESS=0x44a55360BaBc86d6443471Aa473E9Fa693037f04
VITE_STREAM_PAYMENT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
VITE_MOCK_USDC_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

### 2. 统一配置文件

所有合约配置集中在 `/src/config/contracts.js`：

```javascript
export const SEPOLIA_CONFIG = {
  chainId: 11155111,
  chainIdHex: '0xaa36a7',
  name: 'Sepolia Test Network',
  rpcUrl: import.meta.env.VITE_ALCHEMY_RPC_URL,
  explorerUrl: 'https://sepolia.etherscan.io',
  nativeCurrency: {
    name: 'Sepolia ETH',
    symbol: 'ETH',
    decimals: 18
  }
}
```

---

## 使用方法 / Usage

### 1. 连接钱包 / Connect Wallet

```javascript
import { useWeb3 } from '../hooks/useWeb3'

function MyComponent() {
  const { 
    account,           // 当前账户地址
    isConnected,       // 是否已连接
    isSepolia,         // 是否在 Sepolia 网络
    connect,           // 连接钱包
    disconnect,        // 断开连接
    switchToSepolia    // 切换到 Sepolia
  } = useWeb3()

  return (
    <button onClick={connect}>
      {isConnected ? account : 'Connect Wallet'}
    </button>
  )
}
```

### 2. 使用 StakeContract / Use StakeContract

```javascript
import { useStakeContract } from '../hooks/useStakeContract'

function StakeComponent() {
  const { account } = useWeb3()
  const {
    loading,
    createPool,
    addToWhitelist,
    executePayment,
    getPool
  } = useStakeContract(account)

  // 创建质押池
  const handleCreatePool = async () => {
    try {
      const result = await createPool(companyAddress, amountInEth)
      console.log('Pool created:', result.poolId)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  // 添加白名单
  const handleAddWhitelist = async () => {
    try {
      await addToWhitelist(poolId, recipientAddress, name, category)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  // 执行支付
  const handlePayment = async () => {
    try {
      await executePayment(poolId, toAddress, amountInEth, purpose)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <div>
      <button onClick={handleCreatePool} disabled={loading}>
        Create Pool
      </button>
    </div>
  )
}
```

### 3. 读取链上数据 / Read On-chain Data

```javascript
// 获取池信息
const poolInfo = await getPool(poolId)
console.log('Pool:', poolInfo)

// 获取白名单
const whitelist = await getWhitelist(poolId)
console.log('Whitelist:', whitelist)

// 获取支付历史
const payments = await getPoolPayments(poolId)
console.log('Payments:', payments)

// 获取可用余额
const balance = await getAvailableBalance(poolId)
console.log('Available:', balance)
```

---

## 合约方法 / Contract Methods

### StakedPaymentEscrow 合约

#### 写入方法 / Write Methods

| 方法 | 参数 | 说明 |
|------|------|------|
| `createPool` | `companyAddress, amountInEth` | 创建新的质押池 |
| `stakeFunds` | `poolId, amountInEth` | 向池中追加质押 |
| `addToWhitelist` | `poolId, recipientAddress, name, category` | 添加白名单地址 |
| `approveWhitelist` | `poolId, recipientAddress` | 批准白名单地址 |
| `executePayment` | `poolId, toAddress, amountInEth, purpose` | 执行支付 |
| `releaseFunds` | `poolId, amountInEth` | 释放资金给质押者 |
| `closePool` | `poolId` | 关闭池 |

#### 读取方法 / Read Methods

| 方法 | 参数 | 返回值 |
|------|------|--------|
| `getPool` | `poolId` | 池信息对象 |
| `getAvailableBalance` | `poolId` | 可用余额（ETH） |
| `getWhitelist` | `poolId` | 白名单数组 |
| `getPoolPayments` | `poolId` | 支付历史数组 |
| `getCompanyPools` | `companyAddress` | 公司的池 ID 数组 |
| `getStakerPools` | `stakerAddress` | 质押者的池 ID 数组 |

---

## 错误处理 / Error Handling

### 常见错误

1. **MetaMask 未安装**
```javascript
if (!isMetaMaskInstalled) {
  alert('Please install MetaMask')
}
```

2. **网络错误**
```javascript
if (!isSepolia) {
  await switchToSepolia()
}
```

3. **交易失败**
```javascript
try {
  await executePayment(...)
} catch (error) {
  if (error.code === 4001) {
    // 用户拒绝交易
    console.log('Transaction rejected by user')
  } else {
    // 其他错误
    console.error('Transaction failed:', error.message)
  }
}
```

---

## 测试 / Testing

### 在 Sepolia 测试网测试

1. **获取测试 ETH**
   - 访问 https://sepoliafaucet.com/
   - 输入您的钱包地址
   - 获取免费测试 ETH

2. **连接 MetaMask**
   - 确保 MetaMask 已切换到 Sepolia 网络
   - 点击 "Connect Wallet" 按钮

3. **测试合约功能**
   - 创建质押池
   - 添加白名单
   - 执行支付
   - 查看交易历史

### 查看交易

所有交易可以在 Sepolia Etherscan 上查看：
https://sepolia.etherscan.io/

---

## 安全注意事项 / Security Notes

1. **永远不要提交 `.env` 文件到 Git**
   - 已添加到 `.gitignore`
   - 包含敏感的 API 密钥

2. **验证用户输入**
   - 检查地址格式
   - 验证金额范围
   - 确认交易前显示详情

3. **错误处理**
   - 捕获所有异常
   - 向用户显示友好的错误消息
   - 记录错误日志

4. **交易确认**
   - 等待交易确认
   - 显示加载状态
   - 处理失败情况

---

## 部署 / Deployment

### Vercel 环境变量配置

在 Vercel 项目设置中添加环境变量：

```
VITE_ALCHEMY_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
VITE_STAKED_ESCROW_ADDRESS=0x44a55360BaBc86d6443471Aa473E9Fa693037f04
VITE_STREAM_PAYMENT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### 部署命令

```bash
# 构建
pnpm run build

# 预览
pnpm run preview

# 部署到 Vercel
vercel --prod
```

---

## 故障排查 / Troubleshooting

### 问题：无法连接钱包

**解决方案：**
1. 确保已安装 MetaMask
2. 刷新页面
3. 检查浏览器控制台错误

### 问题：交易失败

**解决方案：**
1. 检查账户余额是否足够
2. 确认 Gas 费用设置
3. 查看 Etherscan 上的交易详情

### 问题：合约调用失败

**解决方案：**
1. 确认网络是 Sepolia
2. 检查合约地址是否正确
3. 验证 ABI 是否匹配

---

## 联系支持 / Contact Support

如有问题，请访问：
https://help.manus.im

---

**最后更新**: 2025-10-28
**版本**: 1.0.0

