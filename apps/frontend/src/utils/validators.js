/**
 * Validation Utilities
 * 
 * A collection of utility functions for validating data in the Protocol Bank application.
 */

/**
 * Validate an Ethereum address
 * @param {string} address - The address to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function isValidAddress(address) {
  if (!address || typeof address !== 'string') {
    return false;
  }
  
  // Check if it's a valid Ethereum address format
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate an email address
 * @param {string} email - The email to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate a positive number
 * @param {any} value - The value to validate
 * @returns {boolean} True if valid positive number, false otherwise
 */
export function isPositiveNumber(value) {
  const num = parseFloat(value);
  return !isNaN(num) && num > 0;
}

/**
 * Validate a non-negative number
 * @param {any} value - The value to validate
 * @returns {boolean} True if valid non-negative number, false otherwise
 */
export function isNonNegativeNumber(value) {
  const num = parseFloat(value);
  return !isNaN(num) && num >= 0;
}

/**
 * Validate a transaction hash
 * @param {string} hash - The hash to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function isValidTxHash(hash) {
  if (!hash || typeof hash !== 'string') {
    return false;
  }
  
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
}

/**
 * Validate a date is in the future
 * @param {Date|string|number} date - The date to validate
 * @returns {boolean} True if date is in the future, false otherwise
 */
export function isFutureDate(date) {
  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();
  return dateObj > now;
}

/**
 * Validate a date is in the past
 * @param {Date|string|number} date - The date to validate
 * @returns {boolean} True if date is in the past, false otherwise
 */
export function isPastDate(date) {
  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();
  return dateObj < now;
}

/**
 * Validate a date range
 * @param {Date|string|number} startDate - The start date
 * @param {Date|string|number} endDate - The end date
 * @returns {boolean} True if valid range, false otherwise
 */
export function isValidDateRange(startDate, endDate) {
  const start = startDate instanceof Date ? startDate : new Date(startDate);
  const end = endDate instanceof Date ? endDate : new Date(endDate);
  return start < end;
}

/**
 * Validate a URL
 * @param {string} url - The URL to validate
 * @returns {boolean} True if valid URL, false otherwise
 */
export function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate a string is not empty
 * @param {string} str - The string to validate
 * @returns {boolean} True if not empty, false otherwise
 */
export function isNotEmpty(str) {
  return typeof str === 'string' && str.trim().length > 0;
}

/**
 * Validate a string length
 * @param {string} str - The string to validate
 * @param {number} min - Minimum length
 * @param {number} max - Maximum length
 * @returns {boolean} True if valid length, false otherwise
 */
export function isValidLength(str, min, max) {
  if (typeof str !== 'string') {
    return false;
  }
  const len = str.length;
  return len >= min && len <= max;
}

/**
 * Validate a payment amount
 * @param {any} amount - The amount to validate
 * @param {number} min - Minimum amount (default: 0)
 * @param {number} max - Maximum amount (default: Infinity)
 * @returns {object} Validation result with isValid and error message
 */
export function validatePaymentAmount(amount, min = 0, max = Infinity) {
  const num = parseFloat(amount);
  
  if (isNaN(num)) {
    return { isValid: false, error: 'Invalid amount' };
  }
  
  if (num <= 0) {
    return { isValid: false, error: 'Amount must be greater than 0' };
  }
  
  if (num < min) {
    return { isValid: false, error: `Amount must be at least ${min}` };
  }
  
  if (num > max) {
    return { isValid: false, error: `Amount must not exceed ${max}` };
  }
  
  return { isValid: true, error: null };
}

/**
 * Validate a batch payment CSV row
 * @param {object} row - The CSV row object
 * @returns {object} Validation result with isValid and errors array
 */
export function validateBatchPaymentRow(row) {
  const errors = [];
  
  if (!row.recipient || !isValidAddress(row.recipient)) {
    errors.push('Invalid recipient address');
  }
  
  if (!row.amount || !isPositiveNumber(row.amount)) {
    errors.push('Invalid amount');
  }
  
  if (!row.category || !isNotEmpty(row.category)) {
    errors.push('Category is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export default {
  isValidAddress,
  isValidEmail,
  isPositiveNumber,
  isNonNegativeNumber,
  isValidTxHash,
  isFutureDate,
  isPastDate,
  isValidDateRange,
  isValidUrl,
  isNotEmpty,
  isValidLength,
  validatePaymentAmount,
  validateBatchPaymentRow
};
