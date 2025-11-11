# Protocol Bank - 智能合约部署文档

**更新日期:** 2025年11月12日  
**网络:** Sepolia Testnet, Base Sepolia Testnet

---

## 📊 已部署的合约

### Sepolia Testnet (Chain ID: 11155111)

#### 1. StreamPayment合约
- **地址:** `0x8871c707A8E1fb92666F6B2fD448C746fEBBA23d`
- **部署者:** `0x66794fC75C351ad9677cB00B2043868C11dfcadA`
- **部署时间:** 2025-11-12
- **浏览器:** https://sepolia.etherscan.io/address/0x8871c707A8E1fb92666F6B2fD448C746fEBBA23d
- **状态:** ✅ 已部署,已集成到前端

**功能:**
- 创建流式支付
- 暂停/恢复支付流
- 取消支付流
- 提取已流出的代币
- 查询支付流信息

#### 2. Mock USDC
- **地址:** `0xf6d01Aca4eC4DDde69c9f8119B607E10AD248cC7`
- **符号:** USDC
- **精度:** 6
- **浏览器:** https://sepolia.etherscan.io/address/0xf6d01Aca4eC4DDde69c9f8119B607E10AD248cC7
- **状态:** ✅ 已部署

#### 3. Mock DAI
- **地址:** `0x399F5902226705B23Ce22F10a8E676A2B1f782d0`
- **符号:** DAI
- **精度:** 18
- **浏览器:** https://sepolia.etherscan.io/address/0x399F5902226705B23Ce22F10a8E676A2B1f782d0
- **状态:** ✅ 已部署

---

### Base Sepolia Testnet (Chain ID: 84532)

#### 1. X402BatchSettlement合约
- **地址:** ⏳ 待部署
- **状态:** ❌ 等待测试ETH
- **原因:** 部署账户Base Sepolia余额为0

**获取测试ETH:**
1. Coinbase Faucet: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
2. Alchemy Faucet: https://www.alchemy.com/faucets/base-sepolia
3. QuickNode Faucet: https://faucet.quicknode.com/base/sepolia

**部署命令:**
```bash
cd /home/ubuntu/Protocol-Bank/contracts/ethereum
npx hardhat run scripts/deploy-x402-batch-settlement.js --network baseSepolia
```

---

## 🔧 前端配置

### contractService.js

```javascript
export const CONTRACTS = {
  STREAM_PAYMENT: '0x8871c707A8E1fb92666F6B2fD448C746fEBBA23d',
  MOCK_USDC: '0xf6d01Aca4eC4DDde69c9f8119B607E10AD248cC7',
  MOCK_DAI: '0x399F5902226705B23Ce22F10a8E676A2B1f782d0',
};

export const SEPOLIA_CHAIN_ID = 11155111;
```

**状态:** ✅ 已更新

---

## 📝 使用指南

### 1. 连接钱包

用户需要:
- 安装MetaMask
- 切换到Sepolia测试网
- 确保有足够的Sepolia ETH (用于gas费)

### 2. 获取测试代币

#### 方法1: 使用Faucet (推荐)
- Sepolia ETH Faucet: https://sepoliafaucet.com/
- 或使用Alchemy, Infura等提供的faucet

#### 方法2: 直接mint (如果有权限)
```javascript
// 连接到Mock USDC合约
const mockUSDC = new ethers.Contract(
  '0xf6d01Aca4eC4DDde69c9f8119B607E10AD248cC7',
  ['function mint(address to, uint256 amount)'],
  signer
);

// Mint 1000 USDC
await mockUSDC.mint(userAddress, ethers.parseUnits('1000', 6));
```

### 3. 创建Stream Payment

#### 通过前端UI:
1. 访问Stream Payment页面
2. 点击"Create Stream"按钮
3. 填写表单:
   - Stream Name
   - Recipient Address
   - Token (USDC/DAI)
   - Amount
   - Start Time
   - End Time
4. 点击"Create Stream"
5. 确认MetaMask交易 (approve + createStream)

