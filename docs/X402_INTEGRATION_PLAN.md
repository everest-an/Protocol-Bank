# X402 协议集成计划

**版本:** 1.0  
**日期:** 2025年11月11日  
**目标:** 将X402开放支付协议集成到Protocol Bank,实现低成本、即用即付的微交易能力

---

## 📋 X402 协议核心理解

### 什么是X402?

X402是由Coinbase支持的开放支付协议,通过HTTP 402状态码实现机器对机器(M2M)的即用即付微交易。

### 核心优势

1. **即用即付 (Pay-per-Call)** - 无需预付或订阅,按次计费
2. **"免Gas费"体验** - 用户只需签名授权,Gas费由中继者承担
3. **微交易优化** - 支持低至$0.0001的支付,通过L2和批量结算实现
4. **标准HTTP集成** - 利用现有网络基础设施,易于实现
5. **链上可审计** - 所有支付记录透明、不可篡改

### 技术栈

- **HTTP协议:** 402 Payment Required状态码
- **以太坊L2:** Base网络 (低成本、快速结算)
- **EIP-3009:** transferWithAuthorization标准
- **智能合约:** 验证授权签名、批量结算

---

## 🎯 集成目标

### 业务目标

| 目标 | 指标 | 时间 |
| :--- | :--- | :--- |
| 拓展微交易能力 | 支持$0.0001级别支付 | 第1周 |
| 降低用户摩擦 | "免Gas费"用户体验 | 第2周 |
| 增强API货币化 | 提供标准化API计费 | 第3周 |
| 提升L2兼容性 | 优先支持Base网络 | 第1周 |

### 成功标准

| 衡量指标 | 目标值 | 描述 |
| :--- | :--- | :--- |
| 新增API客户数 | 3个月内≥5个 | 验证X402方案的市场吸引力 |
| 平均交易成本 | 每笔≤$0.001 | 确保微交易的经济可行性 |
| 支付成功率 | ≥99% | 确保签名可靠性和结算稳定性 |

---

## 👥 用户故事

### A. 资源消费者 (客户端)

| ID | 角色 | 需求 | 优先级 |
| :--- | :--- | :--- | :---: |
| C-1 | AI代理 | 能够使用数字钱包自动签署支付授权,并在402响应后重试请求 | 🔴 高 |
| C-2 | 钱包用户 | 支付过程中无需支付Gas费,只需授权转账 | 🔴 高 |
| C-3 | 客户端应用 | 在x402支付授权过期前,确保签名始终有效 | 🟡 中 |

### B. 资源提供者 (服务器端/API拥有者)

| ID | 角色 | 需求 | 优先级 |
| :--- | :--- | :--- | :---: |
| P-1 | API运营方 | 能够为不同的API端点配置不同的计价和代币 | 🔴 高 |
| P-2 | 开发者 | 服务器能够准确解析和验证x402授权签名 | 🔴 高 |
| P-3 | 后台系统 | 能将多个支付授权批量打包,一次性结算到链上 | 🔴 高 |

---

## 🏗️ 架构设计

### 整体架构

```
┌─────────────────┐
│  客户端/钱包    │
│  (签名授权)     │
└────────┬────────┘
         │ 1. GET /api/resource
         │ 2. 402 Payment Required
         ▼
┌─────────────────┐
│  API网关        │
│  (验证签名)     │
└────────┬────────┘
         │ 3. 验证通过
         │ 4. 触发结算
         ▼
┌─────────────────┐
│  中继者服务     │
│  (批量结算)     │
└────────┬────────┘
         │ 5. transferWithAuthorization
         ▼
┌─────────────────┐
│  Base L2        │
│  (USDC合约)     │
└─────────────────┘
```

### 核心组件

1. **客户端SDK** - 处理402响应、生成EIP-3009签名
2. **API网关中间件** - 返回402、验证签名、触发结算
3. **中继者服务** - 批量打包、提交链上交易、支付Gas
4. **智能合约** - 验证授权、执行转账、防重放攻击

