// GPU Provider Types
export interface GPUProvider {
  id: string;
  userId: string;
  walletAddress: string;
  name: string;
  description?: string;
  location: {
    country: string;
    region?: string;
    city?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  
  // Hardware Specifications
  hardware: {
    gpus: Array<{
      model: string;
      manufacturer: 'NVIDIA' | 'AMD' | 'Intel';
      memory: number; // GB
      computeCapability: string;
      cores: number;
      clockSpeed: number; // MHz
      powerConsumption: number; // Watts
      isAvailable: boolean;
      benchmarkScore?: number;
    }>;
    cpu: {
      model: string;
      cores: number;
      threads: number;
      clockSpeed: number; // GHz
      architecture: string;
    };
    ram: {
      total: number; // GB
      type: string;
      speed: number; // MHz
    };
    storage: {
      total: number; // GB
      type: 'SSD' | 'HDD' | 'NVMe';
      readSpeed: number; // MB/s
      writeSpeed: number; // MB/s
    };
    network: {
      downloadSpeed: number; // Mbps
      uploadSpeed: number; // Mbps
      latency: number; // ms
    };
  };
  
  // Pricing
  pricing: {
    hourlyRate: number;
    currency: string;
    minimumJobDuration: number; // minutes
    setupFee: number;
    discounts: Array<{
      duration: number; // hours
      discountPercentage: number;
    }>;
  };
  
  // Availability
  availability: {
    isOnline: boolean;
    status: 'available' | 'busy' | 'maintenance' | 'offline';
    schedules: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      timezone: string;
    }>;
    maintenanceWindows: Array<{
      startDate: string;
      endDate: string;
      reason: string;
    }>;
    lastPing?: string;
    uptimePercentage: number;
  };
  
  // Performance
  performance: {
    averageJobCompletionTime: number;
    successfulJobs: number;
    failedJobs: number;
    totalJobsCompleted: number;
    averageRating: number;
    totalRatings: number;
    reliabilityScore: number;
    benchmarks: {
      tensorflow?: number;
      pytorch?: number;
      cuda?: number;
      hashrate?: number;
    };
  };
  
  // Verification
  verification: {
    isVerified: boolean;
    verificationLevel: 'basic' | 'advanced' | 'enterprise';
    verifiedAt?: string;
  };
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  lastActiveAt: string;
}

// Training Job Types
export interface TrainingJob {
  id: string;
  jobId: string;
  title: string;
  description: string;
  
  // Participants
  clientId: string;
  clientWalletAddress: string;
  providerId?: string;
  providerWalletAddress?: string;
  
  // Job Configuration
  jobType: 'training' | 'inference' | 'fine-tuning' | 'custom';
  framework: 'tensorflow' | 'pytorch' | 'huggingface' | 'custom';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Resource Requirements
  requirements: {
    gpuType: string;
    gpuMemory: number;
    gpuCount: number;
    cpuCores: number;
    ramGB: number;
    storageGB: number;
    maxDuration: number;
    estimatedDuration: number;
    computeRequirements: {
      minClockSpeed: number;
      minComputeCapability: string;
      preferredManufacturer?: 'NVIDIA' | 'AMD' | 'Intel';
    };
  };
  
  // Dataset
  dataset: {
    name: string;
    description?: string;
    size: number;
    format: string;
    storageType: 'ipfs' | 'url' | 'upload';
    location: string;
    preprocessing?: {
      required: boolean;
      instructions: string;
    };
  };
  
  // Model Configuration
  modelConfig: {
    architecture: string;
    baseModel?: string;
    hyperparameters: Record<string, any>;
    outputFormat: string;
    metrics: string[];
    checkpointFrequency: number;
  };
  
  // Environment
  environment: {
    dockerImage?: string;
    pythonVersion: string;
    dependencies: string[];
    environmentVariables: Record<string, string>;
    setupScript?: string;
    trainingScript: string;
  };
  
  // Pricing
  pricing: {
    budget: number;
    maxHourlyRate: number;
    currency: string;
    paymentType: 'fixed' | 'hourly';
    escrowAmount: number;
    deposit: number;
    totalCost?: number;
    actualCost?: number;
  };
  
  // Status
  status: 'draft' | 'posted' | 'accepted' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled' | 'disputed';
  
  // Progress
  progress: {
    percentage: number;
    currentEpoch?: number;
    totalEpochs?: number;
    currentStep?: number;
    totalSteps?: number;
    trainingLoss?: number;
    validationLoss?: number;
    accuracy?: number;
    eta?: number;
    checkpoints: Array<{
      epoch: number;
      timestamp: string;
      metrics: Record<string, number>;
      checkpointUrl?: string;
    }>;
  };
  
