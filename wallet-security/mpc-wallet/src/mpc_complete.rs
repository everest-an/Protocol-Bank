///! 完整的 MPC 密钥生成和签名实现
///! 
///! 基于 ZenGo 的 multi-party-ecdsa 库（Lindell 2017 协议）
///! 这是一个生产级实现，包含完整的密钥生成和签名流程

use anyhow::{anyhow, Result};
use curv::elliptic::curves::{secp256_k1::Secp256k1, Point, Scalar};
use curv::BigInt;
use multi_party_ecdsa::protocols::two_party_ecdsa::lindell_2017::{party_one, party_two};
// use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;
// use zeroize::ZeroizeOnDrop;

/// MPC 密钥生成完整流程
#[derive(Clone)]
pub struct MPCKeyGen {
    party_id: u16, // 0 = Party 1, 1 = Party 2
}

impl MPCKeyGen {
    pub fn new(party_id: u16) -> Result<Self> {
        if party_id > 1 {
            return Err(anyhow!("Party ID must be 0 or 1"));
        }
        Ok(Self { party_id })
    }

    /// 执行完整的密钥生成流程（两方协作）
    /// 返回：(共享公钥, Party 1 私钥数据, Party 2 私钥数据)
    pub async fn generate_key() -> Result<(Point<Secp256k1>, Party1KeyData, Party2KeyData)> {
        // === 第一轮：生成承诺 ===
        
        // Party 1: 生成第一条消息（承诺）
        let (kg_party_one_first_message, comm_witness, ec_key_pair_party1) =
            party_one::KeyGenFirstMsg::create_commitments();

        // Party 2: 生成第一条消息
        let (kg_party_two_first_message, ec_key_pair_party2) = 
            party_two::KeyGenFirstMsg::create();

        // === 第二轮：验证并去承诺 ===
        
        // Party 1: 验证 Party 2 的证明
        let kg_party_one_second_message = party_one::KeyGenSecondMsg::verify_and_decommit(
            comm_witness,
            &kg_party_two_first_message.d_log_proof,
        )?;

        // Party 2: 验证 Party 1 的证明
        let _kg_party_two_second_message = party_two::KeyGenSecondMsg::verify_commitments_and_dlog_proof(
            &kg_party_one_first_message,
            &kg_party_one_second_message,
        )?;

        // === 第三轮：Paillier 密钥交换 ===
        
        // Party 1: 生成 Paillier 密钥对
        let paillier_key_pair =
            party_one::PaillierKeyPair::generate_keypair_and_encrypted_share(&ec_key_pair_party1);

        let party_one_private =
            party_one::Party1Private::set_private_key(&ec_key_pair_party1, &paillier_key_pair);

        // Party 2: 保存 Paillier 公钥
        let party_two_paillier = party_two::PaillierPublic {
            ek: paillier_key_pair.ek.clone(),
            encrypted_secret_share: paillier_key_pair.encrypted_share.clone(),
        };

        // 生成 Paillier 密钥正确性证明
        let correct_key_proof =
            party_one::PaillierKeyPair::generate_ni_proof_correct_key(&paillier_key_pair);
        
        // Party 2: 验证 Paillier 密钥
        party_two::PaillierPublic::verify_ni_proof_correct_key(
            correct_key_proof,
            &party_two_paillier.ek,
        )?;

        // === 第四轮：PDL 证明 ===
        
        let (pdl_statement, pdl_proof, composite_dlog_proof) =
            party_one::PaillierKeyPair::pdl_proof(&party_one_private, &paillier_key_pair);
        
        party_two::PaillierPublic::pdl_verify(
            &composite_dlog_proof,
            &pdl_statement,
            &pdl_proof,
            &party_two_paillier,
            &kg_party_one_second_message.comm_witness.public_share,
        )?;

        // === 计算共享公钥 ===
        
        let party_two_private = party_two::Party2Private::set_private_key(&ec_key_pair_party2);

        // 计算共享公钥（两方应该得到相同的结果）
        let pubkey_party1 = party_one::compute_pubkey(
            &party_one_private,
            &kg_party_two_first_message.public_share
        );
        let pubkey_party2 = party_two::compute_pubkey(
            &ec_key_pair_party2,
            &kg_party_one_second_message.comm_witness.public_share
        );

        // 验证两个公钥相同
        if pubkey_party1 != pubkey_party2 {
            return Err(anyhow!("Public keys do not match!"));
        }

        // 保存密钥数据
        let party1_data = Party1KeyData {
            private_key: party_one_private,
            paillier_keypair: paillier_key_pair,
            ec_keypair: ec_key_pair_party1,
            party2_public_share: kg_party_two_first_message.public_share,
        };

        let party2_data = Party2KeyData {
            private_key: party_two_private,
            ec_keypair: ec_key_pair_party2,
            party1_public_share: kg_party_one_second_message.comm_witness.public_share,
            paillier_public: party_two_paillier,
        };

        Ok((pubkey_party1, party1_data, party2_data))
    }
}

