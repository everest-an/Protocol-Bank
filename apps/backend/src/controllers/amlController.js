const amlService = require('../services/amlService');
const { pool: db } = require('../config/database');
const logger = require('../utils/logger');

/**
 * AML控制器
 * 处理反洗钱相关的API请求
 */

/**
 * 评估交易风险
 */
exports.assessTransaction = async (req, res) => {
  try {
    const { transaction_id } = req.params;

    // 从数据库获取交易
    const result = await db.query(
      'SELECT * FROM transactions WHERE transaction_id = $1',
      [transaction_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Transaction not found'
      });
    }

    const transaction = result.rows[0];
    const assessment = await amlService.assessTransactionRisk(transaction);

    // 更新账户风险档案
    if (transaction.from_account_id) {
      await amlService.updateAccountProfile(transaction.from_account_id);
    }
    if (transaction.to_account_id) {
      await amlService.updateAccountProfile(transaction.to_account_id);
    }

    res.json({
      status: 'success',
      data: assessment
    });
  } catch (error) {
    logger.error('Error assessing transaction:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to assess transaction',
      error: error.message
    });
  }
};

/**
 * 获取交易风险评分
 */
exports.getTransactionScore = async (req, res) => {
  try {
    const { transaction_id } = req.params;

    const result = await db.query(
      'SELECT * FROM aml_transaction_scores WHERE transaction_id = $1',
      [transaction_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Risk score not found for this transaction'
      });
    }

    res.json({
      status: 'success',
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error getting transaction score:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get transaction score',
      error: error.message
    });
  }
};

/**
 * 获取高风险交易列表
 */
exports.getHighRiskTransactions = async (req, res) => {
  try {
    const { risk_level, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT ats.*, t.from_account_id, t.to_account_id, t.amount, t.currency, t.created_at as transaction_date
      FROM aml_transaction_scores ats
      JOIN transactions t ON ats.transaction_id::uuid = t.transaction_id
      WHERE 1=1
    `;
    const params = [];

    if (risk_level) {
      params.push(risk_level);
      query += ` AND ats.risk_level = $${params.length}`;
    } else {
      query += ` AND ats.risk_level IN ('high', 'critical')`;
    }

    query += ` ORDER BY ats.total_risk_score DESC, ats.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);

    res.json({
      status: 'success',
      data: {
        transactions: result.rows,
        count: result.rows.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    logger.error('Error getting high risk transactions:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get high risk transactions',
      error: error.message
    });
  }
};

/**
 * 获取账户风险档案
 */
exports.getAccountProfile = async (req, res) => {
  try {
    const { account_id } = req.params;

    const result = await db.query(
      'SELECT * FROM aml_account_profiles WHERE account_id = $1',
      [account_id]
    );

    if (result.rows.length === 0) {
      // 如果不存在，创建新档案
      await amlService.updateAccountProfile(account_id);
      const newResult = await db.query(
        'SELECT * FROM aml_account_profiles WHERE account_id = $1',
        [account_id]
      );
      
      return res.json({
        status: 'success',
        data: newResult.rows[0]
      });
    }

    res.json({
      status: 'success',
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error getting account profile:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get account profile',
      error: error.message
    });
  }
};

/**
 * 更新账户风险档案
 */
exports.updateAccountProfile = async (req, res) => {
  try {
    const { account_id } = req.params;

    await amlService.updateAccountProfile(account_id);

    const result = await db.query(
      'SELECT * FROM aml_account_profiles WHERE account_id = $1',
      [account_id]
    );

    res.json({
      status: 'success',
      message: 'Account profile updated',
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error updating account profile:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update account profile',
      error: error.message
    });
  }
};

/**
 * 添加到黑名单
 */
exports.addToBlacklist = async (req, res) => {
  try {
    const { address, entity_name, risk_level, reason, source } = req.body;

    if (!address || !risk_level || !reason) {
      return res.status(400).json({
        status: 'error',
        message: 'Address, risk_level, and reason are required'
      });
    }

    await amlService.addToBlacklist({
      address,
      entity_name,
      risk_level,
      reason,
      source,
      added_by: req.user?.username || 'system'
    });

    res.json({
      status: 'success',
      message: 'Address added to blacklist',
      data: { address, risk_level }
    });
  } catch (error) {
    logger.error('Error adding to blacklist:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to add to blacklist',
      error: error.message
    });
  }
};

/**
 * 从黑名单移除
 */
exports.removeFromBlacklist = async (req, res) => {
  try {
    const { address } = req.params;

    await amlService.removeFromBlacklist(address);

    res.json({
      status: 'success',
      message: 'Address removed from blacklist',
      data: { address }
    });
  } catch (error) {
    logger.error('Error removing from blacklist:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to remove from blacklist',
      error: error.message
    });
  }
};

