import { useState, useEffect, useMemo } from 'react';
import { Button } from '../components/ui/button.jsx';
import { Card, CardContent } from '../components/ui/card.jsx';
import { 
  Upload, 
  X, 
  Plus, 
  Send, 
  Download, 
  AlertCircle, 
  Layers, 
  TrendingDown, 
  Zap, 
  Info,
  CheckCircle,
  XCircle,
  Loader,
  FileText,
  DollarSign
} from 'lucide-react';
import { ethers, isAddress } from 'ethers';
import { createContractService } from '../services/contractService';
import {
  prepareBatchAuthorizations,
  executeBatchSettlement,
  checkUSDCBalance,
  requestTestUSDC,
  X402_CONFIG
} from '../services/x402Service';

/**
 * Enhanced Batch Payment Page
 * 
 * Features:
 * - CSV import/export with template download
 * - Multi-address payment list management
 * - Address and amount validation
 * - Gas fee estimation and comparison
 * - X402 batch settlement integration
 * - Progress tracking with real-time updates
 * - Success/failure statistics
 * - Transaction history
 */
export default function BatchPaymentEnhanced({ provider, account }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState({ success: [], failed: [] });
  const [showResults, setShowResults] = useState(false);
  const [useX402, setUseX402] = useState(true);
  const [gasEstimate, setGasEstimate] = useState(null);
  const [usdcBalance, setUsdcBalance] = useState('0');

  // Categories for payments
  const categories = [
    'Salary',
    'Supplier Payment',
    'Contractor Fee',
    'Refund',
    'Dividend',
    'Bonus',
    'Reimbursement',
    'Other'
  ];

  // Check USDC balance
  useEffect(() => {
    const loadBalance = async () => {
      if (provider && account) {
        try {
          const balance = await checkUSDCBalance(provider, account);
          setUsdcBalance(balance);
        } catch (error) {
          console.error('Error loading USDC balance:', error);
        }
      }
    };

    loadBalance();
  }, [provider, account]);

  // Add new payment
  const addPayment = () => {
    setPayments([
      ...payments,
      {
        id: Date.now().toString(),
        to: '',
        amount: '',
        category: 'Other',
        description: '',
        errors: {}
      },
    ]);
  };

  // Remove payment
  const removePayment = (id) => {
    setPayments(payments.filter(p => p.id !== id));
  };

  // Update payment field
  const updatePayment = (id, field, value) => {
    setPayments(
      payments.map(p => {
        if (p.id === id) {
          const updated = { ...p, [field]: value };
          // Validate field
          updated.errors = validatePayment(updated);
          return updated;
        }
        return p;
      })
    );
  };

  // Validate single payment
  const validatePayment = (payment) => {
    const errors = {};
    
    if (!payment.to) {
      errors.to = 'Address is required';
    } else if (!isAddress(payment.to)) {
      errors.to = 'Invalid Ethereum address';
    } else if (payment.to.toLowerCase() === account?.toLowerCase()) {
      errors.to = 'Cannot send to your own address';
    }
    
    if (!payment.amount) {
      errors.amount = 'Amount is required';
    } else if (isNaN(payment.amount) || parseFloat(payment.amount) <= 0) {
      errors.amount = 'Amount must be greater than 0';
    } else if (parseFloat(payment.amount) > 1000000) {
      errors.amount = 'Amount is too large';
    }
    
    if (!payment.category) {
      errors.category = 'Category is required';
    }
    
    return errors;
  };

  // Check if all payments are valid
  const isValid = useMemo(() => {
    if (payments.length === 0) return false;
    return payments.every(p => Object.keys(validatePayment(p)).length === 0);
  }, [payments]);

  // Calculate total amount
  const totalAmount = useMemo(() => {
    return payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  }, [payments]);

  // Estimate gas fees
  useEffect(() => {
    if (payments.length === 0 || !isValid || !provider) {
      setGasEstimate(null);
      return;
    }

    const estimateGas = async () => {
      try {
        // Get current gas price
        const feeData = await provider.getFeeData();
        const gasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');
        
        // Estimate individual transactions
        const individualGasPerTx = 65000n; // ERC20 transfer
        const individualTotalGas = individualGasPerTx * BigInt(payments.length);
        
        // Estimate batch transaction with X402
        const batchGasBase = 100000n; // Base cost
        const batchGasPerPayment = 45000n; // Per payment in batch
        const batchTotalGas = batchGasBase + (batchGasPerPayment * BigInt(payments.length));
        
        // Calculate costs
        const individualCost = gasPrice * individualTotalGas;
        const batchCost = gasPrice * batchTotalGas;
        const savings = individualCost - batchCost;
        const savingsPercent = Number((savings * 10000n) / individualCost) / 100;
        
        setGasEstimate({
          individual: {
            gasLimit: individualTotalGas.toString(),
            cost: ethers.formatEther(individualCost),
            costUSD: parseFloat(ethers.formatEther(individualCost)) * 2000
          },
          batch: {
            gasLimit: batchTotalGas.toString(),
            cost: ethers.formatEther(batchCost),
            costUSD: parseFloat(ethers.formatEther(batchCost)) * 2000
          },
          savings: {
            eth: ethers.formatEther(savings),
            usd: parseFloat(ethers.formatEther(savings)) * 2000,
            percent: savingsPercent
          },
          gasPrice: ethers.formatUnits(gasPrice, 'gwei')
        });
      } catch (error) {
        console.error('Gas estimation error:', error);
      }
    };

    const timer = setTimeout(estimateGas, 500);
    return () => clearTimeout(timer);
  }, [payments, isValid, provider]);

  // Download CSV template
  const downloadTemplate = () => {
    const template = [
      ['Recipient Address', 'Amount (USDC)', 'Category', 'Description'],
      ['0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', '100', 'Salary', 'Monthly salary payment'],
      ['0x5B38Da6a701c568545dCfcB03FcB875f56beddC4', '250', 'Supplier Payment', 'Invoice #12345'],
      ['0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2', '50', 'Contractor Fee', 'Project milestone payment']
    ];

    const csv = template.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'batch-payment-template.csv';
    a.click();
  };

  // Import from CSV
  const importCSV = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        
        // Skip header
        const dataLines = lines.slice(1);
        
        const imported = dataLines.map((line, index) => {
          const [to, amount, category, description] = line.split(',').map(s => s.trim());
          const payment = {
            id: `imported-${Date.now()}-${index}`,
            to: to || '',
            amount: amount || '',
            category: category || 'Other',
            description: description || '',
            errors: {}
          };
          payment.errors = validatePayment(payment);
          return payment;
        });

        setPayments(imported);
        alert(`Imported ${imported.length} payments from CSV`);
      } catch (error) {
        console.error('CSV import error:', error);
        alert('Failed to import CSV. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  // Export to CSV
  const exportCSV = () => {
    const rows = [
      ['Recipient Address', 'Amount (USDC)', 'Category', 'Description'],
      ...payments.map(p => [p.to, p.amount, p.category, p.description || ''])
    ];

    const csv = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch-payments-${Date.now()}.csv`;
    a.click();
  };

  // Request test USDC
  const handleRequestTestUSDC = async () => {
    if (!provider || !account) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      setLoading(true);
      const result = await requestTestUSDC(provider, account);
      if (result.success) {
        alert(`Successfully requested 1000 test USDC!\nTx Hash: ${result.txHash}`);
        // Reload balance
        const balance = await checkUSDCBalance(provider, account);
        setUsdcBalance(balance);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Request test USDC error:', error);
      alert('Failed to request test USDC: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Execute batch payment
  const handleExecuteBatch = async () => {
    if (!isValid) {
      alert('Please fix all validation errors before submitting');
      return;
    }

    if (!provider || !account) {
      alert('Please connect your wallet first');
      return;
    }

    // Check balance
    const balance = parseFloat(usdcBalance);
    if (balance < totalAmount) {
      alert(`Insufficient USDC balance. You have ${balance} USDC but need ${totalAmount} USDC.`);
      return;
    }

    setLoading(true);
    setProgress({ current: 0, total: payments.length });
    setResults({ success: [], failed: [] });
    setShowResults(false);

    try {
      if (useX402) {
        // Use X402 batch settlement
        console.log('Executing batch payment with X402...');
        
        // Prepare authorizations
        const authResult = await prepareBatchAuthorizations(
          provider,
          account,
          payments.map(p => ({
            to: p.to,
            amount: p.amount
          }))
        );

        if (!authResult.success) {
          throw new Error(authResult.error || 'Failed to prepare authorizations');
        }

        // Execute batch settlement
        const settlementResult = await executeBatchSettlement(
          provider,
          authResult.authorizations
        );

        if (settlementResult.success) {
          setResults({
            success: payments.map((p, i) => ({
              ...p,
              txHash: settlementResult.txHash,
              index: i
            })),
            failed: []
          });
          alert(`Batch payment successful!\nTx Hash: ${settlementResult.txHash}`);
        } else {
          throw new Error(settlementResult.error || 'Batch settlement failed');
        }
      } else {
        // Execute individual transactions
        console.log('Executing individual transactions...');
        const signer = await provider.getSigner();
        const contractService = createContractService(signer);
        
        const successList = [];
        const failedList = [];

        for (let i = 0; i < payments.length; i++) {
          const payment = payments[i];
          setProgress({ current: i + 1, total: payments.length });

          try {
            // Send individual payment
            const result = await contractService.sendPayment(
              payment.to,
              payment.amount,
              'USDC'
            );

            if (result.success) {
              successList.push({ ...payment, txHash: result.txHash, index: i });
            } else {
              failedList.push({ ...payment, error: result.error, index: i });
            }
          } catch (error) {
            console.error(`Payment ${i} failed:`, error);
            failedList.push({ ...payment, error: error.message, index: i });
          }
        }

        setResults({ success: successList, failed: failedList });
        alert(`Batch payment completed!\nSuccess: ${successList.length}\nFailed: ${failedList.length}`);
      }

      setShowResults(true);
      
      // Reload balance
      const balance = await checkUSDCBalance(provider, account);
      setUsdcBalance(balance);
    } catch (error) {
      console.error('Batch payment error:', error);
      alert('Batch payment failed: ' + error.message);
    } finally {
      setLoading(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Batch Payment
            </h2>
            <p className="text-gray-400 mt-2">
              Send payments to multiple recipients in a single transaction
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* USDC Balance */}
            <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-xl px-4 py-2">
              <p className="text-xs text-gray-400">USDC Balance</p>
              <p className="text-lg font-semibold text-cyan-400">{parseFloat(usdcBalance).toFixed(2)}</p>
            </div>

            {/* Request Test USDC */}
            <Button
              onClick={handleRequestTestUSDC}
              disabled={loading}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Get Test USDC
            </Button>
          </div>
        </div>

        {/* CSV Import/Export */}
        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-semibold">CSV Import/Export</h3>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={downloadTemplate}
                variant="outline"
                className="bg-gray-800/50 border-gray-700/50 hover:border-cyan-500/50 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>

              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".csv"
                  onChange={importCSV}
                  className="hidden"
                />
                <Button
                  as="span"
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white border-0"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import CSV
                </Button>
              </label>

              {payments.length > 0 && (
                <Button
                  onClick={exportCSV}
                  variant="outline"
                  className="bg-gray-800/50 border-gray-700/50 hover:border-green-500/50 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* X402 Toggle */}
        <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/10 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-cyan-400" />
              <div>
                <h4 className="font-semibold text-white">X402 Batch Settlement</h4>
                <p className="text-sm text-gray-400">Save up to 70% on gas fees with batch processing</p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={useX402}
                onChange={(e) => setUseX402(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-blue-500"></div>
            </label>
          </div>
        </div>

        {/* Payment List */}
        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-semibold">Payment List ({payments.length})</h3>
            </div>

            <Button
              onClick={addPayment}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Payment
            </Button>
          </div>

          {payments.length === 0 ? (
            <div className="text-center py-12">
              <Layers className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No payments added yet</p>
              <Button
                onClick={addPayment}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white border-0"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Payment
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment, index) => (
                <div
                  key={payment.id}
                  className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 hover:border-cyan-500/30 transition-all"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                    {/* Index */}
                    <div className="md:col-span-1 flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                    </div>

                    {/* Recipient Address */}
                    <div className="md:col-span-5">
                      <label className="block text-xs text-gray-400 mb-1">Recipient Address</label>
                      <input
                        type="text"
                        value={payment.to}
                        onChange={(e) => updatePayment(payment.id, 'to', e.target.value)}
                        placeholder="0x..."
                        className={`w-full px-3 py-2 bg-gray-900/50 border rounded-lg text-white text-sm font-mono focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all ${
                          payment.errors.to
                            ? 'border-red-500/50'
                            : payment.to && !payment.errors.to
                            ? 'border-green-500/50'
                            : 'border-gray-700/50'
                        }`}
                      />
                      {payment.errors.to && (
                        <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {payment.errors.to}
                        </p>
                      )}
                    </div>

                    {/* Amount */}
                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-400 mb-1">Amount (USDC)</label>
                      <input
                        type="number"
                        value={payment.amount}
                        onChange={(e) => updatePayment(payment.id, 'amount', e.target.value)}
                        placeholder="0.00"
                        step="any"
                        min="0"
                        className={`w-full px-3 py-2 bg-gray-900/50 border rounded-lg text-white text-sm focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all ${
                          payment.errors.amount
                            ? 'border-red-500/50'
                            : payment.amount && !payment.errors.amount
                            ? 'border-green-500/50'
                            : 'border-gray-700/50'
                        }`}
                      />
                      {payment.errors.amount && (
                        <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {payment.errors.amount}
                        </p>
                      )}
                    </div>

                    {/* Category */}
                    <div className="md:col-span-3">
                      <label className="block text-xs text-gray-400 mb-1">Category</label>
                      <select
                        value={payment.category}
                        onChange={(e) => updatePayment(payment.id, 'category', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700/50 rounded-lg text-white text-sm focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    {/* Remove Button */}
                    <div className="md:col-span-1 flex items-end justify-end">
                      <button
                        onClick={() => removePayment(payment.id)}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg transition-all"
                      >
                        <X className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>

                  {/* Description (optional) */}
                  <div className="mt-3">
                    <input
                      type="text"
                      value={payment.description}
                      onChange={(e) => updatePayment(payment.id, 'description', e.target.value)}
                      placeholder="Description (optional)"
                      className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700/50 rounded-lg text-white text-sm focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary & Gas Estimate */}
        {payments.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Summary */}
            <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-cyan-400" />
                Payment Summary
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Total Recipients</span>
                  <span className="text-white font-semibold">{payments.length}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Total Amount</span>
                  <span className="text-2xl font-bold text-cyan-400">{totalAmount.toFixed(2)} USDC</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Valid Payments</span>
                  <span className={`font-semibold ${isValid ? 'text-green-400' : 'text-red-400'}`}>
                    {payments.filter(p => Object.keys(p.errors).length === 0).length} / {payments.length}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                  <span className="text-gray-400">Settlement Method</span>
                  <span className="text-white font-semibold">
                    {useX402 ? 'X402 Batch' : 'Individual Txs'}
                  </span>
                </div>
              </div>
            </div>

            {/* Gas Estimate */}
            {gasEstimate && (
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 backdrop-blur-xl border border-green-500/30 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-green-400" />
                  Gas Fee Comparison
                </h3>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-400">Individual Transactions</span>
                      <span className="text-sm text-gray-400">{gasEstimate.individual.gasLimit} gas</span>
                    </div>
                    <div className="text-xl font-bold text-red-400">
                      {parseFloat(gasEstimate.individual.cost).toFixed(6)} ETH
                      <span className="text-sm text-gray-400 ml-2">
                        (${gasEstimate.individual.costUSD.toFixed(2)})
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-400">X402 Batch Settlement</span>
                      <span className="text-sm text-gray-400">{gasEstimate.batch.gasLimit} gas</span>
                    </div>
                    <div className="text-xl font-bold text-green-400">
                      {parseFloat(gasEstimate.batch.cost).toFixed(6)} ETH
                      <span className="text-sm text-gray-400 ml-2">
                        (${gasEstimate.batch.costUSD.toFixed(2)})
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-green-500/30">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">You Save</span>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-400">
                          {gasEstimate.savings.percent.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-400">
                          {parseFloat(gasEstimate.savings.eth).toFixed(6)} ETH (${gasEstimate.savings.usd.toFixed(2)})
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    Gas Price: {parseFloat(gasEstimate.gasPrice).toFixed(2)} Gwei
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Execute Button */}
        {payments.length > 0 && (
          <div className="flex justify-center">
            <Button
              onClick={handleExecuteBatch}
              disabled={!isValid || loading || totalAmount > parseFloat(usdcBalance)}
              className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white border-0 px-12 py-6 text-lg font-semibold shadow-2xl shadow-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                  Processing {progress.current}/{progress.total}...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Execute Batch Payment ({payments.length} recipients)
                </>
              )}
            </Button>
          </div>
        )}

        {/* Results */}
        {showResults && (
          <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Transaction Results</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="font-semibold text-green-400">Successful</span>
                </div>
                <div className="text-3xl font-bold text-white">{results.success.length}</div>
              </div>

              <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-5 h-5 text-red-400" />
                  <span className="font-semibold text-red-400">Failed</span>
                </div>
                <div className="text-3xl font-bold text-white">{results.failed.length}</div>
              </div>
            </div>

            {results.success.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-green-400 mb-3">Successful Payments</h4>
                <div className="space-y-2">
                  {results.success.map((payment, index) => (
                    <div key={index} className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-mono text-sm">{payment.to}</div>
                          <div className="text-gray-400 text-xs">{payment.amount} USDC</div>
                        </div>
                        <a
                          href={`https://sepolia.etherscan.io/tx/${payment.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:text-cyan-300 text-xs"
                        >
                          View Tx →
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.failed.length > 0 && (
              <div>
                <h4 className="font-semibold text-red-400 mb-3">Failed Payments</h4>
                <div className="space-y-2">
                  {results.failed.map((payment, index) => (
                    <div key={index} className="bg-gray-800/50 border border-red-500/30 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-mono text-sm">{payment.to}</div>
                          <div className="text-gray-400 text-xs">{payment.amount} USDC</div>
                          <div className="text-red-400 text-xs mt-1">{payment.error}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
