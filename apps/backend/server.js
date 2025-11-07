const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const { pool } = require('./src/config/database');
const accountRoutes = require('./src/routes/accountRoutes');
const transactionRoutes = require('./src/routes/transactionRoutes');
const batchPaymentRoutes = require('./src/routes/batchPaymentRoutes');
const scheduledPaymentRoutes = require('./src/routes/scheduledPaymentRoutes');
const fireflyRoutes = require('./src/routes/fireflyRoutes');
const amlRoutes = require('./src/routes/amlRoutes');
const kycRoutes = require('./src/routes/kycRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const streamPaymentRoutes = require('./src/routes/streamPaymentRoutes');
const authRoutes = require('./src/routes/authRoutes');
const nettingEngineRoutes = require('./src/routes/nettingEngineRoutes');
const notificationService = require('./src/services/notificationService');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// 设置Socket.IO到通知服务
notificationService.setSocketIO(io);

// 启动工作器
require('./src/workers/paymentWorker');
require('./src/workers/scheduledPaymentWorker');
require('./src/workers/streamPaymentWorker');
require('./src/workers/settlementWorker');

const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors({
  origin: [
    'https://protocolbanks.com',
    'https://www.protocolbanks.com'
  ],
  credentials: true,
}));
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
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/account', accountRoutes);
app.use('/api/v1/transaction', transactionRoutes);
app.use('/api/v1/batch-payment', batchPaymentRoutes);
app.use('/api/v1/scheduled-payment', scheduledPaymentRoutes);
app.use('/api/v1/stream-payment', streamPaymentRoutes);
app.use('/api/v1/firefly', fireflyRoutes);
app.use('/api/v1/aml', amlRoutes);
app.use('/api/v1/kyc', kycRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/netting-engine', nettingEngineRoutes);

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

// Socket.IO连接处理
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // 用户加入房间
  socket.on('join', async (data) => {
    const { account_id } = data;
    if (account_id) {
      socket.join(`account:${account_id}`);
      console.log(`Socket ${socket.id} joined room: account:${account_id}`);
      
      // 记录会话
      await notificationService.recordWebSocketSession(account_id, socket.id);
      
      // 发送未读通知数量
      const unreadCount = await notificationService.getUnreadCount(account_id);
      socket.emit('unread_count', { count: unreadCount });
    }
  });

  // 心跳
  socket.on('ping', async () => {
    await notificationService.updateSessionActivity(socket.id);
    socket.emit('pong');
  });

  // 断开连接
  socket.on('disconnect', async () => {
    console.log(`Socket disconnected: ${socket.id}`);
    await notificationService.disconnectWebSocketSession(socket.id);
  });
});

// 启动服务器
server.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 Socket.IO server is ready`);
  
  // 测试数据库连接
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
});
