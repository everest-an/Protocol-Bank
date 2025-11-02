/// Kyber + AES256 混合加密模块
/// 
/// 这个模块实现了后量子安全的混合加密方案：
/// 1. 使用 AES-256-GCM 对实际数据进行对称加密（高效）
/// 2. 使用 Kyber-1024 对 AES 密钥进行非对称加密（量子安全）
/// 
/// 这种组合提供了：
/// - 量子计算机抗性（通过 Kyber）
/// - 高性能（通过 AES）
/// - 前向安全性

use aes_gcm::{
    aead::{Aead, KeyInit, OsRng},
    Aes256Gcm, Nonce,
};
use anyhow::{Context, Result};
use pqcrypto_kyber::kyber1024;
use pqcrypto_traits::kem::{PublicKey, SecretKey, SharedSecret, Ciphertext};
use rand::RngCore;
use serde::{Deserialize, Serialize};

/// 加密后的数据包
/// 包含了所有解密所需的信息
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct EncryptedPackage {
    /// 使用 Kyber 加密的 AES 会话密钥
    pub encrypted_session_key: Vec<u8>,
    
    /// 使用 AES-GCM 加密的实际数据
    pub encrypted_data: Vec<u8>,
    
    /// AES-GCM 的随机数（nonce）
    pub nonce: Vec<u8>,
    
    /// 加密算法版本标识
    pub version: u8,
}

/// Kyber 密钥对
#[derive(Clone)]
pub struct KyberKeyPair {
    pub public_key: kyber1024::PublicKey,
    pub secret_key: kyber1024::SecretKey,
}

impl KyberKeyPair {
    /// 生成新的 Kyber-1024 密钥对
    /// Kyber-1024 是 NIST 标准中安全级别最高的变体
    pub fn generate() -> Self {
        let (pk, sk) = kyber1024::keypair();
        Self {
            public_key: pk,
            secret_key: sk,
        }
    }

    /// 将公钥序列化为字节数组
    pub fn public_key_bytes(&self) -> Vec<u8> {
        self.public_key.as_bytes().to_vec()
    }

    /// 从字节数组恢复公钥
    pub fn public_key_from_bytes(bytes: &[u8]) -> Result<kyber1024::PublicKey> {
        kyber1024::PublicKey::from_bytes(bytes)
            .map_err(|_| anyhow::anyhow!("Invalid Kyber public key"))
    }
}

/// 混合加密器
pub struct HybridEncryption;

impl HybridEncryption {
    /// 使用 Kyber + AES256 混合加密数据
    /// 
    /// # 参数
    /// - `data`: 要加密的原始数据
    /// - `recipient_public_key`: 接收方的 Kyber 公钥
    /// 
    /// # 返回
    /// 包含所有加密信息的 EncryptedPackage
    pub fn encrypt(data: &[u8], recipient_public_key: &kyber1024::PublicKey) -> Result<EncryptedPackage> {
        // 步骤 1: 使用 Kyber KEM 生成共享密钥
        let (shared_secret, ciphertext) = kyber1024::encapsulate(recipient_public_key);
        
        // 步骤 2: 从共享密钥派生 AES-256 密钥
        // Kyber 的共享密钥是 32 字节，正好是 AES-256 所需的长度
        let aes_key = shared_secret.as_bytes();
        
        // 步骤 3: 创建 AES-256-GCM 加密器
        let cipher = Aes256Gcm::new_from_slice(aes_key)
            .context("Failed to create AES cipher")?;
        
        // 步骤 4: 生成随机 nonce（12 字节用于 GCM）
        let mut nonce_bytes = [0u8; 12];
        OsRng.fill_bytes(&mut nonce_bytes);
        let nonce = Nonce::from_slice(&nonce_bytes);
        
        // 步骤 5: 使用 AES-GCM 加密数据
        let encrypted_data = cipher
            .encrypt(nonce, data)
            .map_err(|e| anyhow::anyhow!("AES encryption failed: {}", e))?;
        
        // 步骤 6: 打包所有信息
        Ok(EncryptedPackage {
            encrypted_session_key: ciphertext.as_bytes().to_vec(),
            encrypted_data,
            nonce: nonce_bytes.to_vec(),
            version: 1,
        })
    }

    /// 使用 Kyber + AES256 解密数据
    /// 
    /// # 参数
    /// - `package`: 加密数据包
    /// - `recipient_secret_key`: 接收方的 Kyber 私钥
    /// 
    /// # 返回
    /// 解密后的原始数据
    pub fn decrypt(
        package: &EncryptedPackage,
        recipient_secret_key: &kyber1024::SecretKey,
    ) -> Result<Vec<u8>> {
        // 步骤 1: 验证版本
        if package.version != 1 {
            anyhow::bail!("Unsupported encryption version: {}", package.version);
        }
        
        // 步骤 2: 使用 Kyber 私钥解封装，恢复共享密钥
        let ciphertext = kyber1024::Ciphertext::from_bytes(&package.encrypted_session_key)
            .map_err(|_| anyhow::anyhow!("Invalid Kyber ciphertext"))?;
        
        let shared_secret = kyber1024::decapsulate(&ciphertext, recipient_secret_key);
        
        // 步骤 3: 从共享密钥派生 AES-256 密钥
        let aes_key = shared_secret.as_bytes();
        
        // 步骤 4: 创建 AES-256-GCM 解密器
        let cipher = Aes256Gcm::new_from_slice(aes_key)
            .context("Failed to create AES cipher")?;
        
        // 步骤 5: 恢复 nonce
        let nonce = Nonce::from_slice(&package.nonce);
        
        // 步骤 6: 使用 AES-GCM 解密数据
        let decrypted_data = cipher
            .decrypt(nonce, package.encrypted_data.as_ref())
            .map_err(|e| anyhow::anyhow!("AES decryption failed: {}", e))?;
        
        Ok(decrypted_data)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hybrid_encryption_roundtrip() {
        // 生成密钥对
        let keypair = KyberKeyPair::generate();
        
        // 测试数据
        let original_data = b"This is a secret MPC key share that must be protected!";
        
        // 加密
        let encrypted = HybridEncryption::encrypt(original_data, &keypair.public_key)
            .expect("Encryption failed");
        
        // 解密
        let decrypted = HybridEncryption::decrypt(&encrypted, &keypair.secret_key)
            .expect("Decryption failed");
        
        // 验证
        assert_eq!(original_data.to_vec(), decrypted);
    }

    #[test]
    fn test_wrong_key_fails() {
        // 生成两个不同的密钥对
        let keypair1 = KyberKeyPair::generate();
        let keypair2 = KyberKeyPair::generate();
        
        let data = b"Secret data";
        
        // 使用密钥对 1 的公钥加密
        let encrypted = HybridEncryption::encrypt(data, &keypair1.public_key)
            .expect("Encryption failed");
        
        // 尝试使用密钥对 2 的私钥解密（应该失败）
        let result = HybridEncryption::decrypt(&encrypted, &keypair2.secret_key);
        
        // 验证解密失败（数据不匹配）
        assert!(result.is_err() || result.unwrap() != data.to_vec());
    }
}
