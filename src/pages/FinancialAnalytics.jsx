import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  Calendar,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

const FinancialAnalytics = () => {
  const [fireflyStatus, setFireflyStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const API_BASE_URL = 'http://localhost:3001/api/v1';

  // 检查Firefly III连接状态
  useEffect(() => {
    checkFireflyStatus();
  }, []);

  const checkFireflyStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/firefly/status`);
      const data = await response.json();
      setFireflyStatus(data.data);
    } catch (error) {
      console.error('Failed to check Firefly III status:', error);
      setFireflyStatus({ connected: false, error: error.message });
    }
  };

  // 同步所有账户
  const syncAllAccounts = async () => {
    setSyncing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/firefly/sync/accounts`, {
        method: 'POST'
      });
      const data = await response.json();
      alert(`Sync completed: ${data.data.synced} synced, ${data.data.failed} failed`);
      checkFireflyStatus();
    } catch (error) {
      alert('Failed to sync accounts: ' + error.message);
    } finally {
      setSyncing(false);
    }
  };

  // 同步账户交易
  const syncAccountTransactions = async () => {
    if (!selectedAccount) {
      alert('Please select an account first');
      return;
    }

    setSyncing(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/firefly/sync/account/${selectedAccount}/transactions`,
        { method: 'POST' }
      );
      const data = await response.json();
      alert(`Transactions synced: ${data.data.synced} synced, ${data.data.failed} failed`);
    } catch (error) {
      alert('Failed to sync transactions: ' + error.message);
    } finally {
      setSyncing(false);
    }
  };

  // 加载财务仪表板
  const loadDashboard = async () => {
    if (!selectedAccount) {
      alert('Please select an account first');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/firefly/dashboard/${selectedAccount}?start_date=${dateRange.start}&end_date=${dateRange.end}`
      );
      const data = await response.json();
      setDashboardData(data.data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      alert('Failed to load dashboard: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Financial Analytics
          </h1>
          <p className="text-gray-600">
            Powered by Firefly III - Advanced financial analysis and insights
          </p>
        </div>

        {/* Firefly III 状态卡片 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Firefly III Integration Status
            </h2>
            <button
              onClick={checkFireflyStatus}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {fireflyStatus && (
            <div className="flex items-center gap-4">
              {fireflyStatus.connected ? (
                <>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="text-lg font-semibold text-green-700">Connected</p>
                    <p className="text-sm text-gray-600">
                      Version: {fireflyStatus.version} | API: {fireflyStatus.api_version}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-8 h-8 text-red-500" />
                  <div>
                    <p className="text-lg font-semibold text-red-700">Disconnected</p>
                    <p className="text-sm text-gray-600">
                      {fireflyStatus.message || fireflyStatus.error}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {!fireflyStatus?.connected && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-yellow-800 mb-2">
                    Firefly III Integration Disabled
                  </p>
                  <p className="text-sm text-yellow-700 mb-3">
                    To enable financial analytics, please configure Firefly III:
                  </p>
                  <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
                    <li>Install Firefly III (Docker recommended)</li>
                    <li>Generate an API token in Firefly III settings</li>
                    <li>Set FIREFLY_ENABLED=true in backend/.env</li>
                    <li>Set FIREFLY_API_TOKEN in backend/.env</li>
                    <li>Restart the backend server</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 同步控制面板 */}
        {fireflyStatus?.connected && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Data Synchronization
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={syncAllAccounts}
                disabled={syncing}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {syncing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    Sync All Accounts
                  </>
                )}
              </button>

              <button
                onClick={syncAccountTransactions}
                disabled={syncing || !selectedAccount}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {syncing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    Sync Account Transactions
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* 财务仪表板 */}
        {fireflyStatus?.connected && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Financial Dashboard
            </h2>

            {/* 账户和日期选择 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account ID
                </label>
                <input
                  type="text"
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  placeholder="Enter account ID"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              onClick={loadDashboard}
              disabled={loading || !selectedAccount}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed mb-6"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Loading Dashboard...
                </>
              ) : (
                <>
                  <BarChart3 className="w-5 h-5" />
                  Load Dashboard
                </>
              )}
            </button>

            {/* 仪表板数据显示 */}
            {dashboardData && (
              <div className="space-y-6">
                {/* 本地统计 */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Local Statistics
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-700">
                          Total Transactions
                        </span>
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                      </div>
                      <p className="text-2xl font-bold text-blue-900">
                        {dashboardData.local_stats.total_transactions}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-green-700">
                          Total Received
                        </span>
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      </div>
                      <p className="text-2xl font-bold text-green-900">
                        ${parseFloat(dashboardData.local_stats.total_received || 0).toFixed(2)}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-red-700">
                          Total Sent
                        </span>
                        <TrendingDown className="w-5 h-5 text-red-600" />
                      </div>
                      <p className="text-2xl font-bold text-red-900">
                        ${parseFloat(dashboardData.local_stats.total_sent || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Firefly III 数据 */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Firefly III Insights
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="text-sm text-gray-700 overflow-x-auto">
                      {JSON.stringify(dashboardData.firefly_insights, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 功能说明 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-3">
            About Financial Analytics
          </h3>
          <p className="text-sm text-blue-800 mb-3">
            This module integrates with Firefly III, a powerful open-source personal finance manager,
            to provide advanced financial analytics and insights for your Protocol Bank accounts.
          </p>
          <ul className="text-sm text-blue-800 space-y-2 list-disc list-inside">
            <li>Automatic synchronization of accounts and transactions</li>
            <li>Detailed financial reports and visualizations</li>
            <li>Budget tracking and category analysis</li>
            <li>Historical data analysis and trends</li>
            <li>Export capabilities for tax reporting</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FinancialAnalytics;
