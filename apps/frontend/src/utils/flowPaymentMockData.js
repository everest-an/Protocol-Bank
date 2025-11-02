// Auto-demo mock data generator for Flow Payment (Stake)
// Simulates two-tier interaction between VC/LP and Company

export const generateFlowPaymentMockData = () => {
  const now = Date.now();
  
  // Mock addresses
  const vcAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
  const companyAddress = '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4';
  
  // Mock pool data
  const poolData = {
    poolId: 1,
    staker: vcAddress,
    company: companyAddress,
    token: '0x0000000000000000000000000000000000000000', // ETH
    totalStaked: '50.0',
    totalSpent: '18.5',
    totalReleased: '0',
    availableBalance: '31.5',
    active: true,
    createdAt: now - 7 * 24 * 60 * 60 * 1000, // 7 days ago
  };

  // Mock whitelist with various statuses
  const whitelist = [
    {
      address: '0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2',
      name: 'Tech Solutions Inc',
      category: 'Technology Vendor',
      approved: true,
      approvedAt: now - 6 * 24 * 60 * 60 * 1000,
    },
    {
      address: '0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db',
      name: 'Cloud Services Ltd',
      category: 'Infrastructure',
      approved: true,
      approvedAt: now - 5 * 24 * 60 * 60 * 1000,
    },
    {
      address: '0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB',
      name: 'Marketing Agency Pro',
      category: 'Marketing',
      approved: true,
      approvedAt: now - 4 * 24 * 60 * 60 * 1000,
    },
    {
      address: '0x617F2E2fD72FD9D5503197092aC168c91465E7f2',
      name: 'Legal Services Group',
      category: 'Professional Services',
      approved: true,
      approvedAt: now - 3 * 24 * 60 * 60 * 1000,
    },
    {
      address: '0x17F6AD8Ef982297579C203069C1DbfFE4348c372',
      name: 'Office Supplies Co',
      category: 'Supplies',
      approved: true,
      approvedAt: now - 2 * 24 * 60 * 60 * 1000,
    },
    {
      address: '0x5c6B0f7Bf3E7ce046039Bd8FABdfD3f9F5021678',
      name: 'Design Studio Plus',
      category: 'Creative Services',
      approved: false,
      approvedAt: 0,
    },
    {
      address: '0x03C6FcED478cBbC9a4FAB34eF9f40767739D1Ff7',
      name: 'HR Consulting Firm',
      category: 'Human Resources',
      approved: false,
      approvedAt: 0,
    },
  ];

  // Mock payment history
  const payments = [
    {
      poolId: 1,
      from: companyAddress,
      to: '0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2',
      toName: 'Tech Solutions Inc',
      amount: '5.0',
      purpose: 'Software Development - Q4 2024',
      timestamp: now - 6 * 24 * 60 * 60 * 1000,
      txHash: '0x' + '1'.repeat(64),
    },
    {
      poolId: 1,
      from: companyAddress,
      to: '0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db',
      toName: 'Cloud Services Ltd',
      amount: '3.5',
      purpose: 'AWS Infrastructure - December',
      timestamp: now - 5 * 24 * 60 * 60 * 1000,
      txHash: '0x' + '2'.repeat(64),
    },
    {
      poolId: 1,
      from: companyAddress,
      to: '0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB',
      toName: 'Marketing Agency Pro',
      amount: '4.0',
      purpose: 'Digital Marketing Campaign',
      timestamp: now - 4 * 24 * 60 * 60 * 1000,
      txHash: '0x' + '3'.repeat(64),
    },
    {
      poolId: 1,
      from: companyAddress,
      to: '0x617F2E2fD72FD9D5503197092aC168c91465E7f2',
      toName: 'Legal Services Group',
      amount: '2.5',
      purpose: 'Legal Consultation - Contract Review',
      timestamp: now - 3 * 24 * 60 * 60 * 1000,
      txHash: '0x' + '4'.repeat(64),
    },
    {
      poolId: 1,
      from: companyAddress,
      to: '0x17F6AD8Ef982297579C203069C1DbfFE4348c372',
      toName: 'Office Supplies Co',
      amount: '1.5',
      purpose: 'Office Equipment and Supplies',
      timestamp: now - 2 * 24 * 60 * 60 * 1000,
      txHash: '0x' + '5'.repeat(64),
    },
    {
      poolId: 1,
      from: companyAddress,
      to: '0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2',
      toName: 'Tech Solutions Inc',
      amount: '2.0',
      purpose: 'Technical Support - Monthly Retainer',
      timestamp: now - 1 * 24 * 60 * 60 * 1000,
      txHash: '0x' + '6'.repeat(64),
    },
  ];

  return {
    poolData,
    whitelist,
    payments,
    vcAddress,
    companyAddress,
  };
};

