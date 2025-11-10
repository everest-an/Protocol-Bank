import React, { useMemo } from 'react';
import { TrendingUp, DollarSign, Users, ArrowUpRight } from 'lucide-react';

export default function StreamPaymentDashboard({ streams, paymentType }) {
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

      {/* Stream Transactions Table */}
      {streams && streams.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Stream Transactions
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {streams.length} transaction{streams.length !== 1 ? 's' : ''}
            </p>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {streams.slice(0, 10).map((stream, index) => {
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {streams.length > 10 && (
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Showing 10 of {streams.length} transactions
              </p>
            </div>
          )}
        </div>
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
