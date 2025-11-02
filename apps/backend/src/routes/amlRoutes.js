const express = require('express');
const router = express.Router();
const amlController = require('../controllers/amlController');

/**
 * @route POST /api/v1/aml/assess/:transaction_id
 * @desc 评估交易风险
 */
router.post('/assess/:transaction_id', amlController.assessTransaction);

/**
 * @route GET /api/v1/aml/score/:transaction_id
 * @desc 获取交易风险评分
 */
router.get('/score/:transaction_id', amlController.getTransactionScore);

/**
 * @route GET /api/v1/aml/high-risk-transactions
 * @desc 获取高风险交易列表
 * @query risk_level - 风险等级 (low, medium, high, critical)
 * @query limit - 每页数量
 * @query offset - 偏移量
 */
router.get('/high-risk-transactions', amlController.getHighRiskTransactions);

/**
 * @route GET /api/v1/aml/account/:account_id/profile
 * @desc 获取账户风险档案
 */
router.get('/account/:account_id/profile', amlController.getAccountProfile);

/**
 * @route POST /api/v1/aml/account/:account_id/profile
 * @desc 更新账户风险档案
 */
router.post('/account/:account_id/profile', amlController.updateAccountProfile);

/**
 * @route POST /api/v1/aml/blacklist
 * @desc 添加到黑名单
 * @body address - 地址
 * @body entity_name - 实体名称
 * @body risk_level - 风险等级
 * @body reason - 原因
 * @body source - 来源
 */
router.post('/blacklist', amlController.addToBlacklist);

/**
 * @route DELETE /api/v1/aml/blacklist/:address
 * @desc 从黑名单移除
 */
router.delete('/blacklist/:address', amlController.removeFromBlacklist);

/**
 * @route GET /api/v1/aml/blacklist
 * @desc 获取黑名单
 * @query risk_level - 风险等级
 * @query is_active - 是否激活
 * @query limit - 每页数量
 * @query offset - 偏移量
 */
router.get('/blacklist', amlController.getBlacklist);

/**
 * @route POST /api/v1/aml/suspicious-report
 * @desc 创建可疑交易报告
 * @body transaction_id - 交易ID
 * @body account_id - 账户ID
 * @body report_type - 报告类型 (STR, SAR, CTR)
 * @body risk_score - 风险分数
 * @body description - 描述
 * @body evidence - 证据
 */
router.post('/suspicious-report', amlController.createSuspiciousReport);

/**
 * @route GET /api/v1/aml/suspicious-reports
 * @desc 获取可疑交易报告列表
 * @query status - 状态 (pending, under_review, filed, dismissed, escalated)
 * @query limit - 每页数量
 * @query offset - 偏移量
 */
router.get('/suspicious-reports', amlController.getSuspiciousReports);

/**
 * @route GET /api/v1/aml/rules
 * @desc 获取AML规则列表
 * @query rule_type - 规则类型
 * @query is_active - 是否激活
 */
router.get('/rules', amlController.getRules);

/**
 * @route GET /api/v1/aml/statistics
 * @desc 获取风险统计
 * @query start_date - 开始日期 (YYYY-MM-DD)
 * @query end_date - 结束日期 (YYYY-MM-DD)
 */
router.get('/statistics', amlController.getRiskStatistics);

/**
 * @route GET /api/v1/aml/audit-logs
 * @desc 获取审计日志
 * @query event_type - 事件类型
 * @query entity_type - 实体类型
 * @query limit - 每页数量
 * @query offset - 偏移量
 */
router.get('/audit-logs', amlController.getAuditLogs);

module.exports = router;
