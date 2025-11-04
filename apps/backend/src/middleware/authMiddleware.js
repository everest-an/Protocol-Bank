const jwt = require('jsonwebtoken');

/**
 * JWT认证中间件
 * 验证请求头中的JWT token
 */
const authMiddleware = (req, res, next) => {
  try {
    // 从请求头获取token
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        status: 'error',
        message: 'No authorization token provided',
      });
    }

    // Bearer token格式: "Bearer <token>"
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token format',
      });
    }

    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'protocol-bank-super-secret-jwt-key-production-2025');
    
    // 将解码后的用户信息附加到请求对象
    req.user = decoded;
    req.accountId = decoded.account_id;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token has expired',
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token',
      });
    }
    
    return res.status(500).json({
      status: 'error',
      message: 'Authentication error',
      error: error.message,
    });
  }
};

/**
 * 可选认证中间件
 * 如果提供了token则验证,否则继续
 */
const optionalAuthMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return next();
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'protocol-bank-super-secret-jwt-key-production-2025');
      req.user = decoded;
      req.accountId = decoded.account_id;
    }
    
    next();
  } catch (error) {
    // 即使token无效,也继续处理请求
    next();
  }
};

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
};
