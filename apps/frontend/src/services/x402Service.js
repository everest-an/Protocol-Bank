import { ethers } from 'ethers';

/**
 * X402 Batch Settlement Service
 * 
 * Implements EIP-3009 transferWithAuthorization signature generation
 * for gasless batch payments through X402 protocol.
 * 
 * @author Protocol Bank Team
 */

// Contract addresses (Sepolia testnet)
export const X402_CONFIG = {
  BATCH_SETTLEMENT_ADDRESS: '0x47C1eC37fB91E69e0FCD901B2F89b40FD724E11b',
  MOCK_USDC_ADDRESS: '0x114E248bdF47Bad9948bF94d84848bAC1E36b75C',
  NETWORK: 'sepolia',
  CHAIN_ID: 11155111,
};

// EIP-3009 Transfer With Authorization typehash
const TRANSFER_WITH_AUTHORIZATION_TYPEHASH = ethers.keccak256(
  ethers.toUtf8Bytes(
    'TransferWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)'
  )
);

// EIP-712 Domain for MockUSDC
const EIP712_DOMAIN = {
  name: 'Mock USDC',
  version: '1',
  chainId: X402_CONFIG.CHAIN_ID,
  verifyingContract: X402_CONFIG.MOCK_USDC_ADDRESS,
};

/**
 * Generate a unique nonce for EIP-3009 authorization
 * 
 * @param {string} userAddress - User's Ethereum address
 * @returns {string} Unique nonce as bytes32 hex string
 */
export function generateNonce(userAddress) {
  const timestamp = Date.now();
  const randomBytes = ethers.randomBytes(16);
  
  // Create unique nonce: keccak256(address + timestamp + random)
  const nonce = ethers.keccak256(
    ethers.concat([
      ethers.getBytes(userAddress),
      ethers.toBeArray(timestamp),
      randomBytes
    ])
  );
  
  return nonce;
}

/**
 * Sign EIP-3009 transferWithAuthorization
 * 
 * @param {Object} signer - Ethers signer instance
 * @param {Object} params - Authorization parameters
 * @param {string} params.from - Payer address
 * @param {string} params.to - Recipient address
 * @param {string} params.value - Amount in token's smallest unit (e.g., 1000000 = 1 USDC)
 * @param {number} params.validAfter - Valid after timestamp (usually 0)
 * @param {number} params.validBefore - Expiry timestamp
 * @param {string} params.nonce - Unique nonce (bytes32)
 * 
 * @returns {Promise<Object>} Signature components {v, r, s}
 */
export async function signTransferAuthorization(signer, params) {
  const { from, to, value, validAfter, validBefore, nonce } = params;
  
  // EIP-712 typed data
  const types = {
    TransferWithAuthorization: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'validAfter', type: 'uint256' },
      { name: 'validBefore', type: 'uint256' },
      { name: 'nonce', type: 'bytes32' },
    ],
  };
  
  const message = {
    from,
    to,
    value,
    validAfter,
    validBefore,
    nonce,
  };
  
  try {
    // Sign typed data (EIP-712)
    const signature = await signer.signTypedData(
      EIP712_DOMAIN,
      types,
      message
    );
    
    // Split signature into v, r, s components
    const sig = ethers.Signature.from(signature);
    
    return {
      v: sig.v,
      r: sig.r,
      s: sig.s,
      signature, // Full signature for debugging
    };
  } catch (error) {
    console.error('Error signing authorization:', error);
    throw new Error(`Failed to sign authorization: ${error.message}`);
  }
}

/**
 * Prepare batch payment authorizations
 * 
 * @param {Object} signer - Ethers signer instance
 * @param {Array} payments - Array of payment objects
 * @param {string} payments[].to - Recipient address
 * @param {string} payments[].amount - Amount in USDC (e.g., "10.5")
 * 
 * @returns {Promise<Array>} Array of authorization objects ready for smart contract
 */
