import React, { useState } from 'react'
import { X, AlertCircle, Check } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'

export default function ExecutePaymentModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  loading, 
  whitelist = [],
  availableBalance 
}) {
  const [selectedRecipient, setSelectedRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [purpose, setPurpose] = useState('')
  const [error, setError] = useState('')

  // Filter only approved whitelist entries
  const approvedWhitelist = whitelist.filter(entry => entry.approved)

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!selectedRecipient) {
      setError('Please select a recipient')
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (parseFloat(amount) > parseFloat(availableBalance)) {
      setError(`Insufficient balance. Available: ${parseFloat(availableBalance).toFixed(4)} ETH`)
      return
    }

    if (!purpose || purpose.trim().length === 0) {
      setError('Please enter a payment purpose')
      return
    }

    onSubmit(selectedRecipient, amount, purpose.trim())
  }

  const handleClose = () => {
    if (!loading) {
      setSelectedRecipient('')
      setAmount('')
      setPurpose('')
      setError('')
      onClose()
    }
  }

  if (!isOpen) return null

  const selectedEntry = approvedWhitelist.find(e => e.recipient === selectedRecipient)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md mx-4 border border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-medium text-gray-900 dark:text-white">
            Execute Payment
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Available Balance */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">
              Available Balance
            </div>
            <div className="text-2xl font-light text-blue-900 dark:text-blue-300">
              {parseFloat(availableBalance || 0).toFixed(4)} ETH
            </div>
          </div>

          {/* Recipient Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Recipient
            </label>
            {approvedWhitelist.length === 0 ? (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-900 dark:text-yellow-300">
                  No approved recipients available. Please add addresses to whitelist and wait for VC/LP approval.
                </p>
              </div>
            ) : (
              <select
                value={selectedRecipient}
                onChange={(e) => setSelectedRecipient(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white disabled:opacity-50"
              >
                <option value="">Select recipient...</option>
                {approvedWhitelist.map((entry, index) => (
                  <option key={index} value={entry.recipient}>
                    {entry.name} ({entry.category}) - {entry.recipient.slice(0, 6)}...{entry.recipient.slice(-4)}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Selected Recipient Info */}
          {selectedEntry && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-900 dark:text-green-300">
                  Approved Recipient
                </span>
              </div>
              <div className="text-xs text-green-800 dark:text-green-400 space-y-1">
                <div>Name: {selectedEntry.name}</div>
                <div>Category: {selectedEntry.category}</div>
                <div className="font-mono">{selectedEntry.recipient}</div>
              </div>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amount (ETH)
            </label>
            <input
              type="number"
              step="0.0001"
              min="0"
              max={availableBalance}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.1"
              disabled={loading || approvedWhitelist.length === 0}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white disabled:opacity-50"
            />
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Payment Purpose
            </label>
            <textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g., Monthly service fee for Q1 2025"
              rows={3}
              disabled={loading || approvedWhitelist.length === 0}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white disabled:opacity-50 resize-none"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              onClick={handleClose}
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || approvedWhitelist.length === 0}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Processing...' : 'Execute Payment'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

