import { useState, useMemo } from 'react';
import { BarChart3, PieChart, TrendingUp, DollarSign, Users, Calendar } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import { generateFullMockData } from '@/utils/mockData';

export default function Analytics() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const { formatEthWithFiat } = useCurrency();
  
  // 使用测试数据
  const mockData = useMemo(() => generateFullMockData(), []);
  const { suppliers, payments, stats } = mockData;

  // 按Category统计
  const categoryStats = useMemo(() => {
    const stats = new Map<string, { amount: number; count: number }>();
    
    payments
      .filter(p => p.status === 'Completed')
      .forEach(p => {
        const current = stats.get(p.category) || { amount: 0, count: 0 };
        stats.set(p.category, {
          amount: current.amount + p.amount,
          count: current.count + 1,
        });
      });

    return Array.from(stats.entries())
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        count: data.count,
        percentage: (data.amount / stats.totalAmount) * 100,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [payments, stats]);

  // 按时间统计
  const timeSeriesData = useMemo(() => {
    const grouped = new Map<string, number>();
    
    payments
      .filter(p => p.status === 'Completed')
      .forEach(p => {
        const date = p.timestamp.toISOString().split('T')[0];
        grouped.set(date, (grouped.get(date) || 0) + p.amount);
      });

    return Array.from(grouped.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30); // 最近30天
  }, [payments]);

  // Top供应商
  const topSuppliers = useMemo(() => {
    return suppliers
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
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent">
            数据分析
          </h1>
          <p className="text-gray-400 mt-2">多维度资金流分析和可视化</p>
        </div>

        {/* Time Range Selection */}
        <div className="flex gap-2 mb-6">
          {(['7d', '30d', '90d', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                timeRange === range
                  ? 'bg-cyan-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {range === 'all' ? '全部' : range.toUpperCase()}
            </button>
          ))}
        </div>

        {/* 关键指标 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-cyan-400" />
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {stats.totalAmount.toFixed(2)} ETH
            </div>
            <div className="text-sm text-gray-300">总Payment Amount</div>
            <div className="text-xs text-cyan-400 mt-2">
              {formatEthWithFiat(stats.totalAmount.toString()).fiat}
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-8 h-8 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {stats.totalPayments}
            </div>
            <div className="text-sm text-gray-300">总支付笔数</div>
            <div className="text-xs text-green-400 mt-2">
              平均 {stats.averagePayment.toFixed(4)} ETH/笔
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-purple-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {stats.supplierCount}
            </div>
            <div className="text-sm text-gray-300">活跃供应商</div>
            <div className="text-xs text-purple-400 mt-2">
              {categoryStats.length} 个Category
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-8 h-8 text-orange-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {timeSeriesData.length}
            </div>
            <div className="text-sm text-gray-300">活跃天数</div>
            <div className="text-xs text-orange-400 mt-2">
              最近30天
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 按Category分布 */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <PieChart className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold">按Category分布</h2>
            </div>

            <div className="space-y-4">
              {categoryStats.map((stat, index) => (
                <div key={stat.category}>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-300">{stat.category}</span>
                    <span className="text-white font-semibold">
                      {stat.amount.toFixed(4)} ETH ({stat.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`absolute inset-y-0 left-0 bg-gradient-to-r ${
                        categoryColors[index % categoryColors.length]
                      } rounded-full transition-all`}
                      style={{ width: `${stat.percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {stat.count} 笔支付
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top 供应商 */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <h2 className="text-lg font-bold">Top 10 供应商</h2>
            </div>

            <div className="space-y-3">
              {topSuppliers.map((supplier, index) => (
                <div
                  key={supplier.id}
                  className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-cyan-500 to-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-semibold truncate">
                      {supplier.brand}
                    </div>
                    <div className="text-xs text-gray-400">
                      {supplier.category} · {supplier.paymentCount} 笔
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-semibold">
                      {supplier.totalAmount.toFixed(4)} ETH
                    </div>
                    <div className="text-xs text-green-400">
                      {supplier.profitMargin.toFixed(1)}% 利润率
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 时间序列图 */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold">支付趋势 (最近30天)</h2>
          </div>

          <div className="h-64 flex items-end gap-1">
            {timeSeriesData.map((data, index) => {
              const maxAmount = Math.max(...timeSeriesData.map(d => d.amount));
              const height = (data.amount / maxAmount) * 100;
              
              return (
                <div key={data.date} className="flex-1 flex flex-col items-center group">
                  <div className="relative w-full">
                    <div
                      className="w-full bg-gradient-to-t from-cyan-500 to-green-500 rounded-t transition-all group-hover:from-cyan-400 group-hover:to-green-400"
                      style={{ height: `${height * 2}px` }}
                    />
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 px-2 py-1 rounded text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
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
        </div>
      </div>
    </div>
  );
}

