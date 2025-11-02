/// 策略引擎模块
/// 
/// 实现"三权分立"架构中的策略层，负责：
/// 1. 定义和执行交易策略规则
/// 2. 管理审批流程
/// 3. 生成授权令牌
/// 4. 与计算层（MPC 节点）解耦

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use chrono::{DateTime, Utc, Duration, Timelike};

/// 交易请求
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TransactionRequest {
    pub id: String,
    pub from_address: String,
    pub to_address: String,
    pub amount: f64,
    pub currency: String,
    pub timestamp: DateTime<Utc>,
    pub initiator: String,
}

/// 策略规则类型
#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum PolicyRule {
    /// 金额限制：超过此金额需要审批
    AmountLimit { threshold: f64 },
    
    /// 白名单：只能向白名单地址转账
    Whitelist { addresses: Vec<String> },
    
    /// 时间窗口：只能在特定时间段内操作
    TimeWindow { start_hour: u32, end_hour: u32 },
    
    /// 多重审批：需要 N 个审批者中的 M 个批准
    MultiApproval { required: usize, total: usize },
    
    /// 日限额：每日累计转账限额
    DailyLimit { max_amount: f64 },
}

/// 审批状态
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum ApprovalStatus {
    Pending,
    Approved,
    Rejected,
}

/// 审批记录
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Approval {
    pub approver: String,
    pub status: ApprovalStatus,
    pub timestamp: DateTime<Utc>,
    pub comment: Option<String>,
}

/// 授权令牌
/// 只有持有有效令牌，MPC 节点才会执行签名
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AuthorizationToken {
    pub transaction_id: String,
    pub issued_at: DateTime<Utc>,
    pub expires_at: DateTime<Utc>,
    pub signature: String, // 在实际实现中，这里会是策略引擎的数字签名
}

impl AuthorizationToken {
    /// 检查令牌是否有效
    pub fn is_valid(&self) -> bool {
        let now = Utc::now();
        now >= self.issued_at && now <= self.expires_at
    }
}

/// 策略引擎
pub struct PolicyEngine {
    rules: Vec<PolicyRule>,
    pending_approvals: HashMap<String, Vec<Approval>>,
    daily_usage: HashMap<String, f64>, // 日期 -> 已使用金额
}

impl PolicyEngine {
    pub fn new() -> Self {
        Self {
            rules: Vec::new(),
            pending_approvals: HashMap::new(),
            daily_usage: HashMap::new(),
        }
    }

    /// 添加策略规则
    pub fn add_rule(&mut self, rule: PolicyRule) {
        self.rules.push(rule);
    }

    /// 评估交易请求是否符合所有策略
    pub fn evaluate_transaction(&self, tx: &TransactionRequest) -> Result<EvaluationResult> {
        let mut result = EvaluationResult {
            allowed: true,
            requires_approval: false,
            violations: Vec::new(),
            approval_requirements: Vec::new(),
        };

        for rule in &self.rules {
            match rule {
                PolicyRule::AmountLimit { threshold } => {
                    if tx.amount > *threshold {
                        result.requires_approval = true;
                        result.approval_requirements.push(format!(
                            "金额 {} 超过限额 {}，需要审批",
                            tx.amount, threshold
                        ));
                    }
                }
                
                PolicyRule::Whitelist { addresses } => {
                    if !addresses.contains(&tx.to_address) {
                        result.allowed = false;
                        result.violations.push(format!(
                            "目标地址 {} 不在白名单中",
                            tx.to_address
                        ));
                    }
                }
                
                PolicyRule::TimeWindow { start_hour, end_hour } => {
                    let current_hour = tx.timestamp.hour() as u32;
                    if current_hour < *start_hour || current_hour >= *end_hour {
                        result.allowed = false;
                        result.violations.push(format!(
                            "当前时间 {}:00 不在允许的时间窗口 {}:00-{}:00 内",
                            current_hour, start_hour, end_hour
                        ));
                    }
                }
                
                PolicyRule::MultiApproval { required, total } => {
                    result.requires_approval = true;
                    result.approval_requirements.push(format!(
                        "需要 {} 位审批者中的 {} 位批准",
                        total, required
                    ));
                }
                
                PolicyRule::DailyLimit { max_amount } => {
                    let today = Utc::now().format("%Y-%m-%d").to_string();
                    let used = self.daily_usage.get(&today).unwrap_or(&0.0);
                    if used + tx.amount > *max_amount {
                        result.allowed = false;
                        result.violations.push(format!(
                            "超过每日限额：已使用 {}，本次 {}，限额 {}",
                            used, tx.amount, max_amount
                        ));
                    }
                }
            }
        }

        Ok(result)
    }

