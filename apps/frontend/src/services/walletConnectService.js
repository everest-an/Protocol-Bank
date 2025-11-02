/**
 * WalletConnect Service
 * Handles WalletConnect integration for mobile wallet support
 * 
 * NOTE: WalletConnect v1 is deprecated and causes browser compatibility issues.
 * This service is temporarily disabled. To enable, upgrade to WalletConnect v2.
 */

// TEMPORARILY DISABLED - WalletConnect v1 is deprecated
// import WalletConnectProvider from '@walletconnect/web3-provider';
// import { ethers } from 'ethers';

console.warn('[WalletConnect] Service temporarily disabled. WalletConnect v1 is deprecated. Please upgrade to v2.');

/**
 * Create WalletConnect Provider
 * @param {Object} options - Provider options
 * @returns {Promise<Object>} WalletConnect provider instance
 */
export const createWalletConnectProvider = async (options = {}) => {
  console.warn('[WalletConnect] Feature temporarily disabled');
  throw new Error('WalletConnect is temporarily disabled. Please use MetaMask or another browser wallet.');
};

/**
 * Connect to WalletConnect
 * @returns {Promise<Object>} Connection result with provider, signer, and account
 */
export const connectWalletConnect = async () => {
  console.warn('[WalletConnect] Feature temporarily disabled');
  throw new Error('WalletConnect is temporarily disabled. Please use MetaMask or another browser wallet.');
};

/**
 * Disconnect from WalletConnect
 * @returns {Promise<void>}
 */
export const disconnectWalletConnect = async () => {
  // No-op
};

/**
 * Check if WalletConnect is connected
 * @returns {boolean} Connection status
 */
export const isWalletConnectConnected = () => {
  return false;
};

/**
 * Get WalletConnect accounts
 * @returns {Promise<Array>} Array of accounts
 */
export const getWalletConnectAccounts = async () => {
  return [];
};

/**
 * Switch WalletConnect chain
 * @param {number} chainId - Target chain ID
 * @returns {Promise<void>}
 */
export const switchWalletConnectChain = async (chainId) => {
  console.warn('[WalletConnect] Feature temporarily disabled');
  throw new Error('WalletConnect is temporarily disabled');
};

/**
 * Setup WalletConnect event listeners
 * @param {Object} callbacks - Event callbacks
 * @returns {void}
 */
export const setupWalletConnectListeners = (callbacks = {}) => {
  // No-op
};

/**
 * Remove WalletConnect event listeners
 * @returns {void}
 */
export const removeWalletConnectListeners = () => {
  // No-op
};

export default {
  createWalletConnectProvider,
  connectWalletConnect,
  disconnectWalletConnect,
  isWalletConnectConnected,
  getWalletConnectAccounts,
  switchWalletConnectChain,
  setupWalletConnectListeners,
  removeWalletConnectListeners,
};
