/**
 * 错误处理工具函数
 * Error Handling Utilities
 * 
 * 统一处理应用中的各种错误，提供友好的用户提示
 * Centralized error handling with user-friendly messages
 */

/**
 * 错误类型枚举
 * Error Types Enum
 */
export const ErrorType = {
  WALLET_NOT_INSTALLED: 'WALLET_NOT_INSTALLED',
  WALLET_CONNECTION_REJECTED: 'WALLET_CONNECTION_REJECTED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TRANSACTION_REJECTED: 'TRANSACTION_REJECTED',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  CONTRACT_ERROR: 'CONTRACT_ERROR',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  INVALID_ADDRESS: 'INVALID_ADDRESS',
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
}

/**
 * 错误消息映射
 * Error Message Mapping
 */
const errorMessages = {
  en: {
    [ErrorType.WALLET_NOT_INSTALLED]: {
      title: 'Wallet Not Installed',
      message: 'Please install MetaMask or another Web3 wallet to continue.',
      action: 'Install MetaMask'
    },
    [ErrorType.WALLET_CONNECTION_REJECTED]: {
      title: 'Connection Rejected',
      message: 'You rejected the wallet connection request. Please try again.',
      action: 'Retry'
    },
    [ErrorType.NETWORK_ERROR]: {
      title: 'Wrong Network',
      message: 'Please switch to Sepolia Test Network to continue.',
      action: 'Switch Network'
    },
    [ErrorType.TRANSACTION_REJECTED]: {
      title: 'Transaction Rejected',
      message: 'You rejected the transaction. No funds were transferred.',
      action: 'OK'
    },
    [ErrorType.TRANSACTION_FAILED]: {
      title: 'Transaction Failed',
      message: 'The transaction failed. Please check your balance and try again.',
      action: 'Retry'
    },
    [ErrorType.CONTRACT_ERROR]: {
      title: 'Contract Error',
      message: 'Failed to interact with the smart contract. Please try again later.',
      action: 'OK'
    },
    [ErrorType.INSUFFICIENT_FUNDS]: {
      title: 'Insufficient Funds',
      message: 'You don\'t have enough ETH to complete this transaction.',
      action: 'OK'
    },
    [ErrorType.INVALID_ADDRESS]: {
      title: 'Invalid Address',
      message: 'The Ethereum address you entered is invalid. Please check and try again.',
      action: 'OK'
    },
    [ErrorType.INVALID_AMOUNT]: {
      title: 'Invalid Amount',
      message: 'The amount you entered is invalid. Please enter a valid number.',
      action: 'OK'
    },
    [ErrorType.UNKNOWN_ERROR]: {
      title: 'Unknown Error',
      message: 'An unexpected error occurred. Please try again later.',
      action: 'OK'
    }
  },
  zh: {
    [ErrorType.WALLET_NOT_INSTALLED]: {
      title: '钱包未安装',
      message: '请安装 MetaMask 或其他 Web3 钱包以继续。',
      action: '安装 MetaMask'
    },
    [ErrorType.WALLET_CONNECTION_REJECTED]: {
      title: '连接被拒绝',
      message: '您拒绝了钱包连接请求。请重试。',
      action: '重试'
    },
    [ErrorType.NETWORK_ERROR]: {
      title: '网络错误',
      message: '请切换到 Sepolia 测试网络以继续。',
      action: '切换网络'
    },
    [ErrorType.TRANSACTION_REJECTED]: {
      title: '交易被拒绝',
      message: '您拒绝了交易。没有资金被转移。',
      action: '确定'
    },
    [ErrorType.TRANSACTION_FAILED]: {
      title: '交易失败',
      message: '交易失败。请检查您的余额并重试。',
      action: '重试'
    },
    [ErrorType.CONTRACT_ERROR]: {
      title: '合约错误',
      message: '无法与智能合约交互。请稍后重试。',
      action: '确定'
    },
    [ErrorType.INSUFFICIENT_FUNDS]: {
      title: '余额不足',
      message: '您没有足够的 ETH 来完成此交易。',
      action: '确定'
    },
    [ErrorType.INVALID_ADDRESS]: {
      title: '地址无效',
      message: '您输入的以太坊地址无效。请检查后重试。',
      action: '确定'
    },
    [ErrorType.INVALID_AMOUNT]: {
      title: '金额无效',
      message: '您输入的金额无效。请输入有效的数字。',
      action: '确定'
    },
    [ErrorType.UNKNOWN_ERROR]: {
      title: '未知错误',
      message: '发生了意外错误。请稍后重试。',
      action: '确定'
    }
  }
}

/**
 * 解析错误类型
 * Parse Error Type
 * @param {Error} error - 错误对象 / Error object
 * @returns {string} - 错误类型 / Error type
 */
