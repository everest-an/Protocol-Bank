const { pool } = require('../config/database');
const { scheduledPaymentQueue } = require('../config/queue');
const { v4: uuidv4 } = require('uuid');

/**
 * 执行定时支付
 */
async function executeScheduledPayment(job) {
  const {
    schedule_id,
    from_account_id,
    to_account_id,
    amount,
    currency,
    payment_method,
  } = job.data;

  console.log(`Executing scheduled payment ${schedule_id}:`, {
    from: from_account_id,
    to: to_account_id,
    amount,
  });

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 获取定时支付记录
    const scheduleResult = await client.query(
      'SELECT * FROM scheduled_payments WHERE schedule_id = $1',
      [schedule_id]
    );

    if (scheduleResult.rows.length === 0) {
      throw new Error('Scheduled payment not found');
    }

    const schedule = scheduleResult.rows[0];

    // 检查状态
    if (schedule.status !== 'active') {
      console.log(`Scheduled payment ${schedule_id} is not active, skipping`);
      return { success: false, reason: 'not_active' };
    }

    // 检查是否达到最大执行次数
    if (schedule.max_executions && schedule.execution_count >= schedule.max_executions) {
      await client.query(
        'UPDATE scheduled_payments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE schedule_id = $2',
        ['completed', schedule_id]
      );
      await client.query('COMMIT');
      console.log(`Scheduled payment ${schedule_id} reached max executions`);
      return { success: true, reason: 'max_executions_reached' };
    }

    // 获取发送方和接收方账户
    const senderResult = await client.query(
      'SELECT account_id, balance, currency FROM accounts WHERE account_id = $1 FOR UPDATE',
      [from_account_id]
    );

    const recipientResult = await client.query(
      'SELECT account_id, balance, currency FROM accounts WHERE account_id = $1 FOR UPDATE',
      [to_account_id]
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
      [amount, to_account_id]
    );

    // 创建交易记录
    const transactionId = uuidv4();
    await client.query(
      `INSERT INTO transactions (transaction_id, from_account_id, to_account_id, amount, currency, payment_method, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [transactionId, from_account_id, to_account_id, amount, currency, payment_method]
    );

    // 更新定时支付记录
    const executionCount = schedule.execution_count + 1;
    let nextExecutionAt = null;
    let status = schedule.status;

    // 计算下次执行时间
    if (schedule.schedule_type === 'once') {
      status = 'completed';
    } else if (schedule.schedule_type === 'daily') {
      nextExecutionAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    } else if (schedule.schedule_type === 'weekly') {
      nextExecutionAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    } else if (schedule.schedule_type === 'monthly') {
      nextExecutionAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }

    await client.query(
      `UPDATE scheduled_payments 
       SET execution_count = $1, last_executed_at = CURRENT_TIMESTAMP, next_execution_at = $2, status = $3, updated_at = CURRENT_TIMESTAMP 
       WHERE schedule_id = $4`,
      [executionCount, nextExecutionAt, status, schedule_id]
    );

    await client.query('COMMIT');

    // 如果还有下次执行，重新添加到队列
    if (nextExecutionAt && status === 'active') {
      const delay = nextExecutionAt.getTime() - Date.now();
      await scheduledPaymentQueue.add(
        'execute-scheduled-payment',
        {
          schedule_id,
          from_account_id,
          to_account_id,
          amount,
          currency,
          payment_method,
        },
        {
          delay: Math.max(0, delay),
          jobId: schedule_id,
        }
      );
    }

    return {
      success: true,
      transaction_id: transactionId,
      execution_count: executionCount,
      next_execution_at: nextExecutionAt,
      status,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Scheduled payment execution error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 注册队列处理器
scheduledPaymentQueue.process('execute-scheduled-payment', 3, executeScheduledPayment);

console.log('✅ Scheduled payment worker started');

module.exports = {
  executeScheduledPayment,
};
