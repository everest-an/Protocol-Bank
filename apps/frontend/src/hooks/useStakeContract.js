import { useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers'
import { STAKED_ESCROW_CONFIG, STAKED_ESCROW_ABI } from '../contracts/StakedPaymentEscrowConfig'

export function useStakeContract(walletAddress) {
  const [contract, setContract] = useState(null)
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Initialize contract
  useEffect(() => {
    const initContract = async () => {
      try {
        if (typeof window.ethereum === 'undefined') {
          setError('Please install MetaMask')
          return
        }

        const ethProvider = new ethers.BrowserProvider(window.ethereum)
        const ethSigner = await ethProvider.getSigner()
        
        const contractInstance = new ethers.Contract(
          STAKED_ESCROW_CONFIG.address,
          STAKED_ESCROW_ABI,
          ethSigner
        )

        setProvider(ethProvider)
        setSigner(ethSigner)
        setContract(contractInstance)
      } catch (err) {
        // console.error('Error initializing contract:', err)
        setError(err.message)
      }
    }

    if (walletAddress) {
      initContract()
    }
  }, [walletAddress])

  // Create new escrow pool
  const createPool = useCallback(async (companyAddress, amountInEth) => {
    if (!contract) throw new Error('Contract not initialized')
    
    setLoading(true)
    setError(null)
    
    try {
      const tx = await contract.createPool(companyAddress, {
        value: ethers.parseEther(amountInEth.toString())
      })
      
      const receipt = await tx.wait()
      
      // Extract poolId from event
      const event = receipt.logs.find(log => {
        try {
          const parsed = contract.interface.parseLog(log)
          return parsed.name === 'PoolCreated'
        } catch {
          return false
        }
      })
      
      let poolId = null
      if (event) {
        const parsed = contract.interface.parseLog(event)
        poolId = parsed.args.poolId.toString()
      }
      
      setLoading(false)
      return { success: true, receipt, poolId }
    } catch (err) {
      // console.error('Error creating pool:', err)
      setError(err.message)
      setLoading(false)
      throw err
    }
  }, [contract])

  // Stake more funds to existing pool
  const stakeFunds = useCallback(async (poolId, amountInEth) => {
    if (!contract) throw new Error('Contract not initialized')
    
    setLoading(true)
    setError(null)
    
    try {
      const tx = await contract.stakeFunds(poolId, {
        value: ethers.parseEther(amountInEth.toString())
      })
      
      const receipt = await tx.wait()
      setLoading(false)
      return { success: true, receipt }
    } catch (err) {
      // console.error('Error staking funds:', err)
      setError(err.message)
      setLoading(false)
      throw err
    }
  }, [contract])

  // Add address to whitelist (company only)
  const addToWhitelist = useCallback(async (poolId, recipientAddress, name, category) => {
    if (!contract) throw new Error('Contract not initialized')
    
    setLoading(true)
    setError(null)
    
    try {
      const tx = await contract.addToWhitelist(poolId, recipientAddress, name, category)
      const receipt = await tx.wait()
      setLoading(false)
      return { success: true, receipt }
    } catch (err) {
      // console.error('Error adding to whitelist:', err)
      setError(err.message)
      setLoading(false)
      throw err
    }
  }, [contract])

  // Approve whitelist entry (staker only)
  const approveWhitelist = useCallback(async (poolId, recipientAddress) => {
    if (!contract) throw new Error('Contract not initialized')
    
    setLoading(true)
    setError(null)
    
    try {
      const tx = await contract.approveWhitelist(poolId, recipientAddress)
      const receipt = await tx.wait()
      setLoading(false)
      return { success: true, receipt }
    } catch (err) {
      // console.error('Error approving whitelist:', err)
      setError(err.message)
      setLoading(false)
      throw err
    }
  }, [contract])

  // Execute payment (company only)
  const executePayment = useCallback(async (poolId, toAddress, amountInEth, purpose) => {
    if (!contract) throw new Error('Contract not initialized')
    
    setLoading(true)
    setError(null)
    
    try {
      const tx = await contract.executePayment(
        poolId,
        toAddress,
        ethers.parseEther(amountInEth.toString()),
        purpose
      )
      
      const receipt = await tx.wait()
      setLoading(false)
      return { success: true, receipt }
    } catch (err) {
      // console.error('Error executing payment:', err)
      setError(err.message)
      setLoading(false)
      throw err
    }
  }, [contract])

  // Release funds back to staker
  const releaseFunds = useCallback(async (poolId, amountInEth) => {
    if (!contract) throw new Error('Contract not initialized')
    
    setLoading(true)
    setError(null)
    
    try {
      const tx = await contract.releaseFunds(
        poolId,
        ethers.parseEther(amountInEth.toString())
      )
      
      const receipt = await tx.wait()
      setLoading(false)
      return { success: true, receipt }
    } catch (err) {
      // console.error('Error releasing funds:', err)
      setError(err.message)
      setLoading(false)
      throw err
    }
  }, [contract])

  // Close pool
  const closePool = useCallback(async (poolId) => {
    if (!contract) throw new Error('Contract not initialized')
    
    setLoading(true)
    setError(null)
    
    try {
      const tx = await contract.closePool(poolId)
      const receipt = await tx.wait()
      setLoading(false)
      return { success: true, receipt }
    } catch (err) {
      // console.error('Error closing pool:', err)
      setError(err.message)
      setLoading(false)
      throw err
    }
  }, [contract])

  // Get pool information
  const getPool = useCallback(async (poolId) => {
    if (!contract) throw new Error('Contract not initialized')
    
    try {
      const pool = await contract.getPool(poolId)
      return {
        staker: pool.staker,
        company: pool.company,
        totalStaked: ethers.formatEther(pool.totalStaked),
        totalSpent: ethers.formatEther(pool.totalSpent),
        totalReleased: ethers.formatEther(pool.totalReleased),
        active: pool.active,
        createdAt: Number(pool.createdAt)
      }
    } catch (err) {
      // console.error('Error getting pool:', err)
      throw err
    }
  }, [contract])

  // Get available balance
  const getAvailableBalance = useCallback(async (poolId) => {
    if (!contract) throw new Error('Contract not initialized')
    
    try {
      const balance = await contract.getAvailableBalance(poolId)
      return ethers.formatEther(balance)
    } catch (err) {
      // console.error('Error getting available balance:', err)
      throw err
    }
  }, [contract])

  // Get whitelist for pool
  const getWhitelist = useCallback(async (poolId) => {
    if (!contract) throw new Error('Contract not initialized')
    
    try {
      const whitelist = await contract.getWhitelist(poolId)
      return whitelist.map(entry => ({
        recipient: entry.recipient,
        name: entry.name,
        category: entry.category,
        approved: entry.approved,
        approvedAt: Number(entry.approvedAt)
      }))
    } catch (err) {
      // console.error('Error getting whitelist:', err)
      throw err
    }
  }, [contract])

  // Get payment history for pool
  const getPoolPayments = useCallback(async (poolId) => {
    if (!contract) throw new Error('Contract not initialized')
    
    try {
      const payments = await contract.getPoolPayments(poolId)
      return payments.map(payment => ({
        poolId: Number(payment.poolId),
        from: payment.from,
        to: payment.to,
        amount: ethers.formatEther(payment.amount),
        purpose: payment.purpose,
        timestamp: Number(payment.timestamp),
        txHash: payment.txHash
      }))
    } catch (err) {
      // console.error('Error getting pool payments:', err)
      throw err
    }
  }, [contract])

  // Get company pools
  const getCompanyPools = useCallback(async (companyAddress) => {
    if (!contract) throw new Error('Contract not initialized')
    
    try {
      const poolIds = await contract.getCompanyPools(companyAddress)
      return poolIds.map(id => Number(id))
    } catch (err) {
      // console.error('Error getting company pools:', err)
      throw err
    }
  }, [contract])

  // Get staker pools
  const getStakerPools = useCallback(async (stakerAddress) => {
    if (!contract) throw new Error('Contract not initialized')
    
    try {
      const poolIds = await contract.getStakerPools(stakerAddress)
      return poolIds.map(id => Number(id))
    } catch (err) {
      // console.error('Error getting staker pools:', err)
      throw err
    }
  }, [contract])

  return {
    contract,
    provider,
    signer,
    loading,
    error,
    // Write functions
    createPool,
    stakeFunds,
    addToWhitelist,
    approveWhitelist,
    executePayment,
    releaseFunds,
    closePool,
    // Read functions
    getPool,
    getAvailableBalance,
    getWhitelist,
    getPoolPayments,
    getCompanyPools,
    getStakerPools
  }
}

