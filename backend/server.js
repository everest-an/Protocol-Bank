const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { pool } = require('./src/config/database');
const accountRoutes = require('./src/routes/accountRoutes');
const transactionRoutes = require('./src/routes/transactionRoutes');
const batchPaymentRoutes = require('./src/routes/batchPaymentRoutes');
const scheduledPaymentRoutes = require('./src/routes/scheduledPaymentRoutes');
const fireflyRoutes = require('./src/routes/fireflyRoutes');
const amlRoutes = require('./src/routes/amlRoutes');

const app = express();

// 启动工作器
require('./src/workers/paymentWorker');
require('./src/workers/scheduledPaymentWorker');

const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 请求日志
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API 路由
app.use('/api/v1/account', accountRoutes);
app.use('/api/v1/transaction', transactionRoutes);
app.use('/api/v1/batch-payment', batchPaymentRoutes);
app.use('/api/v1/scheduled-payment', scheduledPaymentRoutes);
app.use('/api/v1/firefly', fireflyRoutes);
app.use('/api/v1/aml', amlRoutes);

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
});

// 启动服务器
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  
  // 测试数据库连接
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
});
