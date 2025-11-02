///! 安全的配置管理系统
///! 
///! 修复了 Gemini 第二轮审查发现的问题：
///! 1. 所有配置必须经过 Ed25519 签名验证
///! 2. 版本控制和回滚机制
///! 3. 配置变更审计

use anyhow::{Context, Result};
use chrono::{DateTime, Utc};
use ed25519_dalek::{Signature, Signer, SigningKey, Verifier, VerifyingKey};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs;
use std::path::{Path, PathBuf};

/// 策略配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PolicyConfig {
    /// 金额限制（超过需要审批）
    pub amount_limit: f64,
    /// 地址白名单
    pub whitelist: Vec<String>,
    /// 时间窗口
    pub time_window_start: u32,
    pub time_window_end: u32,
    /// 每日限额
    pub daily_limit: f64,
    /// 审批者列表
    pub approvers: Vec<String>,
}

/// MPC 配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MPCConfig {
    /// 参与方数量
    pub party_count: usize,
    /// 阈值（t-of-n 中的 t）
    pub threshold: usize,
    /// 协议超时（秒）
    pub protocol_timeout_secs: u64,
    /// 最大重试次数
    pub max_retries: u32,
}

/// 系统配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemConfig {
    /// 配置版本号
    pub version: u64,
    /// 创建时间
    pub created_at: DateTime<Utc>,
    /// 创建者
    pub creator: String,
    /// 策略配置
    pub policy: PolicyConfig,
    /// MPC 配置
    pub mpc: MPCConfig,
}

impl SystemConfig {
    /// 计算配置的哈希
    pub fn compute_hash(&self) -> [u8; 32] {
        let mut hasher = Sha256::new();
        let json = serde_json::to_vec(self).unwrap_or_default();
        hasher.update(&json);
        hasher.finalize().into()
    }
}

/// 签名的配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SignedConfig {
    /// 配置内容
    pub config: SystemConfig,
    /// 配置哈希
    pub config_hash: [u8; 32],
    /// Ed25519 签名
    pub signature: Vec<u8>,
    /// 签名者公钥
    pub signer_public_key: Vec<u8>,
}

impl SignedConfig {
    /// 验证签名
    pub fn verify(&self) -> Result<()> {
        // 1. 验证配置哈希
        let computed_hash = self.config.compute_hash();
        if computed_hash != self.config_hash {
            anyhow::bail!("配置哈希不匹配");
        }

        // 2. 验证 Ed25519 签名
        let public_key = VerifyingKey::from_bytes(&self.signer_public_key.clone().try_into()
            .map_err(|_| anyhow::anyhow!("无效的公钥格式"))?)
            .context("无法解析公钥")?;
        
        let signature = Signature::from_bytes(&self.signature.clone().try_into()
            .map_err(|_| anyhow::anyhow!("无效的签名格式"))?);
        
        public_key
            .verify(&self.config_hash, &signature)
            .map_err(|e| anyhow::anyhow!("签名验证失败: {:?}", e))
    }
}

/// 配置管理器
pub struct ConfigManager {
    /// 配置文件目录
    config_dir: PathBuf,
    /// 配置签名密钥（用于创建新配置）
    signing_key: SigningKey,
    /// 当前活动的配置
    current_config: Option<SignedConfig>,
}

impl ConfigManager {
    /// 创建新的配置管理器
    pub fn new<P: AsRef<Path>>(config_dir: P, signing_key: SigningKey) -> Result<Self> {
        let config_dir = config_dir.as_ref().to_path_buf();
        fs::create_dir_all(&config_dir)
            .context("无法创建配置目录")?;
        
        Ok(Self {
            config_dir,
            signing_key,
            current_config: None,
        })
    }

    /// 加载最新的配置
    pub fn load_latest(&mut self) -> Result<&SignedConfig> {
        // 查找最新版本的配置文件
        let mut max_version = 0u64;
        let mut latest_file: Option<PathBuf> = None;

        for entry in fs::read_dir(&self.config_dir)? {
            let entry = entry?;
            let path = entry.path();
            
            if let Some(filename) = path.file_name().and_then(|s| s.to_str()) {
                if filename.starts_with("config_v") && filename.ends_with(".json") {
                    if let Some(version_str) = filename
                        .strip_prefix("config_v")
                        .and_then(|s| s.strip_suffix(".json"))
                    {
                        if let Ok(version) = version_str.parse::<u64>() {
                            if version > max_version {
                                max_version = version;
                                latest_file = Some(path);
                            }
                        }
                    }
                }
            }
        }

        if let Some(file_path) = latest_file {
            let content = fs::read_to_string(&file_path)
                .context("无法读取配置文件")?;
            let signed_config: SignedConfig = serde_json::from_str(&content)
                .context("无法解析配置文件")?;
            
            // 验证签名
            signed_config.verify()
                .context("配置签名验证失败")?;
            
            self.current_config = Some(signed_config);
            Ok(self.current_config.as_ref().unwrap())
        } else {
            anyhow::bail!("未找到配置文件")
        }
    }

    /// 创建并保存新配置
    pub fn create_config(&mut self, config: SystemConfig) -> Result<SignedConfig> {
        // 1. 计算配置哈希
        let config_hash = config.compute_hash();

        // 2. 签名配置
        let signature = self.signing_key.sign(&config_hash);
        let signer_public_key = self.signing_key.verifying_key().to_bytes().to_vec();

        let signed_config = SignedConfig {
            config,
            config_hash,
            signature: signature.to_bytes().to_vec(),
            signer_public_key,
        };

        // 3. 验证签名（自检）
        signed_config.verify()
            .context("新配置签名验证失败")?;

        // 4. 保存到文件
        let filename = format!("config_v{}.json", signed_config.config.version);
        let file_path = self.config_dir.join(filename);
        let json = serde_json::to_string_pretty(&signed_config)
            .context("无法序列化配置")?;
        fs::write(&file_path, json)
            .context("无法写入配置文件")?;

        // 5. 更新当前配置
        self.current_config = Some(signed_config.clone());

        Ok(signed_config)
    }

