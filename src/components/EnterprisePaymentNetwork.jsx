import { useState, useEffect, useRef } from 'react';
import { X, TrendingUp, TrendingDown, AlertTriangle, Calendar, DollarSign, Users, Activity } from 'lucide-react';

export default function EnterprisePaymentNetwork({ suppliers = [], payments = [] }) {
  const canvasRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [timeRange, setTimeRange] = useState({ start: 2024, end: 2025 });
  const [filteredData, setFilteredData] = useState({ suppliers: [], payments: [] });
  const [hoveredNode, setHoveredNode] = useState(null);
  const [categoryStats, setCategoryStats] = useState({});

  // 计算分类统计
  useEffect(() => {
    const stats = {};
    suppliers.forEach(supplier => {
      const category = supplier.category || 'Other';
      if (!stats[category]) {
        stats[category] = { count: 0, amount: 0 };
      }
      stats[category].count++;
      
      const supplierPayments = payments.filter(p => p.recipient === supplier.address);
      const totalAmount = supplierPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
      stats[category].amount += totalAmount;
    });
    setCategoryStats(stats);
  }, [suppliers, payments]);

  // 时间筛选
  useEffect(() => {
    const filtered = payments.filter(p => {
      const year = new Date(p.timestamp).getFullYear();
      return year >= timeRange.start && year <= timeRange.end;
    });
    
    const supplierAddresses = new Set(filtered.map(p => p.recipient));
    const filteredSuppliers = suppliers.filter(s => supplierAddresses.has(s.address));
    
    setFilteredData({ suppliers: filteredSuppliers, payments: filtered });
  }, [timeRange, suppliers, payments]);

  // Canvas 绘制
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth * 2;
    const height = canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);

    const centerX = width / 4;
    const centerY = height / 4;
    const radius = Math.min(width, height) / 5;

    // 清空画布
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width / 2, height / 2);

    // 绘制星空背景
    for (let i = 0; i < 200; i++) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.3})`;
      ctx.fillRect(Math.random() * width / 2, Math.random() * height / 2, 1, 1);
    }

    // 绘制连接线
    filteredData.suppliers.forEach((supplier, index) => {
      const angle = (index / filteredData.suppliers.length) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      const supplierPayments = filteredData.payments.filter(p => p.recipient === supplier.address);
      const totalAmount = supplierPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = `rgba(34, 211, 238, ${Math.min(totalAmount / 10, 0.8)})`;
      ctx.lineWidth = Math.max(totalAmount / 5, 1);
      ctx.stroke();
    });

    // 绘制中心节点
    ctx.beginPath();
    ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
    ctx.fillStyle = '#22d3ee';
    ctx.fill();
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Main', centerX, centerY - 30);
    ctx.fillText('Wallet', centerX, centerY - 18);

    // 绘制供应商节点
    filteredData.suppliers.forEach((supplier, index) => {
      const angle = (index / filteredData.suppliers.length) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      const isHovered = hoveredNode === supplier.address;
      const isSelected = selectedNode?.address === supplier.address;

      ctx.beginPath();
      ctx.arc(x, y, isHovered || isSelected ? 12 : 8, 0, Math.PI * 2);
      
      // 根据类别设置颜色
      const colors = {
        'Technology': '#3b82f6',
        'Cloud Services': '#8b5cf6',
        'Logistics': '#f59e0b',
        'Marketing': '#ec4899',
        'Design': '#10b981',
      };
      ctx.fillStyle = colors[supplier.category] || '#6b7280';
      ctx.fill();

      if (isHovered || isSelected) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // 绘制标签
      ctx.fillStyle = '#fff';
      ctx.font = isHovered || isSelected ? 'bold 11px sans-serif' : '10px sans-serif';
      ctx.textAlign = 'center';
      const name = supplier.name || supplier.brand || 'Unknown';
      ctx.fillText(name, x, y + 25);
    });

  }, [filteredData, hoveredNode, selectedNode]);

  // 计算供应商统计
  const getSupplierStats = (supplier) => {
    const supplierPayments = payments.filter(p => p.recipient === supplier.address);
    const totalAmount = supplierPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const avgAmount = supplierPayments.length > 0 ? totalAmount / supplierPayments.length : 0;
    const lastPayment = supplierPayments.sort((a, b) => b.timestamp - a.timestamp)[0];
    
    return {
      totalPayments: supplierPayments.length,
      totalAmount: totalAmount.toFixed(4),
      avgAmount: avgAmount.toFixed(4),
      lastPayment: lastPayment ? new Date(lastPayment.timestamp).toLocaleDateString() : 'N/A',
      trend: supplierPayments.length > 1 ? 'up' : 'stable',
    };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* 左侧: 可视化画布 */}
      <div className="lg:col-span-3">
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden">
          {/* 顶部控制栏 */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-light text-gray-900 dark:text-gray-100">
                Payment Network Graph
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {filteredData.suppliers.length} suppliers · {filteredData.payments.length} transactions
              </p>
            </div>

            {/* 时间轴控制 */}
            <div className="flex items-center gap-4">
              <Calendar className="w-4 h-4 text-gray-400" />
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="2020"
                  max="2025"
                  value={timeRange.start}
                  onChange={(e) => setTimeRange({ ...timeRange, start: parseInt(e.target.value) })}
                  className="w-32"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                  {timeRange.start} - {timeRange.end}
                </span>
              </div>
            </div>
          </div>

          {/* Canvas 画布 */}
          <div className="relative">
            <canvas
              ref={canvasRef}
              className="w-full h-[600px] cursor-crosshair"
              onMouseMove={(e) => {
                // 简化的悬停检测
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                // TODO: 实现精确的节点悬停检测
              }}
              onClick={() => {
                // TODO: 实现节点点击选择
              }}
            />
          </div>

          {/* 底部图例 */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">Main Wallet</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">Technology</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">Cloud Services</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">Logistics</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-pink-500"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">Marketing</span>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧: 信息面板 */}
      <div className="space-y-4">
        {/* 分类统计 */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            Categories
          </h4>
          <div className="space-y-2">
            {Object.entries(categoryStats).map(([category, stats]) => (
              <div key={category} className="flex items-center justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">{category}</span>
                <span className="text-gray-900 dark:text-gray-100 font-mono">
                  {stats.count} · {stats.amount.toFixed(2)} ETH
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 选中节点详情 */}
        {selectedNode && (
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {selectedNode.name || selectedNode.brand}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {selectedNode.category}
                </p>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {(() => {
              const stats = getSupplierStats(selectedNode);
              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Total Payments</span>
                    <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
                      {stats.totalPayments}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Total Amount</span>
                    <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
                      {stats.totalAmount} ETH
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Avg Payment</span>
                    <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
                      {stats.avgAmount} ETH
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Last Payment</span>
                    <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
                      {stats.lastPayment}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Trend</span>
                    <span className="flex items-center gap-1">
                      {stats.trend === 'up' ? (
                        <TrendingUp className="w-3 h-3 text-green-500" />
                      ) : (
                        <Activity className="w-3 h-3 text-gray-400" />
                      )}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* 关键指标 */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            Key Metrics
          </h4>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">Network Health</span>
                <span className="text-xs text-green-600 dark:text-green-400">Healthy</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: '85%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">Payment Velocity</span>
                <span className="text-xs text-blue-600 dark:text-blue-400">High</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: '72%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">Concentration Risk</span>
                <span className="text-xs text-yellow-600 dark:text-yellow-400">Medium</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-500" style={{ width: '45%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* 快速操作 */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            Quick Actions
          </h4>
          <div className="space-y-2">
            <button className="w-full px-3 py-2 text-xs text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors">
              Export Network Data
            </button>
            <button className="w-full px-3 py-2 text-xs text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors">
              Generate Report
            </button>
            <button className="w-full px-3 py-2 text-xs text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors">
              Schedule Analysis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

