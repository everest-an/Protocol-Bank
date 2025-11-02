/**
 * IPFS 上传工具
 * 
 * 用于将 Agent 注册文件、反馈详情、验证证据等数据上传到 IPFS
 * 
 * 支持多个 IPFS 服务：
 * - Pinata (推荐)
 * - NFT.Storage
 * - Web3.Storage
 * - 本地 IPFS 节点
 */

// ============================================================================
// IPFS 服务配置
// ============================================================================

const IPFS_GATEWAYS = {
  pinata: 'https://gateway.pinata.cloud/ipfs/',
  nftstorage: 'https://nftstorage.link/ipfs/',
  web3storage: 'https://w3s.link/ipfs/',
  ipfs: 'https://ipfs.io/ipfs/',
  cloudflare: 'https://cloudflare-ipfs.com/ipfs/',
};

const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY || '';
const PINATA_SECRET_KEY = import.meta.env.VITE_PINATA_SECRET_KEY || '';

// ============================================================================
// 上传到 Pinata
// ============================================================================

/**
 * 上传 JSON 数据到 Pinata IPFS
 * @param {Object} data - 要上传的 JSON 数据
 * @param {string} name - 文件名称（可选）
 * @returns {Promise<string>} IPFS URI (ipfs://cid)
 */
