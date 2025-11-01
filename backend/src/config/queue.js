const Queue = require('bull');

// 创建支付队列
const paymentQueue = new Queue('payment-processing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 100,
  },
});

// 创建定时支付队列
const scheduledPaymentQueue = new Queue('scheduled-payment', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 100,
  },
});

// 监听队列事件
paymentQueue.on('completed', (job, result) => {
  console.log(`✅ Payment job ${job.id} completed:`, result);
});

paymentQueue.on('failed', (job, err) => {
  console.error(`❌ Payment job ${job.id} failed:`, err.message);
});

scheduledPaymentQueue.on('completed', (job, result) => {
  console.log(`✅ Scheduled payment job ${job.id} completed:`, result);
});

scheduledPaymentQueue.on('failed', (job, err) => {
  console.error(`❌ Scheduled payment job ${job.id} failed:`, err.message);
});

module.exports = {
  paymentQueue,
  scheduledPaymentQueue,
};
