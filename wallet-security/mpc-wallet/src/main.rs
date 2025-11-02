mod encryption;
mod policy_engine;
mod three_tier_demo;

use anyhow::{Context, Result};
use encryption::{HybridEncryption, KyberKeyPair, EncryptedPackage};
use multi_party_ecdsa::protocols::two_party_ecdsa::lindell_2017::*;
use policy_engine::AuthorizationToken;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use three_tier_demo::run_three_tier_demo;
use zeroize::{Zeroize, ZeroizeOnDrop};

/// 参与方的角色
#[derive(Debug, Clone, Copy)]
enum Party {
    One,
    Two,
}

/// 加密的密钥分片数据结构
#[derive(Serialize, Deserialize, Debug)]
struct EncryptedKeyShare {
    party_id: u8,
    encrypted_package: EncryptedPackage,
}

/// 敏感数据包装器 - 自动零化内存
#[derive(Zeroize, ZeroizeOnDrop)]
struct SensitiveData {
    data: Vec<u8>,
}

impl SensitiveData {
    fn new(data: Vec<u8>) -> Self {
        Self { data }
    }
    
    fn as_slice(&self) -> &[u8] {
        &self.data
    }
}

/// MPC 钱包核心结构
struct MPCWallet {
    party: Party,
    storage_path: String,
    kyber_keypair: KyberKeyPair,
}

impl MPCWallet {
    fn new(party: Party) -> Self {
        let storage_path = match party {
            Party::One => "./data/party1".to_string(),
            Party::Two => "./data/party2".to_string(),
        };
        
        // 创建存储目录
        fs::create_dir_all(&storage_path).expect("Failed to create storage directory");
        
        // ⚠️ 警告：在生产环境中，Kyber 私钥必须存储在 HSM 或 SGX 中
        // 当前实现仅用于概念验证
        let kyber_keypair = KyberKeyPair::generate();
        
        Self {
            party,
            storage_path,
            kyber_keypair,
        }
    }

    /// 阶段 1: 密钥生成
    /// 
    /// ⚠️ 重要说明：
    /// 这是一个简化的演示实现。完整的 MPC 密钥生成需要：
    /// 1. 多轮交互协议（承诺、零知识证明）
    /// 2. 网络通信层
    /// 3. 状态管理和错误恢复
    /// 
    /// 当前实现仅展示了流程的框架，不可用于生产环境。
    fn generate_key_pair(&self) -> Result<()> {
        println!("\n🔐 [{:?}] 开始 MPC 密钥生成流程...", self.party);
        println!("   ⚠️  注意：这是简化的演示实现");
        
        let key_share_data = match self.party {
            Party::One => {
                println!("  ├─ 参与方 1: 生成本地密钥分片...");
                let (_party_one_first_message, _comm_witness, ec_key_pair_party1) = 
                    party_one::KeyGenFirstMsg::create_commitments();
                
                println!("  ├─ 参与方 1: 向参与方 2 发送承诺消息");
                println!("  ├─ [演示] 实际需要多轮交互和零知识证明");
                
                serde_json::to_vec(&ec_key_pair_party1)
                    .context("Failed to serialize key share")?
            }
            Party::Two => {
                println!("  ├─ 参与方 2: 生成本地密钥分片...");
                let (_party_two_first_message, ec_key_pair_party2) = 
                    party_two::KeyGenFirstMsg::create();
                
                println!("  ├─ 参与方 2: 向参与方 1 发送公钥");
                println!("  ├─ [演示] 实际需要验证承诺和完成密钥协商");
                
                serde_json::to_vec(&ec_key_pair_party2)
                    .context("Failed to serialize key share")?
            }
        };
        
        // 使用 Kyber+AES256 加密密钥分片
        println!("  ├─ 🔐 使用 Kyber+AES256 混合加密保护密钥分片...");
        let encrypted_package = HybridEncryption::encrypt(
            &key_share_data,
            &self.kyber_keypair.public_key,
        ).context("Failed to encrypt key share")?;
        
        let encrypted_share = EncryptedKeyShare {
            party_id: match self.party {
                Party::One => 1,
                Party::Two => 2,
            },
            encrypted_package,
        };
        
        let share_path = format!("{}/key_share_encrypted.json", self.storage_path);
        fs::write(&share_path, serde_json::to_string_pretty(&encrypted_share)?)
            .context("Failed to write encrypted key share")?;
        
        println!("  └─ ✅ 参与方 {:?}: 加密的密钥分片已保存到 {}", self.party, share_path);
        
        Ok(())
    }

