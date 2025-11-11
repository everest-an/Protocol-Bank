import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Loader, DollarSign, Calendar, Clock, User } from 'lucide-react';
import { ethers, isAddress } from 'ethers';
import { createContractService, CONTRACTS } from '../services/contractService';

/**
 * Create Stream Payment Form Component
 * 
 * Allows users to create a single stream payment with:
 * - Recipient address validation
 * - Token selection (ETH/USDC/DAI/USDT)
 * - Date/time pickers for start and end times
 * - Amount validation
 * - Gas fee estimation
 * - Real-time form validation
 */
export default function CreateStreamPaymentForm({ isOpen, onClose, onSuccess, account, provider }) {
  // Form state
  const [formData, setFormData] = useState({
    streamName: '',
    recipientAddress: '',
    token: 'USDC',
    amount: '',
    startTime: '',
    endTime: ''
  });

  // Validation state
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gasEstimate, setGasEstimate] = useState(null);
  const [isEstimatingGas, setIsEstimatingGas] = useState(false);

  // Token options
  const tokens = [
    { symbol: 'ETH', name: 'Ethereum', decimals: 18, icon: '⟠' },
    { symbol: 'USDC', name: 'USD Coin', decimals: 6, icon: '$' },
    { symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18, icon: '◈' },
    { symbol: 'USDT', name: 'Tether USD', decimals: 6, icon: '₮' }
  ];

  // Get current token info
  const currentToken = tokens.find(t => t.symbol === formData.token);

  // Validate form fields
  const validateField = (name, value) => {
    let error = '';

    switch (name) {
      case 'streamName':
        if (!value.trim()) {
          error = 'Stream name is required';
        } else if (value.length < 3) {
          error = 'Stream name must be at least 3 characters';
        } else if (value.length > 50) {
          error = 'Stream name must be less than 50 characters';
        }
        break;

      case 'recipientAddress':
        if (!value.trim()) {
          error = 'Recipient address is required';
        } else if (!isAddress(value)) {
          error = 'Invalid Ethereum address';
        } else if (value.toLowerCase() === account?.toLowerCase()) {
          error = 'Cannot send to your own address';
        }
        break;

      case 'amount':
        if (!value) {
          error = 'Amount is required';
        } else if (isNaN(value) || parseFloat(value) <= 0) {
          error = 'Amount must be greater than 0';
        } else if (parseFloat(value) > 1000000) {
          error = 'Amount is too large';
        }
        break;

      case 'startTime':
        if (!value) {
          error = 'Start time is required';
        } else {
          const startDate = new Date(value);
          const now = new Date();
          if (startDate < now) {
            error = 'Start time must be in the future';
          }
        }
        break;

      case 'endTime':
        if (!value) {
          error = 'End time is required';
        } else if (formData.startTime) {
          const startDate = new Date(formData.startTime);
          const endDate = new Date(value);
          if (endDate <= startDate) {
            error = 'End time must be after start time';
          }
          const duration = (endDate - startDate) / 1000; // seconds
          if (duration < 60) {
            error = 'Duration must be at least 1 minute';
          }
        }
        break;

      default:
        break;
    }

    return error;
  };

  // Handle field change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Validate on change if field has been touched
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  // Handle field blur
  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));

    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  // Estimate gas fee
  useEffect(() => {
    const estimateGas = async () => {
      if (!formData.recipientAddress || 
          !formData.amount || 
          !isAddress(formData.recipientAddress) ||
          !provider) {
        setGasEstimate(null);
        return;
      }

      setIsEstimatingGas(true);

      try {
        // Estimate gas for a typical stream payment transaction
        const feeData = await provider.getFeeData();
        const gasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');
        const estimatedGasLimit = 150000n; // Typical gas limit for stream payment
        const gasCost = gasPrice * estimatedGasLimit;

        setGasEstimate({
          gasPrice: ethers.formatUnits(gasPrice, 'gwei'),
          gasLimit: estimatedGasLimit.toString(),
          gasCost: ethers.formatEther(gasCost),
          gasCostUSD: parseFloat(ethers.formatEther(gasCost)) * 2000 // Assume ETH = $2000
        });
      } catch (error) {
        console.error('Gas estimation failed:', error);
        setGasEstimate(null);
      } finally {
        setIsEstimatingGas(false);
      }
    };

    // Debounce gas estimation
    const timer = setTimeout(estimateGas, 500);
    return () => clearTimeout(timer);
  }, [formData.recipientAddress, formData.amount, provider]);

  // Calculate stream duration
  const getStreamDuration = () => {
    if (!formData.startTime || !formData.endTime) return null;

    const start = new Date(formData.startTime);
    const end = new Date(formData.endTime);
    const durationMs = end - start;

    if (durationMs <= 0) return null;

    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    return `${seconds} second${seconds > 1 ? 's' : ''}`;
  };

  // Calculate flow rate
  const getFlowRate = () => {
    if (!formData.amount || !formData.startTime || !formData.endTime) return null;

    const start = new Date(formData.startTime);
    const end = new Date(formData.endTime);
    const durationSeconds = (end - start) / 1000;

    if (durationSeconds <= 0) return null;

    const amount = parseFloat(formData.amount);
    const flowRatePerSecond = amount / durationSeconds;

    return flowRatePerSecond.toFixed(8);
  };

  // Validate entire form
  const validateForm = () => {
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });

    setErrors(newErrors);
    setTouched({
      streamName: true,
      recipientAddress: true,
      amount: true,
      startTime: true,
      endTime: true
    });

    return Object.keys(newErrors).length === 0;
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!provider || !account) {
      alert('Please connect your wallet first');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Creating stream payment:', formData);

      // Get signer from provider
      const signer = await provider.getSigner();
      const contractService = createContractService(signer);

      // Get token address
      let tokenAddress;
      if (formData.token === 'USDC') {
        tokenAddress = CONTRACTS.MOCK_USDC;
      } else if (formData.token === 'DAI') {
        tokenAddress = CONTRACTS.MOCK_DAI;
      } else {
        // For ETH, we need to use WETH or handle differently
        alert('ETH streaming is not yet supported. Please use USDC or DAI.');
        setIsSubmitting(false);
        return;
      }

      // Convert times to timestamps
      const startTimestamp = Math.floor(new Date(formData.startTime).getTime() / 1000);
      const endTimestamp = Math.floor(new Date(formData.endTime).getTime() / 1000);
      const duration = endTimestamp - startTimestamp;

      // Create stream on blockchain
      const result = await contractService.createStream(
        formData.recipientAddress,
        tokenAddress,
        formData.amount,
        duration,
        formData.streamName
      );

      if (result.success) {
        alert(`Stream created successfully!\nStream ID: ${result.streamId}\nTx Hash: ${result.txHash}`);
        
        // Success callback
        if (onSuccess) {
          onSuccess({
            ...formData,
            streamId: result.streamId,
            txHash: result.txHash
          });
        }

        // Reset form
        setFormData({
          streamName: '',
          recipientAddress: '',
          token: 'USDC',
          amount: '',
          startTime: '',
          endTime: ''
        });
        setErrors({});
        setTouched({});

        onClose();
      } else {
        throw new Error(result.error || 'Failed to create stream');
      }
    } catch (error) {
      console.error('Failed to create stream payment:', error);
      alert('Failed to create stream payment: ' + (error.message || error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const duration = getStreamDuration();
  const flowRate = getFlowRate();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create Stream Payment
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Stream Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Stream Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="streamName"
                value={formData.streamName}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g., Monthly Salary - John Doe"
                className={`w-full pl-10 pr-4 py-3 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.streamName && touched.streamName
                    ? 'border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              />
            </div>
            {errors.streamName && touched.streamName && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.streamName}
              </p>
            )}
          </div>

          {/* Recipient Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Recipient Address *
            </label>
            <input
              type="text"
              name="recipientAddress"
              value={formData.recipientAddress}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="0x..."
              className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.recipientAddress && touched.recipientAddress
                  ? 'border-red-500'
                  : errors.recipientAddress === '' && touched.recipientAddress && formData.recipientAddress
                  ? 'border-green-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.recipientAddress && touched.recipientAddress && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.recipientAddress}
              </p>
            )}
            {!errors.recipientAddress && touched.recipientAddress && formData.recipientAddress && (
              <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Valid Ethereum address
              </p>
            )}
          </div>

          {/* Token and Amount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Token Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Token *
              </label>
              <select
                name="token"
                value={formData.token}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                {tokens.map(token => (
                  <option key={token.symbol} value={token.symbol}>
                    {token.icon} {token.symbol} - {token.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Total Amount *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="0.00"
                  step="any"
                  min="0"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.amount && touched.amount
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
              </div>
              {errors.amount && touched.amount && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.amount}
                </p>
              )}
            </div>
          </div>

          {/* Start and End Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Time *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  type="datetime-local"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.startTime && touched.startTime
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
              </div>
              {errors.startTime && touched.startTime && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.startTime}
                </p>
              )}
            </div>

            {/* End Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Time *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  type="datetime-local"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.endTime && touched.endTime
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
              </div>
              {errors.endTime && touched.endTime && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.endTime}
                </p>
              )}
            </div>
          </div>

          {/* Stream Info */}
          {duration && flowRate && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Stream Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-blue-700 dark:text-blue-400">Duration:</p>
                  <p className="font-semibold text-blue-900 dark:text-blue-200">{duration}</p>
                </div>
                <div>
                  <p className="text-blue-700 dark:text-blue-400">Flow Rate:</p>
                  <p className="font-semibold text-blue-900 dark:text-blue-200">
                    {flowRate} {currentToken.symbol}/second
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Gas Estimate */}
          {gasEstimate && (
            <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-300 mb-2">
                Estimated Gas Fee
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Gas Price:</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-200">
                    {parseFloat(gasEstimate.gasPrice).toFixed(2)} Gwei
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Total Cost:</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-200">
                    ≈ {parseFloat(gasEstimate.gasCost).toFixed(6)} ETH
                    <span className="text-gray-500 dark:text-gray-400 ml-1">
                      (${gasEstimate.gasCostUSD.toFixed(2)})
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {isEstimatingGas && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Loader className="w-4 h-4 animate-spin" />
              Estimating gas fee...
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || Object.keys(errors).some(key => errors[key])}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Stream Payment'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
