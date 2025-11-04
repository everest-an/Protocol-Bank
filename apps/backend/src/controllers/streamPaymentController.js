const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

/**
 * 创建流支付
 * POST /api/v1/stream-payment/create
 */
exports.createStreamPayment = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const {
      to_account_id,
      amount,
      currency = 'USD',
      duration, // 持续时间(秒)
      stream_name,
      description,
      blockchain_enabled = false
    } = req.body;
    
    // 从JWT token获取发送方账户ID
    const from_account_id = req.user.account_id;
    
    // 验证输入
    if (!to_account_id || !amount || !duration) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: to_account_id, amount, duration'
      });
    }
    
    if (amount <= 0 || duration <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Amount and duration must be positive'
      });
    }
    
    if (from_account_id === to_account_id) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot create stream payment to yourself'
      });
    }
    
    await client.query('BEGIN');
    
    // 检查发送方账户余额
    const senderResult = await client.query(
      'SELECT balance, currency FROM accounts WHERE account_id = $1',
      [from_account_id]
    );
    
    if (senderResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        status: 'error',
        message: 'Sender account not found'
      });
    }
    
    const sender = senderResult.rows[0];
    
    if (parseFloat(sender.balance) < parseFloat(amount)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        status: 'error',
        message: 'Insufficient balance'
      });
    }
    
    // 检查接收方账户是否存在
    const recipientResult = await client.query(
      'SELECT account_id FROM accounts WHERE account_id = $1',
      [to_account_id]
    );
    
    if (recipientResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        status: 'error',
        message: 'Recipient account not found'
      });
    }
    
    // 计算每秒速率
    const rate_per_second = parseFloat(amount) / parseFloat(duration);
    
    // 创建流支付记录
    const streamResult = await client.query(
      `INSERT INTO stream_payments (
        from_account_id,
        to_account_id,
        amount,
        currency,
        rate_per_second,
        start_time,
        end_time,
        stream_name,
        description,
        blockchain_enabled
      ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW() + INTERVAL '${duration} seconds', $6, $7, $8)
      RETURNING *`,
      [from_account_id, to_account_id, amount, currency, rate_per_second, stream_name, description, blockchain_enabled]
    );
    
    // 从发送方账户扣除总金额(锁定资金)
    await client.query(
      'UPDATE accounts SET balance = balance - $1, updated_at = NOW() WHERE account_id = $2',
      [amount, from_account_id]
    );
    
    await client.query('COMMIT');
    
    res.json({
      status: 'success',
      message: 'Stream payment created successfully',
      data: streamResult.rows[0]
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating stream payment:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create stream payment',
      error: error.message
    });
  } finally {
    client.release();
  }
};

/**
 * 获取流支付详情
 * GET /api/v1/stream-payment/:stream_id
 */
exports.getStreamPayment = async (req, res) => {
  try {
    const { stream_id } = req.params;
    
    const result = await pool.query(
      `SELECT 
        s.*,
        sender.username as sender_username,
        sender.email as sender_email,
        recipient.username as recipient_username,
        recipient.email as recipient_email
      FROM stream_payments s
      JOIN accounts sender ON s.from_account_id = sender.account_id
      JOIN accounts recipient ON s.to_account_id = recipient.account_id
      WHERE s.stream_id = $1`,
      [stream_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Stream payment not found'
      });
    }
    
    res.json({
      status: 'success',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error getting stream payment:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get stream payment',
      error: error.message
    });
  }
};

/**
 * 获取账户的流支付列表
 * GET /api/v1/stream-payment/list/:account_id
 */
