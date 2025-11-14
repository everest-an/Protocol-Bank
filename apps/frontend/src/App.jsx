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
  Lock,
  Users as UsersIcon
} from 'lucide-react'
import './App.css'
import protocolBankLogo from './assets/new-protocol-bank-logo.png'
import FlowPaymentVisualization from './pages/FlowPaymentVisualization.jsx'
import Automation from './pages/Automation.jsx'
import UnifiedAnalytics from './pages/UnifiedAnalytics.jsx'
import CashFlowAnalytics from './pages/CashFlowAnalytics.jsx'
import AnalyticsEnhanced from './pages/AnalyticsEnhanced.jsx'
import StreamPaymentPage from './pages/StreamPaymentPage.jsx'
import PaymentsPage from './pages/PaymentsPage.jsx'
import LandingPage from './pages/LandingPage.jsx'
import ClearingHousePage from './pages/ClearingHousePage.jsx'

import SimpleLoginModal from './components/SimpleLoginModal.jsx'
import ThemeToggle from './components/ThemeToggle.jsx'
import LanguageSelector from './components/LanguageSelector.jsx'
import MobileMenu from './components/MobileMenu.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import DropdownMenu from './components/DropdownMenu.jsx'
import { generateFullMockData } from './utils/mockData.js'
import { Web3Provider, useWeb3 } from './contexts/Web3Context.jsx'
import UserMenu from './components/UserMenu.jsx'
import authUtils from './utils/auth'

import SendTransactionModal from './components/SendTransactionModal.jsx'
import MobileNav from './components/MobileNav.jsx'
import { Menu } from 'lucide-react'

