import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Upload, Download, AlertCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { createContractService, CONTRACTS } from '../services/contractService';

export default function BatchStreamModal({ isOpen, onClose, onSuccess, paymentType, account, signer }) {
  const [streams, setStreams] = useState([
    { recipient: '', token: '', amount: '', duration: '3600', streamName: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [gasEstimate, setGasEstimate] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [errors, setErrors] = useState({});

  // Token options
  const tokens = [
    { address: CONTRACTS.MOCK_USDC, symbol: 'USDC', decimals: 6 },
    { address: CONTRACTS.MOCK_DAI, symbol: 'DAI', decimals: 18 }
  ];

  // Duration presets (in seconds)
  const durationPresets = [
    { label: '1 Hour', value: 3600 },
    { label: '1 Day', value: 86400 },
    { label: '1 Week', value: 604800 },
    { label: '1 Month', value: 2592000 },
    { label: 'Custom', value: 'custom' }
  ];

  // Add new stream row
  const addStream = () => {
    setStreams([
      ...streams,
      { recipient: '', token: '', amount: '', duration: '3600', streamName: '' }
    ]);
  };

  // Remove stream row
  const removeStream = (index) => {
    if (streams.length > 1) {
      const newStreams = streams.filter((_, i) => i !== index);
      setStreams(newStreams);
    }
  };

  // Update stream field
  const updateStream = (index, field, value) => {
    const newStreams = [...streams];
    newStreams[index][field] = value;
    setStreams(newStreams);
    
    // Clear error for this field
    const newErrors = { ...errors };
    delete newErrors[`${index}-${field}`];
    setErrors(newErrors);
  };

  // Calculate total amount and gas estimate
  useEffect(() => {
    let total = 0;
    streams.forEach(stream => {
      if (stream.amount && !isNaN(stream.amount)) {
        total += parseFloat(stream.amount);
      }
    });
    setTotalAmount(total);

    // Estimate gas (rough estimate)
    if (streams.length > 0) {
      // Base gas + per-stream gas
      const baseGas = 100000;
      const perStreamGas = 250000;
      const estimatedGas = baseGas + (streams.length * perStreamGas);
      setGasEstimate(estimatedGas);
    }
  }, [streams]);

  // Validate streams
  const validateStreams = () => {
    const newErrors = {};
    let isValid = true;

    streams.forEach((stream, index) => {
      if (!stream.recipient || !stream.recipient.match(/^0x[a-fA-F0-9]{40}$/)) {
        newErrors[`${index}-recipient`] = 'Invalid recipient address';
        isValid = false;
      }
      if (!stream.token) {
        newErrors[`${index}-token`] = 'Please select a token';
        isValid = false;
      }
      if (!stream.amount || parseFloat(stream.amount) <= 0) {
        newErrors[`${index}-amount`] = 'Amount must be greater than 0';
        isValid = false;
      }
      if (!stream.duration || parseInt(stream.duration) < 3600) {
        newErrors[`${index}-duration`] = 'Duration must be at least 1 hour (3600 seconds)';
        isValid = false;
      }
      if (!stream.streamName || stream.streamName.length === 0) {
        newErrors[`${index}-streamName`] = 'Stream name is required';
        isValid = false;
      }
      if (stream.streamName && stream.streamName.length > 100) {
        newErrors[`${index}-streamName`] = 'Stream name too long (max 100 characters)';
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  // Handle batch creation
  const handleBatchCreate = async () => {
    if (!validateStreams()) {
      return;
    }

    if (paymentType === 'crypto' && (!account || !signer)) {
      alert('Please connect your wallet first');
      return;
    }

    setLoading(true);
    try {
      if (paymentType === 'crypto') {
        // Prepare batch parameters
        const batchParams = streams.map(stream => {
          const token = tokens.find(t => t.address === stream.token);
          return {
            recipient: stream.recipient,
            token: stream.token,
            totalAmount: parseFloat(stream.amount) * (10 ** token.decimals),
            duration: parseInt(stream.duration),
            streamName: stream.streamName
          };
        });

        // Call smart contract
        const contractServiceInstance = createContractService(signer);
        const result = await contractServiceInstance.createStreamBatch(batchParams);

        alert(`✅ Successfully created ${result.streamIds.length} streams!\nTransaction: ${result.txHash}`);
        onSuccess();
        onClose();
      } else {
        // Fiat mode - call backend API
        alert('Batch creation for Fiat mode is not yet implemented');
      }
    } catch (error) {
      console.error('Batch creation error:', error);
      alert(`❌ Failed to create streams: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Import from CSV
  const handleImportCSV = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        
        // Skip header if exists
        const startIndex = lines[0].toLowerCase().includes('recipient') ? 1 : 0;
        
        const importedStreams = lines.slice(startIndex).map(line => {
          const [recipient, token, amount, duration, streamName] = line.split(',').map(s => s.trim());
          return {
            recipient: recipient || '',
            token: token || '',
            amount: amount || '',
            duration: duration || '3600',
            streamName: streamName || ''
          };
        }).filter(s => s.recipient); // Filter out empty rows

        if (importedStreams.length > 0) {
          setStreams(importedStreams);
          alert(`✅ Imported ${importedStreams.length} streams from CSV`);
        }
      } catch (error) {
        alert('❌ Failed to import CSV: ' + error.message);
      }
    };
    reader.readAsText(file);
  };

  // Export to CSV template
  const handleExportTemplate = () => {
    const csv = 'Recipient Address,Token Address,Amount,Duration (seconds),Stream Name\n' +
                 '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0,' + tokens[0].address + ',100,3600,Example Stream';
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'batch_stream_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Zap className="w-6 h-6 text-yellow-500" />
              Batch Create Streams
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Create multiple payment streams in one transaction to save gas
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Import/Export Tools */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".csv"
                onChange={handleImportCSV}
                className="hidden"
              />
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                <Upload className="w-4 h-4" />
                Import CSV
              </div>
            </label>
            <button
              onClick={handleExportTemplate}
              className="flex items-center gap-2 px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              Download Template
            </button>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {streams.length} stream{streams.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Streams List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {streams.map((stream, index) => (
              <div
                key={index}
                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Stream #{index + 1}
                  </span>
                  {streams.length > 1 && (
                    <button
                      onClick={() => removeStream(index)}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-600 dark:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Recipient */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Recipient Address *
                    </label>
                    <input
                      type="text"
                      value={stream.recipient}
                      onChange={(e) => updateStream(index, 'recipient', e.target.value)}
                      placeholder="0x..."
                      className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-900 ${
                        errors[`${index}-recipient`]
                          ? 'border-red-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {errors[`${index}-recipient`] && (
                      <p className="text-xs text-red-500 mt-1">{errors[`${index}-recipient`]}</p>
                    )}
                  </div>

                  {/* Token */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Token *
                    </label>
                    <select
                      value={stream.token}
                      onChange={(e) => updateStream(index, 'token', e.target.value)}
                      className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-900 ${
                        errors[`${index}-token`]
                          ? 'border-red-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      <option value="">Select token</option>
                      {tokens.map(token => (
                        <option key={token.address} value={token.address}>
                          {token.symbol}
                        </option>
                      ))}
                    </select>
                    {errors[`${index}-token`] && (
                      <p className="text-xs text-red-500 mt-1">{errors[`${index}-token`]}</p>
                    )}
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Amount *
                    </label>
                    <input
                      type="number"
                      value={stream.amount}
                      onChange={(e) => updateStream(index, 'amount', e.target.value)}
                      placeholder="100"
                      min="0"
                      step="0.01"
                      className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-900 ${
                        errors[`${index}-amount`]
                          ? 'border-red-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {errors[`${index}-amount`] && (
                      <p className="text-xs text-red-500 mt-1">{errors[`${index}-amount`]}</p>
                    )}
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Duration (seconds) *
                    </label>
                    <input
                      type="number"
                      value={stream.duration}
                      onChange={(e) => updateStream(index, 'duration', e.target.value)}
                      placeholder="3600"
                      min="3600"
                      className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-900 ${
                        errors[`${index}-duration`]
                          ? 'border-red-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {errors[`${index}-duration`] && (
                      <p className="text-xs text-red-500 mt-1">{errors[`${index}-duration`]}</p>
                    )}
                  </div>

                  {/* Stream Name */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Stream Name *
                    </label>
                    <input
                      type="text"
                      value={stream.streamName}
                      onChange={(e) => updateStream(index, 'streamName', e.target.value)}
                      placeholder="Monthly Salary Payment"
                      maxLength={100}
                      className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-900 ${
                        errors[`${index}-streamName`]
                          ? 'border-red-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {errors[`${index}-streamName`] && (
                      <p className="text-xs text-red-500 mt-1">{errors[`${index}-streamName`]}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Stream Button */}
          {streams.length < 100 && (
            <button
              onClick={addStream}
              className="mt-4 w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Another Stream
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          {/* Summary */}
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Batch Creation Summary
                </p>
                <div className="mt-2 space-y-1 text-xs text-blue-800 dark:text-blue-200">
                  <div className="flex justify-between">
                    <span>Total Streams:</span>
                    <span className="font-semibold">{streams.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Amount:</span>
                    <span className="font-semibold">{totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Gas:</span>
                    <span className="font-semibold">{gasEstimate?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gas Savings:</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      ~{Math.round((1 - (gasEstimate / (streams.length * 392000))) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBatchCreate}
              disabled={loading || streams.length === 0}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Create {streams.length} Stream{streams.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
