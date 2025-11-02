/**
 * 智能合约数据读取服务模块
 * Smart Contract Data Reader Service Module
 * 
 * 提供从 StreamPayment 合约读取数据的功能
 * Provides functionality to read data from StreamPayment contract
 */

import { ethers } from 'ethers';
import { SEPOLIA_CONFIG, STREAM_PAYMENT_CONTRACT } from '@/config/contracts';
import StreamPaymentABI from '@/contracts/StreamPaymentABI.json';
import { getEtherscanLink } from './etherscan';

/**
 * 获取合约实例
 * Get contract instance
 * @param {Object} provider - ethers provider（可选）
 * @returns {Object} - 合约实例
 */
function getContractInstance(provider = null) {
  // 如果没有提供 provider，使用默认的 RPC provider
  const rpcProvider = provider || new ethers.JsonRpcProvider(SEPOLIA_CONFIG.rpcUrl);
  
  return new ethers.Contract(
    STREAM_PAYMENT_CONTRACT.address,
    StreamPaymentABI,
    rpcProvider
  );
}

/**
 * 从合约读取最近的支付记录
 * Read recent payments from contract
 * @param {number} count - 要获取的记录数量
 * @param {Object} provider - ethers provider（可选）
 * @returns {Promise<Array>} - 支付记录列表
 */
export async function getRecentPayments(count = 100, provider = null) {
  try {
    const contract = getContractInstance(provider);
    const payments = await contract.getRecentPayments(count);
    
    return payments.map(payment => formatPaymentData(payment));
  } catch (error) {
    console.error('Failed to get recent payments from contract:', error);
    throw error;
  }
}

/**
 * 从合约读取单个支付记录
 * Read single payment from contract
 * @param {number} paymentId - 支付 ID
 * @param {Object} provider - ethers provider（可选）
 * @returns {Promise<Object>} - 支付记录
 */
export async function getPayment(paymentId, provider = null) {
  try {
    const contract = getContractInstance(provider);
    const payment = await contract.getPayment(paymentId);
    
    return formatPaymentData(payment);
  } catch (error) {
    console.error(`Failed to get payment ${paymentId} from contract:`, error);
    throw error;
  }
}

/**
 * 从合约读取所有供应商地址
 * Read all supplier addresses from contract
 * @param {Object} provider - ethers provider（可选）
 * @returns {Promise<Array>} - 供应商地址列表
 */
export async function getAllSuppliers(provider = null) {
  try {
    const contract = getContractInstance(provider);
    const suppliers = await contract.getAllSuppliers();
    
    return suppliers;
  } catch (error) {
    console.error('Failed to get suppliers from contract:', error);
    throw error;
  }
}

/**
 * 从合约读取供应商信息
 * Read supplier info from contract
 * @param {string} supplierAddress - 供应商地址
 * @param {Object} provider - ethers provider（可选）
 * @returns {Promise<Object>} - 供应商信息
 */
export async function getSupplierInfo(supplierAddress, provider = null) {
  try {
    const contract = getContractInstance(provider);
    const supplier = await contract.getSupplierInfo(supplierAddress);
    
    return formatSupplierData(supplier);
  } catch (error) {
    console.error(`Failed to get supplier info for ${supplierAddress}:`, error);
    throw error;
  }
}

/**
 * 从合约读取供应商的所有支付记录
 * Read all payments for a supplier from contract
 * @param {string} supplierAddress - 供应商地址
 * @param {Object} provider - ethers provider（可选）
 * @returns {Promise<Array>} - 支付记录列表
 */
export async function getSupplierPayments(supplierAddress, provider = null) {
  try {
    const contract = getContractInstance(provider);
    const payments = await contract.getSupplierPayments(supplierAddress);
    
    return payments.map(payment => formatPaymentData(payment));
  } catch (error) {
    console.error(`Failed to get payments for supplier ${supplierAddress}:`, error);
    throw error;
  }
}

/**
 * 从合约读取活跃供应商数量
 * Read active supplier count from contract
 * @param {Object} provider - ethers provider（可选）
 * @returns {Promise<number>} - 活跃供应商数量
 */
