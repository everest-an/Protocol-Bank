import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Plus, Wallet, DollarSign, Loader2, AlertCircle } from 'lucide-react'
import { streamPaymentService } from '../services/backendService'
import { createContractService, getSupportedTokens, SEPOLIA_CHAIN_ID } from '../services/contractService'
import { useWeb3Wallet } from '../hooks/useWeb3Wallet'
import authUtils from '../utils/auth'

export default function StreamPaymentPage() {
  const [paymentType, setPaymentType] = useState('fiat') // 'fiat' or 'crypto'
  const [streams, setStreams] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Web3 wallet hook
  const {
    account,
    signer,
    chainId,
    isConnected,
    isConnecting,
    connectWallet,
    switchNetwork,
    getBalance,
  } = useWeb3Wallet()

  // Load streams on mount
  useEffect(() => {
    if (paymentType === 'fiat') {
      loadFiatStreams()
    } else if (paymentType === 'crypto' && isConnected) {
      loadCryptoStreams()
    }
  }, [paymentType, isConnected])

  // Load fiat streams from backend
  const loadFiatStreams = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const user = authUtils.getCurrentUser()
      if (!user) {
        setError('Please login first')
        return
      }
      
      const response = await streamPaymentService.getList(user.account_id)
      
      if (response.status === 'success') {
        setStreams(response.data.map(stream => ({
          ...stream,
          type: 'fiat',
          id: stream.stream_id,
          name: stream.stream_name || 'Unnamed Stream',
        })))
      }
    } catch (err) {
      setError(err.message || 'Failed to load streams')
    } finally {
      setLoading(false)
    }
  }

  // Load crypto streams from blockchain
  const loadCryptoStreams = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const contractService = createContractService(signer)
      
      // Get streams where user is sender
      const senderResult = await contractService.getStreamsBySender(account)
      // Get streams where user is recipient
      const recipientResult = await contractService.getStreamsByRecipient(account)
      
      if (senderResult.success && recipientResult.success) {
        const allStreamIds = [...new Set([...senderResult.streamIds, ...recipientResult.streamIds])]
        
        // Load details for each stream
        const streamPromises = allStreamIds.map(id => contractService.getStream(id))
        const streamResults = await Promise.all(streamPromises)
        
        const cryptoStreams = streamResults
          .filter(r => r.success)
          .map((r, index) => ({
            ...r.data,
            type: 'crypto',
            id: allStreamIds[index],
            name: `Stream #${allStreamIds[index]}`,
          }))
        
        setStreams(cryptoStreams)
      }
    } catch (err) {
      setError(err.message || 'Failed to load crypto streams')
    } finally {
      setLoading(false)
    }
  }

  // Handle payment type change
  const handleTypeChange = (type) => {
    setPaymentType(type)
    setStreams([])
    setError(null)
  }

  // Handle create stream
  const handleCreateStream = () => {
    if (paymentType === 'crypto' && !isConnected) {
      connectWallet()
      return
    }
    setShowCreateModal(true)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Stream Payments
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Automated continuous payment streams
            </p>
          </div>
          <Button
            onClick={handleCreateStream}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Stream
          </Button>
        </div>

        {/* Payment Type Selector */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Payment Type
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {/* Fiat Option */}
            <button
              onClick={() => handleTypeChange('fiat')}
              className={`flex items-center justify-center p-6 rounded-lg border-2 transition-all ${
                paymentType === 'fiat'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <DollarSign className={`w-8 h-8 mx-auto mb-2 ${
                  paymentType === 'fiat' ? 'text-blue-600' : 'text-gray-400'
                }`} />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Fiat Currency
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  USD, EUR, etc.
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  ✓ No wallet needed<br />
                  ✓ Zero gas fees<br />
                  ✓ Instant confirmation
                </p>
              </div>
            </button>

            {/* Crypto Option */}
            <button
              onClick={() => handleTypeChange('crypto')}
              className={`flex items-center justify-center p-6 rounded-lg border-2 transition-all ${
                paymentType === 'crypto'
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <Wallet className={`w-8 h-8 mx-auto mb-2 ${
                  paymentType === 'crypto' ? 'text-purple-600' : 'text-gray-400'
                }`} />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Cryptocurrency
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  ETH, USDC, DAI
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  ✓ On-chain payment<br />
                  ✓ Decentralized<br />
                  ✓ Transparent
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Crypto Wallet Connection */}
        {paymentType === 'crypto' && !isConnected && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-6">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
                  Connect Your Wallet
                </h3>
                <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-4">
                  To use cryptocurrency stream payments, please connect your MetaMask wallet.
                </p>
                <Button
                  onClick={connectWallet}
                  disabled={isConnecting}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Wallet className="w-4 h-4 mr-2" />
                      Connect MetaMask
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Wrong Network Warning */}
        {paymentType === 'crypto' && isConnected && chainId !== SEPOLIA_CHAIN_ID && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-6">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 mr-3" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 dark:text-red-200 mb-2">
                  Wrong Network
                </h3>
                <p className="text-sm text-red-800 dark:text-red-300 mb-4">
                  Please switch to Sepolia testnet to use crypto stream payments.
                </p>
                <Button
                  onClick={() => switchNetwork(SEPOLIA_CHAIN_ID)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Switch to Sepolia
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Connected Wallet Info */}
        {paymentType === 'crypto' && isConnected && chainId === SEPOLIA_CHAIN_ID && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Wallet className="w-5 h-5 text-green-600 dark:text-green-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-green-900 dark:text-green-200">
                    Wallet Connected
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    {account?.slice(0, 6)}...{account?.slice(-4)}
                  </p>
                </div>
              </div>
              <span className="text-xs bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                Sepolia Testnet
              </span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Streams List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : streams.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No stream payments yet
            </p>
            <Button
              onClick={handleCreateStream}
              variant="outline"
              className="border-gray-300 dark:border-gray-600"
            >
              Create your first stream
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {streams.map((stream) => (
              <StreamCard key={stream.id} stream={stream} paymentType={paymentType} />
            ))}
          </div>
        )}

        {/* Create Stream Modal */}
        {showCreateModal && (
          <CreateStreamModal
            paymentType={paymentType}
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false)
              if (paymentType === 'fiat') {
                loadFiatStreams()
              } else {
                loadCryptoStreams()
              }
            }}
            signer={signer}
            account={account}
          />
        )}
      </div>
    </div>
  )
}

// Stream Card Component
function StreamCard({ stream, paymentType }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          {stream.name}
        </h3>
        <span className={`text-xs px-2 py-1 rounded ${
          stream.status === 'active' || stream.status === 0
            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
        }`}>
          {paymentType === 'fiat' ? stream.status : ['Active', 'Paused', 'Completed', 'Cancelled'][stream.status]}
        </span>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Total Amount:</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {paymentType === 'fiat' 
              ? `${stream.currency} ${stream.totalAmount || stream.amount}`
              : `${stream.totalAmount} tokens`
            }
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Streamed:</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {stream.amountStreamed || stream.amount_streamed || '0'}
          </span>
        </div>
        {paymentType === 'crypto' && (
          <>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Recipient:</span>
              <span className="font-mono text-xs text-gray-900 dark:text-white">
                {stream.recipient?.slice(0, 6)}...{stream.recipient?.slice(-4)}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// Create Stream Modal Component (placeholder)
function CreateStreamModal({ paymentType, onClose, onSuccess, signer, account }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4">
          Create {paymentType === 'fiat' ? 'Fiat' : 'Crypto'} Stream
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Form implementation coming soon...
        </p>
        <Button onClick={onClose}>Close</Button>
      </div>
    </div>
  )
}
