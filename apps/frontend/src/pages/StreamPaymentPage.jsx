import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, Clock, Pause, Play, X, Send, DollarSign } from 'lucide-react';
import { streamPaymentService } from '../services/backendService';
import contractService, { createContractService } from '../services/contractService';
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
  
  // Web3 wallet state
  const { account, signer, isConnected, connect, disconnect } = useWeb3Wallet();
  
  // Load streams
  const loadStreams = async () => {
    setLoading(true);
    try {
      const user = authUtils.getCurrentUser();
      if (!user || !user.account_id) {
        console.log('No user logged in');
        setLoading(false);
        return;
      }
      
      if (paymentType === 'fiat') {
        // Load from backend API
        const response = await streamPaymentService.list(user.account_id);
        if (response.status === 'success') {
          setStreams(response.data || []);
        }
      } else {
        // Load from smart contract
        if (isConnected && account) {
          const contractStreams = await contractService.getStreams(account);
          setStreams(contractStreams);
        }
      }
    } catch (error) {
      console.error('Error loading streams:', error);
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
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <DollarSign className={`w-6 h-6 ${paymentType === 'fiat' ? 'text-red-500' : 'text-gray-400'}`} />
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
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <Send className={`w-6 h-6 ${paymentType === 'crypto' ? 'text-blue-500' : 'text-gray-400'}`} />
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
            <StreamPaymentDashboard streams={streams} paymentType={paymentType} />
          
          {/* Stream Cards or Empty State */}
          {streams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 bg-white dark:bg-gray-800 rounded-lg shadow">
              <Clock className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No stream payments yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Create your first stream payment to get started
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Create your first stream
              </button>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Active Streams
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {streams.map(stream => (
                  <StreamCard key={stream.stream_id} stream={stream} paymentType={paymentType} onUpdate={loadStreams} />
                ))}
              </div>
            </div>
          )}
          </div>
        )}
        
        {/* Create Stream Modal */}
        {showCreateModal && (
          <CreateStreamModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            paymentType={paymentType}
            signer={signer}
            account={account}
            onSuccess={() => {
              setShowCreateModal(false);
              loadStreams();
            }}
          />
        )}
        
        {/* Batch Create Stream Modal */}
        {showBatchModal && (
          <BatchStreamModal
            isOpen={showBatchModal}
            onClose={() => setShowBatchModal(false)}
            paymentType={paymentType}
            account={account}
            signer={signer}
            onSuccess={() => {
              setShowBatchModal(false);
              loadStreams();
            }}
          />
        )}
      </div>
    </div>
  );
}

// Stream Card Component
function StreamCard({ stream, paymentType, onUpdate }) {
  const [loading, setLoading] = useState(false);
  
  const handlePause = async () => {
    setLoading(true);
    try {
      if (paymentType === 'fiat') {
        await streamPaymentService.pause(stream.stream_id);
      } else {
        await contractService.pauseStream(stream.stream_id);
      }
      onUpdate();
    } catch (error) {
      console.error('Error pausing stream:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleResume = async () => {
    setLoading(true);
    try {
      if (paymentType === 'fiat') {
        await streamPaymentService.resume(stream.stream_id);
      } else {
        await contractService.resumeStream(stream.stream_id);
      }
      onUpdate();
    } catch (error) {
      console.error('Error resuming stream:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this stream?')) return;
    
    setLoading(true);
    try {
      if (paymentType === 'fiat') {
        await streamPaymentService.cancel(stream.stream_id);
      } else {
        await contractService.cancelStream(stream.stream_id);
      }
      onUpdate();
    } catch (error) {
      console.error('Error canceling stream:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {stream.stream_name || 'Unnamed Stream'}
        </h3>
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          stream.status === 'active' ? 'bg-green-100 text-green-800' :
          stream.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
          stream.status === 'completed' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {stream.status}
        </span>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Recipient:</span>
          <span className="text-gray-900 dark:text-white font-medium">
            {stream.recipient_address?.substring(0, 10)}...
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Amount:</span>
          <span className="text-gray-900 dark:text-white font-medium">
            {stream.total_amount} {stream.currency}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Streamed:</span>
          <span className="text-gray-900 dark:text-white font-medium">
            {stream.streamed_amount || '0'} {stream.currency}
          </span>
        </div>
      </div>
      
      <div className="flex gap-2">
        {stream.status === 'active' && (
          <button
            onClick={handlePause}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
          >
            <Pause className="w-4 h-4" />
            Pause
          </button>
        )}
        {stream.status === 'paused' && (
          <button
            onClick={handleResume}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            Resume
          </button>
        )}
        {(stream.status === 'active' || stream.status === 'paused') && (
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

// Create Stream Modal Component
function CreateStreamModal({ isOpen, onClose, paymentType, signer, account, onSuccess }) {
  const [formData, setFormData] = useState({
    recipient: '',
    amount: '',
    currency: paymentType === 'fiat' ? 'USD' : 'ETH',
    duration: '3600',
    frequency: '60',
    streamName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const user = authUtils.getCurrentUser();
      if (!user || !user.account_id) {
        setError('Please login first');
        return;
      }
      
      if (paymentType === 'fiat') {
        // Create via backend API
        const response = await streamPaymentService.create({
          to_account_id: formData.recipient,
          amount: parseFloat(formData.amount),
          currency: formData.currency,
          duration: parseInt(formData.duration),
          stream_name: formData.streamName
        });
        
        if (response.status === 'success') {
          onSuccess();
        } else {
          setError(response.message || 'Failed to create stream');
        }
      } else {
        // Create via smart contract
        const result = await contractService.createStream(signer, {
          recipient: formData.recipient,
          tokenAddress: formData.currency, // Token contract address
          amount: formData.amount,
          duration: parseInt(formData.duration),
          streamName: formData.streamName
        });
        
        onSuccess();
      }
    } catch (err) {
      console.error('Error creating stream:', err);
      setError(err.message || 'Failed to create stream');
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create Stream Payment
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Stream Name
            </label>
            <input
              type="text"
              value={formData.streamName}
              onChange={(e) => setFormData({...formData, streamName: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="My Stream"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Recipient Address
            </label>
            <input
              type="text"
              value={formData.recipient}
              onChange={(e) => setFormData({...formData, recipient: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder={paymentType === 'fiat' ? 'user@example.com' : '0x...'}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Total Amount
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="1000"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Duration (seconds)
            </label>
            <input
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({...formData, duration: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="3600"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              1 hour = 3600s, 1 day = 86400s, 1 month = 2592000s
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Stream'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
