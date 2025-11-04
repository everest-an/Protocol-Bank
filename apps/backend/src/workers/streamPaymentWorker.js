const { pool } = require('../config/database');

/**
 * 流支付处理Worker
 * 每分钟执行一次,处理所有活跃的流支付
 */
class StreamPaymentWorker {
  constructor() {
    this.isProcessing = false;
    this.intervalId = null;
  }
  
  /**
   * 启动Worker
   */
  start() {
    console.log('[StreamPaymentWorker] Starting...');
    
    // 立即执行一次
    this.processStreamPayments();
    
    // 每分钟执行一次
    this.intervalId = setInterval(() => {
      this.processStreamPayments();
    }, 60000); // 60秒
    
    console.log('[StreamPaymentWorker] Started successfully');
  }
  
  /**
   * 停止Worker
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[StreamPaymentWorker] Stopped');
    }
  }
  
  /**
   * 处理所有活跃的流支付
   */
  async processStreamPayments() {
    if (this.isProcessing) {
      console.log('[StreamPaymentWorker] Already processing, skipping...');
      return;
    }
    
    this.isProcessing = true;
    const client = await pool.connect();
    
    try {
      console.log('[StreamPaymentWorker] Processing stream payments...');
      
      await client.query('BEGIN');
      
      // 获取所有活跃的流支付
      const result = await client.query(
        `SELECT * FROM stream_payments 
         WHERE status = 'active' 
         AND end_time > NOW()
         FOR UPDATE`
      );
      
      const streams = result.rows;
      console.log(`[StreamPaymentWorker] Found ${streams.length} active streams`);
      
      for (const stream of streams) {
        try {
          await this.processStream(client, stream);
        } catch (error) {
          console.error(`[StreamPaymentWorker] Error processing stream ${stream.stream_id}:`, error);
          // 继续处理其他流支付
        }
      }
      
      // 检查并完成已到期的流支付
      await this.completeExpiredStreams(client);
      
      await client.query('COMMIT');
      
      console.log('[StreamPaymentWorker] Processing completed');
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[StreamPaymentWorker] Error processing stream payments:', error);
    } finally {
      client.release();
      this.isProcessing = false;
    }
  }
  
  /**
   * 处理单个流支付
   */
  async processStream(client, stream) {
    const now = new Date();
    const startTime = new Date(stream.start_time);
    const lastProcessTime = stream.last_process_time ? new Date(stream.last_process_time) : startTime;
    
    // 计算自上次处理以来经过的时间(秒)
    const secondsElapsed = (now - lastProcessTime) / 1000;
    
    if (secondsElapsed < 1) {
      // 时间间隔太短,跳过
      return;
    }
    
    // 计算应该流出的金额
    const amountToStream = parseFloat(stream.rate_per_second) * secondsElapsed;
    
    if (amountToStream <= 0) {
      return;
    }
    
    // 确保不超过总金额
    const newAmountStreamed = Math.min(
      parseFloat(stream.amount_streamed) + amountToStream,
      parseFloat(stream.amount)
    );
    
    const actualAmountStreamed = newAmountStreamed - parseFloat(stream.amount_streamed);
    
    if (actualAmountStreamed <= 0) {
      return;
    }
    
    console.log(`[StreamPaymentWorker] Stream ${stream.stream_id}: Streaming ${actualAmountStreamed} ${stream.currency}`);
    
    // 更新流支付记录
    await client.query(
      `UPDATE stream_payments 
       SET amount_streamed = $1, 
           last_process_time = NOW(),
           updated_at = NOW()
       WHERE stream_id = $2`,
      [newAmountStreamed, stream.stream_id]
    );
    
    // 注意:这里不直接转账,而是等待接收方主动提取
    // 如果需要自动转账,可以取消下面的注释
    
    /*
    // 自动转账给接收方
    await client.query(
      'UPDATE accounts SET balance = balance + $1, updated_at = NOW() WHERE account_id = $2',
      [actualAmountStreamed, stream.to_account_id]
    );
    
    // 更新已提取金额
    await client.query(
      'UPDATE stream_payments SET amount_withdrawn = amount_withdrawn + $1 WHERE stream_id = $2',
      [actualAmountStreamed, stream.stream_id]
    );
    */
  }
  
  /**
   * 完成已到期的流支付
   */
  async completeExpiredStreams(client) {
    const result = await client.query(
      `UPDATE stream_payments 
       SET status = 'completed', updated_at = NOW()
       WHERE status = 'active' 
       AND end_time <= NOW()
       AND amount_streamed >= amount
       RETURNING stream_id, stream_name`
    );
    
    if (result.rows.length > 0) {
      console.log(`[StreamPaymentWorker] Completed ${result.rows.length} expired streams:`);
      result.rows.forEach(stream => {
        console.log(`  - ${stream.stream_id}: ${stream.stream_name}`);
      });
    }
  }
}

// 创建单例实例
const streamPaymentWorker = new StreamPaymentWorker();

// 自动启动Worker
streamPaymentWorker.start();

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n[StreamPaymentWorker] Received SIGINT, shutting down...');
  streamPaymentWorker.stop();
});

process.on('SIGTERM', () => {
  console.log('\n[StreamPaymentWorker] Received SIGTERM, shutting down...');
  streamPaymentWorker.stop();
});

// 导出实例
module.exports = streamPaymentWorker;
