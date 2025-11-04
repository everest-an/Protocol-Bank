const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { scheduledPaymentQueue } = require('../config/queue');

/**
 * 创建定时支付
 */
exports.createScheduledPayment = async (req, res) => {
  try {
    const {
      from_account_id,
      to_account_id,
      to_address,
      amount,
      currency = 'USD',
      frequency, // 'once', 'daily', 'weekly', 'monthly'
      start_date,
      end_date,
      max_executions,
      note,
    } = req.body;

    // 验证输入
    if (!from_account_id || (!to_account_id && !to_address) || !amount || !frequency || !start_date) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: from_account_id, (to_account_id or to_address), amount, frequency, start_date',
      });
    }

    // 验证账户
    const senderResult = await pool.query(
      'SELECT account_id, balance FROM accounts WHERE account_id = $1',
      [from_account_id]
    );

    if (senderResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Sender account not found',
      });
    }

    if (to_account_id) {
      const recipientResult = await pool.query(
        'SELECT account_id FROM accounts WHERE account_id = $1',
        [to_account_id]
      );

      if (recipientResult.rows.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Recipient account not found',
        });
      }
    }

    // 计算下次执行时间
    const startDate = new Date(start_date);
    let nextExecution = startDate;

    // 创建定时支付记录
    const scheduledPaymentId = uuidv4();
    const result = await pool.query(
      `INSERT INTO scheduled_payments (
        scheduled_payment_id, from_account_id, to_account_id, to_address, amount, currency,
        frequency, start_date, end_date, next_execution, max_executions, note, status, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'active', CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        scheduledPaymentId, from_account_id, to_account_id, to_address, amount, currency,
        frequency, startDate, end_date, nextExecution, max_executions, note,
      ]
    );

    // 添加到队列
    const delay = nextExecution.getTime() - Date.now();
    await scheduledPaymentQueue.add(
      'execute-scheduled-payment',
      {
        scheduled_payment_id: scheduledPaymentId,
        from_account_id,
        to_account_id,
        to_address,
        amount,
        currency,
      },
      {
        delay: Math.max(0, delay),
        jobId: scheduledPaymentId,
      }
    );

    res.status(201).json({
      status: 'success',
      message: 'Scheduled payment created',
      data: {
        scheduled_payment_id: scheduledPaymentId,
        from_account_id,
        to_account_id,
        to_address,
        amount: parseFloat(amount),
        currency,
        frequency,
        start_date: startDate,
        next_execution: nextExecution,
        status: 'active',
      },
    });
  } catch (error) {
    console.error('Error creating scheduled payment:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * 获取定时支付详情
 */
exports.getScheduledPayment = async (req, res) => {
  try {
    const { scheduled_payment_id } = req.params;

    const result = await pool.query(
      'SELECT * FROM scheduled_payments WHERE scheduled_payment_id = $1',
      [scheduled_payment_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Scheduled payment not found',
      });
    }

    const payment = result.rows[0];

    // 获取执行历史
    const executionsResult = await pool.query(
      'SELECT * FROM scheduled_payment_executions WHERE scheduled_payment_id = $1 ORDER BY executed_at DESC LIMIT 10',
      [scheduled_payment_id]
    );

    res.json({
      status: 'success',
      data: {
        scheduled_payment_id: payment.scheduled_payment_id,
        from_account_id: payment.from_account_id,
        to_account_id: payment.to_account_id,
        to_address: payment.to_address,
        amount: parseFloat(payment.amount),
        currency: payment.currency,
        frequency: payment.frequency,
        start_date: payment.start_date,
        end_date: payment.end_date,
        next_execution: payment.next_execution,
        last_execution: payment.last_execution,
        execution_count: payment.execution_count,
        max_executions: payment.max_executions,
        status: payment.status,
        note: payment.note,
        created_at: payment.created_at,
        recent_executions: executionsResult.rows.map(exec => ({
          execution_id: exec.execution_id,
          transaction_id: exec.transaction_id,
          status: exec.status,
          executed_at: exec.executed_at,
          error_message: exec.error_message,
        })),
      },
    });
  } catch (error) {
    console.error('Error getting scheduled payment:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * 获取账户的定时支付列表
 */
exports.getScheduledPaymentsList = async (req, res) => {
  try {
    const { account_id } = req.params;
    const { status, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT * FROM scheduled_payments WHERE from_account_id = $1';
    const params = [account_id];

    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await pool.query(query, params);

    const countQuery = status
      ? 'SELECT COUNT(*) FROM scheduled_payments WHERE from_account_id = $1 AND status = $2'
      : 'SELECT COUNT(*) FROM scheduled_payments WHERE from_account_id = $1';
    const countParams = status ? [account_id, status] : [account_id];
    const countResult = await pool.query(countQuery, countParams);

    res.json({
      status: 'success',
      data: {
        scheduled_payments: result.rows.map(sp => ({
          scheduled_payment_id: sp.scheduled_payment_id,
          to_account_id: sp.to_account_id,
          to_address: sp.to_address,
          amount: parseFloat(sp.amount),
          frequency: sp.frequency,
          status: sp.status,
          next_execution: sp.next_execution,
          execution_count: sp.execution_count,
          created_at: sp.created_at,
        })),
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('Error getting scheduled payments list:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * 暂停定时支付
 */
exports.pauseScheduledPayment = async (req, res) => {
  try {
    const { scheduled_payment_id } = req.params;

    const result = await pool.query(
      'UPDATE scheduled_payments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE scheduled_payment_id = $2 RETURNING *',
      ['paused', scheduled_payment_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Scheduled payment not found',
      });
    }

    // 从队列中移除
    try {
      await scheduledPaymentQueue.removeJobs(scheduled_payment_id);
    } catch (queueError) {
      console.warn('Failed to remove job from queue:', queueError.message);
    }

    res.json({
      status: 'success',
      message: 'Scheduled payment paused',
      data: {
        scheduled_payment_id,
        status: 'paused',
      },
    });
  } catch (error) {
    console.error('Error pausing scheduled payment:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * 恢复定时支付
 */
exports.resumeScheduledPayment = async (req, res) => {
  try {
    const { scheduled_payment_id } = req.params;

    const result = await pool.query(
      'SELECT * FROM scheduled_payments WHERE scheduled_payment_id = $1',
      [scheduled_payment_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Scheduled payment not found',
      });
    }

    const payment = result.rows[0];

    // 更新状态
    await pool.query(
      'UPDATE scheduled_payments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE scheduled_payment_id = $2',
      ['active', scheduled_payment_id]
    );

    // 重新添加到队列
    const delay = new Date(payment.next_execution).getTime() - Date.now();
    await scheduledPaymentQueue.add(
      'execute-scheduled-payment',
      {
        scheduled_payment_id,
        from_account_id: payment.from_account_id,
        to_account_id: payment.to_account_id,
        to_address: payment.to_address,
        amount: payment.amount,
        currency: payment.currency,
      },
      {
        delay: Math.max(0, delay),
        jobId: scheduled_payment_id,
      }
    );

    res.json({
      status: 'success',
      message: 'Scheduled payment resumed',
      data: {
        scheduled_payment_id,
        status: 'active',
      },
    });
  } catch (error) {
    console.error('Error resuming scheduled payment:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * 取消定时支付
 */
exports.cancelScheduledPayment = async (req, res) => {
  try {
    const { scheduled_payment_id } = req.params;

    const result = await pool.query(
      'UPDATE scheduled_payments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE scheduled_payment_id = $2 RETURNING *',
      ['cancelled', scheduled_payment_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Scheduled payment not found',
      });
    }

    // 从队列中移除
    try {
      await scheduledPaymentQueue.removeJobs(scheduled_payment_id);
    } catch (queueError) {
      console.warn('Failed to remove job from queue:', queueError.message);
    }

    res.json({
      status: 'success',
      message: 'Scheduled payment cancelled',
      data: {
        scheduled_payment_id,
        status: 'cancelled',
      },
    });
  } catch (error) {
    console.error('Error cancelling scheduled payment:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message,
    });
  }
};
