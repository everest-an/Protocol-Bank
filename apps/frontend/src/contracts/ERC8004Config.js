/**
 * ERC-8004 Trustless Agents 合约配置
 * 
 * ERC-8004 是一个去中心化的 AI Agent 信任层协议
 * 通过三个核心注册表实现无需预先信任的 Agent 交互：
 * 1. Identity Registry - Agent 身份管理（基于 ERC-721）
 * 2. Reputation Registry - 声誉和反馈系统
 * 3. Validation Registry - 独立验证机制
 * 
 * @see https://eips.ethereum.org/EIPS/eip-8004
 * @see https://github.com/ChaosChain/trustless-agents-erc-ri
 */

// ============================================================================
// 合约地址配置（确定性部署，所有网络使用相同地址）
// ============================================================================

export const ERC8004_CONTRACTS = {
  // Ethereum Sepolia Testnet
  11155111: {
    identityRegistry: '0x7177a6867296406881E20d6647232314736Dd09A',
    reputationRegistry: '0xB5048e3ef1DA4E04deB6f7d0423D06F63869e322',
    validationRegistry: '0x662b40A526cb4017d947e71eAF6753BF3eeE66d8',
    network: 'Ethereum Sepolia',
    explorer: 'https://sepolia.etherscan.io',
  },
  // Base Sepolia Testnet
  84532: {
    identityRegistry: '0x7177a6867296406881E20d6647232314736Dd09A',
    reputationRegistry: '0xB5048e3ef1DA4E04deB6f7d0423D06F63869e322',
    validationRegistry: '0x662b40A526cb4017d947e71eAF6753BF3eeE66d8',
    network: 'Base Sepolia',
    explorer: 'https://sepolia.basescan.org',
  },
  // Optimism Sepolia Testnet
  11155420: {
    identityRegistry: '0x7177a6867296406881E20d6647232314736Dd09A',
    reputationRegistry: '0xB5048e3ef1DA4E04deB6f7d0423D06F63869e322',
    validationRegistry: '0x662b40A526cb4017d947e71eAF6753BF3eeE66d8',
    network: 'Optimism Sepolia',
    explorer: 'https://sepolia-optimism.etherscan.io',
  },
  // Mode Testnet
  919: {
    identityRegistry: '0x7177a6867296406881E20d6647232314736Dd09A',
    reputationRegistry: '0xB5048e3ef1DA4E04deB6f7d0423D06F63869e322',
    validationRegistry: '0x662b40A526cb4017d947e71eAF6753BF3eeE66d8',
    network: 'Mode Testnet',
    explorer: 'https://sepolia.explorer.mode.network',
  },
  // 0G Testnet
  16602: {
    identityRegistry: '0x7177a6867296406881E20d6647232314736Dd09A',
    reputationRegistry: '0xB5048e3ef1DA4E04deB6f7d0423D06F63869e322',
    validationRegistry: '0x662b40A526cb4017d947e71eAF6753BF3eeE66d8',
    network: '0G Testnet',
    explorer: 'https://explorer.0g.ai',
  },
};

// ============================================================================
// Identity Registry ABI
// ============================================================================

export const IDENTITY_REGISTRY_ABI = [
  // 注册函数
  'function register(string memory tokenURI, tuple(string key, bytes value)[] memory metadata) external returns (uint256 agentId)',
  'function register(string memory tokenURI) external returns (uint256 agentId)',
  'function register() external returns (uint256 agentId)',
  
  // 元数据管理
  'function setMetadata(uint256 agentId, string memory key, bytes memory value) external',
  'function getMetadata(uint256 agentId, string memory key) external view returns (bytes memory)',
  
  // ERC-721 标准函数
  'function ownerOf(uint256 tokenId) external view returns (address)',
  'function tokenURI(uint256 tokenId) external view returns (string memory)',
  'function balanceOf(address owner) external view returns (uint256)',
  'function transferFrom(address from, address to, uint256 tokenId) external',
  'function approve(address to, uint256 tokenId) external',
  'function setApprovalForAll(address operator, bool approved) external',
  'function getApproved(uint256 tokenId) external view returns (address)',
  'function isApprovedForAll(address owner, address operator) external view returns (bool)',
  
  // 事件
  'event Registered(uint256 indexed agentId, string tokenURI, address indexed owner)',
  'event MetadataSet(uint256 indexed agentId, string indexed indexedKey, string key, bytes value)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
];

// ============================================================================
// Reputation Registry ABI
// ============================================================================