/// Party 1 的密钥数据
pub struct Party1KeyData {
    pub private_key: party_one::Party1Private,
    pub paillier_keypair: party_one::PaillierKeyPair,
    pub ec_keypair: party_one::EcKeyPair,
    pub party2_public_share: Point<Secp256k1>,
}

/// Party 2 的密钥数据
pub struct Party2KeyData {
    pub private_key: party_two::Party2Private,
    pub ec_keypair: party_two::EcKeyPair,
    pub party1_public_share: Point<Secp256k1>,
    pub paillier_public: party_two::PaillierPublic,
}

/// MPC 签名完整流程
pub struct MPCSigning;

impl MPCSigning {
    /// 执行完整的签名流程（两方协作）
    /// 
    /// # 参数
    /// - `party1_data`: Party 1 的密钥数据
    /// - `party2_data`: Party 2 的密钥数据
    /// - `message`: 要签名的消息
    /// 
    /// # 返回
    /// ECDSA 签名 (r, s)
    pub async fn sign(
        party1_data: &Party1KeyData,
        party2_data: &Party2KeyData,
        message: &[u8],
    ) -> Result<(BigInt, BigInt)> {
        // 计算消息哈希
        use sha2::{Digest, Sha256};
        let mut hasher = Sha256::new();
        hasher.update(message);
        let message_hash: [u8; 32] = hasher.finalize().into();
        use curv::arithmetic::traits::Converter;
        let message_bigint = BigInt::from_bytes(&message_hash);

        // === 第一轮：生成临时密钥 ===
        
        // Party 2: 生成临时密钥（带承诺）
        let (eph_party_two_first_message, eph_comm_witness, eph_ec_key_pair_party2) =
            party_two::EphKeyGenFirstMsg::create_commitments();

        // Party 1: 生成临时密钥
        let (eph_party_one_first_message, eph_ec_key_pair_party1) =
            party_one::EphKeyGenFirstMsg::create();

        // === 第二轮：验证临时密钥 ===
        
        // Party 2: 验证 Party 1 的临时密钥并去承诺
        let eph_party_two_second_message = party_two::EphKeyGenSecondMsg::verify_and_decommit(
            eph_comm_witness,
            &eph_party_one_first_message,
        )?;

        // Party 1: 验证 Party 2 的临时密钥
        let _eph_party_one_second_message = party_one::EphKeyGenSecondMsg::verify_commitments_and_dlog_proof(
            &eph_party_two_first_message,
            &eph_party_two_second_message,
        )?;

        // === 第三轮：计算部分签名 ===
        
        // Party 2: 计算部分签名
        let partial_sig = party_two::PartialSig::compute(
            &party2_data.paillier_public.ek,
            &party2_data.paillier_public.encrypted_secret_share,
            &party2_data.private_key,
            &eph_ec_key_pair_party2,
            &eph_party_one_first_message.public_share,
            &message_bigint,
        );

        // === 第四轮：完成签名 ===
        
        // Party 1: 完成签名
        let signature = party_one::Signature::compute(
            &party1_data.private_key,
            &partial_sig.c3,
            &eph_ec_key_pair_party1,
            &eph_party_two_second_message.comm_witness.public_share,
        );

        Ok((signature.r, signature.s))
    }

