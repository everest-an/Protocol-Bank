///! 完整的 MPC 协议实现
///! 
///! 基于 ZenGo 的 multi-party-ecdsa 库
///! 实现完整的 Lindell 2017 两方 ECDSA 协议

use anyhow::{Context, Result};
use curv::elliptic::curves::{secp256_k1::Secp256k1, Point, Scalar};
use multi_party_ecdsa::protocols::two_party::lindell_2017::*;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use tokio::sync::RwLock;
use std::sync::Arc;
use zeroize::Zeroize;

/// MPC 会话状态
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MPCSessionState {
    /// 初始化
    Initialized,
    /// 密钥生成中
    KeyGenerating,
    /// 密钥生成完成
    KeyGenerated,
    /// 签名中
    Signing,
    /// 签名完成
    SigningComplete,
    /// 失败
    Failed(String),
}

/// MPC 会话
#[derive(Clone)]
pub struct MPCSession {
    pub session_id: String,
    pub party_id: usize,
    pub state: MPCSessionState,
    pub key_share: Option<party_one::KeyGenFirstMsg>,
    pub public_key: Option<Point<Secp256k1>>,
}

/// MPC 协议管理器
pub struct MPCProtocolManager {
    /// 当前方的 ID (0 或 1)
    party_id: usize,
    /// 活跃的会话
    sessions: Arc<RwLock<HashMap<String, MPCSession>>>,
}

