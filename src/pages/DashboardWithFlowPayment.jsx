import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Users, BarChart3, Play, Pause, RotateCcw, TestTube2 } from 'lucide-react';
import PaymentNetworkGraph from '../components/payment-visualization/PaymentNetworkGraph';
import { generateFullMockData, generateNetworkGraphData } from '../utils/mockData';

export default function DashboardWithFlowPayment() {
  const [testMode, setTestMode] = useState(true); // Always in test mode for dashboard
  const [mockData, setMockData] = useState(null);
  const [stats, setStats] = useState({
    totalPayments: 0,
    totalAmount: '0',
    supplierCount: 0,
    averagePayment: '0',
  });
  const [suppliers, setSuppliers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Initialize mock data
  useEffect(() => {
    const data = generateFullMockData();
    setMockData(data);
    
    // Calculate statistics
    const totalPayments = data.payments.length;
    const totalAmount = data.payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const supplierCount = data.suppliers.length;
    const averagePayment = totalPayments > 0 ? totalAmount / totalPayments : 0;

    setStats({
      totalPayments,
      totalAmount: totalAmount.toFixed(4),
      supplierCount,
      averagePayment: averagePayment.toFixed(4),
    });

    setSuppliers(data.suppliers);
    setPayments(data.payments);
  }, []);

  // Auto-play demo
  useEffect(() => {
    if (!autoPlayEnabled) return;

    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % 8);
    }, 3000);

    return () => clearInterval(timer);
  }, [autoPlayEnabled]);

  const handlePlayPause = () => {
    setAutoPlayEnabled(!autoPlayEnabled);
  };

  const handleReset = () => {
    setAutoPlayEnabled(false);
    setCurrentStep(0);
  };

  // Get unique categories
  const categories = ['All', ...new Set(payments.map(p => p.category))];

  // Filter payments by category
  const filteredPayments = selectedCategory === 'All' 
    ? payments 
    : payments.filter(p => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Protocol Bank Dashboard
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Enterprise Payment Network Visualization
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-950 px-3 py-2 rounded-lg">
                <TestTube2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                  Demo Mode
                </span>
              </div>
              <button
                onClick={handlePlayPause}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors"
              >
                {autoPlayEnabled ? (
                  <><Pause className="w-4 h-4 inline mr-2" />Pause</>
                ) : (
                  <><Play className="w-4 h-4 inline mr-2" />Play Demo</>
                )}
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4 inline mr-2" />
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Payments</div>
                  <div className="text-3xl font-semibold text-gray-900 dark:text-white">
                    {stats.totalPayments}
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Amount</div>
                  <div className="text-3xl font-semibold text-gray-900 dark:text-white">
                    ≈ {stats.totalAmount}
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-50 dark:bg-green-950 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Suppliers</div>
                  <div className="text-3xl font-semibold text-gray-900 dark:text-white">
                    {stats.supplierCount}
                  </div>
                </div>
                <div className="w-12 h-12 bg-purple-50 dark:bg-purple-950 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Average Payment</div>
                  <div className="text-3xl font-semibold text-gray-900 dark:text-white">
                    ≈ {stats.averagePayment}
                  </div>
                </div>
                <div className="w-12 h-12 bg-orange-50 dark:bg-orange-950 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Network Visualization */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Payment Network
              </h2>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                💡 Drag to pan • Scroll to zoom • Click nodes for details
              </div>
            </div>
            {suppliers.length > 0 ? (
              <PaymentNetworkGraph
                mainWallet="0x1234567890123456789012345678901234567890"
                suppliers={suppliers}
                payments={payments}
              />
            ) : (
              <div className="flex items-center justify-center h-[500px] bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="text-center">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">Loading payment network...</p>
                </div>
              </div>
            )}
          </div>

          {/* Payment Transactions */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Payment Transactions
              </h2>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {filteredPayments.length} transactions
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex items-center space-x-2 mb-4 overflow-x-auto pb-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Transactions Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                      DATE
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                      SUPPLIER
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                      CATEGORY
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                      AMOUNT
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                      STATUS
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                      TX HASH
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.slice(0, 10).map((payment, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                        {new Date(payment.timestamp * 1000).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-900 dark:text-white font-medium">
                          {payment.supplierName || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {payment.to?.slice(0, 6)}...{payment.to?.slice(-4)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                          {payment.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-gray-900 dark:text-white font-medium">
                        {parseFloat(payment.amount).toFixed(4)} ETH
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
                          {payment.status || 'Completed'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <a
                          href={`https://sepolia.etherscan.io/tx/${payment.txHash || '0x'}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                        >
                          View
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredPayments.length > 10 && (
              <div className="mt-4 text-center">
                <button className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition-colors">
                  Load More
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