---

## 📦 功能需求

### 1. 客户端SDK (FR-C)

| ID | 需求 | 关联用户故事 | 优先级 |
| :--- | :--- | :---: | :---: |
| FR-C-1 | 实现EIP-3009签名授权支持 | C-1, C-2 | 🔴 |
| FR-C-2 | 解析HTTP 402响应中的WWW-Authenticate标头 | C-1 | 🔴 |
| FR-C-3 | 自动将支付签名编码为Authorization Header | C-1 | 🔴 |
| FR-C-4 | 支持Base网络上的USDC代币 | C-2 | 🔴 |

### 2. 服务器/API网关 (FR-P)

| ID | 需求 | 关联用户故事 | 优先级 |
| :--- | :--- | :---: | :---: |
| FR-P-1 | 检测到未付费请求时返回HTTP 402 | P-1 | 🔴 |
| FR-P-2 | 实现签名验证服务 | P-2 | 🔴 |
| FR-P-3 | 配置管理模块,为不同API路径设置价格 | P-1 | 🔴 |

### 3. 结算与中继者服务 (FR-S)

| ID | 需求 | 关联用户故事 | 优先级 |
| :--- | :--- | :---: | :---: |
| FR-S-1 | 开发中继者服务,提交transferWithAuthorization交易 | C-2 | 🔴 |
| FR-S-2 | 实现批量结算逻辑,聚合多个支付授权 | P-3 | 🔴 |
| FR-S-3 | 维护Nonce状态记录,防止重放攻击 | P-2 | 🔴 |
| FR-S-4 | 提供结算状态查询API | P-3 | 🟡 |

---

## 🛠️ 开发任务分解

### 阶段1: 基础设施准备 (第1周)

#### 任务1.1: Base网络配置
- [ ] 在项目中添加Base网络RPC配置
- [ ] 配置Base Sepolia测试网
- [ ] 获取测试USDC代币
- [ ] 配置中继者钱包账户

#### 任务1.2: EIP-3009智能合约
- [ ] 研究USDC的transferWithAuthorization方法
- [ ] 编写合约交互工具类
- [ ] 实现签名验证逻辑
- [ ] 部署测试合约

#### 任务1.3: 数据库设计
```sql
-- x402_payments表
CREATE TABLE x402_payments (
  id SERIAL PRIMARY KEY,
  nonce VARCHAR(66) UNIQUE NOT NULL,
  signer VARCHAR(42) NOT NULL,
  receiver VARCHAR(42) NOT NULL,
  amount NUMERIC(78, 0) NOT NULL,
  token VARCHAR(42) NOT NULL,
  expiry BIGINT NOT NULL,
  signature TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  tx_hash VARCHAR(66),
  created_at TIMESTAMP DEFAULT NOW(),
  settled_at TIMESTAMP
);

-- x402_api_pricing表
CREATE TABLE x402_api_pricing (
  id SERIAL PRIMARY KEY,
  api_path VARCHAR(255) UNIQUE NOT NULL,
  price NUMERIC(78, 0) NOT NULL,
  token VARCHAR(42) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### 阶段2: 客户端SDK开发 (第1-2周)

#### 任务2.1: X402客户端服务
```javascript
// /apps/frontend/src/services/x402ClientService.js

import { ethers } from 'ethers';

class X402ClientService {
  constructor(provider, signer) {
    this.provider = provider;
    this.signer = signer;
  }

  // 解析402响应
  parseChallenge(response) {
    const wwwAuth = response.headers.get('WWW-Authenticate');
    // 解析: amount, nonce, expiry, receiver, token
    return challenge;
  }

