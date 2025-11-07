# Sepolia测试网部署指南

**版本**: 1.0  
**日期**: 2025-11-08  
**目标**: 将ClearingHouse.sol部署到Sepolia测试网

---

## 前置准备

### 1. 获取Sepolia ETH

访问以下任一水龙头获取测试ETH:

- [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
- [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia)
- [Chainlink Sepolia Faucet](https://faucets.chain.link/sepolia)

**建议余额**: 至少0.1 ETH用于部署和测试

### 2. 获取Alchemy/Infura RPC URL

**Alchemy** (推荐):
1. 访问 [https://www.alchemy.com/](https://www.alchemy.com/)
2. 创建免费账户
3. 创建新应用,选择"Sepolia"网络
4. 复制HTTPS RPC URL

**Infura**:
1. 访问 [https://www.infura.io/](https://www.infura.io/)
2. 创建免费账户
3. 创建新项目
4. 复制Sepolia端点URL

### 3. 准备部署钱包

**选项A: 使用MetaMask导出私钥**
1. 打开MetaMask
2. 点击账户 → 账户详情 → 导出私钥
3. **警告**: 永远不要分享或提交私钥到Git!

**选项B: 生成新的测试钱包**
```javascript
const { ethers } = require("ethers");
const wallet = ethers.Wallet.createRandom();
console.log("Address:", wallet.address);
console.log("Private Key:", wallet.privateKey);
```

### 4. 部署Mock USDC (可选)

如果Sepolia上没有可用的USDC,需要先部署Mock USDC:

```bash
npx hardhat run scripts/deploy-mock-usdc.js --network sepolia
```

---

## 配置环境变量

在`blockchain`目录下创建`.env`文件:

```bash
cd blockchain
cp .env.example .env
nano .env
```

填入以下信息:

```bash
# Sepolia RPC URL
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# 部署者私钥 (DO NOT COMMIT!)
PRIVATE_KEY=0x...

# USDC地址 (Mock USDC或已有的测试USDC)
USDC_ADDRESS_SEPOLIA=0x...

# 净额引擎地址 (用于签名验证)
NETTING_ENGINE_ADDRESS=0x...

# Etherscan API Key (用于合约验证)
ETHERSCAN_API_KEY=YOUR_API_KEY
```

---

## 部署步骤

### 步骤1: 部署Mock USDC (如需要)

```bash
npx hardhat run scripts/deploy-mock-usdc.js --network sepolia
```

**预期输出**:
```
Deploying MockERC20...
MockERC20 deployed to: 0x...
```

将地址保存到`.env`的`USDC_ADDRESS_SEPOLIA`。

### 步骤2: 部署ClearingHouse

```bash
npx hardhat run scripts/deploy-clearinghouse.js --network sepolia
```

**预期输出**:
```
Deploying ClearingHouse...
  Collateral Token: 0x...
  Netting Engine: 0x...
ClearingHouse deployed to: 0x...
Deployment saved to: ./deployments/sepolia/ClearingHouse.json
```

### 步骤3: 验证合约 (可选但推荐)

```bash
npx hardhat verify --network sepolia <CLEARINGHOUSE_ADDRESS> <USDC_ADDRESS> <NETTING_ENGINE_ADDRESS>
```

**预期输出**:
```
Successfully verified contract ClearingHouse on Etherscan.
https://sepolia.etherscan.io/address/0x...#code
```

---

## 后续配置

### 1. 更新Backend环境变量

在`apps/backend/.env`中添加:

```bash
CLEARING_HOUSE_ADDRESS=0x...  # 刚部署的ClearingHouse地址
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
NETTING_ENGINE_PRIVATE_KEY=0x...  # 净额引擎的私钥
```

### 2. 运行数据库迁移

```bash
cd apps/backend
psql -U postgres -d protocol_bank -f migrations/20251108_create_netting_engine_tables.sql
```

### 3. 注册测试参与者

使用Hardhat Console:

```bash
npx hardhat console --network sepolia
```

```javascript
const ClearingHouse = await ethers.getContractFactory("ClearingHouse");
const clearingHouse = await ClearingHouse.attach("0x...");  // 你的合约地址

// 注册参与者
await clearingHouse.registerParticipant("0xParticipant1Address", "Bank A");
await clearingHouse.registerParticipant("0xParticipant2Address", "Bank B");
await clearingHouse.registerParticipant("0xParticipant3Address", "Bank C");

console.log("Participants registered!");
```

### 4. 存入测试抵押品

```javascript
// 获取USDC合约
const usdc = await ethers.getContractAt("IERC20", "0x...");  // USDC地址

// 批准ClearingHouse
await usdc.approve(clearingHouse.target, ethers.MaxUint256);

// 存入抵押品
await clearingHouse.deposit(ethers.parseUnits("10000", 6));  // 10,000 USDC

console.log("Collateral deposited!");
```

---

## 端到端测试

### 测试场景1: 提交交易指令

使用API提交测试交易:

```bash
curl -X POST http://localhost:3001/api/v1/netting-engine/trades \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "payerAddress": "0xParticipant1",
    "receiverAddress": "0xParticipant2",
    "amount": "100.00"
  }'
```

### 测试场景2: 手动触发结算

```bash
curl -X POST http://localhost:3001/api/v1/netting-engine/settlement/trigger \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 测试场景3: 查看结算结果

访问前端ClearingHouse页面:
```
https://protocolbanks.com
```

导航到"ClearingHouse"标签,查看:
- 最新的结算批次
- 参与者列表
- 统计数据

---

## 监控与调试

### 查看合约事件

在Etherscan上查看合约事件:
```
https://sepolia.etherscan.io/address/<CLEARINGHOUSE_ADDRESS>#events
```

### 查看交易详情

```
https://sepolia.etherscan.io/tx/<TX_HASH>
```

### 后端日志

```bash
cd apps/backend
tail -f logs/settlement.log
```

---

## 故障排查

### 问题1: 部署失败 - "insufficient funds"

**原因**: 账户ETH余额不足

**解决**: 从水龙头获取更多Sepolia ETH

### 问题2: 签名验证失败

**原因**: 净额引擎地址配置错误

**解决**: 确保`.env`中的`NETTING_ENGINE_ADDRESS`与合约部署时使用的地址一致

### 问题3: 结算失败 - "insufficient collateral"

**原因**: 参与者抵押品不足

**解决**: 参与者需要存入更多抵押品

---

## 安全注意事项

⚠️ **重要提醒**:

1. **永远不要**将私钥提交到Git仓库
2. **永远不要**在生产环境使用测试网私钥
3. **永远不要**在公共场合分享私钥或助记词
4. 使用`.gitignore`确保`.env`文件不被追踪
5. 定期轮换API密钥和私钥

---

## 下一步

部署成功后:

1. ✅ 在前端测试完整的用户流程
2. ✅ 进行压力测试 (大量交易)
3. ✅ 准备安全审计
4. ✅ 编写用户文档
5. ✅ 准备主网部署

---

## 参考资料

- [Hardhat部署文档](https://hardhat.org/hardhat-runner/docs/guides/deploying)
- [Etherscan验证指南](https://hardhat.org/hardhat-runner/plugins/nomicfoundation-hardhat-verify)
- [Sepolia测试网信息](https://sepolia.dev/)
- [Alchemy文档](https://docs.alchemy.com/)