    /// 验证 ECDSA 签名
    pub fn verify(
        public_key: &Point<Secp256k1>,
        message: &[u8],
        signature: &(BigInt, BigInt),
    ) -> Result<bool> {
        use sha2::{Digest, Sha256};
        
        // 计算消息哈希
        let mut hasher = Sha256::new();
        hasher.update(message);
        let message_hash: [u8; 32] = hasher.finalize().into();
        use curv::arithmetic::traits::Converter;
        let message_bigint = BigInt::from_bytes(&message_hash);

        let (r, s) = signature;
        let sig = party_one::Signature {
            r: r.clone(),
            s: s.clone(),
        };

        match party_one::verify(&sig, public_key, &message_bigint) {
            Ok(_) => Ok(true),
            Err(e) => Err(anyhow!("Signature verification failed: {:?}", e)),
        }
    }
}

/// MPC 钱包会话管理器
pub struct MPCWalletSession {
    pub session_id: String,
    pub party_id: u16,
    pub shared_public_key: Option<Point<Secp256k1>>,
    party1_data: Arc<RwLock<Option<Party1KeyData>>>,
    party2_data: Arc<RwLock<Option<Party2KeyData>>>,
}

impl MPCWalletSession {
    pub fn new(session_id: String, party_id: u16) -> Self {
        Self {
            session_id,
            party_id,
            shared_public_key: None,
            party1_data: Arc::new(RwLock::new(None)),
            party2_data: Arc::new(RwLock::new(None)),
        }
    }

    /// 执行密钥生成
    pub async fn generate_key(&mut self) -> Result<Point<Secp256k1>> {
        let (pubkey, party1_data, party2_data) = MPCKeyGen::generate_key().await?;

        // 保存密钥数据
        *self.party1_data.write().await = Some(party1_data);
        *self.party2_data.write().await = Some(party2_data);
        self.shared_public_key = Some(pubkey.clone());

        Ok(pubkey)
    }

    /// 执行签名
    pub async fn sign(&self, message: &[u8]) -> Result<(BigInt, BigInt)> {
        let party1_data = self.party1_data.read().await;
        let party2_data = self.party2_data.read().await;

        let p1 = party1_data.as_ref().ok_or_else(|| anyhow!("Party 1 data not initialized"))?;
        let p2 = party2_data.as_ref().ok_or_else(|| anyhow!("Party 2 data not initialized"))?;

        MPCSigning::sign(p1, p2, message).await
    }

    /// 验证签名
    pub fn verify(&self, message: &[u8], signature: &(BigInt, BigInt)) -> Result<bool> {
        let pubkey = self.shared_public_key.as_ref().ok_or_else(|| anyhow!("Public key not generated"))?;
        MPCSigning::verify(pubkey, message, signature)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_full_mpc_keygen_and_sign() {
        println!("🔑 Starting MPC key generation...");
        
        // 生成密钥
        let (pubkey, party1_data, party2_data) = MPCKeyGen::generate_key().await.unwrap();
        println!("✅ Key generation completed!");
        println!("📍 Shared public key: {:?}", pubkey);

        // 签名消息
        let message = b"Hello, MPC World!";
        println!("\n📝 Signing message: {:?}", std::str::from_utf8(message).unwrap());
        
        let signature = MPCSigning::sign(&party1_data, &party2_data, message).await.unwrap();
        println!("✅ Signature generated!");
        println!("📍 Signature (r, s): ({:?}, {:?})", signature.0, signature.1);

        // 验证签名
        println!("\n🔍 Verifying signature...");
        let is_valid = MPCSigning::verify(&pubkey, message, &signature).unwrap();
        println!("✅ Signature verification: {}", if is_valid { "VALID ✓" } else { "INVALID ✗" });

        assert!(is_valid, "Signature should be valid!");
    }

    #[tokio::test]
    async fn test_mpc_wallet_session() {
        let mut session = MPCWalletSession::new("test-session".to_string(), 0);

        // 生成密钥
        let pubkey = session.generate_key().await.unwrap();
        println!("Public key: {:?}", pubkey);

        // 签名
        let message = b"Test message";
        let signature = session.sign(message).await.unwrap();
        println!("Signature: ({:?}, {:?})", signature.0, signature.1);

        // 验证
        let is_valid = session.verify(message, &signature).unwrap();
        assert!(is_valid);
    }
}
