const { pool: db } = require('../config/database');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * AML (Anti-Money Laundering) Service
 * 实现交易监控、风险评分、黑名单管理等AML功能
 */
class AMLService {
  constructor() {
    this.riskThresholds = {
      low: 30,
      medium: 50,
      high: 70,
      critical: 90
    };
  }

  /**
   * 评估交易风险
   * @param {Object} transaction - 交易对象
   * @returns {Object} 风险评估结果
   */
  async assessTransactionRisk(transaction) {
    try {
      const riskFactors = [];
      let totalRiskScore = 0;
      const triggeredRules = [];

      // 1. 检查黑名单
      const blacklistRisk = await this.checkBlacklist(transaction);
      if (blacklistRisk.isBlacklisted) {
        riskFactors.push(blacklistRisk);
        totalRiskScore += 100; // 黑名单直接最高分
        triggeredRules.push({ rule: 'Blacklist Match', score: 100 });
      }

      // 2. 检查金额阈值
      const amountRisk = await this.checkAmountThreshold(transaction);
      if (amountRisk.triggered) {
        riskFactors.push(amountRisk);
        totalRiskScore += amountRisk.score;
        triggeredRules.push({ rule: amountRisk.ruleName, score: amountRisk.score });
      }

      // 3. 检查交易频率
      const frequencyRisk = await this.checkTransactionFrequency(transaction);
      if (frequencyRisk.triggered) {
        riskFactors.push(frequencyRisk);
        totalRiskScore += frequencyRisk.score;
        triggeredRules.push({ rule: frequencyRisk.ruleName, score: frequencyRisk.score });
      }

      // 4. 检查交易速度（velocity）
      const velocityRisk = await this.checkTransactionVelocity(transaction);
      if (velocityRisk.triggered) {
        riskFactors.push(velocityRisk);
        totalRiskScore += velocityRisk.score;
        triggeredRules.push({ rule: velocityRisk.ruleName, score: velocityRisk.score });
      }

      // 5. 检查交易模式
      const patternRisk = await this.checkTransactionPattern(transaction);
      if (patternRisk.triggered) {
        riskFactors.push(patternRisk);
        totalRiskScore += patternRisk.score;
        triggeredRules.push({ rule: patternRisk.ruleName, score: patternRisk.score });
      }

      // 6. 检查账户历史风险
      const accountRisk = await this.checkAccountRisk(transaction.from_account_id);
      if (accountRisk.triggered) {
        riskFactors.push(accountRisk);
        totalRiskScore += accountRisk.score;
      }

      // 限制总分不超过100
      totalRiskScore = Math.min(totalRiskScore, 100);

      // 确定风险等级
      const riskLevel = this.determineRiskLevel(totalRiskScore);

      // 保存风险评分
      await this.saveTransactionScore({
        transaction_id: transaction.transaction_id,
        total_risk_score: totalRiskScore,
        risk_level: riskLevel,
        risk_factors: riskFactors,
        triggered_rules: triggeredRules,
        is_flagged: totalRiskScore >= this.riskThresholds.medium,
        is_blocked: totalRiskScore >= this.riskThresholds.critical
      });

      // 记录审计日志
      await this.logAuditEvent({
        event_type: 'transaction_assessed',
        entity_type: 'transaction',
        entity_id: transaction.transaction_id,
        details: {
          risk_score: totalRiskScore,
          risk_level: riskLevel,
          triggered_rules: triggeredRules.length
        }
      });

      return {
        transaction_id: transaction.transaction_id,
        risk_score: totalRiskScore,
        risk_level: riskLevel,
        risk_factors: riskFactors,
        triggered_rules: triggeredRules,
        is_flagged: totalRiskScore >= this.riskThresholds.medium,
        is_blocked: totalRiskScore >= this.riskThresholds.critical,
        recommendation: this.getRecommendation(totalRiskScore)
      };
    } catch (error) {
      logger.error('Error assessing transaction risk:', error);
      throw error;
    }
  }

  /**
   * 检查黑名单
   */
  async checkBlacklist(transaction) {
    try {
      const addresses = [transaction.from_account_id, transaction.to_account_id].filter(Boolean);
      
      const result = await db.query(
        `SELECT * FROM aml_blacklist 
         WHERE address = ANY($1) AND is_active = TRUE`,
        [addresses]
      );

      if (result.rows.length > 0) {
        const blacklistedEntity = result.rows[0];
        return {
          type: 'blacklist',
          triggered: true,
          isBlacklisted: true,
          address: blacklistedEntity.address,
          entity_name: blacklistedEntity.entity_name,
          risk_level: blacklistedEntity.risk_level,
          reason: blacklistedEntity.reason,
          source: blacklistedEntity.source,
          score: 100
        };
      }

      return { type: 'blacklist', triggered: false, isBlacklisted: false };
    } catch (error) {
      logger.error('Error checking blacklist:', error);
      return { type: 'blacklist', triggered: false, error: error.message };
    }
  }

