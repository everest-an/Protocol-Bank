import { useState, useEffect } from 'react'
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
  MoreHorizontal,
  Wallet,
  FileText,
  MessageCircle,
  Waves,
  Calendar,
  Users as UsersIcon
} from 'lucide-react'
import './App.css'
import protocolBankLogo from './assets/new-protocol-bank-logo.png'
import FlowPaymentVisualization from './pages/FlowPaymentVisualization.jsx'
import SuppliersPage from './pages/SuppliersPage.jsx'
import BatchPayment from './pages/BatchPayment.jsx'
import ScheduledPayment from './pages/ScheduledPaymentV2.jsx'
import DataAnalytics from './pages/DataAnalyticsV2.jsx'
import LoginModal from './components/LoginModal.jsx'
import ThemeToggle from './components/ThemeToggle.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import DropdownMenu from './components/DropdownMenu.jsx'

function App() {
  const [balanceVisible, setBalanceVisible] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [walletAddress, setWalletAddress] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [userInfo, setUserInfo] = useState(null)

  // Open login modal
  const openLoginModal = () => {
    setShowLoginModal(true)
  }

  // Handle successful login
  const handleLoginSuccess = (loginData) => {
    setWalletAddress(loginData.address)
    setUserInfo(loginData)
    
    // Store in localStorage
    localStorage.setItem('protocolbank_user', JSON.stringify(loginData))
    
    // Show welcome message for new wallets
    if (loginData.isNewWallet) {
      console.log('New wallet created:', loginData.address)
    }
  }

  // Check if user is already logged in
  useEffect(() => {
    const checkExistingLogin = async () => {
      // Check localStorage for existing login
      const savedUser = localStorage.getItem('protocolbank_user')
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser)
          setWalletAddress(userData.address)
          setUserInfo(userData)
        } catch (error) {
          console.error('Error loading saved user:', error)
          localStorage.removeItem('protocolbank_user')
        }
      }
      
      // Also check MetaMask connection
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' })
          if (accounts.length > 0 && !savedUser) {
            setWalletAddress(accounts[0])
            setUserInfo({ address: accounts[0], method: 'metamask' })
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error)
        }
      }
    }
    checkExistingLogin()
  }, [])

  const toggleBalanceVisibility = () => {
    setBalanceVisible(!balanceVisible)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-200">
      {/* Header */}
      <header className="border-b border-gray-100 dark:border-gray-700 sticky top-0 z-50 bg-white dark:bg-black transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <img src={protocolBankLogo} alt="Protocol Bank" className="h-8 w-8" />
                <span className="text-lg font-normal text-gray-900 dark:text-white">Protocol Bank</span>
              </div>
              <nav className="hidden md:flex space-x-6">
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className={`text-sm font-medium ${activeTab === 'dashboard' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`}
                >
                  Dashboard
                </button>
                <DropdownMenu
                  label="Payments"
                  items={[
                    { id: 'payments', label: 'Flow Payment', icon: Waves, description: 'Real-time payment streams' },
                    { id: 'batch', label: 'Batch Payment', icon: Send, description: 'Multiple payments at once' },
                    { id: 'schedule', label: 'Scheduled Payment', icon: Calendar, description: 'Recurring payments' }
                  ]}
                  activeItem={activeTab}
                  onItemClick={setActiveTab}
                  isActive={activeTab === 'payments' || activeTab === 'batch' || activeTab === 'schedule'}
                />
                <button 
                  onClick={() => setActiveTab('suppliers')}
                  className={`text-sm font-medium ${activeTab === 'suppliers' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`}
                >
                  Suppliers
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`text-sm font-medium ${activeTab === 'analytics' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`}
                >
                  Analytics
                </button>
              </nav>
            </div>
            <div className="flex items-center space-x-3">
              {/* 搜索框 - 桌面端显示 */}
              <div className="relative hidden lg:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input 
                  type="text" 
                  placeholder="Search transactions..." 
                  className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border-0 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-200 dark:focus:ring-gray-700 text-sm w-56 transition-colors"
                />
              </div>
              
              {/* 通知图标 */}
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <Bell className="h-5 w-5" />
              </Button>
              
              {/* 更多菜单 */}
              <div className="relative group">
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </Button>
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-100 dark:border-gray-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <button
                    onClick={() => window.open('https://discord.gg/AbmGXYjr3U', '_blank')}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center space-x-2 rounded-t-lg"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Join Discord</span>
                  </button>
                  <button
                    onClick={() => window.open('https://github.com/everest-an/Protocol-Bank/blob/main/docs/protocol_bank_complete_whitepaper.md', '_blank')}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center space-x-2 rounded-b-lg"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Whitepaper</span>
                  </button>
                </div>
              </div>
              
              {/* 主题切换 */}
              <ThemeToggle />
              
              {/* 分隔线 */}
              <div className="h-6 w-px bg-gray-200 dark:bg-gray-800"></div>
              {walletAddress ? (
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                  <Wallet className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-700 font-medium">
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </span>
                </div>
              ) : (
                <Button 
                  onClick={openLoginModal}
                  className="bg-gray-900 hover:bg-gray-800 text-white text-sm px-4 py-2 h-9"
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Connect Wallet
                </Button>
              )}
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
              <h1 className="text-2xl font-normal text-gray-900 dark:text-white mb-1">Welcome to the Future of Global Payments</h1>
              <p className="text-sm text-gray-500 dark:text-gray-300">Protocol Bank: Your SWIFT alternative for seamless cross-border transactions.</p>
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
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Balance</div>
                  <MoreHorizontal className="h-4 w-4 text-gray-400" />
                </div>
                <div className="text-3xl font-light text-gray-900 dark:text-white mb-2">
                  {balanceVisible ? '$125,847.32' : '••••••••'}
                </div>
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12.5% this month
                </div>
              </CardContent>
            </Card>

            {/* Crypto Assets */}
            <Card className="border border-gray-100 shadow-sm">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Crypto Assets</div>
                  <MoreHorizontal className="h-4 w-4 text-gray-400" />
                </div>
                <div className="text-2xl font-light text-gray-900 dark:text-white mb-2">
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
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Fiat Accounts</div>
                  <MoreHorizontal className="h-4 w-4 text-gray-400" />
                </div>
                <div className="text-2xl font-light text-gray-900 dark:text-white mb-2">
                  {balanceVisible ? '$36,612.76' : '••••••••'}
                </div>
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
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

        {/* Tab Content */}
        {activeTab === 'payments' && (
          <ErrorBoundary>
            <FlowPaymentVisualization />
          </ErrorBoundary>
        )}
        {activeTab === 'batch' && <BatchPayment />}
        {activeTab === 'schedule' && <ScheduledPayment />}
        {activeTab === 'suppliers' && <SuppliersPage />}
        {activeTab === 'analytics' && <DataAnalytics />}
        
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card className="border border-gray-100 shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">Recent Activity</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Your latest transactions</p>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                        <ArrowDownLeft className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Payment received</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">From ABC Company</p>
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
                        <p className="text-sm font-medium text-gray-900 dark:text-white">DeFi Investment</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Solana Liquidity Pool</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">-$1,000.00</p>
                      <p className="text-xs text-gray-500">Yesterday</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                        <Send className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Vendor Payment</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Auto Insurance</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">-$3,200.00</p>
                      <p className="text-xs text-gray-500">2 days ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Portfolio */}
            <Card className="border border-gray-100 shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">Portfolio</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Investment performance overview</p>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                        <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Solana (SOL)</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">$4,234.56</p>
                      <p className="text-xs text-green-600">+15.2%</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                        <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Ethereum (ETH)</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">$12,567.89</p>
                      <p className="text-xs text-green-600">+8.7%</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                        <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">USDC Stablecoin</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">$25,000.00</p>
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

      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Footer with Global Network link */}
      <footer className="border-t border-gray-100 dark:border-gray-800 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-center">
            <button
              onClick={() => setActiveTab('network')}
              className="text-sm text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
            >
              Global Network
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App

