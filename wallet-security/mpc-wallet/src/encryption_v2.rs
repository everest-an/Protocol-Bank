///! 生产级混合加密模块
///! 
///! 修复了 Gemini 第二轮审查发现的问题：
///! 1. 使用 HKDF-SHA256 进行密钥派生
///! 2. 实现熵源健康检查
///! 3. 增强的 Nonce 管理

use aes_gcm::{
    aead::{Aead, KeyInit, OsRng},
    Aes256Gcm, Nonce,
};
use anyhow::{Context, Result};
use hkdf::Hkdf;
use pqcrypto_kyber::kyber1024;
use pqcrypto_traits::kem::{Ciphertext, PublicKey, SecretKey, SharedSecret};
use serde::{Deserialize, Serialize};
use sha2::Sha256;
use zeroize::{Zeroize, ZeroizeOnDrop};

/// 加密包结构
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct EncryptedPackage {
    /// Kyber 密文（封装的共享密钥）
    pub kyber_ciphertext: Vec<u8>,
    /// AES-GCM 加密的数据
    pub encrypted_data: Vec<u8>,
    /// AES-GCM Nonce (12 bytes)
    pub nonce: Vec<u8>,
    /// 密钥派生信息字符串
    pub kdf_info: String,
    /// 加密时间戳（用于审计）
    pub timestamp: i64,
}

/// Kyber 密钥对
#[derive(Clone)]
pub struct KyberKeyPair {
    pub public_key: kyber1024::PublicKey,
    pub secret_key: kyber1024::SecretKey,
}

impl KyberKeyPair {
    /// 生成新的 Kyber 密钥对
    pub fn generate() -> Self {
        let (pk, sk) = kyber1024::keypair();
        Self {
            public_key: pk,
            secret_key: sk,
        }
    }
}

/// 安全的共享密钥包装器（自动零化）
#[derive(Zeroize, ZeroizeOnDrop)]
struct SecureSharedSecret {
    data: Vec<u8>,
}

impl SecureSharedSecret {
    fn new(ss: kyber1024::SharedSecret) -> Self {
        Self {
            data: ss.as_bytes().to_vec(),
        }
    }

    fn as_bytes(&self) -> &[u8] {
        &self.data
    }
}

/// 生产级混合加密实现
pub struct HybridEncryption;

impl HybridEncryption {
    /// 检查系统熵源健康状态
    /// 
    /// 生产环境关键：确保 /dev/urandom 或系统 RNG 正常工作
    pub fn check_entropy_health() -> Result<()> {
        // 尝试生成一些随机字节来测试熵源
        use rand::RngCore;
        let mut test_bytes = [0u8; 32];
        OsRng.try_fill_bytes(&mut test_bytes)
            .context("熵源健康检查失败：无法从 OsRng 获取随机字节")?;
        
        // 检查是否全为零（极不可能，如果发生则说明 RNG 有问题）
        if test_bytes.iter().all(|&b| b == 0) {
            anyhow::bail!("熵源健康检查失败：RNG 返回全零字节");
        }
        
        Ok(())
    }

    /// 使用 HKDF-SHA256 从 Kyber 共享密钥派生 AES 密钥
    /// 
    /// 修复 Gemini 发现的问题：不再直接使用原始共享密钥
    fn derive_aes_key(shared_secret: &[u8], info: &[u8]) -> Result<[u8; 32]> {
        let hkdf = Hkdf::<Sha256>::new(None, shared_secret);
        let mut okm = [0u8; 32];
        hkdf.expand(info, &mut okm)
            .context("HKDF 密钥派生失败")?;
        Ok(okm)
    }

    /// 生成安全的 Nonce
    /// 
    /// 生产环境关键：每次加密必须使用唯一的 Nonce
    fn generate_nonce() -> Result<[u8; 12]> {
        use rand::RngCore;
        let mut nonce = [0u8; 12];
        OsRng.try_fill_bytes(&mut nonce)
            .context("Nonce 生成失败")?;
        Ok(nonce)
    }

