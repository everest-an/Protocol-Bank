import { ethers } from 'ethers';
import StreamPaymentABI from './StreamPaymentABI.json';

// Contract addresses (Sepolia testnet)
// Updated: 2025-11-10 - Redeployed with batch creation功能
export const CONTRACTS = {
  STREAM_PAYMENT: '0x2f0C38472f85dC542807Cb42506c0E2753619d8c',
  MOCK_USDC: '0xD4a303070CFcA084229Ca810618D71242f5da642',
  MOCK_DAI: '0xFFe1F0f101f502F906c531486a3A09e025204F77',
};

// Network configuration
export const SEPOLIA_CHAIN_ID = 11155111;

// ERC20 ABI (minimal)
const ERC20_ABI = [
  'function approve(address spender, uint256 amount) public returns (bool)',
  'function allowance(address owner, address spender) public view returns (uint256)',
  'function balanceOf(address account) public view returns (uint256)',
  'function decimals() public view returns (uint8)',
  'function symbol() public view returns (string)',
];

/**
 * Stream Payment Contract Service
 */
class StreamPaymentContractService {
  constructor(signer) {
    this.signer = signer;
    this.contract = new ethers.Contract(
      CONTRACTS.STREAM_PAYMENT,
      StreamPaymentABI,
      signer
    );
  }

  /**
   * Create a new stream payment
   */
  async createStream(recipient, token, totalAmount, startTime, endTime) {
    try {
      // Parse amount based on token decimals
      const tokenContract = new ethers.Contract(token, ERC20_ABI, this.signer);
      const decimals = await tokenContract.decimals();
      const parsedAmount = ethers.parseUnits(totalAmount.toString(), decimals);

      // Check allowance
      const owner = await this.signer.getAddress();
      const allowance = await tokenContract.allowance(owner, CONTRACTS.STREAM_PAYMENT);

      // Approve if needed
      if (allowance < parsedAmount) {
        console.log('Approving token transfer...');
        const approveTx = await tokenContract.approve(
          CONTRACTS.STREAM_PAYMENT,
          parsedAmount
        );
        await approveTx.wait();
        console.log('Token approved');
      }

      // Create stream
      console.log('Creating stream...');
      const tx = await this.contract.createStream(
        recipient,
        token,
        parsedAmount,
        startTime,
        endTime
      );

      const receipt = await tx.wait();
      
      // Extract streamId from event
      const event = receipt.logs.find(
        log => log.topics[0] === ethers.id('StreamCreated(uint256,address,address,address,uint256,uint256,uint256)')
      );
      
      const streamId = event ? ethers.toNumber(event.topics[1]) : null;

      return {
        success: true,
        streamId,
        txHash: receipt.hash,
      };
    } catch (error) {
      console.error('Error creating stream:', error);
      return {
        success: false,
        error: error.message || 'Failed to create stream',
      };
    }
  }

  /**
   * Get stream details
   */
  async getStream(streamId) {
    try {
      const stream = await this.contract.getStream(streamId);
      
      return {
        success: true,
        data: {
          sender: stream.sender,
          recipient: stream.recipient,
          token: stream.token,
          totalAmount: stream.totalAmount.toString(),
          amountStreamed: stream.amountStreamed.toString(),
          amountWithdrawn: stream.amountWithdrawn.toString(),
          ratePerSecond: stream.ratePerSecond.toString(),
          startTime: Number(stream.startTime),
          endTime: Number(stream.endTime),
          status: Number(stream.status), // 0: Active, 1: Paused, 2: Completed, 3: Cancelled
        },
      };
    } catch (error) {
      console.error('Error getting stream:', error);
      return {
        success: false,
        error: error.message || 'Failed to get stream',
      };
    }
  }

  /**
   * Get available balance for withdrawal
   */
  async getAvailableBalance(streamId) {
    try {
      const balance = await this.contract.balanceOf(streamId);
      return {
        success: true,
        balance: balance.toString(),
      };
    } catch (error) {
      console.error('Error getting balance:', error);
      return {
        success: false,
        error: error.message || 'Failed to get balance',
      };
    }
  }

  /**
   * Withdraw from stream
   */
  async withdrawFromStream(streamId, amount) {
    try {
      const tx = await this.contract.withdrawFromStream(streamId, amount);
      const receipt = await tx.wait();

      return {
        success: true,
        txHash: receipt.hash,
      };
    } catch (error) {
      console.error('Error withdrawing:', error);
      return {
        success: false,
        error: error.message || 'Failed to withdraw',
      };
    }
  }

  /**
   * Pause stream
   */
  async pauseStream(streamId) {
    try {
      const tx = await this.contract.pauseStream(streamId);
      const receipt = await tx.wait();

      return {
        success: true,
        txHash: receipt.hash,
      };
    } catch (error) {
      console.error('Error pausing stream:', error);
      return {
        success: false,
        error: error.message || 'Failed to pause stream',
      };
    }
  }

