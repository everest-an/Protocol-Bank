///! 不可篡改的审计日志系统
///! 
///! 修复了 Gemini 第二轮审查发现的问题：
///! 1. 实现区块链式的加密链
///! 2. 使用持久化存储（Sled 嵌入式数据库）
///! 3. 记录所有安全相关事件
///! 4. 提供篡改检测机制

use anyhow::{Context, Result};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use sled::Db;
use std::path::Path;

/// 审计事件类型
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AuditEventType {
    /// MPC 密钥生成
    MPCKeyGeneration {
        party_id: String,
        public_key_hash: [u8; 32],
    },
    /// MPC 签名请求
    MPCSignRequest {
        transaction_id: String,
        message_hash: [u8; 32],
    },
    /// MPC 签名完成
    MPCSignComplete {
        transaction_id: String,
        signature_hash: [u8; 32],
    },
    /// 策略评估
    PolicyEvaluation {
        transaction_id: String,
        passed: bool,
        violations: Vec<String>,
    },
    /// 授权令牌签发
    TokenIssued {
        transaction_id: String,
        token_nonce: u64,
        expires_at: DateTime<Utc>,
    },
    /// 授权令牌消费
    TokenConsumed {
        transaction_id: String,
        token_nonce: u64,
    },
    /// 密钥访问
    KeyAccess {
        party_id: String,
        operation: String,  // "encrypt" | "decrypt"
        success: bool,
    },
    /// 配置变更
    ConfigurationChange {
        change_type: String,
        initiator: String,
        details: String,
    },
    /// 安全告警
    SecurityAlert {
        alert_type: String,
        severity: String,  // "low" | "medium" | "high" | "critical"
        details: String,
    },
}

/// 审计日志条目
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditLogEntry {
    /// 序列号（自增）
    pub sequence: u64,
    /// 时间戳
    pub timestamp: DateTime<Utc>,
    /// 事件类型
    pub event: AuditEventType,
    /// 前一个条目的哈希（区块链式链接）
    pub previous_hash: [u8; 32],
    /// 当前条目的哈希
    pub current_hash: [u8; 32],
}

impl AuditLogEntry {
    /// 计算条目的哈希
    fn compute_hash(
        sequence: u64,
        timestamp: &DateTime<Utc>,
        event: &AuditEventType,
        previous_hash: &[u8; 32],
    ) -> [u8; 32] {
        let mut hasher = Sha256::new();
        hasher.update(&sequence.to_le_bytes());
        hasher.update(&timestamp.timestamp().to_le_bytes());
        hasher.update(&serde_json::to_vec(event).unwrap_or_default());
        hasher.update(previous_hash);
        hasher.finalize().into()
    }

    /// 验证条目的哈希
    pub fn verify_hash(&self) -> bool {
        let computed = Self::compute_hash(
            self.sequence,
            &self.timestamp,
            &self.event,
            &self.previous_hash,
        );
        computed == self.current_hash
    }
}

/// 不可篡改的审计日志系统
pub struct AuditLog {
    /// Sled 数据库（持久化存储）
    db: Db,
    /// 当前序列号
    current_sequence: u64,
    /// 最后一个条目的哈希
    last_hash: [u8; 32],
}

impl AuditLog {
    /// 创建或打开审计日志
    pub fn open<P: AsRef<Path>>(path: P) -> Result<Self> {
        let db = sled::open(path).context("无法打开审计日志数据库")?;
        
        // 读取最后一个条目
        let (current_sequence, last_hash) = if let Some(last_key) = db.last()? {
            let entry: AuditLogEntry = serde_json::from_slice(&last_key.1)
                .context("无法反序列化最后一个审计条目")?;
            (entry.sequence, entry.current_hash)
        } else {
            // 创世块
            (0, [0u8; 32])
        };
        
        Ok(Self {
            db,
            current_sequence,
            last_hash,
        })
    }

    /// 追加审计事件
    pub fn append(&mut self, event: AuditEventType) -> Result<AuditLogEntry> {
        let sequence = self.current_sequence + 1;
        let timestamp = Utc::now();
        let previous_hash = self.last_hash;
        
        let current_hash = AuditLogEntry::compute_hash(
            sequence,
            &timestamp,
            &event,
            &previous_hash,
        );
        
        let entry = AuditLogEntry {
            sequence,
            timestamp,
            event,
            previous_hash,
            current_hash,
        };
        
        // 持久化到数据库
        let key = sequence.to_be_bytes();
        let value = serde_json::to_vec(&entry)
            .context("无法序列化审计条目")?;
        self.db.insert(&key, value)
            .context("无法写入审计日志")?;
        self.db.flush()
            .context("无法刷新审计日志")?;
        
        // 更新状态
        self.current_sequence = sequence;
        self.last_hash = current_hash;
        
        Ok(entry)
    }

    /// 验证整个审计链的完整性
    pub fn verify_chain(&self) -> Result<bool> {
        let mut previous_hash = [0u8; 32];
        
        for result in self.db.iter() {
            let (_, value) = result.context("无法读取审计条目")?;
            let entry: AuditLogEntry = serde_json::from_slice(&value)
                .context("无法反序列化审计条目")?;
            
            // 验证前向链接
            if entry.previous_hash != previous_hash {
                return Ok(false);
            }
            
            // 验证当前哈希
            if !entry.verify_hash() {
                return Ok(false);
            }
            
            previous_hash = entry.current_hash;
        }
        
        Ok(true)
    }

