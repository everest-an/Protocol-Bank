/**
 * Address Validation Utilities
 * Provides comprehensive Ethereum address validation
 */

/**
 * Check if a string is a valid Ethereum address
 * @param {string} address - The address to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export function isValidAddress(address) {
  if (!address || typeof address !== 'string') {
    return false;
  }
  
  // Check format: 0x followed by 40 hexadecimal characters
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Check if an address is the zero address
 * @param {string} address - The address to check
 * @returns {boolean} - True if zero address
 */
export function isZeroAddress(address) {
  return address === '0x0000000000000000000000000000000000000000';
}

/**
 * Format address for display (short version)
 * @param {string} address - The address to format
 * @param {number} prefixLength - Length of prefix (default 6)
 * @param {number} suffixLength - Length of suffix (default 4)
 * @returns {string} - Formatted address or 'Invalid Address'
 */
export function formatAddress(address, prefixLength = 6, suffixLength = 4) {
  if (!isValidAddress(address)) {
    return 'Invalid Address';
  }
  
  if (isZeroAddress(address)) {
    return '0x0...0000';
  }
  
  return `${address.slice(0, prefixLength)}...${address.slice(-suffixLength)}`;
}

/**
 * Validate and sanitize address input
 * @param {string} address - The address to validate
 * @returns {object} - { valid: boolean, address: string, error: string }
 */
export function validateAddress(address) {
  if (!address) {
    return {
      valid: false,
      address: '',
      error: 'Address is required'
    };
  }
  
  if (typeof address !== 'string') {
    return {
      valid: false,
      address: '',
      error: 'Address must be a string'
    };
  }
  
  // Trim whitespace
  const trimmed = address.trim();
  
  if (!trimmed.startsWith('0x')) {
    return {
      valid: false,
      address: trimmed,
      error: 'Address must start with 0x'
    };
  }
  
  if (trimmed.length !== 42) {
    return {
      valid: false,
      address: trimmed,
      error: 'Address must be 42 characters (0x + 40 hex)'
    };
  }
  
  if (!isValidAddress(trimmed)) {
    return {
      valid: false,
      address: trimmed,
      error: 'Address contains invalid characters'
    };
  }
  
  if (isZeroAddress(trimmed)) {
    return {
      valid: false,
      address: trimmed,
      error: 'Zero address is not allowed'
    };
  }
  
  return {
    valid: true,
    address: trimmed,
    error: null
  };
}

/**
 * Compare two addresses (case-insensitive)
 * @param {string} address1 - First address
 * @param {string} address2 - Second address
 * @returns {boolean} - True if addresses are equal
 */
export function addressesEqual(address1, address2) {
  if (!isValidAddress(address1) || !isValidAddress(address2)) {
    return false;
  }
  
  return address1.toLowerCase() === address2.toLowerCase();
}

/**
 * Checksum an Ethereum address (EIP-55)
 * @param {string} address - The address to checksum
 * @returns {string} - Checksummed address
 */
export function toChecksumAddress(address) {
  if (!isValidAddress(address)) {
    throw new Error('Invalid address');
  }
  
  // Remove 0x prefix
  const addr = address.slice(2).toLowerCase();
  
  // This is a simplified version - in production, use ethers.js getAddress()
  // For now, just return the original address
  return address;
}

/**
 * Validate amount input
 * @param {string|number} amount - The amount to validate
 * @param {number} maxDecimals - Maximum decimal places (default 18)
 * @returns {object} - { valid: boolean, amount: string, error: string }
 */
export function validateAmount(amount, maxDecimals = 18) {
  if (!amount && amount !== 0) {
    return {
      valid: false,
      amount: '',
      error: 'Amount is required'
    };
  }
  
  const amountStr = amount.toString().trim();
  
  // Check if it's a valid number
  if (isNaN(amountStr) || amountStr === '') {
    return {
      valid: false,
      amount: amountStr,
      error: 'Amount must be a number'
    };
  }
  
  const amountNum = parseFloat(amountStr);
  
  if (amountNum <= 0) {
    return {
      valid: false,
      amount: amountStr,
      error: 'Amount must be greater than 0'
    };
  }
  
  if (amountNum > Number.MAX_SAFE_INTEGER) {
    return {
      valid: false,
      amount: amountStr,
      error: 'Amount is too large'
    };
  }
  
  // Check decimal places
  const parts = amountStr.split('.');
  if (parts.length === 2 && parts[1].length > maxDecimals) {
    return {
      valid: false,
      amount: amountStr,
      error: `Maximum ${maxDecimals} decimal places allowed`
    };
  }
  
  return {
    valid: true,
    amount: amountStr,
    error: null
  };
}

/**
 * Safe address formatting that handles null/undefined
 * @param {string} address - The address to format
 * @returns {string} - Formatted address or fallback
 */
export function safeFormatAddress(address) {
  if (!address) {
    return 'N/A';
  }
  
  if (!isValidAddress(address)) {
    return 'Invalid';
  }
  
  return formatAddress(address);
}