export async function getActiveSupplierCount(provider = null) {
  try {
    const contract = getContractInstance(provider);
    const count = await contract.getActiveSupplierCount();
    
    return Number(count);
  } catch (error) {
    console.error('Failed to get active supplier count:', error);
    throw error;
  }
}

/**
 * 格式化支付数据
 * Format payment data
 * @param {Object} payment - 原始支付数据
 * @returns {Object} - 格式化后的支付数据
 */
function formatPaymentData(payment) {
  // PaymentStatus enum: 0 = Pending, 1 = Completed, 2 = Cancelled
  const statusMap = {
    0: 'Pending',
    1: 'Completed',
    2: 'Cancelled'
  };

  return {
    id: Number(payment.id),
    from: payment.from,
    to: payment.to,
    amount: ethers.formatEther(payment.amount), // 转换为 ETH
    amountWei: payment.amount.toString(),
    timestamp: new Date(Number(payment.timestamp) * 1000), // 转换为 Date 对象
    timestampUnix: Number(payment.timestamp),
    category: payment.category,
    status: statusMap[payment.status] || 'Unknown',
    statusCode: Number(payment.status),
    // 添加 Etherscan 链接（需要从事件日志获取 txHash）
    etherscanLink: null, // 将在获取事件时填充
  };
}

/**
 * 格式化供应商数据
 * Format supplier data
 * @param {Object} supplier - 原始供应商数据
 * @returns {Object} - 格式化后的供应商数据
 */
function formatSupplierData(supplier) {
  return {
    wallet: supplier.wallet,
    name: supplier.name,
    brand: supplier.brand,
    category: supplier.category,
    totalReceived: ethers.formatEther(supplier.totalReceived), // 转换为 ETH
    totalReceivedWei: supplier.totalReceived.toString(),
    profitMargin: Number(supplier.profitMargin), // 利润率（百分比）
    isActive: supplier.isActive,
    registeredAt: new Date(Number(supplier.registeredAt) * 1000),
    registeredAtUnix: Number(supplier.registeredAt),
    etherscanLink: getEtherscanLink('address', supplier.wallet),
  };
}

/**
 * 从合约事件日志获取支付创建事件
 * Get payment created events from contract logs
 * @param {number} fromBlock - 起始区块
 * @param {number} toBlock - 结束区块
 * @param {Object} provider - ethers provider（可选）
 * @returns {Promise<Array>} - 事件列表
 */
export async function getPaymentCreatedEvents(fromBlock = 0, toBlock = 'latest', provider = null) {
  try {
    const contract = getContractInstance(provider);
    
    // 创建事件过滤器
    const filter = contract.filters.PaymentCreated();
    
    // 查询事件
    const events = await contract.queryFilter(filter, fromBlock, toBlock);
    
    return events.map(event => ({
      paymentId: Number(event.args.paymentId),
      from: event.args.from,
      to: event.args.to,
      amount: ethers.formatEther(event.args.amount),
      amountWei: event.args.amount.toString(),
      category: event.args.category,
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
      etherscanLink: getEtherscanLink('tx', event.transactionHash),
    }));
  } catch (error) {
    console.error('Failed to get payment created events:', error);
    throw error;
  }
}

/**
 * 从合约事件日志获取供应商注册事件
 * Get supplier registered events from contract logs
 * @param {number} fromBlock - 起始区块
 * @param {number} toBlock - 结束区块
 * @param {Object} provider - ethers provider（可选）
 * @returns {Promise<Array>} - 事件列表
 */
export async function getSupplierRegisteredEvents(fromBlock = 0, toBlock = 'latest', provider = null) {
  try {
    const contract = getContractInstance(provider);
    
    // 创建事件过滤器
    const filter = contract.filters.SupplierRegistered();
    
    // 查询事件
    const events = await contract.queryFilter(filter, fromBlock, toBlock);
    
    return events.map(event => ({
      supplier: event.args.supplier,
      name: event.args.name,
      brand: event.args.brand,
      category: event.args.category,
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
      etherscanLink: getEtherscanLink('tx', event.transactionHash),
    }));
  } catch (error) {
    console.error('Failed to get supplier registered events:', error);
    throw error;
  }
}

