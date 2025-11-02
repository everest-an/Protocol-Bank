/**
 * StreamPayment 合约交互服务
 * Service for interacting with StreamPayment smart contract
 */

import { ethers } from 'ethers';
import { STREAM_PAYMENT_CONTRACT, MOCK_USDC_CONTRACT, MOCK_DAI_CONTRACT } from '../config/contracts';
import StreamPaymentABI from '../contracts/abis/StreamPayment.json';
import MockERC20ABI from '../contracts/abis/MockERC20.json';

/**
 * 获取 StreamPayment 合约实例
 * @param {ethers.Signer} signer - ethers signer instance
 * @returns {ethers.Contract} StreamPayment contract instance
 */
export function getStreamPaymentContract(signer) {
  return new ethers.Contract(
    STREAM_PAYMENT_CONTRACT.address,
    StreamPaymentABI,
    signer
  );
}

/**
 * 获取 ERC20 代币合约实例
 * @param {string} tokenAddress - Token contract address
 * @param {ethers.Signer} signer - ethers signer instance
 * @returns {ethers.Contract} ERC20 contract instance
 */
export function getERC20Contract(tokenAddress, signer) {
  return new ethers.Contract(
    tokenAddress,
    MockERC20ABI,
    signer
  );
}

/**
 * 创建流支付
 * @param {ethers.Signer} signer - ethers signer
 * @param {Object} params - Stream parameters
 * @param {string} params.recipient - Recipient address
 * @param {string} params.tokenAddress - Token contract address (USDC/DAI)
 * @param {string} params.amount - Amount to stream (in token units, e.g., "1000")
 * @param {number} params.duration - Duration in seconds
 * @param {string} params.streamName - Name of the stream
 * @returns {Promise<Object>} Transaction receipt and stream ID
 */
export async function createStream(signer, { recipient, tokenAddress, amount, duration, streamName }) {
  try {
    // Get token decimals
    const tokenContract = getERC20Contract(tokenAddress, signer);
    const decimals = await tokenContract.decimals();
    
    // Convert amount to wei
    const amountWei = ethers.parseUnits(amount.toString(), decimals);
    
    // Step 1: Approve token transfer
    console.log('Approving token transfer...');
    const approveTx = await tokenContract.approve(STREAM_PAYMENT_CONTRACT.address, amountWei);
    await approveTx.wait();
    console.log('✅ Token approved');
    
    // Step 2: Create stream
    console.log('Creating stream...');
    const streamContract = getStreamPaymentContract(signer);
    const createTx = await streamContract.createStream(
      recipient,
      tokenAddress,
      amountWei,
      duration,
      streamName
    );
    
    const receipt = await createTx.wait();
    console.log('✅ Stream created');
    
    // Extract stream ID from event
    const event = receipt.logs.find(log => {
      try {
        const parsed = streamContract.interface.parseLog(log);
        return parsed && parsed.name === 'StreamCreated';
      } catch {
        return false;
      }
    });
    
    let streamId = null;
    if (event) {
      const parsed = streamContract.interface.parseLog(event);
      streamId = parsed.args.streamId.toString();
    }
    
    return {
      success: true,
      txHash: receipt.hash,
      streamId,
      receipt
    };
  } catch (error) {
    console.error('Error creating stream:', error);
    throw error;
  }
}

/**
 * 获取流支付详情
 * @param {ethers.Provider|ethers.Signer} providerOrSigner - ethers provider or signer
 * @param {number|string} streamId - Stream ID
 * @returns {Promise<Object>} Stream details
 */
export async function getStream(providerOrSigner, streamId) {
  try {
    const contract = new ethers.Contract(
      STREAM_PAYMENT_CONTRACT.address,
      StreamPaymentABI,
      providerOrSigner
    );
    
    const stream = await contract.getStream(streamId);
    
    // Get token info
    const tokenContract = getERC20Contract(stream.token, providerOrSigner);
    const symbol = await tokenContract.symbol();
    const decimals = await tokenContract.decimals();
    
    return {
      streamId: streamId.toString(),
      sender: stream.sender,
      recipient: stream.recipient,
      token: stream.token,
      tokenSymbol: symbol,
      totalAmount: ethers.formatUnits(stream.totalAmount, decimals),
      withdrawnAmount: ethers.formatUnits(stream.withdrawnAmount, decimals),
      startTime: Number(stream.startTime),
      endTime: Number(stream.endTime),
      ratePerSecond: stream.ratePerSecond.toString(),
      isActive: stream.isActive,
      isPaused: stream.isPaused,
      streamName: stream.streamName
    };
  } catch (error) {
    console.error('Error getting stream:', error);
    throw error;
  }
}

/**
 * 获取可提取余额
 * @param {ethers.Provider|ethers.Signer} providerOrSigner - ethers provider or signer
 * @param {number|string} streamId - Stream ID
 * @param {string} recipient - Recipient address
 * @returns {Promise<string>} Available balance (formatted)
 */
export async function getAvailableBalance(providerOrSigner, streamId, recipient) {
  try {
    const contract = new ethers.Contract(
      STREAM_PAYMENT_CONTRACT.address,
      StreamPaymentABI,
      providerOrSigner
    );
    
    // Get stream info first to know the token
    const stream = await contract.getStream(streamId);
    const tokenContract = getERC20Contract(stream.token, providerOrSigner);
    const decimals = await tokenContract.decimals();
    
    // Get available balance
    const balance = await contract.getAvailableBalance(streamId, recipient);
    
    return ethers.formatUnits(balance, decimals);
  } catch (error) {
    console.error('Error getting available balance:', error);
    throw error;
  }
}

