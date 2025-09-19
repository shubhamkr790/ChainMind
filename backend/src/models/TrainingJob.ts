import mongoose, { Document, Schema, Model, Types } from 'mongoose';

// Training Job interfaces
export interface ITrainingJob extends Document {
  // Basic Information
  jobId: string;
  title: string;
  description: string;
  
  // Participants
  clientId: Types.ObjectId;
  clientWalletAddress: string;
  providerId?: Types.ObjectId;
  providerWalletAddress?: string;
  
  // Job Configuration
  jobType: 'training' | 'inference' | 'fine-tuning' | 'custom';
  framework: 'tensorflow' | 'pytorch' | 'huggingface' | 'custom';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Resource Requirements
  requirements: {
    gpuType: string;
    gpuMemory: number; // GB
    gpuCount: number;
    cpuCores: number;
    ramGB: number;
    storageGB: number;
    maxDuration: number; // hours
    estimatedDuration: number; // hours
    computeRequirements: {
      minClockSpeed: number;
      minComputeCapability: string;
      preferredManufacturer?: string;
    };
  };
  
  // Dataset & Model Configuration
  dataset: {
    name: string;
    description?: string;
    size: number; // MB
    format: string;
    storageType: 'ipfs' | 'url' | 'upload';
    location: string; // IPFS hash, URL, or file path
    preprocessing?: {
      required: boolean;
      instructions: string;
    };
  };
  
  modelConfig: {
    architecture: string;
    baseModel?: string;
    hyperparameters: Map<string, any>;
    outputFormat: string;
    metrics: string[];
    checkpointFrequency: number; // minutes
  };
  
  // Environment & Setup
  environment: {
    dockerImage?: string;
    pythonVersion: string;
    dependencies: string[];
    environmentVariables: Map<string, string>;
    setupScript?: string;
    trainingScript: string;
  };
  
  // Pricing & Economics
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
  
  // Status & Lifecycle
  status: 'draft' | 'posted' | 'accepted' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled' | 'disputed';
  lifecycle: {
    createdAt: Date;
    postedAt?: Date;
    acceptedAt?: Date;
    startedAt?: Date;
    pausedAt?: Date;
    resumedAt?: Date;
    completedAt?: Date;
    failedAt?: Date;
    cancelledAt?: Date;
  };
  
  // Progress Tracking
  progress: {
    percentage: number;
    currentEpoch?: number;
    totalEpochs?: number;
    currentStep?: number;
    totalSteps?: number;
    trainingLoss?: number;
    validationLoss?: number;
    accuracy?: number;
    eta?: number; // estimated minutes remaining
    checkpoints: Array<{
      epoch: number;
      timestamp: Date;
      metrics: Map<string, number>;
      checkpointUrl?: string;
    }>;
  };
  
  // Results & Outputs
  results: {
    modelUrl?: string;
    modelSize?: number;
    finalMetrics?: Map<string, number>;
    trainingLogs?: string;
    tensorboardUrl?: string;
    artifacts: Array<{
      name: string;
      type: string;
      url: string;
      size: number;
    }>;
  };
  
  // Communication & Reviews
  communication: {
    messages: Array<{
      senderId: Types.ObjectId;
      senderType: 'client' | 'provider';
      message: string;
      timestamp: Date;
      isSystemMessage: boolean;
    }>;
    lastMessageAt?: Date;
  };
  
  reviews: {
    clientReview?: {
      rating: number;
      comment: string;
      submittedAt: Date;
    };
    providerReview?: {
      rating: number;
      comment: string;
      submittedAt: Date;
    };
  };
  
  // Smart Contract Integration
  blockchain: {
    escrowContractAddress?: string;
    transactionHashes: {
      created?: string;
      accepted?: string;
      completed?: string;
      disputed?: string;
    };
    gasUsed?: number;
    blockNumbers?: {
      created?: number;
      accepted?: number;
      completed?: number;
    };
  };
  
