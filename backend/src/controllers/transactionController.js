const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');

// 发起转账交易
exports.createTransfer = async (req, res) => {
  try {
    const { from_account_id, to_account_id, amount, payment_method } = req.body;

    // 验证必填字段
    if (!from_account_id || !to_account_id || !amount) {
      return res.status(400).json({
        status: 'error',
        message: 'from_account_id, to_account_id, and amount are required'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Amount must be greater than 0'
      });
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // 检查发送方余额
      const balanceQuery = 'SELECT balance FROM accounts WHERE account_id = $1';
      const balanceResult = await client.query(balanceQuery, [from_account_id]);

      if (balanceResult.rows.length === 0) {
        throw new Error('Sender account not found');
      }

      if (parseFloat(balanceResult.rows[0].balance) < amount) {
        throw new Error('Insufficient balance');
      }

      // 检查接收方账户是否存在
      const recipientQuery = 'SELECT account_id FROM accounts WHERE account_id = $1';
      const recipientResult = await client.query(recipientQuery, [to_account_id]);

      if (recipientResult.rows.length === 0) {
        throw new Error('Recipient account not found');
      }

      // 扣除发送方余额
      await client.query(
        'UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE account_id = $2',
        [amount, from_account_id]
      );

      // 增加接收方余额
      await client.query(
        'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE account_id = $2',
        [amount, to_account_id]
      );

      // 创建交易记录
      const transaction_id = uuidv4();
      const transactionQuery = `
        INSERT INTO transactions (transaction_id, from_account_id, to_account_id, amount, payment_method, status)
        VALUES ($1, $2, $3, $4, $5, 'completed')
        RETURNING transaction_id, status, created_at
      `;
      
      const transactionResult = await client.query(transactionQuery, [
        transaction_id,
        from_account_id,
        to_account_id,
        amount,
        payment_method || 'internal_transfer'
      ]);

      await client.query('COMMIT');

      res.status(201).json({
        status: 'success',
        message: 'Transaction submitted for processing',
        transaction_id: transactionResult.rows[0].transaction_id,
        transaction_status: transactionResult.rows[0].status,
        created_at: transactionResult.rows[0].created_at
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating transfer:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// 查询交易
exports.getTransaction = async (req, res) => {
  try {
    const { transaction_id } = req.params;

    const query = `
      SELECT 
        t.transaction_id,
        t.from_account_id,
        t.to_account_id,
        t.amount,
        t.currency,
        t.payment_method,
        t.status,
        t.tx_hash,
        t.created_at,
        fa.username as from_username,
        ta.username as to_username
      FROM transactions t
      LEFT JOIN accounts fa ON t.from_account_id = fa.account_id
      LEFT JOIN accounts ta ON t.to_account_id = ta.account_id
      WHERE t.transaction_id = $1
    `;

    const result = await pool.query(query, [transaction_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Transaction not found'
      });
    }

    res.json({
      status: 'success',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error getting transaction:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

// 获取账户交易历史
exports.getTransactionHistory = async (req, res) => {
  try {
    const { account_id } = req.params;
    const { limit = 50, offset = 0, status } = req.query;

    let query = `
      SELECT 
        t.transaction_id,
        t.from_account_id,
        t.to_account_id,
        t.amount,
        t.currency,
        t.payment_method,
        t.status,
        t.tx_hash,
        t.created_at,
        fa.username as from_username,
        ta.username as to_username,
        CASE 
          WHEN t.from_account_id = $1 THEN 'outgoing'
          WHEN t.to_account_id = $1 THEN 'incoming'
          ELSE 'unknown'
        END as direction
      FROM transactions t
      LEFT JOIN accounts fa ON t.from_account_id = fa.account_id
      LEFT JOIN accounts ta ON t.to_account_id = ta.account_id
      WHERE (t.from_account_id = $1 OR t.to_account_id = $1)
    `;

    const params = [account_id];
    let paramIndex = 2;

    if (status) {
      query += ` AND t.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY t.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // 获取总数
    const countQuery = `
      SELECT COUNT(*) as total
      FROM transactions
      WHERE (from_account_id = $1 OR to_account_id = $1)
      ${status ? 'AND status = $2' : ''}
    `;
    const countParams = status ? [account_id, status] : [account_id];
    const countResult = await pool.query(countQuery, countParams);

    res.json({
      status: 'success',
      data: {
        transactions: result.rows,
        total: parseInt(countResult.rows[0].total),
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error getting transaction history:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

// 获取交易统计
exports.getTransactionStats = async (req, res) => {
  try {
    const { account_id } = req.params;
    const { start_date, end_date } = req.query;

    let query = `
      SELECT 
        COUNT(*) as total_transactions,
        SUM(CASE WHEN from_account_id = $1 THEN amount ELSE 0 END) as total_sent,
        SUM(CASE WHEN to_account_id = $1 THEN amount ELSE 0 END) as total_received,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_transactions,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_transactions,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_transactions
      FROM transactions
      WHERE (from_account_id = $1 OR to_account_id = $1)
    `;

    const params = [account_id];
    let paramIndex = 2;

    if (start_date) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    const result = await pool.query(query, params);

    res.json({
      status: 'success',
      data: {
        ...result.rows[0],
        total_sent: parseFloat(result.rows[0].total_sent) || 0,
        total_received: parseFloat(result.rows[0].total_received) || 0,
        net_flow: (parseFloat(result.rows[0].total_received) || 0) - (parseFloat(result.rows[0].total_sent) || 0)
      }
    });
  } catch (error) {
    console.error('Error getting transaction stats:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};