/**
 * 获取黑名单
 */
exports.getBlacklist = async (req, res) => {
  try {
    const { risk_level, is_active = true, limit = 100, offset = 0 } = req.query;

    let query = 'SELECT * FROM aml_blacklist WHERE 1=1';
    const params = [];

    if (is_active !== undefined) {
      params.push(is_active === 'true');
      query += ` AND is_active = $${params.length}`;
    }

    if (risk_level) {
      params.push(risk_level);
      query += ` AND risk_level = $${params.length}`;
    }

    query += ` ORDER BY added_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);

    res.json({
      status: 'success',
      data: {
        blacklist: result.rows,
        count: result.rows.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    logger.error('Error getting blacklist:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get blacklist',
      error: error.message
    });
  }
};

/**
 * 创建可疑交易报告
 */
exports.createSuspiciousReport = async (req, res) => {
  try {
    const { transaction_id, account_id, report_type, risk_score, description, evidence } = req.body;

    if (!transaction_id || !account_id || !description) {
      return res.status(400).json({
        status: 'error',
        message: 'Transaction ID, account ID, and description are required'
      });
    }

    const reportId = await amlService.createSuspiciousReport({
      transaction_id,
      account_id,
      report_type,
      risk_score,
      description,
      evidence,
      created_by: req.user?.username || 'system'
    });

    res.json({
      status: 'success',
      message: 'Suspicious report created',
      data: { report_id: reportId }
    });
  } catch (error) {
    logger.error('Error creating suspicious report:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create suspicious report',
      error: error.message
    });
  }
};

/**
 * 获取可疑交易报告列表
 */
exports.getSuspiciousReports = async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT * FROM aml_suspicious_reports WHERE 1=1';
    const params = [];

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);

    res.json({
      status: 'success',
      data: {
        reports: result.rows,
        count: result.rows.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    logger.error('Error getting suspicious reports:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get suspicious reports',
      error: error.message
    });
  }
};

/**
 * 获取AML规则列表
 */
exports.getRules = async (req, res) => {
  try {
    const { rule_type, is_active } = req.query;

    let query = 'SELECT * FROM aml_rules WHERE 1=1';
    const params = [];

    if (rule_type) {
      params.push(rule_type);
      query += ` AND rule_type = $${params.length}`;
    }

    if (is_active !== undefined) {
      params.push(is_active === 'true');
      query += ` AND is_active = $${params.length}`;
    }

    query += ' ORDER BY risk_score DESC, rule_name ASC';

    const result = await db.query(query, params);

    res.json({
      status: 'success',
      data: {
        rules: result.rows,
        count: result.rows.length
      }
    });
  } catch (error) {
    logger.error('Error getting rules:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get rules',
      error: error.message
    });
  }
};

/**
 * 获取风险统计
 */
exports.getRiskStatistics = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const endDate = end_date || new Date().toISOString();
    const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const stats = await amlService.getRiskStatistics(startDate, endDate);

    res.json({
      status: 'success',
      data: {
        period: { start: startDate, end: endDate },
        statistics: stats
      }
    });
  } catch (error) {
    logger.error('Error getting risk statistics:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get risk statistics',
      error: error.message
    });
  }
};

/**
 * 获取审计日志
 */
exports.getAuditLogs = async (req, res) => {
  try {
    const { event_type, entity_type, limit = 100, offset = 0 } = req.query;

    let query = 'SELECT * FROM aml_audit_logs WHERE 1=1';
    const params = [];

    if (event_type) {
      params.push(event_type);
      query += ` AND event_type = $${params.length}`;
    }

    if (entity_type) {
      params.push(entity_type);
      query += ` AND entity_type = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);

    res.json({
      status: 'success',
      data: {
        logs: result.rows,
        count: result.rows.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    logger.error('Error getting audit logs:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get audit logs',
      error: error.message
    });
  }
};

module.exports = exports;