export async function prepareBatchAuthorizations(signer, payments) {
  const userAddress = await signer.getAddress();
  const currentTime = Math.floor(Date.now() / 1000);
  const validBefore = currentTime + 3600; // Valid for 1 hour
  
  const authorizations = [];
  
  for (const payment of payments) {
    // Convert USDC amount to smallest unit (6 decimals)
    const value = ethers.parseUnits(payment.amount, 6);
    
    // Generate unique nonce
    const nonce = generateNonce(userAddress);
    
    // Sign authorization
    const { v, r, s } = await signTransferAuthorization(signer, {
      from: userAddress,
      to: payment.to,
      value: value.toString(),
      validAfter: 0, // Valid immediately
      validBefore,
      nonce,
    });
    
    // Prepare authorization object for smart contract
    authorizations.push({
      from: userAddress,
      to: payment.to,
      value: value.toString(),
      validAfter: 0,
      validBefore,
      nonce,
      v,
      r,
      s,
    });
  }
  
  return authorizations;
}

/**
 * Execute X402 batch settlement
 * 
 * @param {Object} provider - Ethers provider instance
 * @param {Array} authorizations - Array of signed authorizations
 * 
 * @returns {Promise<Object>} Transaction result
 */
export async function executeBatchSettlement(provider, authorizations) {
  const signer = await provider.getSigner();
  
  // X402BatchSettlement contract ABI (only the function we need)
  const abi = [
    'function batchTransferWithAuthorization(tuple(address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, uint8 v, bytes32 r, bytes32 s)[] authorizations) external returns (uint256 batchId, uint256 successCount)',
  ];
  
  // Create contract instance
  const contract = new ethers.Contract(
    X402_CONFIG.BATCH_SETTLEMENT_ADDRESS,
    abi,
    signer
  );
  
  try {
    console.log(`Executing batch settlement for ${authorizations.length} payments...`);
    
    // Call smart contract
    const tx = await contract.batchTransferWithAuthorization(authorizations);
    console.log('Transaction sent:', tx.hash);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt.hash);
    
    // Parse events to get batchId and successCount
    // Note: In production, parse events properly
    const batchId = receipt.logs.length > 0 ? receipt.logs[0].topics[1] : null;
    
    return {
      success: true,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      batchId: batchId ? parseInt(batchId, 16) : null,
      successCount: authorizations.length, // Simplified - should parse from events
    };
  } catch (error) {
    console.error('Batch settlement failed:', error);
    return {
      success: false,
      error: error.message || 'Batch settlement failed',
    };
  }
}

/**
 * Get MockUSDC contract instance
 * 
 * @param {Object} provider - Ethers provider instance
 * @returns {Object} Contract instance
 */
export function getMockUSDCContract(provider) {
  const abi = [
    'function balanceOf(address account) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    'function faucet(uint256 amount) external',
    'function approve(address spender, uint256 amount) external returns (bool)',
  ];
  
  return new ethers.Contract(
    X402_CONFIG.MOCK_USDC_ADDRESS,
    abi,
    provider
  );
}

/**
 * Check if user has enough USDC balance
 * 
 * @param {Object} provider - Ethers provider instance
 * @param {string} userAddress - User's address
 * @param {string} totalAmount - Total amount needed in USDC
 * 
 * @returns {Promise<Object>} Balance check result
 */
export async function checkUSDCBalance(provider, userAddress, totalAmount) {
  const usdcContract = getMockUSDCContract(provider);
  
  try {
    const balance = await usdcContract.balanceOf(userAddress);
    const required = ethers.parseUnits(totalAmount, 6);
    
    return {
      hasEnough: balance >= required,
      balance: ethers.formatUnits(balance, 6),
      required: totalAmount,
      shortfall: balance < required ? ethers.formatUnits(required - balance, 6) : '0',
    };
  } catch (error) {
    console.error('Error checking USDC balance:', error);
    throw error;
  }
}

/**
 * Request test USDC from faucet
 * 
 * @param {Object} provider - Ethers provider instance
 * @param {string} amount - Amount to request (e.g., "1000")
 * 
 * @returns {Promise<Object>} Faucet result
 */
export async function requestTestUSDC(provider, amount = '1000') {
  const signer = await provider.getSigner();
  const usdcContract = getMockUSDCContract(provider).connect(signer);
  
  try {
    const amountInSmallestUnit = ethers.parseUnits(amount, 6);
    const tx = await usdcContract.faucet(amountInSmallestUnit);
    await tx.wait();
    
    return {
      success: true,
      amount,
      txHash: tx.hash,
    };
  } catch (error) {
    console.error('Faucet request failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