  // Dispute & Resolution
  dispute?: {
    isDisputed: boolean;
    disputeReason: string;
    disputedAt: Date;
    disputedBy: 'client' | 'provider';
    resolution?: {
      resolvedAt: Date;
      resolvedBy: string;
      outcome: 'client-favor' | 'provider-favor' | 'partial-refund';
      refundAmount?: number;
      resolutionNotes: string;
    };
  };
  
  // System & Metadata
  metadata: {
    tags: string[];
    isPublic: boolean;
    isRated: boolean;
    attempts: number;
    lastHeartbeat?: Date;
    systemNotes?: string;
    ipfsHash?: string;
  };
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Instance Methods
  updateProgress(progressData: any): Promise<void>;
  addMessage(senderId: Types.ObjectId, message: string, isSystem?: boolean): Promise<void>;
  calculateTotalCost(): number;
  canBeAcceptedBy(providerId: Types.ObjectId): Promise<boolean>;
  toPublicJSON(): object;
}

// Training Job Schema
const trainingJobSchema = new Schema<ITrainingJob>({
  // Basic Information
  jobId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200,
    trim: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000,
    trim: true
  },
  
  // Participants
  clientId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  clientWalletAddress: {
    type: String,
    required: true,
    lowercase: true,
    match: /^0x[a-fA-F0-9]{40}$/,
    index: true
  },
  providerId: {
    type: Schema.Types.ObjectId,
    ref: 'GPUProvider'
  },
  providerWalletAddress: {
    type: String,
    lowercase: true,
    match: /^0x[a-fA-F0-9]{40}$/,
    index: true
  },
  
  // Job Configuration
  jobType: {
    type: String,
    enum: ['training', 'inference', 'fine-tuning', 'custom'],
    required: true
  },
  framework: {
    type: String,
    enum: ['tensorflow', 'pytorch', 'huggingface', 'custom'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Resource Requirements
  requirements: {
    gpuType: {
      type: String,
      required: true
    },
    gpuMemory: {
      type: Number,
      required: true,
      min: 1
    },
    gpuCount: {
      type: Number,
      required: true,
      min: 1,
      max: 8
    },
    cpuCores: {
      type: Number,
      required: true,
      min: 1
    },
    ramGB: {
      type: Number,
      required: true,
      min: 1
    },
    storageGB: {
      type: Number,
      required: true,
      min: 1
    },
    maxDuration: {
      type: Number,
      required: true,
      min: 0.25
    },
    estimatedDuration: {
      type: Number,
      required: true,
      min: 0.25
    },
    computeRequirements: {
      minClockSpeed: {
        type: Number,
        min: 1
      },
      minComputeCapability: String,
      preferredManufacturer: {
        type: String,
        enum: ['NVIDIA', 'AMD', 'Intel']
      }
    }
  },
  
  // Dataset & Model Configuration
  dataset: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: String,
    size: {
      type: Number,
      required: true,
      min: 1
    },
    format: {
      type: String,
      required: true
    },
    storageType: {
      type: String,
      enum: ['ipfs', 'url', 'upload'],
      required: true
    },
    location: {
      type: String,
      required: true
    },
    preprocessing: {
      required: {
        type: Boolean,
        default: false
      },
      instructions: String
    }
  },
  
  modelConfig: {
    architecture: {
      type: String,
      required: true
    },
    baseModel: String,
    hyperparameters: {
      type: Map,
      of: Schema.Types.Mixed,
      default: new Map()
    },
    outputFormat: {
      type: String,
      required: true
    },
    metrics: {
      type: [String],
      required: true
    },
    checkpointFrequency: {
      type: Number,
      default: 30,
      min: 5
    }
  },
  
  // Environment & Setup
  environment: {
    dockerImage: String,
    pythonVersion: {
      type: String,
      required: true
    },
    dependencies: {
      type: [String],
      required: true
    },
    environmentVariables: {
      type: Map,
      of: String,
      default: new Map()
    },
    setupScript: String,
    trainingScript: {
      type: String,
      required: true
    }
  },
  
  // Pricing & Economics
  pricing: {
    budget: {
      type: Number,
      required: true,
      min: 0.01
    },
    maxHourlyRate: {
      type: Number,
      required: true,
      min: 0.01
    },
    currency: {
      type: String,
      default: 'USD'
    },
    paymentType: {
      type: String,
      enum: ['fixed', 'hourly'],
      required: true
    },
    escrowAmount: {
      type: Number,
      required: true,
      min: 0
    },
    deposit: {
      type: Number,
      required: true,
      min: 0
    },
    totalCost: Number,
    actualCost: Number
  },
  
  // Status & Lifecycle
  status: {
    type: String,
    enum: ['draft', 'posted', 'accepted', 'running', 'paused', 'completed', 'failed', 'cancelled', 'disputed'],
    default: 'draft'
  },
  lifecycle: {
    createdAt: {
      type: Date,
      default: Date.now
    },
    postedAt: Date,
    acceptedAt: Date,
    startedAt: Date,
    pausedAt: Date,
    resumedAt: Date,
    completedAt: Date,
    failedAt: Date,
    cancelledAt: Date
  },
  
  // Progress Tracking
  progress: {
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    currentEpoch: Number,
    totalEpochs: Number,
    currentStep: Number,
    totalSteps: Number,
    trainingLoss: Number,
    validationLoss: Number,
    accuracy: Number,
    eta: Number,
    checkpoints: [{
      epoch: {
        type: Number,
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      metrics: {
        type: Map,
        of: Number,
        default: new Map()
      },
      checkpointUrl: String
    }]
  },
  
  // Results & Outputs
  results: {
    modelUrl: String,
    modelSize: Number,
    finalMetrics: {
      type: Map,
      of: Number,
      default: new Map()
    },
    trainingLogs: String,
    tensorboardUrl: String,
    artifacts: [{
      name: {
        type: String,
        required: true
      },
      type: {
        type: String,
        required: true
      },
      url: {
        type: String,
        required: true
      },
      size: {
        type: Number,
        required: true,
        min: 1
      }
    }]
  },
  
  // Communication & Reviews
  communication: {
    messages: [{
      senderId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      senderType: {
        type: String,
        enum: ['client', 'provider'],
        required: true
      },
      message: {
        type: String,
        required: true,
        maxlength: 1000
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      isSystemMessage: {
        type: Boolean,
        default: false
      }
    }],
    lastMessageAt: Date
  },
  
  reviews: {
    clientReview: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: {
        type: String,
        maxlength: 500
      },
      submittedAt: Date
    },
    providerReview: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: {
        type: String,
        maxlength: 500
      },
      submittedAt: Date
    }
  },
  
  // Smart Contract Integration
  blockchain: {
    escrowContractAddress: {
      type: String,
      lowercase: true,
      match: /^0x[a-fA-F0-9]{40}$/
    },
    transactionHashes: {
      created: String,
      accepted: String,
      completed: String,
      disputed: String
    },
    gasUsed: Number,
    blockNumbers: {
      created: Number,
      accepted: Number,
      completed: Number
    }
  },
  
  // Dispute & Resolution
  dispute: {
    isDisputed: {
      type: Boolean,
      default: false
    },
    disputeReason: String,
    disputedAt: Date,
    disputedBy: {
      type: String,
      enum: ['client', 'provider']
    },
    resolution: {
      resolvedAt: Date,
      resolvedBy: String,
      outcome: {
        type: String,
        enum: ['client-favor', 'provider-favor', 'partial-refund']
      },
      refundAmount: Number,
      resolutionNotes: String
    }
  },
  
  // System & Metadata
  metadata: {
    tags: {
      type: [String]
    },
    isPublic: {
      type: Boolean,
      default: true
    },
    isRated: {
      type: Boolean,
      default: false
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0
    },
    lastHeartbeat: Date,
    systemNotes: String,
    ipfsHash: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance (jobId already has index via unique constraint)
trainingJobSchema.index({ clientId: 1 });
trainingJobSchema.index({ providerId: 1 });
trainingJobSchema.index({ status: 1 });
trainingJobSchema.index({ jobType: 1 });
trainingJobSchema.index({ framework: 1 });
trainingJobSchema.index({ priority: 1 });
trainingJobSchema.index({ 'pricing.maxHourlyRate': 1 });
trainingJobSchema.index({ 'requirements.gpuType': 1 });
trainingJobSchema.index({ 'requirements.gpuCount': 1 });
trainingJobSchema.index({ 'metadata.tags': 1 });
trainingJobSchema.index({ createdAt: -1 });
trainingJobSchema.index({ updatedAt: -1 });

// Compound indexes
trainingJobSchema.index({ status: 1, priority: -1 });
trainingJobSchema.index({ jobType: 1, framework: 1 });
trainingJobSchema.index({ status: 1, 'pricing.maxHourlyRate': 1 });

// Instance Methods
trainingJobSchema.methods.updateProgress = async function(progressData: any): Promise<void> {
  this.progress.percentage = progressData.percentage || this.progress.percentage;
  this.progress.currentEpoch = progressData.currentEpoch || this.progress.currentEpoch;
  this.progress.currentStep = progressData.currentStep || this.progress.currentStep;
  this.progress.trainingLoss = progressData.trainingLoss || this.progress.trainingLoss;
  this.progress.validationLoss = progressData.validationLoss || this.progress.validationLoss;
  this.progress.accuracy = progressData.accuracy || this.progress.accuracy;
  this.progress.eta = progressData.eta || this.progress.eta;
  
  // Add checkpoint if provided
  if (progressData.checkpoint) {
    this.progress.checkpoints.push({
      epoch: progressData.checkpoint.epoch,
      timestamp: new Date(),
      metrics: progressData.checkpoint.metrics || new Map(),
      checkpointUrl: progressData.checkpoint.url
    });
  }
  
  this.metadata.lastHeartbeat = new Date();
  await this.save();
};

trainingJobSchema.methods.addMessage = async function(senderId: Types.ObjectId, message: string, isSystem: boolean = false): Promise<void> {
  this.communication.messages.push({
    senderId,
    senderType: senderId.equals(this.clientId) ? 'client' : 'provider',
    message,
    timestamp: new Date(),
    isSystemMessage: isSystem
  });
  
  this.communication.lastMessageAt = new Date();
  await this.save();
};

trainingJobSchema.methods.calculateTotalCost = function(): number {
  if (this.pricing.paymentType === 'fixed') {
    return this.pricing.budget;
  } else {
    const duration = this.requirements.estimatedDuration;
    return duration * this.pricing.maxHourlyRate;
  }
};

trainingJobSchema.methods.canBeAcceptedBy = async function(providerId: Types.ObjectId): Promise<boolean> {
  // Check if job is in correct status
  if (this.status !== 'posted') {
    return false;
  }
  
  // Check if not already assigned
  if (this.providerId) {
    return false;
  }
  
  // Additional business logic can be added here
  // e.g., check provider capabilities, reputation, etc.
  
  return true;
};

trainingJobSchema.methods.toPublicJSON = function(): object {
  const job = this.toObject();
  
  // Remove sensitive information
  delete job.communication.messages;
  delete job.blockchain.transactionHashes;
  delete job.metadata.systemNotes;
  delete job.__v;
  
  return job;
};

// Pre-save middleware to generate jobId
trainingJobSchema.pre('save', function(next) {
  if (!this.jobId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.jobId = `job_${timestamp}_${random}`;
  }
  next();
});

// Virtuals
trainingJobSchema.virtual('duration').get(function() {
  if (this.lifecycle.completedAt && this.lifecycle.startedAt) {
    return (this.lifecycle.completedAt.getTime() - this.lifecycle.startedAt.getTime()) / (1000 * 60 * 60); // hours
  }
  return 0;
});

trainingJobSchema.virtual('isActive').get(function() {
  return ['accepted', 'running', 'paused'].includes(this.status);
});

trainingJobSchema.virtual('isCompleted').get(function() {
  return ['completed', 'failed', 'cancelled'].includes(this.status);
});

// Create and export model
export const TrainingJob: Model<ITrainingJob> = mongoose.model<ITrainingJob>('TrainingJob', trainingJobSchema);
export default TrainingJob;
