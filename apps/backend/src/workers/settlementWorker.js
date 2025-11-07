const cron = require('node-cron');
const SettlementCoordinator = require('../services/netting-engine/SettlementCoordinator');

/**
 * Settlement Worker
 * Runs hourly settlement at the top of each hour
 */

const coordinator = new SettlementCoordinator();

// Run every hour at minute 0
// Cron format: second minute hour day month weekday
cron.schedule('0 0 * * * *', async () => {
  console.log('[SettlementWorker] Starting hourly settlement...');
  
  try {
    const result = await coordinator.runHourlySettlement();
    
    if (result.success) {
      console.log('[SettlementWorker] Settlement completed successfully');
      console.log(`[SettlementWorker] Batch ID: ${result.batchId}`);
      console.log(`[SettlementWorker] Trades: ${result.tradeCount}`);
      console.log(`[SettlementWorker] Volume: ${result.totalVolume} USDC`);
      
      if (result.txHash) {
        console.log(`[SettlementWorker] TX Hash: ${result.txHash}`);
      }
    } else {
      console.log(`[SettlementWorker] ${result.message}`);
    }
  } catch (error) {
    console.error('[SettlementWorker] Settlement failed:', error);
    
    // TODO: Send alert to monitoring system
    // alertService.sendAlert('Settlement Failed', error.message);
  }
});

console.log('[SettlementWorker] Initialized. Will run hourly at minute 0.');

module.exports = {};
