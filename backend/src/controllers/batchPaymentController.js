const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { paymentQueue } = require('../config/queue');

/**
 * 创建批量支付任务
 */
exports.createBatchPayment = async (req, res) => {
  try {
    const { from_account_id, recipients, payment_method = 'batch_transfer' } = req.body;

    // 验证输入
    if (!from_account_id || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid input: from_account_id and recipients array are required',
      });
    }

    // 验证发送方账户
    const senderResult = await pool.query(
      'SELECT account_id, username, balance, currency FROM accounts WHERE account_id = $1',
      [from_account_id]
    );

    if (senderResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Sender account not found',
      });
    }

    const sender = senderResult.rows[0];

    // 计算总金额
    const totalAmount = recipients.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);

    // 检查余额
    if (parseFloat(sender.balance) < totalAmount) {
      return res.status(400).json({
        status: 'error',
        message: 'Insufficient balance',
        required: totalAmount,
        available: parseFloat(sender.balance),
      });
    }

    // 创建批量支付记录
    const batchId = uuidv4();
    const batchResult = await pool.query(
      `INSERT INTO batch_payments (batch_id, from_account_id, total_amount, total_recipients, status, created_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       RETURNING *`,
      [batchId, from_account_id, totalAmount, recipients.length, 'pending']
    );

    // 将每个支付添加到队列
    const jobs = [];
    for (const recipient of recipients) {
      const job = await paymentQueue.add('process-payment', {
        batchId,
        from_account_id,
        to_account_id: recipient.to_account_id,
        to_address: recipient.to_address,
        amount: recipient.amount,
        note: recipient.note,
        category: recipient.category,
        payment_method,
      });
      jobs.push({
        jobId: job.id,
        recipient: recipient.to_account_id || recipient.to_address,
        amount: recipient.amount,
      });
    }

    res.status(202).json({
      status: 'success',
      message: 'Batch payment created and queued for processing',
      data: {
        batch_id: batchId,
        total_amount: totalAmount,
        total_recipients: recipients.length,
        jobs: jobs,
        status: 'pending',
      },
    });
  } catch (error) {
    console.error('Error creating batch payment:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * 获取批量支付状态
 */
exports.getBatchPaymentStatus = async (req, res) => {
  try {
    const { batch_id } = req.params;

    // 获取批量支付记录
    const batchResult = await pool.query(
      'SELECT * FROM batch_payments WHERE batch_id = $1',
      [batch_id]
    );

    if (batchResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Batch payment not found',
      });
    }

    const batch = batchResult.rows[0];

    // 获取所有相关交易
    const transactionsResult = await pool.query(
      'SELECT * FROM transactions WHERE batch_id = $1 ORDER BY created_at DESC',
      [batch_id]
    );

    // 统计状态
    const transactions = transactionsResult.rows;
    const statusCounts = transactions.reduce((acc, tx) => {
      acc[tx.status] = (acc[tx.status] || 0) + 1;
      return acc;
    }, {});

    res.json({
      status: 'success',
      data: {
        batch_id: batch.batch_id,
        from_account_id: batch.from_account_id,
        total_amount: parseFloat(batch.total_amount),
        total_recipients: batch.total_recipients,
        completed_count: statusCounts.completed || 0,
        pending_count: statusCounts.pending || 0,
        failed_count: statusCounts.failed || 0,
        batch_status: batch.status,
        transactions: transactions.map(tx => ({
          transaction_id: tx.transaction_id,
          to_account_id: tx.to_account_id,
          amount: parseFloat(tx.amount),
          status: tx.status,
          created_at: tx.created_at,
        })),
        created_at: batch.created_at,
        updated_at: batch.updated_at,
      },
    });
  } catch (error) {
    console.error('Error getting batch payment status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * 获取账户的批量支付历史
 */
exports.getBatchPaymentHistory = async (req, res) => {
  try {
    const { account_id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT * FROM batch_payments 
       WHERE from_account_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [account_id, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM batch_payments WHERE from_account_id = $1',
      [account_id]
    );

    res.json({
      status: 'success',
      data: {
        batch_payments: result.rows.map(bp => ({
          batch_id: bp.batch_id,
          total_amount: parseFloat(bp.total_amount),
          total_recipients: bp.total_recipients,
          status: bp.status,
          created_at: bp.created_at,
        })),
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('Error getting batch payment history:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message,
    });
  }
};
