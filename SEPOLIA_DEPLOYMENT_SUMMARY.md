# Protocol Bank - Sepolia测试网部署总结

**部署日期**: 2025-11-08  
**网络**: Sepolia测试网  
**部署者**: 0x66794fC75C351ad9677cB00B2043868C11dfcadA

---

## 1. 已部署合约

### Mock USDC (测试代币)

| 属性 | 值 |
| :--- | :--- |
| **合约地址** | `0xcAf961A9670b16a5308032368C9223b1C35542e1` |
| **代币名称** | Mock USDC |
| **代币符号** | USDC |
| **精度** | 6 |
| **初始供应量** | 1,000,000 USDC |
| **区块链浏览器** | [查看合约](https://sepolia.etherscan.io/address/0xcAf961A9670b16a5308032368C9223b1C35542e1) |

### ClearingHouse (清算所主合约)

| 属性 | 值 |
| :--- | :--- |
| **合约地址** | `0xEf646FfBEd6Ee705F2A2A4fF835bD3Ae70950984` |
| **抵押品代币** | 0xcAf961A9670b16a5308032368C9223b1C35542e1 (Mock USDC) |
| **净额引擎地址** | 0x66794fC75C351ad9677cB00B2043868C11dfcadA |
| **所有者** | 0x66794fC75C351ad9677cB00B2043868C11dfcadA |
| **区块链浏览器** | [查看合约](https://sepolia.etherscan.io/address/0xEf646FfBEd6Ee705F2A2A4fF835bD3Ae70950984) |

---

## 2. 钱包状态

| 项目 | 值 |
| :--- | :--- |
| **地址** | 0x66794fC75C351ad9677cB00B2043868C11dfcadA |
| **剩余ETH** | ~0.091 ETH |
| **USDC余额** | 1,000,000 USDC |

---

## 3. 如何使用

### 步骤1: 配置后端服务

```bash
cd apps/backend

# 复制Sepolia配置
cp .env.sepolia .env

# 安装依赖
npm install

# 运行数据库迁移
psql -U postgres -d protocol_bank -f migrations/20251108_create_netting_engine_tables.sql

# 启动后端服务
npm start
```

后端服务将在 `http://localhost:3001` 运行。

### 步骤2: 配置前端应用

```bash
cd apps/frontend

# 复制Sepolia配置
cp .env.sepolia .env

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端应用将在 `http://localhost:5173` 运行。

### 步骤3: 注册测试参与者

使用Hardhat Console连接到Sepolia:

```bash
cd blockchain
npx hardhat console --network sepolia
```

在控制台中执行:

```javascript
const ClearingHouse = await ethers.getContractFactory("ClearingHouse");
const clearingHouse = await ClearingHouse.attach("0xEf646FfBEd6Ee705F2A2A4fF835bD3Ae70950984");

// 注册参与者 (示例)
await clearingHouse.registerParticipant("0xParticipant1Address", "Bank A");
await clearingHouse.registerParticipant("0xParticipant2Address", "Bank B");
await clearingHouse.registerParticipant("0xParticipant3Address", "Bank C");

console.log("Participants registered!");
```

### 步骤4: 存入抵押品

```javascript
// 获取USDC合约
const usdc = await ethers.getContractAt("IERC20", "0xcAf961A9670b16a5308032368C9223b1C35542e1");

// 批准ClearingHouse使用USDC
await usdc.approve(clearingHouse.target, ethers.MaxUint256);

// 存入抵押品 (10,000 USDC)
await clearingHouse.deposit(ethers.parseUnits("10000", 6));

console.log("Collateral deposited!");
```

### 步骤5: 提交测试交易

通过后端API提交交易指令:

```bash
curl -X POST http://localhost:3001/api/v1/netting-engine/trades \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "payerAddress": "0xParticipant1",
    "receiverAddress": "0xParticipant2",
    "amount": "100.00"
  }'
```

### 步骤6: 触发结算

手动触发结算:

```bash
curl -X POST http://localhost:3001/api/v1/netting-engine/settlement/trigger \
  -H "Authorization: Bearer YOUR_TOKEN"
```

或者等待自动结算 (每小时一次)。

---

## 4. 监控与调试

### 查看合约事件

访问Etherscan查看合约事件:
- https://sepolia.etherscan.io/address/0xEf646FfBEd6Ee705F2A2A4fF835bD3Ae70950984#events

### 查看交易详情

每次结算后,会生成一个链上交易。可以在Etherscan上查看:
- https://sepolia.etherscan.io/address/0xEf646FfBEd6Ee705F2A2A4fF835bD3Ae70950984

### 前端管理界面

访问前端应用,导航到 **ClearingHouse** 标签:
- 查看实时统计数据
- 浏览参与者列表
- 查看结算批次历史
- 手动触发结算

---

## 5. 重要提醒

⚠️ **这是测试网部署,仅用于开发和测试目的**

- 不要在测试网上存储真实资产
- 私钥已在本地使用,请勿泄露
- Sepolia ETH和USDC都是测试代币,没有实际价值
- 在部署到主网之前,务必进行完整的安全审计

---

## 6. 下一步

- ✅ 在前端测试完整的用户流程
- ✅ 进行端到端集成测试
- ✅ 压力测试 (提交大量交易)
- ⏳ 准备安全审计
- ⏳ 编写用户文档
- ⏳ 准备主网部署

---

## 7. 技术支持

如有任何问题,请参考:
- **部署指南**: `blockchain/SEPOLIA_DEPLOYMENT_GUIDE.md`
- **净额引擎文档**: `apps/backend/NETTING_ENGINE_README.md`
- **GitHub仓库**: https://github.com/everest-an/Protocol-Bank

---

**部署完成!** 🎉
