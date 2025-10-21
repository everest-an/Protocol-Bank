// Mock data generator for Flow Payment (Stake) demo mode

export function generateStakeMockData() {
  const mockAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
  const companyAddress = '0x1234567890123456789012345678901234567890';
  
  // Mock pool data
  const poolData = {
    poolId: 1,
    staker: mockAddress,
    company: companyAddress,
    totalStaked: '50.0',
    availableBalance: '35.5',
    isActive: true,
    createdAt: Math.floor(Date.now() / 1000) - 86400 * 30, // 30 days ago
  };

  // Mock whitelist
  const whitelist = [
    {
      recipient: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
      name: 'Tech Solutions Inc',
      approved: true,
      approvedAt: Math.floor(Date.now() / 1000) - 86400 * 25,
    },
    {
      recipient: '0x9876543210FEDCBA9876543210FEDCBA98765432',
      name: 'Cloud Services Ltd',
      approved: true,
      approvedAt: Math.floor(Date.now() / 1000) - 86400 * 20,
    },
    {
      recipient: '0x1111222233334444555566667777888899990000',
      name: 'Marketing Agency Pro',
      approved: false,
      approvedAt: 0,
    },
    {
      recipient: '0xAAAABBBBCCCCDDDDEEEEFFFF0000111122223333',
      name: 'Legal Consulting Group',
      approved: true,
      approvedAt: Math.floor(Date.now() / 1000) - 86400 * 15,
    },
  ];

  // Mock payments
  const payments = [
    {
      paymentId: 1,
      from: companyAddress,
      to: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
      toName: 'Tech Solutions Inc',
      amount: '5.0',
      purpose: 'Software Development Services - Q1 2025',
      timestamp: Math.floor(Date.now() / 1000) - 86400 * 20,
      txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    },
    {
      paymentId: 2,
      from: companyAddress,
      to: '0x9876543210FEDCBA9876543210FEDCBA98765432',
      toName: 'Cloud Services Ltd',
      amount: '3.5',
      purpose: 'AWS Cloud Infrastructure - Monthly',
      timestamp: Math.floor(Date.now() / 1000) - 86400 * 15,
      txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    },
    {
      paymentId: 3,
      from: companyAddress,
      to: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
      toName: 'Tech Solutions Inc',
      amount: '4.0',
      purpose: 'Mobile App Development - Phase 2',
      timestamp: Math.floor(Date.now() / 1000) - 86400 * 10,
      txHash: '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
    },
    {
      paymentId: 4,
      from: companyAddress,
      to: '0xAAAABBBBCCCCDDDDEEEEFFFF0000111122223333',
      toName: 'Legal Consulting Group',
      amount: '2.0',
      purpose: 'Legal Advisory Services - Contract Review',
      timestamp: Math.floor(Date.now() / 1000) - 86400 * 5,
      txHash: '0x1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff',
    },
  ];

  // Calculate statistics
  const totalPayments = payments.length;
  const totalSpent = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0).toFixed(2);
  const averagePayment = (totalSpent / totalPayments).toFixed(2);
  const utilizationRate = ((totalSpent / parseFloat(poolData.totalStaked)) * 100).toFixed(1);

  return {
    poolData,
    whitelist,
    payments,
    stats: {
      totalPayments,
      totalSpent,
      averagePayment,
      utilizationRate,
    },
    mockAddress,
    companyAddress,
  };
}

// Generate visualization data for stake payment network
export function generateStakeVisualizationData(poolData, whitelist, payments) {
  const nodes = [];
  const links = [];

  // Add VC/LP node (staker)
  nodes.push({
    id: poolData.staker,
    name: 'VC/LP Investor',
    type: 'staker',
    amount: poolData.totalStaked,
  });

  // Add Company node
  nodes.push({
    id: poolData.company,
    name: 'Company',
    type: 'company',
    amount: poolData.availableBalance,
  });

  // Link from staker to company (staking)
  links.push({
    source: poolData.staker,
    target: poolData.company,
    amount: poolData.totalStaked,
    type: 'stake',
  });

  // Add supplier nodes and links
  whitelist.forEach((entry) => {
    if (entry.approved) {
      // Find payments to this supplier
      const supplierPayments = payments.filter(p => p.to === entry.recipient);
      const totalPaid = supplierPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

      if (totalPaid > 0) {
        nodes.push({
          id: entry.recipient,
          name: entry.name,
          type: 'supplier',
          amount: totalPaid.toFixed(2),
        });

        links.push({
          source: poolData.company,
          target: entry.recipient,
          amount: totalPaid.toFixed(2),
          type: 'payment',
          count: supplierPayments.length,
        });
      }
    }
  });

  return { nodes, links };
}