/**
 * 从流中提取资金
 * @param {ethers.Signer} signer - ethers signer
 * @param {number|string} streamId - Stream ID
 * @param {string} amount - Amount to withdraw (in token units)
 * @returns {Promise<Object>} Transaction receipt
 */
export async function withdrawFromStream(signer, streamId, amount) {
  try {
    const contract = getStreamPaymentContract(signer);
    
    // Get stream info to know the token decimals
    const stream = await contract.getStream(streamId);
    const tokenContract = getERC20Contract(stream.token, signer);
    const decimals = await tokenContract.decimals();
    
    // Convert amount to wei
    const amountWei = ethers.parseUnits(amount.toString(), decimals);
    
    console.log('Withdrawing from stream...');
    const tx = await contract.withdrawFromStream(streamId, amountWei);
    const receipt = await tx.wait();
    console.log('✅ Withdrawal successful');
    
    return {
      success: true,
      txHash: receipt.hash,
      receipt
    };
  } catch (error) {
    console.error('Error withdrawing from stream:', error);
    throw error;
  }
}

/**
 * 暂停流支付
 * @param {ethers.Signer} signer - ethers signer
 * @param {number|string} streamId - Stream ID
 * @returns {Promise<Object>} Transaction receipt
 */
export async function pauseStream(signer, streamId) {
  try {
    const contract = getStreamPaymentContract(signer);
    
    console.log('Pausing stream...');
    const tx = await contract.pauseStream(streamId);
    const receipt = await tx.wait();
    console.log('✅ Stream paused');
    
    return {
      success: true,
      txHash: receipt.hash,
      receipt
    };
  } catch (error) {
    console.error('Error pausing stream:', error);
    throw error;
  }
}

/**
 * 恢复流支付
 * @param {ethers.Signer} signer - ethers signer
 * @param {number|string} streamId - Stream ID
 * @returns {Promise<Object>} Transaction receipt
 */
export async function resumeStream(signer, streamId) {
  try {
    const contract = getStreamPaymentContract(signer);
    
    console.log('Resuming stream...');
    const tx = await contract.resumeStream(streamId);
    const receipt = await tx.wait();
    console.log('✅ Stream resumed');
    
    return {
      success: true,
      txHash: receipt.hash,
      receipt
    };
  } catch (error) {
    console.error('Error resuming stream:', error);
    throw error;
  }
}

/**
 * 取消流支付
 * @param {ethers.Signer} signer - ethers signer
 * @param {number|string} streamId - Stream ID
 * @returns {Promise<Object>} Transaction receipt
 */
export async function cancelStream(signer, streamId) {
  try {
    const contract = getStreamPaymentContract(signer);
    
    console.log('Cancelling stream...');
    const tx = await contract.cancelStream(streamId);
    const receipt = await tx.wait();
    console.log('✅ Stream cancelled');
    
    return {
      success: true,
      txHash: receipt.hash,
      receipt
    };
  } catch (error) {
    console.error('Error cancelling stream:', error);
    throw error;
  }
}

/**
 * 获取用户作为发送方的所有流
 * @param {ethers.Provider|ethers.Signer} providerOrSigner - ethers provider or signer
 * @param {string} address - User address
 * @returns {Promise<Array>} Array of stream IDs
 */
export async function getStreamsBySender(providerOrSigner, address) {
  try {
    const contract = new ethers.Contract(
      STREAM_PAYMENT_CONTRACT.address,
      StreamPaymentABI,
      providerOrSigner
    );
    
    const streamIds = await contract.getStreamsBySender(address);
    return streamIds.map(id => id.toString());
  } catch (error) {
    console.error('Error getting streams by sender:', error);
    throw error;
  }
}

/**
 * 获取用户作为接收方的所有流
 * @param {ethers.Provider|ethers.Signer} providerOrSigner - ethers provider or signer
 * @param {string} address - User address
 * @returns {Promise<Array>} Array of stream IDs
 */
export async function getStreamsByRecipient(providerOrSigner, address) {
  try {
    const contract = new ethers.Contract(
      STREAM_PAYMENT_CONTRACT.address,
      StreamPaymentABI,
      providerOrSigner
    );
    
    const streamIds = await contract.getStreamsByRecipient(address);
    return streamIds.map(id => id.toString());
  } catch (error) {
    console.error('Error getting streams by recipient:', error);
    throw error;
  }
}

/**
 * 获取用户的代币余额
 * @param {ethers.Provider|ethers.Signer} providerOrSigner - ethers provider or signer
 * @param {string} tokenAddress - Token contract address
 * @param {string} userAddress - User address
 * @returns {Promise<string>} Token balance (formatted)
 */
export async function getTokenBalance(providerOrSigner, tokenAddress, userAddress) {
  try {
    const tokenContract = getERC20Contract(tokenAddress, providerOrSigner);
    const balance = await tokenContract.balanceOf(userAddress);
    const decimals = await tokenContract.decimals();
    const symbol = await tokenContract.symbol();
    
    return {
      balance: ethers.formatUnits(balance, decimals),
      symbol,
      decimals: Number(decimals)
    };
  } catch (error) {
    console.error('Error getting token balance:', error);
    throw error;
  }
}

/**
 * 获取支持的代币列表
 * @returns {Array} Array of supported tokens
 */
export function getSupportedTokens() {
  return [
    {
      address: MOCK_USDC_CONTRACT.address,
      symbol: MOCK_USDC_CONTRACT.symbol,
      decimals: MOCK_USDC_CONTRACT.decimals,
      name: 'Mock USDC'
    },
    {
      address: MOCK_DAI_CONTRACT.address,
      symbol: MOCK_DAI_CONTRACT.symbol,
      decimals: MOCK_DAI_CONTRACT.decimals,
      name: 'Mock DAI'
    }
  ];
}
