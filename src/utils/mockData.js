// 生成丰富的测试数据用于演示

// JSDoc type definitions for better IDE support
/**
 * @typedef {Object} MockSupplier
 * @property {string} id
 * @property {string} name
 * @property {string} brand
 * @property {string} category
 * @property {number} profitMargin
 * @property {number} totalAmount
 * @property {number} paymentCount
 * @property {Date} lastPayment
 */

/**
 * @typedef {Object} MockPayment
 * @property {string} id
 * @property {string} from
 * @property {string} to
 * @property {number} amount
 * @property {string} category
 * @property {'Pending'|'Completed'|'Failed'} status
 * @property {Date} timestamp
 * @property {string} txHash
 */

const SUPPLIER_NAMES = [
  { name: 'TechCorp Solutions', brand: 'TechCorp', category: '技术服务' },
  { name: 'Cloud Services Inc', brand: 'CloudServe', category: '云计算' },
  { name: 'Global Logistics', brand: 'GloLog', category: '物流运输' },
  { name: 'Design Studio Pro', brand: 'DesignPro', category: '设计服务' },
  { name: 'Marketing Masters', brand: 'MarketMaster', category: '营销推广' },
  { name: 'Consulting Group', brand: 'ConsultG', category: '咨询服务' },
  { name: 'Raw Materials Co', brand: 'RawMat', category: '原材料' },
  { name: 'AI Analytics Ltd', brand: 'AIAnalytics', category: '技术服务' },
  { name: 'Data Center Pro', brand: 'DataCenter', category: '云计算' },
  { name: 'Creative Agency', brand: 'Creative', category: '设计服务' },
  { name: 'Supply Chain Hub', brand: 'SupplyHub', category: '物流运输' },
  { name: 'Brand Strategy', brand: 'BrandStrat', category: '营销推广' },
];

const CATEGORIES = [
  '技术服务',
  '云计算',
  '原材料',
  '物流运输',
  '咨询服务',
  '设计服务',
  '营销推广',
  '其他',
];

// 生成随机地址
function generateAddress() {
  return '0x' + Array.from({ length: 40 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

// 生成随机交易哈希
function generateTxHash() {
  return '0x' + Array.from({ length: 64 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

// 生成随机日期(最近30天)
function generateRandomDate(daysAgo = 30) {
  const now = new Date();
  const randomDays = Math.floor(Math.random() * daysAgo);
  const randomHours = Math.floor(Math.random() * 24);
  const randomMinutes = Math.floor(Math.random() * 60);
  
  const date = new Date(now);
  date.setDate(date.getDate() - randomDays);
  date.setHours(randomHours, randomMinutes, 0, 0);
  
  return date;
}

// 生成供应商数据
/**
 * @param {number} count
 * @returns {MockSupplier[]}
 */
export function generateMockSuppliers(count = 12) {
  const suppliers = [];
  
  for (let i = 0; i < count; i++) {
    const supplier = SUPPLIER_NAMES[i % SUPPLIER_NAMES.length];
    const paymentCount = Math.floor(Math.random() * 20) + 5;
    const avgPayment = Math.random() * 5 + 0.5; // 0.5-5.5 ETH
    const totalAmount = avgPayment * paymentCount;
    
    suppliers.push({
      id: generateAddress(),
      name: `${supplier.name} ${i > SUPPLIER_NAMES.length - 1 ? i - SUPPLIER_NAMES.length + 1 : ''}`.trim(),
      brand: supplier.brand,
      category: supplier.category,
      profitMargin: Math.random() * 30 + 10, // 10-40%
      totalAmount: parseFloat(totalAmount.toFixed(4)),
      paymentCount,
      lastPayment: generateRandomDate(7),
    });
  }
  
  return suppliers;
}

// 生成支付数据
/**
 * @param {MockSupplier[]} suppliers
 * @param {string} mainWallet
 * @param {number} count
 * @returns {MockPayment[]}
 */
export function generateMockPayments(
  suppliers,
  mainWallet,
  count = 50
) {
  const payments = [];
  const statuses = ['Completed', 'Completed', 'Completed', 'Pending', 'Failed'];
  
  for (let i = 0; i < count; i++) {
    const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
    const amount = Math.random() * 5 + 0.1; // 0.1-5.1 ETH
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    payments.push({
      id: (i + 1).toString(),
      from: mainWallet,
      to: supplier.id,
      amount: parseFloat(amount.toFixed(4)),
      category: supplier.category,
      status,
      timestamp: generateRandomDate(30),
      txHash: generateTxHash(),
    });
  }
  
  // 按时间排序(最新的在前)
  payments.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  
  return payments;
}

// 生成统计数据
/**
 * @param {MockPayment[]} payments
 */
export function generateMockStats(payments) {
  const completedPayments = payments.filter(p => p.status === 'Completed');
  const totalAmount = completedPayments.reduce((sum, p) => sum + p.amount, 0);
  const uniqueSuppliers = new Set(completedPayments.map(p => p.to)).size;
  
  return {
    totalPayments: completedPayments.length,
    totalAmount: parseFloat(totalAmount.toFixed(4)),
    supplierCount: uniqueSuppliers,
    averagePayment: completedPayments.length > 0 
      ? parseFloat((totalAmount / completedPayments.length).toFixed(4))
      : 0,
  };
}

// 生成完整的测试数据集
export function generateFullMockData(supplierCount = 12) {
  const mainWallet = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0'; // 主钱包
  const suppliers = generateMockSuppliers(supplierCount);
  const paymentCount = Math.max(50, supplierCount * 4); // Scale payments with suppliers
  const payments = generateMockPayments(suppliers, mainWallet, paymentCount);
  const stats = generateMockStats(payments);
  
  return {
    mainWallet,
    suppliers,
    payments,
    stats,
  };
}

// 生成网络图数据
/**
 * @param {MockSupplier[]} suppliers
 * @param {MockPayment[]} payments
 */
export function generateNetworkGraphData(suppliers, payments) {
  const mainWallet = payments[0]?.from || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0';
  
  // 计算每个供应商的总支付金额
  const supplierAmounts = new Map();
  payments
    .filter(p => p.status === 'Completed')
    .forEach(p => {
      const current = supplierAmounts.get(p.to) || 0;
      supplierAmounts.set(p.to, current + p.amount);
    });
  
  // 创建节点
  const nodes = [
    {
      id: mainWallet,
      name: 'Main Wallet',
      type: 'main',
      value: Array.from(supplierAmounts.values()).reduce((sum, v) => sum + v, 0),
    },
    ...suppliers.map(s => ({
      id: s.id,
      name: s.brand,
      type: 'supplier',
      category: s.category,
      value: supplierAmounts.get(s.id) || 0,
    })),
  ];
  
  // 创建连接
  const links = suppliers
    .filter(s => supplierAmounts.has(s.id))
    .map(s => ({
      source: mainWallet,
      target: s.id,
      value: supplierAmounts.get(s.id) || 0,
      category: s.category,
    }));
  
  return { nodes, links };
}