  // Results
  results: {
    modelUrl?: string;
    modelSize?: number;
    finalMetrics?: Record<string, number>;
    trainingLogs?: string;
    tensorboardUrl?: string;
    artifacts: Array<{
      name: string;
      type: string;
      url: string;
      size: number;
    }>;
  };
  
  // Reviews
  reviews: {
    clientReview?: {
      rating: number;
      comment: string;
      submittedAt: string;
    };
    providerReview?: {
      rating: number;
      comment: string;
      submittedAt: string;
    };
  };
  
  // Metadata
  metadata: {
    tags: string[];
    isPublic: boolean;
    isRated: boolean;
    attempts: number;
    lastHeartbeat?: string;
    ipfsHash?: string;
  };
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// Filter Types
export interface ProviderFilters {
  location?: string;
  gpuType?: string;
  gpuMemory?: {
    min: number;
    max: number;
  };
  hourlyRate?: {
    min: number;
    max: number;
  };
  availability?: 'available' | 'busy' | 'maintenance' | 'offline';
  verified?: boolean;
  rating?: {
    min: number;
    max: number;
  };
  sortBy?: 'price' | 'rating' | 'performance' | 'location' | 'newest';
  sortOrder?: 'asc' | 'desc';
}

export interface JobFilters {
  status?: TrainingJob['status'][];
  jobType?: TrainingJob['jobType'][];
  framework?: TrainingJob['framework'][];
  priority?: TrainingJob['priority'][];
  budget?: {
    min: number;
    max: number;
  };
  duration?: {
    min: number;
    max: number;
  };
  gpuRequirements?: {
    type?: string;
    memory?: number;
    count?: number;
  };
  sortBy?: 'newest' | 'budget' | 'duration' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

// Form Types
export interface JobSubmissionForm {
  // Basic Information
  title: string;
  description: string;
  jobType: TrainingJob['jobType'];
  framework: TrainingJob['framework'];
  priority: TrainingJob['priority'];
  tags: string[];
  
  // Resource Requirements
  requirements: {
    gpuType: string;
    gpuMemory: number;
    gpuCount: number;
    cpuCores: number;
    ramGB: number;
    storageGB: number;
    maxDuration: number;
    estimatedDuration: number;
    preferredManufacturer?: 'NVIDIA' | 'AMD' | 'Intel';
  };
  
  // Dataset Information
  dataset: {
    name: string;
    description: string;
    size: number;
    format: string;
    storageType: 'ipfs' | 'url' | 'upload';
    location: string;
    preprocessingRequired: boolean;
    preprocessingInstructions?: string;
  };
  
  // Model Configuration
  model: {
    architecture: string;
    baseModel?: string;
    hyperparameters: Array<{
      name: string;
      value: string | number;
      type: 'string' | 'number' | 'boolean';
    }>;
    outputFormat: string;
    metrics: string[];
    checkpointFrequency: number;
  };
  
  // Environment Setup
  environment: {
    pythonVersion: string;
    dependencies: string[];
    dockerImage?: string;
    environmentVariables: Array<{
      name: string;
      value: string;
    }>;
    setupScript?: string;
    trainingScript: string;
  };
  
  // Pricing & Budget
  pricing: {
    budget: number;
    maxHourlyRate: number;
    paymentType: 'fixed' | 'hourly';
    deposit: number;
  };
  
  // Additional Settings
  settings: {
    isPublic: boolean;
    autoStart: boolean;
    notifyOnCompletion: boolean;
    saveCheckpoints: boolean;
    enableTensorboard: boolean;
  };
}

// API Response Types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Dashboard Statistics
export interface DashboardStats {
  providers: {
    total: number;
    online: number;
    verified: number;
    averageRating: number;
  };
  jobs: {
    total: number;
    active: number;
    completed: number;
    failed: number;
    totalValue: number;
  };
  user: {
    jobsPosted: number;
    jobsCompleted: number;
    totalSpent: number;
    totalEarned: number;
    reputation: number;
    rating: number;
  };
  market: {
    averageHourlyRate: number;
    totalProviders: number;
    totalGPUs: number;
    utilizationRate: number;
  };
}

// Notification Types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
}

// WebSocket Event Types
export interface SocketEvents {
  // Job events
  'job:created': TrainingJob;
  'job:accepted': { jobId: string; providerId: string };
  'job:started': { jobId: string };
  'job:progress': { jobId: string; progress: TrainingJob['progress'] };
  'job:completed': { jobId: string; results: TrainingJob['results'] };
  'job:failed': { jobId: string; error: string };
  'job:cancelled': { jobId: string };
  
  // Provider events
  'provider:online': { providerId: string };
  'provider:offline': { providerId: string };
  'provider:status': { providerId: string; status: GPUProvider['availability']['status'] };
  
  // User events
  'notification:new': Notification;
  'message:new': { from: string; to: string; message: string };
}