export async function uploadToPinata(data, name = 'data.json') {
  if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
    console.warn('Pinata API keys not configured, using fallback');
    return uploadToFallback(data, name);
  }

  try {
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET_KEY,
      },
      body: JSON.stringify({
        pinataContent: data,
        pinataMetadata: {
          name: name,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Pinata upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    return `ipfs://${result.IpfsHash}`;
  } catch (error) {
    console.error('Pinata upload error:', error);
    return uploadToFallback(data, name);
  }
}

// ============================================================================
// 备用上传方案（使用公共 IPFS 网关）
// ============================================================================

/**
 * 备用上传方案：将数据编码为 base64 并存储在本地
 * 注意：这不是真正的 IPFS 上传，仅用于演示和测试
 * 
 * @param {Object} data - 要上传的数据
 * @param {string} name - 文件名称
 * @returns {Promise<string>} 模拟的 IPFS URI
 */
async function uploadToFallback(data, name) {
  // 在生产环境中，这应该使用真正的 IPFS 服务
  // 这里我们使用 localStorage 作为临时存储
  const jsonString = JSON.stringify(data);
  const hash = await generateHash(jsonString);
  
  // 存储到 localStorage（仅用于演示）
  if (typeof window !== 'undefined') {
    const storageKey = `ipfs_${hash}`;
    localStorage.setItem(storageKey, jsonString);
    console.warn(`Data stored locally with key: ${storageKey}`);
  }
  
  // 返回模拟的 IPFS URI
  return `ipfs://${hash}`;
}

/**
 * 生成数据的 SHA-256 哈希
 * @param {string} data - 数据字符串
 * @returns {Promise<string>} 哈希值（十六进制）
 */
async function generateHash(data) {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================================
// 从 IPFS 读取数据
// ============================================================================

/**
 * 从 IPFS URI 读取 JSON 数据
 * @param {string} uri - IPFS URI (ipfs://cid 或 https://...)
 * @returns {Promise<Object>} JSON 数据
 */
export async function fetchFromIPFS(uri) {
  // 如果是 ipfs:// 协议，转换为 HTTP 网关 URL
  let url = uri;
  if (uri.startsWith('ipfs://')) {
    const cid = uri.replace('ipfs://', '');
    
    // 首先尝试从本地存储读取（如果使用了 fallback）
    if (typeof window !== 'undefined') {
      const storageKey = `ipfs_${cid}`;
      const localData = localStorage.getItem(storageKey);
      if (localData) {
        return JSON.parse(localData);
      }
    }
    
    // 尝试多个 IPFS 网关
    url = IPFS_GATEWAYS.pinata + cid;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch from IPFS: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('IPFS fetch error:', error);
    
    // 如果第一个网关失败，尝试其他网关
    if (uri.startsWith('ipfs://')) {
      const cid = uri.replace('ipfs://', '');
      for (const [name, gateway] of Object.entries(IPFS_GATEWAYS)) {
        if (gateway === IPFS_GATEWAYS.pinata) continue; // 已经尝试过
        
        try {
          const fallbackUrl = gateway + cid;
          const response = await fetch(fallbackUrl);
          if (response.ok) {
            return await response.json();
          }
        } catch (e) {
          console.warn(`Gateway ${name} failed:`, e);
        }
      }
    }
    
    throw error;
  }
}

// ============================================================================
// Agent 注册文件上传
// ============================================================================

/**
 * 上传 Agent 注册文件到 IPFS
 * @param {Object} registration - Agent 注册数据
 * @returns {Promise<string>} IPFS URI
 */
export async function uploadAgentRegistration(registration) {
  // 验证注册文件格式
  validateRegistration(registration);
  
  // 上传到 IPFS
  const uri = await uploadToPinata(registration, `agent_${registration.name}.json`);
  
  console.log(`Agent registration uploaded to IPFS: ${uri}`);
  return uri;
}

/**
 * 验证 Agent 注册文件格式
 * @param {Object} registration - Agent 注册数据
 * @throws {Error} 如果格式无效
 */
function validateRegistration(registration) {
  const required = ['type', 'name', 'description'];
  for (const field of required) {
    if (!registration[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  if (registration.type !== 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1') {
    throw new Error('Invalid registration type');
  }
}

// ============================================================================
// 反馈详情上传
// ============================================================================

/**
 * 上传反馈详情到 IPFS
 * @param {Object} feedback - 反馈数据
 * @returns {Promise<string>} IPFS URI
 */
export async function uploadFeedback(feedback) {
  const uri = await uploadToPinata(feedback, `feedback_${Date.now()}.json`);
  console.log(`Feedback uploaded to IPFS: ${uri}`);
  return uri;
}

/**
 * 创建反馈详情对象
 * @param {Object} params - 反馈参数
 * @returns {Object} 反馈详情对象
 */
export function createFeedbackDetails(params) {
  return {
    timestamp: Date.now(),
    score: params.score,
    comment: params.comment || '',
    serviceType: params.serviceType || 'payment',
    transactionHash: params.transactionHash || '',
    metadata: params.metadata || {},
  };
}

// ============================================================================
// 验证证据上传
// ============================================================================

/**
 * 上传验证证据到 IPFS
 * @param {Object} evidence - 验证证据数据
 * @returns {Promise<string>} IPFS URI
 */
export async function uploadValidationEvidence(evidence) {
  const uri = await uploadToPinata(evidence, `evidence_${Date.now()}.json`);
  console.log(`Validation evidence uploaded to IPFS: ${uri}`);
  return uri;
}

/**
 * 创建验证证据对象
 * @param {Object} params - 证据参数
 * @returns {Object} 验证证据对象
 */
export function createValidationEvidence(params) {
  return {
    timestamp: Date.now(),
    taskType: params.taskType || 'payment',
    taskId: params.taskId || '',
    inputData: params.inputData || {},
    outputData: params.outputData || {},
    executionDetails: {
      startTime: params.startTime || Date.now(),
      endTime: params.endTime || Date.now(),
      gasUsed: params.gasUsed || 0,
      transactionHash: params.transactionHash || '',
      blockNumber: params.blockNumber || 0,
    },
    metadata: params.metadata || {},
  };
}

// ============================================================================
// 验证响应上传
// ============================================================================

/**
 * 上传验证响应到 IPFS
 * @param {Object} response - 验证响应数据
 * @returns {Promise<string>} IPFS URI
 */
export async function uploadValidationResponse(response) {
  const uri = await uploadToPinata(response, `validation_response_${Date.now()}.json`);
  console.log(`Validation response uploaded to IPFS: ${uri}`);
  return uri;
}

/**
 * 创建验证响应对象
 * @param {Object} params - 响应参数
 * @returns {Object} 验证响应对象
 */
export function createValidationResponse(params) {
  return {
    timestamp: Date.now(),
    score: params.score,
    validatorComment: params.comment || '',
    validationMethod: params.method || 'manual',
    findings: params.findings || [],
    recommendations: params.recommendations || [],
    metadata: params.metadata || {},
  };
}

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 将 IPFS URI 转换为 HTTP URL
 * @param {string} uri - IPFS URI (ipfs://cid)
 * @param {string} gateway - 网关名称（默认 'pinata'）
 * @returns {string} HTTP URL
 */
export function ipfsToHttp(uri, gateway = 'pinata') {
  if (!uri.startsWith('ipfs://')) {
    return uri;
  }
  const cid = uri.replace('ipfs://', '');
  const gatewayUrl = IPFS_GATEWAYS[gateway] || IPFS_GATEWAYS.pinata;
  return gatewayUrl + cid;
}

/**
 * 从 IPFS URI 提取 CID
 * @param {string} uri - IPFS URI (ipfs://cid)
 * @returns {string} CID
 */
export function extractCID(uri) {
  return uri.replace('ipfs://', '');
}

// ============================================================================
// 导出
// ============================================================================

export default {
  upload: uploadToPinata,
  fetch: fetchFromIPFS,
  uploadAgentRegistration,
  uploadFeedback,
  uploadValidationEvidence,
  uploadValidationResponse,
  createFeedbackDetails,
  createValidationEvidence,
  createValidationResponse,
  ipfsToHttp,
  extractCID,
};

