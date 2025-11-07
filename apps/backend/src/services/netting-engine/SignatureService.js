const { ethers } = require('ethers');

/**
 * SignatureService
 * Handles ECDSA signing of net positions for ClearingHouse.sol
 */
class SignatureService {
  constructor() {
    // Initialize wallet from environment variable
    const privateKey = process.env.NETTING_ENGINE_PRIVATE_KEY;
    
    if (!privateKey) {
      throw new Error('NETTING_ENGINE_PRIVATE_KEY environment variable is not set');
    }

    this.wallet = new ethers.Wallet(privateKey);
    console.log(`[SignatureService] Initialized with address: ${this.wallet.address}`);
  }

  /**
   * Calculate positions hash
   * @param {Array} positions - Array of {participant, amount}
   * @returns {string} Keccak256 hash of positions
   */
  calculatePositionsHash(positions) {
    // Encode positions using ABI encoding
    const encoded = ethers.utils.defaultAbiCoder.encode(
      ['tuple(address participant, int256 amount)[]'],
      [positions]
    );

    return ethers.utils.keccak256(encoded);
  }

  /**
   * Sign net positions
   * @param {number} batchId - Settlement batch ID
   * @param {number} windowEnd - Window end timestamp (Unix seconds)
   * @param {Array} positions - Array of {participant, amount}
   * @returns {Promise<Object>} Signature data
   */
  async signPositions(batchId, windowEnd, positions) {
    // Calculate positions hash
    const positionsHash = this.calculatePositionsHash(positions);

    // Calculate message hash (same as in ClearingHouse.sol)
    const messageHash = ethers.utils.solidityKeccak256(
      ['uint256', 'uint256', 'bytes32'],
      [batchId, windowEnd, positionsHash]
    );

    // Sign the message hash
    const messageHashBytes = ethers.utils.arrayify(messageHash);
    const signature = await this.wallet.signMessage(messageHashBytes);

    return {
      positionsHash,
      messageHash,
      signature,
      signer: this.wallet.address,
    };
  }

  /**
   * Verify signature (for testing)
   * @param {number} batchId - Settlement batch ID
   * @param {number} windowEnd - Window end timestamp
   * @param {Array} positions - Array of {participant, amount}
   * @param {string} signature - Signature to verify
   * @returns {string} Recovered signer address
   */
  verifySignature(batchId, windowEnd, positions, signature) {
    const positionsHash = this.calculatePositionsHash(positions);
    
    const messageHash = ethers.utils.solidityKeccak256(
      ['uint256', 'uint256', 'bytes32'],
      [batchId, windowEnd, positionsHash]
    );

    const messageHashBytes = ethers.utils.arrayify(messageHash);
    const recoveredAddress = ethers.utils.verifyMessage(messageHashBytes, signature);

    return recoveredAddress;
  }

  /**
   * Get signer address
   * @returns {string} Signer address
   */
  getAddress() {
    return this.wallet.address;
  }
}

module.exports = SignatureService;
