import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheckIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

const ClearingHousePage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [participants, setParticipants] = useState([]);
  const [batches, setBatches] = useState([]);
  const [statistics, setStatistics] = useState({
    totalTrades: 0,
    pendingTrades: 0,
    settledTrades: 0,
    totalVolume: '0',
    totalBatches: 0,
    settledBatches: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      // Fetch statistics
      const tradeStatsRes = await fetch('/api/v1/netting-engine/trades/statistics', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const tradeStats = await tradeStatsRes.json();

      const batchStatsRes = await fetch('/api/v1/netting-engine/batches/statistics', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const batchStats = await batchStatsRes.json();

      setStatistics({
        totalTrades: tradeStats.data?.total_trades || 0,
        pendingTrades: tradeStats.data?.pending_trades || 0,
        settledTrades: tradeStats.data?.settled_trades || 0,
        totalVolume: tradeStats.data?.total_volume || '0',
        totalBatches: batchStats.data?.total_batches || 0,
        settledBatches: batchStats.data?.settled_batches || 0,
      });

      // Fetch participants
      const participantsRes = await fetch('/api/v1/netting-engine/participants', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const participantsData = await participantsRes.json();
      setParticipants(participantsData.data || []);

      // Fetch recent batches
      const batchesRes = await fetch('/api/v1/netting-engine/batches?limit=10', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const batchesData = await batchesRes.json();
      setBatches(batchesData.data || []);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const triggerSettlement = async () => {
    if (!confirm('Are you sure you want to trigger manual settlement?')) return;

    try {
      const res = await fetch('/api/v1/netting-engine/settlement/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await res.json();

      if (data.success) {
        alert(`Settlement completed! Batch ID: ${data.data.batchId}`);
        fetchData();
      } else {
        alert(`Settlement failed: ${data.message}`);
      }
    } catch (error) {
      console.error('Error triggering settlement:', error);
      alert('Failed to trigger settlement');
    }
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <ArrowPathIcon className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            ClearingHouse Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Global clearing network powered by Ethereum blockchain
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Trades"
            value={statistics.totalTrades.toLocaleString()}
            icon={CurrencyDollarIcon}
            color="bg-blue-500"
          />
          <StatCard
            title="Pending Trades"
            value={statistics.pendingTrades.toLocaleString()}
            icon={ClockIcon}
            color="bg-yellow-500"
          />
          <StatCard
            title="Total Volume"
            value={`$${parseFloat(statistics.totalVolume).toLocaleString()}`}
            icon={CurrencyDollarIcon}
            color="bg-green-500"
          />
          <StatCard
            title="Settled Batches"
            value={`${statistics.settledBatches} / ${statistics.totalBatches}`}
            icon={CheckCircleIcon}
            color="bg-purple-500"
          />
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {['overview', 'participants', 'batches'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    System Overview
                  </h2>
                  <button
                    onClick={triggerSettlement}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                  >
                    <ArrowPathIcon className="w-5 h-5" />
                    <span>Trigger Settlement</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Trade Statistics
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Total Trades</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {statistics.totalTrades.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Pending</span>
                        <span className="font-semibold text-yellow-600">
                          {statistics.pendingTrades.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Settled</span>
                        <span className="font-semibold text-green-600">
                          {statistics.settledTrades.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between pt-3 border-t border-gray-300 dark:border-gray-600">
                        <span className="text-gray-600 dark:text-gray-400">Total Volume</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          ${parseFloat(statistics.totalVolume).toLocaleString()} USDC
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Settlement Statistics
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Total Batches</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {statistics.totalBatches.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Settled</span>
                        <span className="font-semibold text-green-600">
                          {statistics.settledBatches.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Active Participants</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {participants.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'participants' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Registered Participants
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Address
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Registered At
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {participants.map((participant) => (
                        <tr key={participant.address}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {participant.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                            {participant.address.slice(0, 10)}...{participant.address.slice(-8)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {participant.is_active ? (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Active
                              </span>
                            ) : (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(participant.registered_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'batches' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Recent Settlement Batches
                </h2>
                <div className="space-y-4">
                  {batches.map((batch) => (
                    <div
                      key={batch.batch_id}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Batch #{batch.batch_id}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(batch.window_end).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          {batch.status === 'settled' ? (
                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              <CheckCircleIcon className="w-4 h-4 mr-1" />
                              Settled
                            </span>
                          ) : batch.status === 'submitted' ? (
                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              <ClockIcon className="w-4 h-4 mr-1" />
                              Submitted
                            </span>
                          ) : (
                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              <XCircleIcon className="w-4 h-4 mr-1" />
                              Failed
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Positions</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {JSON.parse(batch.positions).length}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Positions Hash</p>
                          <p className="font-mono text-xs text-gray-900 dark:text-white">
                            {batch.positions_hash.slice(0, 10)}...
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Signature</p>
                          <p className="font-mono text-xs text-gray-900 dark:text-white">
                            {batch.signature.slice(0, 10)}...
                          </p>
                        </div>
                        {batch.tx_hash && (
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">TX Hash</p>
                            <a
                              href={`https://sepolia.etherscan.io/tx/${batch.tx_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-xs text-blue-600 hover:underline"
                            >
                              {batch.tx_hash.slice(0, 10)}...
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClearingHousePage;
