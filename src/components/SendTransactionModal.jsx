import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Send, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { useWeb3 } from '../contexts/Web3Context';
import { buildPaymentTransaction, sendAndWaitForTransaction, estimateGas, getGasPrice } from '../services/transactionService';
import LoadingSpinner from './LoadingSpinner';
import { ethers } from 'ethers';

const SendTransactionModal = ({ isOpen, onClose }) => {
  const { signer, provider, chainId, balance } = useWeb3();
  
  const [formData, setFormData] = useState({
    to: '',
    amount: '',
    data: '0x',
  });
  
  const [step, setStep] = useState('form'); // 'form', 'confirm', 'signing', 'pending', 'success', 'error'
  const [txDetails, setTxDetails] = useState(null);
  const [gasEstimate, setGasEstimate] = useState(null);
  const [gasPrices, setGasPrices] = useState(null);
  const [selectedGasPrice, setSelectedGasPrice] = useState('average');
  const [error, setError] = useState(null);
  const [txHash, setTxHash] = useState(null);

  // Reset form
  const resetForm = () => {
    setFormData({ to: '', amount: '', data: '0x' });
    setStep('form');
    setTxDetails(null);
    setGasEstimate(null);
    setGasPrices(null);
    setSelectedGasPrice('average');
    setError(null);
    setTxHash(null);
  };

  // Handle form input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  // Validate form
  const validateForm = () => {
    if (!ethers.isAddress(formData.to)) {
      setError('Invalid recipient address');
      return false;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Invalid amount');
      return false;
    }

    const balanceNum = parseFloat(balance);
    if (amount > balanceNum) {
      setError('Insufficient balance');
      return false;
    }

    return true;
  };

  // Prepare transaction
  const prepareTransaction = async () => {
    if (!validateForm()) return;

    setStep('confirm');
    setError(null);

    try {
      // Build transaction
      const tx = buildPaymentTransaction({
        to: formData.to,
        amount: formData.amount,
        data: formData.data,
      });

      // Estimate gas
      const gas = await estimateGas(signer, tx);
      setGasEstimate(gas.toString());

      // Get gas prices
      const prices = await getGasPrice(provider);
      setGasPrices({
        low: ethers.formatUnits(prices.gasPrice * 80n / 100n, 'gwei'),
        average: ethers.formatUnits(prices.gasPrice, 'gwei'),
        high: ethers.formatUnits(prices.gasPrice * 120n / 100n, 'gwei'),
      });

      setTxDetails(tx);
    } catch (err) {
      console.error('Failed to prepare transaction:', err);
      setError(err.message);
      setStep('form');
    }
  };

  // Send transaction
  const sendTransaction = async () => {
    setStep('signing');
    setError(null);

    try {
      // Add gas price to transaction
      const gasPrice = gasPrices[selectedGasPrice];
      const txWithGas = {
        ...txDetails,
        gasLimit: gasEstimate,
        gasPrice: ethers.parseUnits(gasPrice, 'gwei'),
      };

      setStep('pending');

      // Send and wait for transaction
      const { tx, receipt } = await sendAndWaitForTransaction(signer, txWithGas, 1);
      
      setTxHash(tx.hash);
      setStep('success');
    } catch (err) {
      console.error('Transaction failed:', err);
      setError(err.message);
      setStep('error');
    }
  };

  // Get explorer URL
  const getExplorerUrl = () => {
    const explorers = {
      1: 'https://etherscan.io',
      5: 'https://goerli.etherscan.io',
      11155111: 'https://sepolia.etherscan.io',
      137: 'https://polygonscan.com',
      80001: 'https://mumbai.polygonscan.com',
    };
    
    const baseUrl = explorers[chainId] || 'https://etherscan.io';
    return `${baseUrl}/tx/${txHash}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Send Transaction</CardTitle>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </CardHeader>

        <CardContent>
          {/* Form Step */}
          {step === 'form' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Recipient Address
                </label>
                <input
                  type="text"
                  name="to"
                  value={formData.to}
                  onChange={handleChange}
                  placeholder="0x..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Amount (ETH)
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0.0"
                  step="0.001"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                />
                <div className="mt-1 text-sm text-gray-500">
                  Balance: {parseFloat(balance).toFixed(4)} ETH
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Data (Optional)
                </label>
                <input
                  type="text"
                  name="data"
                  value={formData.data}
                  onChange={handleChange}
                  placeholder="0x"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <Button
                onClick={prepareTransaction}
                className="w-full"
                disabled={!signer}
              >
                <Send className="h-4 w-4 mr-2" />
                Continue
              </Button>
            </div>
          )}

          {/* Confirm Step */}
          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">To:</span>
                  <span className="text-sm font-mono">
                    {formData.to.slice(0, 6)}...{formData.to.slice(-4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Amount:</span>
                  <span className="text-sm font-semibold">{formData.amount} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Gas Estimate:</span>
                  <span className="text-sm">{gasEstimate}</span>
                </div>
              </div>

              {gasPrices && (
                <div>
                  <label className="block text-sm font-medium mb-2">Gas Price</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['low', 'average', 'high'].map((speed) => (
                      <button
                        key={speed}
                        onClick={() => setSelectedGasPrice(speed)}
                        className={`p-3 rounded-lg border-2 transition-colors ${
                          selectedGasPrice === speed
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-300 dark:border-gray-700'
                        }`}
                      >
                        <div className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                          {speed}
                        </div>
                        <div className="text-sm font-semibold mt-1">
                          {gasPrices[speed]} Gwei
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => setStep('form')}
                  variant="outline"
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={sendTransaction}
                  className="flex-1"
                >
                  Confirm & Send
                </Button>
              </div>
            </div>
          )}

          {/* Signing Step */}
          {step === 'signing' && (
            <div className="text-center py-8">
              <LoadingSpinner size="lg" className="mx-auto mb-4" />
              <p className="text-lg font-medium">Waiting for signature...</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Please confirm the transaction in your wallet
              </p>
            </div>
          )}

          {/* Pending Step */}
          {step === 'pending' && (
            <div className="text-center py-8">
              <LoadingSpinner size="lg" className="mx-auto mb-4" />
              <p className="text-lg font-medium">Transaction Pending...</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Waiting for confirmation
              </p>
            </div>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-lg font-medium mb-2">Transaction Successful!</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Your transaction has been confirmed
              </p>
              <a
                href={getExplorerUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
              >
                View on Explorer
                <ExternalLink className="h-4 w-4" />
              </a>
              <Button
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                className="w-full mt-4"
              >
                Close
              </Button>
            </div>
          )}

          {/* Error Step */}
          {step === 'error' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-lg font-medium mb-2">Transaction Failed</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {error}
              </p>
              <Button
                onClick={() => setStep('form')}
                className="w-full"
              >
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SendTransactionModal;
