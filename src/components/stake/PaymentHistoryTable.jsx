import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card.jsx'
import { ExternalLink, ArrowUpRight, Calendar } from 'lucide-react'
import { STAKED_ESCROW_CONFIG } from '../../contracts/StakedPaymentEscrowConfig'

export default function PaymentHistoryTable({ poolId, payments = [] }) {
  const [sortField, setSortField] = useState('timestamp')
  const [sortDirection, setSortDirection] = useState('desc')

  const sortedPayments = [...payments].sort((a, b) => {
    let aVal = a[sortField]
    let bVal = b[sortField]
    
    if (sortField === 'timestamp') {
      aVal = a.timestamp
      bVal = b.timestamp
    } else if (sortField === 'amount') {
      aVal = parseFloat(a.amount)
      bVal = parseFloat(b.amount)
    }
    
    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : -1
    } else {
      return aVal < bVal ? 1 : -1
    }
  })

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const totalAmount = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0)

  return (
    <Card className="border border-gray-100 dark:border-gray-800 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Payment History
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {payments.length} transactions • {totalAmount.toFixed(4)} ETH total
            </p>
          </div>
        </div>

        {payments.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No payments yet
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th 
                    className="text-left py-3 px-2 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide cursor-pointer hover:text-gray-900 dark:hover:text-white"
                    onClick={() => handleSort('timestamp')}
                  >
                    Date {sortField === 'timestamp' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    From
                  </th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    To
                  </th>
                  <th 
                    className="text-left py-3 px-2 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide cursor-pointer hover:text-gray-900 dark:hover:text-white"
                    onClick={() => handleSort('amount')}
                  >
                    Amount {sortField === 'amount' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Purpose
                  </th>
                  <th className="text-center py-3 px-2 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Verify
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedPayments.map((payment, index) => (
                  <tr 
                    key={index}
                    className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                  >
                    <td className="py-3 px-2">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {new Date(payment.timestamp * 1000).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(payment.timestamp * 1000).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="text-sm font-mono text-gray-600 dark:text-gray-400">
                        {payment.from.slice(0, 6)}...{payment.from.slice(-4)}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="text-sm font-mono text-gray-600 dark:text-gray-400">
                        {payment.to.slice(0, 6)}...{payment.to.slice(-4)}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center space-x-1">
                        <ArrowUpRight className="h-3 w-3 text-red-500" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {parseFloat(payment.amount).toFixed(4)} ETH
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                        {payment.purpose}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <a
                        href={`${STAKED_ESCROW_CONFIG.explorerUrl}/tx/${payment.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary */}
        {payments.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-light text-gray-900 dark:text-white">
                  {payments.length}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Total Payments
                </div>
              </div>
              <div>
                <div className="text-2xl font-light text-gray-900 dark:text-white">
                  {totalAmount.toFixed(4)} ETH
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Total Amount
                </div>
              </div>
              <div>
                <div className="text-2xl font-light text-gray-900 dark:text-white">
                  {payments.length > 0 ? (totalAmount / payments.length).toFixed(4) : '0.0000'} ETH
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Average Payment
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

