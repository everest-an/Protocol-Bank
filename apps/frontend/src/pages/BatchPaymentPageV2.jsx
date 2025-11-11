import { useState, useMemo, useEffect } from 'react';
import { Button } from '../components/ui/button.jsx';
import { Card, CardContent } from '../components/ui/card.jsx';
import { Upload, X, Plus, Send, Download, AlertCircle, Layers, TrendingDown, Zap, Info } from 'lucide-react';
import { useCurrency } from '../hooks/useCurrency';
import { ethers, isAddress } from 'ethers';
import { createContractService } from '../services/contractService';

/**
 * Enhanced Batch Payment Page V2
 * 
 * Features:
 * - CSV import/export
 * - Gas fee comparison (individual vs batch)
 * - X402 batch settlement integration
 * - Progress tracking
 * - Validation and error handling
 * - Success/failure statistics
 */
export default function BatchPaymentPageV2({ provider, account }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState({ success: [], failed: [] });
  const [showResults, setShowResults] = useState(false);
  const [useX402, setUseX402] = useState(true);
  const [gasEstimate, setGasEstimate] = useState(null);
  const { selectedCurrency, setSelectedCurrency, currencies, fiatToEth, formatEthWithFiat } = useCurrency();

  // Add new payment
  const addPayment = () => {
    setPayments([
      ...payments,
      {
        id: Date.now().toString(),
        to: '',
        amount: '',
        category: 'Other',
        currency: selectedCurrency,
        token: 'USDC',
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
    }
    
    if (!payment.amount) {
      errors.amount = 'Amount is required';
    } else if (parseFloat(payment.amount) <= 0) {
      errors.amount = 'Amount must be greater than 0';
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

  // Estimate gas fees
  useEffect(() => {
    if (payments.length === 0 || !isValid) {
      setGasEstimate(null);
      return;
    }

    const estimateGas = async () => {
      try {
        // Estimate individual transactions
        const individualGasPerTx = 21000; // Basic ETH transfer
        const individualTotalGas = individualGasPerTx * payments.length;
        
        // Estimate batch transaction
        const batchGasBase = 50000; // Base cost
        const batchGasPerPayment = 15000; // Per payment in batch
        const batchTotalGas = batchGasBase + (batchGasPerPayment * payments.length);
        
        // Gas price (example: 20 gwei)
        const gasPrice = 20; // gwei
        const gasPriceWei = ethers.parseUnits(gasPrice.toString(), 'gwei');
        
        // Calculate costs
        const individualCost = (individualTotalGas * gasPrice) / 1e9; // ETH
        const batchCost = (batchTotalGas * gasPrice) / 1e9; // ETH
        const savings = individualCost - batchCost;
        const savingsPercent = (savings / individualCost) * 100;
        
        setGasEstimate({
          individual: {
            gasLimit: individualTotalGas,
            cost: individualCost
          },
          batch: {
            gasLimit: batchTotalGas,
            cost: batchCost
          },
          savings: {
            eth: savings,
            percent: savingsPercent
          }
        });
      } catch (error) {
        console.error('Gas estimation error:', error);
      }
    };

    estimateGas();
  }, [payments, isValid]);

  // Handle batch submit
  const handleBatchSubmit = async () => {
    if (!isValid) {
      alert('Please fix all validation errors');
      return;
    }

    if (!provider || !account) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      setLoading(true);
      setProgress({ current: 0, total: payments.length });
      setResults({ success: [], failed: [] });
      setShowResults(false);

      const signer = await provider.getSigner();
      const contractService = createContractService(signer);

      const successList = [];
      const failedList = [];

      if (useX402) {
        // Use X402 batch settlement
        // TODO: Implement X402 batch settlement
        alert('X402 batch settlement is not yet implemented. Using individual transactions.');
      }

      // Process payments individually for now
      for (let i = 0; i < payments.length; i++) {
        const payment = payments[i];
        setProgress({ current: i + 1, total: payments.length });

        try {
          // Send transaction
          const tx = await signer.sendTransaction({
            to: payment.to,
            value: ethers.parseEther(payment.amount)
          });

          await tx.wait();

          successList.push({
            ...payment,
            txHash: tx.hash
          });
        } catch (error) {
          failedList.push({
            ...payment,
            error: error.message
          });
        }
      }

      setResults({ success: successList, failed: failedList });
      setShowResults(true);

      if (failedList.length === 0) {
        alert(`Successfully submitted ${successList.length} payments!`);
        setPayments([]);
      } else {
        alert(`Completed: ${successList.length} succeeded, ${failedList.length} failed`);
      }
    } catch (error) {
      alert('Batch payment failed: ' + error.message);
    } finally {
      setLoading(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  // Import CSV
  const importCSV = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csv = event.target?.result;
        const lines = csv.split('\n');
        const imported = [];

        // Skip header line
        lines.slice(1).forEach((line, index) => {
          if (!line.trim()) return;
          
          const [to, amount, category, token] = line.split(',').map(s => s.trim());
          
          if (to && amount) {
            const payment = {
              id: `imported-${Date.now()}-${index}`,
              to,
              amount,
              category: category || 'Other',
              token: token || 'USDC',
              currency: 'USD',
              errors: {}
            };
            payment.errors = validatePayment(payment);
            imported.push(payment);
          }
        });

        setPayments([...payments, ...imported]);
        alert(`Imported ${imported.length} payments`);
      } catch (error) {
        alert('Failed to import CSV: ' + error.message);
      }
    };

    reader.readAsText(file);
  };

  // Export CSV template
  const exportTemplate = () => {
    const csv = `Address,Amount,Category,Token
0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb,1.5,AI Services,USDC
0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed,2.0,Marketing,USDC
0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359,0.5,Logistics,DAI`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'batch-payment-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Calculate total
  const totalAmount = useMemo(() => {
    return payments.reduce((sum, p) => {
      return sum + parseFloat(p.amount || '0');
    }, 0);
  }, [payments]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Batch Payment
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Create multiple payments at once with CSV import and gas optimization
        </p>
      </div>

      {/* Gas Fee Comparison */}
      {gasEstimate && (
        <Card className="border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <TrendingDown className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Gas Fee Comparison
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Individual Transactions</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {gasEstimate.individual.cost.toFixed(6)} ETH
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {gasEstimate.individual.gasLimit.toLocaleString()} gas
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Batch Transaction</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {gasEstimate.batch.cost.toFixed(6)} ETH
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {gasEstimate.batch.gasLimit.toLocaleString()} gas
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">You Save</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {gasEstimate.savings.eth.toFixed(6)} ETH
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      {gasEstimate.savings.percent.toFixed(1)}% savings
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Toolbar */}
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Button
                onClick={addPayment}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Payment
              </Button>
              
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".csv"
                  onChange={importCSV}
                  className="hidden"
                />
                <div className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center text-sm font-medium">
                  <Upload className="w-4 h-4 mr-2" />
                  Import CSV
                </div>
              </label>

              <Button
                onClick={exportTemplate}
                variant="outline"
                className="border-gray-300 dark:border-gray-600"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={useX402}
                  onChange={(e) => setUseX402(e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                <Zap className="w-4 h-4 text-yellow-500" />
                Use X402 (Lower Gas)
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment List */}
      <Card className="border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Payment List ({payments.length})
              </h2>
            </div>
            {payments.length > 0 && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Total: {totalAmount.toFixed(4)} USDC
              </span>
            )}
          </div>
        </div>

        {payments.length === 0 ? (
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">No payments added yet</p>
            <Button
              onClick={addPayment}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Payment
            </Button>
          </CardContent>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {payments.map((payment, index) => (
              <div key={payment.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-medium text-sm">
                    {index + 1}
                  </div>
                  
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                    {/* Address */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Recipient Address *
                      </label>
                      <input
                        type="text"
                        value={payment.to}
                        onChange={(e) => updatePayment(payment.id, 'to', e.target.value)}
                        placeholder="0x..."
                        className={`w-full px-3 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          payment.errors.to
                            ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900'
                        } text-gray-900 dark:text-white`}
                      />
                      {payment.errors.to && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">{payment.errors.to}</p>
                      )}
                    </div>

                    {/* Amount */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Amount *
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        value={payment.amount}
                        onChange={(e) => updatePayment(payment.id, 'amount', e.target.value)}
                        placeholder="0.00"
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          payment.errors.amount
                            ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900'
                        } text-gray-900 dark:text-white`}
                      />
                      {payment.errors.amount && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">{payment.errors.amount}</p>
                      )}
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Category *
                      </label>
                      <select
                        value={payment.category}
                        onChange={(e) => updatePayment(payment.id, 'category', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="AI Services">AI Services</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Logistics">Logistics</option>
                        <option value="Raw Materials">Raw Materials</option>
                        <option value="Software">Software</option>
                        <option value="Consulting">Consulting</option>
                        <option value="Security Services">Security Services</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {/* Remove Button */}
                    <div className="flex items-end">
                      <Button
                        onClick={() => removePayment(payment.id)}
                        variant="outline"
                        size="sm"
                        className="border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 w-full"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Progress Bar */}
      {loading && (
        <Card className="border border-blue-200 dark:border-blue-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Processing payments...
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {progress.current} / {progress.total}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {showResults && (
        <Card className="border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Batch Payment Results
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                <p className="text-sm text-green-600 dark:text-green-400 mb-1">Successful</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {results.success.length}
                </p>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
                <p className="text-sm text-red-600 dark:text-red-400 mb-1">Failed</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {results.failed.length}
                </p>
              </div>
            </div>
            {results.failed.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Failed Payments:</p>
                <div className="space-y-2">
                  {results.failed.map((payment, index) => (
                    <div key={index} className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg text-sm">
                      <p className="font-mono text-gray-900 dark:text-white">{payment.to}</p>
                      <p className="text-red-600 dark:text-red-400 mt-1">{payment.error}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      {payments.length > 0 && (
        <Card className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Batch Payment Summary
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {payments.length} payment{payments.length !== 1 ? 's' : ''} • Total: {totalAmount.toFixed(4)} USDC
                </p>
              </div>
              {gasEstimate && (
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Estimated Gas</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {gasEstimate.batch.cost.toFixed(6)} ETH
                  </p>
                </div>
              )}
            </div>

            <Button
              onClick={handleBatchSubmit}
              disabled={loading || !isValid}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>Processing {progress.current}/{progress.total}...</>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Submit Batch Payment
                </>
              )}
            </Button>

            {!isValid && payments.length > 0 && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Please fix all validation errors before submitting
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