  // 生成EIP-3009签名
  async signAuthorization(challenge) {
    const domain = {
      name: 'USD Coin',
      version: '2',
      chainId: 8453, // Base
      verifyingContract: challenge.token
    };

    const types = {
      TransferWithAuthorization: [
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'validAfter', type: 'uint256' },
        { name: 'validBefore', type: 'uint256' },
        { name: 'nonce', type: 'bytes32' }
      ]
    };

    const value = {
      from: await this.signer.getAddress(),
      to: challenge.receiver,
      value: challenge.amount,
      validAfter: 0,
      validBefore: challenge.expiry,
      nonce: challenge.nonce
    };

    const signature = await this.signer._signTypedData(domain, types, value);
    return signature;
  }

  // 重试请求with授权
  async retryWithAuthorization(url, signature) {
    return fetch(url, {
      headers: {
        'Authorization': `x402 ${signature}`
      }
    });
  }
}

export default X402ClientService;
```

#### 任务2.2: 集成到前端
- [ ] 在Web3Context中添加X402ClientService
- [ ] 创建X402支付拦截器
- [ ] 实现自动重试逻辑
- [ ] 添加支付状态UI反馈

---

### 阶段3: 服务器端开发 (第2周)

#### 任务3.1: API网关中间件
```javascript
// /apps/backend/src/middleware/x402Middleware.js

const x402Middleware = (pricing) => {
  return async (req, res, next) => {
    // 1. 检查是否有Authorization头
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('x402 ')) {
      // 2. 返回402 Payment Required
      const nonce = generateNonce();
      const challenge = {
        amount: pricing.amount,
        nonce: nonce,
        expiry: Math.floor(Date.now() / 1000) + 3600,
        receiver: process.env.RECEIVER_ADDRESS,
        token: process.env.USDC_BASE_ADDRESS
      };
      
      res.status(402).set({
        'WWW-Authenticate': `x402 ${encodeChallenge(challenge)}`,
        'Accept-Token': `USDC:${process.env.USDC_BASE_ADDRESS}`
      }).json({ error: 'Payment required', challenge });
      return;
    }
    
    // 3. 验证签名
    const signature = authHeader.substring(5);
    const isValid = await verifySignature(signature, req.body);
    
    if (!isValid) {
      res.status(403).json({ error: 'Invalid payment authorization' });
      return;
    }
    
    // 4. 触发结算
    await triggerSettlement(signature);
    
    // 5. 允许访问资源
    next();
  };
};

module.exports = x402Middleware;
```

#### 任务3.2: 签名验证服务
- [ ] 实现EIP-3009签名恢复
- [ ] 验证签名者地址
- [ ] 检查Nonce唯一性
- [ ] 验证过期时间

#### 任务3.3: API定价配置
- [ ] 创建API定价管理接口
- [ ] 实现动态定价逻辑
- [ ] 添加定价查询API

---

### 阶段4: 中继者服务开发 (第2-3周)

#### 任务4.1: 中继者核心服务
```javascript
// /apps/backend/src/services/x402RelayerService.js

class X402RelayerService {
  constructor() {
    this.pendingAuthorizations = [];
    this.batchInterval = 60000; // 1分钟批量一次
  }

  // 添加待结算授权
  async addAuthorization(authorization) {
    this.pendingAuthorizations.push(authorization);
    
    // 如果累积到一定数量,立即结算
    if (this.pendingAuthorizations.length >= 10) {
      await this.batchSettle();
    }
  }

  // 批量结算
  async batchSettle() {
    if (this.pendingAuthorizations.length === 0) return;
    
    const batch = this.pendingAuthorizations.splice(0, 50);
    
    try {
      // 调用智能合约批量执行transferWithAuthorization
      const tx = await this.contract.batchTransferWithAuthorization(batch);
      await tx.wait();
      
      // 更新数据库状态
      await this.updateSettlementStatus(batch, tx.hash);
    } catch (error) {
      console.error('Batch settlement failed:', error);
      // 重新加入队列
      this.pendingAuthorizations.unshift(...batch);
    }
  }

