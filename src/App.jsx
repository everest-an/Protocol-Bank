import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent } from '@/components/ui/card.jsx'
import { 
  Send, 
  Plus, 
  Repeat, 
  TrendingUp,
  Search,
  Bell,
  Settings,
  Eye,
  EyeOff,
  ArrowDownLeft,
  ArrowUpRight,
  MoreHorizontal
} from 'lucide-react'
import './App.css'
import protocolBankLogo from './assets/new-protocol-bank-logo.png'

function App() {
  const [balanceVisible, setBalanceVisible] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')

  const toggleBalanceVisibility = () => {
    setBalanceVisible(!balanceVisible)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 sticky top-0 z-50 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <img src={protocolBankLogo} alt="Protocol Bank" className="h-8 w-8" />
                <span className="text-lg font-normal text-gray-900">Protocol Bank</span>
              </div>
              <nav className="hidden md:flex space-x-6">
                <button className="text-sm text-gray-900 font-medium">Dashboard</button>
                <button className="text-sm text-gray-500 hover:text-gray-900">Payments</button>
                <button className="text-sm text-gray-500 hover:text-gray-900">DeFi</button>
                <button className="text-sm text-gray-500 hover:text-gray-900">Business</button>
                <button className="text-sm text-gray-500 hover:text-gray-900">Global Network</button>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input 
                  type="text" 
                  placeholder="Search transactions..." 
                  className="pl-10 pr-4 py-2 bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-200 text-sm w-64"
                />
              </div>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
                <Settings className="h-5 w-5" />
              </Button>
              <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-white text-sm font-medium">
                U
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-normal text-gray-900 mb-1">Welcome to the Future of Global Payments</h1>
              <p className="text-sm text-gray-500">Protocol Bank: Your SWIFT alternative for seamless cross-border transactions.</p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleBalanceVisibility}
              className="text-gray-400 hover:text-gray-600"
            >
              {balanceVisible ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
            </Button>
          </div>

          {/* Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Total Balance */}
            <Card className="border border-gray-100 shadow-sm">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Balance</div>
                  <MoreHorizontal className="h-4 w-4 text-gray-400" />
                </div>
                <div className="text-3xl font-light text-gray-900 mb-2">
                  {balanceVisible ? '$125,847.32' : '••••••••'}
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12.5% this month
                </div>
              </CardContent>
            </Card>

            {/* Crypto Assets */}
            <Card className="border border-gray-100 shadow-sm">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Crypto Assets</div>
                  <MoreHorizontal className="h-4 w-4 text-gray-400" />
                </div>
                <div className="text-2xl font-light text-gray-900 mb-2">
                  {balanceVisible ? '$89,234.56' : '••••••••'}
                </div>
                <div className="flex items-center text-xs text-green-600">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +3.2% today
                </div>
              </CardContent>
            </Card>

            {/* Fiat Accounts */}
            <Card className="border border-gray-100 shadow-sm">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Fiat Accounts</div>
                  <MoreHorizontal className="h-4 w-4 text-gray-400" />
                </div>
                <div className="text-2xl font-light text-gray-900 mb-2">
                  {balanceVisible ? '$36,612.76' : '••••••••'}
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mr-1"></span>
                  3 accounts
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-4 gap-3 mb-8">
            <Button variant="outline" className="h-14 flex items-center justify-center space-x-2 border-gray-200 hover:bg-gray-50">
              <Send className="h-4 w-4" />
              <span className="text-sm">Send</span>
            </Button>
            <Button variant="outline" className="h-14 flex items-center justify-center space-x-2 border-gray-200 hover:bg-gray-50">
              <Plus className="h-4 w-4" />
              <span className="text-sm">Request</span>
            </Button>
            <Button variant="outline" className="h-14 flex items-center justify-center space-x-2 border-gray-200 hover:bg-gray-50">
              <Repeat className="h-4 w-4" />
              <span className="text-sm">Exchange</span>
            </Button>
            <Button variant="outline" className="h-14 flex items-center justify-center space-x-2 border-gray-200 hover:bg-gray-50">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Invest</span>
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-100 mb-6">
          <div className="flex space-x-8">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'dashboard' 
                  ? 'border-gray-900 text-gray-900' 
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('defi')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'defi' 
                  ? 'border-gray-900 text-gray-900' 
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              DeFi Services
            </button>
            <button 
              onClick={() => setActiveTab('business')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'business' 
                  ? 'border-gray-900 text-gray-900' 
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              Business
            </button>
            <button 
              onClick={() => setActiveTab('payments')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'payments' 
                  ? 'border-gray-900 text-gray-900' 
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              Payments
            </button>
            <button 
              onClick={() => setActiveTab('global')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'global' 
                  ? 'border-gray-900 text-gray-900' 
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              Global Network
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card className="border border-gray-100 shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-base font-medium text-gray-900 mb-1">Recent Activity</h3>
                <p className="text-sm text-gray-500 mb-6">Your latest transactions</p>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                        <ArrowDownLeft className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Payment received</p>
                        <p className="text-xs text-gray-500">From ABC Company</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600">+$2,500.00</p>
                      <p className="text-xs text-gray-500">2h ago</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                        <ArrowUpRight className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">DeFi Investment</p>
                        <p className="text-xs text-gray-500">Solana Liquidity Pool</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">-$1,000.00</p>
                      <p className="text-xs text-gray-500">Yesterday</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                        <Send className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Vendor Payment</p>
                        <p className="text-xs text-gray-500">Auto Insurance</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">-$3,200.00</p>
                      <p className="text-xs text-gray-500">2 days ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Portfolio */}
            <Card className="border border-gray-100 shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-base font-medium text-gray-900 mb-1">Portfolio</h3>
                <p className="text-sm text-gray-500 mb-6">Investment performance overview</p>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                        <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Solana (SOL)</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">$4,234.56</p>
                      <p className="text-xs text-green-600">+15.2%</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                        <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Ethereum (ETH)</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">$12,567.89</p>
                      <p className="text-xs text-green-600">+8.7%</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                        <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">USDC Stablecoin</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">$25,000.00</p>
                      <p className="text-xs text-gray-500">+0.1%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab !== 'dashboard' && (
          <div className="text-center py-12">
            <p className="text-gray-500">Content for {activeTab} coming soon...</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App

