import { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Calendar,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieChartIcon,
  BarChart3,
  Wallet,
  Users,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { format } from 'date-fns';
import { generateFinancialMockData, calculateAnalytics } from '../utils/financialMockData.js';
import { useWeb3 } from '../contexts/Web3Context.jsx';
import etherscanService from '../services/etherscanService';

export default function AnalyticsEnhanced() {
  const { account, isConnected } = useWeb3();
  const [period, setPeriod] = useState('month');
  const [mockData, setMockData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [selectedDateRange, setSelectedDateRange] = useState('all');
  const [dataSource, setDataSource] = useState('demo'); // 'demo' or 'blockchain'
  const [loading, setLoading] = useState(false);
  const [blockchainData, setBlockchainData] = useState(null);

  // Load blockchain data if connected
  const loadBlockchainData = async () => {
    if (!isConnected || !account) return;
    
    setLoading(true);
    try {
      const data = await etherscanService.getStreamPaymentData(account, 11155111);
      setBlockchainData(data);
      
      // Convert blockchain data to analytics format
      const transactions = data.payments.map(payment => ({
        id: payment.txHash,
        date: new Date(payment.timestamp * 1000).toISOString(),
        timestamp: payment.timestamp * 1000,
        type: payment.from.toLowerCase() === account.toLowerCase() ? 'expense' : 'income',
        amount: parseFloat(payment.amount),
        category: payment.category || 'Stream Payment',
        description: `Payment ${payment.from === account ? 'to' : 'from'} ${payment.to || payment.from}`,
        recipient: payment.to,
        sender: payment.from,
        status: 'completed',
        currency: 'ETH',
        network: 'Ethereum',
        txHash: payment.txHash
      }));
      
      setMockData({ transactions });
    } catch (error) {
      console.error('Error loading blockchain data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate demo data on mount
  useEffect(() => {
    if (dataSource === 'demo') {
      try {
        const data = generateFinancialMockData();
        setMockData(data);
      } catch (error) {
        console.error('Error generating mock data:', error);
      }
    } else if (dataSource === 'blockchain') {
      loadBlockchainData();
    }
  }, [dataSource, account, isConnected]);

  // Calculate analytics when data changes
  useEffect(() => {
    if (!mockData || !mockData.transactions) return;
    
    try {
      let filteredTransactions = mockData.transactions;
      
      // Apply date range filter
      if (selectedDateRange !== 'all') {
        const now = new Date();
        const daysMap = {
          '30d': 30,
          '90d': 90,
          '180d': 180,
          '365d': 365
        };
        
        const days = daysMap[selectedDateRange];
        if (days) {
          const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
          filteredTransactions = filteredTransactions.filter(t => 
            new Date(t.date) >= cutoffDate
          );
        }
      }
      
      const calculatedAnalytics = calculateAnalytics(filteredTransactions, period);
      setAnalytics(calculatedAnalytics);
    } catch (error) {
      console.error('Error calculating analytics:', error);
    }
  }, [mockData, period, selectedDateRange]);

  // Export to CSV
  const exportToCSV = () => {
    if (!analytics || !mockData) return;

    const csvRows = [];
    csvRows.push(['Protocol Bank - Financial Analytics Report']);
    csvRows.push(['Generated:', new Date().toLocaleString()]);
    csvRows.push(['Period:', period === 'month' ? 'Monthly' : 'Yearly']);
    csvRows.push(['Data Source:', dataSource === 'demo' ? 'Demo Data' : 'Blockchain Data']);
    csvRows.push([]);
    
    csvRows.push(['Summary']);
    csvRows.push(['Total Income', `$${analytics.summary.totalIncome.toLocaleString()}`]);
    csvRows.push(['Total Expense', `$${analytics.summary.totalExpense.toLocaleString()}`]);
    csvRows.push(['Net Cash Flow', `$${analytics.summary.netCashFlow.toLocaleString()}`]);
    csvRows.push(['Total Transactions', analytics.summary.transactionCount]);
    csvRows.push([]);
    
    if (period === 'month') {
      csvRows.push(['Monthly Data']);
      csvRows.push(['Month', 'Income', 'Expense', 'Net Flow', 'Transactions']);
      analytics.monthlyData.forEach(m => {
        csvRows.push([
          m.month,
          `$${m.income.toFixed(2)}`,
          `$${m.expense.toFixed(2)}`,
          `$${m.netFlow.toFixed(2)}`,
          m.transactionCount
        ]);
      });
    }

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `protocol-bank-analytics-${Date.now()}.csv`;
    a.click();
  };

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 text-cyan-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-400">Loading financial analytics...</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const chartData = period === 'month' ? analytics.monthlyData : analytics.yearlyData;
  const displayData = chartData.map(item => ({
    name: period === 'month' ? format(new Date(item.month || `${item.year}-01`), 'MMM yyyy') : item.year.toString(),
    income: item.income,
    expense: item.expense,
    netFlow: item.netFlow
  }));

  // Pie chart colors
  const INCOME_COLORS = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'];
  const EXPENSE_COLORS = ['#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fee2e2'];

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900/95 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-4 shadow-2xl">
          <p className="text-white font-semibold mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm flex items-center gap-2" style={{ color: entry.color }}>
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></span>
              {entry.name}: ${entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Financial Analytics
            </h2>
            <p className="text-gray-400 mt-2">
              Comprehensive cash flow and financial reports
            </p>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            {/* Data Source Toggle */}
            <div className="flex items-center gap-2 bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-xl p-1">
              <button
                onClick={() => setDataSource('demo')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  dataSource === 'demo'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/50'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Demo Data
              </button>
              <button
                onClick={() => setDataSource('blockchain')}
                disabled={!isConnected}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  dataSource === 'blockchain'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/50'
                    : 'text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Blockchain
                </div>
              </button>
            </div>

            {/* Date Range Filter */}
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
              className="px-4 py-2 bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
            >
              <option value="all">All Time</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="180d">Last 6 Months</option>
              <option value="365d">Last Year</option>
            </select>
            
            {/* Period Toggle */}
            <div className="flex items-center gap-2 bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-xl p-1">
              <button
                onClick={() => setPeriod('month')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  period === 'month'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/50'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setPeriod('year')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  period === 'year'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/50'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Yearly
              </button>
            </div>
            
            {/* Export Button */}
            <Button
              onClick={exportToCSV}
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0 shadow-lg shadow-green-500/50"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>

            {/* Refresh Button */}
            {dataSource === 'blockchain' && (
              <Button
                onClick={loadBlockchainData}
                disabled={loading}
                className="flex items-center gap-2 bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 hover:border-cyan-500/50 text-white"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Income */}
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 backdrop-blur-xl border border-green-500/30 rounded-xl p-6 hover:border-green-500/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Income</p>
                <p className="text-3xl font-bold text-green-400">
                  ${analytics.summary.totalIncome.toLocaleString()}
                </p>
                <p className="text-xs text-green-400/70 mt-2">
                  {analytics.summary.incomeTransactions} transactions
                </p>
              </div>
              <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center">
                <ArrowUpRight className="w-7 h-7 text-green-400" />
              </div>
            </div>
          </div>

          {/* Total Expense */}
          <div className="bg-gradient-to-br from-red-500/20 to-rose-500/10 backdrop-blur-xl border border-red-500/30 rounded-xl p-6 hover:border-red-500/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Expense</p>
                <p className="text-3xl font-bold text-red-400">
                  ${analytics.summary.totalExpense.toLocaleString()}
                </p>
                <p className="text-xs text-red-400/70 mt-2">
                  {analytics.summary.expenseTransactions} transactions
                </p>
              </div>
              <div className="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center">
                <ArrowDownRight className="w-7 h-7 text-red-400" />
              </div>
            </div>
          </div>

          {/* Net Cash Flow */}
          <div className={`bg-gradient-to-br ${
            analytics.summary.netCashFlow >= 0 
              ? 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30 hover:border-cyan-500/50' 
              : 'from-orange-500/20 to-amber-500/10 border-orange-500/30 hover:border-orange-500/50'
          } backdrop-blur-xl border rounded-xl p-6 transition-all`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Net Cash Flow</p>
                <p className={`text-3xl font-bold ${
                  analytics.summary.netCashFlow >= 0 ? 'text-cyan-400' : 'text-orange-400'
                }`}>
                  ${Math.abs(analytics.summary.netCashFlow).toLocaleString()}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  {analytics.summary.netCashFlow >= 0 ? 'Positive' : 'Negative'} flow
                </p>
              </div>
              <div className={`w-14 h-14 ${
                analytics.summary.netCashFlow >= 0 ? 'bg-cyan-500/20' : 'bg-orange-500/20'
              } rounded-full flex items-center justify-center`}>
                {analytics.summary.netCashFlow >= 0 ? (
                  <TrendingUp className="w-7 h-7 text-cyan-400" />
                ) : (
                  <TrendingDown className="w-7 h-7 text-orange-400" />
                )}
              </div>
            </div>
          </div>

          {/* Total Transactions */}
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/10 backdrop-blur-xl border border-purple-500/30 rounded-xl p-6 hover:border-purple-500/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Transactions</p>
                <p className="text-3xl font-bold text-purple-400">
                  {analytics.summary.transactionCount}
                </p>
                <p className="text-xs text-purple-400/70 mt-2">
                  Avg ${(analytics.summary.totalIncome + analytics.summary.totalExpense) / analytics.summary.transactionCount || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="w-14 h-14 bg-purple-500/20 rounded-full flex items-center justify-center">
                <Activity className="w-7 h-7 text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cash Flow Trend */}
          <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-semibold text-white">Cash Flow Trend</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={displayData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Income vs Expense */}
          <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-semibold text-white">Income vs Expense</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={displayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: '#fff' }} />
                <Bar dataKey="income" fill="#10b981" radius={[8, 8, 0, 0]} />
                <Bar dataKey="expense" fill="#ef4444" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category Breakdown - Income */}
          <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <PieChartIcon className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-semibold text-white">Income by Category</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.categoryBreakdown.filter(c => c.type === 'income')}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percentage }) => `${category}: ${percentage.toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {analytics.categoryBreakdown
                    .filter(c => c.type === 'income')
                    .map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={INCOME_COLORS[index % INCOME_COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Category Breakdown - Expense */}
          <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <PieChartIcon className="w-5 h-5 text-red-400" />
              <h3 className="text-lg font-semibold text-white">Expense by Category</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.categoryBreakdown.filter(c => c.type === 'expense')}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percentage }) => `${category}: ${percentage.toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {analytics.categoryBreakdown
                    .filter(c => c.type === 'expense')
                    .map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Details Table */}
        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">Category Details</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Category</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Type</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Amount</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Percentage</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Transactions</th>
                </tr>
              </thead>
              <tbody>
                {analytics.categoryBreakdown.map((category, index) => (
                  <tr key={index} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                    <td className="py-3 px-4 text-white">{category.category}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        category.type === 'income' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {category.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-white font-semibold">
                      ${category.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-400">
                      {category.percentage.toFixed(2)}%
                    </td>
                    <td className="py-3 px-4 text-right text-gray-400">
                      {category.transactionCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
