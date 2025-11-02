import React, { useState, useEffect } from 'react';
import { X, Send, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
// Note: This component receives signer and account as props from parent
import { 
  createStream, 
  getSupportedTokens, 
  getTokenBalance 
} from '../services/streamPaymentService';
import { getTransactionExplorerLink } from '../config/contracts';

const CreateStreamModal = ({ isOpen, onClose, onSuccess, signer, account }) => {
  
  // Form state
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('3600'); // 1 hour default
  const [streamName, setStreamName] = useState('');
  const [selectedToken, setSelectedToken] = useState('');
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [tokenBalances, setTokenBalances] = useState({});
  
  const supportedTokens = getSupportedTokens();
  
  // Load token balances
  useEffect(() => {
    if (account && signer) {
      loadTokenBalances();
    }
  }, [account, signer]);
  
  // Set default token
  useEffect(() => {
    if (supportedTokens.length > 0 && !selectedToken) {
      setSelectedToken(supportedTokens[0].address);
    }
  }, [supportedTokens]);
  
  const loadTokenBalances = async () => {
    try {
      const balances = {};
      for (const token of supportedTokens) {
        const { balance, symbol } = await getTokenBalance(signer, token.address, account);
        balances[token.address] = { balance, symbol };
      }
      setTokenBalances(balances);
    } catch (error) {
      console.error('Error loading token balances:', error);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    // Validation
    if (!recipient || !amount || !duration || !streamName || !selectedToken) {
      setError('Please fill in all fields');
      return;
    }
    
    if (parseFloat(amount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }
    
    if (parseInt(duration) < 3600) {
      setError('Duration must be at least 1 hour (3600 seconds)');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await createStream(signer, {
        recipient,
        tokenAddress: selectedToken,
        amount,
        duration: parseInt(duration),
        streamName
      });
      
      setSuccess({
        message: 'Stream created successfully!',
        txHash: result.txHash,
        streamId: result.streamId
      });
      
      // Reload balances
      await loadTokenBalances();
      
      // Notify parent
      if (onSuccess) {
        onSuccess(result);
      }
      
      // Reset form after 3 seconds
      setTimeout(() => {
        resetForm();
        onClose();
      }, 3000);
      
    } catch (error) {
      console.error('Error creating stream:', error);
      setError(error.message || 'Failed to create stream');
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetForm = () => {
    setRecipient('');
    setAmount('');
    setDuration('3600');
    setStreamName('');
    setError(null);
    setSuccess(null);
  };
  
  const handleClose = () => {
    if (!isLoading) {
      resetForm();
      onClose();
    }
  };
  
  if (!isOpen) return null;
  
  const selectedTokenInfo = supportedTokens.find(t => t.address === selectedToken);
  const selectedTokenBalance = tokenBalances[selectedToken];
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Send className="w-5 h-5" />
            Create Stream Payment
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Recipient */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Recipient Address
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              disabled={isLoading}
              required
            />
          </div>
          
          {/* Token Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Token
            </label>
            <select
              value={selectedToken}
              onChange={(e) => setSelectedToken(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              disabled={isLoading}
              required
            >
              {supportedTokens.map(token => (
                <option key={token.address} value={token.address}>
                  {token.symbol} - {token.name}
                </option>
              ))}
            </select>
            {selectedTokenBalance && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Balance: {parseFloat(selectedTokenBalance.balance).toLocaleString()} {selectedTokenBalance.symbol}
              </p>
            )}
          </div>
          
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1000"
              step="0.000001"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              disabled={isLoading}
              required
            />
          </div>
          
          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Duration (seconds)
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="3600"
              min="3600"
              step="1"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              disabled={isLoading}
              required
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Minimum: 1 hour (3600 seconds) ≈ {(parseInt(duration) / 3600).toFixed(2)} hours
            </p>
          </div>
          
          {/* Stream Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Stream Name
            </label>
            <input
              type="text"
              value={streamName}
              onChange={(e) => setStreamName(e.target.value)}
              placeholder="Monthly Salary Payment"
              maxLength="100"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              disabled={isLoading}
              required
            />
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
          
          {/* Success Message */}
          {success && (
            <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">{success.message}</p>
                {success.streamId && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Stream ID: {success.streamId}
                  </p>
                )}
                {success.txHash && (
                  <a
                    href={getTransactionExplorerLink(success.txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-green-600 dark:text-green-400 underline mt-1 block"
                  >
                    View on Etherscan
                  </a>
                )}
              </div>
            </div>
          )}
          
          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !signer}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Create Stream
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateStreamModal;
