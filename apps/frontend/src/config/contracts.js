/**
 * 智能合约配置文件
 * Smart Contract Configuration
 * 
 * 统一管理所有智能合约的地址和网络配置
 * Centralized management of all smart contract addresses and network configuration
 */

// Sepolia 测试网配置
// Sepolia Testnet Configuration
export const SEPOLIA_CONFIG = {
  chainId: 11155111,
  chainIdHex: '0xaa36a7',
  name: 'Sepolia Test Network',
  rpcUrl: import.meta.env.VITE_ALCHEMY_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/N-UzzxYZbLPikS4Fc6pqC',
  explorerUrl: 'https://sepolia.etherscan.io',
  nativeCurrency: {
    name: 'Sepolia ETH',
    symbol: 'ETH',
    decimals: 18
  }
}

// StakedPaymentEscrow 合约配置
// StakedPaymentEscrow Contract Configuration
export const STAKED_ESCROW_CONTRACT = {
  address: import.meta.env.VITE_STAKED_ESCROW_ADDRESS || '0x44a55360BaBc86d6443471Aa473E9Fa693037f04',
  network: 'sepolia',
  chainId: SEPOLIA_CONFIG.chainId
}

// StreamPayment 合约配置
// StreamPayment Contract Configuration
// 部署时间: 2025-10-29 18:03:25 UTC
// Deployed: 2025-10-29 18:03:25 UTC
export const STREAM_PAYMENT_CONTRACT = {
  address: '0x642B0c309358D083EE83748b4C22572aa28AebF7',
  network: 'sepolia',
  chainId: SEPOLIA_CONFIG.chainId
}

// Mock USDC 合约配置（用于测试）
// Mock USDC Contract Configuration (for testing)
// 部署时间: 2025-10-29 18:03:25 UTC
// Deployed: 2025-10-29 18:03:25 UTC
export const MOCK_USDC_CONTRACT = {
  address: '0x51eDB4f010A695fb727C537F0B2463E632d4b026',
  network: 'sepolia',
  chainId: SEPOLIA_CONFIG.chainId,
  symbol: 'USDC',
  decimals: 6
}

// Mock DAI 合约配置（用于测试）
// Mock DAI Contract Configuration (for testing)
// 部署时间: 2025-10-29 18:03:25 UTC
// Deployed: 2025-10-29 18:03:25 UTC
export const MOCK_DAI_CONTRACT = {
  address: '0xc4844510f5954a27db7452754604C074a07066Fb',
  network: 'sepolia',
  chainId: SEPOLIA_CONFIG.chainId,
  symbol: 'DAI',
  decimals: 18
}

/**
 * 获取合约浏览器链接
 * Get contract explorer link
 * @param {string} address - 合约地址 / Contract address
 * @returns {string} - 浏览器链接 / Explorer link
 */
export function getContractExplorerLink(address) {
  return `${SEPOLIA_CONFIG.explorerUrl}/address/${address}`
}

/**
 * 获取交易浏览器链接
 * Get transaction explorer link
 * @param {string} txHash - 交易哈希 / Transaction hash
 * @returns {string} - 浏览器链接 / Explorer link
 */
export function getTransactionExplorerLink(txHash) {
  return `${SEPOLIA_CONFIG.explorerUrl}/tx/${txHash}`
}

/**
 * 检查是否为 Sepolia 网络
 * Check if current network is Sepolia
 * @param {number} chainId - 链 ID / Chain ID
 * @returns {boolean} - 是否为 Sepolia / Is Sepolia
 */
export function isSepolia(chainId) {
  return chainId === SEPOLIA_CONFIG.chainId
}

