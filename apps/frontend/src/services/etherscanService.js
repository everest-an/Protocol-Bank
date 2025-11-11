/**
 * Etherscan API Service
 * Fetches transaction history and other blockchain data from Etherscan
 */

import { ethers } from 'ethers';

// Etherscan API endpoints by chain ID
const ETHERSCAN_APIS = {
  1: 'https://api.etherscan.io/api',
  5: 'https://api-goerli.etherscan.io/api',
  11155111: 'https://api-sepolia.etherscan.io/api',
  137: 'https://api.polygonscan.com/api',
  80001: 'https://api-testnet.polygonscan.com/api',
};

// Etherscan API keys (should be in environment variables in production)
const ETHERSCAN_API_KEYS = {
  1: process.env.REACT_APP_ETHERSCAN_API_KEY || 'YourApiKeyToken',
  5: process.env.REACT_APP_ETHERSCAN_API_KEY || 'YourApiKeyToken',
  11155111: process.env.REACT_APP_ETHERSCAN_API_KEY || 'YourApiKeyToken',
  137: process.env.REACT_APP_POLYGONSCAN_API_KEY || 'YourApiKeyToken',
  80001: process.env.REACT_APP_POLYGONSCAN_API_KEY || 'YourApiKeyToken',
};

/**
 * Get Etherscan API URL for a chain
 * @param {number} chainId - Chain ID
 * @returns {string} API URL
 */
const getApiUrl = (chainId) => {
  return ETHERSCAN_APIS[chainId] || ETHERSCAN_APIS[1];
};

/**
 * Get Etherscan API key for a chain
 * @param {number} chainId - Chain ID
 * @returns {string} API key
 */
const getApiKey = (chainId) => {
  return ETHERSCAN_API_KEYS[chainId] || ETHERSCAN_API_KEYS[1];
};

/**
 * Fetch transaction history for an address
 * @param {string} address - Ethereum address
 * @param {number} chainId - Chain ID
 * @param {Object} options - Optional parameters
 * @returns {Promise<Array>} Transaction list
 */
export const getTransactionHistory = async (address, chainId = 1, options = {}) => {
  const {
    startBlock = 0,
    endBlock = 99999999,
    page = 1,
    offset = 100,
    sort = 'desc',
  } = options;

  const apiUrl = getApiUrl(chainId);
  const apiKey = getApiKey(chainId);

  try {
    const url = `${apiUrl}?module=account&action=txlist&address=${address}&startblock=${startBlock}&endblock=${endBlock}&page=${page}&offset=${offset}&sort=${sort}&apikey=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === '1' && data.result) {
      return data.result.map((tx) => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: ethers.formatEther(tx.value),
        gasUsed: tx.gasUsed,
        gasPrice: ethers.formatUnits(tx.gasPrice, 'gwei'),
        timestamp: parseInt(tx.timeStamp),
        blockNumber: parseInt(tx.blockNumber),
        status: tx.isError === '0' ? 'success' : 'failed',
        input: tx.input,
        nonce: parseInt(tx.nonce),
      }));
    }

    return [];
  } catch (error) {
    console.error('Failed to fetch transaction history:', error);
    throw new Error(`Failed to fetch transaction history: ${error.message}`);
  }
};

/**
 * Fetch internal transactions for an address
 * @param {string} address - Ethereum address
 * @param {number} chainId - Chain ID
 * @param {Object} options - Optional parameters
 * @returns {Promise<Array>} Internal transaction list
 */
export const getInternalTransactions = async (address, chainId = 1, options = {}) => {
  const {
    startBlock = 0,
    endBlock = 99999999,
    page = 1,
    offset = 100,
    sort = 'desc',
  } = options;

  const apiUrl = getApiUrl(chainId);
  const apiKey = getApiKey(chainId);

  try {
    const url = `${apiUrl}?module=account&action=txlistinternal&address=${address}&startblock=${startBlock}&endblock=${endBlock}&page=${page}&offset=${offset}&sort=${sort}&apikey=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === '1' && data.result) {
      return data.result.map((tx) => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: ethers.formatEther(tx.value),
        timestamp: parseInt(tx.timeStamp),
        blockNumber: parseInt(tx.blockNumber),
        type: tx.type,
        isError: tx.isError === '1',
      }));
    }

    return [];
  } catch (error) {
    console.error('Failed to fetch internal transactions:', error);
    throw new Error(`Failed to fetch internal transactions: ${error.message}`);
  }
};

