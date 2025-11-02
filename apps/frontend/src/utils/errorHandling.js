/**
 * Error Handling Utilities
 * Provides comprehensive error handling for Web3 and general errors
 */

/**
 * Parse Web3/Ethereum error messages
 * @param {Error} error - The error object
 * @returns {string} - User-friendly error message
 */
export function parseWeb3Error(error) {
  if (!error) {
    return 'An unknown error occurred';
  }
  
  const errorMessage = error.message || error.toString();
  
  // User rejected transaction
  if (errorMessage.includes('user rejected') || 
      errorMessage.includes('User denied') ||
      errorMessage.includes('rejected')) {
    return 'Transaction was rejected by user';
  }
  
  // Insufficient funds
  if (errorMessage.includes('insufficient funds') ||
      errorMessage.includes('insufficient balance')) {
    return 'Insufficient funds to complete transaction';
  }
  
  // Gas estimation failed
  if (errorMessage.includes('gas required exceeds') ||
      errorMessage.includes('out of gas')) {
    return 'Transaction would fail - please check your inputs';
  }
  
  // Network errors
  if (errorMessage.includes('network') ||
      errorMessage.includes('connection')) {
    return 'Network connection error - please try again';
  }
  
  // Contract revert reasons
  if (errorMessage.includes('execution reverted')) {
    // Try to extract revert reason
    const reasonMatch = errorMessage.match(/execution reverted: (.+)/);
    if (reasonMatch && reasonMatch[1]) {
      return `Transaction failed: ${reasonMatch[1]}`;
    }
    return 'Transaction failed - contract rejected the operation';
  }
  
  // Nonce too low
  if (errorMessage.includes('nonce too low')) {
    return 'Transaction nonce error - please refresh and try again';
  }
  
  // Already known
  if (errorMessage.includes('already known')) {
    return 'Transaction already pending - please wait';
  }
  
  // Replacement transaction underpriced
  if (errorMessage.includes('replacement transaction underpriced')) {
    return 'Transaction replacement failed - increase gas price';
  }
  
  // MetaMask specific errors
  if (errorMessage.includes('MetaMask')) {
    return 'MetaMask error - please check your wallet';
  }
  
  // Default: return first 100 characters of error
  return errorMessage.substring(0, 100);
}

/**
 * Handle async errors with try-catch wrapper
 * @param {Function} asyncFn - Async function to execute
 * @param {Function} errorHandler - Error handler callback
 * @returns {Function} - Wrapped function
 */
export function withErrorHandling(asyncFn, errorHandler) {
  return async (...args) => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      const friendlyMessage = parseWeb3Error(error);
      
      if (errorHandler) {
        errorHandler(friendlyMessage, error);
      } else {
        // // console.error('Error:', error);
        alert(friendlyMessage);
      }
      
      throw error; // Re-throw for caller to handle if needed
    }
  };
}

/**
 * Create error object with metadata
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @param {object} details - Additional details
 * @returns {object} - Structured error object
 */
export function createError(message, code = 'UNKNOWN_ERROR', details = {}) {
  return {
    message,
    code,
    details,
    timestamp: Date.now()
  };
}

/**
 * Log error to console (development only)
 * @param {string} context - Context where error occurred
 * @param {Error} error - The error object
 */
export function logError(context, error) {
  if (process.env.NODE_ENV === 'development') {
    // console.error(`[${context}]`, error);
  }
}

/**
 * Check if MetaMask is installed
 * @returns {boolean} - True if MetaMask is available
 */
export function isMetaMaskInstalled() {
  return typeof window !== 'undefined' && 
         typeof window.ethereum !== 'undefined' &&
         window.ethereum.isMetaMask;
}

/**
 * Check if user is on correct network
 * @param {number} expectedChainId - Expected chain ID
 * @returns {Promise<boolean>} - True if on correct network
 */
export async function isCorrectNetwork(expectedChainId) {
  if (!isMetaMaskInstalled()) {
    return false;
  }
  
  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    return parseInt(chainId, 16) === expectedChainId;
  } catch (error) {
    logError('isCorrectNetwork', error);
    return false;
  }
}

/**
 * Request network switch
 * @param {number} chainId - Target chain ID
 * @param {string} chainName - Chain name for display
 * @returns {Promise<boolean>} - True if successful
 */
export async function switchNetwork(chainId, chainName) {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed');
  }
  
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId.toString(16)}` }],
    });
    return true;
  } catch (error) {
    // This error code indicates that the chain has not been added to MetaMask
    if (error.code === 4902) {
      throw new Error(`Please add ${chainName} network to MetaMask`);
    }
    throw error;
  }
}

/**
 * Validate transaction parameters
 * @param {object} params - Transaction parameters
 * @returns {object} - { valid: boolean, errors: string[] }
 */
export function validateTransaction(params) {
  const errors = [];
  
  if (!params.to || !isValidAddress(params.to)) {
    errors.push('Invalid recipient address');
  }
  
  if (!params.value || parseFloat(params.value) <= 0) {
    errors.push('Invalid amount');
  }
  
  if (params.gasLimit && parseFloat(params.gasLimit) <= 0) {
    errors.push('Invalid gas limit');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Format error for display
 * @param {Error|string} error - Error to format
 * @returns {string} - Formatted error message
 */
export function formatError(error) {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && error.message) {
    return parseWeb3Error(error);
  }
  
  return 'An unexpected error occurred';
}

/**
 * Retry failed operation with exponential backoff
 * @param {Function} operation - Operation to retry
 * @param {number} maxRetries - Maximum retry attempts
 * @param {number} baseDelay - Base delay in ms
 * @returns {Promise} - Operation result
 */
export async function retryOperation(operation, maxRetries = 3, baseDelay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;
      }
      
      // Exponential backoff
      const delay = baseDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Helper function for address validation (imported from addressValidation.js)
function isValidAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