  /**
   * 检查金额阈值
   */
  async checkAmountThreshold(transaction) {
    try {
      const rules = await db.query(
        `SELECT * FROM aml_rules 
         WHERE rule_type = 'amount_threshold' AND is_active = TRUE`
      );

      for (const rule of rules.rows) {
        const threshold = rule.conditions.threshold;
        if (parseFloat(transaction.amount) >= threshold) {
          return {
            type: 'amount_threshold',
            triggered: true,
            ruleName: rule.rule_name,
            amount: transaction.amount,
            threshold: threshold,
            score: rule.risk_score
          };
        }
      }

      return { type: 'amount_threshold', triggered: false };
    } catch (error) {
      logger.error('Error checking amount threshold:', error);
      return { type: 'amount_threshold', triggered: false, error: error.message };
    }
  }

  /**
   * 检查交易频率
   */
  async checkTransactionFrequency(transaction) {
    try {
      if (!transaction.from_account_id) {
        return { type: 'frequency', triggered: false };
      }

      const rules = await db.query(
        `SELECT * FROM aml_rules 
         WHERE rule_type = 'frequency' AND is_active = TRUE`
      );

      for (const rule of rules.rows) {
        const count = rule.conditions.count;
        const period = rule.conditions.period; // e.g., "1 hour"
        
      const result = await db.query(
        `SELECT COUNT(*) as transaction_count
           FROM transactions
           WHERE from_account_id = $1::uuid
             AND created_at >= NOW() - INTERVAL '${period}'`,
        [transaction.from_account_id]
      );

        const transactionCount = parseInt(result.rows[0].transaction_count);
        if (transactionCount >= count) {
          return {
            type: 'frequency',
            triggered: true,
            ruleName: rule.rule_name,
            count: transactionCount,
            threshold: count,
            period: period,
            score: rule.risk_score
          };
        }
      }

      return { type: 'frequency', triggered: false };
    } catch (error) {
      logger.error('Error checking transaction frequency:', error);
      return { type: 'frequency', triggered: false, error: error.message };
    }
  }

  /**
   * 检查交易速度（velocity）
   */
  async checkTransactionVelocity(transaction) {
    try {
      if (!transaction.from_account_id) {
        return { type: 'velocity', triggered: false };
      }

      const rules = await db.query(
        `SELECT * FROM aml_rules 
         WHERE rule_type = 'velocity' AND is_active = TRUE`
      );

      for (const rule of rules.rows) {
        const amount = rule.conditions.amount;
        const period = rule.conditions.period; // e.g., "24 hours"
        
        const result = await db.query(
          `SELECT COALESCE(SUM(amount), 0) as total_volume
           FROM transactions
           WHERE from_account_id = $1::uuid
             AND created_at >= NOW() - INTERVAL '${period}'
             AND status = 'completed'`,
          [transaction.from_account_id]
        );

        const totalVolume = parseFloat(result.rows[0].total_volume);
        if (totalVolume >= amount) {
          return {
            type: 'velocity',
            triggered: true,
            ruleName: rule.rule_name,
            volume: totalVolume,
            threshold: amount,
            period: period,
            score: rule.risk_score
          };
        }
      }

      return { type: 'velocity', triggered: false };
    } catch (error) {
      logger.error('Error checking transaction velocity:', error);
      return { type: 'velocity', triggered: false, error: error.message };
    }
  }

  /**
   * 检查交易模式
   */
  async checkTransactionPattern(transaction) {
    try {
      const amount = parseFloat(transaction.amount);
      
      // 检查整数金额模式
      if (amount >= 1000 && amount % 1000 === 0) {
        return {
          type: 'pattern',
          triggered: true,
          ruleName: 'Round Amount',
          pattern: 'round_amount',
          amount: amount,
          score: 20
        };
      }

      // 检查结构化交易模式（多笔接近阈值的交易）
      if (amount >= 9000 && amount < 10000 && transaction.from_account_id) {
        const result = await db.query(
          `SELECT COUNT(*) as similar_count
           FROM transactions
           WHERE from_account_id = $1::uuid
             AND amount >= 9000 AND amount < 10000
             AND created_at >= NOW() - INTERVAL '7 days'`,
          [transaction.from_account_id]
        );

        const similarCount = parseInt(result.rows[0].similar_count);
        if (similarCount >= 3) {
          return {
            type: 'pattern',
            triggered: true,
            ruleName: 'Structuring Pattern',
            pattern: 'structuring',
            count: similarCount,
            score: 70
          };
        }
      }

      return { type: 'pattern', triggered: false };
    } catch (error) {
      logger.error('Error checking transaction pattern:', error);
      return { type: 'pattern', triggered: false, error: error.message };
    }
  }

