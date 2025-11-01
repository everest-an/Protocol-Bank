# Protocol Bank Agent SDK 设计文档

**版本**: 1.0
**日期**: 2025年10月28日
**作者**: EverestAn

---

## 1. 简介

### 1.1. 目标

**Protocol Bank Agent SDK** 是一个功能强大的 JavaScript/TypeScript 库，旨在简化与 ERC-8004 Trustless Agents 生态系统的交互。该 SDK 将为开发者提供一套简单、直观的 API，用于创建、管理、发现和交互 AI Agent。

### 1.2. 核心原则

- **简单易用**: 抽象复杂的区块链交互，提供简洁的 API。
- **类型安全**: 使用 TypeScript 提供完整的类型定义。
- **模块化**: 核心功能模块化，可按需导入。
- **可扩展**: 易于扩展，支持新的 Agent 类型和功能。
- **文档完善**: 提供完整的 API 文档和示例代码。

---

## 2. 架构

### 2.1. 核心模块

SDK 将由以下核心模块组成：

| 模块 | 描述 |
|------|------|
| **Client** | SDK 的主入口，用于配置和初始化。 |
| **AgentRegistry** | 与 ERC-8004 Identity Registry 交互。 |
| **Reputation** | 与 ERC-8004 Reputation Registry 交互。 |
| **Validation** | 与 ERC-8004 Validation Registry 交互。 |
| **IPFS** | 用于上传和下载 Agent 元数据。 |
| **Utils** | 提供辅助函数，如签名、数据格式化等。 |

### 2.2. 技术栈

- **语言**: TypeScript
- **区块链库**: Ethers.js
- **IPFS 客户端**: Helia (或 Pinata SDK)
- **构建工具**: Rollup / esbuild
- **测试框架**: Jest / Vitest
- **文档生成**: TypeDoc

---

## 3. API 设计

### 3.1. Client

```typescript
import { ProtocolBankClient } from "@protocol-bank/sdk";

// 初始化 Client
const client = new ProtocolBankClient({
  // RPC URL (Alchemy, Infura, etc.)
  rpcUrl: "https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY",
  
  // 私钥或 Signer (用于交易签名)
  privateKey: "0x...", // 或者使用 ethers.Signer
  
  // IPFS 配置
  ipfs: {
    gateway: "https://ipfs.io/ipfs/",
    apiKey: "YOUR_PINATA_API_KEY", // 可选
  },
  
  // 合约地址 (可选，默认为 Sepolia 测试网)
  contracts: {
    agentRegistry: "0x...",
    reputationRegistry: "0x...",
    validationRegistry: "0x...",
  },
});
```

### 3.2. AgentRegistry

```typescript
// 注册新 Agent
const { agentId, transactionHash, metadataUri } = await client.agents.register({
  name: "My Payment Agent",
  description: "An agent that executes scheduled payments.",
  imageUrl: "https://example.com/agent.png",
  agentType: "payment_executor",
  services: ["scheduled_payment", "batch_payment"],
});

// 获取 Agent 信息
const agent = await client.agents.get(agentId);
// { id, owner, metadata, services, ... }

// 获取用户的所有 Agent
const myAgents = await client.agents.getMyAgents();

// 发现所有 Agent
const allAgents = await client.agents.getAll();

// 转移 Agent
await client.agents.transfer(agentId, "0x...");
```

### 3.3. Reputation

```typescript
// 提交反馈
const { feedbackId, transactionHash } = await client.reputation.submitFeedback({
  agentId: 1,
  score: 95, // 0-100
  comment: "Excellent service! Payment was executed on time.",
  tags: ["fast", "reliable"],
});

// 获取 Agent 声誉
const reputation = await client.reputation.getReputation(1);
// { averageScore, totalReviews, scoreDistribution, ... }

// 获取 Agent 的所有反馈
const feedbacks = await client.reputation.getFeedbacks(1);

// 回复反馈
await client.reputation.respondToFeedback(feedbackId, "Thank you for your feedback!");
```

### 3.4. Validation

