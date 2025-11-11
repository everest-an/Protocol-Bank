import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, Clock, Pause, Play, X, Send, DollarSign } from 'lucide-react';
import { streamPaymentService } from '../services/backendService';
import contractService, { createContractService } from '../services/contractService';
import etherscanService from '../services/etherscanService';
import { useWeb3Wallet } from '../hooks/useWeb3Wallet';
import authUtils from '../utils/auth';
import BatchStreamModal from '../components/BatchStreamModal.jsx';
import StreamPaymentDashboard from '../components/StreamPaymentDashboard.jsx';

export default function StreamPaymentPage() {
  const [paymentType, setPaymentType] = useState('fiat'); // 'fiat' or 'crypto'
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [etherscanData, setEtherscanData] = useState(null);
  
  // Web3 wallet state
  const { account, signer, isConnected, connect, disconnect } = useWeb3Wallet();
  
  // Load streams from Etherscan for crypto mode
  const loadEtherscanData = async (walletAddress) => {
    try {
      console.log('Loading Etherscan data for:', walletAddress);
      const data = await etherscanService.getStreamPaymentData(walletAddress, 11155111); // Sepolia
      setEtherscanData(data);
      
      // Convert Etherscan data to streams format
      const etherscanStreams = data.suppliers.map((supplier, index) => ({
        stream_id: `etherscan-${supplier.id}`,
        recipient_address: supplier.address,
        recipient: supplier.address,
        total_amount: supplier.totalAmount,
        totalAmount: supplier.totalAmount,
        status: supplier.status,
        created_at: supplier.lastTransaction,
        stream_name: supplier.name,
        currency: 'ETH',
        transaction_count: supplier.transactionCount
      }));
      
      setStreams(etherscanStreams);
    } catch (error) {
      console.error('Error loading Etherscan data:', error);
      setEtherscanData(null);
      setStreams([]);
    }
  };
  
  // Load streams
  const loadStreams = async () => {
    setLoading(true);
    try {
      const user = authUtils.getCurrentUser();
      
      if (paymentType === 'fiat') {
        // Load from backend API
        if (!user || !user.account_id) {
          console.log('No user logged in');
          setStreams([]);
          setLoading(false);
          return;
        }
        
        const response = await streamPaymentService.list(user.account_id);
        if (response.status === 'success') {
          setStreams(response.data || []);
        }
      } else {
        // Load from Etherscan for crypto mode
        if (isConnected && account) {
          await loadEtherscanData(account);
        } else {
          setStreams([]);
        }
      }
    } catch (error) {
      console.error('Error loading streams:', error);
      setStreams([]);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadStreams();
  }, [paymentType, isConnected, account]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Stream Payments
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Automated continuous payment streams
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Stream
              </button>
              {paymentType === 'crypto' && (
                <button
                  onClick={() => setShowBatchModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Batch Create
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Payment Type Selector */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Payment Type
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setPaymentType('fiat')}
              className={`p-4 rounded-lg border-2 transition-all ${
                paymentType === 'fiat'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <DollarSign className={`w-6 h-6 ${paymentType === 'fiat' ? 'text-green-500' : 'text-gray-400'}`} />
                <div className="text-left">
                  <div className="font-semibold text-gray-900 dark:text-white">Fiat Currency</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">USD, EUR, etc.</div>
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                    ✓ No wallet needed<br/>
                    ✓ Zero gas fees<br/>
                    ✓ Instant confirmation
                  </div>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => setPaymentType('crypto')}
              className={`p-4 rounded-lg border-2 transition-all ${
                paymentType === 'crypto'
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <Send className={`w-6 h-6 ${paymentType === 'crypto' ? 'text-red-500' : 'text-gray-400'}`} />
                <div className="text-left">
                  <div className="font-semibold text-gray-900 dark:text-white">Cryptocurrency</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">ETH, USDC, DAI</div>
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                    ✓ On-chain payment<br/>
                    ✓ Decentralized<br/>
                    ✓ Transparent
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>
        
        {/* Wallet Connection (for crypto mode) */}
        {paymentType === 'crypto' && !isConnected && (
          <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
              Connect Your Wallet
            </h3>
            <p className="text-yellow-800 dark:text-yellow-200 mb-4">
              To use cryptocurrency stream payments, please connect your MetaMask wallet.
            </p>
            <button
              onClick={connect}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Connect MetaMask
            </button>
          </div>
        )}
        
        {/* Streams List */}
        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow-sm">
            <RefreshCw className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Loading streams...
            </h3>
          </div>
        ) : (
          /* Dashboard - Always show */
          <div className="space-y-6">
            <StreamPaymentDashboard 
              streams={streams} 
              paymentType={paymentType}
              account={account}
              etherscanData={etherscanData}
            />
          
          {/* Stream Cards or Empty State */}
          {streams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 bg-white dark:bg-gray-800 rounded-lg shadow">
              <Clock className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No stream payments yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {paymentType === 'crypto' && !isConnected 
                  ? 'Connect your wallet to view your stream payments'
                  : 'Create your first stream payment to get started'
                }
              </p>
              {paymentType === 'crypto' && !isConnected ? (
                <button
                  onClick={connect}
                  className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Connect Wallet
                </button>
              ) : (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Create your first stream
                </button>
              )}
            </div>
          ) : null}
          </div>
        )}
        
        {/* Batch Stream Modal */}
        {showBatchModal && (
          <BatchStreamModal
            onClose={() => setShowBatchModal(false)}
            onSuccess={loadStreams}
          />
        )}
      </div>
    </div>
  );
}
