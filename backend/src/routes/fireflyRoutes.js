const express = require('express');
const router = express.Router();
const fireflyController = require('../controllers/fireflyController');

/**
 * @route GET /api/v1/firefly/status
 * @desc 检查Firefly III连接状态
 */
router.get('/status', fireflyController.checkConnection);

/**
 * @route POST /api/v1/firefly/sync/account/:account_id
 * @desc 同步单个账户到Firefly III
 */
router.post('/sync/account/:account_id', fireflyController.syncAccount);

/**
 * @route POST /api/v1/firefly/sync/accounts
 * @desc 同步所有账户到Firefly III
 */
router.post('/sync/accounts', fireflyController.syncAllAccounts);

/**
 * @route POST /api/v1/firefly/sync/transaction/:transaction_id
 * @desc 同步单个交易到Firefly III
 */
router.post('/sync/transaction/:transaction_id', fireflyController.syncTransaction);

/**
 * @route POST /api/v1/firefly/sync/account/:account_id/transactions
 * @desc 同步账户的所有交易到Firefly III
 */
router.post('/sync/account/:account_id/transactions', fireflyController.syncAccountTransactions);

/**
 * @route GET /api/v1/firefly/insights/:account_id
 * @desc 获取账户的财务分析数据
 * @query start_date - 开始日期 (YYYY-MM-DD)
 * @query end_date - 结束日期 (YYYY-MM-DD)
 */
router.get('/insights/:account_id', fireflyController.getFinancialInsights);

/**
 * @route GET /api/v1/firefly/budgets
 * @desc 获取预算信息
 * @query start_date - 开始日期 (YYYY-MM-DD)
 * @query end_date - 结束日期 (YYYY-MM-DD)
 */
router.get('/budgets', fireflyController.getBudgetInfo);

/**
 * @route GET /api/v1/firefly/categories
 * @desc 获取分类统计
 * @query start_date - 开始日期 (YYYY-MM-DD)
 * @query end_date - 结束日期 (YYYY-MM-DD)
 */
router.get('/categories', fireflyController.getCategoryStatistics);

/**
 * @route GET /api/v1/firefly/dashboard/:account_id
 * @desc 获取财务仪表板数据（综合视图）
 * @query start_date - 开始日期 (YYYY-MM-DD)
 * @query end_date - 结束日期 (YYYY-MM-DD)
 */
router.get('/dashboard/:account_id', fireflyController.getFinancialDashboard);

module.exports = router;
