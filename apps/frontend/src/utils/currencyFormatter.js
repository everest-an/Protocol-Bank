/**
 * Format currency amount based on currency type
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code (ETH, USD, EUR, CNY, GBP, JPY)
 * @param {object} options - Formatting options
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currency = 'ETH', options = {}) {
  const {
    showSymbol = true,
    decimals = null,
    compact = false,
  } = options;

  if (amount === null || amount === undefined || isNaN(amount)) {
    return showSymbol ? `${getCurrencySymbol(currency)} 0` : '0';
  }

  const numAmount = parseFloat(amount);

  // Determine decimal places based on currency and amount
  let decimalPlaces = decimals;
  if (decimalPlaces === null) {
    if (currency === 'ETH') {
      decimalPlaces = numAmount < 0.01 ? 6 : 4;
    } else if (currency === 'JPY') {
      decimalPlaces = 0; // JPY doesn't use decimal places
    } else if (numAmount >= 1000) {
      decimalPlaces = 2;
    } else if (numAmount >= 1) {
      decimalPlaces = 2;
    } else {
      decimalPlaces = 4;
    }
  }

  // Format with compact notation for large numbers
  if (compact && numAmount >= 1000000) {
    const formatted = new Intl.NumberFormat('en-US', {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 2,
    }).format(numAmount);
    
    return showSymbol ? `${getCurrencySymbol(currency)} ${formatted}` : formatted;
  }

  // Standard formatting
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(numAmount);

  return showSymbol ? `${getCurrencySymbol(currency)} ${formatted}` : formatted;
}

/**
 * Get currency symbol
 * @param {string} currency - Currency code
 * @returns {string} Currency symbol
 */
export function getCurrencySymbol(currency) {
  const symbols = {
    ETH: 'Ξ',
    USD: '$',
    EUR: '€',
    CNY: '¥',
    GBP: '£',
    JPY: '¥',
  };
  
  return symbols[currency.toUpperCase()] || currency;
}

/**
 * Convert ETH amount to specified currency
 * @param {number} ethAmount - Amount in ETH
 * @param {string} targetCurrency - Target currency code
 * @param {object} rates - Exchange rates object
 * @returns {number} Converted amount
 */
export function convertETH(ethAmount, targetCurrency, rates) {
  if (targetCurrency === 'ETH') return ethAmount;
  
  const rate = rates[targetCurrency.toLowerCase()];
  if (!rate) return 0;
  
  return ethAmount * rate;
}

/**
 * Format amount with automatic currency conversion
 * @param {number} ethAmount - Amount in ETH
 * @param {string} displayCurrency - Currency to display in
 * @param {object} rates - Exchange rates object
 * @param {object} options - Formatting options
 * @returns {string} Formatted currency string
 */
export function formatWithConversion(ethAmount, displayCurrency, rates, options = {}) {
  const convertedAmount = convertETH(ethAmount, displayCurrency, rates);
  return formatCurrency(convertedAmount, displayCurrency, options);
}