/**
 * 获取完整的支付数据（包含交易哈希）
 * Get complete payment data with transaction hash
 * @param {number} count - 要获取的记录数量
 * @param {Object} provider - ethers provider（可选）
 * @returns {Promise<Array>} - 完整的支付记录列表
 */
export async function getCompletePayments(count = 100, provider = null) {
  try {
    // 获取支付记录
    const payments = await getRecentPayments(count, provider);
    
    // 获取支付创建事件（最近 10000 个区块）
    const currentBlock = await (provider || new ethers.JsonRpcProvider(SEPOLIA_CONFIG.rpcUrl)).getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - 10000);
    const events = await getPaymentCreatedEvents(fromBlock, 'latest', provider);
    
    // 创建事件映射（paymentId -> event）
    const eventMap = new Map();
    events.forEach(event => {
      eventMap.set(event.paymentId, event);
    });
    
    // 合并数据
    return payments.map(payment => {
      const event = eventMap.get(payment.id);
      if (event) {
        return {
          ...payment,
          transactionHash: event.transactionHash,
          etherscanLink: event.etherscanLink,
          blockNumber: event.blockNumber,
        };
      }
      return payment;
    });
  } catch (error) {
    console.error('Failed to get complete payments:', error);
    throw error;
  }
}

/**
 * 获取完整的供应商数据（包含支付统计）
 * Get complete supplier data with payment statistics
 * @param {Object} provider - ethers provider（可选）
 * @returns {Promise<Array>} - 完整的供应商列表
 */
export async function getCompleteSuppliersData(provider = null) {
  try {
    // 获取所有供应商地址
    const supplierAddresses = await getAllSuppliers(provider);
    
    // 批量获取供应商信息
    const suppliersData = await Promise.all(
      supplierAddresses.map(async (address) => {
        try {
          const info = await getSupplierInfo(address, provider);
          const payments = await getSupplierPayments(address, provider);
          
          return {
            ...info,
            paymentCount: payments.length,
            payments: payments,
          };
        } catch (error) {
          console.error(`Failed to get data for supplier ${address}:`, error);
          return null;
        }
      })
    );
    
    // 过滤掉失败的请求
    return suppliersData.filter(supplier => supplier !== null);
  } catch (error) {
    console.error('Failed to get complete suppliers data:', error);
    throw error;
  }
}

/**
 * 获取 Analytics 页面所需的统计数据
 * Get statistics data for Analytics page
 * @param {Object} provider - ethers provider（可选）
 * @returns {Promise<Object>} - 统计数据
 */
export async function getAnalyticsData(provider = null) {
  try {
    // 并行获取数据
    const [payments, suppliers, activeSupplierCount] = await Promise.all([
      getCompletePayments(500, provider), // 获取最近 500 条支付记录
      getCompleteSuppliersData(provider),
      getActiveSupplierCount(provider),
    ]);

    // 计算统计数据
    const completedPayments = payments.filter(p => p.status === 'Completed');
    const totalAmount = completedPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const averagePayment = completedPayments.length > 0 ? totalAmount / completedPayments.length : 0;

    return {
      payments,
      suppliers,
      stats: {
        totalPayments: completedPayments.length,
        totalAmount,
        averagePayment,
        supplierCount: activeSupplierCount,
        allPaymentsCount: payments.length,
      },
    };
  } catch (error) {
    console.error('Failed to get analytics data:', error);
    throw error;
  }
}

/**
 * 检查合约连接状态
 * Check contract connection status
 * @param {Object} provider - ethers provider（可选）
 * @returns {Promise<boolean>} - 是否连接成功
 */
export async function checkContractConnection(provider = null) {
  try {
    const contract = getContractInstance(provider);
    await contract.getActiveSupplierCount();
    return true;
  } catch (error) {
    console.error('Contract connection failed:', error);
    return false;
  }
}

export default {
  getRecentPayments,
  getPayment,
  getAllSuppliers,
  getSupplierInfo,
  getSupplierPayments,
  getActiveSupplierCount,
  getPaymentCreatedEvents,
  getSupplierRegisteredEvents,
  getCompletePayments,
  getCompleteSuppliersData,
  getAnalyticsData,
  checkContractConnection,
};
