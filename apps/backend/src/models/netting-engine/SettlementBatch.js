const { pool } = require('../../config/database');

/**
 * SettlementBatch Model
 * Represents a settlement batch with calculated net positions
 */
class SettlementBatch {
  /**
   * Create a new settlement batch
   * @param {Object} batchData - Batch data
   * @returns {Promise<Object>} Created batch
   */
  static async create(batchData) {
    const {
      batchId,
      windowStart,
      windowEnd,
      positions,
      positionsHash,
      signature,
    } = batchData;

    const query = `
      INSERT INTO settlement_batches
        (batch_id, window_start, window_end, positions, positions_hash, signature, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'submitted')
      RETURNING *
    `;

    const values = [
      batchId,
      windowStart,
      windowEnd,
      JSON.stringify(positions),
      positionsHash,
      signature,
    ];

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error(`Batch with ID ${batchId} already exists`);
      }
      throw error;
    }
  }

  /**
   * Get batch by ID
   * @param {number} batchId - Batch ID
   * @returns {Promise<Object>} Batch
   */
  static async getById(batchId) {
    const query = `SELECT * FROM settlement_batches WHERE batch_id = $1`;
    const result = await pool.query(query, [batchId]);
    return result.rows[0];
  }

  /**
   * Get batches by status
   * @param {string} status - Batch status
   * @returns {Promise<Array>} List of batches
   */
  static async getByStatus(status) {
    const query = `
      SELECT * FROM settlement_batches
      WHERE status = $1
      ORDER BY window_end DESC
    `;

    const result = await pool.query(query, [status]);
    return result.rows;
  }

  /**
   * Update batch status and transaction hash
   * @param {number} batchId - Batch ID
   * @param {string} status - New status
   * @param {string} txHash - Transaction hash (optional)
   * @returns {Promise<Object>} Updated batch
   */
  static async updateStatus(batchId, status, txHash = null) {
    const query = `
      UPDATE settlement_batches
      SET status = $1,
          tx_hash = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE batch_id = $3
      RETURNING *
    `;

    const result = await pool.query(query, [status, txHash, batchId]);
    return result.rows[0];
  }

  /**
   * Get the latest batch ID
   * @returns {Promise<number>} Latest batch ID
   */
  static async getLatestBatchId() {
    const query = `
      SELECT MAX(batch_id) as max_batch_id
      FROM settlement_batches
    `;

    const result = await pool.query(query);
    return result.rows[0].max_batch_id || 0;
  }

  /**
   * Get recent batches with pagination
   * @param {number} limit - Number of batches to return
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Array>} List of batches
   */
  static async getRecent(limit = 10, offset = 0) {
    const query = `
      SELECT * FROM settlement_batches
      ORDER BY window_end DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await pool.query(query, [limit, offset]);
    return result.rows;
  }

  /**
   * Get batch statistics
   * @returns {Promise<Object>} Batch statistics
   */
  static async getStatistics() {
    const query = `
      SELECT
        COUNT(*) as total_batches,
        COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted_batches,
        COUNT(CASE WHEN status = 'settled' THEN 1 END) as settled_batches,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_batches
      FROM settlement_batches
    `;

    const result = await pool.query(query);
    return result.rows[0];
  }
}

module.exports = SettlementBatch;
