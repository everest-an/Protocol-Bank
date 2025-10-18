
import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { 
  Wallet, 
  CreditCard, 
  TrendingUp, 
  Shield, 
  Zap, 
  Users, 
  ArrowUpRight, 
  ArrowDownLeft,
  Eye,
  EyeOff,
  Settings,
  Bell,
  Search,
  Plus,
  Send,
  Repeat,
  PiggyBank,
  BarChart3,
  Globe,
  Smartphone,
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
      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <img src={protocolBankLogo} alt="Protocol Bank" className="h-6 w-6" />
                <span className="text-lg font-medium text-gray-900">Protocol Bank</span>
              </div>
              <div className="hidden md:flex space-x-8">
                <button className="text-gray-600 hover:text-gray-900 font-normal text-sm transition-colors">Dashboard</button>
                <button className="text-gray-600 hover:text-gray-900 font-normal text-sm transition-colors">Payments</button>
                <button className="text-gray-600 hover:text-gray-900 font-normal text-sm transition-colors">DeFi</button>
                <button className="text-gray-600 hover:text-gray-900 font-normal text-sm transition-colors">Business</button>
                <button className="text-gray-600 hover:text-gray-900 font-normal text-sm transition-colors">Global Network</button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input 
                  type="text" 
                  placeholder="Search transactions..." 
                  className="pl-10 pr-4 py-2 bg-gray-50/50 border-0 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-200 text-sm w-64"
                />
              </div>
              <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
                <Settings className="h-4 w-4" />
              </Button>
              <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-white text-sm font-medium">
                U
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
        {/* Balance Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-medium text-gray-900 mb-1">Welcome to the Future of Global Payments</h1>
              <p className="text-gray-500 text-sm">Protocol Bank: Your SWIFT alternative for seamless cross-border transactions.</p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleBalanceVisibility}
              className="text-gray-400 hover:text-gray-600"
            >
              {balanceVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Balance */}
            <Card className="balance-card border-0 shadow-sm">
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

            {/* Crypto Balance */}
            <Card className="glass-card border-0 shadow-sm">
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
                  +8.2% today
                </div>
              </CardContent>
            </Card>

            {/* Fiat Balance */}
            <Card className="glass-card border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Fiat Accounts</div>
                  <MoreHorizontal className="h-4 w-4 text-gray-400" />
                </div>
                <div className="text-2xl font-light text-gray-900 mb-2">
                  {balanceVisible ? '$36,612.76' : '••••••••'}
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <Wallet className="h-3 w-3 mr-1" />
                  3 accounts
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-4 mb-12">
          <Button className="minimal-button h-16 flex-col space-y-2 text-gray-700 hover:text-gray-900">
            <Send className="h-5 w-5" />
            <span className="text-xs font-normal">Send</span>
          </Button>
          <Button className="minimal-button h-16 flex-col space-y-2 text-gray-700 hover:text-gray-900">
            <Plus className="h-5 w-5" />
            <span className="text-xs font-normal">Request</span>
          </Button>
          <Button className="minimal-button h-16 flex-col space-y-2 text-gray-700 hover:text-gray-900">
            <Repeat className="h-5 w-5" />
            <span className="text-xs font-normal">Exchange</span>
          </Button>
          <Button className="minimal-button h-16 flex-col space-y-2 text-gray-700 hover:text-gray-900">
            <PiggyBank className="h-5 w-5" />
            <span className="text-xs font-normal">Invest</span>
          </Button>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-5 bg-gray-50/50 border-0 p-1">
            <TabsTrigger value="dashboard" className="text-xs font-normal data-[state=active]:bg-white data-[state=active]:shadow-sm">Dashboard</TabsTrigger>
            <TabsTrigger value="defi" className="text-xs font-normal data-[state=active]:bg-white data-[state=active]:shadow-sm">DeFi Services</TabsTrigger>
            <TabsTrigger value="business" className="text-xs font-normal data-[state=active]:bg-white data-[state=active]:shadow-sm">Business</TabsTrigger>
            <TabsTrigger value="payments" className="text-xs font-normal data-[state=active]:bg-white data-[state=active]:shadow-sm">Payments</TabsTrigger>
            <TabsTrigger value="global_network" className="text-xs font-normal data-[state=active]:bg-white data-[state=active]:shadow-sm">Global Network</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Transactions */}
              <Card className="glass-card border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-medium text-gray-900">Recent Activity</CardTitle>
                  <CardDescription className="text-sm text-gray-500">Your latest transactions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center">
                        <ArrowDownLeft className="h-4 w-4 text-green-600" />
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
                  <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center">
                        <ArrowUpRight className="h-4 w-4 text-gray-600" />
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
                  <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center">
                        <CreditCard className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Vendor Payment</p>
                        <p className="text-xs text-gray-500">Auto-split settlement</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">-$3,200.00</p>
                      <p className="text-xs text-gray-500">2 days ago</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Portfolio Performance */}
              <Card className="glass-card border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-medium text-gray-900">Portfolio</CardTitle>
                  <CardDescription className="text-sm text-gray-500">Investment performance overview</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">Solana (SOL)</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">$4,234.56</p>
                        <p className="text-xs text-green-600">+15.2%</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">Ethereum (ETH)</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">$12,567.89</p>
                        <p className="text-xs text-green-600">+8.7%</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">USDC Stablecoin</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">$25,000.00</p>
                        <p className="text-xs text-gray-500">0.0%</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="defi" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="glass-card border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-medium text-gray-900 flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>Automated Lending</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-500">AMM-based smart lending services</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Current APY</span>
                    <Badge variant="secondary" className="text-xs">12.5% APY</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Invested</span>
                    <span className="text-sm font-medium text-gray-900">$15,000</span>
                  </div>
                  <Button className="w-full minimal-button text-xs">Manage Investment</Button>
                </CardContent>
              </Card>

              <Card className="glass-card border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-medium text-gray-900 flex items-center space-x-2">
                    <Zap className="h-4 w-4" />
                    <span>Streaming Payments</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-500">Real-time salary and payment streams</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Active Streams</span>
                    <Badge className="text-xs">3 streams</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Monthly Income</span>
                    <span className="text-sm font-medium text-gray-900">$8,500</span>
                  </div>
                  <Button className="w-full minimal-button text-xs">Setup Stream</Button>
                </CardContent>
              </Card>

              <Card className="glass-card border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-medium text-gray-900 flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>Cross-chain Trading</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-500">Solana & Ethereum interoperability</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Supported Networks</span>
                    <Badge variant="outline" className="text-xs">Solana + ETH</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Trading Fee</span>
                    <span className="text-sm font-medium text-gray-900">0.1%</span>
                  </div>
                  <Button className="w-full minimal-button text-xs">Start Trading</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="business" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="glass-card border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>Auto-split Settlement</span>
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-500">Smart vendor payment management</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600">Virtual Master Account</span>
                    <Badge variant="secondary" className="text-xs">Active</Badge>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600">Sub-accounts</span>
                    <span className="text-sm font-medium text-gray-900">12 accounts</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600">Monthly Volume</span>
                    <span className="text-sm font-medium text-gray-900">$45,600</span>
                  </div>
                  <Button className="w-full minimal-button text-sm">Configure Rules</Button>
                </CardContent>
              </Card>

              <Card className="glass-card border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                    <Shield className="h-4 w-4" />
                    <span>Compliance Management</span>
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-500">KYC/AML automated processing</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600">KYC Status</span>
                    <Badge className="bg-green-50 text-green-700 text-xs">Verified</Badge>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600">Risk Rating</span>
                    <Badge variant="outline" className="text-xs">Low Risk</Badge>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600">Compliance Check</span>
                    <Badge className="bg-green-50 text-green-700 text-xs">Passed</Badge>
                  </div>
                  <Button className="w-full minimal-button text-sm">View Details</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="payments" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="glass-card border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-medium text-gray-900 flex items-center space-x-2">
                    <CreditCard className="h-4 w-4" />
                    <span>NFC Payments</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-500">Near-field communication setup</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">NFC Status</span>
                    <Badge className="bg-green-50 text-green-700 text-xs">Enabled</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Daily Limit</span>
                    <span className="text-sm font-medium text-gray-900">$1,000</span>
                  </div>
                  <Button className="w-full minimal-button text-xs">Manage Settings</Button>
                </CardContent>
              </Card>

              <Card className="glass-card border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-medium text-gray-900 flex items-center space-x-2">
                    <Smartphone className="h-4 w-4" />
                    <span>Face Recognition</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-500">Biometric security login</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Recognition Status</span>
                    <Badge className="bg-green-50 text-green-700 text-xs">Setup</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Security Level</span>
                    <Badge className="text-xs">High</Badge>
                  </div>
                  <Button className="w-full minimal-button text-xs">Reset Setup</Button>
                </CardContent>
              </Card>

              <Card className="glass-card border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-medium text-gray-900 flex items-center space-x-2">
                    <Globe className="h-4 w-4" />
                    <span>Auto Payments</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-500">Scheduled and conditional payments</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Active Rules</span>
                    <Badge className="text-xs">5 rules</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Monthly Executions</span>
                    <span className="text-sm font-medium text-gray-900">23 times</span>
                  </div>
                  <Button className="w-full minimal-button text-xs">Create Rule</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="global_network" className="space-y-8">
            <Card className="glass-card border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                  <Globe className="h-4 w-4" />
                  <span>Global Payment Network</span>
                </CardTitle>
                <CardDescription className="text-sm text-gray-500">Seamless integration with the world's leading payment systems.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <p className="text-lg font-bold text-gray-700">CHIPS</p>
                  </div>
                  <p className="text-xs text-gray-500">USA</p>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <p className="text-lg font-bold text-gray-700">CHAPS</p>
                  </div>
                  <p className="text-xs text-gray-500">UK</p>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <p className="text-lg font-bold text-gray-700">Fedwire</p>
                  </div>
                  <p className="text-xs text-gray-500">USA</p>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <p className="text-lg font-bold text-gray-700">TARGET2</p>
                  </div>
                  <p className="text-xs text-gray-500">Europe</p>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <p className="text-lg font-bold text-gray-700">CIPS</p>
                  </div>
                  <p className="text-xs text-gray-500">China</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </main>
    </div>
  )
}

export default App