  /**
   * 检查账户风险
   */
  async checkAccountRisk(accountId) {
    try {
      if (!accountId) {
        return { type: 'account_risk', triggered: false };
      }

      const result = await db.query(
        `SELECT * FROM aml_account_profiles WHERE account_id = $1`,
        [accountId]
      );

      if (result.rows.length > 0) {
        const profile = result.rows[0];
        if (profile.risk_score >= this.riskThresholds.medium) {
          return {
            type: 'account_risk',
            triggered: true,
            account_id: accountId,
            risk_score: profile.risk_score,
            risk_level: profile.risk_level,
            flagged_transactions: profile.flagged_transactions,
            score: Math.min(profile.risk_score / 2, 30) // 账户风险贡献最多30分
          };
        }
      }

      return { type: 'account_risk', triggered: false };
    } catch (error) {
      logger.error('Error checking account risk:', error);
      return { type: 'account_risk', triggered: false, error: error.message };
    }
  }

  /**
   * 确定风险等级
   */
  determineRiskLevel(score) {
    if (score >= this.riskThresholds.critical) return 'critical';
    if (score >= this.riskThresholds.high) return 'high';
    if (score >= this.riskThresholds.medium) return 'medium';
    return 'low';
  }

  /**
   * 获取建议
   */
  getRecommendation(score) {
    if (score >= this.riskThresholds.critical) {
      return 'BLOCK_TRANSACTION - Critical risk detected. Transaction should be blocked and investigated immediately.';
    }
    if (score >= this.riskThresholds.high) {
      return 'MANUAL_REVIEW - High risk detected. Transaction requires manual review before processing.';
    }
    if (score >= this.riskThresholds.medium) {
      return 'ENHANCED_MONITORING - Medium risk detected. Transaction should be monitored closely.';
    }
    return 'PROCEED - Low risk. Transaction can proceed normally.';
  }

  /**
   * 保存交易风险评分
   */
  async saveTransactionScore(scoreData) {
    try {
      await db.query(
        `INSERT INTO aml_transaction_scores 
         (transaction_id, total_risk_score, risk_level, risk_factors, triggered_rules, is_flagged, is_blocked)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (transaction_id) 
         DO UPDATE SET 
           total_risk_score = $2,
           risk_level = $3,
           risk_factors = $4,
           triggered_rules = $5,
           is_flagged = $6,
           is_blocked = $7,
           updated_at = CURRENT_TIMESTAMP`,
        [
          scoreData.transaction_id,
          scoreData.total_risk_score,
          scoreData.risk_level,
          JSON.stringify(scoreData.risk_factors),
          JSON.stringify(scoreData.triggered_rules),
          scoreData.is_flagged,
          scoreData.is_blocked
        ]
      );

      logger.info(`Transaction risk score saved: ${scoreData.transaction_id} - ${scoreData.risk_level}`);
    } catch (error) {
      logger.error('Error saving transaction score:', error);
      throw error;
    }
  }

