import React, { useState, useRef } from 'react';
import { X, Upload, Download, AlertCircle, CheckCircle, Loader, FileText, Trash2 } from 'lucide-react';
import { isAddress, ethers } from 'ethers';
import { createContractService, getSupportedTokens } from '../services/contractService';

/**
 * Batch Create Stream Payment Modal
 * 
 * Features:
 * - CSV template download
 * - CSV file upload (drag & drop or file picker)
 * - CSV data parsing and validation
 * - Data preview table with error highlighting
 * - Batch creation with progress tracking
 * - Success/failure statistics
 */
export default function BatchCreateStreamModal({ isOpen, onClose, onSuccess, account, provider }) {
  // UI state
  const [step, setStep] = useState(1); // 1: Upload, 2: Preview, 3: Creating, 4: Results
  const [isDragging, setIsDragging] = useState(false);
  
  // Data state
  const [csvFile, setCsvFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  
  // Progress state
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState({ success: 0, failed: 0, errors: [] });
  
  const fileInputRef = useRef(null);

  // CSV template structure
  const csvTemplate = {
    headers: ['Stream Name', 'Recipient Address', 'Token', 'Amount', 'Start Time', 'End Time'],
    example: [
      'Monthly Salary - John', '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', 'USDC', '5000', '2025-01-01T00:00', '2025-02-01T00:00',
      'Vendor Payment - ABC Corp', '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4', 'ETH', '10', '2025-01-15T00:00', '2025-01-30T00:00',
      'Freelancer - Jane Doe', '0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2', 'DAI', '2500', '2025-01-01T00:00', '2025-01-31T00:00'
    ]
  };

  // Download CSV template
  const downloadTemplate = () => {
    const csvContent = [
      csvTemplate.headers.join(','),
      ...csvTemplate.example.map(row => row)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'stream_payment_template.csv';
    link.click();
  };

  // Handle file drag events
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Handle file selection
  const handleFileSelect = (file) => {
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      alert('Please upload a CSV file');
      return;
    }

    setCsvFile(file);
    parseCSV(file);
  };

  // Parse CSV file
  const parseCSV = (file) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          alert('CSV file is empty or invalid');
          return;
        }

        // Parse header
        const headers = lines[0].split(',').map(h => h.trim());
        
        // Validate headers
        const requiredHeaders = csvTemplate.headers;
        const hasAllHeaders = requiredHeaders.every(h => 
          headers.some(header => header.toLowerCase() === h.toLowerCase())
        );

        if (!hasAllHeaders) {
          alert(`CSV must contain these headers: ${requiredHeaders.join(', ')}`);
          return;
        }

        // Parse data rows
        const data = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          
          if (values.length !== headers.length) {
            console.warn(`Row ${i + 1} has incorrect number of columns, skipping`);
            continue;
          }

          const row = {
            rowIndex: i,
            streamName: values[0],
            recipientAddress: values[1],
            token: values[2],
            amount: values[3],
            startTime: values[4],
            endTime: values[5]
          };

          data.push(row);
        }

        setParsedData(data);
        validateData(data);
        setStep(2);
      } catch (error) {
        console.error('Error parsing CSV:', error);
        alert('Failed to parse CSV file: ' + error.message);
      }
    };

    reader.onerror = () => {
      alert('Failed to read file');
    };

    reader.readAsText(file);
  };

  // Validate parsed data
  const validateData = (data) => {
    const errors = {};
    const tokens = ['ETH', 'USDC', 'DAI', 'USDT'];

    data.forEach((row, index) => {
      const rowErrors = [];

      // Validate stream name
      if (!row.streamName || row.streamName.length < 3) {
        rowErrors.push('Stream name must be at least 3 characters');
      }

      // Validate recipient address
      if (!row.recipientAddress) {
        rowErrors.push('Recipient address is required');
      } else if (!isAddress(row.recipientAddress)) {
        rowErrors.push('Invalid Ethereum address');
      } else if (row.recipientAddress.toLowerCase() === account?.toLowerCase()) {
        rowErrors.push('Cannot send to your own address');
      }

      // Validate token
      if (!row.token) {
        rowErrors.push('Token is required');
      } else if (!tokens.includes(row.token.toUpperCase())) {
        rowErrors.push(`Token must be one of: ${tokens.join(', ')}`);
      }

      // Validate amount
      if (!row.amount) {
        rowErrors.push('Amount is required');
      } else if (isNaN(row.amount) || parseFloat(row.amount) <= 0) {
        rowErrors.push('Amount must be greater than 0');
      }

      // Validate start time
      if (!row.startTime) {
        rowErrors.push('Start time is required');
      } else {
        const startDate = new Date(row.startTime);
        if (isNaN(startDate.getTime())) {
          rowErrors.push('Invalid start time format');
        } else if (startDate < new Date()) {
          rowErrors.push('Start time must be in the future');
        }
      }

      // Validate end time
      if (!row.endTime) {
        rowErrors.push('End time is required');
      } else {
        const endDate = new Date(row.endTime);
        if (isNaN(endDate.getTime())) {
          rowErrors.push('Invalid end time format');
        } else if (row.startTime) {
          const startDate = new Date(row.startTime);
          if (endDate <= startDate) {
            rowErrors.push('End time must be after start time');
          }
          const duration = (endDate - startDate) / 1000;
          if (duration < 60) {
            rowErrors.push('Duration must be at least 1 minute');
          }
        }
      }

      if (rowErrors.length > 0) {
        errors[index] = rowErrors;
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Calculate stream duration
  const getDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return '-';
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end - start;

    if (durationMs <= 0) return 'Invalid';

    const days = Math.floor(durationMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((durationMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return `${Math.floor(durationMs / (1000 * 60))}m`;
  };

  // Handle batch creation
  const handleBatchCreate = async () => {
    // Validate all data
    if (!validateData(parsedData)) {
      alert('Please fix all validation errors before creating streams');
      return;
    }

    if (!provider || !account) {
      alert('Please connect your wallet first');
      return;
    }

    setStep(3);
    setProgress(0);

    const successList = [];
    const failedList = [];

    try {
      // Create contract service instance
      const signer = await provider.getSigner();
      const contractService = createContractService(signer);
      
      // Get supported tokens mapping
      const supportedTokens = getSupportedTokens();
      const tokenMap = {};
      supportedTokens.forEach(token => {
        tokenMap[token.symbol.toUpperCase()] = token;
      });

      // Prepare batch parameters for smart contract
      const batchParams = [];
      
      for (let i = 0; i < parsedData.length; i++) {
        const row = parsedData[i];
        
        try {
          // Get token address and decimals
          const tokenSymbol = row.token.toUpperCase();
          const tokenInfo = tokenMap[tokenSymbol];
          
          if (!tokenInfo) {
            throw new Error(`Unsupported token: ${tokenSymbol}`);
          }

          // Parse amount with correct decimals
          const parsedAmount = ethers.parseUnits(
            row.amount.toString(),
            tokenInfo.decimals
          );

          // Convert timestamps to Unix time
          const startTime = Math.floor(new Date(row.startTime).getTime() / 1000);
          const endTime = Math.floor(new Date(row.endTime).getTime() / 1000);

          batchParams.push({
            recipient: row.recipientAddress,
            token: tokenInfo.address,
            totalAmount: parsedAmount.toString(),
            startTime,
            endTime
          });
          
          console.log(`Prepared stream ${i + 1}:`, {
            name: row.streamName,
            recipient: row.recipientAddress,
            token: tokenSymbol,
            amount: row.amount
          });
        } catch (error) {
          console.error(`Failed to prepare stream for row ${row.rowIndex}:`, error);
          failedList.push({
            row,
            error: error.message
          });
        }
        
        // Update progress for preparation phase (0-20%)
        setProgress(Math.round(((i + 1) / parsedData.length) * 20));
      }

      // If all rows failed preparation, show results
      if (batchParams.length === 0) {
        setResults({
          success: 0,
          failed: failedList.length,
          errors: failedList
        });
        setStep(4);
        return;
      }

      // Call smart contract to create batch streams
      console.log(`Creating batch of ${batchParams.length} streams on-chain...`);
      setProgress(30);
      
      const result = await contractService.createStreamBatch(batchParams);
      
      setProgress(80);

      if (result.success) {
        console.log('Batch creation successful:', result);
        console.log('Transaction hash:', result.txHash);
        console.log('Stream IDs:', result.streamIds);
        console.log('Gas used:', result.gasUsed);
        
        // Mark successful streams
        const successfulIndices = batchParams.map((_, index) => index);
        successfulIndices.forEach(index => {
          if (index < parsedData.length) {
            successList.push(parsedData[index]);
          }
        });
      } else {
        throw new Error(result.error || 'Batch creation failed');
      }

      setProgress(100);

      // Show results
      setResults({
        success: successList.length,
        failed: failedList.length,
        errors: failedList,
        txHash: result.txHash,
        streamIds: result.streamIds
      });

      setStep(4);

      // Call onSuccess if any streams were created
      if (successList.length > 0 && onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Batch creation failed:', error);
      
      // Mark all prepared streams as failed
      parsedData.forEach(row => {
        if (!failedList.find(f => f.row.rowIndex === row.rowIndex)) {
          failedList.push({
            row,
            error: error.message || 'Transaction failed'
          });
        }
      });
      
      setResults({
        success: 0,
        failed: failedList.length,
        errors: failedList
      });
      
      setStep(4);
    }
  };

  // Reset modal
  const handleReset = () => {
    setStep(1);
    setCsvFile(null);
    setParsedData([]);
    setValidationErrors({});
    setProgress(0);
    setResults({ success: 0, failed: 0, errors: [] });
  };

  // Close modal
  const handleClose = () => {
    handleReset();
    onClose();
  };

  if (!isOpen) return null;

  const hasErrors = Object.keys(validationErrors).length > 0;
  const validCount = parsedData.length - Object.keys(validationErrors).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Batch Create Stream Payments
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {step === 1 && 'Upload CSV file to create multiple stream payments'}
              {step === 2 && `Preview ${parsedData.length} stream${parsedData.length > 1 ? 's' : ''}`}
              {step === 3 && 'Creating stream payments...'}
              {step === 4 && 'Batch creation completed'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Upload CSV */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Download Template */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Step 1: Download CSV Template
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-400 mb-3">
                  Download the template, fill in your stream payment details, and upload it below.
                </p>
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  <Download className="w-4 h-4" />
                  Download CSV Template
                </button>
              </div>

              {/* Upload Area */}
              <div
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                <Upload className={`w-16 h-16 mx-auto mb-4 ${
                  isDragging ? 'text-blue-500' : 'text-gray-400'
                }`} />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {isDragging ? 'Drop CSV file here' : 'Upload CSV File'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Drag and drop your CSV file here, or click to browse
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors font-medium"
                >
                  Choose File
                </button>
                {csvFile && (
                  <p className="mt-4 text-sm text-green-600 dark:text-green-400 flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Selected: {csvFile.name}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Preview Data */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Streams</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{parsedData.length}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <p className="text-sm text-green-700 dark:text-green-400">Valid</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-200">{validCount}</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                  <p className="text-sm text-red-700 dark:text-red-400">Errors</p>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-200">{Object.keys(validationErrors).length}</p>
                </div>
              </div>

              {/* Error Warning */}
              {hasErrors && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
                        Validation Errors Found
                      </h3>
                      <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                        Please fix the errors highlighted in red below before proceeding.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Data Table */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">#</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Stream Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Recipient</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Token</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Duration</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {parsedData.map((row, index) => {
                        const rowHasError = validationErrors[index];
                        return (
                          <tr 
                            key={index}
                            className={rowHasError ? 'bg-red-50 dark:bg-red-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-900/50'}
                          >
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{index + 1}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{row.streamName}</td>
                            <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-400">
                              {row.recipientAddress.substring(0, 6)}...{row.recipientAddress.substring(38)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{row.token}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{row.amount}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                              {getDuration(row.startTime, row.endTime)}
                            </td>
                            <td className="px-4 py-3">
                              {rowHasError ? (
                                <div className="flex items-center gap-1 text-red-600 dark:text-red-400 text-xs">
                                  <AlertCircle className="w-4 h-4" />
                                  {validationErrors[index].length} error{validationErrors[index].length > 1 ? 's' : ''}
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs">
                                  <CheckCircle className="w-4 h-4" />
                                  Valid
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Error Details */}
              {hasErrors && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Error Details:</h3>
                  {Object.entries(validationErrors).map(([index, errors]) => (
                    <div key={index} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                      <p className="text-sm font-medium text-red-900 dark:text-red-200">
                        Row {parseInt(index) + 1}: {parsedData[index].streamName}
                      </p>
                      <ul className="mt-1 ml-4 list-disc text-sm text-red-700 dark:text-red-300">
                        {errors.map((error, i) => (
                          <li key={i}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={handleReset}
                  className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  Upload Different File
                </button>
                <button
                  onClick={handleBatchCreate}
                  disabled={hasErrors}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
                >
                  Create {validCount} Stream{validCount > 1 ? 's' : ''}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Creating */}
          {step === 3 && (
            <div className="space-y-6 py-12">
              <div className="text-center">
                <Loader className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Creating Stream Payments...
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Please wait while we create your stream payments
                </p>
              </div>

              {/* Progress Bar */}
              <div className="max-w-md mx-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Progress</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Results */}
          {step === 4 && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="text-sm text-green-700 dark:text-green-400">Successfully Created</p>
                      <p className="text-3xl font-bold text-green-900 dark:text-green-200">{results.success}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                    <div>
                      <p className="text-sm text-red-700 dark:text-red-400">Failed</p>
                      <p className="text-3xl font-bold text-red-900 dark:text-red-200">{results.failed}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Failed Items */}
              {results.failed > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Failed Streams:</h3>
                  {results.errors.map((item, index) => (
                    <div key={index} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                      <p className="text-sm font-medium text-red-900 dark:text-red-200">
                        {item.row.streamName}
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        Error: {item.error}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={handleReset}
                  className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  Create More Streams
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
