/**
 * 验证系统 Hook
 * 
 * 提供 Agent 验证管理功能
 * 基于 ERC-8004 Validation Registry 实现
 */

import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from './useWeb3';
import {
  getERC8004Config,
  VALIDATION_REGISTRY_ABI,
  TAGS,
} from '../contracts/ERC8004Config';
import {
  uploadValidationEvidence,
  uploadValidationResponse,
  createValidationEvidence,
  createValidationResponse,
} from '../utils/ipfs';

export const useValidation = () => {
  const { provider, signer, account, chainId } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getContract = useCallback(() => {
    if (!provider || !chainId) {
      throw new Error('Provider not available');
    }
    const config = getERC8004Config(chainId);
    return new ethers.Contract(
      config.validationRegistry,
      VALIDATION_REGISTRY_ABI,
      signer || provider
    );
  }, [provider, signer, chainId]);

  /**
   * 请求验证
   */
  const requestValidation = useCallback(
    async (params) => {
      setLoading(true);
      setError(null);
      try {
        if (!signer) throw new Error('Wallet not connected');

        const {
          agentId,
          validatorAddress,
          tag1 = TAGS.PAYMENT,
          tag2 = TAGS.SCHEDULED,
          evidence,
        } = params;

        // 上传证据到 IPFS
        const evidenceDetails = createValidationEvidence(evidence);
        const evidenceUri = await uploadValidationEvidence(evidenceDetails);
        const evidenceHash = ethers.utils.keccak256(
          ethers.utils.toUtf8Bytes(JSON.stringify(evidenceDetails))
        );

        // 请求验证
        const contract = getContract();
        const tx = await contract.requestValidation(
          agentId,
          validatorAddress,
          tag1,
          tag2,
          evidenceUri,
          evidenceHash
        );

        const receipt = await tx.wait();
        const event = receipt.events?.find(
          (e) => e.event === 'ValidationRequested'
        );
        const validationId = event?.args?.validationId?.toNumber();

        setLoading(false);
        return { validationId, txHash: receipt.transactionHash };
      } catch (err) {
        console.error('Request validation error:', err);
        setError(err.message);
        setLoading(false);
        throw err;
      }
    },
    [signer, getContract]
  );

  /**
   * 响应验证
   */
  const respondToValidation = useCallback(
    async (params) => {
      try {
        if (!signer) throw new Error('Wallet not connected');

        const { agentId, validationId, score, response } = params;

        // 上传响应到 IPFS
        const responseDetails = createValidationResponse(response);
        const responseUri = await uploadValidationResponse(responseDetails);
        const responseHash = ethers.utils.keccak256(
          ethers.utils.toUtf8Bytes(JSON.stringify(responseDetails))
        );

        // 提交响应
        const contract = getContract();
        const tx = await contract.respondToValidation(
          agentId,
          validationId,
          score,
          responseUri,
          responseHash
        );

        return await tx.wait();
      } catch (err) {
        console.error('Respond to validation error:', err);
        throw err;
      }
    },
    [signer, getContract]
  );

  /**
   * 获取验证详情
   */
  const getValidation = useCallback(
    async (agentId, validationId) => {
      try {
        const contract = getContract();
        const validation = await contract.getValidation(agentId, validationId);
        return {
          requester: validation.requester,
          validator: validation.validator,
          score: validation.score,
          tag1: validation.tag1,
          tag2: validation.tag2,
          evidenceUri: validation.evidenceUri,
          responseUri: validation.responseUri,
          isCompleted: validation.isCompleted,
        };
      } catch (err) {
        console.error('Get validation error:', err);
        return null;
      }
    },
    [getContract]
  );

  /**
   * 获取所有验证
   */
  const getAllValidations = useCallback(
    async (agentId) => {
      try {
        const contract = getContract();
        const count = await contract.getValidationCount(agentId);
        const validations = [];

        for (let i = 0; i < count.toNumber(); i++) {
          const validation = await getValidation(agentId, i);
          if (validation) {
            validations.push({ ...validation, validationId: i });
          }
        }

        return validations;
      } catch (err) {
        console.error('Get all validations error:', err);
        return [];
      }
    },
    [getContract, getValidation]
  );

  return {
    loading,
    error,
    requestValidation,
    respondToValidation,
    getValidation,
    getAllValidations,
  };
};

export default useValidation;