    /// 回滚到指定版本
    pub fn rollback(&mut self, version: u64) -> Result<&SignedConfig> {
        let filename = format!("config_v{}.json", version);
        let file_path = self.config_dir.join(filename);

        if !file_path.exists() {
            anyhow::bail!("配置版本 {} 不存在", version);
        }

        let content = fs::read_to_string(&file_path)
            .context("无法读取配置文件")?;
        let signed_config: SignedConfig = serde_json::from_str(&content)
            .context("无法解析配置文件")?;
        
        // 验证签名
        signed_config.verify()
            .context("配置签名验证失败")?;
        
        self.current_config = Some(signed_config);
        Ok(self.current_config.as_ref().unwrap())
    }

    /// 列出所有可用的配置版本
    pub fn list_versions(&self) -> Result<Vec<u64>> {
        let mut versions = Vec::new();

        for entry in fs::read_dir(&self.config_dir)? {
            let entry = entry?;
            let path = entry.path();
            
            if let Some(filename) = path.file_name().and_then(|s| s.to_str()) {
                if filename.starts_with("config_v") && filename.ends_with(".json") {
                    if let Some(version_str) = filename
                        .strip_prefix("config_v")
                        .and_then(|s| s.strip_suffix(".json"))
                    {
                        if let Ok(version) = version_str.parse::<u64>() {
                            versions.push(version);
                        }
                    }
                }
            }
        }

        versions.sort();
        Ok(versions)
    }

    /// 获取当前配置
    pub fn current(&self) -> Option<&SignedConfig> {
        self.current_config.as_ref()
    }
}

/// 配置构建器（用于创建新配置）
pub struct ConfigBuilder {
    version: u64,
    creator: String,
    policy: PolicyConfig,
    mpc: MPCConfig,
}

impl ConfigBuilder {
    pub fn new(version: u64, creator: String) -> Self {
        Self {
            version,
            creator,
            policy: PolicyConfig {
                amount_limit: 1.0,
                whitelist: vec![],
                time_window_start: 9,
                time_window_end: 18,
                daily_limit: 10.0,
                approvers: vec![],
            },
            mpc: MPCConfig {
                party_count: 2,
                threshold: 2,
                protocol_timeout_secs: 300,
                max_retries: 3,
            },
        }
    }

    pub fn with_policy(mut self, policy: PolicyConfig) -> Self {
        self.policy = policy;
        self
    }

    pub fn with_mpc(mut self, mpc: MPCConfig) -> Self {
        self.mpc = mpc;
        self
    }

    pub fn build(self) -> SystemConfig {
        SystemConfig {
            version: self.version,
            created_at: Utc::now(),
            creator: self.creator,
            policy: self.policy,
            mpc: self.mpc,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rand::rngs::OsRng;
    use tempfile::tempdir;

    #[test]
    fn test_config_signing_and_verification() {
        let mut csprng = OsRng;
        let signing_key = SigningKey::generate(&mut csprng);
        
        let config = ConfigBuilder::new(1, "admin".to_string()).build();
        let config_hash = config.compute_hash();
        
        let signature = signing_key.sign(&config_hash);
        let signer_public_key = signing_key.verifying_key().to_bytes().to_vec();
        
        let signed_config = SignedConfig {
            config,
            config_hash,
            signature: signature.to_bytes().to_vec(),
            signer_public_key,
        };
        
        assert!(signed_config.verify().is_ok());
    }

    #[test]
    fn test_config_manager() {
        let dir = tempdir().unwrap();
        let mut csprng = OsRng;
        let signing_key = SigningKey::generate(&mut csprng);
        
        let mut manager = ConfigManager::new(dir.path(), signing_key).unwrap();
        
        // 创建配置 v1
        let config_v1 = ConfigBuilder::new(1, "admin".to_string()).build();
        manager.create_config(config_v1).unwrap();
        
        // 创建配置 v2
        let config_v2 = ConfigBuilder::new(2, "admin".to_string()).build();
        manager.create_config(config_v2).unwrap();
        
        // 加载最新配置
        let latest = manager.load_latest().unwrap();
        assert_eq!(latest.config.version, 2);
        
        // 回滚到 v1
        let rolled_back = manager.rollback(1).unwrap();
        assert_eq!(rolled_back.config.version, 1);
    }

    #[test]
    fn test_config_tampering_detection() {
        let dir = tempdir().unwrap();
        let mut csprng = OsRng;
        let signing_key = SigningKey::generate(&mut csprng);
        
        let mut manager = ConfigManager::new(dir.path(), signing_key).unwrap();
        
        let config = ConfigBuilder::new(1, "admin".to_string()).build();
        manager.create_config(config).unwrap();
        
        // 篡改配置文件
        let file_path = dir.path().join("config_v1.json");
        let mut signed_config: SignedConfig = serde_json::from_str(
            &fs::read_to_string(&file_path).unwrap()
        ).unwrap();
        
        // 修改配置但不更新签名
        signed_config.config.policy.amount_limit = 999.0;
        
        let tampered_json = serde_json::to_string_pretty(&signed_config).unwrap();
        fs::write(&file_path, tampered_json).unwrap();
        
        // 尝试加载，应该失败
        let result = manager.load_latest();
        assert!(result.is_err(), "应该检测到配置篡改");
    }
}
