/**
 * 声誉系统 Hook
 * 
 * 提供 Agent 声誉管理功能
 * 基于 ERC-8004 Reputation Registry 实现
 */

import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from './useWeb3';
import {
  getERC8004Config,
  REPUTATION_REGISTRY_ABI,
  FEEDBACK_AUTH_TYPES,
  TAGS,
} from '../contracts/ERC8004Config';
import {
  uploadFeedback,
  createFeedbackDetails,
  fetchFromIPFS,
} from '../utils/ipfs';

// ============================================================================
// useReputation Hook
// ============================================================================

export const useReputation = () => {
  const { provider, signer, account, chainId } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 获取 Reputation Registry 合约实例
  const getContract = useCallback(() => {
    if (!provider || !chainId) {
      throw new Error('Provider not available');
    }

    const config = getERC8004Config(chainId);
    return new ethers.Contract(
      config.reputationRegistry,
      REPUTATION_REGISTRY_ABI,
      signer || provider
    );
  }, [provider, signer, chainId]);

  // ============================================================================
  // 反馈授权签名
  // ============================================================================

  /**
   * 生成反馈授权签名（EIP-712）
   * @param {number} agentId - Agent ID
   * @param {string} clientAddress - 客户地址
   * @param {number} indexLimit - 索引限制
   * @param {number} expiry - 过期时间（Unix 时间戳）
   * @returns {Promise<string>} 签名（bytes）
   */
  const signFeedbackAuth = useCallback(
    async (agentId, clientAddress, indexLimit, expiry) => {
      if (!signer || !chainId) {
        throw new Error('Signer not available');
      }

      const config = getERC8004Config(chainId);

      // EIP-712 Domain
      const domain = {
        name: 'ERC8004 Reputation Registry',
        version: '1',
        chainId: chainId,
        verifyingContract: config.reputationRegistry,
      };

      // FeedbackAuth 数据
      const value = {
        agentId,
        clientAddress,
        indexLimit,
        expiry,
        chainId,
        identityRegistry: config.identityRegistry,
        signerAddress: await signer.getAddress(),
      };

      // 签名
      const signature = await signer._signTypedData(
        domain,
        FEEDBACK_AUTH_TYPES,
        value
      );

      return signature;
    },
    [signer, chainId]
  );

  // ============================================================================
  // 提交反馈
  // ============================================================================

  /**
   * 提交反馈给 Agent
   * @param {Object} params - 反馈参数
   * @param {number} params.agentId - Agent ID
   * @param {number} params.score - 分数（0-100）
   * @param {string} params.tag1 - 标签 1（bytes32）
   * @param {string} params.tag2 - 标签 2（bytes32）
   * @param {Object} params.details - 反馈详情
   * @param {string} params.feedbackAuth - 反馈授权签名（可选）
   * @returns {Promise<Object>} 交易收据
   */
  const giveFeedback = useCallback(
    async (params) => {
      setLoading(true);
      setError(null);

      try {
        if (!signer || !account) {
          throw new Error('Wallet not connected');
        }

        const {
          agentId,
          score,
          tag1 = TAGS.PAYMENT,
          tag2 = TAGS.SUCCESS,
          details,
          feedbackAuth,
        } = params;

        // 验证分数范围
        if (score < 0 || score > 100) {
          throw new Error('Score must be between 0 and 100');
        }

        // 1. 上传反馈详情到 IPFS
        console.log('Uploading feedback details to IPFS...');
        const feedbackDetails = createFeedbackDetails({
          score,
          comment: details?.comment || '',
          serviceType: details?.serviceType || 'payment',
          transactionHash: details?.transactionHash || '',
          metadata: details?.metadata || {},
        });

        const fileuri = await uploadFeedback(feedbackDetails);

        // 2. 计算文件哈希
        const filehash = ethers.utils.keccak256(
          ethers.utils.toUtf8Bytes(JSON.stringify(feedbackDetails))
        );

        // 3. 获取或生成反馈授权签名
        let authSignature = feedbackAuth;
        if (!authSignature) {
          // 如果没有提供授权签名，尝试自签名（仅当客户是 Agent 所有者时）
          const contract = getContract();
          const lastIndex = await contract.getLastIndex(agentId, account);
          const expiry = Math.floor(Date.now() / 1000) + 86400; // 24 小时后过期

          authSignature = await signFeedbackAuth(
            agentId,
            account,
            lastIndex.toNumber() + 10, // 允许未来 10 条反馈
            expiry
          );
        }

        // 4. 提交反馈到链上
        console.log('Submitting feedback on-chain...');
        const contract = getContract();
        const tx = await contract.giveFeedback(
          agentId,
          score,
          tag1,
          tag2,
          fileuri,
          filehash,
          authSignature
        );

        console.log('Transaction sent:', tx.hash);
        const receipt = await tx.wait();
        console.log('Transaction confirmed:', receipt);

        setLoading(false);
        return receipt;
      } catch (err) {
        console.error('Give feedback error:', err);
        setError(err.message);
        setLoading(false);
        throw err;
      }
    },
    [signer, account, getContract, signFeedbackAuth]
  );

  // ============================================================================
  // 撤销反馈
  // ============================================================================

  /**
   * 撤销之前提交的反馈
   * @param {number} agentId - Agent ID
   * @param {number} feedbackIndex - 反馈索引
   * @returns {Promise<Object>} 交易收据
   */
  const revokeFeedback = useCallback(
    async (agentId, feedbackIndex) => {
      try {
        if (!signer) {
          throw new Error('Wallet not connected');
        }

        const contract = getContract();
        const tx = await contract.revokeFeedback(agentId, feedbackIndex);
        return await tx.wait();
      } catch (err) {
        console.error('Revoke feedback error:', err);
        throw err;
      }
    },
    [signer, getContract]
  );

  // ============================================================================
  // 添加响应
  // ============================================================================

  /**
   * Agent 对反馈添加响应
   * @param {number} agentId - Agent ID
   * @param {string} clientAddress - 客户地址
   * @param {number} feedbackIndex - 反馈索引
   * @param {Object} response - 响应内容
   * @returns {Promise<Object>} 交易收据
   */
  const appendResponse = useCallback(
    async (agentId, clientAddress, feedbackIndex, response) => {
      try {
        if (!signer) {
          throw new Error('Wallet not connected');
        }

        // 1. 上传响应到 IPFS
        const responseUri = await uploadFeedback(response);

        // 2. 计算响应哈希
        const responseHash = ethers.utils.keccak256(
          ethers.utils.toUtf8Bytes(JSON.stringify(response))
        );

        // 3. 提交响应到链上
        const contract = getContract();
        const tx = await contract.appendResponse(
          agentId,
          clientAddress,
          feedbackIndex,
          responseUri,
          responseHash
        );

        return await tx.wait();
      } catch (err) {
        console.error('Append response error:', err);
        throw err;
      }
    },
    [signer, getContract]
  );

  // ============================================================================
  // 查询声誉摘要
  // ============================================================================

  /**
   * 获取 Agent 的声誉摘要
   * @param {number} agentId - Agent ID
   * @param {Array<string>} clientAddresses - 客户地址列表（可选）
   * @param {string} tag1 - 标签 1 过滤（可选）
   * @param {string} tag2 - 标签 2 过滤（可选）
   * @returns {Promise<Object>} { count, averageScore }
   */
  const getReputationSummary = useCallback(
    async (agentId, clientAddresses = [], tag1 = '0x' + '0'.repeat(64), tag2 = '0x' + '0'.repeat(64)) => {
      try {
        const contract = getContract();
        const summary = await contract.getSummary(
          agentId,
          clientAddresses,
          tag1,
          tag2
        );

        return {
          count: summary.count.toNumber(),
          averageScore: summary.averageScore,
        };
      } catch (err) {
        console.error('Get reputation summary error:', err);
        return { count: 0, averageScore: 0 };
      }
    },
    [getContract]
  );

  // ============================================================================
  // 查询反馈详情
  // ============================================================================

  /**
   * 读取单条反馈
   * @param {number} agentId - Agent ID
   * @param {string} clientAddress - 客户地址
   * @param {number} index - 反馈索引
   * @returns {Promise<Object>} 反馈详情
   */
  const readFeedback = useCallback(
    async (agentId, clientAddress, index) => {
      try {
        const contract = getContract();
        const feedback = await contract.readFeedback(
          agentId,
          clientAddress,
          index
        );

        return {
          score: feedback.score,
          tag1: feedback.tag1,
          tag2: feedback.tag2,
          isRevoked: feedback.isRevoked,
        };
      } catch (err) {
        console.error('Read feedback error:', err);
        return null;
      }
    },
    [getContract]
  );

  /**
   * 读取所有反馈
   * @param {number} agentId - Agent ID
   * @param {Array<string>} clientAddresses - 客户地址列表（可选）
   * @param {string} tag1 - 标签 1 过滤（可选）
   * @param {string} tag2 - 标签 2 过滤（可选）
   * @param {boolean} includeRevoked - 是否包含已撤销的反馈
   * @returns {Promise<Array>} 反馈列表
   */
  const readAllFeedback = useCallback(
    async (
      agentId,
      clientAddresses = [],
      tag1 = '0x' + '0'.repeat(64),
      tag2 = '0x' + '0'.repeat(64),
      includeRevoked = false
    ) => {
      try {
        const contract = getContract();
        const result = await contract.readAllFeedback(
          agentId,
          clientAddresses,
          tag1,
          tag2,
          includeRevoked
        );

        // 解析结果
        const feedbacks = [];
        for (let i = 0; i < result[0].length; i++) {
          feedbacks.push({
            clientAddress: result[0][i],
            score: result[1][i],
            tag1: result[2][i],
            tag2: result[3][i],
            isRevoked: result[4][i],
          });
        }

        return feedbacks;
      } catch (err) {
        console.error('Read all feedback error:', err);
        return [];
      }
    },
    [getContract]
  );

  /**
   * 获取 Agent 的所有客户地址
   * @param {number} agentId - Agent ID
   * @returns {Promise<Array<string>>} 客户地址列表
   */
  const getClients = useCallback(
    async (agentId) => {
      try {
        const contract = getContract();
        return await contract.getClients(agentId);
      } catch (err) {
        console.error('Get clients error:', err);
        return [];
      }
    },
    [getContract]
  );

  // ============================================================================
  // 获取完整的声誉数据（包含 IPFS 详情）
  // ============================================================================

  /**
   * 获取 Agent 的完整声誉数据
   * @param {number} agentId - Agent ID
   * @returns {Promise<Object>} 完整的声誉数据
   */
  const getFullReputation = useCallback(
    async (agentId) => {
      try {
        setLoading(true);

        // 1. 获取声誉摘要
        const summary = await getReputationSummary(agentId);

        // 2. 获取所有客户
        const clients = await getClients(agentId);

        // 3. 获取所有反馈
        const feedbacks = await readAllFeedback(agentId, clients);

        // 4. 按标签分类统计
        const byTag = {};
        feedbacks.forEach((f) => {
          const tag = f.tag1;
          if (!byTag[tag]) {
            byTag[tag] = { count: 0, totalScore: 0, averageScore: 0 };
          }
          byTag[tag].count++;
          byTag[tag].totalScore += f.score;
        });

        // 计算每个标签的平均分
        Object.keys(byTag).forEach((tag) => {
          byTag[tag].averageScore = Math.round(
            byTag[tag].totalScore / byTag[tag].count
          );
        });

        setLoading(false);
        return {
          summary,
          clients,
          feedbacks,
          byTag,
        };
      } catch (err) {
        console.error('Get full reputation error:', err);
        setError(err.message);
        setLoading(false);
        return null;
      }
    },
    [getReputationSummary, getClients, readAllFeedback]
  );

  // ============================================================================
  // 返回 Hook 接口
  // ============================================================================

  return {
    // 状态
    loading,
    error,

    // 反馈管理
    giveFeedback,
    revokeFeedback,
    appendResponse,

    // 声誉查询
    getReputationSummary,
    readFeedback,
    readAllFeedback,
    getClients,
    getFullReputation,

    // 工具函数
    signFeedbackAuth,
  };
};

// ============================================================================
// 导出
// ============================================================================

export default useReputation;

