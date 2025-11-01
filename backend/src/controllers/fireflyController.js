const fireflyService = require('../services/fireflyService');
const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * Firefly III 控制器
 * 处理财务分析相关的API请求
 */

/**
 * 检查Firefly III连接状态
 */
exports.checkConnection = async (req, res) => {
  try {
    const status = await fireflyService.checkConnection();
    
    res.json({
      status: 'success',
      data: status
    });
  } catch (error) {
    logger.error('Error checking Firefly III connection:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to check Firefly III connection',
      error: error.message
    });
  }
};

/**
 * 同步单个账户到Firefly III
 */
exports.syncAccount = async (req, res) => {
  try {
    const { account_id } = req.params;

    // 从数据库获取账户信息
    const result = await db.query(
      'SELECT * FROM accounts WHERE account_id = $1',
      [account_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Account not found'
      });
    }

    const account = result.rows[0];
    const fireflyAccount = await fireflyService.syncAccount(account);

    res.json({
      status: 'success',
      message: 'Account synced to Firefly III',
      data: {
        account_id: account.account_id,
        firefly_account_id: fireflyAccount?.id,
        synced_at: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error syncing account to Firefly III:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to sync account',
      error: error.message
    });
  }
};

/**
 * 同步所有账户到Firefly III
 */
exports.syncAllAccounts = async (req, res) => {
  try {
    // 获取所有账户
    const result = await db.query('SELECT * FROM accounts');
    const accounts = result.rows;

    const syncResults = {
      total: accounts.length,
      synced: 0,
      failed: 0,
      errors: []
    };

    for (const account of accounts) {
      try {
        await fireflyService.syncAccount(account);
        syncResults.synced++;
      } catch (error) {
        syncResults.failed++;
        syncResults.errors.push({
          account_id: account.account_id,
          error: error.message
        });
      }
    }

    res.json({
      status: 'success',
      message: 'Accounts sync completed',
      data: syncResults
    });
  } catch (error) {
    logger.error('Error syncing all accounts:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to sync accounts',
      error: error.message
    });
  }
};

/**
 * 同步单个交易到Firefly III
 */
exports.syncTransaction = async (req, res) => {
  try {
    const { transaction_id } = req.params;

    // 从数据库获取交易信息
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
    const fireflyTransaction = await fireflyService.syncTransaction(transaction);

    res.json({
      status: 'success',
      message: 'Transaction synced to Firefly III',
      data: {
        transaction_id: transaction.transaction_id,
        firefly_transaction_id: fireflyTransaction?.id,
        synced_at: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error syncing transaction to Firefly III:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to sync transaction',
      error: error.message
    });
  }
};

/**
 * 同步账户的所有交易到Firefly III
 */
exports.syncAccountTransactions = async (req, res) => {
  try {
    const { account_id } = req.params;

    // 获取账户的所有交易
    const result = await db.query(
      `SELECT * FROM transactions 
       WHERE from_account_id = $1 OR to_account_id = $1
       ORDER BY created_at DESC`,
      [account_id]
    );

    const transactions = result.rows;
    const syncResults = await fireflyService.syncBatchTransactions(transactions);

    res.json({
      status: 'success',
      message: 'Transactions sync completed',
      data: {
        account_id,
        total: transactions.length,
        ...syncResults
      }
    });
  } catch (error) {
    logger.error('Error syncing account transactions:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to sync transactions',
      error: error.message
    });
  }
};

/**
 * 获取财务分析数据
 */
exports.getFinancialInsights = async (req, res) => {
  try {
    const { account_id } = req.params;
    const { start_date, end_date } = req.query;

    // 设置默认日期范围（最近30天）
    const endDate = end_date || new Date().toISOString().split('T')[0];
    const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const insights = await fireflyService.getFinancialInsights(account_id, startDate, endDate);

    res.json({
      status: 'success',
      data: insights
    });
  } catch (error) {
    logger.error('Error getting financial insights:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get financial insights',
      error: error.message
    });
  }
};

/**
 * 获取预算信息
 */
exports.getBudgetInfo = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    // 设置默认日期范围（当前月份）
    const now = new Date();
    const endDate = end_date || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    const startDate = start_date || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

    const budgets = await fireflyService.getBudgetInfo(startDate, endDate);

    res.json({
      status: 'success',
      data: {
        budgets,
        period: { start: startDate, end: endDate }
      }
    });
  } catch (error) {
    logger.error('Error getting budget info:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get budget info',
      error: error.message
    });
  }
};

/**
 * 获取分类统计
 */
exports.getCategoryStatistics = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    // 设置默认日期范围（最近30天）
    const endDate = end_date || new Date().toISOString().split('T')[0];
    const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const categories = await fireflyService.getCategoryStatistics(startDate, endDate);

    res.json({
      status: 'success',
      data: {
        categories,
        period: { start: startDate, end: endDate }
      }
    });
  } catch (error) {
    logger.error('Error getting category statistics:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get category statistics',
      error: error.message
    });
  }
};

/**
 * 获取财务仪表板数据
 */
exports.getFinancialDashboard = async (req, res) => {
  try {
    const { account_id } = req.params;
    const { start_date, end_date } = req.query;

    // 设置默认日期范围（最近30天）
    const endDate = end_date || new Date().toISOString().split('T')[0];
    const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // 并行获取多个数据源
    const [insights, budgets, categories] = await Promise.all([
      fireflyService.getFinancialInsights(account_id, startDate, endDate),
      fireflyService.getBudgetInfo(startDate, endDate),
      fireflyService.getCategoryStatistics(startDate, endDate)
    ]);

    // 从数据库获取本地统计数据
    const transactionStats = await db.query(
      `SELECT 
        COUNT(*) as total_transactions,
        SUM(CASE WHEN from_account_id = $1 THEN amount ELSE 0 END) as total_sent,
        SUM(CASE WHEN to_account_id = $1 THEN amount ELSE 0 END) as total_received
       FROM transactions
       WHERE (from_account_id = $1 OR to_account_id = $1)
         AND created_at >= $2 AND created_at <= $3
         AND status = 'completed'`,
      [account_id, startDate, endDate]
    );

    res.json({
      status: 'success',
      data: {
        period: { start: startDate, end: endDate },
        firefly_insights: insights,
        budgets: budgets,
        categories: categories,
        local_stats: transactionStats.rows[0]
      }
    });
  } catch (error) {
    logger.error('Error getting financial dashboard:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get financial dashboard',
      error: error.message
    });
  }
};
