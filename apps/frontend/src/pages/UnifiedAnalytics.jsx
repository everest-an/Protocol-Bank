import { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, Activity, 
  AlertTriangle, Calendar, PieChart, BarChart3, TestTube2,
  Download, FileText, Plus, Search, ExternalLink, Building2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { generateAnalyticsPDF } from '../utils/pdfExport.js';

export default function UnifiedAnalytics({ suppliers = [], payments = [], stats = null, testMode = false, mockData = null }) {
  const [activeTab, setActiveTab] = useState('overview'); // overview, suppliers, reports
  const [timeRange, setTimeRange] = useState('month');
  const [analytics, setAnalytics] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Use test data or real data
  const dataSuppliers = testMode && mockData ? mockData.suppliers : suppliers;
  let dataPayments = testMode && mockData ? mockData.payments : payments;
  
  // Apply date filtering
  if (startDate || endDate) {
    dataPayments = dataPayments.filter(payment => {
      const paymentDate = new Date(payment.timestamp);
      if (startDate && paymentDate < new Date(startDate)) return false;
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        if (paymentDate > endDateTime) return false;
      }
      return true;
    });
  }

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

    // Monthly data
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
      monthlyData,
      supplierCount: dataSuppliers.length,
      paymentCount: dataPayments.length,
      allSuppliers: supplierAmounts,
    });
  }, [dataSuppliers, dataPayments, testMode, mockData]);

  // Export to CSV
  const exportToCSV = () => {
    if (!analytics) return;

    const csvRows = [];
    csvRows.push(['Protocol Bank - Analytics Report']);
    csvRows.push(['Generated:', new Date().toLocaleString()]);
    csvRows.push([]);
    csvRows.push(['Total Spent', `$${analytics.totalSpent.toFixed(2)}`]);
    csvRows.push(['Total Suppliers', analytics.supplierCount]);
    csvRows.push(['Total Payments', analytics.paymentCount]);
    csvRows.push([]);
    csvRows.push(['Top Suppliers']);
    csvRows.push(['Name', 'Category', 'Total Amount', 'Payment Count']);
    analytics.topSuppliers.forEach(s => {
      csvRows.push([s.name, s.category, `$${s.totalAmount.toFixed(2)}`, s.paymentCount]);
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

  // Filter suppliers for Suppliers tab
  const filteredSuppliers = analytics.allSuppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (supplier.address && (supplier.address && supplier.address.toLowerCase()).includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || supplier.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...new Set(analytics.allSuppliers.map(s => s.category))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics & Suppliers</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive financial analysis and supplier management
          </p>
        </div>
        <div className="flex items-center gap-3">
          {testMode && (
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="flex items-center gap-2 text-purple-600 border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
            >
              <TestTube2 className="w-4 h-4" />
              Exit Test Mode
            </Button>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="From"
              className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-500">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="To"
              className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Clear
              </button>
            )}
          </div>
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

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </div>
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'suppliers'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Suppliers
            </div>
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'reports'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Reports
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab analytics={analytics} categoryArray={categoryArray} monthlyArray={monthlyArray} />
      )}
      
      {activeTab === 'suppliers' && (
        <SuppliersTab 
          suppliers={filteredSuppliers}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={categories}
          analytics={analytics}
        />
      )}
      
      {activeTab === 'reports' && (
        <ReportsTab analytics={analytics} categoryArray={categoryArray} monthlyArray={monthlyArray} />
      )}
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ analytics, categoryArray, monthlyArray }) {
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Spent</span>
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              Ξ {analytics.totalSpent.toFixed(4)}
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
              <span>3 new this month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Payments</span>
              <Activity className="w-5 h-5 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {analytics.paymentCount}
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-purple-600 dark:text-purple-400">
              <TrendingUp className="w-4 h-4" />
              <span>8.2% increase</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Avg Payment</span>
              <TrendingUp className="w-5 h-5 text-orange-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              Ξ {analytics.avgPayment.toFixed(4)}
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-gray-600 dark:text-gray-400">
              <span>Per transaction</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Suppliers */}
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Suppliers by Payment Volume</h3>
          <div className="space-y-3">
            {analytics.topSuppliers.slice(0, 5).map((supplier, index) => (
              <div key={supplier.address} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">#{index + 1}</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{supplier.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{supplier.category}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900 dark:text-white">Ξ {supplier.totalAmount.toFixed(4)}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{supplier.paymentCount} payments</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trend */}
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Payment Trend</h3>
          <div className="space-y-3">
            {monthlyArray.slice(-6).map((month) => (
              <div key={month.month} className="flex items-center gap-4">
                <div className="w-24 text-sm text-gray-600 dark:text-gray-400">{month.month}</div>
                <div className="flex-1">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${(month.amount / Math.max(...monthlyArray.map(m => m.amount))) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="w-32 text-right">
                  <div className="font-semibold text-gray-900 dark:text-white">Ξ {month.amount.toFixed(2)}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{month.count} txns</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Suppliers Tab Component
function SuppliersTab({ suppliers, searchTerm, setSearchTerm, selectedCategory, setSelectedCategory, categories, analytics }) {
  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'All Categories' : cat}
            </option>
          ))}
        </select>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map((supplier) => (
          <Card key={supplier.address} className="border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{supplier.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{supplier.category}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Total Paid</span>
                  <span className="font-semibold text-gray-900 dark:text-white">Ξ {supplier.totalAmount.toFixed(4)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Payments</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{supplier.paymentCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Address</span>
                  <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                    {supplier.address ? `${supplier.address.slice(0, 6)}...${supplier.address.slice(-4)}` : supplier.id ? `${supplier.id.slice(0, 6)}...${supplier.id.slice(-4)}` : 'N/A'}
                  </span>
                </div>
              </div>

              <Button variant="outline" className="w-full text-sm">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {suppliers.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No suppliers found</p>
        </div>
      )}
    </div>
  );
}

// Reports Tab Component  
function ReportsTab({ analytics, categoryArray, monthlyArray }) {
  const getPercentage = (value, total) => {
    if (total === 0) return 0;
    const percentage = (value / total) * 100;
    return Math.min(Math.max(percentage, 0), 100);
  };

  return (
    <div className="space-y-6">
      {/* Category Breakdown */}
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Spending by Category</h3>
          <div className="space-y-4">
            {categoryArray.map((category) => (
              <div key={category.name}>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{category.name}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Ξ {category.amount.toFixed(2)} ({category.count} payments)
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${getPercentage(category.amount, analytics.totalSpent)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cash Flow Trend */}
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Cash Flow Trend</h3>
          <div className="h-64 flex items-end justify-between gap-2">
            {monthlyArray.map((month, index) => {
              const maxAmount = Math.max(...monthlyArray.map(m => m.amount));
              const height = maxAmount > 0 ? (month.amount / maxAmount) * 100 : 0;
              const prevAmount = index > 0 ? monthlyArray[index - 1].amount : month.amount;
              const trend = month.amount > prevAmount ? 'up' : month.amount < prevAmount ? 'down' : 'stable';
              
              return (
                <div key={month.month} className="flex-1 flex flex-col items-center group">
                  <div className="relative w-full">
                    <div
                      className={`w-full rounded-t-lg transition-all duration-300 group-hover:opacity-80 ${
                        trend === 'up' ? 'bg-green-500' : trend === 'down' ? 'bg-red-500' : 'bg-blue-500'
                      }`}
                      style={{ height: `${height}%`, minHeight: '4px' }}
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs px-2 py-1 rounded whitespace-nowrap">
                        Ξ {month.amount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-2 transform -rotate-45 origin-top-left">
                    {month.month.slice(5)}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">Increase</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">Decrease</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">Stable</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Analysis Table */}
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Detailed Monthly Analysis</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Month</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Total Spent</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Payments</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Avg Payment</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Change</th>
                </tr>
              </thead>
              <tbody>
                {monthlyArray.map((month, index) => {
                  const prevAmount = index > 0 ? monthlyArray[index - 1].amount : 0;
                  const change = prevAmount > 0 ? ((month.amount - prevAmount) / prevAmount) * 100 : 0;
                  const isIncrease = change > 0;
                  
                  return (
                    <tr key={month.month} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white font-medium">{month.month}</td>
                      <td className="py-3 px-4 text-sm text-right font-semibold text-gray-900 dark:text-white">
                        Ξ {month.amount.toFixed(4)}
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-gray-600 dark:text-gray-400">{month.count}</td>
                      <td className="py-3 px-4 text-sm text-right text-gray-600 dark:text-gray-400">
                        Ξ {(month.amount / month.count).toFixed(4)}
                      </td>
                      <td className="py-3 px-4 text-sm text-right">
                        {index > 0 ? (
                          <span className={`flex items-center justify-end gap-1 ${
                            isIncrease ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {isIncrease ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            {Math.abs(change).toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Categories</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{categoryArray.length}</div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Largest Payment</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              Ξ {Math.max(...monthlyArray.map(m => m.amount)).toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Months</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{monthlyArray.length}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
