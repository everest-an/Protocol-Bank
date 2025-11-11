const { ethers } = require('ethers');
const EventEmitter = require('events');

/**
 * X402 Relayer Service
 * 
 * Handles batch settlement of X402 payment authorizations.
 * Aggregates multiple authorizations and submits them to the blockchain
 * in a single transaction to minimize gas costs.
 * 
 * @extends EventEmitter
 */
class X402RelayerService extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Configuration
    this.batchSize = config.batchSize || 50; // Max authorizations per batch
    this.batchInterval = config.batchInterval || 60000; // 1 minute
    this.minBatchSize = config.minBatchSize || 5; // Minimum to trigger immediate batch
    
    // State
    this.pendingAuthorizations = [];
    this.isProcessing = false;
    this.batchTimer = null;
    
    // Blockchain connection
    this.provider = null;
    this.signer = null;
    this.contract = null;
    
    // Statistics
    this.stats = {
      totalBatches: 0,
      totalPayments: 0,
      totalGasSaved: 0,
      failedBatches: 0
    };
  }

  /**
   * Initialize the relayer service
   * 
   * @param {Object} provider - Ethers provider
   * @param {Object} signer - Ethers signer
   * @param {string} contractAddress - Batch settlement contract address
   * @param {Object} contractABI - Contract ABI
   */
  async initialize(provider, signer, contractAddress, contractABI) {
    this.provider = provider;
    this.signer = signer;
    this.contract = new ethers.Contract(contractAddress, contractABI, signer);
    
    console.log('X402 Relayer Service initialized');
    console.log('Contract:', contractAddress);
    console.log('Signer:', await signer.getAddress());
    
    // Start batch settlement timer
    this.startBatchSettlement();
  }

  /**
   * Add a payment authorization to the pending queue
   * 
   * @param {Object} authorization - Payment authorization details
   * @param {string} signature - EIP-3009 signature
   * @returns {Promise<void>}
   */
  async addAuthorization(authorization, signature) {
    // Parse signature into v, r, s
    const sig = ethers.utils.splitSignature(signature);
    
    const payment = {
      from: authorization.from,
      to: authorization.to,
      value: authorization.value,
      validAfter: authorization.validAfter || 0,
      validBefore: authorization.validBefore,
      nonce: authorization.nonce,
      v: sig.v,
      r: sig.r,
      s: sig.s,
      token: authorization.token,
      signature: signature,
      addedAt: Date.now()
    };
    
    this.pendingAuthorizations.push(payment);
    
    console.log(`Added authorization to queue. Queue size: ${this.pendingAuthorizations.length}`);
    
    // Emit event
    this.emit('authorizationAdded', payment);
    
    // If queue reaches minimum batch size, trigger immediate settlement
    if (this.pendingAuthorizations.length >= this.minBatchSize && !this.isProcessing) {
      console.log('Minimum batch size reached, triggering immediate settlement');
      await this.batchSettle();
    }
  }

  /**
   * Process batch settlement
   * 
   * @returns {Promise<Object>} Settlement result
   */
  async batchSettle() {
    if (this.isProcessing) {
      console.log('Batch settlement already in progress, skipping');
      return null;
    }

    if (this.pendingAuthorizations.length === 0) {
      console.log('No pending authorizations to settle');
      return null;
    }

    this.isProcessing = true;

    try {
      // Take up to batchSize authorizations
      const batch = this.pendingAuthorizations.splice(0, this.batchSize);
      console.log(`Processing batch of ${batch.length} authorizations`);

      // Create batch record in database
      const batchId = await this.createBatchRecord(batch);

      // Prepare contract call parameters
      const froms = batch.map(p => p.from);
      const tos = batch.map(p => p.to);
      const values = batch.map(p => p.value);
      const validAfters = batch.map(p => p.validAfter);
      const validBefores = batch.map(p => p.validBefore);
      const nonces = batch.map(p => p.nonce);
      const vs = batch.map(p => p.v);
      const rs = batch.map(p => p.r);
      const ss = batch.map(p => p.s);

      // Estimate gas
      const gasEstimate = await this.contract.estimateGas.batchTransferWithAuthorization(
        froms, tos, values, validAfters, validBefores, nonces, vs, rs, ss
      );

      console.log(`Estimated gas: ${gasEstimate.toString()}`);

      // Submit transaction
      const tx = await this.contract.batchTransferWithAuthorization(
        froms, tos, values, validAfters, validBefores, nonces, vs, rs, ss,
        {
          gasLimit: gasEstimate.mul(120).div(100) // 20% buffer
        }
      );

      console.log(`Batch transaction submitted: ${tx.hash}`);

      // Update batch record
      await this.updateBatchRecord(batchId, {
        status: 'submitted',
        tx_hash: tx.hash,
        submitted_at: new Date()
      });

      // Emit event
      this.emit('batchSubmitted', {
        batchId,
        txHash: tx.hash,
        paymentCount: batch.length
      });

      // Wait for confirmation
      const receipt = await tx.wait();

      console.log(`Batch transaction confirmed: ${tx.hash}`);
      console.log(`Gas used: ${receipt.gasUsed.toString()}`);

      // Update batch record
      await this.updateBatchRecord(batchId, {
        status: 'confirmed',
        gas_used: receipt.gasUsed.toString(),
        gas_price: receipt.effectiveGasPrice.toString(),
        confirmed_at: new Date()
      });

      // Update payment records
      await this.updatePaymentRecords(batch, batchId, tx.hash);

      // Update statistics
      this.stats.totalBatches++;
      this.stats.totalPayments += batch.length;
      this.stats.totalGasSaved += this.calculateGasSaved(batch.length, receipt.gasUsed);

      // Emit event
      this.emit('batchConfirmed', {
        batchId,
        txHash: tx.hash,
        paymentCount: batch.length,
        gasUsed: receipt.gasUsed.toString()
      });

      return {
        success: true,
        batchId,
        txHash: tx.hash,
        paymentCount: batch.length,
        gasUsed: receipt.gasUsed.toString()
      };

    } catch (error) {
      console.error('Batch settlement failed:', error);

      this.stats.failedBatches++;

      // Emit error event
      this.emit('batchFailed', {
        error: error.message,
        paymentCount: this.pendingAuthorizations.length
      });

      // TODO: Implement retry logic or move failed batch to dead letter queue

      return {
        success: false,
        error: error.message
      };

    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Start automatic batch settlement timer
   */
  startBatchSettlement() {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }

    this.batchTimer = setInterval(() => {
      this.batchSettle().catch(error => {
        console.error('Scheduled batch settlement failed:', error);
      });
    }, this.batchInterval);

    console.log(`Batch settlement timer started (interval: ${this.batchInterval}ms)`);
  }

  /**
   * Stop automatic batch settlement timer
   */
  stopBatchSettlement() {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
      console.log('Batch settlement timer stopped');
    }
  }

  /**
   * Calculate gas saved by batching
   * 
   * @param {number} paymentCount - Number of payments in batch
   * @param {BigNumber} actualGasUsed - Actual gas used
   * @returns {BigNumber} Gas saved
   */
  calculateGasSaved(paymentCount, actualGasUsed) {
    // Assume individual transfer costs ~50k gas
    const individualGas = ethers.BigNumber.from(50000).mul(paymentCount);
    return individualGas.sub(actualGasUsed);
  }

  /**
   * Create batch record in database
   * 
   * @param {Array} batch - Batch of payments
   * @returns {Promise<number>} Batch ID
   */
  async createBatchRecord(batch) {
    // TODO: Implement database insertion
    const totalAmount = batch.reduce((sum, p) => {
      return sum.add(ethers.BigNumber.from(p.value));
    }, ethers.BigNumber.from(0));

    console.log('Creating batch record:', {
      payment_count: batch.length,
      total_amount: totalAmount.toString(),
      token: batch[0].token
    });

    // Mock implementation
    return Date.now();
  }

  /**
   * Update batch record in database
   * 
   * @param {number} batchId - Batch ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<void>}
   */
  async updateBatchRecord(batchId, updates) {
    // TODO: Implement database update
    console.log('Updating batch record:', batchId, updates);
  }

  /**
   * Update payment records in database
   * 
   * @param {Array} batch - Batch of payments
   * @param {number} batchId - Batch ID
   * @param {string} txHash - Transaction hash
   * @returns {Promise<void>}
   */
  async updatePaymentRecords(batch, batchId, txHash) {
    // TODO: Implement database update
    console.log('Updating payment records:', {
      count: batch.length,
      batchId,
      txHash
    });
  }

  /**
   * Get relayer statistics
   * 
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      ...this.stats,
      pendingCount: this.pendingAuthorizations.length,
      isProcessing: this.isProcessing
    };
  }

  /**
   * Get pending authorizations count
   * 
   * @returns {number} Count
   */
  getPendingCount() {
    return this.pendingAuthorizations.length;
  }

  /**
   * Shutdown the relayer service
   */
  shutdown() {
    this.stopBatchSettlement();
    this.removeAllListeners();
    console.log('X402 Relayer Service shutdown');
  }
}

module.exports = X402RelayerService;
