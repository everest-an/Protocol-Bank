// Mock data generation utilities for Protocol Bank

// 生成随机地址
function generateAddress() {
  const chars = '0123456789abcdef';
  let address = '0x';
  for (let i = 0; i < 40; i++) {
    address += chars[Math.floor(Math.random() * chars.length)];
  }
  return address;
}

// 生成随机交易哈希
function generateTxHash() {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

// 生成随机日期
function generateRandomDate(daysAgo = 30) {
  const now = new Date();
  const randomDays = Math.floor(Math.random() * daysAgo);
  const date = new Date(now.getTime() - randomDays * 24 * 60 * 60 * 1000);
  return date;
}

// 供应商名称和类别
const SUPPLIER_NAMES = [
  { name: 'Acme Corp', brand: 'Acme', category: 'Raw Materials' },
  { name: 'TechVision Inc', brand: 'TechVision', category: 'Technical Services' },
  { name: 'Global Logistics', brand: 'Global', category: 'Logistics' },
  { name: 'CloudNet Solutions', brand: 'CloudNet', category: 'Cloud Computing' },
  { name: 'Design Studio Pro', brand: 'DesignPro', category: 'Design Services' },
  { name: 'Marketing Masters', brand: 'MarketMasters', category: 'Marketing' },
  { name: 'Consulting Group', brand: 'ConsultGroup', category: 'Consulting Services' },
  { name: 'DataFlow Systems', brand: 'DataFlow', category: 'Data Services' },
  { name: 'SecureNet', brand: 'SecureNet', category: 'Security Services' },
  { name: 'EcoSupply', brand: 'EcoSupply', category: 'Sustainable Materials' },
  { name: 'FastShip Logistics', brand: 'FastShip', category: 'Express Delivery' },
  { name: 'AI Solutions Ltd', brand: 'AISolutions', category: 'AI Services' },
];

/**
 * 生成完整的测试数据集
 * @param {number} supplierCount - 供应商数量（默认 12）
 * @param {number} paymentCount - 支付记录数量（默认 20）
 * @returns {Object} 包含 suppliers, payments, stats 的对象
 */
export function generateFullMockData(supplierCount = 12, paymentCount = 20) {
  const mainWallet = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0';
  
  // 1. 生成供应商
  const suppliers = [];
  for (let i = 0; i < supplierCount; i++) {
    const supplier = SUPPLIER_NAMES[i % SUPPLIER_NAMES.length];
    suppliers.push({
      id: generateAddress(),
      name: `${supplier.name}${i >= SUPPLIER_NAMES.length ? ` ${i - SUPPLIER_NAMES.length + 2}` : ''}`,
      brand: supplier.brand,
      category: supplier.category,
      profitMargin: Math.random() * 30 + 10, // 10-40%
      totalAmount: 0, // 稍后计算
      paymentCount: 0, // 稍后计算
      lastPayment: null, // 稍后计算
    });
  }
  
  // 2. 为每个供应商分配支付数量（使用更均匀的分布）
  const paymentsPerSupplier = [];
  let remainingPayments = paymentCount;
  
  // 先给每个供应商至少 1 笔支付
  for (let i = 0; i < supplierCount; i++) {
    paymentsPerSupplier[i] = 1;
    remainingPayments--;
  }
  
  // 随机分配剩余的支付
  while (remainingPayments > 0) {
    const randomIndex = Math.floor(Math.random() * supplierCount);
    paymentsPerSupplier[randomIndex]++;
    remainingPayments--;
  }
  
  // 3. 生成支付记录
  const payments = [];
  const statuses = ['Completed', 'Completed', 'Completed', 'Pending'];
  let paymentId = 1;
  
  for (let i = 0; i < supplierCount; i++) {
    const supplier = suppliers[i];
    const numPayments = paymentsPerSupplier[i];
    
    for (let j = 0; j < numPayments; j++) {
      const amount = Math.random() * 4.5 + 0.5; // 0.5-5.0 ETH
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const timestamp = generateRandomDate(30);
      
      const payment = {
        id: paymentId.toString(),
        from: mainWallet,
        to: supplier.id,
        supplierName: supplier.name, // 添加供应商名称
        amount: parseFloat(amount.toFixed(4)),
        category: supplier.category,
        status,
        timestamp,
        txHash: generateTxHash(),
      };
      
      payments.push(payment);
      
      // 更新供应商统计
      if (status === 'Completed') {
        supplier.totalAmount += payment.amount;
        supplier.paymentCount++;
        if (!supplier.lastPayment || timestamp > supplier.lastPayment) {
          supplier.lastPayment = timestamp;
        }
      }
      
      paymentId++;
    }
  }
  
  // 格式化供应商的 totalAmount
  suppliers.forEach(s => {
    s.totalAmount = parseFloat(s.totalAmount.toFixed(4));
  });
  
  // 按时间排序支付记录（最新的在前）
  payments.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  
  // 4. 计算统计数据
  const completedPayments = payments.filter(p => p.status === 'Completed');
  const totalAmount = completedPayments.reduce((sum, p) => sum + p.amount, 0);
  const uniqueSuppliers = new Set(completedPayments.map(p => p.to)).size;
  
  const stats = {
    totalPayments: completedPayments.length,
    totalAmount: parseFloat(totalAmount.toFixed(4)),
    supplierCount: uniqueSuppliers,
    averagePayment: completedPayments.length > 0 
      ? parseFloat((totalAmount / completedPayments.length).toFixed(4))
      : 0,
  };
  
  return {
    mainWallet,
    suppliers,
    payments,
    stats,
  };
}

/**
 * 生成网络图数据
 * @param {Array} suppliers - 供应商列表
 * @param {Array} payments - 支付记录列表
 * @returns {Object} 包含 nodes 和 links 的网络图数据
 */
export function generateNetworkGraphData(suppliers, payments) {
  const mainWallet = payments[0]?.from || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0';
  
  // 计算每个供应商的总支付金额（只计算已完成的）
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
    ...suppliers
      .filter(s => supplierAmounts.has(s.id)) // 只显示有支付记录的供应商
      .map(s => ({
        id: s.id,
        name: s.brand || s.name,
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

// 导出默认的测试数据（12 个供应商，20 笔支付）
export const defaultMockData = generateFullMockData(12, 20);
