const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');

// 创建账户
exports.createAccount = async (req, res) => {
  try {
    const { username, email, password, phone_number, currency = 'USD' } = req.body;

    // 验证必填字段
    if (!username || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Username, email, and password are required'
      });
    }

    // 检查用户名和邮箱是否已存在
    const checkQuery = 'SELECT * FROM accounts WHERE username = $1 OR email = $2';
    const checkResult = await pool.query(checkQuery, [username, email]);
    
    if (checkResult.rows.length > 0) {
      return res.status(409).json({
        status: 'error',
        message: 'Username or email already exists'
      });
    }

    // 加密密码
    const password_hash = await bcrypt.hash(password, 10);
    const account_id = uuidv4();

    // 插入新账户
    const insertQuery = `
      INSERT INTO accounts (account_id, username, email, password_hash, phone_number, currency)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING account_id, username, email, balance, currency, created_at
    `;
    
    const result = await pool.query(insertQuery, [
      account_id,
      username,
      email,
      password_hash,
      phone_number,
      currency
    ]);

    res.status(201).json({
      status: 'success',
      message: 'Account created successfully',
      account_id: result.rows[0].account_id,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

// 获取账户信息
exports.getAccount = async (req, res) => {
  try {
    const { account_id } = req.params;

    const query = `
      SELECT a.account_id, a.username, a.email, a.balance, a.currency, a.wallet_address, a.created_at,
             json_agg(
               json_build_object(
                 'transaction_id', t.transaction_id,
                 'amount', t.amount,
                 'status', t.status,
                 'date', t.created_at
               )
             ) FILTER (WHERE t.transaction_id IS NOT NULL) as transactions
      FROM accounts a
      LEFT JOIN transactions t ON a.account_id = t.from_account_id OR a.account_id = t.to_account_id
      WHERE a.account_id = $1
      GROUP BY a.account_id
    `;

    const result = await pool.query(query, [account_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Account not found'
      });
    }

    res.json({
      status: 'success',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error getting account:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

// 更新账户信息
exports.updateAccount = async (req, res) => {
  try {
    const { account_id } = req.params;
    const { email, phone_number } = req.body;

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (email) {
      updates.push(`email = $${paramIndex++}`);
      values.push(email);
    }
    if (phone_number) {
      updates.push(`phone_number = $${paramIndex++}`);
      values.push(phone_number);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No fields to update'
      });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(account_id);

    const query = `
      UPDATE accounts 
      SET ${updates.join(', ')}
      WHERE account_id = $${paramIndex}
      RETURNING account_id, username, email, phone_number, updated_at
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Account not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Account updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

// 存款
exports.deposit = async (req, res) => {
  try {
    const { account_id } = req.params;
    const { amount, payment_method } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid amount'
      });
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // 更新账户余额
      const updateQuery = `
        UPDATE accounts 
        SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP
        WHERE account_id = $2
        RETURNING balance
      `;
      const updateResult = await client.query(updateQuery, [amount, account_id]);

      if (updateResult.rows.length === 0) {
        throw new Error('Account not found');
      }

      // 创建交易记录
      const transaction_id = uuidv4();
      const transactionQuery = `
        INSERT INTO transactions (transaction_id, to_account_id, amount, payment_method, status)
        VALUES ($1, $2, $3, $4, 'completed')
        RETURNING transaction_id
      `;
      const transactionResult = await client.query(transactionQuery, [
        transaction_id,
        account_id,
        amount,
        payment_method
      ]);

      await client.query('COMMIT');

      res.json({
        status: 'success',
        message: 'Deposit successful',
        transaction_id: transactionResult.rows[0].transaction_id,
        new_balance: parseFloat(updateResult.rows[0].balance)
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error processing deposit:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// 取款
exports.withdraw = async (req, res) => {
  try {
    const { account_id } = req.params;
    const { amount, payment_method } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid amount'
      });
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // 检查余额
      const balanceQuery = 'SELECT balance FROM accounts WHERE account_id = $1';
      const balanceResult = await client.query(balanceQuery, [account_id]);

      if (balanceResult.rows.length === 0) {
        throw new Error('Account not found');
      }

      if (parseFloat(balanceResult.rows[0].balance) < amount) {
        throw new Error('Insufficient balance');
      }

      // 更新账户余额
      const updateQuery = `
        UPDATE accounts 
        SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP
        WHERE account_id = $2
        RETURNING balance
      `;
      const updateResult = await client.query(updateQuery, [amount, account_id]);

      // 创建交易记录
      const transaction_id = uuidv4();
      const transactionQuery = `
        INSERT INTO transactions (transaction_id, from_account_id, amount, payment_method, status)
        VALUES ($1, $2, $3, $4, 'completed')
        RETURNING transaction_id
      `;
      const transactionResult = await client.query(transactionQuery, [
        transaction_id,
        account_id,
        amount,
        payment_method
      ]);

      await client.query('COMMIT');

      res.json({
        status: 'success',
        message: 'Withdrawal successful',
        transaction_id: transactionResult.rows[0].transaction_id,
        new_balance: parseFloat(updateResult.rows[0].balance)
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};
