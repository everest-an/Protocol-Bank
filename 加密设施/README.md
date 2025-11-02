# 机构级 MPC 钱包基础设施

## 项目概述

本项目实现了一个对标 Fireblocks 的机构级数字资产安全基础设施，采用前沿的密码学技术和安全架构设计，为金融机构提供企业级的钱包管理和资产保护方案。

## 核心特性

### 1. 多方安全计算 (MPC)
- 基于 ZenGo 的 `multi-party-ecdsa` 库实现 2-of-2 MPC 方案
- 完整私钥永远不会在任何单一位置出现
- 支持 ECDSA 签名算法（兼容比特币、以太坊等主流区块链）

### 2. 后量子混合加密
- **Kyber-1024**: NIST 标准的后量子密钥封装机制（KEM）
- **AES-256-GCM**: 高性能对称加密，提供认证加密
- 混合方案兼顾量子安全性和高性能

### 3. 三权分立架构

#### 策略层 (Policy Engine)
- 定义和执行交易策略规则（金额限制、白名单、时间窗口）
- 管理多重审批流程
- 签发授权令牌
- 与计算层完全解耦

#### 存储层 (Encrypted Storage)
- 存储加密的密钥分片
- 零知识设计：存储服务无法解密内容
- 支持分布式部署和灾备

#### 计算层 (MPC Nodes)
- 验证授权令牌
- 执行 MPC 协同签名
- 无状态设计
- 用后即焚：密钥分片使用后立即从内存清除

## 项目结构

```
mpc-wallet/
├── src/
│   ├── main.rs              # 主程序入口
│   ├── encryption.rs        # Kyber+AES256 混合加密模块
│   ├── policy_engine.rs     # 策略引擎和审批流程
│   └── three_tier_demo.rs   # 三权分立架构演示
├── Cargo.toml               # Rust 依赖配置
└── data/                    # 加密的密钥分片存储目录
```

## 快速开始

### 环境要求
- Rust 1.91.0 或更高版本
- GMP 数学库：`sudo apt-get install libgmp-dev`
- OpenSSL 开发库：`sudo apt-get install libssl-dev`

### 编译和运行

```bash
cd mpc-wallet
cargo build --release
cargo run
```

### 运行测试

```bash
cargo test
```

## 演示场景

程序运行时会自动演示以下场景：

1. **小额交易自动通过**: 0.5 BTC 转账，符合所有策略，直接签发授权令牌
2. **大额交易需要审批**: 2.5 BTC 转账，触发多重审批流程
3. **违规交易被拒绝**: 向非白名单地址转账，策略引擎直接拒绝

## 安全特性

| 特性 | 说明 |
|------|------|
| **无单点故障** | 完整私钥从未存在，MPC 确保分布式密钥管理 |
| **量子安全** | Kyber-1024 抵御未来量子计算机攻击 |
| **高性能** | AES-256-GCM 提供高效的数据加密 |
| **认证加密** | GCM 模式同时提供机密性和完整性验证 |
| **职责分离** | 三权分立确保每层只负责自己的功能 |
| **安全隔离** | 攻破一层不会危及整个系统 |
| **用后即焚** | 敏感数据使用后立即从内存清除 |
| **前向安全** | 每次加密使用新的随机 nonce |

## 技术栈

- **语言**: Rust (内存安全、高性能)
- **MPC 库**: ZenGo multi-party-ecdsa
- **后量子加密**: pqcrypto-kyber (NIST PQC 标准)
- **对称加密**: aes-gcm
- **序列化**: serde, serde_json
- **异步运行时**: tokio
- **时间处理**: chrono

## 与 Fireblocks 的对比

| 特性 | 本项目 | Fireblocks |
|------|--------|-----------|
| MPC 技术 | ✅ 2-of-2 ECDSA | ✅ MPC-CMP |
| 硬件隔离 | 🚧 计划集成 SGX | ✅ Intel SGX |
| 后量子加密 | ✅ Kyber-1024 | ❓ 未公开 |
| 策略引擎 | ✅ 完整实现 | ✅ |
| 区块链支持 | 🚧 原型阶段 | ✅ 1800+ 机构网络 |
| 生产就绪 | ❌ PoC 阶段 | ✅ |

## 下一步开发计划

1. **网络通信层**: 实现 gRPC/WebSocket 用于真实的两方 MPC 通信
2. **Intel SGX 集成**: 将密钥分片计算放入硬件安全飞地
3. **区块链集成**: 连接比特币、以太坊测试网，实现真实交易签名
4. **Web 管理界面**: 构建策略配置和审批管理的 Web UI
5. **监控系统**: 添加日志、指标和告警功能
6. **分布式存储**: 实现密钥分片的分布式存储和灾备

## 许可证

本项目仅用于学习和研究目的。

## 参考资料

- [Fireblocks 官方网站](https://www.fireblocks.com/)
- [ZenGo multi-party-ecdsa](https://github.com/ZenGo-X/multi-party-ecdsa)
- [NIST Post-Quantum Cryptography](https://csrc.nist.gov/projects/post-quantum-cryptography)
- [CRYSTALS-Kyber](https://pq-crystals.org/kyber/)

---

**开发者**: Manus AI & User  
**最后更新**: 2025-11-03
