import { ethers, Contract } from 'ethers'
import type { BrowserProvider } from 'ethers'
import { toast } from 'react-hot-toast'

// Contract ABIs (simplified for demo - in production these would be imported from contract artifacts)
const ESCROW_ABI = [
  'function createEscrow(string memory jobId, address provider, uint256 amount) external payable returns (uint256)',
  'function releaseEscrow(uint256 escrowId) external',
  'function refundEscrow(uint256 escrowId) external', 
  'function getEscrow(uint256 escrowId) external view returns (tuple(string jobId, address client, address provider, uint256 amount, uint8 status, uint256 createdAt))',
  'event EscrowCreated(uint256 indexed escrowId, string indexed jobId, address indexed client, address provider, uint256 amount)',
  'event EscrowReleased(uint256 indexed escrowId, address indexed provider, uint256 amount)',
  'event EscrowRefunded(uint256 indexed escrowId, address indexed client, uint256 amount)'
]

const STAKING_ABI = [
  'function stake() external payable',
  'function unstake(uint256 amount) external',
  'function getStake(address provider) external view returns (uint256)',
  'function slashStake(address provider, uint256 amount) external',
  'event Staked(address indexed provider, uint256 amount)',
  'event Unstaked(address indexed provider, uint256 amount)',
  'event StakeSlashed(address indexed provider, uint256 amount)'
]

const REPUTATION_ABI = [
  'function submitRating(address provider, string memory jobId, uint8 rating, string memory review) external',
  'function getProviderReputation(address provider) external view returns (tuple(uint256 totalRatings, uint256 averageRating, uint256 level, uint256 experience))',
  'function updateProviderLevel(address provider) external',
  'event RatingSubmitted(address indexed provider, address indexed client, string indexed jobId, uint8 rating)',
  'event ProviderLevelUpdated(address indexed provider, uint256 newLevel)'
]

const PAYMENT_ABI = [
  'function processPayment(address to, uint256 amount, string memory jobId) external',
  'function withdrawEarnings() external',
  'function getEarnings(address provider) external view returns (uint256)',
  'event PaymentProcessed(address indexed from, address indexed to, uint256 amount, string indexed jobId)',
  'event EarningsWithdrawn(address indexed provider, uint256 amount)'
]

export interface EscrowData {
  id: number
  jobId: string
  client: string
  provider: string
  amount: BigNumber
  status: 'pending' | 'released' | 'refunded'
  createdAt: number
}

export interface StakeData {
  amount: BigNumber
  lockedUntil: number
}

export interface ReputationData {
  totalRatings: number
  averageRating: number
  level: number
  experience: number
}

export interface ContractAddresses {
  escrow: string
  staking: string
  reputation: string
  payment: string
  token?: string // For ERC-20 payments
}

class ContractService {
  private provider: BrowserProvider | null = null
  private signer: ethers.Signer | null = null
  private contracts: {
    escrow: Contract | null
    staking: Contract | null
    reputation: Contract | null
    payment: Contract | null
  } = {
    escrow: null,
    staking: null,
    reputation: null,
    payment: null
  }

  private addresses: ContractAddresses = {
    escrow: process.env.NEXT_PUBLIC_ESCROW_CONTRACT || '',
    staking: process.env.NEXT_PUBLIC_STAKING_CONTRACT || '',
    reputation: process.env.NEXT_PUBLIC_REPUTATION_CONTRACT || '',
    payment: process.env.NEXT_PUBLIC_PAYMENT_CONTRACT || '',
    token: process.env.NEXT_PUBLIC_TOKEN_CONTRACT || undefined
  }

  /**
   * Initialize Web3 connection
   */
  async initialize(): Promise<boolean> {
    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('MetaMask not detected')
      }

      this.provider = new ethers.providers.Web3Provider(window.ethereum)
      await this.provider.send('eth_requestAccounts', [])
      
