const Trade = require('../../models/netting-engine/Trade');
const SettlementBatch = require('../../models/netting-engine/SettlementBatch');
const NettingCalculator = require('./NettingCalculator');
const SignatureService = require('./SignatureService');
const { ethers } = require('ethers');

/**
 * SettlementCoordinator
 * Orchestrates the settlement process: calculate, sign, and submit
 */
class SettlementCoordinator {
  constructor() {
    this.signatureService = new SignatureService();
    
    // Initialize blockchain connection
    const rpcUrl = process.env.ETHEREUM_RPC_URL || process.env.SEPOLIA_RPC_URL;
    if (!rpcUrl) {
      throw new Error('ETHEREUM_RPC_URL or SEPOLIA_RPC_URL must be set');
    }

    this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    
    // Initialize ClearingHouse contract
    const clearingHouseAddress = process.env.CLEARING_HOUSE_ADDRESS;
    if (!clearingHouseAddress) {
      console.warn('[SettlementCoordinator] CLEARING_HOUSE_ADDRESS not set. Contract submission disabled.');
      this.clearingHouse = null;
    } else {
      const clearingHouseABI = require('../../../blockchain/artifacts/ClearingHouse.json').abi;
      const wallet = new ethers.Wallet(process.env.NETTING_ENGINE_PRIVATE_KEY, this.provider);
      this.clearingHouse = new ethers.Contract(clearingHouseAddress, clearingHouseABI, wallet);
    }

    console.log('[SettlementCoordinator] Initialized');
  }

  /**
   * Run settlement for a time window
   * @param {Date} windowStart - Window start time
   * @param {Date} windowEnd - Window end time
   * @returns {Promise<Object>} Settlement result
   */
  async runSettlement(windowStart, windowEnd) {
    console.log(`[SettlementCoordinator] Starting settlement for window: ${windowStart} to ${windowEnd}`);

    try {
      // Step 1: Calculate net positions
      const { positions, tradeIds, tradeCount, totalVolume } = 
        await NettingCalculator.calculateNetPositions(windowStart, windowEnd);

      if (positions.length === 0) {
        console.log('[SettlementCoordinator] No trades to settle in this window');
        return {
          success: true,
          message: 'No trades to settle',
          tradeCount: 0,
        };
      }

      console.log(`[SettlementCoordinator] Calculated net positions for ${tradeCount} trades`);
      console.log(`[SettlementCoordinator] Total volume: ${totalVolume} USDC`);
      console.log(`[SettlementCoordinator] Net positions count: ${positions.length}`);

      // Step 2: Get next batch ID
      const latestBatchId = await SettlementBatch.getLatestBatchId();
      const batchId = latestBatchId + 1;

      // Step 3: Format positions for contract (convert to wei)
      const formattedPositions = NettingCalculator.formatForContract(positions);

      // Step 4: Sign positions
      const windowEndTimestamp = Math.floor(windowEnd.getTime() / 1000);
      const { positionsHash, signature } = await this.signatureService.signPositions(
        batchId,
        windowEndTimestamp,
        formattedPositions
      );

      console.log(`[SettlementCoordinator] Signed batch ${batchId}`);
      console.log(`[SettlementCoordinator] Positions hash: ${positionsHash}`);

      // Step 5: Save to database
      const batch = await SettlementBatch.create({
        batchId,
        windowStart,
        windowEnd,
        positions: formattedPositions,
        positionsHash,
        signature,
      });

      console.log(`[SettlementCoordinator] Saved batch ${batchId} to database`);

      // Step 6: Update trade statuses
      for (const tradeId of tradeIds) {
        await Trade.updateStatus(tradeId, batchId, 'processing');
      }

      // Step 7: Submit to ClearingHouse contract (if configured)
      let txHash = null;
      if (this.clearingHouse) {
        try {
          const tx = await this.clearingHouse.submitNetPositions(
            batchId,
            windowEndTimestamp,
            formattedPositions,
            signature
          );

          console.log(`[SettlementCoordinator] Submitted to ClearingHouse. TX: ${tx.hash}`);
          
          // Wait for confirmation
          const receipt = await tx.wait();
          txHash = receipt.transactionHash;

          console.log(`[SettlementCoordinator] Transaction confirmed: ${txHash}`);

          // Update batch with tx hash
          await SettlementBatch.updateStatus(batchId, 'submitted', txHash);
        } catch (error) {
          console.error(`[SettlementCoordinator] Failed to submit to contract:`, error);
          await SettlementBatch.updateStatus(batchId, 'failed');
          throw error;
        }
      } else {
        console.log('[SettlementCoordinator] Skipping contract submission (not configured)');
      }

      return {
        success: true,
        batchId,
        tradeCount,
        positionsCount: positions.length,
        totalVolume,
        txHash,
        positionsHash,
      };
    } catch (error) {
      console.error('[SettlementCoordinator] Settlement failed:', error);
      throw error;
    }
  }

  /**
   * Run settlement for the last hour
   * @returns {Promise<Object>} Settlement result
   */
  async runHourlySettlement() {
    const now = new Date();
    const windowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0);
    const windowStart = new Date(windowEnd.getTime() - 60 * 60 * 1000); // 1 hour before

    return this.runSettlement(windowStart, windowEnd);
  }

  /**
   * Settle a batch on-chain (call settle function)
   * @param {number} batchId - Batch ID to settle
   * @returns {Promise<Object>} Settlement result
   */
  async settleBatch(batchId) {
    if (!this.clearingHouse) {
      throw new Error('ClearingHouse contract not configured');
    }

    const batch = await SettlementBatch.getById(batchId);
    if (!batch) {
      throw new Error(`Batch ${batchId} not found`);
    }

    if (batch.status === 'settled') {
      throw new Error(`Batch ${batchId} is already settled`);
    }

    try {
      const positions = JSON.parse(batch.positions);
      
      const tx = await this.clearingHouse.settle(batchId, positions);
      console.log(`[SettlementCoordinator] Settling batch ${batchId}. TX: ${tx.hash}`);

      const receipt = await tx.wait();
      console.log(`[SettlementCoordinator] Batch ${batchId} settled. TX: ${receipt.transactionHash}`);

      // Update batch status
      await SettlementBatch.updateStatus(batchId, 'settled', receipt.transactionHash);

      // Update trade statuses
      const trades = await Trade.getByBatchId(batchId);
      for (const trade of trades) {
        await Trade.updateStatus(trade.trade_id, batchId, 'settled');
      }

      return {
        success: true,
        batchId,
        txHash: receipt.transactionHash,
      };
    } catch (error) {
      console.error(`[SettlementCoordinator] Failed to settle batch ${batchId}:`, error);
      await SettlementBatch.updateStatus(batchId, 'failed');
      throw error;
    }
  }
}

module.exports = SettlementCoordinator;