/**
 * Fetch ERC20 token transfers for an address
 * @param {string} address - Ethereum address
 * @param {number} chainId - Chain ID
 * @param {Object} options - Optional parameters
 * @returns {Promise<Array>} Token transfer list
 */
export const getTokenTransfers = async (address, chainId = 1, options = {}) => {
  const {
    contractAddress = null,
    startBlock = 0,
    endBlock = 99999999,
    page = 1,
    offset = 100,
    sort = 'desc',
  } = options;

  const apiUrl = getApiUrl(chainId);
  const apiKey = getApiKey(chainId);

  try {
    let url = `${apiUrl}?module=account&action=tokentx&address=${address}&startblock=${startBlock}&endblock=${endBlock}&page=${page}&offset=${offset}&sort=${sort}&apikey=${apiKey}`;
    
    if (contractAddress) {
      url += `&contractaddress=${contractAddress}`;
    }
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === '1' && data.result) {
      return data.result.map((tx) => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: ethers.formatUnits(tx.value, parseInt(tx.tokenDecimal)),
        tokenName: tx.tokenName,
        tokenSymbol: tx.tokenSymbol,
        tokenDecimal: parseInt(tx.tokenDecimal),
        contractAddress: tx.contractAddress,
        timestamp: parseInt(tx.timeStamp),
        blockNumber: parseInt(tx.blockNumber),
        gasUsed: tx.gasUsed,
        gasPrice: ethers.formatUnits(tx.gasPrice, 'gwei'),
      }));
    }

    return [];
  } catch (error) {
    console.error('Failed to fetch token transfers:', error);
    throw new Error(`Failed to fetch token transfers: ${error.message}`);
  }
};

/**
 * Get ETH balance for an address
 * @param {string} address - Ethereum address
 * @param {number} chainId - Chain ID
 * @returns {Promise<string>} Balance in ETH
 */
export const getBalance = async (address, chainId = 1) => {
  const apiUrl = getApiUrl(chainId);
  const apiKey = getApiKey(chainId);

  try {
    const url = `${apiUrl}?module=account&action=balance&address=${address}&tag=latest&apikey=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === '1' && data.result) {
      return ethers.formatEther(data.result);
    }

    return '0';
  } catch (error) {
    console.error('Failed to fetch balance:', error);
    throw new Error(`Failed to fetch balance: ${error.message}`);
  }
};

/**
 * Get transaction receipt
 * @param {string} txHash - Transaction hash
 * @param {number} chainId - Chain ID
 * @returns {Promise<Object>} Transaction receipt
 */
export const getTransactionReceipt = async (txHash, chainId = 1) => {
  const apiUrl = getApiUrl(chainId);
  const apiKey = getApiKey(chainId);

  try {
    const url = `${apiUrl}?module=proxy&action=eth_getTransactionReceipt&txhash=${txHash}&apikey=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.result) {
      return {
        transactionHash: data.result.transactionHash,
        blockNumber: parseInt(data.result.blockNumber, 16),
        from: data.result.from,
        to: data.result.to,
        gasUsed: parseInt(data.result.gasUsed, 16),
        status: data.result.status === '0x1' ? 'success' : 'failed',
        logs: data.result.logs,
      };
    }

    return null;
  } catch (error) {
    console.error('Failed to fetch transaction receipt:', error);
    throw new Error(`Failed to fetch transaction receipt: ${error.message}`);
  }
};

/**
 * Get gas price
 * @param {number} chainId - Chain ID
 * @returns {Promise<Object>} Gas price information
 */
