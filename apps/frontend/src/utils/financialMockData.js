// Financial Mock Data Generator for Analytics
// Generates realistic financial transaction data for demonstration

import { subMonths, format, startOfMonth, endOfMonth, addDays } from 'date-fns';

/**
 * Generate realistic financial transactions for the past 12 months
 * @returns {Object} Financial data including transactions and analytics
 */
export function generateFinancialMockData() {
  const transactions = [];
  const categories = {
    income: [
      { name: 'Sales Revenue', weight: 40 },
      { name: 'Service Income', weight: 25 },
      { name: 'Investment Returns', weight: 15 },
      { name: 'Consulting Fees', weight: 12 },
      { name: 'Licensing', weight: 8 }
    ],
    expense: [
      { name: 'Salaries & Wages', weight: 35 },
      { name: 'Office Rent', weight: 15 },
      { name: 'Marketing & Advertising', weight: 12 },
      { name: 'Software & Tools', weight: 10 },
      { name: 'Travel & Entertainment', weight: 8 },
      { name: 'Utilities', weight: 6 },
      { name: 'Professional Services', weight: 7 },
      { name: 'Equipment & Supplies', weight: 7 }
    ]
  };

  const networks = ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism'];
  const currencies = ['USD', 'EUR', 'GBP', 'USDC', 'USDT'];

  // Generate transactions for the past 12 months
  for (let monthOffset = 11; monthOffset >= 0; monthOffset--) {
    const monthDate = subMonths(new Date(), monthOffset);
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    
    // Generate 20-40 transactions per month
    const transactionCount = Math.floor(Math.random() * 20) + 20;
    
    for (let i = 0; i < transactionCount; i++) {
      // Random date within the month
      const daysInMonth = monthEnd.getDate();
      const randomDay = Math.floor(Math.random() * daysInMonth);
      const transactionDate = addDays(monthStart, randomDay);
      
      // Determine if income or expense (60% expense, 40% income for realistic cash flow)
      const isIncome = Math.random() > 0.6;
      const type = isIncome ? 'income' : 'expense';
      
      // Select category based on weights
      const categoryList = categories[type];
      const totalWeight = categoryList.reduce((sum, cat) => sum + cat.weight, 0);
      let random = Math.random() * totalWeight;
      let selectedCategory = categoryList[0].name;
      
      for (const cat of categoryList) {
        random -= cat.weight;
        if (random <= 0) {
          selectedCategory = cat.name;
          break;
        }
      }
      
      // Generate realistic amounts
      let amount;
      if (isIncome) {
        // Income: $1,000 - $50,000
        amount = Math.floor(Math.random() * 49000) + 1000;
      } else {
        // Expenses: $100 - $15,000
        if (selectedCategory === 'Salaries & Wages') {
          amount = Math.floor(Math.random() * 20000) + 5000; // Higher for salaries
        } else if (selectedCategory === 'Office Rent') {
          amount = Math.floor(Math.random() * 5000) + 3000; // Consistent rent
        } else {
          amount = Math.floor(Math.random() * 10000) + 100;
        }
      }
      
      // Random network and currency
      const network = networks[Math.floor(Math.random() * networks.length)];
      const currency = currencies[Math.floor(Math.random() * currencies.length)];
      
      // Generate transaction
      const transaction = {
        id: `tx_${format(transactionDate, 'yyyyMMdd')}_${i}_${Math.random().toString(36).substr(2, 9)}`,
        date: transactionDate.toISOString(),
        timestamp: transactionDate.getTime(),
        type,
        amount,
        category: selectedCategory,
        description: generateDescription(type, selectedCategory),
        recipient: isIncome ? 'Protocol Bank' : generateRecipientName(selectedCategory),
        sender: isIncome ? generateSenderName(selectedCategory) : 'Protocol Bank',
        status: Math.random() > 0.05 ? 'completed' : 'pending', // 95% completed
        currency,
        network,
        txHash: `0x${Math.random().toString(16).substr(2, 64)}`
      };
      
      transactions.push(transaction);
    }
  }
  
  // Sort transactions by date (newest first)
  transactions.sort((a, b) => b.timestamp - a.timestamp);
  
  return {
    transactions,
    categories: categories,
    generatedAt: new Date().toISOString(),
    dataRange: {
      start: subMonths(new Date(), 11),
      end: new Date()
    }
  };
}

/**
 * Generate realistic transaction descriptions
 */