export const REPUTATION_REGISTRY_ABI = [
  // 反馈管理
  'function giveFeedback(uint256 agentId, uint8 score, bytes32 tag1, bytes32 tag2, string memory fileuri, bytes32 filehash, bytes memory feedbackAuth) external',
  'function revokeFeedback(uint256 agentId, uint64 feedbackIndex) external',
  'function appendResponse(uint256 agentId, address clientAddress, uint64 feedbackIndex, string memory responseUri, bytes32 responseHash) external',
  
  // 读取函数
  'function getSummary(uint256 agentId, address[] memory clientAddresses, bytes32 tag1, bytes32 tag2) external view returns (uint64 count, uint8 averageScore)',
  'function readFeedback(uint256 agentId, address clientAddress, uint64 index) external view returns (uint8 score, bytes32 tag1, bytes32 tag2, bool isRevoked)',
  'function readAllFeedback(uint256 agentId, address[] memory clientAddresses, bytes32 tag1, bytes32 tag2, bool includeRevoked) external view returns (address[] memory, uint8[] memory, bytes32[] memory, bytes32[] memory, bool[] memory)',
  'function getClients(uint256 agentId) external view returns (address[] memory)',
  'function getLastIndex(uint256 agentId, address clientAddress) external view returns (uint64)',
  'function getResponseCount(uint256 agentId, address clientAddress, uint64 feedbackIndex, address[] memory responders) external view returns (uint64)',
  
  // 注册表信息
  'function getIdentityRegistry() external view returns (address)',
  
  // 事件
  'event NewFeedback(uint256 indexed agentId, address indexed clientAddress, uint8 score, bytes32 indexed tag1, bytes32 tag2, string fileuri, bytes32 filehash)',
  'event FeedbackRevoked(uint256 indexed agentId, address indexed clientAddress, uint64 indexed feedbackIndex)',
  'event ResponseAppended(uint256 indexed agentId, address indexed clientAddress, uint64 feedbackIndex, address indexed responder, string responseUri)',
];

// ============================================================================
// Validation Registry ABI
// ============================================================================

export const VALIDATION_REGISTRY_ABI = [
  // 验证管理
  'function requestValidation(uint256 agentId, address validatorAddress, bytes32 tag1, bytes32 tag2, string memory evidenceUri, bytes32 evidenceHash) external returns (uint64 validationId)',
  'function respondToValidation(uint256 agentId, uint64 validationId, uint8 score, string memory responseUri, bytes32 responseHash) external',
  
  // 读取函数
  'function getValidation(uint256 agentId, uint64 validationId) external view returns (address requester, address validator, uint8 score, bytes32 tag1, bytes32 tag2, string evidenceUri, string responseUri, bool isCompleted)',
  'function getValidationCount(uint256 agentId) external view returns (uint64)',
  'function getAllValidations(uint256 agentId, address[] memory requesters, address[] memory validators, bytes32 tag1, bytes32 tag2, bool includeIncomplete) external view returns (uint64[] memory, address[] memory, address[] memory, uint8[] memory, bool[] memory)',
  
  // 注册表信息
  'function getIdentityRegistry() external view returns (address)',
  
  // 事件
  'event ValidationRequested(uint256 indexed agentId, uint64 indexed validationId, address indexed requester, address validator, bytes32 tag1, bytes32 tag2, string evidenceUri)',
  'event ValidationResponded(uint256 indexed agentId, uint64 indexed validationId, address indexed validator, uint8 score, string responseUri)',
];

// ============================================================================
// Agent 注册文件类型定义
// ============================================================================

/**
 * Agent 注册文件结构
 * @typedef {Object} AgentRegistration
 * @property {string} type - 注册文件类型（固定值）
 * @property {string} name - Agent 名称
 * @property {string} description - Agent 描述
 * @property {string} image - Agent 图片 URL
 * @property {Array<Endpoint>} endpoints - Agent 端点列表
 * @property {Array<Registration>} registrations - Agent 注册信息
 * @property {Array<string>} supportedTrust - 支持的信任模型
 */

/**
 * Agent 端点
 * @typedef {Object} Endpoint
 * @property {string} name - 端点名称（如 'A2A', 'MCP', 'agentWallet'）
 * @property {string} endpoint - 端点 URL 或地址
 * @property {string} [version] - 端点版本（可选）
 */

/**
 * Agent 注册信息
 * @typedef {Object} Registration
 * @property {number} agentId - Agent ID
 * @property {string} agentRegistry - 注册表地址（格式：eip155:chainId:address）
 */

// ============================================================================
// 反馈授权结构
// ============================================================================

/**
 * 反馈授权结构（用于 EIP-712 签名）
 * @typedef {Object} FeedbackAuth
 * @property {number} agentId - Agent ID
 * @property {string} clientAddress - 客户地址
 * @property {number} indexLimit - 索引限制（防止重放攻击）
 * @property {number} expiry - 过期时间（Unix 时间戳）
 * @property {number} chainId - 链 ID
 * @property {string} identityRegistry - Identity Registry 地址
 * @property {string} signerAddress - 签名者地址
 */

