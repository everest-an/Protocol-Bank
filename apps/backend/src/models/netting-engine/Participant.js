const { pool } = require('../../config/database');

/**
 * Participant Model
 * Caches participant information from ClearingHouse.sol
 */
class Participant {
  /**
   * Create or update a participant
   * @param {Object} participantData - Participant data
   * @returns {Promise<Object>} Created/updated participant
   */
  static async upsert(participantData) {
    const { address, name, registeredAt } = participantData;

    const query = `
      INSERT INTO participants (address, name, registered_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (address)
      DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const values = [address, name, registeredAt];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Get participant by address
   * @param {string} address - Participant address
   * @returns {Promise<Object>} Participant
   */
  static async getByAddress(address) {
    const query = `SELECT * FROM participants WHERE address = $1`;
    const result = await pool.query(query, [address]);
    return result.rows[0];
  }

  /**
   * Get all active participants
   * @returns {Promise<Array>} List of participants
   */
  static async getAll() {
    const query = `
      SELECT * FROM participants
      WHERE is_active = TRUE
      ORDER BY registered_at ASC
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Deactivate a participant
   * @param {string} address - Participant address
   * @returns {Promise<Object>} Updated participant
   */
  static async deactivate(address) {
    const query = `
      UPDATE participants
      SET is_active = FALSE,
          updated_at = CURRENT_TIMESTAMP
      WHERE address = $1
      RETURNING *
    `;

    const result = await pool.query(query, [address]);
    return result.rows[0];
  }

  /**
   * Check if participant exists and is active
   * @param {string} address - Participant address
   * @returns {Promise<boolean>} True if exists and active
   */
  static async isActive(address) {
    const query = `
      SELECT is_active FROM participants
      WHERE address = $1
    `;

    const result = await pool.query(query, [address]);
    return result.rows[0]?.is_active || false;
  }

  /**
   * Get participant count
   * @returns {Promise<number>} Number of active participants
   */
  static async getCount() {
    const query = `
      SELECT COUNT(*) as count
      FROM participants
      WHERE is_active = TRUE
    `;

    const result = await pool.query(query);
    return parseInt(result.rows[0].count);
  }
}

module.exports = Participant;
