/**
 * X402 Protocol Configuration
 * 
 * Configuration for X402 open payment protocol integration
 */

// USDC Token Addresses
const USDC_ADDRESSES = {
  // Base Sepolia Testnet
  baseSepolia: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  // Base Mainnet
  base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  // Ethereum Sepolia (for testing)
  sepolia: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'
};

// X402 Batch Settlement Contract Addresses
const BATCH_SETTLEMENT_ADDRESSES = {
  baseSepolia: process.env.X402_BATCH_SETTLEMENT_BASE_SEPOLIA || '',
  base: process.env.X402_BATCH_SETTLEMENT_BASE || ''
};

// Network Configuration
const NETWORKS = {
  baseSepolia: {
    name: 'Base Sepolia',
    chainId: 84532,
    rpcUrl: process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
    explorer: 'https://sepolia.basescan.org'
  },
  base: {
    name: 'Base',
    chainId: 8453,
    rpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
    explorer: 'https://basescan.org'
  }
};

// Default network (use environment variable or default to testnet)
const DEFAULT_NETWORK = process.env.X402_NETWORK || 'baseSepolia';

// Relayer Configuration
const RELAYER_CONFIG = {
  // Batch size limits
  minBatchSize: parseInt(process.env.X402_MIN_BATCH_SIZE) || 5,
  maxBatchSize: parseInt(process.env.X402_MAX_BATCH_SIZE) || 50,
  
  // Timing
  batchInterval: parseInt(process.env.X402_BATCH_INTERVAL) || 60000, // 1 minute
  
  // Gas settings
  gasLimitBuffer: 1.2, // 20% buffer
  maxGasPrice: process.env.X402_MAX_GAS_PRICE || '100000000000', // 100 gwei
  
  // Retry settings
  maxRetries: 3,
  retryDelay: 5000 // 5 seconds
};

// API Pricing Defaults
const DEFAULT_PRICING = {
  // Default price: 1 USDC (6 decimals)
  defaultPrice: '1000000',
  
  // Default expiry: 1 hour
  defaultExpiry: 3600,
  
  // Minimum price: 0.0001 USDC
  minimumPrice: '100',
  
  // Maximum price: 1000 USDC
  maximumPrice: '1000000000'
};

// Security Settings
const SECURITY = {
  // Nonce expiry: 24 hours
  nonceExpiry: 24 * 60 * 60,
  
  // Maximum authorization expiry: 7 days
  maxAuthorizationExpiry: 7 * 24 * 60 * 60,
  
  // Rate limiting
  rateLimit: {
    windowMs: 60000, // 1 minute
    maxRequests: 100
  }
};

// Get configuration for current network
function getNetworkConfig(network = DEFAULT_NETWORK) {
  return {
    network: NETWORKS[network],
    usdcAddress: USDC_ADDRESSES[network],
    batchSettlementAddress: BATCH_SETTLEMENT_ADDRESSES[network],
    relayer: RELAYER_CONFIG,
    pricing: DEFAULT_PRICING,
    security: SECURITY
  };
}

// Get USDC address for network
function getUSDCAddress(network = DEFAULT_NETWORK) {
  return USDC_ADDRESSES[network];
}

// Get batch settlement address for network
function getBatchSettlementAddress(network = DEFAULT_NETWORK) {
  const address = BATCH_SETTLEMENT_ADDRESSES[network];
  if (!address) {
    throw new Error(`Batch settlement contract not deployed on ${network}`);
  }
  return address;
}

// Validate configuration
function validateConfig() {
  const errors = [];
  
  // Check if batch settlement address is configured
  if (!BATCH_SETTLEMENT_ADDRESSES[DEFAULT_NETWORK]) {
    errors.push(`X402 batch settlement address not configured for ${DEFAULT_NETWORK}`);
  }
  
  // Check if private key is configured
  if (!process.env.PRIVATE_KEY) {
    errors.push('PRIVATE_KEY not configured for relayer');
  }
  
  // Check if RPC URL is configured
  if (!NETWORKS[DEFAULT_NETWORK].rpcUrl) {
    errors.push(`RPC URL not configured for ${DEFAULT_NETWORK}`);
  }
  
  if (errors.length > 0) {
    console.warn('⚠️  X402 Configuration Warnings:');
    errors.forEach(error => console.warn(`   - ${error}`));
  }
  
  return errors.length === 0;
}

module.exports = {
  USDC_ADDRESSES,
  BATCH_SETTLEMENT_ADDRESSES,
  NETWORKS,
  DEFAULT_NETWORK,
  RELAYER_CONFIG,
  DEFAULT_PRICING,
  SECURITY,
  getNetworkConfig,
  getUSDCAddress,
  getBatchSettlementAddress,
  validateConfig
};
