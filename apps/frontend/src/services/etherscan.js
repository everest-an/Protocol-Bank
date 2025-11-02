/**
 * Etherscan API 服务模块
 * Etherscan API Service Module
 * 
 * 提供与 Etherscan API 交互的功能
 * Provides functionality to interact with Etherscan API
 */

import { SEPOLIA_CONFIG } from '@/config/contracts';

// Etherscan API 配置
const ETHERSCAN_API_CONFIG = {
  baseUrl: 'https://api-sepolia.etherscan.io/api',
  apiKey: import.meta.env.VITE_ETHERSCAN_API_KEY || 'YourApiKeyToken', // 可选，但有限流
};

/**
 * 通用 API 请求函数
 * Generic API request function
 * @param {Object} params - API 请求参数
 * @returns {Promise<Object>} - API 响应数据
 */
async function etherscanRequest(params) {
  const url = new URL(ETHERSCAN_API_CONFIG.baseUrl);
  
  // 添加 API key
  if (ETHERSCAN_API_CONFIG.apiKey && ETHERSCAN_API_CONFIG.apiKey !== 'YourApiKeyToken') {
    params.apikey = ETHERSCAN_API_CONFIG.apiKey;
  }
  
  // 添加参数到 URL
  Object.keys(params).forEach(key => {
    url.searchParams.append(key, params[key]);
  });

  try {
    const response = await fetch(url.toString());
    const data = await response.json();
    
    if (data.status === '0' && data.message !== 'No transactions found') {
      throw new Error(data.result || data.message || 'Etherscan API error');
    }
    
    return data;
  } catch (error) {
    console.error('Etherscan API request failed:', error);
    throw error;
  }
}

/**
 * 获取地址的交易列表
 * Get transaction list for an address
 * @param {string} address - 以太坊地址
 * @param {Object} options - 可选参数
 * @returns {Promise<Array>} - 交易列表
 */
export async function getTransactionsByAddress(address, options = {}) {
  const {
    startBlock = 0,
    endBlock = 99999999,
    page = 1,
    offset = 100,
    sort = 'desc'
  } = options;

  const params = {
    module: 'account',
    action: 'txlist',
    address,
    startblock: startBlock,
    endblock: endBlock,
    page,
    offset,
    sort
  };

  const data = await etherscanRequest(params);
  return data.result || [];
}

/**
 * 获取地址的内部交易列表
 * Get internal transaction list for an address
 * @param {string} address - 以太坊地址
 * @param {Object} options - 可选参数
 * @returns {Promise<Array>} - 内部交易列表
 */
export async function getInternalTransactionsByAddress(address, options = {}) {
  const {
    startBlock = 0,
    endBlock = 99999999,
    page = 1,
    offset = 100,
    sort = 'desc'
  } = options;

  const params = {
    module: 'account',
    action: 'txlistinternal',
    address,
    startblock: startBlock,
    endblock: endBlock,
    page,
    offset,
    sort
  };

  const data = await etherscanRequest(params);
  return data.result || [];
}

/**
 * 获取单个交易的详细信息
 * Get transaction details by hash
 * @param {string} txHash - 交易哈希
 * @returns {Promise<Object>} - 交易详情
 */
export async function getTransactionByHash(txHash) {
  const params = {
    module: 'proxy',
    action: 'eth_getTransactionByHash',
    txhash: txHash
  };

  const data = await etherscanRequest(params);
  return data.result;
}

/**
 * 获取交易收据
 * Get transaction receipt
 * @param {string} txHash - 交易哈希
 * @returns {Promise<Object>} - 交易收据
 */
export async function getTransactionReceipt(txHash) {
  const params = {
    module: 'proxy',
    action: 'eth_getTransactionReceipt',
    txhash: txHash
  };

  const data = await etherscanRequest(params);
  return data.result;
}

/**
 * 获取地址的 ETH 余额
 * Get ETH balance for an address
 * @param {string} address - 以太坊地址
 * @returns {Promise<string>} - 余额（wei）
 */
export async function getBalance(address) {
  const params = {
    module: 'account',
    action: 'balance',
    address,
    tag: 'latest'
  };

  const data = await etherscanRequest(params);
  return data.result;
}

/**
 * 获取多个地址的 ETH 余额
 * Get ETH balance for multiple addresses
 * @param {Array<string>} addresses - 以太坊地址数组（最多20个）
 * @returns {Promise<Array>} - 余额列表
 */
export async function getBalances(addresses) {
  if (addresses.length > 20) {
    throw new Error('Maximum 20 addresses allowed');
  }

  const params = {
    module: 'account',
    action: 'balancemulti',
    address: addresses.join(','),
    tag: 'latest'
  };

  const data = await etherscanRequest(params);
  return data.result || [];
}

