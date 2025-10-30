/**
 * Transaction Service
 * Handles transaction building, signing, and sending
 */

import { ethers } from 'ethers';

/**
 * Build a payment transaction
 * @param {Object} params - Transaction parameters
 * @param {string} params.to - Recipient address
 * @param {string} params.amount - Amount in ETH
 * @param {string} params.data - Optional transaction data
 * @returns {Object} Transaction object
 */
export const buildPaymentTransaction = ({ to, amount, data = '0x' }) => {
  if (!ethers.isAddress(to)) {
    throw new Error('Invalid recipient address');
  }

  const value = ethers.parseEther(amount.toString());

  return {
    to,
    value,
    data,
  };
};

/**
 * Build a contract transaction
 * @param {Object} params - Transaction parameters
 * @param {Object} params.contract - Contract instance
 * @param {string} params.method - Method name
 * @param {Array} params.args - Method arguments
 * @param {string} params.value - Optional ETH value to send
 * @returns {Object} Transaction object
 */
export const buildContractTransaction = async ({ contract, method, args = [], value = '0' }) => {
  if (!contract || !method) {
    throw new Error('Contract and method are required');
  }

  const valueWei = value !== '0' ? ethers.parseEther(value.toString()) : 0n;

  // Populate the transaction
  const tx = await contract[method].populateTransaction(...args, {
    value: valueWei,
  });

  return tx;
};

/**
 * Estimate gas for a transaction
 * @param {Object} signer - Ethers signer
 * @param {Object} transaction - Transaction object
 * @returns {Promise<bigint>} Estimated gas
 */
export const estimateGas = async (signer, transaction) => {
  try {
    const gasEstimate = await signer.estimateGas(transaction);
    // Add 20% buffer
    return (gasEstimate * 120n) / 100n;
  } catch (error) {
    console.error('Gas estimation failed:', error);
    throw new Error(`Gas estimation failed: ${error.message}`);
  }
};

/**
 * Get current gas price
 * @param {Object} provider - Ethers provider
 * @returns {Promise<Object>} Gas price information
 */
export const getGasPrice = async (provider) => {
  try {
    const feeData = await provider.getFeeData();
    
    return {
      gasPrice: feeData.gasPrice,
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
    };
  } catch (error) {
    console.error('Failed to get gas price:', error);
    throw new Error(`Failed to get gas price: ${error.message}`);
  }
};

/**
 * Sign a transaction
 * @param {Object} signer - Ethers signer
 * @param {Object} transaction - Transaction object
 * @returns {Promise<string>} Signed transaction
 */
export const signTransaction = async (signer, transaction) => {
  try {
    const signedTx = await signer.signTransaction(transaction);
    return signedTx;
  } catch (error) {
    console.error('Transaction signing failed:', error);
    throw new Error(`Transaction signing failed: ${error.message}`);
  }
};

/**
 * Send a transaction
 * @param {Object} signer - Ethers signer
 * @param {Object} transaction - Transaction object
 * @returns {Promise<Object>} Transaction response
 */
export const sendTransaction = async (signer, transaction) => {
  try {
    const tx = await signer.sendTransaction(transaction);
    return tx;
  } catch (error) {
    console.error('Transaction sending failed:', error);
    throw new Error(`Transaction sending failed: ${error.message}`);
  }
};

/**
 * Wait for transaction confirmation
 * @param {Object} tx - Transaction response
 * @param {number} confirmations - Number of confirmations to wait for
 * @returns {Promise<Object>} Transaction receipt
 */
export const waitForTransaction = async (tx, confirmations = 1) => {
  try {
    const receipt = await tx.wait(confirmations);
    return receipt;
  } catch (error) {
    console.error('Transaction confirmation failed:', error);
    throw new Error(`Transaction confirmation failed: ${error.message}`);
  }
};

/**
 * Send and wait for transaction
 * @param {Object} signer - Ethers signer
 * @param {Object} transaction - Transaction object
 * @param {number} confirmations - Number of confirmations to wait for
 * @returns {Promise<Object>} Transaction receipt
 */
export const sendAndWaitForTransaction = async (signer, transaction, confirmations = 1) => {
  const tx = await sendTransaction(signer, transaction);
  const receipt = await waitForTransaction(tx, confirmations);
  return { tx, receipt };
};

/**
 * Get transaction status
 * @param {Object} provider - Ethers provider
 * @param {string} txHash - Transaction hash
 * @returns {Promise<Object>} Transaction status
 */
export const getTransactionStatus = async (provider, txHash) => {
  try {
    const tx = await provider.getTransaction(txHash);
    const receipt = await provider.getTransactionReceipt(txHash);

    if (!tx) {
      return { status: 'not_found' };
    }

    if (!receipt) {
      return { status: 'pending', transaction: tx };
    }

    return {
      status: receipt.status === 1 ? 'success' : 'failed',
      transaction: tx,
      receipt,
    };
  } catch (error) {
    console.error('Failed to get transaction status:', error);
    throw new Error(`Failed to get transaction status: ${error.message}`);
  }
};

/**
 * Format transaction for display
 * @param {Object} tx - Transaction object
 * @returns {Object} Formatted transaction
 */
export const formatTransaction = (tx) => {
  return {
    hash: tx.hash,
    from: tx.from,
    to: tx.to,
    value: ethers.formatEther(tx.value || 0n),
    gasLimit: tx.gasLimit?.toString(),
    gasPrice: tx.gasPrice ? ethers.formatUnits(tx.gasPrice, 'gwei') : null,
    nonce: tx.nonce,
    data: tx.data,
    chainId: tx.chainId,
  };
};

/**
 * Calculate transaction cost
 * @param {Object} receipt - Transaction receipt
 * @returns {string} Transaction cost in ETH
 */
export const calculateTransactionCost = (receipt) => {
  const gasUsed = receipt.gasUsed;
  const effectiveGasPrice = receipt.effectiveGasPrice || receipt.gasPrice;
  const cost = gasUsed * effectiveGasPrice;
  return ethers.formatEther(cost);
};

export default {
  buildPaymentTransaction,
  buildContractTransaction,
  estimateGas,
  getGasPrice,
  signTransaction,
  sendTransaction,
  waitForTransaction,
  sendAndWaitForTransaction,
  getTransactionStatus,
  formatTransaction,
  calculateTransactionCost,
};
