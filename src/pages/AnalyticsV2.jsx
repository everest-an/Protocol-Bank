import { useState, useMemo, useEffect } from 'react';
import { BarChart3, PieChart, TrendingUp, DollarSign, Users, Calendar, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import { generateFullMockData } from '@/utils/mockData';
import { getAnalyticsData } from '@/services/contractReader';
import { getEtherscanLink } from '@/services/etherscan';
import { STREAM_PAYMENT_CONTRACT } from '@/config/contracts';

export default function AnalyticsV2() {
  const [timeRange, setTimeRange] = useState('30d');
  const [dataMode, setDataMode] = useState('test'); // 'test' or 'real'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [realData, setRealData] = useState(null);
  const { formatEthWithFiat } = useCurrency();
  
  // 使用测试数据
  const mockData = useMemo(() => generateFullMockData(), []);
  
  // 根据模式选择数据源
  const currentData = dataMode === 'test' ? mockData : realData;
  const { suppliers = [], payments = [], stats = {} } = currentData || {};

  // 加载真实数据
  const loadRealData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getAnalyticsData();
      setRealData(data);
      setDataMode('real');
    } catch (err) {
      console.error('Failed to load real data:', err);
      setError(err.message || 'Failed to load real data');
      setDataMode('test'); // 回退到Test Mode
    } finally {
      setIsLoading(false);
    }
  };

  // 切换数据模式
  const toggleDataMode = () => {
    if (dataMode === 'test') {
      loadRealData();
    } else {
      setDataMode('test');
    }
  };

  // 按Category统计
  const categoryStats = useMemo(() => {
    if (!payments || payments.length === 0) return [];
    
    const categoryMap = new Map();
    
    payments
      .filter(p => p.status === 'Completed')
      .forEach(p => {
        const current = categoryMap.get(p.category) || { amount: 0, count: 0 };
        const amount = typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount;
        categoryMap.set(p.category, {
          amount: current.amount + amount,
          count: current.count + 1,
        });
      });

    const totalAmount = stats.totalAmount || 0;
    
    return Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        count: data.count,
        percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [payments, stats]);

  // 按时间统计
  const timeSeriesData = useMemo(() => {
    if (!payments || payments.length === 0) return [];
    
    const grouped = new Map();
    
    payments
      .filter(p => p.status === 'Completed')
      .forEach(p => {
        const timestamp = p.timestamp instanceof Date ? p.timestamp : new Date(p.timestamp);
        const date = timestamp.toISOString().split('T')[0];
        const amount = typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount;
        grouped.set(date, (grouped.get(date) || 0) + amount);
      });

    return Array.from(grouped.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30); // Last 30 days
  }, [payments]);

  // Top供应商
  const topSuppliers = useMemo(() => {
    if (!suppliers || suppliers.length === 0) return [];
    
    return suppliers
      .map(s => ({
        ...s,
        totalAmount: typeof s.totalReceived === 'string' ? parseFloat(s.totalReceived) : (s.totalAmount || s.totalReceived || 0),
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);
  }, [suppliers]);

  const categoryColors = [
    'from-cyan-500 to-blue-500',
    'from-green-500 to-emerald-500',
    'from-purple-500 to-pink-500',
    'from-orange-500 to-red-500',
    'from-yellow-500 to-amber-500',
    'from-indigo-500 to-violet-500',
    'from-rose-500 to-pink-500',
    'from-teal-500 to-cyan-500',
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header with Mode Toggle */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent">
                Analytics
              </h1>
              <p className="text-gray-600 mt-2">Multi-dimensional payment flow analysis and visualization</p>
            </div>
            
            {/* Data Mode Toggle */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleDataMode}
                disabled={isLoading}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                  dataMode === 'test'
                    ? 'bg-purple-500/20 border-2 border-purple-500 text-purple-400 hover:bg-purple-500/30'
                    : 'bg-green-500/20 border-2 border-green-500 text-green-400 hover:bg-green-500/30'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <div className={`w-3 h-3 rounded-full ${dataMode === 'test' ? 'bg-purple-500' : 'bg-green-500'} animate-pulse`} />
                )}
                <span>{dataMode === 'test' ? 'Test Mode' : 'Real Mode'}</span>
              </button>
              
              {dataMode === 'real' && (
                <button
                  onClick={loadRealData}
                  disabled={isLoading}
                  className="p-3 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 transition-colors disabled:opacity-50"
                  title="Refresh Data"
                >
                  <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>
          </div>
          
          {/* Mode Description */}
          <div className={`mt-4 p-4 rounded-lg border ${
            dataMode === 'test'
              ? 'bg-purple-50 border-purple-200'
              : 'bg-green-50 border-green-200'
          }`}>
            <div className="flex items-start gap-3">
              <AlertCircle className={`w-5 h-5 mt-0.5 ${dataMode === 'test' ? 'text-purple-400' : 'text-green-400'}`} />
              <div>
                <p className={`font-semibold ${dataMode === 'test' ? 'text-purple-400' : 'text-green-400'}`}>
                  {dataMode === 'test' ? 'Test Mode已启用' : 'Real Mode已启用'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {dataMode === 'test'
                    ? `Currently displaying mock data with ${payments.length}  payment records and ${suppliers.length}  suppliers for demonstration purposes.`
                    : `Currently displaying real on-chain data from Sepolia testnet. All transactions can be verified on Etherscan.`
                  }
                </p>
              </div>
            </div>
          </div>
          
          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 rounded-lg border bg-red-50 border-red-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 mt-0.5 text-red-400" />
                <div>
                  <p className="font-semibold text-red-400">Loading Failed</p>
                  <p className="text-sm text-gray-600 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Time Range Selection */}
        <div className="flex gap-2 mb-6">
          {['7d', '30d', '90d', 'all'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                timeRange === range
                  ? 'bg-cyan-500 text-gray-900'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {range === 'all' ? 'All' : range.toUpperCase()}
            </button>
          ))}
        </div>

        {/* 关键指标 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-cyan-400" />
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {(stats.totalAmount || 0).toFixed(2)} ETH
            </div>
            <div className="text-sm text-gray-700">Total Payment Amount</div>
            <div className="text-xs text-cyan-400 mt-2">
              {formatEthWithFiat((stats.totalAmount || 0).toString()).fiat}
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-8 h-8 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {stats.totalPayments || 0}
            </div>
            <div className="text-sm text-gray-700">Total Payments</div>
            <div className="text-xs text-green-400 mt-2">
              Average {(stats.averagePayment || 0).toFixed(4)} ETH/tx
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-purple-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {stats.supplierCount || 0}
            </div>
            <div className="text-sm text-gray-700">Active Suppliers</div>
            <div className="text-xs text-purple-400 mt-2">
              {categoryStats.length}  Categories
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-8 h-8 text-orange-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {timeSeriesData.length}
            </div>
            <div className="text-sm text-gray-700">Active Days</div>
            <div className="text-xs text-orange-400 mt-2">
              Last 30 days
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Distribution by Category */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <PieChart className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold">Distribution by Category</h2>
            </div>

            <div className="space-y-4">
              {categoryStats.length > 0 ? (
                categoryStats.map((stat, index) => (
                  <div key={stat.category}>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-700">{stat.category}</span>
                      <span className="text-gray-900 font-semibold">
                        {stat.amount.toFixed(4)} ETH ({stat.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="relative h-2 bg-white border border-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`absolute inset-y-0 left-0 bg-gradient-to-r ${
                          categoryColors[index % categoryColors.length]
                        } rounded-full transition-all`}
                        style={{ width: `${stat.percentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {stat.count} tx支付
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">暂无数据</div>
              )}
            </div>
          </div>

          {/* Top 供应商 */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <h2 className="text-lg font-bold">Top 10 Suppliers</h2>
            </div>

            <div className="space-y-3">
              {topSuppliers.length > 0 ? (
                topSuppliers.map((supplier, index) => (
                  <div
                    key={supplier.id || supplier.wallet}
                    className="flex items-center gap-3 p-3 bg-white border border-gray-200/50 rounded-lg hover:bg-white border border-gray-200 transition-colors group"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-cyan-500 to-green-500 rounded-full flex items-center justify-center text-gray-900 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-gray-900 font-semibold truncate">
                          {supplier.brand || supplier.name || 'Unknown'}
                        </div>
                        {dataMode === 'real' && supplier.etherscanLink && (
                          <a
                            href={supplier.etherscanLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <ExternalLink className="w-4 h-4 text-cyan-400 hover:text-cyan-300" />
                          </a>
                        )}
                      </div>
                      <div className="text-xs text-gray-600">
                        {supplier.category} · {supplier.paymentCount} tx
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-900 font-semibold">
                        {supplier.totalAmount.toFixed(4)} ETH
                      </div>
                      <div className="text-xs text-green-400">
                        {(supplier.profitMargin || 0).toFixed(1)}% 利润率
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">暂无数据</div>
              )}
            </div>
          </div>
        </div>

        {/* 时间序列图 */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold">支付趋势 (Last 30 days)</h2>
          </div>

          {timeSeriesData.length > 0 ? (
            <div className="h-64 flex items-end gap-1">
              {timeSeriesData.map((data, index) => {
                const maxAmount = Math.max(...timeSeriesData.map(d => d.amount));
                const height = maxAmount > 0 ? (data.amount / maxAmount) * 100 : 0;
                
                return (
                  <div key={data.date} className="flex-1 flex flex-col items-center group">
                    <div className="relative w-full">
                      <div
                        className="w-full bg-gradient-to-t from-cyan-500 to-green-500 rounded-t transition-all group-hover:from-cyan-400 group-hover:to-green-400"
                        style={{ height: `${height * 2}px`, minHeight: '2px' }}
                      />
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 px-2 py-1 rounded text-xs text-gray-900 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        {data.amount.toFixed(4)} ETH
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-2 transform rotate-45 origin-top-left">
                      {new Date(data.date).getDate()}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              暂无数据
            </div>
          )}
        </div>

        {/* Real Mode Footer */}
        {dataMode === 'real' && (
          <div className="mt-6 p-4 bg-gray-900 border border-gray-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                数据来源: Sepolia 测试网 · 合约地址: {STREAM_PAYMENT_CONTRACT.address.slice(0, 6)}...{STREAM_PAYMENT_CONTRACT.address.slice(-4)}
              </div>
              <a
                href={getEtherscanLink('address', STREAM_PAYMENT_CONTRACT.address)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <span className="text-sm">在 Etherscan 上查看</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
