import { useState, useEffect, useCallback } from 'react';
import { Wallet, RefreshCw, Users, Send, TestTube2, TrendingUp } from 'lucide-react';
import { useWeb3 } from '../hooks/useWeb3';
import { useStreamContract } from '../hooks/useStreamContract';
import { useContractEvents, useRealtimeNotifications } from '../hooks/useContractEvents';
import { generateFullMockData } from '../utils/mockData';
import PaymentNetworkGraph from '../components/payment-visualization/PaymentNetworkGraph';
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

  // 切换测试模式
  const toggleTestMode = () => {
    if (!testMode) {
      const data = generateFullMockData();
      setMockData(data);
    }
    setTestMode(!testMode);
  };

  // 加载数据
  const loadData = async () => {
    if (!isConnected || !isSepolia) return;

    setLoading(true);
    try {
      const statsData = await getStatistics();
      setStats(statsData);

      const supplierAddresses = await getSuppliers();
      const suppliersData = await Promise.all(
        supplierAddresses.map(async (addr) => {
          const supplier = await getSupplier(addr);
          return { address: addr, ...supplier };
        })
      );
      setSuppliers(suppliersData.filter((s) => s !== null));

      const paymentsData = await getPayments();
      setPayments(paymentsData);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 实时事件监听
  const handleContractEvent = useCallback(
    (event) => {
      console.log('Contract event received:', event);
      addNotification({
        type: 'success',
        eventType: event.type,
        data: event.data,
      });
      loadData();
    },
    [addNotification, loadData]
  );

  const { isListening } = useContractEvents(provider, handleContractEvent);

  useEffect(() => {
    if (isConnected && isSepolia) {
      loadData();
    }
  }, [isConnected, isSepolia]);

  // 处理注册供应商
  const handleRegisterSupplier = async (supplierData) => {
    try {
      await registerSupplier(supplierData);
      setShowRegisterModal(false);
      await loadData();
    } catch (error) {
      console.error('注册供应商失败:', error);
      throw error;
    }
  };

  // 处理创建支付
  const handleCreatePayment = async (paymentData) => {
    try {
      await createPayment(paymentData);
      setShowPaymentModal(false);
      await loadData();
    } catch (error) {
      console.error('创建支付失败:', error);
      throw error;
    }
  };

  // 获取显示数据
  const displayData = testMode ? mockData : { suppliers, payments, stats };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* 实时通知 */}
      <RealtimeNotifications notifications={notifications} onClose={removeNotification} />

      {/* 注册供应商模态框 */}
      {showRegisterModal && (
        <RegisterSupplierModal
          onClose={() => setShowRegisterModal(false)}
          onSubmit={handleRegisterSupplier}
        />
      )}

      {/* 创建支付模态框 */}
      {showPaymentModal && (
        <CreatePaymentModal
          suppliers={displayData?.suppliers || []}
          onClose={() => setShowPaymentModal(false)}
          onSubmit={handleCreatePayment}
        />
      )}

      {/* 顶部栏 */}
      <div className="border-b border-gray-100 dark:border-gray-800 sticky top-16 z-10 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-light text-gray-900 dark:text-gray-100">
                Flow Payment Network
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                实时支付网络可视化系统 - Sepolia 测试网
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* 测试模式按钮 */}
              <button
                onClick={toggleTestMode}
                className={`px-4 py-2 text-sm font-normal rounded-lg transition-all ${
                  testMode
                    ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800'
                    : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900'
                }`}
              >
                <TestTube2 className="w-4 h-4 inline mr-2" />
                {testMode ? '退出测试模式' : '测试模式'}
              </button>

              {isConnected && isSepolia && !testMode && (
                <>
                  <button
                    onClick={() => setShowRegisterModal(true)}
                    className="px-4 py-2 text-sm font-normal text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors"
                  >
                    <Users className="w-4 h-4 inline mr-2" />
                    注册供应商
                  </button>
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="px-4 py-2 text-sm font-normal text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Send className="w-4 h-4 inline mr-2" />
                    创建支付
                  </button>
                  <LiveIndicator isLive={isListening} />
                </>
              )}

              {!testMode && (
                <button
                  onClick={loadData}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-normal text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 inline mr-2 ${loading ? 'animate-spin' : ''}`} />
                  刷新
                </button>
              )}

              {!testMode && (
                <>
                  {isConnected ? (
                    isSepolia ? (
                      <button
                        onClick={disconnect}
                        className="px-4 py-2 text-sm font-normal text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors"
                      >
                        {account?.slice(0, 6)}...{account?.slice(-4)}
                      </button>
                    ) : (
                      <button
                        onClick={switchToSepolia}
                        className="px-4 py-2 text-sm font-normal text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
                      >
                        切换到 Sepolia
                      </button>
                    )
                  ) : (
                    <button
                      onClick={connect}
                      disabled={isConnecting || !isMetaMaskInstalled}
                      className="px-4 py-2 text-sm font-normal text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Wallet className="w-4 h-4 inline mr-2" />
                      {isConnecting ? '连接中...' : 'Connect Wallet'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="max-w-7xl mx-auto px-6 py-8">
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
                  {mockData?.payments?.length || 0} 笔支付记录。演示不需要连接钱包的资金流效果。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">总支付次数</span>
              <TrendingUp className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-light text-gray-900 dark:text-gray-100">
              {displayData?.stats?.totalPayments || 0}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">总支付金额</span>
              <span className="text-green-500">$</span>
            </div>
            <div className="text-2xl font-light text-gray-900 dark:text-gray-100">
              {displayData?.stats?.totalAmount || '0.00'} mETH
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">供应商数量</span>
              <Users className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-light text-gray-900 dark:text-gray-100">
              {displayData?.stats?.supplierCount || 0}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">平均支付</span>
              <TrendingUp className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-2xl font-light text-gray-900 dark:text-gray-100">
              {displayData?.stats?.averagePayment || '0.00'} mETH
            </div>
          </div>
        </div>

        {/* 支付网络可视化 */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-light text-gray-900 dark:text-gray-100 mb-4">
            支付网络可视化
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            主钱包到供应商的资金流向图 (模拟数据)
          </p>
          <div className="h-[500px]">
            <PaymentNetworkGraph
              suppliers={displayData?.suppliers || []}
              payments={displayData?.payments || []}
            />
          </div>
        </div>

        {/* 支付详情表格 */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-light text-gray-900 dark:text-gray-100 mb-4">支付详情</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            共 {displayData?.payments?.length || 0} 笔支付记录
          </p>
          
          {(!displayData?.payments || displayData.payments.length === 0) ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              没有支付记录
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="text-left py-3 px-4 text-sm font-normal text-gray-500 dark:text-gray-400">
                      ID
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-normal text-gray-500 dark:text-gray-400">
                      发送方
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-normal text-gray-500 dark:text-gray-400">
                      接收方
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-normal text-gray-500 dark:text-gray-400">
                      金额
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-normal text-gray-500 dark:text-gray-400">
                      类别
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-normal text-gray-500 dark:text-gray-400">
                      时间
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-normal text-gray-500 dark:text-gray-400">
                      状态
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayData.payments.map((payment, index) => (
                    <tr
                      key={payment.id || index}
                      className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">
                        {payment.id || index + 1}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 font-mono">
                        {payment.sender?.slice(0, 6)}...{payment.sender?.slice(-4)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 font-mono">
                        {payment.recipient?.slice(0, 6)}...{payment.recipient?.slice(-4)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">
                        {payment.amount} ETH
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {payment.category || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(payment.timestamp).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-1 text-xs rounded ${
                            payment.status === 'completed'
                              ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                              : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'
                          }`}
                        >
                          {payment.status === 'completed' ? '已完成' : '处理中'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