#### 通过智能合约直接调用:
```javascript
import { createContractService, CONTRACTS } from './services/contractService';

const signer = await provider.getSigner();
const contractService = createContractService(signer);

const result = await contractService.createStream(
  '0x...recipientAddress',
  CONTRACTS.MOCK_USDC,
  '1000', // amount
  86400, // duration in seconds (1 day)
  'Monthly Salary'
);

console.log('Stream ID:', result.streamId);
console.log('Tx Hash:', result.txHash);
```

---

## 🧪 测试流程

### 测试场景1: 创建单个支付流

1. **准备:**
   - 连接MetaMask到Sepolia
   - 获取测试ETH和USDC

2. **操作:**
   - 打开创建表单
   - 填写信息
   - 提交交易

3. **验证:**
   - 检查交易是否成功
   - 在Etherscan查看交易
   - 确认streamId返回

### 测试场景2: 批量创建支付流

1. **准备:**
   - 下载CSV模板
   - 填写多个支付流信息

2. **操作:**
   - 上传CSV文件
   - 预览数据
   - 批量创建

3. **验证:**
   - 检查每个交易状态
   - 确认所有支付流创建成功

---

## 🔐 安全注意事项

### 1. 私钥管理

⚠️ **当前测试私钥已暴露,仅用于测试!**

- 测试私钥: `1cc1d0830f0316a907ca7029a173939c6f283ce67d0585cb048f26f092ad1718`
- 地址: `0x66794fC75C351ad9677cB00B2043868C11dfcadA`

**生产环境必须:**
- 使用新的私钥
- 使用硬件钱包或KMS
- 不要将私钥提交到代码库

### 2. 合约权限

StreamPayment合约的owner:
- 可以设置平台费用
- 可以暂停合约
- 可以更新费用接收地址

**建议:**
- 生产环境使用多签钱包作为owner
- 设置合理的费用上限
- 定期审计合约状态

### 3. 代币授权

用户创建支付流时需要:
1. Approve代币给StreamPayment合约
2. 调用createStream

**前端已自动处理:**
- 检查allowance
- 如果不足则先approve
- 然后创建stream

---

## 📊 Gas费用估算

### Sepolia Testnet

| 操作 | Gas Limit | Gas Price | 估算费用 (ETH) |
|:---|:---:|:---:|:---:|
| Approve | 50,000 | 20 gwei | 0.001 |
| Create Stream | 150,000 | 20 gwei | 0.003 |
| Pause Stream | 50,000 | 20 gwei | 0.001 |
| Cancel Stream | 80,000 | 20 gwei | 0.0016 |
| Withdraw | 100,000 | 20 gwei | 0.002 |

**总计 (创建一个stream):** ~0.004 ETH

---

## 🚀 部署历史

### 2025-11-12 - 初始部署

**部署的合约:**
- StreamPayment
- Mock USDC
- Mock DAI

**网络:** Sepolia Testnet

**部署者:** 0x66794fC75C351ad9677cB00B2043868C11dfcadA

**Gas消耗:**
- Mock USDC: ~1,200,000 gas
- Mock DAI: ~1,200,000 gas
- StreamPayment: ~2,500,000 gas

**总费用:** ~0.092 ETH

---

## 📝 待办事项

### 高优先级
- [ ] 部署X402BatchSettlement到Base Sepolia
- [ ] 验证合约到Etherscan
- [ ] 添加合约监控和告警

### 中优先级
- [ ] 实现批量创建的合约集成
- [ ] 添加合约事件监听
- [ ] 实现自动化测试

### 低优先级
- [ ] 优化Gas费用
- [ ] 添加更多代币支持
- [ ] 实现合约升级机制

---

## 🔗 相关链接

### 浏览器
- Sepolia Etherscan: https://sepolia.etherscan.io/
- Base Sepolia Explorer: https://sepolia.basescan.org/

### Faucets
- Sepolia ETH: https://sepoliafaucet.com/
- Base Sepolia ETH: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet

### 文档
- Hardhat: https://hardhat.org/docs
- Ethers.js: https://docs.ethers.org/v6/
- OpenZeppelin: https://docs.openzeppelin.com/contracts/

---

## 📞 联系方式

如有问题或需要支持,请联系:
- GitHub: https://github.com/everest-an/Protocol-Bank
- Issues: https://github.com/everest-an/Protocol-Bank/issues