function generateDescription(type, category) {
  const descriptions = {
    income: {
      'Sales Revenue': ['Product sales Q', 'Monthly recurring revenue', 'Enterprise contract', 'Platform subscription'],
      'Service Income': ['Consulting services', 'Implementation project', 'Support contract', 'Professional services'],
      'Investment Returns': ['Dividend payment', 'Interest income', 'Capital gains', 'Investment yield'],
      'Consulting Fees': ['Strategy consulting', 'Technical advisory', 'Business consultation', 'Expert review'],
      'Licensing': ['Software license', 'IP licensing fee', 'Brand licensing', 'Technology license']
    },
    expense: {
      'Salaries & Wages': ['Monthly payroll', 'Salary payment', 'Employee compensation', 'Contractor payment'],
      'Office Rent': ['Monthly office rent', 'Workspace rental', 'Co-working space', 'Office lease'],
      'Marketing & Advertising': ['Digital advertising', 'Marketing campaign', 'Social media ads', 'Content marketing'],
      'Software & Tools': ['SaaS subscription', 'Development tools', 'Cloud services', 'Software licenses'],
      'Travel & Entertainment': ['Business travel', 'Client entertainment', 'Conference attendance', 'Team event'],
      'Utilities': ['Internet service', 'Electricity bill', 'Water & utilities', 'Phone service'],
      'Professional Services': ['Legal services', 'Accounting fees', 'Audit services', 'Consulting'],
      'Equipment & Supplies': ['Office supplies', 'Computer equipment', 'Furniture', 'Hardware purchase']
    }
  };
  
  const options = descriptions[type][category] || ['Transaction'];
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Generate realistic recipient names for expenses
 */
function generateRecipientName(category) {
  const recipients = {
    'Salaries & Wages': ['Employee', 'Contractor', 'Freelancer'],
    'Office Rent': ['Property Management', 'WeWork', 'Regus', 'Landlord'],
    'Marketing & Advertising': ['Google Ads', 'Facebook Ads', 'LinkedIn', 'Marketing Agency'],
    'Software & Tools': ['AWS', 'Vercel', 'GitHub', 'Figma', 'Notion'],
    'Travel & Entertainment': ['Airlines', 'Hotel', 'Restaurant', 'Uber'],
    'Utilities': ['ISP Provider', 'Electric Company', 'Telecom'],
    'Professional Services': ['Law Firm', 'Accounting Firm', 'Consultant'],
    'Equipment & Supplies': ['Office Depot', 'Amazon Business', 'Apple', 'Dell']
  };
  
  const options = recipients[category] || ['Vendor'];
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Generate realistic sender names for income
 */
function generateSenderName(category) {
  const senders = {
    'Sales Revenue': ['Enterprise Client', 'Customer', 'Platform User', 'Subscriber'],
    'Service Income': ['Client Company', 'Partner Organization', 'Enterprise Customer'],
    'Investment Returns': ['Investment Fund', 'Brokerage', 'Portfolio Manager'],
    'Consulting Fees': ['Consulting Client', 'Advisory Client', 'Corporate Client'],
    'Licensing': ['Licensee Company', 'Partner Firm', 'Technology Partner']
  };
  
  const options = senders[category] || ['Client'];
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Calculate analytics from transactions
 * @param {Array} transactions - Array of transaction objects
 * @param {String} period - 'month' or 'year'
 * @returns {Object} Calculated analytics
 */
export function calculateAnalytics(transactions, period = 'month') {
  if (!transactions || transactions.length === 0) {
    return null;
  }
  
  // Calculate totals
  const totalIncome = transactions
    .filter(t => t.type === 'income' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpense = transactions
    .filter(t => t.type === 'expense' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const netCashFlow = totalIncome - totalExpense;
  
  // Group by month
  const monthlyData = {};
  transactions.forEach(transaction => {
    if (transaction.status !== 'completed') return;
    
    const date = new Date(transaction.date);
    const monthKey = format(date, 'yyyy-MM');
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month: monthKey,
        income: 0,
        expense: 0,
        netFlow: 0,
        transactionCount: 0,
        transactions: []
      };
    }
    
    if (transaction.type === 'income') {
      monthlyData[monthKey].income += transaction.amount;
    } else {
      monthlyData[monthKey].expense += transaction.amount;
    }
    
    monthlyData[monthKey].transactionCount++;
    monthlyData[monthKey].transactions.push(transaction);
  });
  
  // Calculate net flow for each month
  Object.values(monthlyData).forEach(month => {
    month.netFlow = month.income - month.expense;
  });
  
  // Group by year
  const yearlyData = {};
  Object.values(monthlyData).forEach(month => {
    const year = month.month.split('-')[0];
    
    if (!yearlyData[year]) {
      yearlyData[year] = {
        year: parseInt(year),
        income: 0,
        expense: 0,
        netFlow: 0,
        transactionCount: 0,
        monthCount: 0
      };
    }
    
    yearlyData[year].income += month.income;
    yearlyData[year].expense += month.expense;
    yearlyData[year].netFlow += month.netFlow;
    yearlyData[year].transactionCount += month.transactionCount;
    yearlyData[year].monthCount++;
  });
  
  // Calculate monthly average for each year
  Object.values(yearlyData).forEach(year => {
    year.monthlyAverage = year.income / year.monthCount;
  });
  
  // Category breakdown
  const categoryData = {};
  transactions.forEach(transaction => {
    if (transaction.status !== 'completed') return;
    
    const key = `${transaction.type}_${transaction.category}`;
    
    if (!categoryData[key]) {
      categoryData[key] = {
        category: transaction.category,
        type: transaction.type,
        amount: 0,
        transactionCount: 0,
        percentage: 0
      };
    }
    
    categoryData[key].amount += transaction.amount;
    categoryData[key].transactionCount++;
  });
  
  // Calculate percentages
  Object.values(categoryData).forEach(cat => {
    const total = cat.type === 'income' ? totalIncome : totalExpense;
    cat.percentage = total > 0 ? (cat.amount / total) * 100 : 0;
  });
  
  // Sort monthly data
  const monthlyArray = Object.values(monthlyData).sort((a, b) => 
    a.month.localeCompare(b.month)
  );
  
  // Sort yearly data
  const yearlyArray = Object.values(yearlyData).sort((a, b) => a.year - b.year);
  
  // Sort category data by amount
  const categoryArray = Object.values(categoryData).sort((a, b) => b.amount - a.amount);
  
  return {
    summary: {
      totalIncome,
      totalExpense,
      netCashFlow,
      transactionCount: transactions.filter(t => t.status === 'completed').length,
      avgTransactionSize: totalIncome > 0 ? (totalIncome + totalExpense) / transactions.filter(t => t.status === 'completed').length : 0
    },
    monthlyData: monthlyArray,
    yearlyData: yearlyArray,
    categoryBreakdown: categoryArray,
    incomeCategories: categoryArray.filter(c => c.type === 'income'),
    expenseCategories: categoryArray.filter(c => c.type === 'expense')
  };
}
