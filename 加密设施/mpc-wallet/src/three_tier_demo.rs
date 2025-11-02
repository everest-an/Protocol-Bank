/// 三权分立架构完整演示
/// 
/// 展示计算层、存储层、策略层的完整交互流程

use anyhow::Result;
use chrono::Utc;
use crate::policy_engine::{PolicyEngine, PolicyRule, TransactionRequest, ApprovalStatus};

pub fn run_three_tier_demo() -> Result<()> {
    println!("\n╔══════════════════════════════════════════════════════════════╗");
    println!("║            三权分立架构完整演示                             ║");
    println!("╚══════════════════════════════════════════════════════════════╝\n");

    // ========== 初始化策略引擎 ==========
    println!("═══════════════════════════════════════════════════════════════");
    println!("第一层：策略引擎（Policy Engine）");
    println!("═══════════════════════════════════════════════════════════════");
    
    let mut policy_engine = PolicyEngine::new();
    
    // 添加策略规则
    println!("📋 配置策略规则:");
    policy_engine.add_rule(PolicyRule::AmountLimit { threshold: 1.0 });
    println!("  ✓ 金额限制: 超过 1.0 BTC 需要审批");
    
    policy_engine.add_rule(PolicyRule::Whitelist {
        addresses: vec![
            "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh".to_string(),
            "bc1q5d9w8zv3j7k2m4n6p8r0s1t3u5v7w9x0y2z4a6".to_string(),
        ],
    });
    println!("  ✓ 地址白名单: 仅允许向 2 个预设地址转账");
    
    policy_engine.add_rule(PolicyRule::TimeWindow {
        start_hour: 9,
        end_hour: 18,
    });
    println!("  ✓ 时间窗口: 仅允许 9:00-18:00 操作");
    
    policy_engine.add_rule(PolicyRule::DailyLimit { max_amount: 10.0 });
    println!("  ✓ 每日限额: 10.0 BTC");

    // ========== 场景 1: 小额交易，自动通过 ==========
    println!("\n═══════════════════════════════════════════════════════════════");
    println!("场景 1: 小额交易（0.5 BTC）");
    println!("═══════════════════════════════════════════════════════════════");
    
    let tx1 = TransactionRequest {
        id: "tx_001".to_string(),
        from_address: "bc1q_user_wallet".to_string(),
        to_address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh".to_string(),
        amount: 0.5,
        currency: "BTC".to_string(),
        timestamp: Utc::now(),
        initiator: "alice@company.com".to_string(),
    };
    
    println!("📤 用户发起交易:");
    println!("  • 金额: {} {}", tx1.amount, tx1.currency);
    println!("  • 目标: {}", &tx1.to_address[..20]);
    println!("  • 发起人: {}", tx1.initiator);
    
    let eval1 = policy_engine.evaluate_transaction(&tx1)?;
    
    if eval1.allowed && !eval1.requires_approval {
        println!("\n✅ 策略检查通过，无需审批");
        let token = policy_engine.issue_authorization_token(&tx1.id)?;
        println!("🎫 授权令牌已签发:");
        println!("  • 交易 ID: {}", token.transaction_id);
        println!("  • 有效期至: {}", token.expires_at.format("%H:%M:%S"));
        
        println!("\n🔐 计算层（MPC 节点）收到令牌，开始签名...");
        println!("  ├─ 验证令牌有效性: ✓");
        println!("  ├─ 从存储层加载加密分片: ✓");
        println!("  ├─ 执行 MPC 协同签名: ✓");
        println!("  └─ 签名完成，广播交易: ✓");
    }

    // ========== 场景 2: 大额交易，需要审批 ==========
    println!("\n═══════════════════════════════════════════════════════════════");
    println!("场景 2: 大额交易（2.5 BTC）");
    println!("═══════════════════════════════════════════════════════════════");
    
    let tx2 = TransactionRequest {
        id: "tx_002".to_string(),
        from_address: "bc1q_user_wallet".to_string(),
        to_address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh".to_string(),
        amount: 2.5,
        currency: "BTC".to_string(),
        timestamp: Utc::now(),
        initiator: "bob@company.com".to_string(),
    };
    
    println!("📤 用户发起交易:");
    println!("  • 金额: {} {}", tx2.amount, tx2.currency);
    println!("  • 目标: {}", &tx2.to_address[..20]);
    println!("  • 发起人: {}", tx2.initiator);
    
    let eval2 = policy_engine.evaluate_transaction(&tx2)?;
    
    if eval2.requires_approval {
        println!("\n⚠️  需要审批:");
        for req in &eval2.approval_requirements {
            println!("  • {}", req);
        }
        
        println!("\n📧 向审批者发送通知...");
        println!("  • 审批者 1: cfo@company.com");
        println!("  • 审批者 2: ceo@company.com");
        
        // 模拟审批流程
        println!("\n⏳ 等待审批...");
        
        policy_engine.submit_approval(
            &tx2.id,
            "cfo@company.com",
            ApprovalStatus::Approved,
            Some("金额合理，业务需要".to_string()),
        )?;
        println!("  ✓ CFO 已批准");
        
        policy_engine.submit_approval(
            &tx2.id,
            "ceo@company.com",
            ApprovalStatus::Approved,
            Some("同意".to_string()),
        )?;
        println!("  ✓ CEO 已批准");
        
        if policy_engine.check_approvals(&tx2.id)? {
            println!("\n✅ 审批通过，签发授权令牌");
            let token = policy_engine.issue_authorization_token(&tx2.id)?;
            println!("🎫 令牌 ID: {}", token.transaction_id);
            
            println!("\n🔐 计算层开始执行签名...");
            println!("  └─ ✓ 交易已完成");
        }
    }

    // ========== 场景 3: 违反策略，拒绝交易 ==========
    println!("\n═══════════════════════════════════════════════════════════════");
    println!("场景 3: 向非白名单地址转账");
    println!("═══════════════════════════════════════════════════════════════");
    
    let tx3 = TransactionRequest {
        id: "tx_003".to_string(),
        from_address: "bc1q_user_wallet".to_string(),
        to_address: "bc1q_UNKNOWN_ADDRESS_xyz".to_string(),
        amount: 0.3,
        currency: "BTC".to_string(),
        timestamp: Utc::now(),
        initiator: "charlie@company.com".to_string(),
    };
    
    println!("📤 用户发起交易:");
    println!("  • 金额: {} {}", tx3.amount, tx3.currency);
    println!("  • 目标: {}", tx3.to_address);
    
    let eval3 = policy_engine.evaluate_transaction(&tx3)?;
    
    if !eval3.allowed {
        println!("\n❌ 交易被拒绝:");
        for violation in &eval3.violations {
            println!("  • {}", violation);
        }
        println!("\n🚫 计算层不会收到授权令牌，无法执行签名");
    }

    // ========== 架构总结 ==========
    println!("\n═══════════════════════════════════════════════════════════════");
    println!("🏛️  三权分立架构总结");
    println!("═══════════════════════════════════════════════════════════════");
    println!("\n【策略层 - Policy Engine】");
    println!("  • 定义和执行所有业务规则");
    println!("  • 管理审批流程");
    println!("  • 签发授权令牌");
    println!("  • 与计算层完全解耦");
    
    println!("\n【存储层 - Encrypted Storage】");
    println!("  • 存储加密的密钥分片");
    println!("  • 对存储内容零知识");
    println!("  • 只响应授权的读取请求");
    println!("  • 支持分布式和灾备");
    
    println!("\n【计算层 - MPC Nodes】");
    println!("  • 验证授权令牌");
    println!("  • 执行 MPC 签名计算");
    println!("  • 无状态设计");
    println!("  • 用后即焚密钥分片");
    
    println!("\n✨ 这种架构确保了:");
    println!("  ✓ 职责分离 - 每层只负责自己的功能");
    println!("  ✓ 安全隔离 - 攻破一层不会危及整个系统");
    println!("  ✓ 灵活扩展 - 可独立升级和扩展每一层");
    println!("  ✓ 合规友好 - 满足审计和监管要求");

    Ok(())
}