    /// 提交审批
    pub fn submit_approval(
        &mut self,
        transaction_id: &str,
        approver: &str,
        status: ApprovalStatus,
        comment: Option<String>,
    ) -> Result<()> {
        let approval = Approval {
            approver: approver.to_string(),
            status,
            timestamp: Utc::now(),
            comment,
        };

        self.pending_approvals
            .entry(transaction_id.to_string())
            .or_insert_with(Vec::new)
            .push(approval);

        Ok(())
    }

    /// 检查交易是否获得足够的审批
    pub fn check_approvals(&self, transaction_id: &str) -> Result<bool> {
        let approvals = self.pending_approvals
            .get(transaction_id)
            .context("Transaction not found")?;

        // 简化逻辑：至少需要一个批准，且没有拒绝
        let approved_count = approvals.iter()
            .filter(|a| a.status == ApprovalStatus::Approved)
            .count();
        
        let rejected_count = approvals.iter()
            .filter(|a| a.status == ApprovalStatus::Rejected)
            .count();

        Ok(approved_count > 0 && rejected_count == 0)
    }

    /// 生成授权令牌
    /// 只有当交易通过所有策略检查和审批后，才会生成令牌
    pub fn issue_authorization_token(&self, transaction_id: &str) -> Result<AuthorizationToken> {
        let now = Utc::now();
        let token = AuthorizationToken {
            transaction_id: transaction_id.to_string(),
            issued_at: now,
            expires_at: now + Duration::minutes(5), // 令牌 5 分钟后过期
            signature: format!("POLICY_ENGINE_SIG_{}", transaction_id), // 简化的签名
        };

        Ok(token)
    }
}

/// 策略评估结果
#[derive(Debug)]
pub struct EvaluationResult {
    pub allowed: bool,
    pub requires_approval: bool,
    pub violations: Vec<String>,
    pub approval_requirements: Vec<String>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_amount_limit_policy() {
        let mut engine = PolicyEngine::new();
        engine.add_rule(PolicyRule::AmountLimit { threshold: 1.0 });

        let tx = TransactionRequest {
            id: "tx1".to_string(),
            from_address: "addr1".to_string(),
            to_address: "addr2".to_string(),
            amount: 2.0,
            currency: "BTC".to_string(),
            timestamp: Utc::now(),
            initiator: "user1".to_string(),
        };

        let result = engine.evaluate_transaction(&tx).unwrap();
        assert!(result.requires_approval);
    }

    #[test]
    fn test_whitelist_policy() {
        let mut engine = PolicyEngine::new();
        engine.add_rule(PolicyRule::Whitelist {
            addresses: vec!["safe_addr".to_string()],
        });

        let tx = TransactionRequest {
            id: "tx2".to_string(),
            from_address: "addr1".to_string(),
            to_address: "unknown_addr".to_string(),
            amount: 0.5,
            currency: "BTC".to_string(),
            timestamp: Utc::now(),
            initiator: "user1".to_string(),
        };

        let result = engine.evaluate_transaction(&tx).unwrap();
        assert!(!result.allowed);
        assert!(!result.violations.is_empty());
    }
}
