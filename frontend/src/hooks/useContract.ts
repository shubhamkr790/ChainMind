import { useState, useEffect, useCallback } from 'react'
import { BigNumber } from 'ethers'
import { contractService, EscrowData, ReputationData } from '@/services/contractService'
import { toast } from 'react-hot-toast'

export interface ContractState {
  isInitialized: boolean
  account: string | null
  network: { name: string; chainId: number } | null
  isLoading: boolean
  error: string | null
}

/**
 * Hook for managing Web3 contract connection and state
 */
export function useContractConnection() {
  const [state, setState] = useState<ContractState>({
    isInitialized: false,
    account: null,
    network: null,
    isLoading: true,
    error: null
  })

  useEffect(() => {
    initializeContract()
  }, [])

  const initializeContract = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const initialized = await contractService.initialize()
      if (initialized) {
        const account = await contractService.getAccount()
        const network = await contractService.getNetwork()
        
        setState({
          isInitialized: true,
          account,
          network,
          isLoading: false,
          error: null
        })
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to initialize contracts'
        }))
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Contract initialization failed'
      }))
    }
  }

  const reconnect = useCallback(async () => {
    await initializeContract()
  }, [])

  return { ...state, reconnect }
}

/**
 * Hook for escrow contract operations
 */
export function useEscrow() {
  const [escrows, setEscrows] = useState<{ [id: number]: EscrowData }>({})
  const [loading, setLoading] = useState(false)

  const createEscrow = useCallback(async (jobId: string, providerAddress: string, amountInEth: number) => {
    setLoading(true)
    try {
      const escrowId = await contractService.createEscrow(jobId, providerAddress, amountInEth)
      if (escrowId !== null) {
        // Fetch the created escrow data
        const escrowData = await contractService.getEscrow(escrowId)
        if (escrowData) {
          setEscrows(prev => ({
            ...prev,
            [escrowId]: escrowData
          }))
        }
      }
      return escrowId
    } finally {
      setLoading(false)
    }
  }, [])

  const releaseEscrow = useCallback(async (escrowId: number) => {
    setLoading(true)
    try {
      const success = await contractService.releaseEscrow(escrowId)
      if (success) {
        // Update escrow status
        setEscrows(prev => ({
          ...prev,
          [escrowId]: prev[escrowId] ? { ...prev[escrowId], status: 'released' } : prev[escrowId]
        }))
      }
      return success
    } finally {
      setLoading(false)
    }
  }, [])

  const refundEscrow = useCallback(async (escrowId: number) => {
    setLoading(true)
    try {
      const success = await contractService.refundEscrow(escrowId)
      if (success) {
        // Update escrow status
        setEscrows(prev => ({
          ...prev,
          [escrowId]: prev[escrowId] ? { ...prev[escrowId], status: 'refunded' } : prev[escrowId]
        }))
      }
      return success
    } finally {
      setLoading(false)
    }
  }, [])

  const getEscrow = useCallback(async (escrowId: number) => {
    const escrowData = await contractService.getEscrow(escrowId)
    if (escrowData) {
      setEscrows(prev => ({
        ...prev,
        [escrowId]: escrowData
      }))
    }
    return escrowData
  }, [])

  return {
    escrows,
    loading,
    createEscrow,
    releaseEscrow,
    refundEscrow,
    getEscrow
  }
}

/**
 * Hook for staking contract operations
 */
export function useStaking() {
  const [stakes, setStakes] = useState<{ [address: string]: number }>({})
  const [loading, setLoading] = useState(false)

  const stakeTokens = useCallback(async (amountInEth: number) => {
    setLoading(true)
    try {
      return await contractService.stakeTokens(amountInEth)
    } finally {
      setLoading(false)
    }
  }, [])

  const unstakeTokens = useCallback(async (amountInEth: number) => {
    setLoading(true)
    try {
      return await contractService.unstakeTokens(amountInEth)
    } finally {
      setLoading(false)
    }
  }, [])

  const getStake = useCallback(async (providerAddress: string) => {
    const stake = await contractService.getStake(providerAddress)
    setStakes(prev => ({
      ...prev,
      [providerAddress]: stake
    }))
    return stake
  }, [])

  return {
    stakes,
    loading,
    stakeTokens,
    unstakeTokens,
    getStake
  }
}

/**
 * Hook for reputation contract operations
 */
export function useReputation() {
  const [reputations, setReputations] = useState<{ [address: string]: ReputationData }>({})
  const [loading, setLoading] = useState(false)

  const submitRating = useCallback(async (providerAddress: string, jobId: string, rating: number, review: string) => {
    setLoading(true)
    try {
      return await contractService.submitRating(providerAddress, jobId, rating, review)
    } finally {
      setLoading(false)
    }
  }, [])

  const getProviderReputation = useCallback(async (providerAddress: string) => {
    const reputation = await contractService.getProviderReputation(providerAddress)
    if (reputation) {
      setReputations(prev => ({
        ...prev,
        [providerAddress]: reputation
      }))
    }
    return reputation
  }, [])

  return {
    reputations,
    loading,
    submitRating,
    getProviderReputation
  }
}

/**
 * Hook for payment contract operations
 */
export function usePayment() {
  const [earnings, setEarnings] = useState<{ [address: string]: number }>({})
  const [loading, setLoading] = useState(false)

  const processPayment = useCallback(async (providerAddress: string, amountInEth: number, jobId: string) => {
    setLoading(true)
    try {
      return await contractService.processPayment(providerAddress, amountInEth, jobId)
    } finally {
      setLoading(false)
    }
  }, [])

  const withdrawEarnings = useCallback(async () => {
    setLoading(true)
    try {
      return await contractService.withdrawEarnings()
    } finally {
      setLoading(false)
    }
  }, [])

  const getEarnings = useCallback(async (providerAddress: string) => {
    const providerEarnings = await contractService.getEarnings(providerAddress)
    setEarnings(prev => ({
      ...prev,
      [providerAddress]: providerEarnings
    }))
    return providerEarnings
  }, [])

  return {
    earnings,
    loading,
    processPayment,
    withdrawEarnings,
    getEarnings
  }
}