    /// 查询审计日志
    pub fn query(&self, start_sequence: u64, end_sequence: u64) -> Result<Vec<AuditLogEntry>> {
        let mut entries = Vec::new();
        
        for seq in start_sequence..=end_sequence {
            let key = seq.to_be_bytes();
            if let Some(value) = self.db.get(&key)? {
                let entry: AuditLogEntry = serde_json::from_slice(&value)
                    .context("无法反序列化审计条目")?;
                entries.push(entry);
            }
        }
        
        Ok(entries)
    }

    /// 获取最新的 N 条日志
    pub fn get_latest(&self, count: usize) -> Result<Vec<AuditLogEntry>> {
        let start = if self.current_sequence > count as u64 {
            self.current_sequence - count as u64 + 1
        } else {
            1
        };
        self.query(start, self.current_sequence)
    }

    /// 导出审计日志（用于外部审计）
    pub fn export_to_json<P: AsRef<Path>>(&self, path: P) -> Result<()> {
        let entries = self.query(1, self.current_sequence)?;
        let json = serde_json::to_string_pretty(&entries)
            .context("无法序列化审计日志")?;
        std::fs::write(path, json)
            .context("无法写入审计日志文件")?;
        Ok(())
    }

    /// 获取统计信息
    pub fn get_stats(&self) -> AuditLogStats {
        AuditLogStats {
            total_entries: self.current_sequence,
            chain_verified: self.verify_chain().unwrap_or(false),
            last_entry_time: if self.current_sequence > 0 {
                self.query(self.current_sequence, self.current_sequence)
                    .ok()
                    .and_then(|entries| entries.first().map(|e| e.timestamp))
            } else {
                None
            },
        }
    }
}

/// 审计日志统计信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditLogStats {
    pub total_entries: u64,
    pub chain_verified: bool,
    pub last_entry_time: Option<DateTime<Utc>>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_audit_log_basic() {
        let dir = tempdir().unwrap();
        let mut log = AuditLog::open(dir.path().join("audit.db")).unwrap();
        
        let event = AuditEventType::MPCKeyGeneration {
            party_id: "party1".to_string(),
            public_key_hash: [1u8; 32],
        };
        
        let entry = log.append(event).unwrap();
        assert_eq!(entry.sequence, 1);
        assert!(entry.verify_hash());
    }

    #[test]
    fn test_audit_chain_verification() {
        let dir = tempdir().unwrap();
        let mut log = AuditLog::open(dir.path().join("audit.db")).unwrap();
        
        // 追加多个事件
        for i in 0..10 {
            let event = AuditEventType::SecurityAlert {
                alert_type: format!("test_alert_{}", i),
                severity: "low".to_string(),
                details: format!("Test alert {}", i),
            };
            log.append(event).unwrap();
        }
        
        // 验证链的完整性
        assert!(log.verify_chain().unwrap());
    }

    #[test]
    fn test_audit_log_persistence() {
        let dir = tempdir().unwrap();
        let path = dir.path().join("audit.db");
        
        // 第一次打开，写入数据
        {
            let mut log = AuditLog::open(&path).unwrap();
            let event = AuditEventType::TokenIssued {
                transaction_id: "tx_001".to_string(),
                token_nonce: 12345,
                expires_at: Utc::now(),
            };
            log.append(event).unwrap();
        }
        
        // 第二次打开，验证数据仍然存在
        {
            let log = AuditLog::open(&path).unwrap();
            assert_eq!(log.current_sequence, 1);
            assert!(log.verify_chain().unwrap());
        }
    }

    #[test]
    fn test_audit_log_query() {
        let dir = tempdir().unwrap();
        let mut log = AuditLog::open(dir.path().join("audit.db")).unwrap();
        
        // 追加 5 个事件
        for i in 0..5 {
            let event = AuditEventType::KeyAccess {
                party_id: format!("party{}", i),
                operation: "decrypt".to_string(),
                success: true,
            };
            log.append(event).unwrap();
        }
        
        // 查询前 3 个
        let entries = log.query(1, 3).unwrap();
        assert_eq!(entries.len(), 3);
        assert_eq!(entries[0].sequence, 1);
        assert_eq!(entries[2].sequence, 3);
    }

    #[test]
    fn test_tampering_detection() {
        let dir = tempdir().unwrap();
        let path = dir.path().join("audit.db");
        let mut log = AuditLog::open(&path).unwrap();
        
        // 追加一些事件
        for i in 0..5 {
            let event = AuditEventType::PolicyEvaluation {
                transaction_id: format!("tx_{}", i),
                passed: true,
                violations: vec![],
            };
            log.append(event).unwrap();
        }
        
        // 验证链完整
        assert!(log.verify_chain().unwrap());
        
        // 模拟篡改：直接修改数据库中的一个条目
        let key = 3u64.to_be_bytes();
        let mut entry: AuditLogEntry = serde_json::from_slice(&log.db.get(&key).unwrap().unwrap()).unwrap();
        entry.current_hash = [0xFF; 32];  // 篡改哈希
        let tampered_value = serde_json::to_vec(&entry).unwrap();
        log.db.insert(&key, tampered_value).unwrap();
        log.db.flush().unwrap();
        
        // 重新打开并验证，应该检测到篡改
        let log_reopen = AuditLog::open(&path).unwrap();
        assert!(!log_reopen.verify_chain().unwrap(), "应该检测到篡改");
    }
}
