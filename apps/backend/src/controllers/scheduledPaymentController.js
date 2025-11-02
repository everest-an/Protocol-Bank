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
      amount,
      currency = 'USD',
      payment_method = 'scheduled_transfer',
      schedule_type, // 'once', 'daily', 'weekly', 'monthly'
      schedule_time,
      cron_expression,
      max_executions,
    } = req.body;

    // 验证输入
    if (!from_account_id || !to_account_id || !amount || !schedule_type) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields',
      });
    }

    // 验证账户
    const senderResult = await pool.query(
      'SELECT account_id, balance FROM accounts WHERE account_id = $1',
      [from_account_id]
    );

    const recipientResult = await pool.query(
      'SELECT account_id FROM accounts WHERE account_id = $1',
      [to_account_id]
    );

    if (senderResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Sender account not found',
      });
    }

    if (recipientResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Recipient account not found',
      });
    }

    // 计算下次执行时间
    let nextExecutionAt = new Date(schedule_time);
    if (schedule_type === 'daily') {
      nextExecutionAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    } else if (schedule_type === 'weekly') {
      nextExecutionAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    } else if (schedule_type === 'monthly') {
      nextExecutionAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }

    // 创建定时支付记录
    const scheduleId = uuidv4();
    const result = await pool.query(
      `INSERT INTO scheduled_payments (
        schedule_id, from_account_id, to_account_id, amount, currency, 
        payment_method, schedule_type, schedule_time, cron_expression, 
        next_execution_at, max_executions, status, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active', CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        scheduleId, from_account_id, to_account_id, amount, currency,
        payment_method, schedule_type, schedule_time, cron_expression,
        nextExecutionAt, max_executions,
      ]
    );

    // 添加到队列
    const delay = nextExecutionAt.getTime() - Date.now();
    await scheduledPaymentQueue.add(
      'execute-scheduled-payment',
      {
        schedule_id: scheduleId,
        from_account_id,
        to_account_id,
        amount,
        currency,
        payment_method,
      },
      {
        delay: Math.max(0, delay),
        jobId: scheduleId,
      }
    );

    res.status(201).json({
      status: 'success',
      message: 'Scheduled payment created',
      data: {
        schedule_id: scheduleId,
        from_account_id,
        to_account_id,
        amount: parseFloat(amount),
        schedule_type,
        next_execution_at: nextExecutionAt,
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
    const { schedule_id } = req.params;

    const result = await pool.query(
      'SELECT * FROM scheduled_payments WHERE schedule_id = $1',
      [schedule_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Scheduled payment not found',
      });
    }

    const payment = result.rows[0];

    res.json({
      status: 'success',
      data: {
        schedule_id: payment.schedule_id,
        from_account_id: payment.from_account_id,
        to_account_id: payment.to_account_id,
        amount: parseFloat(payment.amount),
        currency: payment.currency,
        schedule_type: payment.schedule_type,
        status: payment.status,
        execution_count: payment.execution_count,
        max_executions: payment.max_executions,
        last_executed_at: payment.last_executed_at,
        next_execution_at: payment.next_execution_at,
        created_at: payment.created_at,
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
          schedule_id: sp.schedule_id,
          to_account_id: sp.to_account_id,
          amount: parseFloat(sp.amount),
          schedule_type: sp.schedule_type,
          status: sp.status,
          next_execution_at: sp.next_execution_at,
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
    const { schedule_id } = req.params;

    const result = await pool.query(
      'UPDATE scheduled_payments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE schedule_id = $2 RETURNING *',
      ['paused', schedule_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Scheduled payment not found',
      });
    }

    // 从队列中移除
    await scheduledPaymentQueue.removeJobs(schedule_id);

    res.json({
      status: 'success',
      message: 'Scheduled payment paused',
      data: {
        schedule_id,
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
    const { schedule_id } = req.params;

    const result = await pool.query(
      'SELECT * FROM scheduled_payments WHERE schedule_id = $1',
      [schedule_id]
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
      'UPDATE scheduled_payments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE schedule_id = $2',
      ['active', schedule_id]
    );

    // 重新添加到队列
    const delay = new Date(payment.next_execution_at).getTime() - Date.now();
    await scheduledPaymentQueue.add(
      'execute-scheduled-payment',
      {
        schedule_id,
        from_account_id: payment.from_account_id,
        to_account_id: payment.to_account_id,
        amount: payment.amount,
        currency: payment.currency,
        payment_method: payment.payment_method,
      },
      {
        delay: Math.max(0, delay),
        jobId: schedule_id,
      }
    );

    res.json({
      status: 'success',
      message: 'Scheduled payment resumed',
      data: {
        schedule_id,
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
    const { schedule_id } = req.params;

    const result = await pool.query(
      'UPDATE scheduled_payments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE schedule_id = $2 RETURNING *',
      ['cancelled', schedule_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Scheduled payment not found',
      });
    }

    // 从队列中移除
    await scheduledPaymentQueue.removeJobs(schedule_id);

    res.json({
      status: 'success',
      message: 'Scheduled payment cancelled',
      data: {
        schedule_id,
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