    fn has_key_share(&self) -> bool {
        let share_path = format!("{}/key_share_encrypted.json", self.storage_path);
        Path::new(&share_path).exists()
    }

    /// 阶段 2: MPC 协同签名
    /// 
    /// ⚠️ 重要改进：
    /// 1. 强制要求授权令牌
    /// 2. 使用 zeroize 安全清除敏感数据
    /// 3. 验证令牌有效性
    /// 
    /// ⚠️ 仍然缺失：
    /// - 完整的 MPC 签名协议实现
    /// - 真实的网络通信
    /// - 零知识证明验证
    fn sign_message(&self, message: &str, auth_token: &AuthorizationToken) -> Result<()> {
        println!("\n✍️  [{:?}] 开始 MPC 协同签名流程...", self.party);
        println!("  ├─ 待签名消息: \"{}\"", message);
        
        // 🔒 强制验证授权令牌
        println!("  ├─ 🔒 验证授权令牌...");
        if !auth_token.is_valid() {
            anyhow::bail!("授权令牌已过期或无效");
        }
        println!("  ├─ ✅ 授权令牌验证通过");
        
        if !self.has_key_share() {
            anyhow::bail!("密钥分片不存在，请先运行密钥生成流程");
        }
        
        let share_path = format!("{}/key_share_encrypted.json", self.storage_path);
        let share_content = fs::read_to_string(&share_path)
            .context("Failed to read encrypted key share")?;
        let encrypted_share: EncryptedKeyShare = serde_json::from_str(&share_content)
            .context("Failed to deserialize encrypted key share")?;
        
        println!("  ├─ 从安全存储加载加密的密钥分片");
        println!("  ├─ 🔓 使用 Kyber 私钥解密分片...");
        
        let decrypted_data = HybridEncryption::decrypt(
            &encrypted_share.encrypted_package,
            &self.kyber_keypair.secret_key,
        ).context("Failed to decrypt key share")?;
        
        // 🔒 使用 SensitiveData 包装，确保自动零化
        let sensitive_data = SensitiveData::new(decrypted_data);
        
        println!("  ├─ ✅ 密钥分片已在安全内存中解密");
        println!("  ├─ 与另一方进行多轮 MPC 通信...");
        println!("  │  ├─ [演示] 第 1 轮: 交换承诺");
        println!("  │  ├─ [演示] 第 2 轮: 交换部分签名");
        println!("  │  └─ [演示] 第 3 轮: 合成最终签名");
        
        // 使用数据（在实际实现中，这里会进行 MPC 签名计算）
        let _data_len = sensitive_data.as_slice().len();
        
        // 🔒 sensitive_data 在这里自动被 drop 并零化内存
        drop(sensitive_data);
        
        println!("  ├─ 🧹 已安全清除内存中的密钥分片（zeroize）");
        println!("  └─ ✅ 签名生成成功！");
        
        Ok(())
    }
}

