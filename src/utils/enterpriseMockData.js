// Generate enterprise-scale mock data for payment universe visualization

const categories = [
  { name: 'Technology', color: '#3b82f6', weight: 0.25 },
  { name: 'Marketing', color: '#ef4444', weight: 0.15 },
  { name: 'Cloud Services', color: '#8b5cf6', weight: 0.12 },
  { name: 'Logistics', color: '#f59e0b', weight: 0.10 },
  { name: 'Design', color: '#ec4899', weight: 0.08 },
  { name: 'Consulting', color: '#10b981', weight: 0.08 },
  { name: 'Manufacturing', color: '#06b6d4', weight: 0.10 },
  { name: 'Professional Services', color: '#84cc16', weight: 0.07 },
  { name: 'Legal', color: '#f97316', weight: 0.03 },
  { name: 'Finance', color: '#a855f7', weight: 0.02 }
];

const companyNames = [
  'Tech Solutions', 'Digital Dynamics', 'Cloud Systems', 'Data Corp',
  'Innovate Labs', 'Smart Services', 'Global Tech', 'Future Systems',
  'Prime Solutions', 'Elite Services', 'Advanced Tech', 'Pro Systems',
  'Quantum Corp', 'Nexus Group', 'Apex Solutions', 'Summit Tech',
  'Vertex Systems', 'Zenith Corp', 'Omega Services', 'Alpha Tech',
  'Beta Solutions', 'Gamma Systems', 'Delta Corp', 'Epsilon Tech',
  'Zeta Services', 'Eta Solutions', 'Theta Systems', 'Iota Corp',
  'Kappa Tech', 'Lambda Services', 'Mu Solutions', 'Nu Systems',
  'Xi Corp', 'Omicron Tech', 'Pi Services', 'Rho Solutions',
  'Sigma Systems', 'Tau Corp', 'Upsilon Tech', 'Phi Services',
  'Chi Solutions', 'Psi Systems', 'Ace Corp', 'Best Tech',
  'Core Services', 'Direct Solutions', 'Express Systems', 'Fast Corp'
];

function generateSupplierName(index, category) {
  const prefix = companyNames[index % companyNames.length];
  return `${prefix} ${category}`;
}

export function generateEnterpriseData(supplierCount = 300) {
  const nodes = [];
  const links = [];

  // Create company node (center)
  nodes.push({
    id: 'company',
    label: 'Your Company',
    type: 'company',
    size: 40,
    color: '#6366f1',
    amount: 0,
    transactions: 0,
    category: 'Company'
  });

  // Generate suppliers
  let supplierId = 0;
  categories.forEach(category => {
    const count = Math.floor(supplierCount * category.weight);
    
    for (let i = 0; i < count; i++) {
      const amount = Math.random() * 100000 + 5000;
      const transactions = Math.floor(Math.random() * 50) + 5;
      
      // Calculate size based on amount (logarithmic scale for better visualization)
      const size = Math.max(8, Math.min(25, Math.log10(amount) * 5));
      
      nodes.push({
        id: `supplier-${supplierId}`,
        label: generateSupplierName(supplierId, category.name),
        type: 'supplier',
        size: size,
        color: category.color,
        amount: amount,
        transactions: transactions,
        category: category.name
      });

      // Create link from company to supplier
      links.push({
        source: 'company',
        target: `supplier-${supplierId}`,
        value: amount
      });

      supplierId++;
    }
  });

  // Add some inter-supplier connections (sub-contractors)
  const subContractorCount = Math.floor(supplierCount * 0.1);
  for (let i = 0; i < subContractorCount; i++) {
    const source = Math.floor(Math.random() * supplierCount);
    const target = Math.floor(Math.random() * supplierCount);
    if (source !== target) {
      links.push({
        source: `supplier-${source}`,
        target: `supplier-${target}`,
        value: Math.random() * 10000 + 1000
      });
    }
  }

  return { nodes, links };
}

export function generateTimeSeriesData(months = 12) {
  return Array.from({ length: months }, (_, i) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return {
      month: monthNames[i],
      amount: Math.random() * 500000 + 200000,
      transactions: Math.floor(Math.random() * 200) + 100,
      suppliers: Math.floor(Math.random() * 50) + 150
    };
  });
}

export function getCategoryStats(nodes) {
  const stats = {};
  
  categories.forEach(cat => {
    stats[cat.name] = {
      count: 0,
      totalAmount: 0,
      totalTransactions: 0,
      color: cat.color
    };
  });

  nodes.forEach(node => {
    if (node.type === 'supplier' && stats[node.category]) {
      stats[node.category].count++;
      stats[node.category].totalAmount += node.amount;
      stats[node.category].totalTransactions += node.transactions;
    }
  });

  return stats;
}

export function getTopSuppliers(nodes, count = 10) {
  return nodes
    .filter(n => n.type === 'supplier')
    .sort((a, b) => b.amount - a.amount)
    .slice(0, count);
}

export function searchSuppliers(nodes, query) {
  if (!query) return nodes;
  
  const lowerQuery = query.toLowerCase();
  return nodes.filter(node => 
    node.type === 'supplier' && 
    (node.label.toLowerCase().includes(lowerQuery) || 
     node.category.toLowerCase().includes(lowerQuery))
  );
}

export function filterByCategory(nodes, links, category) {
  if (!category || category === 'all') return { nodes, links };
  
  const filteredNodes = nodes.filter(node => 
    node.type === 'company' || node.category === category
  );
  
  const nodeIds = new Set(filteredNodes.map(n => n.id));
  const filteredLinks = links.filter(link => 
    nodeIds.has(link.source.id || link.source) && 
    nodeIds.has(link.target.id || link.target)
  );
  
  return { nodes: filteredNodes, links: filteredLinks };
}

export function filterByAmountRange(nodes, links, min, max) {
  const filteredNodes = nodes.filter(node => 
    node.type === 'company' || (node.amount >= min && node.amount <= max)
  );
  
  const nodeIds = new Set(filteredNodes.map(n => n.id));
  const filteredLinks = links.filter(link => 
    nodeIds.has(link.source.id || link.source) && 
    nodeIds.has(link.target.id || link.target)
  );
  
  return { nodes: filteredNodes, links: filteredLinks };
}

