# MPC 协议实现 (Lindell 2017)

本文档详细介绍了基于 ZenGo 的 `multi-party-ecdsa` 库实现的 Lindell 2017 协议。

## 核心实现

完整的实现位于 `src/mpc_complete.rs`，包含以下核心组件：

- **`MPCKeyGen`**: 完整的密钥生成流程
- **`MPCSigning`**: 完整的签名流程
- **`MPCWalletSession`**: 会话管理器

## 密钥生成流程

密钥生成分为四个阶段：

1. **承诺阶段**: 双方生成并交换承诺
2. **去承诺阶段**: 双方验证并去承诺
3. **Paillier 密钥交换**: Party 1 生成 Paillier 密钥并发送给 Party 2
4. **PDL 证明**: Party 1 证明 Paillier 密钥的正确性

## 签名流程

签名分为四个阶段：

1. **临时密钥生成**: 双方生成并交换临时密钥
2. **临时密钥验证**: 双方验证临时密钥
3. **部分签名计算**: Party 2 计算部分签名
4. **签名完成**: Party 1 完成签名

## 测试

`mpc_complete.rs` 包含两个端到端测试：

- `test_full_mpc_keygen_and_sign`: 测试完整的密钥生成和签名流程
- `test_mpc_wallet_session`: 测试会话管理器的功能

## 如何使用

```rust
use mpc_wallet::mpc_complete::MPCWalletSession;

#[tokio::main]
async fn main() {
    let mut session = MPCWalletSession::new("test-session".to_string(), 0);

    // 生成密钥
    let pubkey = session.generate_key().await.unwrap();

    // 签名
    let message = b"Hello, MPC!";
    let signature = session.sign(message).await.unwrap();

    // 验证
    let is_valid = session.verify(message, &signature).unwrap();
    assert!(is_valid);
}
```