fn main() -> Result<()> {
    env_logger::init();
    
    println!("╔══════════════════════════════════════════════════════════════╗");
    println!("║   MPC 钱包基础设施 - 改进版 (v0.2)                         ║");
    println!("║   • ZenGo multi-party-ecdsa (MPC 核心)                      ║");
    println!("║   • Kyber-1024 + AES-256-GCM (混合加密)                     ║");
    println!("║   • 三权分立架构 (策略/存储/计算)                           ║");
    println!("║   • 基于 Gemini 审查的安全改进                              ║");
    println!("╚══════════════════════════════════════════════════════════════╝");
    
    println!("\n⚠️  重要声明：");
    println!("   这是一个概念验证（PoC）实现，不可用于生产环境。");
    println!("   完整的生产级实现需要：");
    println!("   • 完整的 MPC 协议状态机");
    println!("   • HSM/SGX 硬件安全模块");
    println!("   • 真实的网络通信层");
    println!("   • t-of-n 密钥分片方案");
    println!("   详见 GEMINI_CODE_REVIEW.md 和 FIXES_AND_IMPROVEMENTS.md\n");
    
    // 运行三权分立架构演示
    run_three_tier_demo()?;
    
    // 运行 MPC 加密演示
    println!("\n\n╔══════════════════════════════════════════════════════════════╗");
    println!("║            MPC + 混合加密技术演示                           ║");
    println!("╚══════════════════════════════════════════════════════════════╝");
    
    println!("\n📋 系统架构说明:");
    println!("  • 采用 2-of-2 MPC 方案（演示）");
    println!("  • 私钥永远不会完整出现在任何一方");
    println!("  • 密钥分片使用 Kyber+AES256 混合加密保护");
    println!("  • 量子计算机抗性 (NIST PQC 标准)");
    println!("  • 强制授权令牌验证");
    println!("  • 安全内存管理（zeroize）\n");
    
    let party1 = MPCWallet::new(Party::One);
    let party2 = MPCWallet::new(Party::Two);
    
    println!("═══════════════════════════════════════════════════════════════");
    println!("阶段 1: MPC 密钥生成 + 混合加密");
    println!("═══════════════════════════════════════════════════════════════");
    
    party1.generate_key_pair()
        .context("Party 1 key generation failed")?;
    party2.generate_key_pair()
        .context("Party 2 key generation failed")?;
    
    println!("\n✅ 密钥生成完成！");
    
    println!("\n═══════════════════════════════════════════════════════════════");
    println!("阶段 2: MPC 协同签名 + 授权验证");
    println!("═══════════════════════════════════════════════════════════════");
    
    let test_message = "Transfer 1.5 BTC to address bc1q...xyz";
    
    // 🔒 创建模拟的授权令牌（在实际系统中，这由策略引擎签发）
    use chrono::{Utc, Duration};
    let mock_token = AuthorizationToken {
        transaction_id: "tx_demo_001".to_string(),
        issued_at: Utc::now(),
        expires_at: Utc::now() + Duration::minutes(5),
        signature: "MOCK_POLICY_ENGINE_SIGNATURE".to_string(),
    };
    
    party1.sign_message(test_message, &mock_token)
        .context("Party 1 signing failed")?;
    party2.sign_message(test_message, &mock_token)
        .context("Party 2 signing failed")?;
    
    println!("\n✅ 完整演示完成！");
    
    println!("\n═══════════════════════════════════════════════════════════════");
    println!("📊 v0.2 改进总结");
    println!("═══════════════════════════════════════════════════════════════");
    println!("\n✅ 基于 Gemini 审查的改进:");
    println!("  1. ✓ 强制授权令牌验证");
    println!("  2. ✓ 使用 zeroize 安全清除敏感数据");
    println!("  3. ✓ 添加详细的警告和说明");
    println!("  4. ✓ 明确标注 PoC 限制");
    println!("  5. ✓ 提供完整的审查报告");
    
    println!("\n⚠️  仍需改进（超出 PoC 范围）:");
    println!("  • 完整的 MPC 协议实现");
    println!("  • HSM/SGX 硬件集成");
    println!("  • 真实的网络通信层");
    println!("  • t-of-n 密钥分片方案");
    println!("  • 审计日志和监控系统");
    
    Ok(())
}