function AppContent() {
  const { account, balance, isConnecting, connectWallet, disconnectWallet, isConnected } = useWeb3()
  const [balanceVisible, setBalanceVisible] = useState(true)
  const [activeTab, setActiveTab] = useState('home')
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [userInfo, setUserInfo] = useState(null)
  const [showSendModal, setShowSendModal] = useState(false)
  const [showMobileNav, setShowMobileNav] = useState(false)
  
  // Global mock data for consistent data across all components
  const [globalMockData, setGlobalMockData] = useState(null)
  
  // Global real data from blockchain
  const [realSuppliers, setRealSuppliers] = useState([])
  const [realPayments, setRealPayments] = useState([])
  const [realStats, setRealStats] = useState({
    totalPayments: 0,
    totalAmount: '0',
    supplierCount: 0,
    averagePayment: '0'
  })
  const [testMode, setTestMode] = useState(false)
  
  // Initialize global mock data once
  useEffect(() => {
    setGlobalMockData(generateFullMockData())
  }, [])
  
  // Callback to update real data from FlowPaymentVisualization
  const handleDataUpdate = (data) => {
    if (data.suppliers) setRealSuppliers(data.suppliers)
    if (data.payments) setRealPayments(data.payments)
    if (data.stats) setRealStats(data.stats)
  }
  
  // Check if user is logged in on component mount
  useEffect(() => {
    const currentUser = authUtils.getCurrentUser();
    if (currentUser) {
      setUserInfo(currentUser);
    }
  }, []);
  
  // Handle logout
  const handleLogout = () => {
    authUtils.logout();
    setUserInfo(null);
    // Refresh page to reset state
    window.location.reload();
  };


  // Open login modal
  const openLoginModal = () => {
    setShowLoginModal(true)
  }
  // Handle successful login
  const handleLoginSuccess = (loginData) => {
    // For backend auth, loginData contains user info and token
    if (loginData.address) {
      // Wallet login
      setWalletAddress(loginData.address)
    }
    setUserInfo(loginData)
    
    // Store in localStorage
    localStorage.setItem('protocolbank_user', JSON.stringify(loginData))
    
    localStorage.setItem('protocolbank_user', JSON.stringify(loginData))
    
    // Show welcome message for new wallets
    if (loginData.isNewWallet) {
      // console.log('New wallet created:', loginData.address)
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
          // console.error('Error loading saved user:', error)
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
          // console.error('Error checking wallet connection:', error)
        }
      }
    }
    checkExistingLogin()
  }, [])

  // Handle hash-based routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(2) || 'payments' // Remove '#/' prefix, default to payments
      setActiveTab(hash)
    }

    // Set initial tab based on hash
    handleHashChange()

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange)

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, []) // Empty deps is fine - we only want to set up listener once

  // Update hash when activeTab changes (from button clicks)
  useEffect(() => {
    const currentHash = window.location.hash.slice(2)
    if (currentHash !== activeTab && activeTab) {
      window.location.hash = `/${activeTab}`
    }
  }, [activeTab])

  const toggleBalanceVisibility = () => {
    setBalanceVisible(!balanceVisible)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-200">
      {/* Header */}
      {/* 移动端导航菜单 */}
      <MobileNav
        isOpen={showMobileNav}
        onClose={() => setShowMobileNav(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isConnected={isConnected}
        account={account}
        balance={balance}
        connectWallet={connectWallet}
        disconnectWallet={disconnectWallet}
        isConnecting={isConnecting}
        theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
        toggleTheme={() => document.documentElement.classList.toggle('dark')}
        language="en"
        setLanguage={() => {}}
      />

      <header className="border-b border-gray-100 dark:border-gray-700 sticky top-0 z-[100] bg-white dark:bg-black transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex justify-between items-center h-16 gap-4">
            {/* 左侧：汉堡菜单 + Logo */}
            <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0 min-w-[180px] md:min-w-[220px]">
              {/* 移动端汉堡菜单按钮 */}
              <button
                onClick={() => setShowMobileNav(true)}
                className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Menu className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </button>
              
              <div className="flex items-center space-x-2 md:space-x-3">
                <img src={protocolBankLogo} alt="Protocol Bank" className="h-8 w-8 flex-shrink-0" />
                <span className="text-base md:text-lg font-normal text-gray-900 dark:text-white whitespace-nowrap">Protocol Bank</span>
              </div>
            </div>

            {/* 中间：导航菜单 */}
            <nav className="hidden md:flex items-center space-x-4 lg:space-x-8 flex-1 justify-center min-w-0 max-w-[600px]">
                <button 
                  onClick={() => setActiveTab('home')}
                  className={`text-sm font-medium whitespace-nowrap pb-1 border-b-2 transition-all duration-200 ${
                    activeTab === 'home' 
                      ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400' 
                      : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  Home
                </button>
                <button 
                  onClick={() => setActiveTab('payments')}
                  className={`text-sm font-medium whitespace-nowrap pb-1 border-b-2 transition-all duration-200 ${
                    activeTab === 'payments' 
                      ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400' 
                      : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  Payments
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`text-sm font-medium whitespace-nowrap pb-1 border-b-2 transition-all duration-200 ${
                    activeTab === 'analytics' 
                      ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400' 
                      : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  Analytics
                </button>
                <button
                  onClick={() => setActiveTab('automation')}
                  className={`text-sm font-medium whitespace-nowrap pb-1 border-b-2 transition-all duration-200 ${
                    activeTab === 'automation' 
                      ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400' 
                      : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  Automation
                </button>
                {/* Stream Payment moved to Payments page */}
                {/* ClearingHouse - Only for bank admin interface */}
                {/* <button
                  onClick={() => setActiveTab('clearing-house')}
                  className={`text-sm font-medium whitespace-nowrap pb-1 border-b-2 transition-all duration-200 ${
                    activeTab === 'clearing-house' 
                      ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400' 
                      : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  ClearingHouse
                </button> */}
            </nav>

            {/* 右侧：通知、设置、钱包 */}
            <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">
              {/* 主题切换 */}
              <ThemeToggle />
              
              {/* 分隔线 */}
              <div className="h-6 w-px bg-gray-200 dark:bg-gray-800"></div>
              {isConnected ? (
                <div className="flex items-center space-x-2">
                  {/* Send 按钮 - 只在大屏幕显示 */}
                  <Button
                    onClick={() => setShowSendModal(true)}
                    className="hidden lg:flex bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-2 h-9"
                  >
                    <Send className="h-4 w-4 mr-1.5" />
                    Send
                  </Button>
                  
                  {/* 钱包下拉菜单 */}
                  <div className="relative group">
                    <button className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg flex items-center space-x-2 transition-colors">
                      <Wallet className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                        {account.slice(0, 6)}...{account.slice(-4)}
                      </span>
                      <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {/* 下拉菜单内容 */}
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-100 dark:border-gray-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      {/* 余额显示 */}
                      <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Balance</div>
                        <div className="flex items-center space-x-2">
                          <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          <span className="text-lg text-gray-900 dark:text-white font-semibold">
                            {parseFloat(balance).toFixed(4)} ETH
                          </span>
                        </div>
                      </div>
                      
                      {/* 钱包地址 */}
                      <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Wallet Address</div>
                        <div className="text-sm text-gray-900 dark:text-white font-mono break-all">
                          {account}
                        </div>
                      </div>
                      
                      {/* 操作按钮 */}
                      <div className="p-2">
                        <button
                          onClick={() => setShowSendModal(true)}
                          className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center space-x-2 rounded-lg lg:hidden"
                        >
                          <Send className="h-4 w-4" />
                          <span>Send Payment</span>
                        </button>
                        <button
                          onClick={disconnectWallet}
                          className="w-full px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2 rounded-lg"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span>Disconnect</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : userInfo ? (
                <UserMenu onLogout={handleLogout} />
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
        {/* Tab Content */}

        {activeTab === 'home' && (
          <ErrorBoundary>
            {userInfo || isConnected ? (
              <FlowPaymentVisualization 
                sharedMockData={globalMockData}
                onDataUpdate={handleDataUpdate}
                externalTestMode={testMode}
                onTestModeChange={setTestMode}
              />
            ) : (
              <LandingPage onGetStarted={openLoginModal} />
            )}
          </ErrorBoundary>
        )}
        {activeTab === 'payments' && (
          <ErrorBoundary>
            <PaymentsPage />
          </ErrorBoundary>
        )}
        {activeTab === 'analytics' && (
          <ErrorBoundary>
            <AnalyticsEnhanced />
          </ErrorBoundary>
        )}
        {activeTab === 'automation' && (
          <ErrorBoundary>
            <Automation />
          </ErrorBoundary>
        )}
        {/* Stream Payment now integrated into Payments page */}
        {activeTab === 'clearing-house' && (
          <ErrorBoundary>
            <ClearingHousePage />
          </ErrorBoundary>
        )}
      </main>

      {/* Login Modal */}
      <SimpleLoginModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Send Transaction Modal */}
      <SendTransactionModal 
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
      />

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-gray-800 mt-16 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {/* Product */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Product</h3>
              <ul className="space-y-3">
                <li>
                  <a href="#features" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('network')}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Global Network
                  </button>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Resources</h3>
              <ul className="space-y-3">
                <li>
                  <a 
                    href="https://github.com/everest-an/Protocol-Bank/blob/main/docs/design/protocol_bank_complete_whitepaper.md" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  <a 
                    href="https://github.com/everest-an/Protocol-Bank/blob/main/docs/api/BACKEND_API_SUMMARY.md" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    API
                  </a>
                </li>
                <li>
                  <a 
                    href="https://github.com/everest-an/Protocol-Bank" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    GitHub
                  </a>
                </li>
              </ul>
            </div>

            {/* Community */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Community</h3>
              <ul className="space-y-3">
                <li>
                  <a 
                    href="https://discord.gg/AbmGXYjr3U" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Discord
                  </a>
                </li>
                <li>
                  <a 
                    href="https://twitter.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Twitter
                  </a>
                </li>
                <li>
                  <a 
                    href="https://t.me" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Telegram
                  </a>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Support</h3>
              <ul className="space-y-3">
                <li>
                  <a 
                    href="mailto:support@protocolbanks.com" 
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Contact Us
                  </a>
                </li>
                <li>
                  <a 
                    href="#help" 
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Help Center
                  </a>
                </li>
                <li>
                  <a 
                    href="#privacy" 
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="flex items-center space-x-2">
                <img src={protocolBankLogo} alt="Protocol Bank" className="h-6 w-6" />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  © 2025 Protocol Bank. All rights reserved.
                </span>
              </div>
              <div className="flex items-center space-x-6">
                <a href="#terms" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                  Terms of Service
                </a>
                <a href="#privacy" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                  Privacy
                </a>
                <a href="#cookies" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                  Cookies
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function App() {
  return (
    <Web3Provider>
      <AppContent />
    </Web3Provider>
  )
}

export default App

