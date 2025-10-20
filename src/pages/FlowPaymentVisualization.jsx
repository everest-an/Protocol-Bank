import { useState, useEffect } from 'react';
import { Wallet, RefreshCw, Users, Send, TestTube2, TrendingUp } from 'lucide-react';
import { useWeb3 } from '../hooks/useWeb3';
import { useStreamContract } from '../hooks/useStreamContract';
import { useContractEvents, useRealtimeNotifications } from '../hooks/useContractEvents';
import { generateFullMockData } from '../utils/mockData';
import EnterprisePaymentNetwork from '../components/EnterprisePaymentNetwork';
import EnterprisePaymentTable from '../components/EnterprisePaymentTable';
import RegisterSupplierModal from '../components/modals/RegisterSupplierModal';
import CreatePaymentModal from '../components/modals/CreatePaymentModal';
import RealtimeNotifications from '../components/RealtimeNotifications';
import LiveIndicator from '../components/LiveIndicator';

export default function FlowPaymentVisualization() {
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
  const { notifications, addNotification, removeNotification } = useRealtimeNotifications();
  const [testMode, setTestMode] = useState(false);
  const [mockData, setMockData] = useState(null);

  // 生成测试数据
  useEffect(() => {
    if (testMode && !mockData) {
      const data = generateFullMockData();
      setMockData(data);
    }
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

      setSuppliers(suppliersData || []);
      setPayments(paymentsData || []);
      setStats(statsData || {
        totalPayments: 0,
        totalAmount: '0',
        supplierCount: 0,
        averagePayment: '0',
      });
    } catch (error) {
      console.error('Failed to load data:', error);
      addNotification({
        type: 'error',
        title: 'Load Failed',
        message: error.message || 'Failed to load data from contract',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && isSepolia && !testMode) {
      loadData();
    }
  }, [isConnected, isSepolia, testMode]);

  // 监听合约事件
  useContractEvents(provider, {
    onSupplierRegistered: (event) => {
      addNotification({
        type: 'success',
        title: 'New Supplier Registered',
        message: `${event.name} has been registered`,
      });
      loadData();
    },
    onPaymentCreated: (event) => {
      addNotification({
        type: 'success',
        title: 'New Payment Created',
        message: `Payment of ${event.amount} ETH created`,
      });
      loadData();
    },
    onPaymentStatusUpdated: (event) => {
      addNotification({
        type: 'info',
        title: 'Payment Status Updated',
        message: `Payment status changed to ${event.status}`,
      });
      loadData();
    },
  });

  const handleRegisterSupplier = async (supplierData) => {
    try {
      await registerSupplier(supplierData);
      addNotification({
        type: 'success',
        title: 'Supplier Registered',
        message: `${supplierData.name} has been registered successfully`,
      });
      setShowRegisterModal(false);
      loadData();
    } catch (error) {
      console.error('Failed to register supplier:', error);
      addNotification({
        type: 'error',
        title: 'Registration Failed',
        message: error.message || 'Failed to register supplier',
      });
    }
  };

  const handleCreatePayment = async (paymentData) => {
    try {
      await createPayment(paymentData);
      addNotification({
        type: 'success',
        title: 'Payment Created',
        message: `Payment of ${paymentData.amount} ETH created successfully`,
      });
      setShowPaymentModal(false);
      loadData();
    } catch (error) {
      console.error('Failed to create payment:', error);
      addNotification({
        type: 'error',
        title: 'Payment Failed',
        message: error.message || 'Failed to create payment',
      });
    }
  };

  const displaySuppliers = testMode ? mockData?.suppliers || [] : suppliers;
  const displayPayments = testMode ? mockData?.payments || [] : payments;
  const displayStats = testMode ? mockData?.stats || stats : stats;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* 实时通知 */}
      <RealtimeNotifications
        notifications={notifications}
        onClose={removeNotification}
      />

      {/* 顶部栏 */}
      <div className="border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-light text-gray-900 dark:text-gray-100">
                Flow Payment Network
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Real-time payment network visualization on Sepolia
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Live 指示器 */}
              {isConnected && isSepolia && !testMode && <LiveIndicator />}

              {/* 测试模式 */}
              <button
                onClick={() => setTestMode(!testMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  testMode
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <TestTube2 className="w-4 h-4" />
                {testMode ? '退出测试模式' : '测试模式'}
              </button>

              {/* 刷新 */}
              <button
                onClick={loadData}
                disabled={loading || !isConnected || testMode}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                刷新
              </button>

              {/* 注册供应商 */}
              {isConnected && isSepolia && !testMode && (
                <button
                  onClick={() => setShowRegisterModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                >
                  <Users className="w-4 h-4" />
                  注册供应商
                </button>
              )}

              {/* 创建支付 */}
              {isConnected && isSepolia && !testMode && (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  disabled={suppliers.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  创建支付
                </button>
              )}

              {/* 连接钱包 */}
              {!isConnected ? (
                <button
                  onClick={connect}
                  disabled={isConnecting || !isMetaMaskInstalled}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Wallet className="w-4 h-4" />
                  {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                </button>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-mono">
                    {account?.slice(0, 6)}...{account?.slice(-4)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="container mx-auto px-4 py-6">
        {/* 测试模式提示 */}
        {testMode && (
          <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <div className="flex items-start gap-3">
              <TestTube2 className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-purple-900 dark:text-purple-100">
                  测试模式已启用
                </h3>
                <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                  当前显示的是模拟数据,包含 {mockData?.suppliers?.length || 0} 个供应商和{' '}
                  {mockData?.payments?.length || 0} 笔支付记录。用于演示系统的资金流效果。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">总支付次数</p>
                <p className="text-2xl font-light text-gray-900 dark:text-gray-100 mt-1">
                  {displayStats.totalPayments || 0}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">总支付金额</p>
                <p className="text-2xl font-light text-gray-900 dark:text-gray-100 mt-1 font-mono">
                  {parseFloat(displayStats.totalAmount || 0).toFixed(2)} <span className="text-sm">ETH</span>
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">供应商数量</p>
                <p className="text-2xl font-light text-gray-900 dark:text-gray-100 mt-1">
                  {displayStats.supplierCount || displaySuppliers.length}
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">平均支付</p>
                <p className="text-2xl font-light text-gray-900 dark:text-gray-100 mt-1 font-mono">
                  {parseFloat(displayStats.averagePayment || 0).toFixed(2)} <span className="text-sm">ETH</span>
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
        />

        {/* 企业级支付详情表格 */}
        <div className="mt-6">
          <EnterprisePaymentTable payments={displayPayments} />
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
          onSubmit={handleCreatePayment}
        />
      )}
    </div>
  );
}