// Auto-interaction workflow steps
export const getAutoInteractionSteps = () => {
  return [
    {
      id: 1,
      role: 'VC/LP',
      action: 'Create Pool',
      description: 'VC/LP creates escrow pool with 50 ETH',
      duration: 2000,
    },
    {
      id: 2,
      role: 'Company',
      action: 'Add Whitelist',
      description: 'Company adds Tech Solutions Inc to whitelist',
      duration: 2000,
    },
    {
      id: 3,
      role: 'VC/LP',
      action: 'Approve Whitelist',
      description: 'VC/LP approves Tech Solutions Inc',
      duration: 2000,
    },
    {
      id: 4,
      role: 'Company',
      action: 'Execute Payment',
      description: 'Company pays 5 ETH to Tech Solutions Inc',
      duration: 2000,
    },
    {
      id: 5,
      role: 'Company',
      action: 'Add More Whitelist',
      description: 'Company adds Cloud Services Ltd',
      duration: 2000,
    },
    {
      id: 6,
      role: 'VC/LP',
      action: 'Approve Whitelist',
      description: 'VC/LP approves Cloud Services Ltd',
      duration: 2000,
    },
    {
      id: 7,
      role: 'Company',
      action: 'Execute Payment',
      description: 'Company pays 3.5 ETH to Cloud Services Ltd',
      duration: 2000,
    },
    {
      id: 8,
      role: 'Both',
      action: 'View Analytics',
      description: 'Both parties monitor spending and balance',
      duration: 3000,
    },
  ];
};

// Generate visualization data for payment network
export const generateVisualizationData = (payments, whitelist) => {
  const nodes = [
    {
      id: 'vc',
      name: 'VC/LP',
      type: 'staker',
      amount: 50.0,
      color: '#3b82f6', // blue
    },
    {
      id: 'company',
      name: 'Company',
      type: 'company',
      amount: 31.5, // available balance
      color: '#8b5cf6', // purple
    },
  ];

  // Add supplier nodes from whitelist
  whitelist.forEach((entry, index) => {
    const supplierPayments = payments.filter(p => p.to === entry.address);
    const totalReceived = supplierPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    
    nodes.push({
      id: entry.address,
      name: entry.name,
      type: entry.approved ? 'approved_supplier' : 'pending_supplier',
      amount: totalReceived,
      category: entry.category,
      color: entry.approved ? '#10b981' : '#f59e0b', // green or amber
    });
  });

  // Create links
  const links = [
    {
      source: 'vc',
      target: 'company',
      value: 50.0,
      type: 'stake',
    },
  ];

  // Add payment links
  payments.forEach(payment => {
    links.push({
      source: 'company',
      target: payment.to,
      value: parseFloat(payment.amount),
      type: 'payment',
      purpose: payment.purpose,
    });
  });

  return { nodes, links };
};

// Calculate statistics
export const calculateStatistics = (poolData, payments, whitelist) => {
  const totalStaked = parseFloat(poolData.totalStaked);
  const totalSpent = parseFloat(poolData.totalSpent);
  const availableBalance = parseFloat(poolData.availableBalance);
  
  const utilizationRate = (totalSpent / totalStaked) * 100;
  const approvedSuppliers = whitelist.filter(w => w.approved).length;
  const pendingSuppliers = whitelist.filter(w => !w.approved).length;
  
  const avgPayment = payments.length > 0 ? totalSpent / payments.length : 0;
  
  // Category breakdown
  const categoryStats = {};
  whitelist.forEach(entry => {
    const supplierPayments = payments.filter(p => p.to === entry.address);
    const amount = supplierPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    
    if (!categoryStats[entry.category]) {
      categoryStats[entry.category] = { amount: 0, count: 0 };
    }
    categoryStats[entry.category].amount += amount;
    categoryStats[entry.category].count += supplierPayments.length;
  });

  return {
    totalStaked,
    totalSpent,
    availableBalance,
    utilizationRate,
    approvedSuppliers,
    pendingSuppliers,
    totalSuppliers: whitelist.length,
    avgPayment,
    paymentCount: payments.length,
    categoryStats,
  };
};