export function parseErrorType(error) {
  if (!error) return ErrorType.UNKNOWN_ERROR

  const message = error.message?.toLowerCase() || ''
  const code = error.code

  // MetaMask/Wallet errors
  if (message.includes('metamask') && message.includes('install')) {
    return ErrorType.WALLET_NOT_INSTALLED
  }
  if (code === 4001 || message.includes('user rejected')) {
    return ErrorType.TRANSACTION_REJECTED
  }
  if (code === -32002 || message.includes('already pending')) {
    return ErrorType.WALLET_CONNECTION_REJECTED
  }

  // Network errors
  if (message.includes('network') || message.includes('chain')) {
    return ErrorType.NETWORK_ERROR
  }

  // Transaction errors
  if (message.includes('insufficient funds') || message.includes('balance')) {
    return ErrorType.INSUFFICIENT_FUNDS
  }
  if (message.includes('transaction failed') || message.includes('reverted')) {
    return ErrorType.TRANSACTION_FAILED
  }

  // Validation errors
  if (message.includes('invalid address')) {
    return ErrorType.INVALID_ADDRESS
  }
  if (message.includes('invalid amount') || message.includes('invalid number')) {
    return ErrorType.INVALID_AMOUNT
  }

  // Contract errors
  if (message.includes('contract')) {
    return ErrorType.CONTRACT_ERROR
  }

  return ErrorType.UNKNOWN_ERROR
}

/**
 * 获取错误消息
 * Get Error Message
 * @param {Error} error - 错误对象 / Error object
 * @param {string} language - 语言代码 / Language code (en, zh)
 * @returns {object} - 错误消息对象 / Error message object
 */
export function getErrorMessage(error, language = 'en') {
  const errorType = parseErrorType(error)
  const messages = errorMessages[language] || errorMessages.en
  return messages[errorType] || messages[ErrorType.UNKNOWN_ERROR]
}

/**
 * 显示错误通知
 * Show Error Notification
 * @param {Error} error - 错误对象 / Error object
 * @param {string} language - 语言代码 / Language code
 * @param {Function} notificationFn - 通知函数 / Notification function
 */
export function showErrorNotification(error, language = 'en', notificationFn) {
  const errorMsg = getErrorMessage(error, language)
  
  if (notificationFn) {
    notificationFn({
      type: 'error',
      title: errorMsg.title,
      message: errorMsg.message,
      duration: 5000
    })
  } else {
    // Fallback to console
    console.error(`[${errorMsg.title}] ${errorMsg.message}`, error)
  }
}

/**
 * 创建错误处理器
 * Create Error Handler
 * @param {string} language - 语言代码 / Language code
 * @param {Function} notificationFn - 通知函数 / Notification function
 * @returns {Function} - 错误处理函数 / Error handler function
 */
export function createErrorHandler(language = 'en', notificationFn) {
  return (error) => {
    showErrorNotification(error, language, notificationFn)
  }
}

/**
 * 验证以太坊地址
 * Validate Ethereum Address
 * @param {string} address - 地址字符串 / Address string
 * @returns {boolean} - 是否有效 / Is valid
 */
export function isValidAddress(address) {
  if (!address) return false
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * 验证金额
 * Validate Amount
 * @param {string|number} amount - 金额 / Amount
 * @returns {boolean} - 是否有效 / Is valid
 */
export function isValidAmount(amount) {
  if (!amount) return false
  const num = parseFloat(amount)
  return !isNaN(num) && num > 0
}

/**
 * 安全执行异步函数
 * Safe Async Execution
 * @param {Function} fn - 异步函数 / Async function
 * @param {Function} errorHandler - 错误处理器 / Error handler
 * @returns {Promise} - 执行结果 / Execution result
 */
export async function safeAsync(fn, errorHandler) {
  try {
    return await fn()
  } catch (error) {
    if (errorHandler) {
      errorHandler(error)
    }
    throw error
  }
}

/**
 * 重试函数
 * Retry Function
 * @param {Function} fn - 要重试的函数 / Function to retry
 * @param {number} maxRetries - 最大重试次数 / Max retries
 * @param {number} delay - 重试延迟(ms) / Retry delay (ms)
 * @returns {Promise} - 执行结果 / Execution result
 */
export async function retry(fn, maxRetries = 3, delay = 1000) {
  let lastError
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  throw lastError
}

/**
 * 格式化错误日志
 * Format Error Log
 * @param {Error} error - 错误对象 / Error object
 * @param {object} context - 上下文信息 / Context info
 * @returns {string} - 格式化的日志 / Formatted log
 */
export function formatErrorLog(error, context = {}) {
  const timestamp = new Date().toISOString()
  const errorType = parseErrorType(error)
  
  return JSON.stringify({
    timestamp,
    errorType,
    message: error.message,
    stack: error.stack,
    context
  }, null, 2)
}

export default {
  ErrorType,
  parseErrorType,
  getErrorMessage,
  showErrorNotification,
  createErrorHandler,
  isValidAddress,
  isValidAmount,
  safeAsync,
  retry,
  formatErrorLog
}

