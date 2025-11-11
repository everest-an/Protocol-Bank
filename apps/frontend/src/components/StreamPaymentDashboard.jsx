import React, { useMemo, useState } from 'react';
import { TrendingUp, DollarSign, Users, ArrowUpRight, Filter, Search, Calendar, ExternalLink, Play, Pause, Square, X } from 'lucide-react';
import EnterprisePaymentNetworkV2 from './EnterprisePaymentNetworkV2';
import { streamPaymentService } from '../services/backendService';
import contractService from '../services/contractService';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function StreamPaymentDashboard({ streams, paymentType, account, etherscanData, onUpdate }) {
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showFilters, setShowFilters] = useState(false);

  // Filter and paginate streams
  const filteredStreams = useMemo(() => {
    if (!streams) return [];

    let filtered = [...streams];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(stream => {
        const name = (stream.name || '').toLowerCase();
        const recipient = (stream.recipient_address || stream.recipient || '').toLowerCase();
        return name.includes(term) || recipient.includes(term);
      });
    }

    // Date range filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom).getTime();
      filtered = filtered.filter(stream => {
        const streamDate = new Date(stream.created_at || stream.start_time).getTime();
        return streamDate >= fromDate;
      });
    }

    if (dateTo) {
      const toDate = new Date(dateTo).getTime();
      filtered = filtered.filter(stream => {
        const streamDate = new Date(stream.created_at || stream.start_time).getTime();
        return streamDate <= toDate;
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(stream => {
        const status = (stream.status || 'active').toLowerCase();
        return status === statusFilter.toLowerCase();
      });
    }

    return filtered;
  }, [streams, searchTerm, dateFrom, dateTo, statusFilter]);

  // Paginated streams
  const paginatedStreams = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredStreams.slice(startIndex, endIndex);
  }, [filteredStreams, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredStreams.length / itemsPerPage);

  // Calculate statistics from streams
  const stats = useMemo(() => {
    if (!streams || streams.length === 0) {
      return {
        totalPayments: 0,
        totalAmount: 0,
        suppliers: 0,
        averagePayment: 0
      };
    }

    // Get unique recipients (suppliers)
    const uniqueRecipients = new Set();
    let totalAmount = 0;

    streams.forEach(stream => {
      const recipient = stream.recipient_address || stream.recipient;
      if (recipient) {
        uniqueRecipients.add(recipient.toLowerCase());
      }
      
      const amount = parseFloat(stream.total_amount || stream.totalAmount || 0);
      totalAmount += amount;
    });

    const totalPayments = streams.length;
    const suppliers = uniqueRecipients.size;
    const averagePayment = totalPayments > 0 ? totalAmount / totalPayments : 0;

    return {
      totalPayments,
      totalAmount,
      suppliers,
      averagePayment
    };
  }, [streams]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(amount);
  };

  const statCards = [
    {
      title: 'Total Payments',
      value: stats.totalPayments,
      icon: TrendingUp,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100 dark:bg-blue-900/20',
      format: (val) => val.toString()
    },
    {
      title: 'Total Amount',
      value: stats.totalAmount,
      icon: DollarSign,
      iconColor: 'text-green-600',
      iconBg: 'bg-green-100 dark:bg-green-900/20',
      format: (val) => `≡ ${formatCurrency(val)}`
    },
    {
      title: 'Suppliers',
      value: stats.suppliers,
      icon: Users,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-100 dark:bg-purple-900/20',
      format: (val) => val.toString()
    },
    {
      title: 'Average Payment',
      value: stats.averagePayment,
      icon: ArrowUpRight,
      iconColor: 'text-orange-600',
      iconBg: 'bg-orange-100 dark:bg-orange-900/20',
      format: (val) => `≡ ${formatCurrency(val)}`
    }
  ];

  // Prepare data for Amount Trend Chart
  const trendData = useMemo(() => {
    if (!streams || streams.length === 0) return [];
    
    // Group by date
    const dateMap = new Map();
    
    streams.forEach(stream => {
      const createdAt = stream.created_at || stream.start_time || Date.now();
      const date = new Date(createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      
      const amount = parseFloat(stream.total_amount || stream.totalAmount || 0);
      
      if (dateMap.has(date)) {
        dateMap.set(date, dateMap.get(date) + amount);
      } else {
        dateMap.set(date, amount);
      }
    });
    
    // Convert to array and sort by date
    return Array.from(dateMap.entries())
      .map(([date, amount]) => ({ date, amount }))
      .slice(-7); // Last 7 days
  }, [streams]);
  
  // Prepare data for Recipient Distribution Chart
  const distributionData = useMemo(() => {
    if (!streams || streams.length === 0) return [];
    
    // Group by recipient
    const recipientMap = new Map();
    
    streams.forEach(stream => {
      const recipient = stream.recipient_address || stream.recipient || 'Unknown';
      const shortAddr = `${recipient.substring(0, 6)}...${recipient.substring(recipient.length - 4)}`;
      const amount = parseFloat(stream.total_amount || stream.totalAmount || 0);
      
      if (recipientMap.has(shortAddr)) {
        recipientMap.set(shortAddr, recipientMap.get(shortAddr) + amount);
      } else {
        recipientMap.set(shortAddr, amount);
      }
    });
    
    // Convert to array and sort by amount
    return Array.from(recipientMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 recipients
  }, [streams]);
  
  // Colors for pie chart
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {card.title}
                </span>
                <div className={`p-2 rounded-lg ${card.iconBg}`}>
                  <Icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {card.format(card.value)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment Network Graph */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Payment Network
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Interactive visualization of stream payment relationships
        </p>
        <EnterprisePaymentNetworkV2
          suppliers={etherscanData?.suppliers || streams.map(s => ({
            id: s.recipient_address || s.recipient,
            address: s.recipient_address || s.recipient,
            name: s.stream_name || `Stream ${s.id}`,
            amount: parseFloat(s.total_amount || s.totalAmount || 0),
            status: s.status || 'success',
            transactionCount: s.transaction_count || 1
          }))}
          payments={etherscanData?.payments || streams.map(s => ({
            id: s.id || s.stream_id,
            from: account || 'My Account',
            to: s.recipient_address || s.recipient,
            amount: parseFloat(s.total_amount || s.totalAmount || 0),
            status: s.status || 'success',
            timestamp: new Date(s.created_at || Date.now()).getTime(),
            hash: s.hash || s.tx_hash
          }))}
          testMode={!streams || streams.length === 0}
          demoCase="simple"
          account={account}
        />
      </div>

      {/* Charts Section */}
      {streams && streams.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Amount Trend Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Amount Trend
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Stream payment amounts over time
            </p>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9ca3af"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#9ca3af"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    formatter={(value) => [`≡ ${formatCurrency(value)}`, 'Amount']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                No data available
              </div>
            )}
          </div>

          {/* Recipient Distribution Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Top Recipients
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Distribution by payment amount
            </p>
            {distributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    formatter={(value) => [`≡ ${formatCurrency(value)}`, 'Amount']}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value) => (
                      <span style={{ color: '#9ca3af', fontSize: '12px' }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                No data available
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stream Transactions Table */}
      {streams && streams.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Stream Transactions
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {filteredStreams.length} of {streams.length} transaction{streams.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Filter className="w-4 h-4" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name or address..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Date From */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    From Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Date To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    To Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Clear Filters */}
                <div className="md:col-span-2 lg:col-span-4 flex justify-end">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setDateFrom('');
                      setDateTo('');
                      setStatusFilter('all');
                      setCategoryFilter('all');
                      setCurrentPage(1);
                    }}
                    className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Stream Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Recipient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    TX Hash
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedStreams.map((stream, index) => {
                  const recipient = stream.recipient_address || stream.recipient || 'Unknown';
                  const amount = stream.total_amount || stream.totalAmount || 0;
                  const currency = stream.currency || 'ETH';
                  const status = stream.status || 'active';
                  const duration = stream.duration || stream.end_time - stream.start_time || 0;
                  const streamName = stream.stream_name || stream.streamName || `Stream #${index + 1}`;
                  
                  return (
                    <tr key={stream.stream_id || index} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {streamName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {recipient.substring(0, 10)}...{recipient.substring(recipient.length - 8)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          ≡ {formatCurrency(amount)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {currency}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDuration(duration)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          status === 'active' || status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : status === 'paused' || status === 'PAUSED'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                            : status === 'completed' || status === 'COMPLETED'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                        }`}>
                          {status.toLowerCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {stream.transaction_hash || stream.tx_hash ? (
                          <a
                            href={`https://etherscan.io/tx/${stream.transaction_hash || stream.tx_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                          >
                            {`${(stream.transaction_hash || stream.tx_hash).substring(0, 6)}...${(stream.transaction_hash || stream.tx_hash).substring((stream.transaction_hash || stream.tx_hash).length - 4)}`}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StreamActions 
                          stream={stream} 
                          paymentType={paymentType} 
                          onUpdate={onUpdate}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredStreams.length)} of {filteredStreams.length} transactions
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        page === currentPage
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// StreamActions Component - Action buttons for each stream
function StreamActions({ stream, paymentType, onUpdate }) {
  const [loading, setLoading] = useState(false);
  
  const handlePause = async () => {
    setLoading(true);
    try {
      if (paymentType === 'fiat') {
        await streamPaymentService.pause(stream.stream_id);
      } else {
        await contractService.pauseStream(stream.stream_id);
      }
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error pausing stream:', error);
      alert('Failed to pause stream: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleResume = async () => {
    setLoading(true);
    try {
      if (paymentType === 'fiat') {
        await streamPaymentService.resume(stream.stream_id);
      } else {
        await contractService.resumeStream(stream.stream_id);
      }
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error resuming stream:', error);
      alert('Failed to resume stream: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleStop = async () => {
    if (!confirm('Are you sure you want to stop this stream? This will finalize the payment and the stream cannot be resumed.')) return;
    
    setLoading(true);
    try {
      if (paymentType === 'fiat') {
        await streamPaymentService.stop(stream.stream_id);
      } else {
        await contractService.stopStream(stream.stream_id);
      }
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error stopping stream:', error);
      alert('Failed to stop stream: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this stream?')) return;
    
    setLoading(true);
    try {
      if (paymentType === 'fiat') {
        await streamPaymentService.cancel(stream.stream_id);
      } else {
        await contractService.cancelStream(stream.stream_id);
      }
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error canceling stream:', error);
      alert('Failed to cancel stream: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const status = stream.status || 'active';
  
  return (
    <div className="flex gap-1">
      {status === 'active' && (
        <button
          onClick={handlePause}
          disabled={loading}
          className="p-1.5 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded transition-colors disabled:opacity-50"
          title="Pause stream"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      )}
      {status === 'paused' && (
        <button
          onClick={handleResume}
          disabled={loading}
          className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors disabled:opacity-50"
          title="Resume stream"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      )}
      {(status === 'active' || status === 'paused') && (
        <>
          <button
            onClick={handleStop}
            disabled={loading}
            className="p-1.5 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900/20 rounded transition-colors disabled:opacity-50"
            title="Stop stream (node will turn gray)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
            title="Cancel stream"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </>
      )}
      {loading && (
        <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></span>
      )}
    </div>
  );
}

// Helper function to format duration
function formatDuration(seconds) {
  if (!seconds || seconds === 0) return 'N/A';
  
  const hours = Math.floor(seconds / 3600);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  
  if (months > 0) return `${months} month${months !== 1 ? 's' : ''}`;
  if (days > 0) return `${days} day${days !== 1 ? 's' : ''}`;
  if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''}`;
  return `${seconds}s`;
}