      // Ensure we're on Polygon network
      const network = await this.provider.getNetwork()
      const expectedChainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '137')
      if (network.chainId !== expectedChainId) {
        throw new Error(`Please switch to Polygon network (Chain ID: ${expectedChainId})`)
      }
      this.signer = this.provider.getSigner()

      // Initialize contracts
      this.contracts.escrow = new Contract(this.addresses.escrow, ESCROW_ABI, this.signer)
      this.contracts.staking = new Contract(this.addresses.staking, STAKING_ABI, this.signer)
      this.contracts.reputation = new Contract(this.addresses.reputation, REPUTATION_ABI, this.signer)
      this.contracts.payment = new Contract(this.addresses.payment, PAYMENT_ABI, this.signer)

      // Contract service initialized successfully
      return true
    } catch (error: any) {
      console.error('Failed to initialize contract service:', error)
      toast.error(error.message || 'Failed to initialize Web3 connection')
      return false
    }
  }

  /**
   * Get current account address
   */
  async getAccount(): Promise<string | null> {
    try {
      if (!this.signer) return null
      return await this.signer.getAddress()
    } catch (error) {
      console.error('Failed to get account:', error)
      return null
    }
  }

  /**
   * Get current network
   */
  async getNetwork(): Promise<{ name: string; chainId: number } | null> {
    try {
      if (!this.provider) return null
      const network = await this.provider.getNetwork()
      return {
        name: network.name,
        chainId: network.chainId
      }
    } catch (error) {
      console.error('Failed to get network:', error)
      return null
    }
  }

  /**
   * Create an escrow for a job
   */
  async createEscrow(jobId: string, providerAddress: string, amountInPol: number): Promise<number | null> {
    try {
      if (!this.contracts.escrow) {
        throw new Error('Escrow contract not initialized')
      }

      const amount = ethers.utils.parseEther(amountInPol.toString())
      
      const tx = await this.contracts.escrow.createEscrow(
        jobId,
        providerAddress,
        amount,
        { value: amount }
      )

      toast.loading('Creating escrow...', { id: `escrow-${jobId}` })
      const receipt = await tx.wait()
      
      // Parse event to get escrow ID
      const escrowEvent = receipt.events?.find((e: any) => e.event === 'EscrowCreated')
      const escrowId = escrowEvent?.args?.escrowId?.toNumber()

      toast.success('Escrow created successfully', { id: `escrow-${jobId}` })
      return escrowId || null
    } catch (error: any) {
      console.error('Failed to create escrow:', error)
      toast.error(error.message || 'Failed to create escrow', { id: `escrow-${jobId}` })
      return null
    }
  }

  /**
   * Release escrow funds to provider
   */
  async releaseEscrow(escrowId: number): Promise<boolean> {
    try {
      if (!this.contracts.escrow) {
        throw new Error('Escrow contract not initialized')
      }

      const tx = await this.contracts.escrow.releaseEscrow(escrowId)
      
      toast.loading('Releasing escrow...', { id: `release-${escrowId}` })
      await tx.wait()
      
      toast.success('Escrow released successfully', { id: `release-${escrowId}` })
      return true
    } catch (error: any) {
      console.error('Failed to release escrow:', error)
      toast.error(error.message || 'Failed to release escrow', { id: `release-${escrowId}` })
      return false
    }
  }

  /**
   * Refund escrow to client
   */
  async refundEscrow(escrowId: number): Promise<boolean> {
    try {
      if (!this.contracts.escrow) {
        throw new Error('Escrow contract not initialized')
      }

      const tx = await this.contracts.escrow.refundEscrow(escrowId)
      
      toast.loading('Processing refund...', { id: `refund-${escrowId}` })
      await tx.wait()
      
      toast.success('Escrow refunded successfully', { id: `refund-${escrowId}` })
      return true
    } catch (error: any) {
      console.error('Failed to refund escrow:', error)
      toast.error(error.message || 'Failed to refund escrow', { id: `refund-${escrowId}` })
      return false
    }
  }

  /**
   * Get escrow details
   */
  async getEscrow(escrowId: number): Promise<EscrowData | null> {
    try {
      if (!this.contracts.escrow) {
        throw new Error('Escrow contract not initialized')
      }

      const escrow = await this.contracts.escrow.getEscrow(escrowId)
      
      return {
        id: escrowId,
        jobId: escrow.jobId,
        client: escrow.client,
        provider: escrow.provider,
        amount: escrow.amount,
        status: ['pending', 'released', 'refunded'][escrow.status] as 'pending' | 'released' | 'refunded',
        createdAt: escrow.createdAt.toNumber()
      }
    } catch (error: any) {
      console.error('Failed to get escrow:', error)
      return null
    }
  }

  /**
   * Stake POL tokens as a provider
   */
  async stakePOLTokens(amountInPol: number): Promise<boolean> {
    try {
      if (!this.contracts.staking) {
        throw new Error('Staking contract not initialized')
      }

      const amount = ethers.utils.parseEther(amountInPol.toString())
      
      const tx = await this.contracts.staking.stake({ value: amount })
      
      toast.loading('Staking tokens...', { id: 'staking' })
      await tx.wait()
      
      toast.success('Tokens staked successfully', { id: 'staking' })
      return true
    } catch (error: any) {
      console.error('Failed to stake tokens:', error)
      toast.error(error.message || 'Failed to stake tokens', { id: 'staking' })
      return false
    }
  }

  /**
   * Unstake POL tokens
   */
  async unstakePOLTokens(amountInPol: number): Promise<boolean> {
    try {
      if (!this.contracts.staking) {
        throw new Error('Staking contract not initialized')
      }

      const amount = ethers.utils.parseEther(amountInPol.toString())
      
      const tx = await this.contracts.staking.unstake(amount)
      
      toast.loading('Unstaking tokens...', { id: 'unstaking' })
      await tx.wait()
      
      toast.success('Tokens unstaked successfully', { id: 'unstaking' })
      return true
    } catch (error: any) {
      console.error('Failed to unstake tokens:', error)
      toast.error(error.message || 'Failed to unstake tokens', { id: 'unstaking' })
      return false
    }
  }

  /**
   * Get provider stake amount
   */
  async getStake(providerAddress: string): Promise<number> {
    try {
      if (!this.contracts.staking) {
        throw new Error('Staking contract not initialized')
      }

      const stake = await this.contracts.staking.getStake(providerAddress)
      return parseFloat(ethers.utils.formatEther(stake))
    } catch (error: any) {
      console.error('Failed to get stake:', error)
      return 0
    }
  }

  /**
   * Submit a rating for a provider
   */
  async submitRating(providerAddress: string, jobId: string, rating: number, review: string): Promise<boolean> {
    try {
      if (!this.contracts.reputation) {
        throw new Error('Reputation contract not initialized')
      }

      if (rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5')
      }

      const tx = await this.contracts.reputation.submitRating(
        providerAddress,
        jobId,
        rating,
        review
      )
      
      toast.loading('Submitting rating...', { id: `rating-${jobId}` })
      await tx.wait()
      
      toast.success('Rating submitted successfully', { id: `rating-${jobId}` })
      return true
    } catch (error: any) {
      console.error('Failed to submit rating:', error)
      toast.error(error.message || 'Failed to submit rating', { id: `rating-${jobId}` })
      return false
    }
  }

  /**
   * Get provider reputation
   */
  async getProviderReputation(providerAddress: string): Promise<ReputationData | null> {
    try {
      if (!this.contracts.reputation) {
        throw new Error('Reputation contract not initialized')
      }

      const reputation = await this.contracts.reputation.getProviderReputation(providerAddress)
      
      return {
        totalRatings: reputation.totalRatings.toNumber(),
        averageRating: reputation.averageRating.toNumber() / 100, // Assuming 2 decimal places
        level: reputation.level.toNumber(),
        experience: reputation.experience.toNumber()
      }
    } catch (error: any) {
      console.error('Failed to get provider reputation:', error)
      return null
    }
  }

  /**
   * Process payment to provider
   */
  async processPayment(providerAddress: string, amountInPol: number, jobId: string): Promise<boolean> {
    try {
      if (!this.contracts.payment) {
        throw new Error('Payment contract not initialized')
      }

      const amount = ethers.utils.parseEther(amountInPol.toString())
      
      const tx = await this.contracts.payment.processPayment(
        providerAddress,
        amount,
        jobId,
        { value: amount }
      )
      
      toast.loading('Processing payment...', { id: `payment-${jobId}` })
      await tx.wait()
      
      toast.success('Payment processed successfully', { id: `payment-${jobId}` })
      return true
    } catch (error: any) {
      console.error('Failed to process payment:', error)
      toast.error(error.message || 'Failed to process payment', { id: `payment-${jobId}` })
      return false
    }
  }

  /**
   * Withdraw earnings as provider
   */
  async withdrawEarnings(): Promise<boolean> {
    try {
      if (!this.contracts.payment) {
        throw new Error('Payment contract not initialized')
      }

      const tx = await this.contracts.payment.withdrawEarnings()
      
      toast.loading('Withdrawing earnings...', { id: 'withdraw' })
      await tx.wait()
      
      toast.success('Earnings withdrawn successfully', { id: 'withdraw' })
      return true
    } catch (error: any) {
      console.error('Failed to withdraw earnings:', error)
      toast.error(error.message || 'Failed to withdraw earnings', { id: 'withdraw' })
      return false
    }
  }

  /**
   * Get provider earnings
   */
  async getEarnings(providerAddress: string): Promise<number> {
    try {
      if (!this.contracts.payment) {
        throw new Error('Payment contract not initialized')
      }

      const earnings = await this.contracts.payment.getEarnings(providerAddress)
      return parseFloat(ethers.utils.formatEther(earnings))
    } catch (error: any) {
      console.error('Failed to get earnings:', error)
      return 0
    }
  }

  /**
   * Listen to contract events
   */
  setupEventListeners(callbacks: {
    onEscrowCreated?: (escrowId: number, jobId: string, client: string, provider: string, amount: BigNumber) => void
    onEscrowReleased?: (escrowId: number, provider: string, amount: BigNumber) => void
    onEscrowRefunded?: (escrowId: number, client: string, amount: BigNumber) => void
    onStaked?: (provider: string, amount: BigNumber) => void
    onUnstaked?: (provider: string, amount: BigNumber) => void
    onRatingSubmitted?: (provider: string, client: string, jobId: string, rating: number) => void
    onPaymentProcessed?: (from: string, to: string, amount: BigNumber, jobId: string) => void
  }): void {
    if (callbacks.onEscrowCreated && this.contracts.escrow) {
      this.contracts.escrow.on('EscrowCreated', callbacks.onEscrowCreated)
    }

    if (callbacks.onEscrowReleased && this.contracts.escrow) {
      this.contracts.escrow.on('EscrowReleased', callbacks.onEscrowReleased)
    }

    if (callbacks.onEscrowRefunded && this.contracts.escrow) {
      this.contracts.escrow.on('EscrowRefunded', callbacks.onEscrowRefunded)
    }

    if (callbacks.onStaked && this.contracts.staking) {
      this.contracts.staking.on('Staked', callbacks.onStaked)
    }

    if (callbacks.onUnstaked && this.contracts.staking) {
      this.contracts.staking.on('Unstaked', callbacks.onUnstaked)
    }

    if (callbacks.onRatingSubmitted && this.contracts.reputation) {
      this.contracts.reputation.on('RatingSubmitted', callbacks.onRatingSubmitted)
    }

    if (callbacks.onPaymentProcessed && this.contracts.payment) {
      this.contracts.payment.on('PaymentProcessed', callbacks.onPaymentProcessed)
    }
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners(): void {
    Object.values(this.contracts).forEach(contract => {
      if (contract) {
        contract.removeAllListeners()
      }
    })
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash: string): Promise<ethers.providers.TransactionReceipt | null> {
    try {
      if (!this.provider) return null
      return await this.provider.getTransactionReceipt(txHash)
    } catch (error) {
      console.error('Failed to get transaction receipt:', error)
      return null
    }
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(contractMethod: any, ...args: any[]): Promise<BigNumber | null> {
    try {
      return await contractMethod.estimateGas(...args)
    } catch (error) {
      console.error('Failed to estimate gas:', error)
      return null
    }
  }

  /**
   * Get current gas price
   */
  async getGasPrice(): Promise<BigNumber | null> {
    try {
      if (!this.provider) return null
      return await this.provider.getGasPrice()
    } catch (error) {
      console.error('Failed to get gas price:', error)
      return null
    }
  }

  /**
   * Format currency from Wei
   */
  formatEther(amount: BigNumber): string {
    return ethers.utils.formatEther(amount)
  }

  /**
   * Parse currency to Wei
   */
  parseEther(amount: string): BigNumber {
    return ethers.utils.parseEther(amount)
  }

  /**
   * Check if contracts are initialized
   */
  isInitialized(): boolean {
    return !!(this.provider && this.signer && this.contracts.escrow && this.contracts.staking && this.contracts.reputation && this.contracts.payment)
  }

  /**
   * Get contract addresses
   */
  getContractAddresses(): ContractAddresses {
    return this.addresses
  }
}

// Create singleton instance
export const contractService = new ContractService()

// Auto-initialize on import (optional)
if (typeof window !== 'undefined') {
  contractService.initialize().catch(console.error)
}

export default contractService
