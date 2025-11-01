import { useState, useEffect } from 'react';
import { X, Loader2, Send, TrendingUp } from 'lucide-react';
import { createStream, getSupportedTokens, getTokenBalance } from '../../services/streamPaymentService';
import { getTransactionExplorerLink } from '../../config/contracts';

export default function CreatePaymentModal({ onClose, onCreate, suppliers = [], signer, account }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [paymentType, setPaymentType] = useState('regular'); // 'regular' or 'stream'
  
  // Regular payment fields
  const [formData, setFormData] = useState({
    to: '',
    amount: '',
    category: '',
  });

  // Stream payment fields
  const [streamData, setStreamData] = useState({
    recipient: '',
    amount: '',
    duration: '3600', // 1 hour default
    streamName: '',
    token: '',
  });

  const [supportedTokens, setSupportedTokens] = useState([]);
  const [tokenBalance, setTokenBalance] = useState(null);

  const categories = [
    'Technology',
    'Cloud Services',
    'Raw Materials',
    'Logistics',
    'Consulting',
    'Design',
    'Marketing',
    'Other',
  ];

  // Load supported tokens for stream payments
  useEffect(() => {
    if (paymentType === 'stream' && signer) {
      loadTokens();
    }
  }, [paymentType, signer]);

  // Load token balance when token is selected
  useEffect(() => {
    if (paymentType === 'stream' && streamData.token && account) {
      loadBalance();
    }
  }, [streamData.token, account, paymentType]);

  const loadTokens = async () => {
    try {
      const tokens = await getSupportedTokens();
      setSupportedTokens(tokens);
      if (tokens.length > 0 && !streamData.token) {
        setStreamData(prev => ({ ...prev, token: tokens[0].address }));
      }
    } catch (err) {
      console.error('Error loading tokens:', err);
    }
  };

  const loadBalance = async () => {
    try {
      const balance = await getTokenBalance(streamData.token, account);
      setTokenBalance(balance);
    } catch (err) {
      console.error('Error loading balance:', err);
      setTokenBalance(null);
    }
  };

  const handleRegularSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.to || !formData.amount || !formData.category) {
      setError('Please fill in all fields');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    try {
      setLoading(true);
      await onCreate(formData);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create payment');
    } finally {
      setLoading(false);
    }
  };

  const handleStreamSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(null);

    // Validation
    if (!signer || !account) {
      setError('Please connect your wallet first');
      return;
    }

    if (!streamData.recipient || !streamData.amount || !streamData.duration || !streamData.token) {
      setError('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(streamData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    const duration = parseInt(streamData.duration);
    if (isNaN(duration) || duration < 3600) {
      setError('Duration must be at least 3600 seconds (1 hour)');
      return;
    }

    try {
      setLoading(true);
      
      const result = await createStream(
        signer,
        streamData.recipient,
        streamData.token,
        streamData.amount,
        duration,
        streamData.streamName || 'Unnamed Stream'
      );

      setSuccess({
        message: 'Stream payment created successfully!',
        txHash: result.transactionHash,
        streamId: result.streamId,
      });

      // Auto close after 3 seconds
      setTimeout(() => {
        onClose();
        if (onCreate) {
          onCreate({ type: 'stream', ...result });
        }
      }, 3000);

    } catch (err) {
      console.error('Error creating stream:', err);
      setError(err.message || 'Failed to create stream payment');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = paymentType === 'regular' ? handleRegularSubmit : handleStreamSubmit;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Create Payment
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Payment Type Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Payment Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentType('regular')}
                disabled={loading}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                  paymentType === 'regular'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-600'
                }`}
              >
                <Send className="w-4 h-4" />
                <span className="font-medium">Regular</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentType('stream')}
                disabled={loading}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                  paymentType === 'stream'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-600'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span className="font-medium">Stream</span>
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {paymentType === 'regular' 
                ? 'Send a one-time payment immediately' 
                : 'Create a continuous payment stream over time'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-600 dark:text-green-400 font-medium mb-2">
                  {success.message}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  Stream ID: {success.streamId}
                </p>
                {success.txHash && (
                  <a
                    href={getTransactionExplorerLink(success.txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block"
                  >
                    View on Etherscan →
                  </a>
                )}
              </div>
            )}

            {paymentType === 'regular' ? (
              // Regular Payment Form
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Recipient Address *
                  </label>
                  {suppliers.length > 0 ? (
                    <select
                      value={formData.to}
                      onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    >
                      <option value="">Select supplier</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.address} value={supplier.address}>
                          {supplier.name} ({supplier.address.slice(0, 6)}...{supplier.address.slice(-4)})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formData.to}
                      onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0x..."
                      disabled={loading}
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Amount (ETH) *
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 0.1"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              // Stream Payment Form
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Recipient Address *
                  </label>
                  <input
                    type="text"
                    value={streamData.recipient}
                    onChange={(e) => setStreamData({ ...streamData, recipient: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0x..."
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Token *
                  </label>
                  <select
                    value={streamData.token}
                    onChange={(e) => setStreamData({ ...streamData, token: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading || supportedTokens.length === 0}
                  >
                    {supportedTokens.map((token) => (
                      <option key={token.address} value={token.address}>
                        {token.symbol}
                      </option>
                    ))}
                  </select>
                  {tokenBalance !== null && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Balance: {tokenBalance}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={streamData.amount}
                    onChange={(e) => setStreamData({ ...streamData, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 1000"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Duration (seconds) *
                  </label>
                  <input
                    type="number"
                    min="3600"
                    step="3600"
                    value={streamData.duration}
                    onChange={(e) => setStreamData({ ...streamData, duration: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 86400 (1 day)"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Minimum: 3600 seconds (1 hour). Example: 86400 = 1 day
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Stream Name (optional)
                  </label>
                  <input
                    type="text"
                    value={streamData.streamName}
                    onChange={(e) => setStreamData({ ...streamData, streamName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Monthly Salary Payment"
                    disabled={loading}
                  />
                </div>
              </>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || success !== null}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {paymentType === 'regular' ? 'Creating...' : 'Creating Stream...'}
                  </>
                ) : success ? (
                  'Success!'
                ) : (
                  paymentType === 'regular' ? 'Create Payment' : 'Create Stream'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
