import React, { useState, useEffect } from 'react';
import { Search, Filter, TestTube2, Info, X } from 'lucide-react';
import PaymentUniverse from '../components/PaymentUniverse';
import { 
  generateEnterpriseData, 
  getCategoryStats, 
  getTopSuppliers,
  searchSuppliers,
  filterByCategory,
  filterByAmountRange
} from '../utils/enterpriseMockData';

export default function FlowPaymentVisualizationV2() {
  const [testMode, setTestMode] = useState(true);
  const [rawData, setRawData] = useState(null);
  const [filteredData, setFilteredData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [amountRange, setAmountRange] = useState({ min: 0, max: 1000000 });
  const [showInfo, setShowInfo] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [supplierCount, setSupplierCount] = useState(300);

  // Generate data
  useEffect(() => {
    if (testMode) {
      const data = generateEnterpriseData(supplierCount);
      setRawData(data);
      setFilteredData(data);
    }
  }, [testMode, supplierCount]);

  // Apply filters
  useEffect(() => {
    if (!rawData) return;

    let result = { ...rawData };

    // Category filter
    if (selectedCategory !== 'all') {
      result = filterByCategory(result.nodes, result.links, selectedCategory);
    }

    // Amount range filter
    result = filterByAmountRange(result.nodes, result.links, amountRange.min, amountRange.max);

    // Search filter
    if (searchQuery) {
      const searchResults = searchSuppliers(result.nodes, searchQuery);
      const nodeIds = new Set(searchResults.map(n => n.id));
      nodeIds.add('company'); // Always include company node
      
      result.nodes = result.nodes.filter(n => nodeIds.has(n.id));
      result.links = result.links.filter(l => 
        nodeIds.has(l.source.id || l.source) && 
        nodeIds.has(l.target.id || l.target)
      );
    }

    setFilteredData(result);
  }, [rawData, selectedCategory, amountRange, searchQuery]);

  // Calculate statistics
  const stats = rawData ? {
    totalSuppliers: rawData.nodes.filter(n => n.type === 'supplier').length,
    totalAmount: rawData.nodes
      .filter(n => n.type === 'supplier')
      .reduce((sum, n) => sum + n.amount, 0),
    totalTransactions: rawData.nodes
      .filter(n => n.type === 'supplier')
      .reduce((sum, n) => sum + n.transactions, 0),
    categories: getCategoryStats(rawData.nodes),
    topSuppliers: getTopSuppliers(rawData.nodes, 10)
  } : null;

  const handleNodeClick = (node) => {
    setSelectedNode(node);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top Bar */}
      <div className="border-b border-gray-800 bg-black/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Payment Universe</h1>
              <p className="text-sm text-gray-400">Enterprise payment flow visualization</p>
            </div>

            <div className="flex items-center gap-3">
              {/* Test Mode Toggle */}
              <button
                onClick={() => setTestMode(!testMode)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  testMode
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <TestTube2 size={18} />
                {testMode ? 'Test Mode' : 'Live Mode'}
              </button>

              {/* Info Button */}
              <button
                onClick={() => setShowInfo(!showInfo)}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <Info size={18} />
                Info
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Left: Visualization */}
        <div className="flex-1 relative">
          {/* Search and Filters */}
          <div className="absolute top-4 left-4 z-10 space-y-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search suppliers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 w-64"
              />
            </div>

            {/* Supplier Count Slider */}
            {testMode && (
              <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg p-3 w-64">
                <label className="text-sm text-gray-300 mb-2 block">
                  Suppliers: {supplierCount}
                </label>
                <input
                  type="range"
                  min="50"
                  max="500"
                  step="50"
                  value={supplierCount}
                  onChange={(e) => setSupplierCount(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            )}
          </div>

          {/* Visualization */}
          {filteredData && (
            <PaymentUniverse
              data={filteredData}
              width={window.innerWidth * 0.7}
              height={window.innerHeight - 80}
              onNodeClick={handleNodeClick}
            />
          )}
        </div>

        {/* Right: Stats Panel */}
        <div className="w-80 bg-gray-900 border-l border-gray-800 overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* Summary Stats */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Overview</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Suppliers</span>
                  <span className="font-semibold">{stats?.totalSuppliers || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Amount</span>
                  <span className="font-semibold text-green-400">
                    ${(stats?.totalAmount || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Transactions</span>
                  <span className="font-semibold">{stats?.totalTransactions || 0}</span>
                </div>
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Categories</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  All Categories
                </button>
                
                {stats && Object.entries(stats.categories).map(([name, data]) => (
                  <button
                    key={name}
                    onClick={() => setSelectedCategory(name)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                      selectedCategory === name
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: data.color }}
                      />
                      <span className="text-sm">{name}</span>
                    </div>
                    <span className="text-xs">{data.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Top Suppliers */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Top Suppliers</h3>
              <div className="space-y-2">
                {stats?.topSuppliers.map((supplier, index) => (
                  <div
                    key={supplier.id}
                    className="bg-gray-800 rounded-lg p-3 hover:bg-gray-700 transition-colors cursor-pointer"
                    onClick={() => handleNodeClick(supplier)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 text-xs">#{index + 1}</span>
                          <span className="text-sm font-medium truncate">{supplier.label}</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">{supplier.category}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-green-400">
                          ${(supplier.amount).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </div>
                        <div className="text-xs text-gray-400">{supplier.transactions} txns</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Modal */}
      {showInfo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Payment Universe</h3>
              <button
                onClick={() => setShowInfo(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-3 text-sm text-gray-300">
              <p>
                <strong>Visualization:</strong> Each node represents a supplier or your company.
                Node size indicates payment amount, color indicates category.
              </p>
              <p>
                <strong>Interaction:</strong> Drag to pan, scroll to zoom, hover for details,
                click nodes for more information.
              </p>
              <p>
                <strong>Test Mode:</strong> Generates 50-500 mock suppliers for demonstration.
                Adjust the slider to change the number of suppliers.
              </p>
              <p>
                <strong>Filters:</strong> Use search to find specific suppliers, or click
                categories to filter by industry.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Selected Node Detail */}
      {selectedNode && selectedNode.type !== 'company' && (
        <div className="fixed bottom-4 right-4 bg-gray-900 border border-gray-700 rounded-lg p-4 max-w-sm z-40">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-semibold">{selectedNode.label}</h4>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Category:</span>
              <span>{selectedNode.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total Amount:</span>
              <span className="text-green-400">
                ${selectedNode.amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Transactions:</span>
              <span className="text-blue-400">{selectedNode.transactions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Avg Payment:</span>
              <span>
                ${(selectedNode.amount / selectedNode.transactions).toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