/**
 * 获取合约的 ABI
 * Get contract ABI
 * @param {string} address - 合约地址
 * @returns {Promise<string>} - ABI JSON 字符串
 */
export async function getContractABI(address) {
  const params = {
    module: 'contract',
    action: 'getabi',
    address
  };

  const data = await etherscanRequest(params);
  return data.result;
}

/**
 * 获取区块号通过时间戳
 * Get block number by timestamp
 * @param {number} timestamp - Unix 时间戳
 * @param {string} closest - 'before' 或 'after'
 * @returns {Promise<string>} - 区块号
 */
export async function getBlockNumberByTimestamp(timestamp, closest = 'before') {
  const params = {
    module: 'block',
    action: 'getblocknobytime',
    timestamp,
    closest
  };

  const data = await etherscanRequest(params);
  return data.result;
}

/**
 * 获取 ERC20 代币转账记录
 * Get ERC20 token transfer events
 * @param {string} address - 地址
 * @param {string} contractAddress - 代币合约地址（可选）
 * @param {Object} options - 可选参数
 * @returns {Promise<Array>} - 转账记录
 */
export async function getERC20Transfers(address, contractAddress = null, options = {}) {
  const {
    startBlock = 0,
    endBlock = 99999999,
    page = 1,
    offset = 100,
    sort = 'desc'
  } = options;

  const params = {
    module: 'account',
    action: contractAddress ? 'tokentx' : 'tokentx',
    address,
    startblock: startBlock,
    endblock: endBlock,
    page,
    offset,
    sort
  };

  if (contractAddress) {
    params.contractaddress = contractAddress;
  }

  const data = await etherscanRequest(params);
  return data.result || [];
}

/**
 * 获取 Etherscan 浏览器链接
 * Get Etherscan explorer link
 * @param {string} type - 'tx' | 'address' | 'block' | 'token'
 * @param {string} value - 交易哈希/地址/区块号/代币地址
 * @returns {string} - Etherscan 链接
 */
export function getEtherscanLink(type, value) {
  const baseUrl = SEPOLIA_CONFIG.explorerUrl;
  
  switch (type) {
    case 'tx':
      return `${baseUrl}/tx/${value}`;
    case 'address':
      return `${baseUrl}/address/${value}`;
    case 'block':
      return `${baseUrl}/block/${value}`;
    case 'token':
      return `${baseUrl}/token/${value}`;
    default:
      return baseUrl;
  }
}

/**
 * 格式化交易数据为统一格式
 * Format transaction data to unified format
 * @param {Object} tx - Etherscan 交易数据
 * @returns {Object} - 格式化后的交易数据
 */
export function formatTransaction(tx) {
  return {
    hash: tx.hash,
    from: tx.from,
    to: tx.to,
    value: tx.value,
    timestamp: parseInt(tx.timeStamp) * 1000, // 转换为毫秒
    blockNumber: parseInt(tx.blockNumber),
    gasUsed: tx.gasUsed,
    gasPrice: tx.gasPrice,
    status: tx.isError === '0' ? 'success' : 'failed',
    methodId: tx.methodId,
    functionName: tx.functionName || 'Transfer',
  };
}

/**
 * 批量获取交易详情（带缓存和限流）
 * Batch get transaction details with cache and rate limiting
 * @param {Array<string>} txHashes - 交易哈希数组
 * @param {number} delay - 请求间隔（毫秒）
 * @returns {Promise<Array>} - 交易详情列表
 */
export async function batchGetTransactions(txHashes, delay = 200) {
  const results = [];
  
  for (const hash of txHashes) {
    try {
      const tx = await getTransactionByHash(hash);
      results.push(tx);
      
      // 延迟以避免 API 限流
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error) {
      console.error(`Failed to fetch transaction ${hash}:`, error);
      results.push(null);
    }
  }
  
  return results;
}

/**
 * 检查 Etherscan API 是否可用
 * Check if Etherscan API is available
 * @returns {Promise<boolean>} - API 是否可用
 */
export async function checkAPIStatus() {
  try {
    const params = {
      module: 'stats',
      action: 'ethsupply'
    };
    
    await etherscanRequest(params);
    return true;
  } catch (error) {
    console.error('Etherscan API is not available:', error);
    return false;
  }
}

export default {
  getTransactionsByAddress,
  getInternalTransactionsByAddress,
  getTransactionByHash,
  getTransactionReceipt,
  getBalance,
  getBalances,
  getContractABI,
  getBlockNumberByTimestamp,
  getERC20Transfers,
  getEtherscanLink,
  formatTransaction,
  batchGetTransactions,
  checkAPIStatus,
};
