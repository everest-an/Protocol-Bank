import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, PieChart, Download, Calendar, DollarSign } from 'lucide-react';

const DataAnalytics = () => {
  const [timeRange, setTimeRange] = useState('month'); // day, week, month, year
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [analyticsData, setAnalyticsData] = useState(null);

  // 模拟数据生成
  useEffect(() => {
    generateMockAnalytics();
  }, [timeRange, selectedCategory]);

  const generateMockAnalytics = () => {
    const categories = ['Technology', 'Marketing', 'Cloud Services', 'Logistics', 'Design', 'Consulting'];
    
    // 生成时间序列数据
    const timeSeriesData = generateTimeSeriesData(timeRange);
    
    // 生成分类分布数据
    const categoryDistribution = categories.map(cat => ({
      category: cat,
      amount: Math.random() * 50000 + 10000,
      count: Math.floor(Math.random() * 50) + 10,
      percentage: 0
    }));
    
    const totalAmount = categoryDistribution.reduce((sum, item) => sum + item.amount, 0);
    categoryDistribution.forEach(item => {
      item.percentage = ((item.amount / totalAmount) * 100).toFixed(1);
    });
    
    // 生成供应商排行
    const topSuppliers = Array.from({ length: 10 }, (_, i) => ({
      name: `Supplier ${i + 1}`,
      amount: Math.random() * 30000 + 5000,
      transactions: Math.floor(Math.random() * 30) + 5,
      category: categories[Math.floor(Math.random() * categories.length)]
    })).sort((a, b) => b.amount - a.amount);

    setAnalyticsData({
      timeSeriesData,
      categoryDistribution,
      topSuppliers,
      summary: {
        totalAmount: totalAmount,
        totalTransactions: categoryDistribution.reduce((sum, item) => sum + item.count, 0),
        averageTransaction: totalAmount / categoryDistribution.reduce((sum, item) => sum + item.count, 0),
        topCategory: categoryDistribution.sort((a, b) => b.amount - a.amount)[0].category
      }
    });
  };

  const generateTimeSeriesData = (range) => {
    const dataPoints = range === 'day' ? 24 : range === 'week' ? 7 : range === 'month' ? 30 : 12;
    return Array.from({ length: dataPoints }, (_, i) => ({
      label: range === 'day' ? `${i}:00` : 
             range === 'week' ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i] :
             range === 'month' ? `Day ${i + 1}` :
             ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
      amount: Math.random() * 5000 + 1000,
      transactions: Math.floor(Math.random() * 20) + 5
    }));
  };

  const handleExportData = (format) => {
    console.log(`Exporting data as ${format}`);
    // TODO: Implement actual export functionality
    alert(`Export as ${format} - Coming soon!`);
  };

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Data Analytics
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Comprehensive payment data analysis and insights
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-4 mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange('day')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timeRange === 'day'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Day
          </button>
          <button
            onClick={() => setTimeRange('week')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timeRange === 'week'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timeRange === 'month'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setTimeRange('year')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timeRange === 'year'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Year
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleExportData('CSV')}
            className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center gap-2"
          >
            <Download size={18} />
            Export CSV
          </button>
          <button
            onClick={() => handleExportData('PDF')}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors flex items-center gap-2"
          >
            <Download size={18} />
            Export PDF
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Amount</h3>
            <DollarSign className="text-blue-500" size={24} />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            ${analyticsData.summary.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-green-500 mt-2">+12.5% from last period</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Transactions</h3>
            <TrendingUp className="text-green-500" size={24} />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {analyticsData.summary.totalTransactions}
          </p>
          <p className="text-sm text-green-500 mt-2">+8.3% from last period</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Transaction</h3>
            <BarChart3 className="text-purple-500" size={24} />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            ${analyticsData.summary.averageTransaction.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-green-500 mt-2">+3.7% from last period</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Top Category</h3>
            <PieChart className="text-orange-500" size={24} />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {analyticsData.summary.topCategory}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Highest spending</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Payment Trend Chart */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Payment Trend</h2>
          <div className="h-64 flex items-end justify-between gap-2">
            {analyticsData.timeSeriesData.map((data, index) => {
              const maxAmount = Math.max(...analyticsData.timeSeriesData.map(d => d.amount));
              const height = (data.amount / maxAmount) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-blue-500 rounded-t-lg hover:bg-blue-600 transition-colors cursor-pointer relative group"
                       style={{ height: `${height}%` }}>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                      ${data.amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">{data.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Category Distribution</h2>
          <div className="space-y-4">
            {analyticsData.categoryDistribution.map((cat, index) => {
              const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-cyan-500'];
              return (
                <div key={index}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{cat.category}</span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{cat.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className={`${colors[index % colors.length]} h-2 rounded-full`} style={{ width: `${cat.percentage}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    ${cat.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} • {cat.count} transactions
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Suppliers Table */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Top Suppliers</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Rank</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Supplier</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Category</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Amount</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Transactions</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Payment</th>
              </tr>
            </thead>
            <tbody>
              {analyticsData.topSuppliers.map((supplier, index) => (
                <tr key={index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                      index === 0 ? 'bg-yellow-100 text-yellow-600' :
                      index === 1 ? 'bg-gray-100 text-gray-600' :
                      index === 2 ? 'bg-orange-100 text-orange-600' :
                      'bg-blue-100 text-blue-600'
                    } font-bold text-sm`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{supplier.name}</td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                      {supplier.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-gray-900 dark:text-white">
                    ${supplier.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">{supplier.transactions}</td>
                  <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">
                    ${(supplier.amount / supplier.transactions).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>Data updated in real-time • Last refresh: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
};

export default DataAnalytics;