/**
 * Hook for listening to contract events
 */
export function useContractEvents() {
  const [events, setEvents] = useState<Array<{
    id: string
    type: string
    data: any
    timestamp: Date
  }>>([])

  useEffect(() => {
    const callbacks = {
      onEscrowCreated: (escrowId: number, jobId: string, client: string, provider: string, amount: BigNumber) => {
        const event = {
          id: `escrow-created-${escrowId}-${Date.now()}`,
          type: 'escrow-created',
          data: {
            escrowId,
            jobId,
            client,
            provider,
            amount: contractService.formatEther(amount)
          },
          timestamp: new Date()
        }
        setEvents(prev => [event, ...prev.slice(0, 49)]) // Keep last 50 events
        toast.success(`Escrow created for job ${jobId}`)
      },

      onEscrowReleased: (escrowId: number, provider: string, amount: BigNumber) => {
        const event = {
          id: `escrow-released-${escrowId}-${Date.now()}`,
          type: 'escrow-released',
          data: {
            escrowId,
            provider,
            amount: contractService.formatEther(amount)
          },
          timestamp: new Date()
        }
        setEvents(prev => [event, ...prev.slice(0, 49)])
        toast.success(`Escrow ${escrowId} released`)
      },

      onEscrowRefunded: (escrowId: number, client: string, amount: BigNumber) => {
        const event = {
          id: `escrow-refunded-${escrowId}-${Date.now()}`,
          type: 'escrow-refunded',
          data: {
            escrowId,
            client,
            amount: contractService.formatEther(amount)
          },
          timestamp: new Date()
        }
        setEvents(prev => [event, ...prev.slice(0, 49)])
        toast.info(`Escrow ${escrowId} refunded`)
      },

      onStaked: (provider: string, amount: BigNumber) => {
        const event = {
          id: `staked-${provider}-${Date.now()}`,
          type: 'staked',
          data: {
            provider,
            amount: contractService.formatEther(amount)
          },
          timestamp: new Date()
        }
        setEvents(prev => [event, ...prev.slice(0, 49)])
        toast.success(`Tokens staked: ${contractService.formatEther(amount)} ETH`)
      },

      onUnstaked: (provider: string, amount: BigNumber) => {
        const event = {
          id: `unstaked-${provider}-${Date.now()}`,
          type: 'unstaked',
          data: {
            provider,
            amount: contractService.formatEther(amount)
          },
          timestamp: new Date()
        }
        setEvents(prev => [event, ...prev.slice(0, 49)])
        toast.info(`Tokens unstaked: ${contractService.formatEther(amount)} ETH`)
      },

      onRatingSubmitted: (provider: string, client: string, jobId: string, rating: number) => {
        const event = {
          id: `rating-${jobId}-${Date.now()}`,
          type: 'rating-submitted',
          data: {
            provider,
            client,
            jobId,
            rating
          },
          timestamp: new Date()
        }
        setEvents(prev => [event, ...prev.slice(0, 49)])
        toast.success(`Rating submitted for job ${jobId}`)
      },

      onPaymentProcessed: (from: string, to: string, amount: BigNumber, jobId: string) => {
        const event = {
          id: `payment-${jobId}-${Date.now()}`,
          type: 'payment-processed',
          data: {
            from,
            to,
            amount: contractService.formatEther(amount),
            jobId
          },
          timestamp: new Date()
        }
        setEvents(prev => [event, ...prev.slice(0, 49)])
        toast.success(`Payment processed: ${contractService.formatEther(amount)} ETH`)
      }
    }

    contractService.setupEventListeners(callbacks)

    return () => {
      contractService.removeAllListeners()
    }
  }, [])

  const clearEvents = useCallback(() => {
    setEvents([])
  }, [])

  return {
    events,
    clearEvents
  }
}

/**
 * Hook for gas estimation and pricing
 */
export function useGas() {
  const [gasPrice, setGasPrice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const getGasPrice = useCallback(async () => {
    setLoading(true)
    try {
      const price = await contractService.getGasPrice()
      if (price) {
        const priceInGwei = parseFloat(contractService.formatEther(price)) * 1e9
        setGasPrice(priceInGwei.toFixed(2))
      }
      return price
    } finally {
      setLoading(false)
    }
  }, [])

  const estimateGas = useCallback(async (contractMethod: any, ...args: any[]) => {
    const gasLimit = await contractService.estimateGas(contractMethod, ...args)
    return gasLimit
  }, [])

  useEffect(() => {
    getGasPrice()
    const interval = setInterval(getGasPrice, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [getGasPrice])

  return {
    gasPrice,
    loading,
    getGasPrice,
    estimateGas
  }
}

/**
 * Comprehensive hook that combines all contract functionality
 */
export function useContract() {
  const connection = useContractConnection()
  const escrow = useEscrow()
  const staking = useStaking()
  const reputation = useReputation()
  const payment = usePayment()
  const events = useContractEvents()
  const gas = useGas()

  return {
    connection,
    escrow,
    staking,
    reputation,
    payment,
    events,
    gas,
    formatEther: contractService.formatEther,
    parseEther: contractService.parseEther,
    getContractAddresses: contractService.getContractAddresses
  }
}
