import React, { useState, useEffect } from 'react';
import { RefreshCw, Users, Send, TrendingUp, DollarSign } from 'lucide-react';
import EnterprisePaymentNetwork from '../components/EnterprisePaymentNetworkV2';
import EnterprisePaymentTable from '../components/EnterprisePaymentTable';
import CurrencySelector from '../components/CurrencySelector';
import { useExchangeRates } from '../hooks/useExchangeRates';
import { formatWithConversion } from '../utils/currencyFormatter';
import { useTranslation } from 'react-i18next';
import { transactionService } from '../services/backendService';
import authUtils from '../utils/auth';

export default function FlowPaymentVisualization() {
  const { t } = useTranslation();
  
  const [suppliers, setSuppliers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({
    totalPayments: 0,
    totalAmount: '0',
    supplierCount: 0,
    averagePayment: '0',
  });
  const [loading, setLoading] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('ETH');
  const { rates, loading: ratesLoading, lastUpdated, refreshRates } = useExchangeRates();
  const [error, setError] = useState(null);

  // 加载后端数据
  const loadBackendData = async () => {
    console.log('[FlowPaymentVisualization] Loading backend data...');
    setLoading(true);
    setError(null);
    
    try {
      const user = authUtils.getCurrentUser();
      
      if (!user || !user.account_id) {
        console.log('[FlowPaymentVisualization] No user logged in');
        setError('Please login to view your payment data');
        setLoading(false);
        return;
      }

      console.log('[FlowPaymentVisualization] Fetching data for account:', user.account_id);
      
      // 获取交易历史
      const historyResponse = await transactionService.getHistory(user.account_id);
      console.log('[FlowPaymentVisualization] History response:', historyResponse);
      
      if (historyResponse.status === 'success' && historyResponse.data) {
        const transactions = historyResponse.data.transactions || [];
        console.log('[FlowPaymentVisualization] Loaded transactions:', transactions.length);
        
        // 转换交易数据为payments格式
        const paymentsData = transactions.map(tx => ({
          id: tx.transaction_id,
          from: tx.from_username || tx.from_account_id,
          to: tx.to_username || tx.to_account_id,
          amount: parseFloat(tx.amount),
          currency: tx.currency,
          status: tx.status,
          category: tx.payment_method || 'Transfer',
          timestamp: new Date(tx.created_at).getTime(),
          txHash: tx.tx_hash || `0x${tx.transaction_id.replace(/-/g, '').substring(0, 64)}`,
          direction: tx.direction
        }));
        
        setPayments(paymentsData);
        
        // 提取供应商列表
        const suppliersMap = new Map();
        transactions.forEach(tx => {
          if (tx.direction === 'outgoing') {
            const supplierId = tx.to_account_id;
            if (!suppliersMap.has(supplierId)) {
              suppliersMap.set(supplierId, {
                id: supplierId,
                name: tx.to_username || 'Unknown',
                address: tx.to_account_id,
                category: tx.payment_method || 'Supplier',
                totalAmount: 0,
                paymentCount: 0
              });
            }
            const supplier = suppliersMap.get(supplierId);
            supplier.totalAmount += parseFloat(tx.amount);
            supplier.paymentCount += 1;
          }
        });
        
        const suppliersData = Array.from(suppliersMap.values());
        setSuppliers(suppliersData);
        
        // 计算统计数据
        const totalAmount = transactions.reduce((sum, tx) => 
          sum + parseFloat(tx.amount), 0
        );
        
        setStats({
          totalPayments: transactions.length,
          totalAmount: totalAmount.toFixed(4),
          supplierCount: suppliersData.length,
          averagePayment: transactions.length > 0 
            ? (totalAmount / transactions.length).toFixed(4)
            : '0'
        });
        
        console.log('[FlowPaymentVisualization] Data loaded successfully');
      } else {
        console.error('[FlowPaymentVisualization] Invalid response:', historyResponse);
        setError('Failed to load payment data');
      }
    } catch (err) {
      console.error('[FlowPaymentVisualization] Error loading data:', err);
      setError('Error loading payment data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadBackendData();
  }, []);

  // 处理刷新
  const handleRefresh = () => {
    loadBackendData();
    refreshRates();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Flow Payment Network
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Enterprise Automated Payment Management Tool
              </p>
            </div>
            <div className="flex items-center gap-3">
              <CurrencySelector
                selectedCurrency={selectedCurrency}
                onCurrencyChange={setSelectedCurrency}
              />
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 dark:text-gray-400 text-sm">Total Payments</span>
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalPayments}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 dark:text-gray-400 text-sm">Total Amount</span>
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {selectedCurrency === 'ETH' ? 'Ξ' : '$'} {formatWithConversion(
                stats.totalAmount,
                'ETH',
                selectedCurrency,
                rates
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 dark:text-gray-400 text-sm">Suppliers</span>
              <Users className="w-5 h-5 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.supplierCount}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 dark:text-gray-400 text-sm">Average Payment</span>
              <Send className="w-5 h-5 text-orange-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {selectedCurrency === 'ETH' ? 'Ξ' : '$'} {formatWithConversion(
                stats.averagePayment,
                'ETH',
                selectedCurrency,
                rates
              )}
            </div>
          </div>
        </div>

        {/* Network Visualization */}
        {!loading && payments.length > 0 && (
          <div className="mb-6">
            <EnterprisePaymentNetwork
              suppliers={suppliers}
              payments={payments}
              stats={stats}
              selectedCurrency={selectedCurrency}
              rates={rates}
            />
          </div>
        )}

        {/* Empty State */}
        {!loading && payments.length === 0 && !error && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow-sm">
            <Send className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No payment data yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start making payments to see your payment network visualization
            </p>
          </div>
        )}

        {/* Payment Table */}
        {!loading && payments.length > 0 && (
          <EnterprisePaymentTable
            payments={payments}
            selectedCurrency={selectedCurrency}
            rates={rates}
          />
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow-sm">
            <RefreshCw className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Loading payment data...
            </h3>
          </div>
        )}
      </div>
    </div>
  );
}
