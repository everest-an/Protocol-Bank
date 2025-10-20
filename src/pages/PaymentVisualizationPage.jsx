import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { 
  Wallet, 
  RefreshCw, 
  Activity, 
  DollarSign, 
  Users, 
  TrendingUp,
  Building2,
  ExternalLink,
  ArrowUpDown
} from 'lucide-react'
import PaymentNetworkGraph from '../components/payment-visualization/PaymentNetworkGraph.jsx'

export default function PaymentVisualizationPage() {
  const [isConnected, setIsConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState(null)
  const [stats, setStats] = useState({
    totalPayments: 10,
    totalAmount: '15.5000 ETH',
    supplierCount: 5,
    averagePayment: '1.5500 ETH'
  })

  const [suppliers, setSuppliers] = useState([
    {
      id: 1,
      name: '科技供应商 A',
      brand: 'TechBrand',
      category: '技术服务',
      address: '0x1234...7890',
      amount: '5.0000 ETH',
      percentage: 32.26,
      paymentCount: 2,
      profitMargin: 15.00
    },
    {
      id: 2,
      name: '云服务提供商 E',
      brand: 'CloudServe',
      category: '云计算',
      address: '0x5678...1234',
      amount: '4.0000 ETH',
      percentage: 25.81,
      paymentCount: 2,
      profitMargin: 18.00
    },
    {
      id: 3,
      name: '原材料供应商 B',
      brand: 'MaterialCo',
      category: '原材料',
      address: '0x2345...8901',
      amount: '3.0000 ETH',
      percentage: 19.35,
      paymentCount: 2,
      profitMargin: 12.00
    },
    {
      id: 4,
      name: '物流服务商 C',
      brand: 'LogisticsPro',
      category: '物流运输',
      address: '0x3456...9012',
      amount: '2.0000 ETH',
      percentage: 12.90,
      paymentCount: 2,
      profitMargin: 8.00
    },
    {
      id: 5,
      name: '设计咨询公司 D',
      brand: 'DesignHub',
      category: '咨询服务',
      address: '0x4567...0123',
      amount: '1.5000 ETH',
      percentage: 9.68,
      paymentCount: 2,
      profitMargin: 20.00
    }
  ])

  const [payments, setPayments] = useState([
    {
      id: 1,
      supplier: '云服务提供商 E',
      brand: 'CloudServe',
      amount: '1.5000 ETH',
      category: '云计算',
      status: 'Completed',
      timestamp: '2025/10/20 08:42',
      txHash: '0x4567...f123'
    },
    {
      id: 2,
      supplier: '设计咨询公司 D',
      brand: 'DesignHub',
      amount: '700.00 mETH',
      category: '咨询服务',
      status: 'Completed',
      timestamp: '2025/10/20 03:42',
      txHash: '0x3456...ef12'
    },
    {
      id: 3,
      supplier: '物流服务商 C',
      brand: 'LogisticsPro',
      amount: '1.0000 ETH',
      category: '物流运输',
      status: 'Completed',
      timestamp: '2025/10/19 21:42',
      txHash: '0x2345...def1'
    }
  ])

  const handleConnectWallet = () => {
    // Mock wallet connection
    setIsConnected(true)
    setWalletAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb')
  }

  const handleRefresh = () => {
    // Refresh data logic
    console.log('Refreshing data...')
  }

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <Card className="backdrop-blur-sm bg-white/80 border-gray-200/50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">{label}</span>
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-semibold text-gray-900">{value}</div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-normal text-gray-900 mb-2">支付可视化</h2>
          <p className="text-sm text-gray-500">实时追踪企业支付网络和资金流向</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            className="border-gray-200"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新数据
          </Button>
          {!isConnected ? (
            <Button onClick={handleConnectWallet} className="bg-gray-900 hover:bg-gray-800">
              <Wallet className="w-4 h-4 mr-2" />
              连接钱包
            </Button>
          ) : (
            <div className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-mono text-gray-700">
              {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={Activity} 
          label="总支付次数" 
          value={stats.totalPayments}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard 
          icon={DollarSign} 
          label="总支付金额" 
          value={stats.totalAmount}
          color="bg-green-50 text-green-600"
        />
        <StatCard 
          icon={Users} 
          label="供应商数量" 
          value={stats.supplierCount}
          color="bg-purple-50 text-purple-600"
        />
        <StatCard 
          icon={TrendingUp} 
          label="平均支付" 
          value={stats.averagePayment}
          color="bg-yellow-50 text-yellow-600"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visualization */}
        <div className="lg:col-span-2">
          <Card className="backdrop-blur-sm bg-white/80 border-gray-200/50">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-gray-900">
                支付网络图
              </CardTitle>
              <p className="text-sm text-gray-500">主钱包到供应商的资金流向</p>
            </CardHeader>
            <CardContent>
              <PaymentNetworkGraph suppliers={suppliers} />
            </CardContent>
          </Card>
        </div>

        {/* Supplier List */}
        <div className="lg:col-span-1">
          <Card className="backdrop-blur-sm bg-white/80 border-gray-200/50">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                供应商列表
              </CardTitle>
              <p className="text-sm text-gray-500">共 {suppliers.length} 个供应商</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {suppliers.map((supplier, index) => (
                  <div key={supplier.id} className="p-4 rounded-lg bg-gray-50/50 hover:bg-gray-100/50 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">#{index + 1}</span>
                          <h3 className="font-medium text-gray-900">{supplier.name}</h3>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">品牌: {supplier.brand}</p>
                        <p className="text-xs text-gray-500 mt-1">{supplier.category}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">{supplier.amount}</div>
                        <div className="text-xs text-gray-500">{supplier.percentage.toFixed(2)}%</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                      <span>地址: <span className="text-gray-900 font-mono">{supplier.address}</span></span>
                      <div className="flex items-center gap-3">
                        <span>支付: <span className="text-gray-900">{supplier.paymentCount}</span></span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          <span className="text-yellow-600">{supplier.profitMargin}%</span>
                        </span>
                      </div>
                    </div>
                    <div className="bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-green-500 h-full transition-all duration-500"
                        style={{ width: `${supplier.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment Table */}
      <Card className="backdrop-blur-sm bg-white/80 border-gray-200/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-medium text-gray-900">支付详情</CardTitle>
              <p className="text-sm text-gray-500 mt-1">共 {payments.length} 笔支付记录</p>
            </div>
            <select className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-900">
              <option>全部类别</option>
              <option>技术服务</option>
              <option>云计算</option>
              <option>原材料</option>
              <option>物流运输</option>
              <option>咨询服务</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200">
                <tr className="text-left">
                  <th className="pb-3 text-sm font-medium text-gray-600">供应商</th>
                  <th className="pb-3 text-sm font-medium text-gray-600">品牌</th>
                  <th className="pb-3 text-sm font-medium text-gray-600 cursor-pointer hover:text-gray-900">
                    <div className="flex items-center gap-1">
                      金额 <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="pb-3 text-sm font-medium text-gray-600">类别</th>
                  <th className="pb-3 text-sm font-medium text-gray-600">状态</th>
                  <th className="pb-3 text-sm font-medium text-gray-600">时间</th>
                  <th className="pb-3 text-sm font-medium text-gray-600">交易哈希</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3">
                      <div className="font-medium text-gray-900">{payment.supplier}</div>
                    </td>
                    <td className="py-3 text-gray-600">{payment.brand}</td>
                    <td className="py-3">
                      <span className="font-semibold text-green-600">{payment.amount}</span>
                    </td>
                    <td className="py-3 text-gray-600">{payment.category}</td>
                    <td className="py-3">
                      <span className="text-green-600 font-medium">{payment.status}</span>
                    </td>
                    <td className="py-3 text-gray-600">{payment.timestamp}</td>
                    <td className="py-3">
                      <a 
                        href={`https://sepolia.etherscan.io/tx/${payment.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 flex items-center gap-1 font-mono text-sm"
                      >
                        {payment.txHash}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