exports.getStreamPaymentsList = async (req, res) => {
  try {
    const { account_id } = req.params;
    const { type = 'all' } = req.query; // 'sent', 'received', 'all'
    
    let query = `
      SELECT 
        s.*,
        sender.username as sender_username,
        sender.email as sender_email,
        recipient.username as recipient_username,
        recipient.email as recipient_email
      FROM stream_payments s
      JOIN accounts sender ON s.from_account_id = sender.account_id
      JOIN accounts recipient ON s.to_account_id = recipient.account_id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (type === 'sent') {
      query += ` AND s.from_account_id = $1`;
      params.push(account_id);
    } else if (type === 'received') {
      query += ` AND s.to_account_id = $1`;
      params.push(account_id);
    } else {
      query += ` AND (s.from_account_id = $1 OR s.to_account_id = $1)`;
      params.push(account_id);
    }
    
    query += ` ORDER BY s.created_at DESC`;
    
    const result = await pool.query(query, params);
    
    res.json({
      status: 'success',
      data: result.rows
    });
    
  } catch (error) {
    console.error('Error getting stream payments list:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get stream payments list',
      error: error.message
    });
  }
};

/**
 * 暂停流支付
 * POST /api/v1/stream-payment/:stream_id/pause
 */
exports.pauseStreamPayment = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { stream_id } = req.params;
    const from_account_id = req.user.account_id;
    
    await client.query('BEGIN');
    
    // 获取流支付信息
    const streamResult = await client.query(
      'SELECT * FROM stream_payments WHERE stream_id = $1 FOR UPDATE',
      [stream_id]
    );
    
    if (streamResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        status: 'error',
        message: 'Stream payment not found'
      });
    }
    
    const stream = streamResult.rows[0];
    
    // 只有发送方可以暂停
    if (stream.from_account_id !== from_account_id) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        status: 'error',
        message: 'Only sender can pause stream payment'
      });
    }
    
    if (stream.status !== 'active') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        status: 'error',
        message: 'Stream payment is not active'
      });
    }
    
    // 暂停流支付
    await client.query(
      'UPDATE stream_payments SET status = $1, pause_time = NOW(), updated_at = NOW() WHERE stream_id = $2',
      ['paused', stream_id]
    );
    
    await client.query('COMMIT');
    
    res.json({
      status: 'success',
      message: 'Stream payment paused successfully'
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error pausing stream payment:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to pause stream payment',
      error: error.message
    });
  } finally {
    client.release();
  }
};

/**
 * 恢复流支付
 * POST /api/v1/stream-payment/:stream_id/resume
 */
exports.resumeStreamPayment = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { stream_id } = req.params;
    const from_account_id = req.user.account_id;
    
    await client.query('BEGIN');
    
    const streamResult = await client.query(
      'SELECT * FROM stream_payments WHERE stream_id = $1 FOR UPDATE',
      [stream_id]
    );
    
    if (streamResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        status: 'error',
        message: 'Stream payment not found'
      });
    }
    
    const stream = streamResult.rows[0];
    
    if (stream.from_account_id !== from_account_id) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        status: 'error',
        message: 'Only sender can resume stream payment'
      });
    }
    
    if (stream.status !== 'paused') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        status: 'error',
        message: 'Stream payment is not paused'
      });
    }
    
    // 恢复流支付
    await client.query(
      'UPDATE stream_payments SET status = $1, pause_time = NULL, updated_at = NOW() WHERE stream_id = $2',
      ['active', stream_id]
    );
    
    await client.query('COMMIT');
    
    res.json({
      status: 'success',
      message: 'Stream payment resumed successfully'
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error resuming stream payment:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to resume stream payment',
      error: error.message
    });
  } finally {
    client.release();
  }
};

/**
 * 取消流支付
 * POST /api/v1/stream-payment/:stream_id/cancel
 */
exports.cancelStreamPayment = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { stream_id } = req.params;
    const from_account_id = req.user.account_id;
    
    await client.query('BEGIN');
    
    const streamResult = await client.query(
      'SELECT * FROM stream_payments WHERE stream_id = $1 FOR UPDATE',
      [stream_id]
    );
    
    if (streamResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        status: 'error',
        message: 'Stream payment not found'
      });
    }
    
    const stream = streamResult.rows[0];
    
    if (stream.from_account_id !== from_account_id) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        status: 'error',
        message: 'Only sender can cancel stream payment'
      });
    }
    
    if (stream.status === 'cancelled' || stream.status === 'completed') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        status: 'error',
        message: 'Stream payment is already ' + stream.status
      });
    }
    
    // 计算未流出的金额
    const unstreamed_amount = parseFloat(stream.amount) - parseFloat(stream.amount_streamed);
    
    // 退还未流出的金额给发送方
    if (unstreamed_amount > 0) {
      await client.query(
        'UPDATE accounts SET balance = balance + $1, updated_at = NOW() WHERE account_id = $2',
        [unstreamed_amount, stream.from_account_id]
      );
    }
    
    // 取消流支付
    await client.query(
      'UPDATE stream_payments SET status = $1, updated_at = NOW() WHERE stream_id = $2',
      ['cancelled', stream_id]
    );
    
    await client.query('COMMIT');
    
    res.json({
      status: 'success',
      message: 'Stream payment cancelled successfully',
      data: {
        refunded_amount: unstreamed_amount
      }
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error cancelling stream payment:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to cancel stream payment',
      error: error.message
    });
  } finally {
    client.release();
  }
};

/**
 * 获取可提取金额
 * GET /api/v1/stream-payment/:stream_id/available
 */
exports.getAvailableBalance = async (req, res) => {
  try {
    const { stream_id } = req.params;
    
    const streamResult = await pool.query(
      'SELECT * FROM stream_payments WHERE stream_id = $1',
      [stream_id]
    );
    
    if (streamResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Stream payment not found'
      });
    }
    
    const stream = streamResult.rows[0];
    
    // 计算可提取金额
    const now = new Date();
    const startTime = new Date(stream.start_time);
    const endTime = new Date(stream.end_time);
    
    let availableBalance = 0;
    
    if (stream.status === 'active') {
      const currentTime = now > endTime ? endTime : now;
      const elapsedSeconds = (currentTime - startTime) / 1000;
      const streamedAmount = parseFloat(stream.rate_per_second) * elapsedSeconds;
      availableBalance = streamedAmount - parseFloat(stream.amount_withdrawn);
    } else if (stream.status === 'completed') {
      availableBalance = parseFloat(stream.amount) - parseFloat(stream.amount_withdrawn);
    }
    
    availableBalance = Math.max(0, availableBalance);
    
    res.json({
      status: 'success',
      data: {
        available_balance: availableBalance,
        amount_streamed: stream.amount_streamed,
        amount_withdrawn: stream.amount_withdrawn,
        total_amount: stream.amount,
        currency: stream.currency
      }
    });
    
  } catch (error) {
    console.error('Error getting available balance:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get available balance',
      error: error.message
    });
  }
};

/**
 * 提取资金
 * POST /api/v1/stream-payment/:stream_id/withdraw
 */
exports.withdrawFromStream = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { stream_id } = req.params;
    const to_account_id = req.user.account_id;
    
    await client.query('BEGIN');
    
    const streamResult = await client.query(
      'SELECT * FROM stream_payments WHERE stream_id = $1 FOR UPDATE',
      [stream_id]
    );
    
    if (streamResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        status: 'error',
        message: 'Stream payment not found'
      });
    }
    
    const stream = streamResult.rows[0];
    
    // 只有接收方可以提取
    if (stream.to_account_id !== to_account_id) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        status: 'error',
        message: 'Only recipient can withdraw from stream payment'
      });
    }
    
    if (stream.status !== 'active' && stream.status !== 'completed') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        status: 'error',
        message: 'Stream payment is not active or completed'
      });
    }
    
    // 计算可提取金额
    const now = new Date();
    const startTime = new Date(stream.start_time);
    const endTime = new Date(stream.end_time);
    const currentTime = now > endTime ? endTime : now;
    const elapsedSeconds = (currentTime - startTime) / 1000;
    const streamedAmount = parseFloat(stream.rate_per_second) * elapsedSeconds;
    const availableBalance = streamedAmount - parseFloat(stream.amount_withdrawn);
    
    if (availableBalance <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        status: 'error',
        message: 'No funds available to withdraw'
      });
    }
    
    // 转账给接收方
    await client.query(
      'UPDATE accounts SET balance = balance + $1, updated_at = NOW() WHERE account_id = $2',
      [availableBalance, stream.to_account_id]
    );
    
    // 更新流支付记录
    const newAmountWithdrawn = parseFloat(stream.amount_withdrawn) + availableBalance;
    const newStatus = newAmountWithdrawn >= parseFloat(stream.amount) ? 'completed' : stream.status;
    
    await client.query(
      `UPDATE stream_payments 
       SET amount_withdrawn = $1, status = $2, updated_at = NOW() 
       WHERE stream_id = $3`,
      [newAmountWithdrawn, newStatus, stream_id]
    );
    
    await client.query('COMMIT');
    
    res.json({
      status: 'success',
      message: 'Withdrawal successful',
      data: {
        withdrawn_amount: availableBalance,
        total_withdrawn: newAmountWithdrawn,
        currency: stream.currency
      }
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error withdrawing from stream:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to withdraw from stream',
      error: error.message
    });
  } finally {
    client.release();
  }
};

module.exports = exports;
