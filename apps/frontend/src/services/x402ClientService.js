import { ethers } from 'ethers';

/**
 * X402 Client Service
 * 
 * Implements the X402 open payment protocol for pay-per-call micro-transactions.
 * Based on HTTP 402 Payment Required and EIP-3009 transferWithAuthorization.
 * 
 * @see https://x402.org
 * @see https://eips.ethereum.org/EIPS/eip-3009
 */
class X402ClientService {
  constructor(provider, signer) {
    this.provider = provider;
    this.signer = signer;
    this.chainId = null;
  }

  /**
   * Initialize the service with chain ID
   */
  async initialize() {
    const network = await this.provider.getNetwork();
    this.chainId = network.chainId;
  }

  /**
   * Parse HTTP 402 response to extract payment challenge
   * 
   * @param {Response} response - HTTP 402 response
   * @returns {Object} Payment challenge details
   */
  parseChallenge(response) {
    try {
      // Try to parse from WWW-Authenticate header
      const wwwAuth = response.headers.get('WWW-Authenticate');
      if (wwwAuth && wwwAuth.startsWith('x402 ')) {
        const challengeStr = wwwAuth.substring(5);
        return this.decodeChallenge(challengeStr);
      }

      // Fallback: parse from response body
      const body = response.json();
      return body.challenge || null;
    } catch (error) {
      console.error('Failed to parse challenge:', error);
      return null;
    }
  }

  /**
   * Decode challenge string to object
   * 
   * @param {string} challengeStr - Encoded challenge string
   * @returns {Object} Challenge object
   */
  decodeChallenge(challengeStr) {
    const params = new URLSearchParams(challengeStr);
    return {
      amount: params.get('amount'),
      nonce: params.get('nonce'),
      expiry: parseInt(params.get('expiry')),
      receiver: params.get('receiver'),
      token: params.get('token'),
      validAfter: parseInt(params.get('validAfter') || '0')
    };
  }

  /**
   * Generate EIP-3009 signature for payment authorization
   * 
   * @param {Object} challenge - Payment challenge
   * @returns {Promise<string>} Signature
   */
  async signAuthorization(challenge) {
    if (!this.signer) {
      throw new Error('Signer not available');
    }

    const signerAddress = await this.signer.getAddress();

    // EIP-712 Domain
    const domain = {
      name: 'USD Coin',
      version: '2',
      chainId: this.chainId || 84532, // Base Sepolia default
      verifyingContract: challenge.token
    };

    // EIP-3009 TransferWithAuthorization type
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

    // Message value
    const value = {
      from: signerAddress,
      to: challenge.receiver,
      value: challenge.amount,
      validAfter: challenge.validAfter || 0,
      validBefore: challenge.expiry,
      nonce: challenge.nonce
    };

    try {
      // Sign typed data (EIP-712)
      const signature = await this.signer._signTypedData(domain, types, value);
      return signature;
    } catch (error) {
      console.error('Failed to sign authorization:', error);
      throw error;
    }
  }

  /**
   * Retry request with payment authorization
   * 
   * @param {string} url - API endpoint URL
   * @param {string} signature - Payment authorization signature
   * @param {Object} options - Fetch options
   * @returns {Promise<Response>} API response
   */
  async retryWithAuthorization(url, signature, options = {}) {
    const headers = {
      ...options.headers,
      'Authorization': `x402 ${signature}`
    };

    return fetch(url, {
      ...options,
      headers
    });
  }

  /**
   * Make an X402-enabled API call
   * Automatically handles 402 responses and retries with payment
   * 
   * @param {string} url - API endpoint URL
   * @param {Object} options - Fetch options
   * @returns {Promise<Response>} API response
   */
  async call(url, options = {}) {
    // Initial request
    const response = await fetch(url, options);

    // Check if payment is required
    if (response.status === 402) {
      console.log('Payment required for:', url);

      // Parse challenge
      const challenge = this.parseChallenge(response);
      if (!challenge) {
        throw new Error('Failed to parse payment challenge');
      }

      console.log('Payment challenge:', challenge);

      // Sign authorization
      const signature = await this.signAuthorization(challenge);
      console.log('Payment authorization signed');

      // Retry with authorization
      const finalResponse = await this.retryWithAuthorization(url, signature, options);
      console.log('Request completed with payment');

      return finalResponse;
    }

    // No payment required, return original response
    return response;
  }

  /**
   * Check if authorization is still valid
   * 
   * @param {Object} challenge - Payment challenge
   * @returns {boolean} True if valid
   */
  isAuthorizationValid(challenge) {
    const now = Math.floor(Date.now() / 1000);
    return now < challenge.expiry;
  }

  /**
   * Format amount for display
   * 
   * @param {string} amount - Amount in token's smallest unit
   * @param {number} decimals - Token decimals (default: 6 for USDC)
   * @returns {string} Formatted amount
   */
  formatAmount(amount, decimals = 6) {
    return ethers.utils.formatUnits(amount, decimals);
  }
}

export default X402ClientService;