  /**
   * 记录审计日志
   */
  async logAuditEvent(eventData) {
    try {
      await db.query(
        `INSERT INTO aml_audit_logs 
         (log_id, event_type, entity_type, entity_id, details)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          uuidv4(),
          eventData.event_type,
          eventData.entity_type,
          eventData.entity_id,
          JSON.stringify(eventData.details)
        ]
      );
    } catch (error) {
      logger.error('Error logging audit event:', error);
      // 不抛出错误，审计日志失败不应影响主流程
    }
  }

  /**
   * 更新账户风险档案
   */
  async updateAccountProfile(accountId) {
    try {
      // 获取账户交易统计
      const stats = await db.query(
        `SELECT 
           COUNT(*) as total_transactions,
           COALESCE(SUM(amount), 0) as total_volume,
           MAX(created_at) as last_transaction_at
         FROM transactions
         WHERE from_account_id = $1::uuid OR to_account_id = $1::uuid`,
        [accountId]
      );

      // 获取标记交易数
      const flaggedStats = await db.query(
        `SELECT COUNT(*) as flagged_count
         FROM aml_transaction_scores ats
         JOIN transactions t ON ats.transaction_id::uuid = t.transaction_id
         WHERE (t.from_account_id = $1::uuid OR t.to_account_id = $1::uuid)
           AND ats.is_flagged = TRUE`,
        [accountId]
      );

      const totalTx = parseInt(stats.rows[0].total_transactions);
      const flaggedTx = parseInt(flaggedStats.rows[0].flagged_count);
      const flaggedRatio = totalTx > 0 ? (flaggedTx / totalTx) * 100 : 0;

      // 计算账户风险分数
      let accountRiskScore = 0;
      if (flaggedRatio > 50) accountRiskScore = 80;
      else if (flaggedRatio > 30) accountRiskScore = 60;
      else if (flaggedRatio > 10) accountRiskScore = 40;
      else if (flaggedRatio > 5) accountRiskScore = 20;

      const riskLevel = this.determineRiskLevel(accountRiskScore);

      // 更新或创建账户档案
      await db.query(
        `INSERT INTO aml_account_profiles 
         (account_id, risk_score, risk_level, total_transactions, total_volume, 
          flagged_transactions, last_transaction_at, last_risk_assessment_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
         ON CONFLICT (account_id)
         DO UPDATE SET
           risk_score = $2,
           risk_level = $3,
           total_transactions = $4,
           total_volume = $5,
           flagged_transactions = $6,
           last_transaction_at = $7,
           last_risk_assessment_at = CURRENT_TIMESTAMP`,
        [
          accountId,
          accountRiskScore,
          riskLevel,
          totalTx,
          stats.rows[0].total_volume,
          flaggedTx,
          stats.rows[0].last_transaction_at
        ]
      );

      logger.info(`Account profile updated: ${accountId} - ${riskLevel}`);
    } catch (error) {
      logger.error('Error updating account profile:', error);
      throw error;
    }
  }

  /**
   * 添加到黑名单
   */
  async addToBlacklist(data) {
    try {
      await db.query(
        `INSERT INTO aml_blacklist 
         (address, entity_name, risk_level, reason, source, added_by)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          data.address,
          data.entity_name,
          data.risk_level,
          data.reason,
          data.source,
          data.added_by
        ]
      );

      await this.logAuditEvent({
        event_type: 'blacklist_added',
        entity_type: 'address',
        entity_id: data.address,
        details: { risk_level: data.risk_level, reason: data.reason }
      });

      logger.info(`Address added to blacklist: ${data.address}`);
    } catch (error) {
      logger.error('Error adding to blacklist:', error);
      throw error;
    }
  }

  /**
   * 从黑名单移除
   */
  async removeFromBlacklist(address) {
    try {
      await db.query(
        `UPDATE aml_blacklist SET is_active = FALSE WHERE address = $1`,
        [address]
      );

      await this.logAuditEvent({
        event_type: 'blacklist_removed',
        entity_type: 'address',
        entity_id: address,
        details: {}
      });

      logger.info(`Address removed from blacklist: ${address}`);
    } catch (error) {
      logger.error('Error removing from blacklist:', error);
      throw error;
    }
  }

  /**
   * 创建可疑交易报告
   */
  async createSuspiciousReport(data) {
    try {
      const reportId = uuidv4();
      
      await db.query(
        `INSERT INTO aml_suspicious_reports 
         (report_id, transaction_id, account_id, report_type, risk_score, 
          description, evidence, status, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          reportId,
          data.transaction_id,
          data.account_id,
          data.report_type || 'STR',
          data.risk_score,
          data.description,
          JSON.stringify(data.evidence),
          'pending',
          data.created_by
        ]
      );

      await this.logAuditEvent({
        event_type: 'suspicious_report_created',
        entity_type: 'report',
        entity_id: reportId,
        details: { transaction_id: data.transaction_id, risk_score: data.risk_score }
      });

      logger.info(`Suspicious report created: ${reportId}`);
      return reportId;
    } catch (error) {
      logger.error('Error creating suspicious report:', error);
      throw error;
    }
  }

  /**
   * 获取风险统计
   */
  async getRiskStatistics(startDate, endDate) {
    try {
      const stats = await db.query(
        `SELECT 
           COUNT(*) as total_assessed,
           SUM(CASE WHEN risk_level = 'low' THEN 1 ELSE 0 END) as low_risk,
           SUM(CASE WHEN risk_level = 'medium' THEN 1 ELSE 0 END) as medium_risk,
           SUM(CASE WHEN risk_level = 'high' THEN 1 ELSE 0 END) as high_risk,
           SUM(CASE WHEN risk_level = 'critical' THEN 1 ELSE 0 END) as critical_risk,
           SUM(CASE WHEN is_flagged = TRUE THEN 1 ELSE 0 END) as flagged_count,
           SUM(CASE WHEN is_blocked = TRUE THEN 1 ELSE 0 END) as blocked_count,
           AVG(total_risk_score) as avg_risk_score
         FROM aml_transaction_scores
         WHERE created_at >= $1 AND created_at <= $2`,
        [startDate, endDate]
      );

      return stats.rows[0];
    } catch (error) {
      logger.error('Error getting risk statistics:', error);
      throw error;
    }
  }
}

module.exports = new AMLService();
