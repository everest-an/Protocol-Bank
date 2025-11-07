const Trade = require('../../models/netting-engine/Trade');

/**
 * NettingCalculator Service
 * Calculates net positions from a list of trades
 */
class NettingCalculator {
  /**
   * Calculate net positions for a settlement window
   * @param {Date} windowStart - Window start time
   * @param {Date} windowEnd - Window end time
   * @returns {Promise<Object>} Net positions and trade IDs
   */
  static async calculateNetPositions(windowStart, windowEnd) {
    // Get all pending trades in the window
    const trades = await Trade.getByWindow(windowStart, windowEnd);

    if (trades.length === 0) {
      return {
        positions: [],
        tradeIds: [],
        tradeCount: 0,
        totalVolume: '0',
      };
    }

    // Calculate net positions using a Map
    const netPositionsMap = new Map();

    for (const trade of trades) {
      const { payer_address, receiver_address, amount } = trade;

      // Deduct from payer
      const payerCurrent = netPositionsMap.get(payer_address) || 0;
      netPositionsMap.set(payer_address, payerCurrent - parseFloat(amount));

      // Add to receiver
      const receiverCurrent = netPositionsMap.get(receiver_address) || 0;
      netPositionsMap.set(receiver_address, receiverCurrent + parseFloat(amount));
    }

    // Convert Map to array format
    const positions = [];
    for (const [participant, amount] of netPositionsMap.entries()) {
      // Only include non-zero positions
      if (Math.abs(amount) > 0.000001) {
        positions.push({
          participant,
          amount: amount.toFixed(6), // Keep 6 decimal places for USDC
        });
      }
    }

    // Verify zero-sum constraint
    const sum = positions.reduce((acc, pos) => acc + parseFloat(pos.amount), 0);
    
    if (Math.abs(sum) > 0.01) {
      throw new Error(
        `Net positions do not sum to zero! Sum: ${sum}. This indicates a critical calculation error.`
      );
    }

    // Calculate total volume
    const totalVolume = trades.reduce((acc, trade) => acc + parseFloat(trade.amount), 0);

    return {
      positions,
      tradeIds: trades.map((t) => t.trade_id),
      tradeCount: trades.length,
      totalVolume: totalVolume.toFixed(6),
    };
  }

  /**
   * Validate net positions
   * @param {Array} positions - Array of {participant, amount}
   * @returns {boolean} True if valid
   */
  static validatePositions(positions) {
    if (!Array.isArray(positions) || positions.length === 0) {
      return false;
    }

    // Check zero-sum constraint
    const sum = positions.reduce((acc, pos) => {
      if (!pos.participant || pos.amount === undefined) {
        throw new Error('Invalid position format');
      }
      return acc + parseFloat(pos.amount);
    }, 0);

    return Math.abs(sum) < 0.01;
  }

  /**
   * Format positions for smart contract
   * Converts amounts to wei (18 decimals)
   * @param {Array} positions - Array of {participant, amount}
   * @returns {Array} Formatted positions
   */
  static formatForContract(positions) {
    return positions.map((pos) => ({
      participant: pos.participant,
      amount: this.toWei(pos.amount),
    }));
  }

  /**
   * Convert amount to wei (multiply by 10^6 for USDC)
   * @param {string|number} amount - Amount in USDC
   * @returns {string} Amount in wei
   */
  static toWei(amount) {
    const amountFloat = parseFloat(amount);
    const amountWei = Math.round(amountFloat * 1e6); // USDC has 6 decimals
    return amountWei.toString();
  }

  /**
   * Convert amount from wei to USDC
   * @param {string|number} amountWei - Amount in wei
   * @returns {string} Amount in USDC
   */
  static fromWei(amountWei) {
    const amount = parseFloat(amountWei) / 1e6;
    return amount.toFixed(6);
  }
}

module.exports = NettingCalculator;