export const FEEDBACK_AUTH_TYPES = {
  FeedbackAuth: [
    { name: 'agentId', type: 'uint256' },
    { name: 'clientAddress', type: 'address' },
    { name: 'indexLimit', type: 'uint64' },
    { name: 'expiry', type: 'uint256' },
    { name: 'chainId', type: 'uint256' },
    { name: 'identityRegistry', type: 'address' },
    { name: 'signerAddress', type: 'address' },
  ],
};

// ============================================================================
// 标签常量
// ============================================================================

/**
 * 预定义的反馈和验证标签
 * 用于分类和过滤反馈/验证
 */
export const TAGS = {
  // 支付相关标签
  PAYMENT: '0x7061796d656e7400000000000000000000000000000000000000000000000000', // 'payment'
  SCHEDULED: '0x7363686564756c6564000000000000000000000000000000000000000000000', // 'scheduled'
  BATCH: '0x6261746368000000000000000000000000000000000000000000000000000000', // 'batch'
  FLOW: '0x666c6f7700000000000000000000000000000000000000000000000000000000', // 'flow'
  
  // 质量标签
  SUCCESS: '0x7375636365737300000000000000000000000000000000000000000000000000', // 'success'
  FAILED: '0x6661696c656400000000000000000000000000000000000000000000000000', // 'failed'
  DELAYED: '0x64656c6179656400000000000000000000000000000000000000000000000000', // 'delayed'
  
  // 服务类型标签
  EXECUTOR: '0x657865637574f72000000000000000000000000000000000000000000000000', // 'executor'
  VALIDATOR: '0x76616c696461746f720000000000000000000000000000000000000000000000', // 'validator'
  ORACLE: '0x6f7261636c6500000000000000000000000000000000000000000000000000', // 'oracle'
};

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 获取当前链的 ERC-8004 合约配置
 * @param {number} chainId - 链 ID
 * @returns {Object} 合约配置对象
 */
export function getERC8004Config(chainId) {
  const config = ERC8004_CONTRACTS[chainId];
  if (!config) {
    throw new Error(`ERC-8004 contracts not deployed on chain ${chainId}`);
  }
  return config;
}

/**
 * 检查链是否支持 ERC-8004
 * @param {number} chainId - 链 ID
 * @returns {boolean} 是否支持
 */
export function isERC8004Supported(chainId) {
  return chainId in ERC8004_CONTRACTS;
}

/**
 * 获取所有支持的链 ID 列表
 * @returns {number[]} 链 ID 数组
 */
export function getSupportedChains() {
  return Object.keys(ERC8004_CONTRACTS).map(Number);
}

/**
 * 将字符串转换为 bytes32 标签
 * @param {string} str - 字符串（最多 32 字节）
 * @returns {string} bytes32 十六进制字符串
 */
export function stringToBytes32(str) {
  if (str.length > 32) {
    throw new Error('String too long for bytes32');
  }
  const hex = Buffer.from(str, 'utf8').toString('hex');
  return '0x' + hex.padEnd(64, '0');
}

/**
 * 将 bytes32 标签转换为字符串
 * @param {string} bytes32 - bytes32 十六进制字符串
 * @returns {string} 字符串
 */
export function bytes32ToString(bytes32) {
  const hex = bytes32.replace('0x', '');
  const buffer = Buffer.from(hex, 'hex');
  return buffer.toString('utf8').replace(/\0/g, '');
}

/**
 * 格式化 Agent 注册表地址
 * @param {number} chainId - 链 ID
 * @param {string} registryAddress - 注册表地址
 * @returns {string} 格式化的地址（eip155:chainId:address）
 */
export function formatRegistryAddress(chainId, registryAddress) {
  return `eip155:${chainId}:${registryAddress}`;
}

/**
 * 解析 Agent 注册表地址
 * @param {string} formattedAddress - 格式化的地址（eip155:chainId:address）
 * @returns {Object} { chainId, address }
 */
export function parseRegistryAddress(formattedAddress) {
  const parts = formattedAddress.split(':');
  if (parts.length !== 3 || parts[0] !== 'eip155') {
    throw new Error('Invalid registry address format');
  }
  return {
    chainId: parseInt(parts[1]),
    address: parts[2],
  };
}

// ============================================================================
// 导出默认配置
// ============================================================================

export default {
  contracts: ERC8004_CONTRACTS,
  abis: {
    identity: IDENTITY_REGISTRY_ABI,
    reputation: REPUTATION_REGISTRY_ABI,
    validation: VALIDATION_REGISTRY_ABI,
  },
  tags: TAGS,
  utils: {
    getERC8004Config,
    isERC8004Supported,
    getSupportedChains,
    stringToBytes32,
    bytes32ToString,
    formatRegistryAddress,
    parseRegistryAddress,
  },
};

