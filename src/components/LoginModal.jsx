import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Wallet, Mail, X } from 'lucide-react'
import { ethers } from 'ethers'

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [loginMethod, setLoginMethod] = useState('main') // 'main', 'email'
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  // MetaMask登录
  const handleMetaMaskLogin = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        setIsLoading(true)
        setError('')
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
        const address = accounts[0]
        
        // 保存到数据库
        await saveUserToDatabase({
          wallet_address: address,
          login_method: 'metamask',
          email: null
        })
        
        onLoginSuccess({
          address,
          method: 'metamask'
        })
        onClose()
      } catch (error) {
        console.error('MetaMask login error:', error)
        setError('Failed to connect MetaMask. Please try again.')
      } finally {
        setIsLoading(false)
      }
    } else {
      setError('MetaMask is not installed. Please install MetaMask extension.')
    }
  }

  // 支付宝登录（模拟）
  const handleAlipayLogin = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      // 模拟支付宝登录流程
      // 实际应用中需要集成支付宝OAuth
      alert('支付宝登录功能即将上线！\n\nAlipay login coming soon!\n\n目前请使用MetaMask或邮箱登录。')
      
      // 生成新钱包
      const wallet = ethers.Wallet.createRandom()
      const address = wallet.address
      const privateKey = wallet.privateKey
      
      // 保存到数据库
      await saveUserToDatabase({
        wallet_address: address,
        login_method: 'alipay',
        email: null,
        encrypted_private_key: privateKey // 实际应用中需要加密
      })
      
      onLoginSuccess({
        address,
        method: 'alipay',
        isNewWallet: true
      })
      onClose()
    } catch (error) {
      console.error('Alipay login error:', error)
      setError('Failed to login with Alipay. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // 邮箱登录并生成钱包
  const handleEmailLogin = async (e) => {
    e.preventDefault()
    
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }

    try {
      setIsLoading(true)
      setError('')
      
      // 生成新钱包
      const wallet = ethers.Wallet.createRandom()
      const address = wallet.address
      const privateKey = wallet.privateKey
      const mnemonic = wallet.mnemonic.phrase
      
      // 保存到数据库
      await saveUserToDatabase({
        wallet_address: address,
        login_method: 'email',
        email: email,
        encrypted_private_key: privateKey, // 实际应用中需要加密
        encrypted_mnemonic: mnemonic // 实际应用中需要加密
      })
      
      // 显示助记词给用户（实际应用中应该更安全地处理）
      alert(`Welcome! A new wallet has been created for you.\n\nYour wallet address: ${address}\n\nIMPORTANT: Please save your recovery phrase securely:\n\n${mnemonic}\n\nThis phrase can recover your wallet. Keep it safe and never share it!`)
      
      onLoginSuccess({
        address,
        method: 'email',
        email,
        isNewWallet: true,
        mnemonic
      })
      onClose()
    } catch (error) {
      console.error('Email login error:', error)
      setError('Failed to create wallet. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // 保存用户到数据库
  const saveUserToDatabase = async (userData) => {
    try {
      // 调用后端API保存用户数据
      // 实际应用中需要实现后端API
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...userData,
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString()
        })
      })
      
      if (!response.ok) {
        console.warn('Failed to save user to database')
      }
    } catch (error) {
      console.error('Database save error:', error)
      // 不阻止登录流程
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        {loginMethod === 'main' ? (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-semibold">Connect to Protocol Bank</CardTitle>
              <CardDescription className="text-gray-500 mt-2">
                Choose your preferred login method
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pb-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* MetaMask登录 - 主要推荐 */}
              <Button
                onClick={handleMetaMaskLogin}
                disabled={isLoading}
                className="w-full h-14 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium text-base"
              >
                <Wallet className="h-5 w-5 mr-3" />
                Connect with MetaMask
              </Button>

              {/* 支付宝登录 - 主要推荐 */}
              <Button
                onClick={handleAlipayLogin}
                disabled={isLoading}
                className="w-full h-14 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium text-base"
              >
                <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                </svg>
                使用支付宝登录 (Alipay)
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-400">or</span>
                </div>
              </div>

              {/* 邮箱登录 - 不显眼的选项 */}
              <button
                onClick={() => setLoginMethod('email')}
                className="w-full text-sm text-gray-400 hover:text-gray-600 underline"
              >
                Continue with Email
              </button>

              <p className="text-xs text-gray-400 text-center mt-4">
                By connecting, you agree to our Terms of Service and Privacy Policy
              </p>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader>
              <button
                onClick={() => {
                  setLoginMethod('main')
                  setError('')
                  setEmail('')
                }}
                className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center"
              >
                ← Back
              </button>
              <CardTitle className="text-xl font-semibold">Email Login</CardTitle>
              <CardDescription className="text-gray-500 mt-2">
                A new wallet will be automatically created for you
              </CardDescription>
            </CardHeader>

            <CardContent>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full"
                    required
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 px-4 py-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> A secure crypto wallet will be automatically generated for you. 
                    You'll receive a recovery phrase - please save it securely!
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {isLoading ? 'Creating Wallet...' : 'Create Wallet & Login'}
                </Button>
              </form>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  )
}

