const { pool } = require('../../config/database');
const { v4: uuidv4 } = require('uuid');

/**
 * Trade Model
 * Represents a trade instruction from a participant
 */
class Trade {
  /**
   * Create a new trade
   * @param {Object} tradeData - Trade data
   * @returns {Promise<Object>} Created trade
   */
  static async create(tradeData) {
    const {
      tradeId = uuidv4(),
      payerAddress,
      receiverAddress,
      amount,
      currency = 'USDC',
    } = tradeData;

    const query = `
      INSERT INTO trades (trade_id, payer_address, receiver_address, amount, currency)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [tradeId, payerAddress, receiverAddress, amount, currency];

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error(`Trade with ID ${tradeId} already exists`);
      }
      throw error;
    }
  }

  /**
   * Get trades by status
   * @param {string} status - Trade status
   * @returns {Promise<Array>} List of trades
   */
  static async getByStatus(status) {
    const query = `
      SELECT * FROM trades
      WHERE status = $1
      ORDER BY created_at ASC
    `;

    const result = await pool.query(query, [status]);
    return result.rows;
  }

  /**
   * Get trades for a settlement window
   * @param {Date} windowStart - Window start time
   * @param {Date} windowEnd - Window end time
   * @returns {Promise<Array>} List of trades
   */
  static async getByWindow(windowStart, windowEnd) {
    const query = `
      SELECT * FROM trades
      WHERE status = 'pending'
        AND created_at >= $1
        AND created_at < $2
      ORDER BY created_at ASC
    `;

    const result = await pool.query(query, [windowStart, windowEnd]);
    return result.rows;
  }

  /**
   * Update trade status and batch ID
   * @param {string} tradeId - Trade ID
   * @param {number} batchId - Settlement batch ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated trade
   */
  static async updateStatus(tradeId, batchId, status) {
    const query = `
      UPDATE trades
      SET settlement_batch_id = $1,
          status = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE trade_id = $3
      RETURNING *
    `;

    const result = await pool.query(query, [batchId, status, tradeId]);
    return result.rows[0];
  }

  /**
   * Get trade by ID
   * @param {string} tradeId - Trade ID
   * @returns {Promise<Object>} Trade
   */
  static async getById(tradeId) {
    const query = `SELECT * FROM trades WHERE trade_id = $1`;
    const result = await pool.query(query, [tradeId]);
    return result.rows[0];
  }

  /**
   * Get trades by batch ID
   * @param {number} batchId - Settlement batch ID
   * @returns {Promise<Array>} List of trades
   */
  static async getByBatchId(batchId) {
    const query = `
      SELECT * FROM trades
      WHERE settlement_batch_id = $1
      ORDER BY created_at ASC
    `;

    const result = await pool.query(query, [batchId]);
    return result.rows;
  }

  /**
   * Get trade statistics
   * @returns {Promise<Object>} Trade statistics
   */
  static async getStatistics() {
    const query = `
      SELECT
        COUNT(*) as total_trades,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_trades,
        COUNT(CASE WHEN status = 'settled' THEN 1 END) as settled_trades,
        SUM(amount) as total_volume
      FROM trades
    `;

    const result = await pool.query(query);
    return result.rows[0];
  }
}

module.exports = Trade;
