/**
 * WalletConnect Service
 * Handles WalletConnect integration for mobile wallet support
 */

import WalletConnectProvider from '@walletconnect/web3-provider';
import { ethers } from 'ethers';

// WalletConnect Project ID (should be in environment variables)
const PROJECT_ID = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID';

// RPC endpoints by chain ID
const RPC_URLS = {
  1: `https://mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_ID || 'YOUR_INFURA_ID'}`,
  5: `https://goerli.infura.io/v3/${process.env.REACT_APP_INFURA_ID || 'YOUR_INFURA_ID'}`,
  11155111: `https://sepolia.infura.io/v3/${process.env.REACT_APP_INFURA_ID || 'YOUR_INFURA_ID'}`,
  137: 'https://polygon-rpc.com',
  80001: 'https://rpc-mumbai.maticvigil.com',
};

let walletConnectProvider = null;

/**
 * Create WalletConnect Provider
 * @param {Object} options - Provider options
 * @returns {Promise<Object>} WalletConnect provider instance
 */
export const createWalletConnectProvider = async (options = {}) => {
  const {
    chainId = 1,
    rpcUrls = RPC_URLS,
  } = options;

  try {
    walletConnectProvider = new WalletConnectProvider({
      rpc: rpcUrls,
      chainId,
      qrcodeModalOptions: {
        mobileLinks: [
          'rainbow',
          'metamask',
          'argent',
          'trust',
          'imtoken',
          'pillar',
        ],
      },
    });

    return walletConnectProvider;
  } catch (error) {
    console.error('Failed to create WalletConnect provider:', error);
    throw new Error(`Failed to create WalletConnect provider: ${error.message}`);
  }
};

/**
 * Connect to WalletConnect
 * @returns {Promise<Object>} Connection result with provider, signer, and account
 */
export const connectWalletConnect = async () => {
  try {
    if (!walletConnectProvider) {
      walletConnectProvider = await createWalletConnectProvider();
    }

    // Enable session (triggers QR Code modal)
    await walletConnectProvider.enable();

    // Create ethers provider and signer
    const provider = new ethers.BrowserProvider(walletConnectProvider);
    const signer = await provider.getSigner();
    const account = await signer.getAddress();
    const network = await provider.getNetwork();

    return {
      provider,
      signer,
      account,
      chainId: Number(network.chainId),
      walletConnectProvider,
    };
  } catch (error) {
    console.error('Failed to connect to WalletConnect:', error);
    throw new Error(`Failed to connect to WalletConnect: ${error.message}`);
  }
};

/**
 * Disconnect from WalletConnect
 * @returns {Promise<void>}
 */
export const disconnectWalletConnect = async () => {
  try {
    if (walletConnectProvider) {
      await walletConnectProvider.disconnect();
      walletConnectProvider = null;
    }
  } catch (error) {
    console.error('Failed to disconnect from WalletConnect:', error);
    throw new Error(`Failed to disconnect from WalletConnect: ${error.message}`);
  }
};

/**
 * Check if WalletConnect is connected
 * @returns {boolean} Connection status
 */
export const isWalletConnectConnected = () => {
  return walletConnectProvider && walletConnectProvider.connected;
};

/**
 * Get WalletConnect accounts
 * @returns {Promise<Array>} Array of accounts
 */
export const getWalletConnectAccounts = async () => {
  try {
    if (!walletConnectProvider || !walletConnectProvider.connected) {
      return [];
    }

    return walletConnectProvider.accounts;
  } catch (error) {
    console.error('Failed to get WalletConnect accounts:', error);
    return [];
  }
};

/**
 * Switch WalletConnect chain
 * @param {number} chainId - Target chain ID
 * @returns {Promise<void>}
 */
export const switchWalletConnectChain = async (chainId) => {
  try {
    if (!walletConnectProvider) {
      throw new Error('WalletConnect not initialized');
    }

    await walletConnectProvider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId.toString(16)}` }],
    });
  } catch (error) {
    console.error('Failed to switch WalletConnect chain:', error);
    throw new Error(`Failed to switch chain: ${error.message}`);
  }
};

/**
 * Setup WalletConnect event listeners
 * @param {Object} callbacks - Event callbacks
 * @returns {void}
 */
export const setupWalletConnectListeners = (callbacks = {}) => {
  if (!walletConnectProvider) return;

  const {
    onAccountsChanged,
    onChainChanged,
    onDisconnect,
  } = callbacks;

  // Subscribe to accounts change
  if (onAccountsChanged) {
    walletConnectProvider.on('accountsChanged', (accounts) => {
      console.log('WalletConnect accounts changed:', accounts);
      onAccountsChanged(accounts);
    });
  }

  // Subscribe to chainId change
  if (onChainChanged) {
    walletConnectProvider.on('chainChanged', (chainId) => {
      console.log('WalletConnect chain changed:', chainId);
      onChainChanged(parseInt(chainId, 16));
    });
  }

  // Subscribe to session disconnection
  if (onDisconnect) {
    walletConnectProvider.on('disconnect', (code, reason) => {
      console.log('WalletConnect disconnected:', code, reason);
      onDisconnect();
    });
  }
};

/**
 * Remove WalletConnect event listeners
 * @returns {void}
 */
export const removeWalletConnectListeners = () => {
  if (!walletConnectProvider) return;

  walletConnectProvider.removeAllListeners('accountsChanged');
  walletConnectProvider.removeAllListeners('chainChanged');
  walletConnectProvider.removeAllListeners('disconnect');
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
