import { useState, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';

// Contract ABI (simplified for demo - in production, import from compiled contract)
const PAYMENT_SCHEDULER_ABI = [
  "function createFlow(address sender, address[] receivers, uint256[] amounts, uint8 triggerType, uint256 triggerValue, string metadata) external returns (uint256)",
  "function executeFlow(uint256 flowId) external payable",
  "function pauseFlow(uint256 flowId) external",
  "function resumeFlow(uint256 flowId) external",
  "function cancelFlow(uint256 flowId) external",
  "function getFlow(uint256 flowId) external view returns (tuple(uint256 id, address creator, address sender, address[] receivers, uint256[] amounts, uint8 triggerType, uint256 triggerValue, uint256 nextExecution, uint256 lastExecution, uint256 executionCount, uint8 status, string metadata, uint256 createdAt))",
  "function getUserFlows(address user) external view returns (uint256[])",
  "function canExecute(uint256 flowId) external view returns (bool)",
  "function getFlowTotalAmount(uint256 flowId) external view returns (uint256)",
  "event FlowCreated(uint256 indexed flowId, address indexed creator, address sender, uint8 triggerType)",
  "event FlowExecuted(uint256 indexed flowId, uint256 executionCount, uint256 totalAmount, uint256 timestamp)",
  "event FlowStatusChanged(uint256 indexed flowId, uint8 oldStatus, uint8 newStatus)"
];

// Contract address (will be set after deployment)
const CONTRACT_ADDRESS = process.env.REACT_APP_PAYMENT_SCHEDULER_ADDRESS || '0x0000000000000000000000000000000000000000';

// Trigger types enum
export const TriggerType = {
  Time: 0,
  Price: 1,
  Event: 2,
  Manual: 3
};

// Flow status enum
export const FlowStatus = {
  Active: 0,
  Paused: 1,
  Completed: 2,
  Cancelled: 3
};

/**
 * Hook for interacting with PaymentScheduler smart contract
 * Uses the existing Web3Context for wallet connection
 */
export function usePaymentScheduler() {
  // Use existing Web3 context instead of creating new connection
  const { account, signer, provider, isConnecting } = useWeb3();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Create contract instance using existing signer
  const contract = useMemo(() => {
    if (!signer || CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
      return null;
    }
    
    try {
      return new ethers.Contract(
        CONTRACT_ADDRESS,
        PAYMENT_SCHEDULER_ABI,
        signer
      );
    } catch (err) {
      console.error('Failed to create contract instance:', err);
      return null;
    }
  }, [signer]);

  const isConnected = !!account && !!signer;

  /**
   * Create a new payment flow on blockchain
   */
  const createFlow = useCallback(async (flowData) => {
    if (!contract || !signer || !account) {
      throw new Error('Please connect your wallet first');
    }

    setIsLoading(true);
    setError(null);

    try {
      const { nodes, connections } = flowData;
      
      // Extract sender from nodes
      const senderNode = nodes.find(n => n.type === 'sender');
      if (!senderNode) {
        throw new Error('No sender node found in flow');
      }
      
      const senderAddress = senderNode.config.address || account;
      
      // Extract receivers and amounts
      const receiverNodes = nodes.filter(n => n.type === 'receiver');
      if (receiverNodes.length === 0) {
        throw new Error('No receiver nodes found in flow');
      }
      
      const receivers = receiverNodes.map(n => {
        if (!n.config.address || n.config.address === '') {
          throw new Error('Receiver address is required');
        }
        return n.config.address;
      });
      
      // Get payment amounts
      const paymentNode = nodes.find(n => n.type === 'payment');
      if (!paymentNode) {
        throw new Error('No payment node found in flow');
      }
      
      const amount = paymentNode.config.amount || '0.01';
      const amounts = receivers.map(() => ethers.parseEther(amount));
      
      // Get trigger configuration
      const triggerNode = nodes.find(n => n.type === 'trigger');
      let triggerType = TriggerType.Manual;
      let triggerValue = 0;
      
      if (triggerNode) {
        if (triggerNode.config.type === 'time') {
          triggerType = TriggerType.Time;
          // Convert to next execution time (24 hours from now for demo)
          triggerValue = Math.floor(Date.now() / 1000) + 86400;
        } else if (triggerNode.config.type === 'price') {
          triggerType = TriggerType.Price;
          const priceMatch = triggerNode.config.condition?.match(/\d+/);
          triggerValue = priceMatch ? parseInt(priceMatch[0]) : 3000;
        } else if (triggerNode.config.type === 'event') {
          triggerType = TriggerType.Event;
        } else if (triggerNode.config.type === 'ai') {
          triggerType = TriggerType.Event; // Use Event type for AI triggers
        }
      }
      
      // Prepare metadata
      const metadata = JSON.stringify({
        name: flowData.name || 'Custom Flow',
        description: flowData.description || 'Automated payment flow',
        nodes,
        connections
      });
      
      console.log('Creating flow with params:', {
        senderAddress,
        receivers,
        amounts: amounts.map(a => ethers.formatEther(a)),
        triggerType,
        triggerValue,
        metadata: metadata.substring(0, 100) + '...'
      });
      
      // Create flow on blockchain
      const tx = await contract.createFlow(
        senderAddress,
        receivers,
        amounts,
        triggerType,
        triggerValue,
        metadata
      );
      
      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt.hash);
      
      // Extract flowId from event
      let flowId = null;
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed.name === 'FlowCreated') {
            flowId = parsed.args.flowId.toString();
            break;
          }
        } catch (e) {
          // Skip logs that don't match our interface
          continue;
        }
      }
      
      setIsLoading(false);
      return {
        success: true,
        flowId,
        txHash: receipt.hash
      };
      
    } catch (err) {
      console.error('Failed to create flow:', err);
      const errorMessage = err.reason || err.message || 'Failed to create flow';
      setError(errorMessage);
      setIsLoading(false);
      throw new Error(errorMessage);
    }
  }, [contract, signer, account]);

  /**
   * Execute a payment flow
   */
  const executeFlow = useCallback(async (flowId) => {
    if (!contract) {
      throw new Error('Please connect your wallet first');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get total amount needed
      const totalAmount = await contract.getFlowTotalAmount(flowId);
      
      console.log(`Executing flow ${flowId} with ${ethers.formatEther(totalAmount)} ETH`);
      
      // Execute flow with payment
      const tx = await contract.executeFlow(flowId, {
        value: totalAmount
      });
      
      console.log('Execution transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Execution confirmed:', receipt.hash);
      
      setIsLoading(false);
      return {
        success: true,
        txHash: receipt.hash
      };
      
    } catch (err) {
      console.error('Failed to execute flow:', err);
      const errorMessage = err.reason || err.message || 'Failed to execute flow';
      setError(errorMessage);
      setIsLoading(false);
      throw new Error(errorMessage);
    }
  }, [contract]);

  /**
   * Pause a flow
   */
  const pauseFlow = useCallback(async (flowId) => {
    if (!contract) {
      throw new Error('Please connect your wallet first');
    }

    setIsLoading(true);
    setError(null);

    try {
      const tx = await contract.pauseFlow(flowId);
      await tx.wait();
      
      setIsLoading(false);
      return { success: true };
      
    } catch (err) {
      console.error('Failed to pause flow:', err);
      const errorMessage = err.reason || err.message || 'Failed to pause flow';
      setError(errorMessage);
      setIsLoading(false);
      throw new Error(errorMessage);
    }
  }, [contract]);

  /**
   * Resume a flow
   */
  const resumeFlow = useCallback(async (flowId) => {
    if (!contract) {
      throw new Error('Please connect your wallet first');
    }

    setIsLoading(true);
    setError(null);

    try {
      const tx = await contract.resumeFlow(flowId);
      await tx.wait();
      
      setIsLoading(false);
      return { success: true };
      
    } catch (err) {
      console.error('Failed to resume flow:', err);
      const errorMessage = err.reason || err.message || 'Failed to resume flow';
      setError(errorMessage);
      setIsLoading(false);
      throw new Error(errorMessage);
    }
  }, [contract]);

  /**
   * Cancel a flow
   */
  const cancelFlow = useCallback(async (flowId) => {
    if (!contract) {
      throw new Error('Please connect your wallet first');
    }

    setIsLoading(true);
    setError(null);

    try {
      const tx = await contract.cancelFlow(flowId);
      await tx.wait();
      
      setIsLoading(false);
      return { success: true };
      
    } catch (err) {
      console.error('Failed to cancel flow:', err);
      const errorMessage = err.reason || err.message || 'Failed to cancel flow';
      setError(errorMessage);
      setIsLoading(false);
      throw new Error(errorMessage);
    }
  }, [contract]);

  /**
   * Get flow details from blockchain
   */
  const getFlow = useCallback(async (flowId) => {
    if (!contract) {
      throw new Error('Contract not available');
    }

    try {
      const flow = await contract.getFlow(flowId);
      return {
        id: flow.id.toString(),
        creator: flow.creator,
        sender: flow.sender,
        receivers: flow.receivers,
        amounts: flow.amounts.map(a => ethers.formatEther(a)),
        triggerType: flow.triggerType,
        triggerValue: flow.triggerValue.toString(),
        nextExecution: flow.nextExecution.toString(),
        lastExecution: flow.lastExecution.toString(),
        executionCount: flow.executionCount.toString(),
        status: flow.status,
        metadata: JSON.parse(flow.metadata),
        createdAt: flow.createdAt.toString()
      };
    } catch (err) {
      console.error('Failed to get flow:', err);
      throw err;
    }
  }, [contract]);

  /**
   * Get all flows for current user
   */
  const getUserFlows = useCallback(async () => {
    if (!contract || !account) {
      throw new Error('Please connect your wallet first');
    }

    try {
      const flowIds = await contract.getUserFlows(account);
      
      // Fetch details for each flow
      const flows = await Promise.all(
        flowIds.map(id => getFlow(id.toString()))
      );
      
      return flows;
    } catch (err) {
      console.error('Failed to get user flows:', err);
      throw err;
    }
  }, [contract, account, getFlow]);

  /**
   * Check if a flow can be executed
   */
  const canExecute = useCallback(async (flowId) => {
    if (!contract) {
      return false;
    }

    try {
      return await contract.canExecute(flowId);
    } catch (err) {
      console.error('Failed to check execution status:', err);
      return false;
    }
  }, [contract]);

  return {
    // Connection status from Web3Context
    account,
    isConnected,
    isConnecting,
    
    // Contract interaction
    contract,
    isLoading,
    error,
    
    // Flow operations
    createFlow,
    executeFlow,
    pauseFlow,
    resumeFlow,
    cancelFlow,
    getFlow,
    getUserFlows,
    canExecute
  };
}
