import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button.jsx';
import { Card, CardContent } from '../components/ui/card.jsx';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Activity,
  Download,
  Calendar,
  PieChart,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
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

/**
 * Enhanced Analytics Page V2
 * 
 * Features:
 * - Payment trends over time
 * - Category distribution
 * - Supplier rankings
 * - Monthly/weekly statistics
 * - Export reports (CSV, PDF)
 * - Date range filtering
 * - Interactive charts
 */
export default function AnalyticsPageV2({ provider, account }) {
  const [timeRange, setTimeRange] = useState('month'); // week, month, quarter, year
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  // Chart colors
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

  // Load data from localStorage
  useEffect(() => {
    loadAnalytics();
  }, [timeRange, dateRange]);

  const loadAnalytics = () => {
    try {
      setLoading(true);

      // Load stream payments
      const streamPayments = JSON.parse(localStorage.getItem('protocolbank_stream_payments') || '[]');
      
      // Load scheduled payments
      const scheduledPayments = JSON.parse(localStorage.getItem('protocolbank_scheduled_payments') || '[]');
      
      // Combine all payments
      const allPayments = [
        ...streamPayments.map(p => ({
          id: p.id,
          type: 'stream',
          amount: parseFloat(p.amount || 0),
          token: p.token || 'ETH',
          category: p.category || 'Other',
          recipient: p.recipientAddress,
          timestamp: p.createdAt || new Date().toISOString(),
          status: p.status
        })),
        ...scheduledPayments.flatMap(sp => 
          (sp.history || []).map(h => ({
            id: h.id,
            type: 'scheduled',
            amount: parseFloat(h.amount || 0),
            token: h.token || 'ETH',
            category: sp.category || 'Other',
            recipient: sp.recipientAddress,
            timestamp: h.timestamp,
            status: h.status
          }))
        )
      ];

      // Filter by date range
      let filteredPayments = allPayments;
      if (dateRange.start || dateRange.end) {
        filteredPayments = allPayments.filter(payment => {
          const paymentDate = new Date(payment.timestamp);
          if (dateRange.start && paymentDate < new Date(dateRange.start)) return false;
          if (dateRange.end) {
            const endDate = new Date(dateRange.end);
            endDate.setHours(23, 59, 59, 999);
            if (paymentDate > endDate) return false;
          }
          return true;
        });
      }

      // Calculate total spent
      const totalSpent = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
      
      // Calculate average payment
      const avgPayment = filteredPayments.length > 0 ? totalSpent / filteredPayments.length : 0;

      // Count unique recipients
      const uniqueRecipients = new Set(filteredPayments.map(p => p.recipient)).size;

      // Calculate success rate
      const successfulPayments = filteredPayments.filter(p => p.status === 'success' || p.status === 'active').length;
      const successRate = filteredPayments.length > 0 ? (successfulPayments / filteredPayments.length) * 100 : 0;

      // Category distribution
      const categoryStats = {};
      filteredPayments.forEach(payment => {
        const category = payment.category || 'Other';
        if (!categoryStats[category]) {
          categoryStats[category] = { amount: 0, count: 0 };
        }
        categoryStats[category].amount += payment.amount;
        categoryStats[category].count += 1;
      });

      const categoryData = Object.entries(categoryStats).map(([name, data]) => ({
        name,
        value: data.amount,
        count: data.count
      })).sort((a, b) => b.value - a.value);

      // Time series data (daily)
      const timeSeriesData = {};
      filteredPayments.forEach(payment => {
        const date = new Date(payment.timestamp);
        const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
        if (!timeSeriesData[dateKey]) {
          timeSeriesData[dateKey] = { date: dateKey, amount: 0, count: 0 };
        }
        timeSeriesData[dateKey].amount += payment.amount;
        timeSeriesData[dateKey].count += 1;
      });

      const timeSeriesArray = Object.values(timeSeriesData).sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      );

      // Monthly data
      const monthlyData = {};
      filteredPayments.forEach(payment => {
        const date = new Date(payment.timestamp);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { month: monthKey, amount: 0, count: 0 };
        }
        monthlyData[monthKey].amount += payment.amount;
        monthlyData[monthKey].count += 1;
      });

      const monthlyArray = Object.values(monthlyData).sort((a, b) => 
        a.month.localeCompare(b.month)
      );

      // Top recipients
      const recipientStats = {};
      filteredPayments.forEach(payment => {
        const recipient = payment.recipient;
        if (!recipientStats[recipient]) {
          recipientStats[recipient] = { address: recipient, amount: 0, count: 0 };
        }
        recipientStats[recipient].amount += payment.amount;
        recipientStats[recipient].count += 1;
      });

      const topRecipients = Object.values(recipientStats)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10);

      // Token distribution
      const tokenStats = {};
      filteredPayments.forEach(payment => {
        const token = payment.token || 'ETH';
        if (!tokenStats[token]) {
          tokenStats[token] = { token, amount: 0, count: 0 };
        }
        tokenStats[token].amount += payment.amount;
        tokenStats[token].count += 1;
      });

      const tokenData = Object.values(tokenStats);

      // Calculate growth (compare with previous period)
      const now = new Date();
      const periodDays = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : timeRange === 'quarter' ? 90 : 365;
      const currentPeriodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
      const previousPeriodStart = new Date(currentPeriodStart.getTime() - periodDays * 24 * 60 * 60 * 1000);

      const currentPeriodPayments = allPayments.filter(p => 
        new Date(p.timestamp) >= currentPeriodStart
      );
      const previousPeriodPayments = allPayments.filter(p => {
        const date = new Date(p.timestamp);
        return date >= previousPeriodStart && date < currentPeriodStart;
      });

      const currentTotal = currentPeriodPayments.reduce((sum, p) => sum + p.amount, 0);
      const previousTotal = previousPeriodPayments.reduce((sum, p) => sum + p.amount, 0);
      const growth = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;

      setAnalytics({
        totalSpent,
        avgPayment,
        uniqueRecipients,
        successRate,
        paymentCount: filteredPayments.length,
        categoryData,
        timeSeriesData: timeSeriesArray,
        monthlyData: monthlyArray,
        topRecipients,
        tokenData,
        growth,
        currentTotal,
        previousTotal
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!analytics) return;

    const rows = [
      ['Protocol Bank Analytics Report'],
      ['Generated:', new Date().toLocaleString()],
      [''],
      ['Summary'],
      ['Total Spent', analytics.totalSpent.toFixed(4)],
      ['Average Payment', analytics.avgPayment.toFixed(4)],
      ['Total Payments', analytics.paymentCount],
      ['Unique Recipients', analytics.uniqueRecipients],
      ['Success Rate', analytics.successRate.toFixed(2) + '%'],
      [''],
      ['Category Distribution'],
      ['Category', 'Amount', 'Count'],
      ...analytics.categoryData.map(c => [c.name, c.value.toFixed(4), c.count]),
      [''],
      ['Top Recipients'],
      ['Address', 'Amount', 'Count'],
      ...analytics.topRecipients.map(r => [r.address, r.amount.toFixed(4), r.count])
    ];

    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `protocol-bank-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(value);
  };

  // Format percentage
  const formatPercentage = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 dark:text-gray-400">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Financial Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive insights into your payment activities
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={exportToCSV}
            variant="outline"
            className="border-gray-300 dark:border-gray-600"
            disabled={!analytics}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {['week', 'month', 'quarter', 'year'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          />
          <span className="text-gray-500 dark:text-gray-400">to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          />
        </div>
      </div>

      {!analytics ? (
        <Card className="border border-gray-200 dark:border-gray-700">
          <CardContent className="p-12 text-center">
            <Activity className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No payment data available</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Spent</p>
                  <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {formatCurrency(analytics.totalSpent)}
                </p>
                <div className={`flex items-center text-sm ${
                  analytics.growth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {analytics.growth >= 0 ? (
                    <ArrowUpRight className="w-4 h-4 mr-1" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 mr-1" />
                  )}
                  {formatPercentage(analytics.growth)} vs last period
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Payment</p>
                  <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(analytics.avgPayment)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {analytics.paymentCount} total payments
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Recipients</p>
                  <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics.uniqueRecipients}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Unique addresses
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Success Rate</p>
                  <Activity className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics.successRate.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Payment success rate
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment Trend */}
            <Card className="border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Payment Trend
                </h3>
              </div>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics.timeSeriesData}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9ca3af"
                      tick={{ fill: '#9ca3af' }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis 
                      stroke="#9ca3af"
                      tick={{ fill: '#9ca3af' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                      formatter={(value) => [formatCurrency(value), 'Amount']}
                      labelFormatter={(label) => new Date(label).toLocaleDateString()}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorAmount)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card className="border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Category Distribution
                </h3>
              </div>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={analytics.categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analytics.categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                      formatter={(value) => [formatCurrency(value), 'Amount']}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Comparison */}
            <Card className="border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Monthly Comparison
                </h3>
              </div>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                    <XAxis 
                      dataKey="month" 
                      stroke="#9ca3af"
                      tick={{ fill: '#9ca3af' }}
                    />
                    <YAxis 
                      stroke="#9ca3af"
                      tick={{ fill: '#9ca3af' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                      formatter={(value) => [formatCurrency(value), 'Amount']}
                    />
                    <Bar dataKey="amount" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Recipients */}
            <Card className="border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Top Recipients
                </h3>
              </div>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {analytics.topRecipients.slice(0, 5).map((recipient, index) => (
                    <div key={recipient.address} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${
                          index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white font-mono">
                            {recipient.address.slice(0, 6)}...{recipient.address.slice(-4)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {recipient.count} payments
                          </p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(recipient.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category Details Table */}
          <Card className="border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Category Details
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Total Amount
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Payments
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Avg Payment
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      % of Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {analytics.categoryData.map((category, index) => (
                    <tr key={category.name} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {category.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white font-medium">
                        {formatCurrency(category.value)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600 dark:text-gray-400">
                        {category.count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600 dark:text-gray-400">
                        {formatCurrency(category.value / category.count)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600 dark:text-gray-400">
                        {((category.value / analytics.totalSpent) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