```typescript
// 提交验证请求
const { validationId, transactionHash } = await client.validation.requestValidation({
  agentId: 1,
  taskDescription: "Execute payment of 1 ETH to 0x...",
  evidence: {
    transactionHash: "0x...",
    logs: [...],
  },
});

// 提交验证结果 (仅限验证者)
await client.validation.submitValidation({
  validationId: 1,
  isValid: true,
  comment: "Verified the payment execution.",
});

// 获取验证结果
const validation = await client.validation.getValidation(1);
```

### 3.5. IPFS

```typescript
// 上传文件到 IPFS
const cid = await client.ipfs.upload(file);

// 上传 JSON 对象到 IPFS
const cid = await client.ipfs.uploadJson({ name: "My Agent", ... });

// 从 IPFS 下载文件
const data = await client.ipfs.download(cid);
```

---

## 4. 开发路线图

### Q4 2025 (v0.1 - Alpha)

- [x] **核心模块开发**
  - [x] Client, AgentRegistry, IPFS
- [ ] **基础功能实现**
  - [ ] 注册 Agent
  - [ ] 获取 Agent 信息
- [ ] **文档和测试**
  - [ ] 单元测试
  - [ ] API 文档 (TypeDoc)

### Q1 2026 (v0.5 - Beta)

- [ ] **声誉和验证模块**
  - [ ] Reputation, Validation
- [ ] **高级功能**
  - [ ] 提交反馈
  - [ ] 请求验证
  - [ ] 发现 Agent
- [ ] **示例代码**
  - [ ] Node.js 示例
  - [ ] React 示例

### Q2 2026 (v1.0 - Stable)

- [ ] **API 稳定**
  - [ ] 移除废弃的 API
  - [ ] 锁定依赖版本
- [ ] **性能优化**
  - [ ] 优化 RPC 调用
  - [ ] 减小打包大小
- [ ] **NPM 发布**
  - [ ] 发布到 npmjs.com
  - [ ] 创建 `CHANGELOG.md`
- [ ] **社区支持**
  - [ ] 创建 Discord 频道
  - [ ] 创建 GitHub Discussions

---

## 5. 打包和发布

### 5.1. 包结构

```
@protocol-bank/sdk
├── dist/          # 打包文件 (cjs, esm)
├── src/           # 源代码
├── test/          # 测试文件
├── docs/          # 文档
├── package.json
├── tsconfig.json
└── rollup.config.js
```

### 5.2. NPM 包

- **包名**: `@protocol-bank/sdk`
- **版本**: `0.1.0` (初始版本)
- **许可证**: MIT

### 5.3. 发布流程

```bash
# 1. 更新版本号
npm version patch

# 2. 构建
pnpm run build

# 3. 运行测试
pnpm run test

# 4. 生成文档
pnpm run docs

# 5. 发布到 NPM
npm publish --access public

# 6. 推送到 GitHub
git push && git push --tags
```

---

## 6. 示例代码

### 6.1. Node.js 示例

```javascript
import { ProtocolBankClient } from "@protocol-bank/sdk";
import { ethers } from "ethers";

async function main() {
  const provider = new ethers.JsonRpcProvider("YOUR_RPC_URL");
  const signer = new ethers.Wallet("YOUR_PRIVATE_KEY", provider);

  const client = new ProtocolBankClient({ signer });

  const agent = await client.agents.get(1);
  console.log("Agent:", agent);
}

main();
```

### 6.2. React 示例

```jsx
import { useProtocolBank } from "@protocol-bank/react-sdk";

function AgentProfile({ agentId }) {
  const { client, loading, error } = useProtocolBank();
  const [agent, setAgent] = useState(null);

  useEffect(() => {
    if (client) {
      client.agents.get(agentId).then(setAgent);
    }
  }, [client, agentId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!agent) return null;

  return (
    <div>
      <h1>{agent.name}</h1>
      <p>{agent.description}</p>
    </div>
  );
}
```

---

## 7. 总结

Protocol Bank Agent SDK 将成为开发者进入 ERC-8004 生态系统的关键门户。通过提供一个简单、强大且文档完善的工具包，我们可以**加速 Agent 生态系统的发展**，吸引更多开发者构建下一代的去中心化应用。

**下一步**: 
1. 创建 SDK 的 GitHub 仓库
2. 初始化项目结构
3. 开始开发 v0.1 Alpha 版本

