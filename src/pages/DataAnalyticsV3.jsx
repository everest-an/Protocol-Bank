import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, Activity, 
  AlertTriangle, Calendar, PieChart, BarChart3, TestTube2,
  Download, RefreshCw, FileText, Info, X
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { generateAnalyticsPDF } from '../utils/pdfExport.js';

export default function DataAnalyticsV3({ suppliers = [], payments = [], testMode = false, mockData = null }) {
  const [timeRange, setTimeRange] = useState('month'); // month, quarter, year
  const [analytics, setAnalytics] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);

  // Use test data or real data
  const dataSuppliers = testMode && mockData ? mockData.suppliers : suppliers;
  const dataPayments = testMode && mockData ? mockData.payments : payments;

  useEffect(() => {
    if (dataSuppliers.length === 0 || dataPayments.length === 0) return;

    // Calculate analytics
    const totalSpent = dataPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const avgPayment = totalSpent / dataPayments.length;

    // Category analysis
    const categoryStats = {};
    dataSuppliers.forEach(supplier => {
      const category = supplier.category || 'Other';
      const supplierPayments = dataPayments.filter(p => 
        p.recipient === supplier.address || p.supplier === supplier.name
      );
      const amount = supplierPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
      
      if (!categoryStats[category]) {
        categoryStats[category] = { amount: 0, count: 0, suppliers: 0, payments: [] };
      }
      categoryStats[category].amount += amount;
      categoryStats[category].count += supplierPayments.length;
      categoryStats[category].suppliers += 1;
      categoryStats[category].payments.push(...supplierPayments);
    });

    // Top suppliers
    const supplierAmounts = dataSuppliers.map(supplier => {
      const supplierPayments = dataPayments.filter(p => 
        p.recipient === supplier.address || p.supplier === supplier.name
      );
      const amount = supplierPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
      return { ...supplier, totalAmount: amount, paymentCount: supplierPayments.length };
    });
    const topSuppliers = supplierAmounts
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);

    // Concentration risk (top 5 suppliers % of total)
    const top5Amount = topSuppliers.slice(0, 5).reduce((sum, s) => sum + s.totalAmount, 0);
    const concentrationRisk = totalSpent > 0 ? (top5Amount / totalSpent) * 100 : 0;

    // Payment frequency analysis
    const paymentsByAmount = {
      small: dataPayments.filter(p => parseFloat(p.amount) < 1000).length,
      medium: dataPayments.filter(p => parseFloat(p.amount) >= 1000 && parseFloat(p.amount) < 10000).length,
      large: dataPayments.filter(p => parseFloat(p.amount) >= 10000).length,
    };

    // Time series data (monthly)
    const monthlyData = {};
    dataPayments.forEach(payment => {
      const date = new Date(payment.timestamp);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { amount: 0, count: 0, payments: [] };
      }
      monthlyData[monthKey].amount += parseFloat(payment.amount || 0);
      monthlyData[monthKey].count += 1;
      monthlyData[monthKey].payments.push(payment);
    });

    setAnalytics({
      totalSpent,
      avgPayment,
      categoryStats,
      topSuppliers,
      concentrationRisk,
      paymentsByAmount,
      monthlyData,
      supplierCount: dataSuppliers.length,
      paymentCount: dataPayments.length,
    });
  }, [dataSuppliers, dataPayments, testMode, mockData]);

  // Export to CSV
  const exportToCSV = () => {
    if (!analytics) return;

    const csvRows = [];
    csvRows.push(['Protocol Bank - Financial Analytics Report']);
    csvRows.push(['Generated:', new Date().toLocaleString()]);
    csvRows.push([]);
    
    csvRows.push(['Summary Metrics']);
    csvRows.push(['Total Spent', `$${analytics.totalSpent.toLocaleString()}`]);
    csvRows.push(['Active Suppliers', analytics.supplierCount]);
    csvRows.push(['Average Payment', `$${analytics.avgPayment.toLocaleString()}`]);
    csvRows.push(['Total Payments', analytics.paymentCount]);
    csvRows.push(['Concentration Risk', `${analytics.concentrationRisk.toFixed(1)}%`]);
    csvRows.push([]);

    csvRows.push(['Category Breakdown']);
    csvRows.push(['Category', 'Amount', 'Percentage', 'Suppliers', 'Payments']);
    Object.entries(analytics.categoryStats).forEach(([name, data]) => {
      const percentage = (data.amount / analytics.totalSpent) * 100;
      csvRows.push([
        name,
        `$${data.amount.toLocaleString()}`,
        `${percentage.toFixed(1)}%`,
        data.suppliers,
        data.count
      ]);
    });
    csvRows.push([]);

    csvRows.push(['Top Suppliers']);
    csvRows.push(['Rank', 'Name', 'Category', 'Total Amount', 'Payment Count']);
    analytics.topSuppliers.forEach((supplier, index) => {
      csvRows.push([
        index + 1,
        supplier.name,
        supplier.category,
        `$${supplier.totalAmount.toLocaleString()}`,
        supplier.paymentCount
      ]);
    });

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `protocol-bank-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Safe percentage calculation with bounds checking
  const safePercentage = (value, total) => {
    if (!total || total === 0) return 0;
    const percentage = (value / total) * 100;
    return Math.min(Math.max(percentage, 0), 100); // Clamp between 0-100
  };

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const categoryArray = Object.entries(analytics.categoryStats)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.amount - a.amount);

  const monthlyArray = Object.entries(analytics.monthlyData)
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Financial Analytics</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive analysis of payment data and supplier relationships
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
          <Button
            onClick={exportToCSV}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <Button
            onClick={() => generateAnalyticsPDF(analytics, categoryArray, monthlyArray)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <FileText className="w-4 h-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Spent</span>
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              ${analytics.totalSpent.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-green-600 dark:text-green-400">
              <TrendingUp className="w-4 h-4" />
              <span>12.5% vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Active Suppliers</span>
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {analytics.supplierCount}
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-4 h-4" />
              <span>8 new this month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Avg Payment</span>
              <Activity className="w-5 h-5 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              ${analytics.avgPayment.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-gray-600 dark:text-gray-400">
              <span>{analytics.paymentCount} transactions</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Concentration Risk</span>
              <AlertTriangle className={`w-5 h-5 ${analytics.concentrationRisk > 50 ? 'text-red-500' : 'text-yellow-500'}`} />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {analytics.concentrationRisk.toFixed(1)}%
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-gray-600 dark:text-gray-400">
              <span>Top 5 suppliers</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown */}
        <div className="lg:col-span-2">
          <Card className="border border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Spending by Category</h3>
                <PieChart className="w-5 h-5 text-gray-400" />
              </div>
              <div className="space-y-4">
                {categoryArray.map((category, index) => {
                  const percentage = safePercentage(category.amount, analytics.totalSpent);
                  const colors = [
                    'bg-blue-500', 'bg-red-500', 'bg-purple-500', 'bg-orange-500',
                    'bg-cyan-500', 'bg-pink-500', 'bg-green-500', 'bg-yellow-500',
                    'bg-indigo-500', 'bg-teal-500'
                  ];
                  const isSelected = selectedCategory?.name === category.name;
                  
                  return (
                    <div 
                      key={category.name}
                      className={`p-3 rounded-lg transition-all cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                        isSelected ? 'bg-gray-50 dark:bg-gray-800 ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setSelectedCategory(isSelected ? null : category)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{category.name}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          ${category.amount.toLocaleString()} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                        <div
                          className={`${colors[index % colors.length]} h-3 rounded-full transition-all duration-300 hover:opacity-80`}
                          style={{ width: `${percentage}%` }}
                          title={`${category.name}: $${category.amount.toLocaleString()} (${percentage.toFixed(1)}%)`}
                        />
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>{category.suppliers} suppliers</span>
                        <span>{category.count} payments</span>
                        {isSelected && (
                          <button 
                            className="ml-auto text-blue-600 dark:text-blue-400 hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCategory(null);
                            }}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      {isSelected && (
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="text-xs text-blue-900 dark:text-blue-300 space-y-1">
                            <p><strong>Average per supplier:</strong> ${(category.amount / category.suppliers).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                            <p><strong>Average per payment:</strong> ${(category.amount / category.count).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                            <p><strong>Share of total:</strong> {percentage.toFixed(2)}%</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Suppliers */}
        <div>
          <Card className="border border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Suppliers</h3>
                <Users className="w-5 h-5 text-gray-400" />
              </div>
              <div className="space-y-4">
                {analytics.topSuppliers.map((supplier, index) => (
                  <div key={supplier.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {supplier.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{supplier.category}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                          ${supplier.totalAmount.toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {supplier.paymentCount} payments
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Monthly Trend */}
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Monthly Spending Trend</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {monthlyArray.slice(-6).map((month) => {
              const maxAmount = Math.max(...monthlyArray.map(m => m.amount));
              const percentage = safePercentage(month.amount, maxAmount);
              const isSelected = selectedMonth?.month === month.month;
              
              return (
                <div 
                  key={month.month}
                  className={`p-3 rounded-lg transition-all cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    isSelected ? 'bg-gray-50 dark:bg-gray-800 ring-2 ring-purple-500' : ''
                  }`}
                  onClick={() => setSelectedMonth(isSelected ? null : month)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{month.month}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      ${month.amount.toLocaleString()} ({month.count} payments)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all duration-300 hover:opacity-80"
                      style={{ width: `${percentage}%` }}
                      title={`${month.month}: $${month.amount.toLocaleString()}`}
                    />
                  </div>
                  {isSelected && (
                    <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="text-xs text-purple-900 dark:text-purple-300 space-y-1">
                        <p><strong>Total spent:</strong> ${month.amount.toLocaleString()}</p>
                        <p><strong>Number of payments:</strong> {month.count}</p>
                        <p><strong>Average payment:</strong> ${(month.amount / month.count).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                        <p><strong>% of max month:</strong> {percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Payment Size Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Small Payments</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">&lt; $1,000</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {analytics.paymentsByAmount.small}
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {safePercentage(analytics.paymentsByAmount.small, analytics.paymentCount).toFixed(1)}% of total
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Medium Payments</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">$1K - $10K</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {analytics.paymentsByAmount.medium}
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {safePercentage(analytics.paymentsByAmount.medium, analytics.paymentCount).toFixed(1)}% of total
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Large Payments</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">&gt; $10K</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {analytics.paymentsByAmount.large}
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {safePercentage(analytics.paymentsByAmount.large, analytics.paymentCount).toFixed(1)}% of total
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Panel */}
      <Card className="border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900 dark:text-blue-300">
              <p className="font-medium mb-1">Interactive Analytics</p>
              <p className="text-xs">
                Click on any category or month bar to view detailed statistics. 
                Use the "Export CSV" button to download a comprehensive report of all analytics data.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