  // 定时批量结算
  startBatchSettlement() {
    setInterval(() => {
      this.batchSettle();
    }, this.batchInterval);
  }
}

module.exports = X402RelayerService;
```

#### 任务4.2: 批量结算合约
```solidity
// /apps/contracts/contracts/X402BatchSettlement.sol

pragma solidity ^0.8.0;

interface IUSDC {
    function transferWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;
}

contract X402BatchSettlement {
    IUSDC public usdc;
    
    constructor(address _usdc) {
        usdc = IUSDC(_usdc);
    }
    
    function batchTransferWithAuthorization(
        address[] memory froms,
        address[] memory tos,
        uint256[] memory values,
        uint256[] memory validAfters,
        uint256[] memory validBefores,
        bytes32[] memory nonces,
        uint8[] memory vs,
        bytes32[] memory rs,
        bytes32[] memory ss
    ) external {
        require(froms.length == tos.length, "Length mismatch");
        
        for (uint i = 0; i < froms.length; i++) {
            usdc.transferWithAuthorization(
                froms[i],
                tos[i],
                values[i],
                validAfters[i],
                validBefores[i],
                nonces[i],
                vs[i],
                rs[i],
                ss[i]
            );
        }
    }
}
```

#### 任务4.3: Nonce管理
- [ ] 实现Nonce生成器
- [ ] 维护Nonce使用记录
- [ ] 防重放攻击检查
- [ ] Nonce过期清理

---

### 阶段5: 集成到Stream Payment (第3周)

#### 任务5.1: Stream Payment使用X402
- [ ] 修改创建Stream API,支持X402支付
- [ ] 在StreamPaymentDashboard显示X402支付记录
- [ ] 添加X402支付状态追踪
- [ ] 实现X402支付失败重试

#### 任务5.2: 批量Stream Payment with X402
- [ ] 批量创建Stream时使用X402批量结算
- [ ] 优化Gas费用显示
- [ ] 添加批量支付进度追踪

---

## 📊 测试计划

### 单元测试
- [ ] X402ClientService签名生成测试
- [ ] 签名验证服务测试
- [ ] Nonce管理测试
- [ ] 批量结算逻辑测试

### 集成测试
- [ ] 完整402流程测试
- [ ] 批量结算测试
- [ ] 重放攻击防护测试
- [ ] 过期签名处理测试

### E2E测试
- [ ] 用户创建Stream Payment with X402
- [ ] 批量创建测试
- [ ] Gas费用对比验证
- [ ] 支付成功率统计

---

## 🚀 部署计划

### 第1周: 基础设施
- [ ] Base网络配置
- [ ] 测试USDC获取
- [ ] 中继者钱包配置
- [ ] 数据库表创建

### 第2周: 核心功能
- [ ] 客户端SDK部署
- [ ] API网关中间件部署
- [ ] 签名验证服务上线

### 第3周: 中继者服务
- [ ] 批量结算合约部署
- [ ] 中继者服务上线
- [ ] 监控和日志配置

### 第4周: 生产测试
- [ ] 完整流程测试
- [ ] 性能压力测试
- [ ] 安全审计
- [ ] 正式上线

---

## 📈 监控指标

### 关键指标
- **支付成功率:** 目标≥99%
- **平均Gas费用:** 目标≤$0.001/笔
- **批量结算效率:** 每批≥10笔
- **API响应时间:** P95<200ms

### 监控工具
- **应用日志:** PM2 logs
- **区块链监控:** Etherscan API
- **性能监控:** AWS CloudWatch
- **错误追踪:** Sentry

---

## 🎯 下一步行动

1. **立即开始:** Base网络配置和EIP-3009研究
2. **本周完成:** 客户端SDK和API网关中间件
3. **下周完成:** 中继者服务和批量结算
4. **最终目标:** X402完全集成并上线生产

---

**备注:** 本集成计划将根据实际开发进度持续更新。