export const getGasPrice = async (chainId = 1) => {
  const apiUrl = getApiUrl(chainId);
  const apiKey = getApiKey(chainId);

  try {
    const url = `${apiUrl}?module=gastracker&action=gasoracle&apikey=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === '1' && data.result) {
      return {
        low: data.result.SafeGasPrice,
        average: data.result.ProposeGasPrice,
        high: data.result.FastGasPrice,
      };
    }

    return { low: '0', average: '0', high: '0' };
  } catch (error) {
    console.error('Failed to fetch gas price:', error);
    throw new Error(`Failed to fetch gas price: ${error.message}`);
  }
};

/**
 * Get payment streams from transactions
 * Filters and processes transactions to identify stream payments
 * @param {string} address - User's wallet address
 * @param {number} chainId - Chain ID
 * @returns {Promise<Object>} Processed stream payment data
 */
export const getStreamPaymentData = async (address, chainId = 11155111) => {
  try {
    // Fetch both normal and token transactions
    const [normalTxs, tokenTxs] = await Promise.all([
      getTransactionHistory(address, chainId, { offset: 100 }),
      getTokenTransfers(address, chainId, { offset: 100 })
    ]);

    // Combine and process transactions
    const allTransactions = [...normalTxs, ...tokenTxs];
    
    // Group by recipient to identify suppliers
    const recipientMap = new Map();
    const payments = [];

    allTransactions.forEach(tx => {
      // Only process outgoing transactions (user is sender)
      if (tx.from.toLowerCase() === address.toLowerCase()) {
        const recipient = tx.to.toLowerCase();
        
        // Add to recipient map
        if (!recipientMap.has(recipient)) {
          recipientMap.set(recipient, {
            address: tx.to,
            totalAmount: 0,
            transactionCount: 0,
            lastTransaction: tx.timestamp,
            status: tx.status === 'failed' ? 'failed' : 'success'
          });
        }

        const recipientData = recipientMap.get(recipient);
        const amount = parseFloat(tx.value) || 0;
        recipientData.totalAmount += amount;
        recipientData.transactionCount += 1;
        recipientData.lastTransaction = Math.max(recipientData.lastTransaction, tx.timestamp);
        
        // Update status (if any transaction failed, mark as failed)
        if (tx.status === 'failed') {
          recipientData.status = 'failed';
        }

        // Add to payments array
        payments.push({
          id: tx.hash,
          from: tx.from,
          to: tx.to,
          amount: amount,
          status: tx.status,
          timestamp: tx.timestamp * 1000, // Convert to milliseconds
          tokenSymbol: tx.tokenSymbol || 'ETH',
          hash: tx.hash
        });
      }
    });

    // Convert recipient map to suppliers array
    const suppliers = Array.from(recipientMap.entries()).map(([address, data]) => ({
      id: address,
      address: data.address,
      name: `Supplier ${address.substring(0, 6)}...${address.substring(address.length - 4)}`,
      totalAmount: data.totalAmount,
      transactionCount: data.transactionCount,
      lastTransaction: data.lastTransaction,
      status: data.status
    }));

    // Calculate statistics
    const stats = {
      totalPayments: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      suppliers: suppliers.length,
      averagePayment: payments.length > 0 ? payments.reduce((sum, p) => sum + p.amount, 0) / payments.length : 0,
      successRate: payments.length > 0 ? (payments.filter(p => p.status === 'success').length / payments.length) * 100 : 0
    };

    return {
      suppliers,
      payments,
      stats,
      lastUpdate: Date.now()
    };
  } catch (error) {
    console.error('Error processing stream payment data:', error);
    return {
      suppliers: [],
      payments: [],
      stats: {
        totalPayments: 0,
        totalAmount: 0,
        suppliers: 0,
        averagePayment: 0,
        successRate: 0
      },
      lastUpdate: Date.now()
    };
  }
};

export default {
  getTransactionHistory,
  getInternalTransactions,
  getTokenTransfers,
  getBalance,
  getTransactionReceipt,
  getGasPrice,
  getStreamPaymentData,
};
