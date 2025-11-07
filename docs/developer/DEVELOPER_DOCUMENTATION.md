# Protocol Bank - 项目开发文档

**版本**: 1.0  
**日期**: 2025-11-08  
**作者**: Manus AI

---

## 1. 技术栈

| 类别 | 技术 | 版本 | 用途 |
|---|---|---|---|
| **前端** | React | 18.2.0 | UI框架 |
| | Vite | 4.4.5 | 构建工具 |
| | pnpm | 8.6.0 | 包管理器 |
| | Tailwind CSS | 3.3.3 | CSS框架 |
| | Ethers.js | 6.7.1 | 以太坊交互 |
| **后端** | Node.js | 18.17.0 | 运行环境 |
| | Express.js | 4.18.2 | Web框架 |
| | PostgreSQL | 14 | 数据库 |
| | Redis | 7.0 | 缓存 |
| | BullMQ | 4.12.2 | 消息队列 |
| **智能合约** | Solidity | 0.8.20 | 合约语言 |
| | Hardhat | 2.17.2 | 开发环境 |
| **部署** | Docker | 24.0 | 容器化 |
| | AWS (EC2, S3, RDS) | - | 云服务 |
| | Nginx | 1.18.0 | 反向代理 |

---

## 2. 项目结构

```
/Protocol-Bank
├── apps
│   ├── frontend/       # 前端应用 (React + Vite)
│   ├── backend/        # 后端服务 (Node.js + Express)
│   └── admin/          # 管理后台 (待开发)
├── blockchain/         # 智能合约 (Solidity + Hardhat)
├── docs/               # 项目文档
├── packages/
│   └── ui/             # 共享UI组件库
└── pnpm-workspace.yaml # Monorepo配置
```

---

## 3. 核心模块详解

### 3.1. 前端 (apps/frontend)

- **页面组件 (`src/pages`)**: 每个页面对应一个组件,如`PaymentsPage.jsx`。
- **核心组件 (`src/components`)**: 可复用的UI组件,如`EnterprisePaymentNetworkV2.jsx`。
- **状态管理**: 使用React Context API进行全局状态管理(用户、钱包等)。
- **以太坊交互 (`src/hooks/useWeb3.js`)**: 封装了与钱包和智能合约的交互逻辑。
- **网络可视化 (`EnterprisePaymentNetworkV2.jsx`)**: 使用HTML5 Canvas 2D绘制动态网络图谱和粒子动画。

### 3.2. 后端 (apps/backend)

- **API路由 (`src/routes`)**: 定义了所有RESTful API端点。
- **控制器 (`src/controllers`)**: 处理API请求,调用服务层逻辑。
- **服务层 (`src/services`)**: 封装核心业务逻辑,如KYC/AML检查。
- **消息队列 (`src/workers`)**: 使用BullMQ处理耗时任务,如批量支付和定时支付。
- **数据库交互**: 使用`node-postgres`与PostgreSQL数据库交互。

### 3.3. 智能合约 (blockchain)

- **`StreamPayment.sol`**: 实现了流式支付的核心逻辑,符合EIP-1620标准。
- **`ClearingHouse.sol`**: (待开发) 用于处理多方清算和结算的合约。
- **`PaymentScheduler.sol`**: 实现了定时支付的逻辑。
- **测试**: 使用Hardhat和Foundry进行单元测试和集成测试。

---

## 4. 开发与部署流程

### 4.1. 本地开发

1. **克隆仓库**: `git clone https://github.com/everest-an/Protocol-Bank.git`
2. **安装依赖**: `pnpm install`
3. **配置环境**: `cp .env.example .env` 并填入配置
4. **启动开发**: `pnpm dev` (同时启动前端和后端)

### 4.2. 部署流程

1. **构建前端**: `cd apps/frontend && pnpm build`
2. **打包上传**: 将`dist`目录打包并上传到AWS EC2服务器
3. **部署**: 在服务器上解压并替换旧版本
4. **重启服务**: `sudo systemctl restart nginx`

---

## 5. 待完善的技术点

### 5.1. 后端
- **集成更多清算网络**: 需要为CHIPS, TARGET2等开发专用的网关服务。
- **完善AML服务**: 当前的AML检查比较基础,需要集成Chainalysis或Elliptic等专业服务。
- **优化消息队列**: 对大批量支付任务进行性能优化和错误处理。

### 5.2. 智能合约
- **开发`ClearingHouse.sol`**: 这是实现全球清算网络的核心合约,目前尚未开发。
- **多重签名钱包**: 需要开发符合Gnosis Safe标准的多签钱包合约。
- **Gas费优化**: 对现有合约进行Gas费优化,降低交易成本。

### 5.3. 前端
- **双滑轨过滤器**: 在网络可视化界面添加金额和日期的双滑轨过滤器。
- **移动端适配**: 优化在移动设备上的显示和交互效果。
- **性能优化**: 对大型网络图谱的渲染进行性能优化,减少卡顿。

---

## 6. 参考资料

- [1] [README - 快速开始](https://github.com/everest-an/Protocol-Bank/blob/main/README.md)
- [2] [Vite官方文档](https://vitejs.dev/)
- [3] [Hardhat官方文档](https://hardhat.org/)
