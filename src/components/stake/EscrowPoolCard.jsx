import React from 'react'
import { Card, CardContent } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { TrendingUp, DollarSign, Lock, Activity } from 'lucide-react'

export default function EscrowPoolCard({ 
  poolId, 
  poolData, 
  userRole, 
  onStakeFunds, 
  onCreatePool,
  availableBalance 
}) {
  if (!poolData) {
    return (
      <Card className="border border-gray-100 dark:border-gray-800 shadow-sm">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Escrow Pool
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {userRole === 'staker' 
                ? 'Create a new escrow pool to start monitoring company spending'
                : 'No escrow pool assigned to your company yet'}
            </p>
            {userRole === 'staker' && (
              <Button onClick={onCreatePool} className="bg-blue-600 hover:bg-blue-700 text-white">
                Create Escrow Pool
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const utilizationRate = poolData.totalStaked > 0 
    ? (parseFloat(poolData.totalSpent) / parseFloat(poolData.totalStaked)) * 100 
    : 0

  return (
    <Card className="border border-gray-100 dark:border-gray-800 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Escrow Pool #{poolId}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {userRole === 'staker' ? 'VC/LP View' : 'Company View'}
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            poolData.active 
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
          }`}>
            {poolData.active ? 'Active' : 'Closed'}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Total Staked */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                Total Staked
              </span>
            </div>
            <div className="text-2xl font-light text-gray-900 dark:text-white">
              {parseFloat(poolData.totalStaked).toFixed(4)} ETH
            </div>
          </div>

          {/* Available Balance */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">
                Available
              </span>
            </div>
            <div className="text-2xl font-light text-gray-900 dark:text-white">
              {parseFloat(availableBalance || 0).toFixed(4)} ETH
            </div>
          </div>

          {/* Total Spent */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide">
                Total Spent
              </span>
            </div>
            <div className="text-2xl font-light text-gray-900 dark:text-white">
              {parseFloat(poolData.totalSpent).toFixed(4)} ETH
            </div>
          </div>

          {/* Total Released */}
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Lock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <span className="text-xs font-medium text-orange-600 dark:text-orange-400 uppercase tracking-wide">
                Released
              </span>
            </div>
            <div className="text-2xl font-light text-gray-900 dark:text-white">
              {parseFloat(poolData.totalReleased).toFixed(4)} ETH
            </div>
          </div>
        </div>

        {/* Utilization Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Fund Utilization
            </span>
            <span className="text-xs font-medium text-gray-900 dark:text-white">
              {utilizationRate.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(utilizationRate, 100)}%` }}
            />
          </div>
        </div>

        {/* Pool Info */}
        <div className="space-y-2 mb-6 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Staker (VC/LP):</span>
            <span className="text-gray-900 dark:text-white font-mono text-xs">
              {poolData.staker.slice(0, 6)}...{poolData.staker.slice(-4)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Company:</span>
            <span className="text-gray-900 dark:text-white font-mono text-xs">
              {poolData.company.slice(0, 6)}...{poolData.company.slice(-4)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Created:</span>
            <span className="text-gray-900 dark:text-white">
              {new Date(poolData.createdAt * 1000).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Actions */}
        {userRole === 'staker' && poolData.active && (
          <div className="space-y-2">
            <Button 
              onClick={onStakeFunds}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Stake More Funds
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