  /**
   * Resume stream
   */
  async resumeStream(streamId) {
    try {
      const tx = await this.contract.resumeStream(streamId);
      const receipt = await tx.wait();

      return {
        success: true,
        txHash: receipt.hash,
      };
    } catch (error) {
      console.error('Error resuming stream:', error);
      return {
        success: false,
        error: error.message || 'Failed to resume stream',
      };
    }
  }

  /**
   * Cancel stream
   */
  async cancelStream(streamId) {
    try {
      const tx = await this.contract.cancelStream(streamId);
      const receipt = await tx.wait();

      return {
        success: true,
        txHash: receipt.hash,
      };
    } catch (error) {
      console.error('Error cancelling stream:', error);
      return {
        success: false,
        error: error.message || 'Failed to cancel stream',
      };
    }
  }

  /**
   * Create multiple streams in batch
   */
  async createStreamBatch(batchParams) {
    try {
      // Group by token to calculate total approval needed
      const tokenAmounts = {};
      for (const param of batchParams) {
        if (!tokenAmounts[param.token]) {
          tokenAmounts[param.token] = 0n;
        }
        tokenAmounts[param.token] += BigInt(param.totalAmount);
      }

      // Approve tokens
      const owner = await this.signer.getAddress();
      for (const [token, totalAmount] of Object.entries(tokenAmounts)) {
        const tokenContract = new ethers.Contract(token, ERC20_ABI, this.signer);
        const allowance = await tokenContract.allowance(owner, CONTRACTS.STREAM_PAYMENT);

        if (allowance < totalAmount) {
          console.log(`Approving ${totalAmount} tokens for ${token}...`);
          const approveTx = await tokenContract.approve(
            CONTRACTS.STREAM_PAYMENT,
            totalAmount
          );
          await approveTx.wait();
          console.log('Tokens approved');
        }
      }

      // Create batch stream
      console.log(`Creating batch of ${batchParams.length} streams...`);
      const tx = await this.contract.createStreamBatch(batchParams);
      const receipt = await tx.wait();

      // Extract stream IDs from events
      const streamIds = [];
      for (const log of receipt.logs) {
        try {
          const parsed = this.contract.interface.parseLog(log);
          if (parsed && parsed.name === 'StreamCreated') {
            streamIds.push(Number(parsed.args.streamId));
          }
        } catch (e) {
          // Skip logs that don't match
        }
      }

      return {
        success: true,
        streamIds,
        txHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (error) {
      console.error('Error creating batch streams:', error);
      return {
        success: false,
        error: error.message || 'Failed to create batch streams',
      };
    }
  }

  /**
   * Get streams by sender
   */
  async getStreamsBySender(sender) {
    try {
      const streamIds = await this.contract.getStreamsBySender(sender);
      return {
        success: true,
        streamIds: streamIds.map(id => Number(id)),
      };
    } catch (error) {
      console.error('Error getting streams by sender:', error);
      return {
        success: false,
        error: error.message || 'Failed to get streams',
      };
    }
  }

  /**
   * Get streams by recipient
   */
  async getStreamsByRecipient(recipient) {
    try {
      const streamIds = await this.contract.getStreamsByRecipient(recipient);
      return {
        success: true,
        streamIds: streamIds.map(id => Number(id)),
      };
    } catch (error) {
      console.error('Error getting streams by recipient:', error);
      return {
        success: false,
        error: error.message || 'Failed to get streams',
      };
    }
  }

  /**
   * Get token balance
   */
  async getTokenBalance(tokenAddress, accountAddress) {
    try {
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.signer);
      const balance = await tokenContract.balanceOf(accountAddress);
      const decimals = await tokenContract.decimals();
      const symbol = await tokenContract.symbol();

      return {
        success: true,
        balance: ethers.formatUnits(balance, decimals),
        symbol,
        decimals,
      };
    } catch (error) {
      console.error('Error getting token balance:', error);
      return {
        success: false,
        error: error.message || 'Failed to get token balance',
      };
    }
  }
}

/**
 * Create contract service instance
 */
export const createContractService = (signer) => {
  return new StreamPaymentContractService(signer);
};

/**
 * Get supported tokens
 */
export const getSupportedTokens = () => {
  return [
    {
      symbol: 'USDC',
      name: 'USD Coin (Mock)',
      address: CONTRACTS.MOCK_USDC,
      decimals: 6,
    },
    {
      symbol: 'DAI',
      name: 'Dai Stablecoin (Mock)',
      address: CONTRACTS.MOCK_DAI,
      decimals: 18,
    },
  ];
};

export default StreamPaymentContractService;
