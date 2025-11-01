const { pool } = require('../config/database');
const { paymentQueue } = require('../config/queue');
const { v4: uuidv4 } = require('uuid');

/**
 * 处理单个支付任务
 */
async function processPayment(job) {
  const {
    batchId,
    from_account_id,
    to_account_id,
    to_address,
    amount,
    note,
    category,
    payment_method,
  } = job.data;

  console.log(`Processing payment job ${job.id}:`, {
    from: from_account_id,
    to: to_account_id || to_address,
    amount,
  });

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 如果是地址而不是账户ID，先查找或创建账户
    let recipientAccountId = to_account_id;
    if (!recipientAccountId && to_address) {
      const recipientResult = await client.query(
        'SELECT account_id FROM accounts WHERE wallet_address = $1',
        [to_address]
      );

      if (recipientResult.rows.length > 0) {
        recipientAccountId = recipientResult.rows[0].account_id;
      } else {
        // 创建临时账户
        const newAccountId = uuidv4();
        await client.query(
          `INSERT INTO accounts (account_id, username, email, password_hash, wallet_address, balance, currency)
           VALUES ($1, $2, $3, $4, $5, 0, 'USD')`,
          [newAccountId, `user_${to_address.slice(0, 8)}`, `${to_address}@temp.com`, 'temp', to_address]
        );
        recipientAccountId = newAccountId;
      }
    }

    // 获取发送方和接收方账户
    const senderResult = await client.query(
      'SELECT account_id, balance, currency FROM accounts WHERE account_id = $1 FOR UPDATE',
      [from_account_id]
    );

    const recipientResult = await client.query(
      'SELECT account_id, balance, currency FROM accounts WHERE account_id = $1 FOR UPDATE',
      [recipientAccountId]
    );

    if (senderResult.rows.length === 0) {
      throw new Error('Sender account not found');
    }

    if (recipientResult.rows.length === 0) {
      throw new Error('Recipient account not found');
    }

    const sender = senderResult.rows[0];
    const recipient = recipientResult.rows[0];

    // 检查余额
    if (parseFloat(sender.balance) < parseFloat(amount)) {
      throw new Error('Insufficient balance');
    }

    // 更新余额
    await client.query(
      'UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE account_id = $2',
      [amount, from_account_id]
    );

    await client.query(
      'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE account_id = $2',
      [amount, recipientAccountId]
    );

    // 创建交易记录
    const transactionId = uuidv4();
    await client.query(
      `INSERT INTO transactions (transaction_id, from_account_id, to_account_id, amount, currency, payment_method, status, batch_id, note, category, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'completed', $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [transactionId, from_account_id, recipientAccountId, amount, sender.currency, payment_method, batchId, note, category]
    );

    await client.query('COMMIT');

    // 更新批量支付状态
    if (batchId) {
      await updateBatchPaymentStatus(batchId);
    }

    return {
      success: true,
      transaction_id: transactionId,
      from_account_id,
      to_account_id: recipientAccountId,
      amount: parseFloat(amount),
      status: 'completed',
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Payment processing error:', error);

    // 记录失败的交易
    if (batchId) {
      const transactionId = uuidv4();
      await pool.query(
        `INSERT INTO transactions (transaction_id, from_account_id, to_account_id, amount, currency, payment_method, status, batch_id, note, category, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'USD', $5, 'failed', $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [transactionId, from_account_id, to_account_id || null, amount, payment_method, batchId, note, category]
      );

      await updateBatchPaymentStatus(batchId);
    }

    throw error;
  } finally {
    client.release();
  }
}

/**
 * 更新批量支付状态
 */
async function updateBatchPaymentStatus(batchId) {
  try {
    // 统计交易状态
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
       FROM transactions 
       WHERE batch_id = $1`,
      [batchId]
    );

    const stats = result.rows[0];
    const total = parseInt(stats.total);
    const completed = parseInt(stats.completed);
    const failed = parseInt(stats.failed);

    let batchStatus = 'processing';
    if (completed === total) {
      batchStatus = 'completed';
    } else if (failed === total) {
      batchStatus = 'failed';
    } else if (completed + failed === total) {
      batchStatus = 'partially_completed';
    }

    await pool.query(
      'UPDATE batch_payments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE batch_id = $2',
      [batchStatus, batchId]
    );
  } catch (error) {
    console.error('Error updating batch payment status:', error);
  }
}

// 注册队列处理器
paymentQueue.process('process-payment', 5, processPayment); // 并发处理5个任务

console.log('✅ Payment worker started');

module.exports = {
  processPayment,
};
