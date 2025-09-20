import { Address } from 'viem'

// User types
export interface User {
  id: string
  walletAddress: Address
  userType: UserType
  reputation: number
  totalJobs: number
  joinDate: string
  isVerified: boolean
  profile?: UserProfile
}

export type UserType = 'developer' | 'provider' | 'both'

export interface UserProfile {
  displayName?: string
  avatar?: string
  bio?: string
  location?: string
  website?: string
  twitter?: string
  github?: string
}

// GPU Provider types
export interface GPUProvider {
  id: string
  userId: string
  hardwareSpecs: HardwareSpecs
  location: string
  pricePerHour: number
  availability: ProviderAvailability
  stakeAmount: number
  uptime: number
  benchmarkScore: number
  createdAt: string
  updatedAt: string
}

export interface HardwareSpecs {
  gpuModel: string
  vram: number
  cpu: string
  ram: number
  storage: number
  bandwidth: number
  cudaCores?: number
  tensorCores?: number
}

export type ProviderAvailability = 'available' | 'busy' | 'offline'

// Training Job types
export interface TrainingJob {
  id: string
  developerId: string
  providerId?: string
  title: string
  description?: string
  datasetHash: string
  datasetSize: number
  modelType: ModelType
  framework: AIFramework
  computeRequirements: ComputeRequirements
  maxPrice: number
  estimatedDuration: number
  status: JobStatus
  startTime?: string
  endTime?: string
  proofOfCompute?: string
  resultHash?: string
  createdAt: string
  updatedAt: string
}

export type JobStatus = 'pending' | 'active' | 'completed' | 'failed' | 'cancelled'
export type ModelType = 'image_classification' | 'nlp' | 'computer_vision' | 'reinforcement_learning' | 'custom'
export type AIFramework = 'tensorflow' | 'pytorch' | 'jax' | 'huggingface' | 'custom'

export interface ComputeRequirements {
  gpuHours: number
  minVram: number
  minCudaCores?: number
  preferredGpuModel?: string
  parallelProcessing?: boolean
}

// Transaction types
export interface Transaction {
  id: string
  jobId?: string
  fromUser: string
  toUser: string
  amount: number
  transactionType: TransactionType
  blockchainTxHash?: string
  timestamp: string
  status: TransactionStatus
}

export type TransactionType = 'escrow' | 'payment' | 'stake' | 'unstake' | 'refund' | 'fee'
export type TransactionStatus = 'pending' | 'confirmed' | 'failed'

// Reputation types
export interface ReputationEvent {
  id: string
  userId: string
  jobId?: string
  eventType: ReputationEventType
  reputationChange: number
  timestamp: string
  verificationProof?: string
  description?: string
}

export type ReputationEventType = 'job_completed' | 'uptime' | 'dispute_resolved' | 'rating_received' | 'benchmark_passed'

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// Filter and search types
export interface ProviderFilters {
  gpuModel?: string[]
  minVram?: number
  maxPricePerHour?: number
  minReputation?: number
  location?: string[]
  availability?: ProviderAvailability[]
}

export interface JobFilters {
  status?: JobStatus[]
  modelType?: ModelType[]
  framework?: AIFramework[]
  minBudget?: number
  maxBudget?: number
  developerId?: string
  providerId?: string
}

// Socket.io events
export interface SocketEvents {
  // Job events
  'job:created': (job: TrainingJob) => void
  'job:accepted': (jobId: string, providerId: string) => void
  'job:started': (jobId: string) => void
  'job:progress': (jobId: string, progress: number) => void
  'job:completed': (jobId: string, resultHash: string) => void
  'job:failed': (jobId: string, error: string) => void
  
  // Provider events
  'provider:online': (providerId: string) => void
  'provider:offline': (providerId: string) => void
  'provider:busy': (providerId: string, jobId: string) => void
  
  // Transaction events
  'transaction:confirmed': (transactionId: string) => void
  'transaction:failed': (transactionId: string, error: string) => void
  
  // Reputation events
  'reputation:updated': (userId: string, newReputation: number) => void
}

// Form validation schemas (for react-hook-form)
export interface CreateJobFormData {
  title: string
  description?: string
  modelType: ModelType
  framework: AIFramework
  datasetFile: File
  computeRequirements: ComputeRequirements
  maxPrice: number
  estimatedDuration: number
}

export interface RegisterProviderFormData {
  hardwareSpecs: HardwareSpecs
  location: string
  pricePerHour: number
  stakeAmount: number
}

// Smart contract types
export interface ContractAddresses {
  escrow: Address
  reputation: Address
  token: Address
}

// Environment configuration
export interface EnvConfig {
  NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: string
  NEXT_PUBLIC_POLYGON_RPC_URL: string
  NEXT_PUBLIC_POLYGON_MUMBAI_RPC_URL: string
  NEXT_PUBLIC_IPFS_GATEWAY: string
  NEXT_PUBLIC_API_URL: string
  NEXT_PUBLIC_SOCKET_URL: string
}
