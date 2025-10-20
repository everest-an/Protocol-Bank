import { useState } from 'react';
import { ExternalLink, TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';

export default function EnterprisePaymentTable({ payments = [] }) {
  const [sortField, setSortField] = useState('timestamp');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filterCategory, setFilterCategory] = useState('all');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedPayments = [...payments].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (sortField === 'amount') {
      aVal = parseFloat(aVal);
      bVal = parseFloat(bVal);
    } else if (sortField === 'timestamp') {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }

    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  const filteredPayments = filterCategory === 'all'
    ? sortedPayments
    : sortedPayments.filter(p => p.category === filterCategory);

  const categories = ['all', ...new Set(payments.map(p => p.category).filter(Boolean))];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="bg-white dark:bg-black border border-gray-100 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* 表头 */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-light text-gray-900 dark:text-white">
            Payment Transactions
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
            {filteredPayments.length} transactions
          </p>
        </div>

        {/* 分类筛选 */}
        <div className="flex items-center gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                filterCategory === cat
                  ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* 表格 */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
            <tr>
              <th
                onClick={() => handleSort('timestamp')}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Date
                {sortField === 'timestamp' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Supplier
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Category
              </th>
              <th
                onClick={() => handleSort('amount')}
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Amount
                {sortField === 'amount' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Tx Hash
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {filteredPayments.map((payment, index) => (
              <tr
                key={index}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
              >
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white font-mono">
                  {new Date(payment.timestamp).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {payment.supplierName || payment.brand || 'Unknown'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-300 font-mono">
                      {payment.recipient?.slice(0, 6)}...{payment.recipient?.slice(-4)}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
                    {payment.category || 'Other'}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-mono text-gray-900 dark:text-white">
                  {parseFloat(payment.amount || 0).toFixed(4)} ETH
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center">
                    {getStatusIcon(payment.status)}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  {payment.txHash ? (
                    <a
                      href={`https://sepolia.etherscan.io/tx/${payment.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <span className="font-mono">
                        {payment.txHash.slice(0, 6)}...{payment.txHash.slice(-4)}
                      </span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 表格底部统计 */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-300">Total Transactions</p>
            <p className="text-lg font-mono text-gray-900 dark:text-white mt-1">
              {filteredPayments.length}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-300">Total Amount</p>
            <p className="text-lg font-mono text-gray-900 dark:text-white mt-1">
              {filteredPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0).toFixed(4)} ETH
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-300">Average Payment</p>
            <p className="text-lg font-mono text-gray-900 dark:text-white mt-1">
              {filteredPayments.length > 0
                ? (filteredPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) / filteredPayments.length).toFixed(4)
                : '0.0000'} ETH
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-300">Unique Suppliers</p>
            <p className="text-lg font-mono text-gray-900 dark:text-white mt-1">
              {new Set(filteredPayments.map(p => p.recipient)).size}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

