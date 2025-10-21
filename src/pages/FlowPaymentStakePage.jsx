import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent } from '@/components/ui/card.jsx'
import { Lock, Send, AlertCircle, RefreshCw, FileText, TestTube2 } from 'lucide-react'
import { generateStakeReportPDF } from '../utils/pdfExport.js'
import { useStakeContract } from '../hooks/useStakeContract'
import { generateStakeMockData } from '../utils/stakeMockData.js'
import EscrowPoolCard from '../components/stake/EscrowPoolCard'
import WhitelistManager from '../components/stake/WhitelistManager'
import PaymentHistoryTable from '../components/stake/PaymentHistoryTable'
import StakePaymentVisualization from '../components/stake/StakePaymentVisualization'
import CreatePoolModal from '../components/stake/CreatePoolModal'
import AddWhitelistModal from '../components/stake/AddWhitelistModal'
import ExecutePaymentModal from '../components/stake/ExecutePaymentModal'
import StakeFundsModal from '../components/stake/StakeFundsModal'

export default function FlowPaymentStakePage({ walletAddress }) {
  const [testMode, setTestMode] = useState(!walletAddress) // Auto-enable if no wallet
  const [mockData, setMockData] = useState(null)
  const [userRole, setUserRole] = useState(null) // 'staker' or 'company'
  const [userPools, setUserPools] = useState([])
  const [selectedPoolId, setSelectedPoolId] = useState(null)
  const [poolData, setPoolData] = useState(null)
  const [whitelist, setWhitelist] = useState([])
  const [payments, setPayments] = useState([])
  const [availableBalance, setAvailableBalance] = useState('0')
  const [refreshing, setRefreshing] = useState(false)

  // Modals
  const [showCreatePoolModal, setShowCreatePoolModal] = useState(false)
  const [showAddWhitelistModal, setShowAddWhitelistModal] = useState(false)
  const [showExecutePaymentModal, setShowExecutePaymentModal] = useState(false)
  const [showStakeFundsModal, setShowStakeFundsModal] = useState(false)

  const {
    contract,
    loading,
    error,
    createPool,
    stakeFunds,
    addToWhitelist,
    approveWhitelist,
    executePayment,
    getPool,
    getAvailableBalance,
    getWhitelist,
    getPoolPayments,
    getCompanyPools,
    getStakerPools
  } = useStakeContract(walletAddress)

  // Generate mock data in test mode
  useEffect(() => {
    if (testMode) {
      const data = generateStakeMockData()
      setMockData(data)
      setUserRole('staker') // Default to staker view
      setSelectedPoolId(1)
      setPoolData(data.poolData)
      setWhitelist(data.whitelist)
      setPayments(data.payments)
      setAvailableBalance(data.poolData.availableBalance)
    }
  }, [testMode])

  // Detect user role and load pools
  useEffect(() => {
    if (!contract || !walletAddress) return

    const detectRoleAndLoadPools = async () => {
      try {
        // Check if user is a staker
        const stakerPools = await getStakerPools(walletAddress)
        
        // Check if user is a company
        const companyPools = await getCompanyPools(walletAddress)

        if (stakerPools.length > 0) {
          setUserRole('staker')
          setUserPools(stakerPools)
          if (stakerPools.length > 0) {
            setSelectedPoolId(stakerPools[0])
          }
        } else if (companyPools.length > 0) {
          setUserRole('company')
          setUserPools(companyPools)
          if (companyPools.length > 0) {
            setSelectedPoolId(companyPools[0])
          }
        } else {
          setUserRole('staker') // Default to staker for new users
        }
      } catch (err) {
        // console.error('Error detecting role:', err)
      }
    }

    detectRoleAndLoadPools()
  }, [contract, walletAddress])

  // Load pool data when selected pool changes
  useEffect(() => {
    if (!contract || !selectedPoolId) return

    const loadPoolData = async () => {
      setRefreshing(true)
      try {
        const pool = await getPool(selectedPoolId)
        setPoolData(pool)

        const balance = await getAvailableBalance(selectedPoolId)
        setAvailableBalance(balance)

        const wl = await getWhitelist(selectedPoolId)
        setWhitelist(wl)

        const pmts = await getPoolPayments(selectedPoolId)
        setPayments(pmts)
      } catch (err) {
        // console.error('Error loading pool data:', err)
      } finally {
        setRefreshing(false)
      }
    }

    loadPoolData()
  }, [contract, selectedPoolId])

  // Handle create pool
  const handleCreatePool = async (companyAddress, amount) => {
    try {
      const result = await createPool(companyAddress, amount)
      if (result.success && result.poolId) {
        setShowCreatePoolModal(false)
        // Reload pools
        const stakerPools = await getStakerPools(walletAddress)
        setUserPools(stakerPools)
        setSelectedPoolId(parseInt(result.poolId))
      }
    } catch (err) {
      // console.error('Error creating pool:', err)
      alert('Failed to create pool: ' + err.message)
    }
  }

  // Handle stake more funds
  const handleStakeFunds = async (amount) => {
    try {
      await stakeFunds(selectedPoolId, amount)
      setShowStakeFundsModal(false)
      // Reload pool data
      const pool = await getPool(selectedPoolId)
      setPoolData(pool)
      const balance = await getAvailableBalance(selectedPoolId)
      setAvailableBalance(balance)
    } catch (err) {
      // console.error('Error staking funds:', err)
      alert('Failed to stake funds: ' + err.message)
    }
  }

  // Handle add to whitelist
  const handleAddWhitelist = async (recipientAddress, name, category) => {
    try {
      await addToWhitelist(selectedPoolId, recipientAddress, name, category)
      setShowAddWhitelistModal(false)
      // Reload whitelist
      const wl = await getWhitelist(selectedPoolId)
      setWhitelist(wl)
    } catch (err) {
      // console.error('Error adding to whitelist:', err)
      alert('Failed to add to whitelist: ' + err.message)
    }
  }

  // Handle approve whitelist
  const handleApproveWhitelist = async (recipientAddress) => {
    try {
      await approveWhitelist(selectedPoolId, recipientAddress)
      // Reload whitelist
      const wl = await getWhitelist(selectedPoolId)
      setWhitelist(wl)
    } catch (err) {
      // console.error('Error approving whitelist:', err)
      alert('Failed to approve whitelist: ' + err.message)
    }
  }

  // Handle execute payment
  const handleExecutePayment = async (toAddress, amount, purpose) => {
    try {
      await executePayment(selectedPoolId, toAddress, amount, purpose)
      setShowExecutePaymentModal(false)
      // Reload pool data and payments
      const pool = await getPool(selectedPoolId)
      setPoolData(pool)
      const balance = await getAvailableBalance(selectedPoolId)
      setAvailableBalance(balance)
      const pmts = await getPoolPayments(selectedPoolId)
      setPayments(pmts)
    } catch (err) {
      // console.error('Error executing payment:', err)
      alert('Failed to execute payment: ' + err.message)
    }
  }

  // Handle refresh
  const handleRefresh = async () => {
    if (!contract || !selectedPoolId) return
    
    setRefreshing(true)
    try {
      const pool = await getPool(selectedPoolId)
      setPoolData(pool)
      const balance = await getAvailableBalance(selectedPoolId)
      setAvailableBalance(balance)
      const wl = await getWhitelist(selectedPoolId)
      setWhitelist(wl)
      const pmts = await getPoolPayments(selectedPoolId)
      setPayments(pmts)
    } catch (err) {
      // console.error('Error refreshing data:', err)
    } finally {
      setRefreshing(false)
    }
  }

  // Show test mode if no wallet connected
  if (!walletAddress && !testMode) {
    setTestMode(true)
  }

  return (
    <div className="space-y-6">
      {/* Test Mode Banner */}
      {testMode && (
        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
          <div className="flex items-center gap-3">
            <TestTube2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <div>
              <h3 className="text-sm font-medium text-purple-900 dark:text-purple-100">
                Demo Mode - Flow Payment (Stake)
              </h3>
              <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                Viewing demonstration of VC/LP escrow payment system. Connect wallet to access real features.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-normal text-gray-900 dark:text-white mb-1">
            Flow Payment (Stake)
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Escrow-based payment system with full traceability for VC/LP fund monitoring
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={handleRefresh}
            disabled={refreshing || !selectedPoolId}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => generateStakeReportPDF(poolData, whitelist, payments)}
            disabled={!selectedPoolId}
            variant="outline"
            size="sm"
          >
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          {userRole === 'company' && selectedPoolId && (
            <Button
              onClick={() => setShowExecutePaymentModal(true)}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Send className="h-4 w-4 mr-2" />
              New Payment
            </Button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center space-x-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Pool Info */}
        <div className="lg:col-span-1 space-y-6">
          <EscrowPoolCard
            poolId={selectedPoolId}
            poolData={poolData}
            userRole={userRole}
            availableBalance={availableBalance}
            onStakeFunds={() => setShowStakeFundsModal(true)}
            onCreatePool={() => setShowCreatePoolModal(true)}
          />
        </div>

        {/* Middle Column: Visualization */}
        <div className="lg:col-span-2">
          <Card className="border border-gray-100 dark:border-gray-800 shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Payment Flow Network
              </h3>
              <StakePaymentVisualization
                poolData={poolData}
                whitelist={whitelist}
                payments={payments}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Whitelist Management */}
      <WhitelistManager
        poolId={selectedPoolId}
        whitelist={whitelist}
        userRole={userRole}
        loading={loading}
        onAddWhitelist={() => setShowAddWhitelistModal(true)}
        onApproveWhitelist={handleApproveWhitelist}
      />

      {/* Payment History */}
      <PaymentHistoryTable
        poolId={selectedPoolId}
        payments={payments}
      />

      {/* Modals */}
      <CreatePoolModal
        isOpen={showCreatePoolModal}
        onClose={() => setShowCreatePoolModal(false)}
        onSubmit={handleCreatePool}
        loading={loading}
      />

      <AddWhitelistModal
        isOpen={showAddWhitelistModal}
        onClose={() => setShowAddWhitelistModal(false)}
        onSubmit={handleAddWhitelist}
        loading={loading}
      />

      <ExecutePaymentModal
        isOpen={showExecutePaymentModal}
        onClose={() => setShowExecutePaymentModal(false)}
        onSubmit={handleExecutePayment}
        loading={loading}
        whitelist={whitelist}
        availableBalance={availableBalance}
      />

      <StakeFundsModal
        isOpen={showStakeFundsModal}
        onClose={() => setShowStakeFundsModal(false)}
        onSubmit={handleStakeFunds}
        loading={loading}
        poolId={selectedPoolId}
        currentStake={poolData?.totalStaked}
      />
    </div>
  )
}

