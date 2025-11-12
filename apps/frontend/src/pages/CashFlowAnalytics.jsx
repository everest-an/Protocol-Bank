import { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Calendar,
  Download,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieChartIcon
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

export default function CashFlowAnalytics() {
  const [period, setPeriod] = useState('month'); // 'month' or 'year'
  const [mockData, setMockData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [selectedDateRange, setSelectedDateRange] = useState('all');

  // Generate mock data on mount
  useEffect(() => {
    try {
      console.log('Generating financial mock data...');
      const data = generateFinancialMockData();
      console.log('Mock data generated:', data ? 'success' : 'failed');
      setMockData(data);
    } catch (error) {
      console.error('Error generating mock data:', error);
    }
  }, []);

  // Calculate analytics when data or period changes
  useEffect(() => {
    if (!mockData) {
      console.log('No mock data available yet');
      return;
    }
    
    try {
      console.log('Calculating analytics...');
    
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
    console.log('Analytics calculated:', calculatedAnalytics ? 'success' : 'failed');
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
    } else {
      csvRows.push(['Yearly Data']);
      csvRows.push(['Year', 'Income', 'Expense', 'Net Flow', 'Transactions', 'Monthly Avg']);
      analytics.yearlyData.forEach(y => {
        csvRows.push([
          y.year,
          `$${y.income.toFixed(2)}`,
          `$${y.expense.toFixed(2)}`,
          `$${y.netFlow.toFixed(2)}`,
          y.transactionCount,
          `$${y.monthlyAverage.toFixed(2)}`
        ]);
      });
    }
    
    csvRows.push([]);
    csvRows.push(['Category Breakdown']);
    csvRows.push(['Category', 'Type', 'Amount', 'Percentage', 'Transactions']);
    analytics.categoryBreakdown.forEach(c => {
      csvRows.push([
        c.category,
        c.type,
        `$${c.amount.toFixed(2)}`,
        `${c.percentage.toFixed(2)}%`,
        c.transactionCount
      ]);
    });

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
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 dark:text-gray-400">Loading financial analytics...</p>
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
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
          <p className="text-white font-medium mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: ${entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Financial Analytics</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive cash flow and financial reports
          </p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          {/* Date Range Filter */}
          <select
            value={selectedDateRange}
            onChange={(e) => setSelectedDateRange(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Time</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="180d">Last 6 Months</option>
            <option value="365d">Last Year</option>
          </select>
          
          {/* Period Toggle */}
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setPeriod('month')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                period === 'month'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setPeriod('year')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                period === 'year'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Yearly
            </button>
          </div>
          
          {/* Export Button */}
          <Button
            onClick={exportToCSV}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Income</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ${analytics.summary.totalIncome.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <ArrowUpRight className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Expense */}
        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Expense</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  ${analytics.summary.totalExpense.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <ArrowDownRight className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Net Cash Flow */}
        <Card className={`bg-gradient-to-br ${
          analytics.summary.netCashFlow >= 0
            ? 'from-blue-500/10 to-blue-600/5 border-blue-500/20'
            : 'from-orange-500/10 to-orange-600/5 border-orange-500/20'
        }`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Net Cash Flow</p>
                <p className={`text-2xl font-bold ${
                  analytics.summary.netCashFlow >= 0
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-orange-600 dark:text-orange-400'
                }`}>
                  ${analytics.summary.netCashFlow.toLocaleString()}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                analytics.summary.netCashFlow >= 0
                  ? 'bg-blue-500/20'
                  : 'bg-orange-500/20'
              }`}>
                {analytics.summary.netCashFlow >= 0 ? (
                  <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Transactions */}
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Transactions</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {analytics.summary.transactionCount}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Trend Chart */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Cash Flow Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={displayData}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="income"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorIncome)"
                name="Income"
              />
              <Area
                type="monotone"
                dataKey="expense"
                stroke="#ef4444"
                fillOpacity={1}
                fill="url(#colorExpense)"
                name="Expense"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Income vs Expense Comparison */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Income vs Expense Comparison
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={displayData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="income" fill="#10b981" name="Income" />
              <Bar dataKey="expense" fill="#ef4444" name="Expense" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income by Category */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Income by Category
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.incomeCategories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percentage }) => `${category}: ${percentage.toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {analytics.incomeCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={INCOME_COLORS[index % INCOME_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {analytics.incomeCategories.slice(0, 5).map((cat, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: INCOME_COLORS[index % INCOME_COLORS.length] }}
                    />
                    <span className="text-gray-700 dark:text-gray-300">{cat.category}</span>
                  </div>
                  <span className="text-gray-900 dark:text-white font-medium">
                    ${cat.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Expense by Category */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Expense by Category
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.expenseCategories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percentage }) => `${category}: ${percentage.toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {analytics.expenseCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {analytics.expenseCategories.slice(0, 5).map((cat, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: EXPENSE_COLORS[index % EXPENSE_COLORS.length] }}
                    />
                    <span className="text-gray-700 dark:text-gray-300">{cat.category}</span>
                  </div>
                  <span className="text-gray-900 dark:text-white font-medium">
                    ${cat.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions Table */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Transactions
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Category</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Description</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Amount</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {mockData.transactions.slice(0, 10).map((tx) => (
                  <tr key={tx.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      {format(new Date(tx.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        tx.type === 'income'
                          ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}>
                        {tx.type === 'income' ? 'Income' : 'Expense'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                      {tx.category}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                      {tx.description}
                    </td>
                    <td className={`py-3 px-4 text-sm text-right font-medium ${
                      tx.type === 'income'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        tx.status === 'completed'
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
