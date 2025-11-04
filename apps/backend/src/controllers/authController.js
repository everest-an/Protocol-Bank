const { pool } = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'protocol-bank-super-secret-jwt-key-production-2025';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * 用户注册
 */
exports.register = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { username, email, password } = req.body;

    // 验证必填字段
    if (!username || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Username, email, and password are required',
      });
    }

    // 验证密码强度
    if (password.length < 8) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 8 characters long',
      });
    }

    // 检查用户名是否已存在
    const usernameCheck = await client.query(
      'SELECT account_id FROM accounts WHERE username = $1',
      [username]
    );

    if (usernameCheck.rows.length > 0) {
      return res.status(409).json({
        status: 'error',
        message: 'Username already exists',
      });
    }

    // 检查邮箱是否已存在
    const emailCheck = await client.query(
      'SELECT account_id FROM accounts WHERE email = $1',
      [email]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(409).json({
        status: 'error',
        message: 'Email already exists',
      });
    }

    // 加密密码
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 创建账户
    const result = await client.query(
      `INSERT INTO accounts (username, email, password_hash, balance, currency)
       VALUES ($1, $2, $3, 0, 'USD')
       RETURNING account_id, username, email, balance, currency, created_at`,
      [username, email, passwordHash]
    );

    const account = result.rows[0];

    // 生成JWT token
    const token = jwt.sign(
      {
        account_id: account.account_id,
        username: account.username,
        email: account.email,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      status: 'success',
      message: 'Account created successfully',
      data: {
        account_id: account.account_id,
        username: account.username,
        email: account.email,
        balance: account.balance,
        currency: account.currency,
        created_at: account.created_at,
      },
      token,
    });
  } catch (error) {
    console.error('Error in register:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message,
    });
  } finally {
    client.release();
  }
};

/**
 * 用户登录
 */
exports.login = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { username, password } = req.body;

    // 验证必填字段
    if (!username || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Username and password are required',
      });
    }

    // 查找用户(支持用户名或邮箱登录)
    const result = await client.query(
      `SELECT account_id, username, email, password_hash, balance, currency
       FROM accounts
       WHERE username = $1 OR email = $1`,
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid username or password',
      });
    }

    const account = result.rows[0];

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, account.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid username or password',
      });
    }

    // 生成JWT token
    const token = jwt.sign(
      {
        account_id: account.account_id,
        username: account.username,
        email: account.email,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // 更新最后登录时间
    await client.query(
      'UPDATE accounts SET last_login = CURRENT_TIMESTAMP WHERE account_id = $1',
      [account.account_id]
    );

    res.json({
      status: 'success',
      message: 'Login successful',
      data: {
        account_id: account.account_id,
        username: account.username,
        email: account.email,
        balance: account.balance,
        currency: account.currency,
      },
      token,
    });
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message,
    });
  } finally {
    client.release();
  }
};

/**
 * 获取当前用户信息
 */
exports.getCurrentUser = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const accountId = req.accountId;

    const result = await client.query(
      `SELECT account_id, username, email, balance, currency, created_at, last_login
       FROM accounts
       WHERE account_id = $1`,
      [accountId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Account not found',
      });
    }

    res.json({
      status: 'success',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message,
    });
  } finally {
    client.release();
  }
};

/**
 * 刷新token
 */
exports.refreshToken = async (req, res) => {
  try {
    const accountId = req.accountId;
    const username = req.user.username;
    const email = req.user.email;

    // 生成新的token
    const token = jwt.sign(
      {
        account_id: accountId,
        username: username,
        email: email,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      status: 'success',
      message: 'Token refreshed successfully',
      token,
    });
  } catch (error) {
    console.error('Error in refreshToken:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * 修改密码
 */
exports.changePassword = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const accountId = req.accountId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Current password and new password are required',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        status: 'error',
        message: 'New password must be at least 8 characters long',
      });
    }

    // 获取当前密码哈希
    const result = await client.query(
      'SELECT password_hash FROM accounts WHERE account_id = $1',
      [accountId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Account not found',
      });
    }

    const currentHash = result.rows[0].password_hash;

    // 验证当前密码
    const isValid = await bcrypt.compare(currentPassword, currentHash);

    if (!isValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Current password is incorrect',
      });
    }

    // 加密新密码
    const saltRounds = 10;
    const newHash = await bcrypt.hash(newPassword, saltRounds);

    // 更新密码
    await client.query(
      'UPDATE accounts SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE account_id = $2',
      [newHash, accountId]
    );

    res.json({
      status: 'success',
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Error in changePassword:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message,
    });
  } finally {
    client.release();
  }
};
