/**
 * Formatting Utilities
 * 
 * A collection of utility functions for formatting data in the Protocol Bank application.
 */

/**
 * Format a number as currency
 * @param {number|string} amount - The amount to format
 * @param {string} currency - The currency code (default: 'USD')
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currency = 'USD', decimals = 2) {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return '$0.00';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(numAmount);
}

/**
 * Format a number with thousand separators
 * @param {number|string} num - The number to format
 * @param {number} decimals - Number of decimal places (default: 0)
 * @returns {string} Formatted number string
 */
export function formatNumber(num, decimals = 0) {
  const numValue = typeof num === 'string' ? parseFloat(num) : num;
  
  if (isNaN(numValue)) {
    return '0';
  }

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(numValue);
}

/**
 * Format a large number with K, M, B suffixes
 * @param {number} num - The number to format
 * @returns {string} Formatted number string with suffix
 */
export function formatCompactNumber(num) {
  if (num >= 1e9) {
    return (num / 1e9).toFixed(1) + 'B';
  }
  if (num >= 1e6) {
    return (num / 1e6).toFixed(1) + 'M';
  }
  if (num >= 1e3) {
    return (num / 1e3).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Format a percentage
 * @param {number} value - The value to format (0-1 or 0-100)
 * @param {boolean} isDecimal - Whether the value is in decimal form (default: true)
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted percentage string
 */
export function formatPercentage(value, isDecimal = true, decimals = 2) {
  const percentage = isDecimal ? value * 100 : value;
  return `${percentage.toFixed(decimals)}%`;
}

/**
 * Format a date
 * @param {Date|string|number} date - The date to format
 * @param {string} format - The format type ('short', 'medium', 'long', 'full')
 * @returns {string} Formatted date string
 */
export function formatDate(date, format = 'medium') {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  const options = {
    short: { month: 'numeric', day: 'numeric', year: '2-digit' },
    medium: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { month: 'long', day: 'numeric', year: 'numeric' },
    full: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
  };

  return new Intl.DateTimeFormat('en-US', options[format] || options.medium).format(dateObj);
}

/**
 * Format a date and time
 * @param {Date|string|number} date - The date to format
 * @returns {string} Formatted date and time string
 */
export function formatDateTime(date) {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(dateObj);
}

/**
 * Format a relative time (e.g., "2 hours ago")
 * @param {Date|string|number} date - The date to format
 * @returns {string} Relative time string
 */
export function formatRelativeTime(date) {
  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffMs = now - dateObj;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return 'just now';
  } else if (diffMin < 60) {
    return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  } else if (diffHour < 24) {
    return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  } else if (diffDay < 30) {
    return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  } else {
    return formatDate(dateObj);
  }
}

/**
 * Truncate an Ethereum address
 * @param {string} address - The address to truncate
 * @param {number} startChars - Number of characters to show at start (default: 6)
 * @param {number} endChars - Number of characters to show at end (default: 4)
 * @returns {string} Truncated address
 */
export function truncateAddress(address, startChars = 6, endChars = 4) {
  if (!address || address.length < startChars + endChars) {
    return address || '';
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Truncate a transaction hash
 * @param {string} hash - The hash to truncate
 * @returns {string} Truncated hash
 */
export function truncateHash(hash) {
  return truncateAddress(hash, 10, 8);
}

/**
 * Format Wei to Ether
 * @param {string|number} wei - The Wei amount
 * @param {number} decimals - Number of decimal places (default: 4)
 * @returns {string} Formatted Ether amount
 */
export function formatWeiToEther(wei, decimals = 4) {
  const ether = parseFloat(wei) / 1e18;
  return ether.toFixed(decimals);
}

/**
 * Format Ether to Wei
 * @param {string|number} ether - The Ether amount
 * @returns {string} Wei amount as string
 */
export function formatEtherToWei(ether) {
  const wei = parseFloat(ether) * 1e18;
  return wei.toString();
}

/**
 * Format a file size
 * @param {number} bytes - The file size in bytes
 * @returns {string} Formatted file size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format a duration in seconds
 * @param {number} seconds - The duration in seconds
 * @returns {string} Formatted duration
 */
export function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

export default {
  formatCurrency,
  formatNumber,
  formatCompactNumber,
  formatPercentage,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  truncateAddress,
  truncateHash,
  formatWeiToEther,
  formatEtherToWei,
  formatFileSize,
  formatDuration
};
