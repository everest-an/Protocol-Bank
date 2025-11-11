const { ethers } = require('ethers');
const crypto = require('crypto');

/**
 * X402 Middleware
 * 
 * Implements HTTP 402 Payment Required for API endpoints.
 * Validates EIP-3009 payment authorizations.
 * 
 * @see https://x402.org
 * @see https://eips.ethereum.org/EIPS/eip-3009
 */

// Configuration
const USDC_BASE_SEPOLIA = process.env.USDC_BASE_SEPOLIA || '0x036CbD53842c5426634e7929541eC2318f3dCF7e'; // Base Sepolia USDC
const RECEIVER_ADDRESS = process.env.X402_RECEIVER_ADDRESS || process.env.WALLET_ADDRESS;
const DEFAULT_EXPIRY = 3600; // 1 hour

// In-memory nonce store (should be replaced with Redis in production)
const usedNonces = new Set();

/**
 * Generate a unique nonce
 * 
 * @returns {string} Hex-encoded nonce (bytes32)
 */
function generateNonce() {
  return '0x' + crypto.randomBytes(32).toString('hex');
}

/**
 * Encode challenge as query string
 * 
 * @param {Object} challenge - Payment challenge
 * @returns {string} Encoded challenge
 */
function encodeChallenge(challenge) {
  const params = new URLSearchParams({
    amount: challenge.amount,
    nonce: challenge.nonce,
    expiry: challenge.expiry.toString(),
    receiver: challenge.receiver,
    token: challenge.token,
    validAfter: (challenge.validAfter || 0).toString()
  });
  return params.toString();
}

/**
 * Verify EIP-3009 signature
 * 
 * @param {string} signature - Hex-encoded signature
 * @param {Object} authorization - Authorization details
 * @returns {Promise<boolean>} True if valid
 */
async function verifySignature(signature, authorization) {
  try {
    const { from, to, value, validAfter, validBefore, nonce, token, chainId } = authorization;

    // EIP-712 Domain
    const domain = {
      name: 'USD Coin',
      version: '2',
      chainId: chainId || 84532,
      verifyingContract: token
    };

    // EIP-3009 type
    const types = {
      TransferWithAuthorization: [
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'validAfter', type: 'uint256' },
        { name: 'validBefore', type: 'uint256' },
        { name: 'nonce', type: 'bytes32' }
      ]
    };

    // Message
    const message = {
      from,
      to,
      value,
      validAfter: validAfter || 0,
      validBefore,
      nonce
    };

    // Recover signer
    const recoveredAddress = ethers.utils.verifyTypedData(domain, types, message, signature);

    // Verify signer matches 'from' address
    return recoveredAddress.toLowerCase() === from.toLowerCase();
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

/**
 * Check if nonce has been used
 * 
 * @param {string} nonce - Nonce to check
 * @returns {boolean} True if already used
 */
function isNonceUsed(nonce) {
  return usedNonces.has(nonce);
}

/**
 * Mark nonce as used
 * 
 * @param {string} nonce - Nonce to mark
 */
function markNonceUsed(nonce) {
  usedNonces.add(nonce);
  
  // Clean up old nonces after 24 hours (simple implementation)
  setTimeout(() => {
    usedNonces.delete(nonce);
  }, 24 * 60 * 60 * 1000);
}

/**
 * Store authorization in database
 * 
 * @param {Object} authorization - Authorization details
 * @param {string} signature - Signature
 * @returns {Promise<void>}
 */
async function storeAuthorization(authorization, signature) {
  // TODO: Implement database storage
  // INSERT INTO x402_payments (nonce, signer, receiver, amount, token, expiry, signature, status)
  console.log('Storing authorization:', { authorization, signature });
}

/**
 * Trigger settlement via relayer service
 * 
 * @param {Object} authorization - Authorization details
 * @param {string} signature - Signature
 * @returns {Promise<void>}
 */
async function triggerSettlement(authorization, signature) {
  // TODO: Implement relayer service call
  // This should add the authorization to a queue for batch settlement
  console.log('Triggering settlement:', { authorization, signature });
  
  // For now, just store it
  await storeAuthorization(authorization, signature);
}

/**
 * X402 Middleware Factory
 * 
 * @param {Object} pricing - Pricing configuration
 * @param {string} pricing.amount - Amount in token's smallest unit
 * @param {string} pricing.token - Token contract address (optional)
 * @param {number} pricing.expiry - Expiry duration in seconds (optional)
 * @returns {Function} Express middleware
 */
function x402Middleware(pricing = {}) {
  return async (req, res, next) => {
    try {
      // 1. Check if Authorization header exists
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('x402 ')) {
        // 2. No payment provided, return 402 Payment Required
        const nonce = generateNonce();
        const expiry = Math.floor(Date.now() / 1000) + (pricing.expiry || DEFAULT_EXPIRY);

        const challenge = {
          amount: pricing.amount || '1000000', // Default: 1 USDC (6 decimals)
          nonce: nonce,
          expiry: expiry,
          receiver: RECEIVER_ADDRESS,
          token: pricing.token || USDC_BASE_SEPOLIA,
          validAfter: 0
        };

        // Store challenge in request for later verification
        req.x402Challenge = challenge;

        // Return 402 with payment requirements
        return res.status(402)
          .set({
            'WWW-Authenticate': `x402 ${encodeChallenge(challenge)}`,
            'Accept-Token': `USDC:${challenge.token}`
          })
          .json({
            error: 'Payment required',
            message: 'This API endpoint requires payment',
            challenge: challenge
          });
      }

      // 3. Extract signature from Authorization header
      const signature = authHeader.substring(5).trim();

      // 4. Parse authorization details from request body or query
      const authorization = req.body.authorization || req.query.authorization;
      if (!authorization) {
        return res.status(400).json({
          error: 'Bad request',
          message: 'Authorization details missing'
        });
      }

      // 5. Check nonce hasn't been used (prevent replay attack)
      if (isNonceUsed(authorization.nonce)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Nonce already used (replay attack detected)'
        });
      }

      // 6. Check expiry
      const now = Math.floor(Date.now() / 1000);
      if (now >= authorization.validBefore) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Payment authorization expired'
        });
      }

      // 7. Verify signature
      const isValid = await verifySignature(signature, authorization);
      if (!isValid) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Invalid payment authorization signature'
        });
      }

      // 8. Mark nonce as used
      markNonceUsed(authorization.nonce);

      // 9. Trigger settlement (async, don't block request)
      triggerSettlement(authorization, signature).catch(error => {
        console.error('Settlement trigger failed:', error);
      });

      // 10. Attach payment info to request
      req.x402Payment = {
        from: authorization.from,
        amount: authorization.value,
        token: authorization.token,
        nonce: authorization.nonce,
        signature: signature
      };

      // 11. Allow access to resource
      next();
    } catch (error) {
      console.error('X402 middleware error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Payment processing failed'
      });
    }
  };
}

module.exports = {
  x402Middleware,
  generateNonce,
  verifySignature,
  isNonceUsed,
  markNonceUsed
};
