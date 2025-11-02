/**
 * Agent 注册系统 Hook
 * 
 * 提供 Agent 注册、查询、管理等功能
 * 基于 ERC-8004 Identity Registry 实现
 */

import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from './useWeb3';
import {
  getERC8004Config,
  IDENTITY_REGISTRY_ABI,
  formatRegistryAddress,
} from '../contracts/ERC8004Config';
import { uploadAgentRegistration, fetchFromIPFS } from '../utils/ipfs';

// ============================================================================
// useAgentRegistry Hook
// ============================================================================

export const useAgentRegistry = () => {
  const { provider, signer, account, chainId } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [registeredAgents, setRegisteredAgents] = useState([]);

  // 获取 Identity Registry 合约实例
  const getContract = useCallback(() => {
    if (!provider || !chainId) {
      throw new Error('Provider not available');
    }

    const config = getERC8004Config(chainId);
    return new ethers.Contract(
      config.identityRegistry,
      IDENTITY_REGISTRY_ABI,
      signer || provider
    );
  }, [provider, signer, chainId]);

  // ============================================================================
  // 注册 Agent
  // ============================================================================

  /**
   * 注册新的 Agent
   * @param {Object} agentData - Agent 数据
   * @param {string} agentData.name - Agent 名称
   * @param {string} agentData.description - Agent 描述
   * @param {string} agentData.image - Agent 图片 URL
   * @param {Array} agentData.endpoints - Agent 端点列表
   * @param {Array} agentData.supportedTrust - 支持的信任模型
   * @param {Array} agentData.metadata - 可选的链上元数据
   * @returns {Promise<Object>} { agentId, ipfsUri, txHash }
   */
  const registerAgent = useCallback(
    async (agentData) => {
      setLoading(true);
      setError(null);

      try {
        if (!signer) {
          throw new Error('Wallet not connected');
        }

        // 1. 构建 Agent 注册文件
        const registration = {
          type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
          name: agentData.name,
          description: agentData.description,
          image: agentData.image || '',
          endpoints: agentData.endpoints || [],
          registrations: [], // 将在注册后更新
          supportedTrust: agentData.supportedTrust || ['reputation'],
        };

        // 2. 上传注册文件到 IPFS
        console.log('Uploading agent registration to IPFS...');
        const ipfsUri = await uploadAgentRegistration(registration);

        // 3. 准备链上元数据（如果有）
        const metadata = agentData.metadata || [];
        const metadataEntries = metadata.map((m) => ({
          key: m.key,
          value: ethers.toUtf8Bytes(m.value),
        }));

        // 4. 调用合约注册 Agent
        console.log('Registering agent on-chain...');
        const contract = getContract();
        
        let tx;
        if (metadataEntries.length > 0) {
          tx = await contract.register(ipfsUri, metadataEntries);
        } else {
          tx = await contract.register(ipfsUri);
        }

        console.log('Transaction sent:', tx.hash);
        const receipt = await tx.wait();
        console.log('Transaction confirmed:', receipt);

        // 5. 从事件中获取 agentId
        const event = receipt.events?.find((e) => e.event === 'Registered');
        if (!event) {
          throw new Error('Registered event not found');
        }

        const agentId = event.args.agentId.toNumber();
        console.log('Agent registered with ID:', agentId);

        // 6. 更新注册文件，添加 registrations 信息
        registration.registrations = [
          {
            agentId,
            agentRegistry: formatRegistryAddress(
              chainId,
              getERC8004Config(chainId).identityRegistry
            ),
          },
        ];

        // 重新上传更新后的注册文件
        const updatedIpfsUri = await uploadAgentRegistration(registration);
        
        // 更新链上的 tokenURI
        if (updatedIpfsUri !== ipfsUri) {
          const updateTx = await contract.setTokenURI(agentId, updatedIpfsUri);
          await updateTx.wait();
        }

        setLoading(false);
        return {
          agentId,
          ipfsUri: updatedIpfsUri,
          txHash: receipt.transactionHash,
        };
      } catch (err) {
        console.error('Agent registration error:', err);
        setError(err.message);
        setLoading(false);
        throw err;
      }
    },
    [signer, chainId, getContract]
  );

  // ============================================================================
  // 查询 Agent 信息
  // ============================================================================

  /**
   * 获取 Agent 的基本信息
   * @param {number} agentId - Agent ID
   * @returns {Promise<Object>} Agent 信息
   */
  const getAgent = useCallback(
    async (agentId) => {
      try {
        const contract = getContract();

        // 获取 owner 和 tokenURI
        const [owner, tokenURI] = await Promise.all([
          contract.ownerOf(agentId),
          contract.tokenURI(agentId),
        ]);

        // 从 IPFS 获取注册文件
        let registration = null;
        if (tokenURI) {
          try {
            registration = await fetchFromIPFS(tokenURI);
          } catch (err) {
            console.warn('Failed to fetch registration from IPFS:', err);
          }
        }

        return {
          agentId,
          owner,
          tokenURI,
          registration,
        };
      } catch (err) {
        console.error('Get agent error:', err);
        throw err;
      }
    },
    [getContract]
  );

  /**
   * 获取 Agent 的链上元数据
   * @param {number} agentId - Agent ID
   * @param {string} key - 元数据键
   * @returns {Promise<string>} 元数据值
   */
  const getAgentMetadata = useCallback(
    async (agentId, key) => {
      try {
        const contract = getContract();
        const value = await contract.getMetadata(agentId, key);
        return ethers.toUtf8String(value);
      } catch (err) {
        console.error('Get agent metadata error:', err);
        return null;
      }
    },
    [getContract]
  );

  /**
   * 设置 Agent 的链上元数据
   * @param {number} agentId - Agent ID
   * @param {string} key - 元数据键
   * @param {string} value - 元数据值
   * @returns {Promise<Object>} 交易收据
   */
  const setAgentMetadata = useCallback(
    async (agentId, key, value) => {
      try {
        if (!signer) {
          throw new Error('Wallet not connected');
        }

        const contract = getContract();
        const tx = await contract.setMetadata(
          agentId,
          key,
          ethers.toUtf8Bytes(value)
        );
        return await tx.wait();
      } catch (err) {
        console.error('Set agent metadata error:', err);
        throw err;
      }
    },
    [signer, getContract]
  );

  // ============================================================================
  // 查询用户的 Agent
  // ============================================================================

  /**
   * 获取当前用户拥有的所有 Agent
   * @returns {Promise<Array>} Agent 列表
   */
  const getMyAgents = useCallback(async () => {
    if (!account) {
      return [];
    }

    try {
      setLoading(true);
      const contract = getContract();

      // 获取用户拥有的 Agent 数量
      const balance = await contract.balanceOf(account);
      const count = balance.toNumber();

      if (count === 0) {
        setRegisteredAgents([]);
        setLoading(false);
        return [];
      }

      // 获取所有 Agent 的详细信息
      // 注意：这里需要遍历所有可能的 tokenId
      // 在生产环境中，应该使用 subgraph 或索引服务
      const agents = [];
      for (let i = 1; i <= 100; i++) {
        // 假设最多 100 个 Agent
        try {
          const owner = await contract.ownerOf(i);
          if (owner.toLowerCase() === account.toLowerCase()) {
            const agent = await getAgent(i);
            agents.push(agent);
          }
        } catch (err) {
          // Token 不存在，继续下一个
          continue;
        }
      }

      setRegisteredAgents(agents);
      setLoading(false);
      return agents;
    } catch (err) {
      console.error('Get my agents error:', err);
      setError(err.message);
      setLoading(false);
      return [];
    }
  }, [account, getContract, getAgent]);

  // ============================================================================
  // 查询所有 Agent（用于发现）
  // ============================================================================

  /**
   * 获取所有注册的 Agent
   * 注意：这是一个简化的实现，生产环境应该使用 subgraph
   * @param {number} limit - 最大数量
   * @returns {Promise<Array>} Agent 列表
   */
  const getAllAgents = useCallback(
    async (limit = 50) => {
      try {
        setLoading(true);
        const contract = getContract();

        const agents = [];
        for (let i = 1; i <= limit; i++) {
          try {
            const agent = await getAgent(i);
            agents.push(agent);
          } catch (err) {
            // Token 不存在，继续下一个
            continue;
          }
        }

        setLoading(false);
        return agents;
      } catch (err) {
        console.error('Get all agents error:', err);
        setError(err.message);
        setLoading(false);
        return [];
      }
    },
    [getContract, getAgent]
  );

  // ============================================================================
  // Agent 转移
  // ============================================================================

  /**
   * 转移 Agent 所有权
   * @param {number} agentId - Agent ID
   * @param {string} toAddress - 接收地址
   * @returns {Promise<Object>} 交易收据
   */
  const transferAgent = useCallback(
    async (agentId, toAddress) => {
      try {
        if (!signer || !account) {
          throw new Error('Wallet not connected');
        }

        const contract = getContract();
        const tx = await contract.transferFrom(account, toAddress, agentId);
        return await tx.wait();
      } catch (err) {
        console.error('Transfer agent error:', err);
        throw err;
      }
    },
    [signer, account, getContract]
  );

  // ============================================================================
  // 自动加载用户的 Agent
  // ============================================================================

  useEffect(() => {
    if (account && chainId) {
      getMyAgents();
    }
  }, [account, chainId]); // 移除 getMyAgents 依赖以避免循环

  // ============================================================================
  // 返回 Hook 接口
  // ============================================================================

  return {
    // 状态
    loading,
    error,
    registeredAgents,

    // Agent 注册
    registerAgent,

    // Agent 查询
    getAgent,
    getMyAgents,
    getAllAgents,

    // 元数据管理
    getAgentMetadata,
    setAgentMetadata,

    // Agent 转移
    transferAgent,
  };
};

// ============================================================================
// 导出
// ============================================================================

export default useAgentRegistry;

