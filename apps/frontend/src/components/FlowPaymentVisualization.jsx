import React, { useState, useEffect, useMemo } from 'react';
import { Wallet, RefreshCw, Users, Send, TestTube2, TrendingUp, DollarSign } from 'lucide-react';
import { useWeb3 } from '../hooks/useWeb3';
import { useStreamContract } from '../hooks/useStreamContract';
import { useContractEvents } from '../hooks/useContractEvents';
import { generateFullMockData } from '../utils/mockData';
import EnterprisePaymentNetwork from '../components/EnterprisePaymentNetworkV2';
import EnterprisePaymentTable from '../components/EnterprisePaymentTable';
import RegisterSupplierModal from '../components/modals/RegisterSupplierModal';
import CreatePaymentModal from '../components/modals/CreatePaymentModal';
// CreateStreamModal functionality is now integrated into CreatePaymentModal
import LiveIndicator from '../components/LiveIndicator';
import CurrencySelector from '../components/CurrencySelector';
import { useExchangeRates } from '../hooks/useExchangeRates';
import { formatWithConversion } from '../utils/currencyFormatter';
import { useTranslation } from 'react-i18next';
import { transactionService } from '../services/backendService';
import authUtils from '../utils/auth';
export default function FlowPaymentVisualization({ 
  sharedMockData = null,
  onDataUpdate = null,
  externalTestMode = null,
  onTestModeChange = null
}) {
  const { t } = useTranslation();
  const {
    account,
    provider,
    signer,
    isConnected,
    isConnecting,
    isSepolia,
    isMetaMaskInstalled,
    connect,
    disconnect,
    switchToSepolia,
  } = useWeb3();

  const {
    loading: contractLoading,
    registerSupplier,
    createPayment,
    getSuppliers,
    getSupplier,
    getPayments,
    getStatistics,
  } = useStreamContract(signer, provider);

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({
    totalPayments: 0,
    totalAmount: '0',
    supplierCount: 0,
    averagePayment: '0',
  });
  const [loading, setLoading] = useState(false);
  // Removed real-time notifications - payments now only show in the table below
  const [internalTestMode, setInternalTestMode] = useState(false); // Default to real data
  
  // Use external testMode if provided, otherwise use internal
  const testMode = externalTestMode !== null ? externalTestMode : internalTestMode;
  const setTestMode = onTestModeChange || setInternalTestMode;
  const [mockData, setMockData] = useState(null);
  const [supplierCount, setSupplierCount] = useState(12);
  const [demoCase, setDemoCase] = useState('two-tier'); // simple, two-tier, three-tier, complex
  const [selectedCurrency, setSelectedCurrency] = useState('ETH');
  const { rates, loading: ratesLoading, lastUpdated, refreshRates } = useExchangeRates();

  // 自动切换Demo Case (每5秒)
  useEffect(() => {
    if (!testMode) return;

    const demoCases = ['simple', 'two-tier', 'three-tier', 'complex'];
    let currentIndex = demoCases.indexOf(demoCase);

    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % demoCases.length;
      setDemoCase(demoCases[currentIndex]);
    }, 5000); // 5秒切换一次

    return () => clearInterval(interval);
  }, [testMode]); // 只依赖testMode，避免重复创建interval

  // 生成测试数据
  useEffect(() => {
    if (testMode) {
      // Use shared mock data if available, otherwise generate new data
      const data = sharedMockData || generateFullMockData(supplierCount, 20); // 12 个供应商，20 笔支付
      setMockData(data);
    } else {
      setMockData(null);
    }
  }, [testMode, supplierCount, sharedMockData]);

  // 测试模式下动态生成新的支付交易
  useEffect(() => {
    if (!testMode || !mockData) return;

    const interval = setInterval(() => {
      setMockData(prevData => {
        if (!prevData) return prevData;

        // 生成新的随机支付
        const supplier = prevData.suppliers[Math.floor(Math.random() * prevData.suppliers.length)];
        const amount = parseFloat((Math.random() * 5 + 0.1).toFixed(4)); // 0.1-5.1 ETH
        const statuses = ['Completed', 'Completed', 'Completed', 'Pending'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];

        const newPayment = {
          id: (prevData.payments.length + 1).toString(),
          from: prevData.mainWallet,
          to: supplier.id,
          amount: amount,
          category: supplier.category,
          status: status,
          timestamp: new Date(),
          txHash: '0x' + Array.from({ length: 64 }, () => 
            Math.floor(Math.random() * 16).toString(16)
          ).join(''),
        };

        // 添加新支付到列表顶部
        const updatedPayments = [newPayment, ...prevData.payments];

        // 更新统计数据
        const completedPayments = updatedPayments.filter(p => p.status === 'Completed');
        const totalAmount = completedPayments.reduce((sum, p) => sum + p.amount, 0);

        const updatedStats = {
          totalPayments: completedPayments.length,
          totalAmount: parseFloat(totalAmount.toFixed(4)),
          supplierCount: prevData.suppliers.length,
          averagePayment: completedPayments.length > 0 
            ? parseFloat((totalAmount / completedPayments.length).toFixed(4))
            : 0,
        };

        // Payment added to table - no notification needed

        return {
          ...prevData,
          payments: updatedPayments,
          stats: updatedStats,
        };
      });
    }, 3000); // 每3秒生成一个新支付

    return () => clearInterval(interval);
  }, [testMode, mockData]);

  // 加载链上数据
  const loadData = async () => {
    if (!isConnected || !isSepolia) return;

    setLoading(true);
    try {
      const [suppliersData, paymentsData, statsData] = await Promise.all([
        getSuppliers(),
        getPayments(),
        getStatistics(),
      ]);

      const newSuppliers = suppliersData || [];
      const newPayments = paymentsData || [];
      const newStats = statsData || {
        totalPayments: 0,
        totalAmount: '0',
        supplierCount: 0,
        averagePayment: '0',
      };
      
      setSuppliers(newSuppliers);
      setPayments(newPayments);
      setStats(newStats);
      
      // Notify parent component of data update
      if (onDataUpdate) {
        onDataUpdate({
          suppliers: newSuppliers,
          payments: newPayments,
          stats: newStats
        });
      }
    } catch (error) {
      // console.error('Failed to load data:', error);
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载后端数据
  const loadBackendData = async () => {
    const user = authUtils.getCurrentUser();
    if (!user) {
      console.log('No user logged in, showing empty state');
      setPaymentData({
        nodes: [],
        links: [],
        transactions: [],
        stats: {
          totalPayments: 0,
          totalAmount: 0,
          suppliersCount: 0,
          avgPayment: 0
        }
      });
      return;
    }

    setLoading(true);
    try {
      // 获取交易历史
      const historyResponse = await transactionService.getHistory(user.account_id);
      // 获取交易统计
      const statsResponse = await transactionService.getStats(user.account_id);

      if (historyResponse.status === 'success' && statsResponse.status === 'success') {
        const transactions = historyResponse.data || [];
        const statsData = statsResponse.data || {};

        // 转换交易数据为前端格式
        const formattedPayments = transactions.map((tx, index) => ({
          id: tx.transaction_id || index.toString(),
          from: tx.from_account_id,
          to: tx.to_account_id,
          amount: parseFloat(tx.amount || 0),
          category: tx.category || 'General',
          status: tx.status === 'completed' ? 'Completed' : 'Pending',
          timestamp: new Date(tx.created_at),
          txHash: tx.transaction_hash || '0x' + Math.random().toString(16).substr(2, 64),
          fromName: tx.from_username || tx.from_email || 'Unknown',
          toName: tx.to_username || tx.to_email || 'Unknown',
        }));

        // 提取唯一的供应商(收款方)
        const suppliersMap = new Map();
        transactions.forEach(tx => {
          if (tx.to_account_id && !suppliersMap.has(tx.to_account_id)) {
            suppliersMap.set(tx.to_account_id, {
              id: tx.to_account_id,
              name: tx.to_username || tx.to_email || 'Unknown Supplier',
              category: tx.category || 'General',
              totalReceived: 0,
              paymentCount: 0,
            });
          }
        });

        // 计算每个供应商的总收款和交易数
        transactions.forEach(tx => {
          if (tx.to_account_id && suppliersMap.has(tx.to_account_id)) {
            const supplier = suppliersMap.get(tx.to_account_id);
            supplier.totalReceived += parseFloat(tx.amount || 0);
            supplier.paymentCount += 1;
          }
        });

        const formattedSuppliers = Array.from(suppliersMap.values());

        // 格式化统计数据
        const formattedStats = {
          totalPayments: parseInt(statsData.total_transactions || 0),
          totalAmount: parseFloat(statsData.total_amount || 0).toFixed(4),
          supplierCount: formattedSuppliers.length,
          averagePayment: parseFloat(statsData.average_amount || 0).toFixed(4),
        };

        setSuppliers(formattedSuppliers);
        setPayments(formattedPayments);
        setStats(formattedStats);

        // Notify parent component of data update
        if (onDataUpdate) {
          onDataUpdate({
            suppliers: formattedSuppliers,
            payments: formattedPayments,
            stats: formattedStats
          });
        }

        console.log('Backend data loaded successfully:', {
          payments: formattedPayments.length,
          suppliers: formattedSuppliers.length,
          stats: formattedStats
        });
      } else {
        console.error('Failed to load backend data:', historyResponse, statsResponse);
        // Show empty state instead of test mode
      }
    } catch (error) {
      console.error('Error loading backend data:', error);
      // Show empty state instead of test mode
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!testMode) {
      // 优先尝试加载后端数据
      loadBackendData();
    } else if (isConnected && isSepolia) {
      // 如果连接了钱包且在Sepolia网络,加载链上数据
      loadData();
    }
  }, [isConnected, isSepolia, testMode]);

  // Listen to contract events
  useContractEvents(provider, {
    onSupplierRegistered: (event) => {
      loadData();
    },
    onPaymentCreated: (event) => {
      loadData();
    },
    onPaymentStatusUpdated: (event) => {
      loadData();
    },
  });

  const handleRegisterSupplier = async (supplierData) => {
    try {
      await registerSupplier(supplierData);
      // Supplier registered successfully
      setShowRegisterModal(false);
      loadData();
    } catch (error) {
      // console.error('Failed to register supplier:', error);
      console.error('Failed to register supplier:', error);
    }
  };

  const handleCreatePayment = async (paymentData) => {
    try {
      await createPayment(paymentData);
      // Payment created successfully
      setShowPaymentModal(false);
      loadData();
    } catch (error) {
      // console.error('Failed to create payment:', error);
      console.error('Failed to create payment:', error);
    }
  };

  const displaySuppliers = testMode ? (mockData?.suppliers || []) : suppliers;
  const displayPayments = testMode ? (mockData?.payments || []) : payments;
  
  // 确保统计数据实时更新 - 从当前显示的数据重新计算
  const displayStats = useMemo(() => {
    if (testMode && mockData) {
      // 测试模式：使用 mockData 的统计数据
      return mockData.stats;
    }
    // 真实模式：使用链上数据的统计
    return stats;
  }, [testMode, mockData, stats]);

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Real-time notifications removed - payments show in table below */}

      {/* 顶部栏 */}
      <div className="border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-black">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-light text-gray-900 dark:text-white">
                {t('flowPayment.title')}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
                {t('flowPayment.subtitle')}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Live 指示器 */}
              {isConnected && isSepolia && !testMode && <LiveIndicator />}

              {/* Currency Selector */}
              <CurrencySelector
                selectedCurrency={selectedCurrency}
                onCurrencyChange={setSelectedCurrency}
                lastUpdated={lastUpdated}
                onRefresh={refreshRates}
                loading={ratesLoading}
              />

              {/* 测试模式 */}
              <button
                onClick={() => setTestMode(!testMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  testMode
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <TestTube2 className="w-4 h-4" />
                {testMode ? t('testMode.exit') : t('testMode.enter')}
              </button>

              {/* 刷新 */}
              <button
                onClick={loadData}
                disabled={loading || !isConnected || testMode}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {t('common.refresh')}
              </button>

              {/* Register Supplier */}
              {isConnected && isSepolia && !testMode && (
                <button
                  onClick={() => setShowRegisterModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                >
                  <Users className="w-4 h-4" />
                  {t('flowPayment.registerSupplier')}
                </button>
              )}

              {/* Create Payment */}
              {isConnected && isSepolia && !testMode && (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  disabled={suppliers.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  {t('payment.createPayment')}
                </button>
              )}

              {/* Create Stream functionality is now integrated into Create Payment modal */}
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="container mx-auto px-4 py-6">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-black border border-gray-100 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-300">{t('flowPayment.totalPayments')}</p>
                <p className="text-2xl font-light text-gray-900 dark:text-white mt-1">
                  {displayStats.totalPayments || 0}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-black border border-gray-100 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-300">{t('flowPayment.totalAmount')}</p>
                <p className="text-2xl font-light text-gray-900 dark:text-white mt-1 font-mono">
                  {formatWithConversion(parseFloat(displayStats.totalAmount || 0), selectedCurrency, rates)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-black border border-gray-100 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-300">{t('flowPayment.suppliers')}</p>
                <p className="text-2xl font-light text-gray-900 dark:text-white mt-1">
                  {displayStats.supplierCount || displaySuppliers.length}
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-black border border-gray-100 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-300">{t('flowPayment.averagePayment')}</p>
                <p className="text-2xl font-light text-gray-900 dark:text-white mt-1 font-mono">
                  {formatWithConversion(parseFloat(displayStats.averagePayment || 0), selectedCurrency, rates)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* 企业级支付网络可视化 */}
        <EnterprisePaymentNetwork
          suppliers={displaySuppliers}
          payments={displayPayments}
          testMode={testMode}
          mockData={mockData}
          demoCase={demoCase}
          account={account}
        />

        {/* 测试模式提示 */}
        {testMode && (
          <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <div className="flex items-start gap-3">
              <TestTube2 className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-purple-900 dark:text-purple-100">
                  {t('testMode.enabled')}
                </h3>
                <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                  {t('testMode.description', {
                    suppliers: mockData?.suppliers?.length || 0,
                    payments: mockData?.payments?.length || 0
                  })}
                </p>
                <div className="mt-3 flex items-center gap-4">
                  <label className="text-sm font-medium text-purple-900 dark:text-purple-100">
                    {t('flowPayment.suppliers')}: {supplierCount}
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="500"
                    step="50"
                    value={supplierCount}
                    onChange={(e) => setSupplierCount(Number(e.target.value))}
                    className="flex-1 max-w-xs h-2 bg-purple-200 dark:bg-purple-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <label className="text-sm font-medium text-purple-900 dark:text-purple-100">
                    {t('testMode.demoCase')}:
                  </label>
                  <select
                    value={demoCase}
                    onChange={(e) => setDemoCase(e.target.value)}
                    className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="simple">{t('testMode.simple')}</option>
                    <option value="two-tier">{t('testMode.twoTier')}</option>
                    <option value="three-tier">{t('testMode.threeTier')}</option>
                    <option value="complex">{t('testMode.complex')}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 企业级支付详情表格 */}
        <div className="mt-6">
          <EnterprisePaymentTable 
            payments={displayPayments} 
            selectedCurrency={selectedCurrency}
            rates={rates}
          />
        </div>
      </div>

      {/* 模态框 */}
      {showRegisterModal && (
        <RegisterSupplierModal
          onClose={() => setShowRegisterModal(false)}
          onSubmit={handleRegisterSupplier}
        />
      )}

      {showPaymentModal && (
        <CreatePaymentModal
          suppliers={suppliers}
          onClose={() => setShowPaymentModal(false)}
          onCreate={handleCreatePayment}
          signer={signer}
          account={account}
        />
      )}

      {/* CreateStreamModal is no longer needed - functionality integrated into CreatePaymentModal */}
    </div>
  );
}