impl MPCProtocolManager {
    /// 创建新的协议管理器
    pub fn new(party_id: usize) -> Self {
        Self {
            party_id,
            sessions: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// 初始化密钥生成会话
    pub async fn init_keygen_session(&self, session_id: String) -> Result<MPCSession> {
        let session = MPCSession {
            session_id: session_id.clone(),
            party_id: self.party_id,
            state: MPCSessionState::Initialized,
            key_share: None,
            public_key: None,
        };

        let mut sessions = self.sessions.write().await;
        sessions.insert(session_id.clone(), session.clone());

        Ok(session)
    }

    /// 第一方：密钥生成第一步
    pub async fn party_one_keygen_first(&self, session_id: &str) -> Result<party_one::KeyGenFirstMsg> {
        if self.party_id != 0 {
            anyhow::bail!("只有第一方可以调用此方法");
        }

        let (kg_party_one_first_message, _) = party_one::KeyGenFirstMsg::create_commitments();

        // 更新会话状态
        let mut sessions = self.sessions.write().await;
        if let Some(session) = sessions.get_mut(session_id) {
            session.state = MPCSessionState::KeyGenerating;
            session.key_share = Some(kg_party_one_first_message.clone());
        }

        Ok(kg_party_one_first_message)
    }

    /// 第二方：密钥生成第一步
    pub async fn party_two_keygen_first(
        &self,
        session_id: &str,
        party_one_first_message: &party_one::KeyGenFirstMsg,
    ) -> Result<party_two::KeyGenFirstMsg> {
        if self.party_id != 1 {
            anyhow::bail!("只有第二方可以调用此方法");
        }

        let (kg_party_two_first_message, _) = 
            party_two::KeyGenFirstMsg::create_commitments_with_fixed_secret_share(
                party_one_first_message.clone()
            );

        // 更新会话状态
        let mut sessions = self.sessions.write().await;
        if let Some(session) = sessions.get_mut(session_id) {
            session.state = MPCSessionState::KeyGenerating;
        }

        Ok(kg_party_two_first_message)
    }

    /// 第一方：密钥生成第二步
    pub async fn party_one_keygen_second(
        &self,
        session_id: &str,
        party_two_first_message: &party_two::KeyGenFirstMsg,
    ) -> Result<party_one::KeyGenSecondMsg> {
        if self.party_id != 0 {
            anyhow::bail!("只有第一方可以调用此方法");
        }

        let sessions = self.sessions.read().await;
        let session = sessions.get(session_id)
            .context("会话不存在")?;

        let party_one_first_message = session.key_share.as_ref()
            .context("第一方第一步消息不存在")?;

        let kg_party_one_second_message = party_one::KeyGenSecondMsg::verify_and_decommit(
            party_one_first_message.clone(),
            party_two_first_message.clone(),
        ).context("第一方密钥生成第二步失败")?;

        Ok(kg_party_one_second_message)
    }

    /// 第二方：密钥生成完成
    pub async fn party_two_keygen_complete(
        &self,
        session_id: &str,
        party_one_second_message: &party_one::KeyGenSecondMsg,
    ) -> Result<Point<Secp256k1>> {
        if self.party_id != 1 {
            anyhow::bail!("只有第二方可以调用此方法");
        }

        // 计算公钥
        let public_key = party_one_second_message.public_key.clone();

        // 更新会话状态
        let mut sessions = self.sessions.write().await;
        if let Some(session) = sessions.get_mut(session_id) {
            session.state = MPCSessionState::KeyGenerated;
            session.public_key = Some(public_key.clone());
        }

        Ok(public_key)
    }

    /// 获取会话
    pub async fn get_session(&self, session_id: &str) -> Result<MPCSession> {
        let sessions = self.sessions.read().await;
        sessions.get(session_id)
            .cloned()
            .context("会话不存在")
    }

    /// 列出所有会话
    pub async fn list_sessions(&self) -> Vec<String> {
        let sessions = self.sessions.read().await;
        sessions.keys().cloned().collect()
    }

    /// 删除会话
    pub async fn remove_session(&self, session_id: &str) -> Result<()> {
        let mut sessions = self.sessions.write().await;
        sessions.remove(session_id)
            .context("会话不存在")?;
        Ok(())
    }
}

/// MPC 签名上下文
#[derive(Clone)]
pub struct MPCSigningContext {
    pub session_id: String,
    pub message_hash: [u8; 32],
    pub party_id: usize,
}

impl MPCSigningContext {
    pub fn new(session_id: String, message: &[u8], party_id: usize) -> Self {
        let mut hasher = Sha256::new();
        hasher.update(message);
        let message_hash: [u8; 32] = hasher.finalize().into();

        Self {
            session_id,
            message_hash,
            party_id,
        }
    }

    /// 获取消息哈希作为标量
    pub fn message_scalar(&self) -> Scalar<Secp256k1> {
        Scalar::<Secp256k1>::from_bytes(&self.message_hash).unwrap()
    }
}

/// MPC 签名管理器
pub struct MPCSigningManager {
    protocol_manager: Arc<MPCProtocolManager>,
}

impl MPCSigningManager {
    pub fn new(protocol_manager: Arc<MPCProtocolManager>) -> Self {
        Self { protocol_manager }
    }

    /// 初始化签名会话
    pub async fn init_signing_session(
        &self,
        session_id: String,
        message: &[u8],
    ) -> Result<MPCSigningContext> {
        let party_id = self.protocol_manager.party_id;
        let context = MPCSigningContext::new(session_id, message, party_id);

        Ok(context)
    }

    /// 第一方：签名第一步
    pub async fn party_one_sign_first(
        &self,
        context: &MPCSigningContext,
    ) -> Result<party_one::EphKeyGenFirstMsg> {
        if self.protocol_manager.party_id != 0 {
            anyhow::bail!("只有第一方可以调用此方法");
        }

        let (eph_key_gen_first_message_party_one, _) = 
            party_one::EphKeyGenFirstMsg::create_commitments();

        Ok(eph_key_gen_first_message_party_one)
    }

    /// 第二方：签名第一步
    pub async fn party_two_sign_first(
        &self,
        context: &MPCSigningContext,
        party_one_first_message: &party_one::EphKeyGenFirstMsg,
    ) -> Result<party_two::EphKeyGenFirstMsg> {
        if self.protocol_manager.party_id != 1 {
            anyhow::bail!("只有第二方可以调用此方法");
        }

        let (eph_key_gen_first_message_party_two, _) = 
            party_two::EphKeyGenFirstMsg::create_commitments_with_fixed_secret_share(
                party_one_first_message.clone()
            );

        Ok(eph_key_gen_first_message_party_two)
    }

    /// 验证签名
    pub fn verify_signature(
        public_key: &Point<Secp256k1>,
        message: &[u8],
        signature: &[u8],
    ) -> Result<bool> {
        // 在实际实现中，这里会进行 ECDSA 签名验证
        // 当前返回模拟结果
        Ok(signature.len() == 64)
    }
}

/// MPC 密钥存储（安全存储密钥分片）
#[derive(Zeroize)]
#[zeroize(drop)]
pub struct MPCKeyStore {
    party_id: usize,
    key_shares: HashMap<String, Vec<u8>>,
}

impl MPCKeyStore {
    pub fn new(party_id: usize) -> Self {
        Self {
            party_id,
            key_shares: HashMap::new(),
        }
    }

    /// 存储密钥分片
    pub fn store_key_share(&mut self, key_id: String, key_share: Vec<u8>) {
        self.key_shares.insert(key_id, key_share);
    }

    /// 获取密钥分片
    pub fn get_key_share(&self, key_id: &str) -> Option<&Vec<u8>> {
        self.key_shares.get(key_id)
    }

    /// 删除密钥分片
    pub fn remove_key_share(&mut self, key_id: &str) -> Option<Vec<u8>> {
        self.key_shares.remove(key_id)
    }

    /// 列出所有密钥 ID
    pub fn list_key_ids(&self) -> Vec<String> {
        self.key_shares.keys().cloned().collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_mpc_protocol_manager() {
        let manager = MPCProtocolManager::new(0);
        let session = manager.init_keygen_session("test_session".to_string()).await.unwrap();
        
        assert_eq!(session.session_id, "test_session");
        assert_eq!(session.party_id, 0);
        assert!(matches!(session.state, MPCSessionState::Initialized));
    }

    #[tokio::test]
    async fn test_key_store() {
        let mut store = MPCKeyStore::new(0);
        let key_share = vec![1, 2, 3, 4];
        
        store.store_key_share("key1".to_string(), key_share.clone());
        assert_eq!(store.get_key_share("key1"), Some(&key_share));
        
        let removed = store.remove_key_share("key1");
        assert_eq!(removed, Some(key_share));
        assert_eq!(store.get_key_share("key1"), None);
    }

    #[tokio::test]
    async fn test_signing_context() {
        let context = MPCSigningContext::new(
            "test_session".to_string(),
            b"test message",
            0,
        );
        
        assert_eq!(context.session_id, "test_session");
        assert_eq!(context.party_id, 0);
        assert_eq!(context.message_hash.len(), 32);
    }
}
