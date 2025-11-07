# ClearingHouse.sol - 部署与使用指南

**版本**: 1.0  
**日期**: 2025-11-08  
**作者**: Manus AI

---

## 1. 概述

本文档提供了`ClearingHouse.sol`智能合约的完整部署和使用指南,包括环境配置、部署步骤、测试方法和集成示例。

---

## 2. 环境准备

### 2.1. 安装依赖

```bash
cd blockchain
npm install
```

### 2.2. 配置环境变量

创建`.env`文件并配置以下变量:

```bash
# 以太坊节点RPC URL
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# 部署者私钥 (不要提交到Git!)
PRIVATE_KEY=0x...

# USDC代币地址
USDC_ADDRESS=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48  # 主网
# USDC_ADDRESS=0x...  # 测试网

# 净额引擎地址
NETTING_ENGINE_ADDRESS=0x...

# Etherscan API Key (用于合约验证)
ETHERSCAN_API_KEY=YOUR_API_KEY
```

---

## 3. 部署步骤

### 3.1. 编译合约

```bash
npx hardhat compile
```

### 3.2. 运行测试

```bash
npx hardhat test test/ClearingHouse.test.js
```

### 3.3. 部署到测试网 (Sepolia)

```bash
npx hardhat run scripts/deploy-clearinghouse.js --network sepolia
```

### 3.4. 部署到主网

```bash
npx hardhat run scripts/deploy-clearinghouse.js --network mainnet
```

部署成功后,合约地址和相关信息会保存在`./deployments/`目录下。

---

## 4. 合约交互

### 4.1. 使用Hardhat Console

```bash
npx hardhat console --network sepolia
```

```javascript
const ClearingHouse = await ethers.getContractFactory("ClearingHouse");
const clearingHouse = await ClearingHouse.attach("0x...");  // 合约地址

// 查询参与者数量
const count = await clearingHouse.getParticipantCount();
console.log("参与者数量:", count.toString());

// 注册参与者
await clearingHouse.registerParticipant("0x...", "Bank A");

// 查询参与者信息
const participant = await clearingHouse.getParticipant("0x...");
console.log("参与者:", participant);
```

### 4.2. 使用Ethers.js

```javascript
const { ethers } = require("ethers");

// 连接到以太坊节点
const provider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// 连接到合约
const clearingHouseABI = require("./artifacts/contracts/ClearingHouse.sol/ClearingHouse.json").abi;
const clearingHouse = new ethers.Contract("0x...", clearingHouseABI, wallet);

// 存入抵押品
const usdcAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const usdc = new ethers.Contract(usdcAddress, ["function approve(address,uint256)"], wallet);
await usdc.approve(clearingHouse.address, ethers.constants.MaxUint256);

const depositAmount = ethers.utils.parseUnits("10000", 6);  // 10,000 USDC
const tx = await clearingHouse.deposit(depositAmount);
await tx.wait();
console.log("存入成功!");
```

---

## 5. 净额引擎集成

### 5.1. 提交净头寸

净额引擎需要在每个结算周期结束时调用`submitNetPositions`函数:

```javascript
const batchId = 1;
const windowEnd = Math.floor(Date.now() / 1000);
const positions = [
  { participant: "0xParticipant1", amount: ethers.utils.parseUnits("1000", 6) },
  { participant: "0xParticipant2", amount: ethers.utils.parseUnits("-500", 6) },
  { participant: "0xParticipant3", amount: ethers.utils.parseUnits("-500", 6) }
];

// 计算签名
const positionsHash = ethers.utils.keccak256(
  ethers.utils.defaultAbiCoder.encode(
    ["tuple(address participant, int256 amount)[]"],
    [positions]
  )
);

const messageHash = ethers.utils.solidityKeccak256(
  ["uint256", "uint256", "bytes32"],
  [batchId, windowEnd, positionsHash]
);

const signature = await nettingEngineWallet.signMessage(ethers.utils.arrayify(messageHash));

// 提交净头寸
const tx = await clearingHouse.connect(nettingEngineWallet).submitNetPositions(
  batchId,
  windowEnd,
  positions,
  signature
);
await tx.wait();
console.log("净头寸已提交!");
```

### 5.2. 执行结算

任何人都可以调用`settle`函数来执行已提交的结算批次:

```javascript
const tx = await clearingHouse.settle(batchId, positions);
await tx.wait();
console.log("结算完成!");
```

---

## 6. 安全注意事项

### 6.1. 私钥管理

- **永远不要**将私钥提交到Git仓库
- 使用硬件钱包(如Ledger)进行主网部署
- 考虑使用多重签名钱包管理合约所有权

### 6.2. 审计

在主网部署前,**必须**进行完整的安全审计:

- 推荐审计公司: OpenZeppelin, Trail of Bits, ConsenSys Diligence
- 审计范围: 智能合约代码、净额引擎、链下消息传递

### 6.3. 监控

部署后,建议设置以下监控:

- 合约事件监听 (使用Ethers.js或The Graph)
- 异常交易告警 (如大额提取、失败的结算)
- Gas费用监控

---

## 7. 故障排查

### 7.1. 常见错误

| 错误信息 | 原因 | 解决方法 |
|---------|------|---------|
| `ClearingHouse: caller is not netting engine` | 调用者不是净额引擎 | 确保使用正确的钱包地址 |
| `ClearingHouse: net positions must sum to zero` | 净头寸总和不为零 | 检查净额计算逻辑 |
| `ClearingHouse: insufficient collateral` | 抵押品不足 | 参与者需要存入更多抵押品 |
| `ClearingHouse: invalid signature` | 签名验证失败 | 检查签名生成逻辑和净额引擎地址 |

### 7.2. 调试技巧

- 使用`hardhat console`进行交互式调试
- 在测试网上先进行完整的端到端测试
- 使用`console.log`在Solidity合约中输出调试信息 (需要Hardhat)

---

## 8. 升级计划

当前版本的`ClearingHouse.sol`不支持升级。如果需要修改合约逻辑,有以下选项:

1. **部署新版本**: 部署新合约,迁移所有参与者和抵押品
2. **使用代理模式**: 在下一版本中采用OpenZeppelin的透明代理或UUPS代理模式
3. **模块化设计**: 将核心逻辑拆分为多个合约,通过接口调用

---

## 9. 参考资料

- [Hardhat 文档](https://hardhat.org/getting-started/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Ethers.js 文档](https://docs.ethers.io/)
- [EIP-1620: 流式支付标准](https://eips.ethereum.org/EIPS/eip-1620)