    /// 加密数据
    /// 
    /// 生产级改进：
    /// 1. 熵源健康检查
    /// 2. 使用 HKDF 派生密钥
    /// 3. 安全的 Nonce 生成
    /// 4. 自动零化敏感数据
    pub fn encrypt(data: &[u8], recipient_public_key: &kyber1024::PublicKey) -> Result<EncryptedPackage> {
        // 1. 熵源健康检查
        Self::check_entropy_health()
            .context("加密前熵源健康检查失败")?;

        // 2. Kyber 密钥封装
        let (shared_secret, ciphertext) = kyber1024::encapsulate(recipient_public_key);
        let secure_ss = SecureSharedSecret::new(shared_secret);

        // 3. 使用 HKDF 派生 AES 密钥
        let kdf_info = b"Protocol-Bank-MPC-Wallet-v1.0";
        let aes_key = Self::derive_aes_key(secure_ss.as_bytes(), kdf_info)
            .context("AES 密钥派生失败")?;

        // 4. 生成 Nonce
        let nonce_bytes = Self::generate_nonce()
            .context("Nonce 生成失败")?;
        let nonce = Nonce::from_slice(&nonce_bytes);

        // 5. AES-256-GCM 加密
        let cipher = Aes256Gcm::new_from_slice(&aes_key)
            .context("AES 密码器初始化失败")?;
        let encrypted_data = cipher
            .encrypt(nonce, data)
            .map_err(|e| anyhow::anyhow!("AES-GCM 加密失败: {:?}", e))?;

        // 6. 零化敏感数据
        drop(secure_ss);  // 自动零化共享密钥
        let mut aes_key_mut = aes_key;
        aes_key_mut.zeroize();

        // 7. 返回加密包
        Ok(EncryptedPackage {
            kyber_ciphertext: ciphertext.as_bytes().to_vec(),
            encrypted_data,
            nonce: nonce_bytes.to_vec(),
            kdf_info: String::from_utf8_lossy(kdf_info).to_string(),
            timestamp: chrono::Utc::now().timestamp(),
        })
    }

    /// 解密数据
    /// 
    /// 生产级改进：
    /// 1. 使用 HKDF 派生密钥（与加密一致）
    /// 2. 自动零化敏感数据
    pub fn decrypt(
        package: &EncryptedPackage,
        recipient_secret_key: &kyber1024::SecretKey,
    ) -> Result<Vec<u8>> {
        // 1. 重建 Kyber 密文
        let ciphertext = kyber1024::Ciphertext::from_bytes(&package.kyber_ciphertext)
            .map_err(|_| anyhow::anyhow!("无效的 Kyber 密文"))?;

        // 2. Kyber 密钥解封装
        let shared_secret = kyber1024::decapsulate(&ciphertext, recipient_secret_key);
        let secure_ss = SecureSharedSecret::new(shared_secret);

        // 3. 使用 HKDF 派生 AES 密钥（必须与加密时相同）
        let kdf_info = package.kdf_info.as_bytes();
        let aes_key = Self::derive_aes_key(secure_ss.as_bytes(), kdf_info)
            .context("AES 密钥派生失败")?;

        // 4. AES-256-GCM 解密
        let cipher = Aes256Gcm::new_from_slice(&aes_key)
            .context("AES 密码器初始化失败")?;
        let nonce = Nonce::from_slice(&package.nonce);
        let decrypted_data = cipher
            .decrypt(nonce, package.encrypted_data.as_ref())
            .map_err(|e| anyhow::anyhow!("AES-GCM 解密失败: {:?}", e))?;

        // 5. 零化敏感数据
        drop(secure_ss);
        let mut aes_key_mut = aes_key;
        aes_key_mut.zeroize();

        Ok(decrypted_data)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_entropy_health() {
        assert!(HybridEncryption::check_entropy_health().is_ok());
    }

    #[test]
    fn test_encrypt_decrypt() {
        let keypair = KyberKeyPair::generate();
        let data = b"Test sensitive data";

        let encrypted = HybridEncryption::encrypt(data, &keypair.public_key).unwrap();
        let decrypted = HybridEncryption::decrypt(&encrypted, &keypair.secret_key).unwrap();

        assert_eq!(data.as_slice(), decrypted.as_slice());
    }

    #[test]
    fn test_kdf_deterministic() {
        let shared_secret = [42u8; 32];
        let info = b"test-info";
        
        let key1 = HybridEncryption::derive_aes_key(&shared_secret, info).unwrap();
        let key2 = HybridEncryption::derive_aes_key(&shared_secret, info).unwrap();
        
        assert_eq!(key1, key2, "HKDF 应该是确定性的");
    }
}
