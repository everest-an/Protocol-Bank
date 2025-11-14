/**
 * Network Constants
 * 
 * Centralized constants for blockchain networks.
 */

/**
 * Supported Networks
 */
export const NETWORKS = {
  SEPOLIA: {
    id: 11155111,
    name: 'Sepolia',
    shortName: 'Sepolia',
    nativeCurrency: {
      name: 'Sepolia ETH',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrl: 'https://sepolia.infura.io/v3/',
    explorerUrl: 'https://sepolia.etherscan.io',
    explorerName: 'Etherscan',
    isTestnet: true
  },
  BASE_SEPOLIA: {
    id: 84532,
    name: 'Base Sepolia',
    shortName: 'Base Sepolia',
    nativeCurrency: {
      name: 'Sepolia ETH',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrl: 'https://sepolia.base.org',
    explorerUrl: 'https://sepolia.basescan.org',
    explorerName: 'BaseScan',
    isTestnet: true
  },
  BASE: {
    id: 8453,
    name: 'Base',
    shortName: 'Base',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrl: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    explorerName: 'BaseScan',
    isTestnet: false
  }
};

/**
 * Network IDs
 */
export const NETWORK_IDS = {
  SEPOLIA: 11155111,
  BASE_SEPOLIA: 84532,
  BASE: 8453
};

/**
 * Default Network (for development)
 */
export const DEFAULT_NETWORK = NETWORKS.BASE_SEPOLIA;

/**
 * Get network by chain ID
 * @param {number} chainId - The chain ID
 * @returns {object|null} - Network object or null
 */
export function getNetworkByChainId(chainId) {
  return Object.values(NETWORKS).find(network => network.id === chainId) || null;
}

/**
 * Get explorer URL for address
 * @param {number} chainId - The chain ID
 * @param {string} address - The address
 * @returns {string} - Explorer URL
 */
export function getExplorerAddressUrl(chainId, address) {
  const network = getNetworkByChainId(chainId);
  if (!network) return '';
  return `${network.explorerUrl}/address/${address}`;
}

/**
 * Get explorer URL for transaction
 * @param {number} chainId - The chain ID
 * @param {string} txHash - The transaction hash
 * @returns {string} - Explorer URL
 */
export function getExplorerTxUrl(chainId, txHash) {
  const network = getNetworkByChainId(chainId);
  if (!network) return '';
  return `${network.explorerUrl}/tx/${txHash}`;
}

/**
 * Check if network is testnet
 * @param {number} chainId - The chain ID
 * @returns {boolean} - True if testnet
 */
export function isTestnet(chainId) {
  const network = getNetworkByChainId(chainId);
  return network ? network.isTestnet : false;
}

export default {
  NETWORKS,
  NETWORK_IDS,
  DEFAULT_NETWORK,
  getNetworkByChainId,
  getExplorerAddressUrl,
  getExplorerTxUrl,
  isTestnet
};
