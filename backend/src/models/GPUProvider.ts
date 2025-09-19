import mongoose, { Document, Schema, Model, Types } from 'mongoose';

// GPU Provider interfaces
export interface IGPUProvider extends Document {
  // Owner Information
  userId: Types.ObjectId;
  walletAddress: string;
  
  // Provider Details
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
      manufacturer: string;
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
      type: string; // DDR4, DDR5, etc.
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
  
  // Pricing & Economics
  pricing: {
    hourlyRate: number; // USD per hour per GPU
    currency: string;
    minimumJobDuration: number; // minutes
    setupFee: number;
    discounts: Array<{
      duration: number; // hours
      discountPercentage: number;
    }>;
  };
  
  // Availability & Scheduling
  availability: {
    isOnline: boolean;
    status: 'available' | 'busy' | 'maintenance' | 'offline';
    schedules: Array<{
      dayOfWeek: number; // 0-6 (Sunday to Saturday)
      startTime: string; // HH:mm
      endTime: string; // HH:mm
      timezone: string;
    }>;
    maintenanceWindows: Array<{
      startDate: Date;
      endDate: Date;
      reason: string;
    }>;
    lastPing: Date;
    uptimePercentage: number;
  };
  
  // Performance & Reliability
  performance: {
    averageJobCompletionTime: number; // hours
    successfulJobs: number;
    failedJobs: number;
    totalJobsCompleted: number;
    averageRating: number;
    totalRatings: number;
    reliabilityScore: number;
    benchmarks: {
      tensorflow: number;
      pytorch: number;
      cuda: number;
      hashrate?: number;
    };
  };
  
  // Security & Compliance
  security: {
    encryptionEnabled: boolean;
    vpnRequired: boolean;
    whitelistedIPs: string[];
    securityCertifications: string[];
    dataRetentionPolicy: string;
    isKYCCompliant: boolean;
  };
  
  // Software & Environment
  software: {
    operatingSystem: string;
    dockerSupport: boolean;
    supportedFrameworks: string[];
    pythonVersions: string[];
    cudaVersions: string[];
    customImages: Array<{
      name: string;
      description: string;
      dockerImage: string;
      size: number; // MB
    }>;
  };
  
  // Financial & Earnings
  earnings: {
    totalEarned: number;
    pendingPayouts: number;
    lastPayoutDate?: Date;
    averageMonthlyEarnings: number;
    totalJobHours: number;
  };
  
  // Verification & Trust
  verification: {
    isVerified: boolean;
    verificationLevel: 'basic' | 'advanced' | 'enterprise';
    verifiedAt?: Date;
    verificationDocuments: Array<{
      type: string;
      url: string;
      status: 'pending' | 'approved' | 'rejected';
    }>;
    auditReports: Array<{
      date: Date;
      auditor: string;
      score: number;
      reportUrl: string;
    }>;
  };
  
  // Provider Settings
  settings: {
    autoAcceptJobs: boolean;
    maxConcurrentJobs: number;
    jobTypesAllowed: string[];
    minimumJobValue: number;
    requireDeposit: boolean;
    allowSpotInstances: boolean;
    notificationPreferences: {
      newJobs: boolean;
      jobUpdates: boolean;
      payments: boolean;
      maintenance: boolean;
    };
  };
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;
  
  // Instance Methods
  calculateHourlyRate(): number;
  updatePerformanceMetrics(jobData: any): Promise<void>;
  checkAvailability(): boolean;
  toPublicJSON(): object;
}

// GPU Provider Schema
const gpuProviderSchema = new Schema<IGPUProvider>({
  // Owner Information
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  walletAddress: {
    type: String,
    required: true,
    lowercase: true,
    match: /^0x[a-fA-F0-9]{40}$/
  },
  
  // Provider Details
  name: {
    type: String,
    required: true,
    maxlength: 100,
    trim: true
  },
  description: {
    type: String,
    maxlength: 1000,
    trim: true
  },
  location: {
    country: {
      type: String,
      required: true
    },
    region: String,
    city: String,
    coordinates: {
      lat: {
        type: Number,
        min: -90,
        max: 90
      },
      lng: {
        type: Number,
        min: -180,
        max: 180
      }
    }
  },
  
  // Hardware Specifications
  hardware: {
    gpus: [{
      model: {
        type: String,
        required: true
      },
      manufacturer: {
        type: String,
        required: true,
        enum: ['NVIDIA', 'AMD', 'Intel']
      },
      memory: {
        type: Number,
        required: true,
        min: 1
      },
      computeCapability: String,
      cores: {
        type: Number,
        min: 1
      },
      clockSpeed: {
        type: Number,
        min: 1
      },
      powerConsumption: {
        type: Number,
        min: 1
      },
      isAvailable: {
        type: Boolean,
        default: true
      },
      benchmarkScore: Number
    }],
    cpu: {
      model: {
        type: String,
        required: true
      },
      cores: {
        type: Number,
        required: true,
        min: 1
      },
      threads: {
        type: Number,
        required: true,
        min: 1
      },
      clockSpeed: {
        type: Number,
        required: true,
        min: 0.1
      },
      architecture: {
        type: String,
        required: true
      }
    },
    ram: {
      total: {
        type: Number,
        required: true,
        min: 1
      },
      type: {
        type: String,
        required: true
      },
      speed: {
        type: Number,
        required: true,
        min: 1
      }
    },
    storage: {
      total: {
        type: Number,
        required: true,
        min: 1
      },
      type: {
        type: String,
        enum: ['SSD', 'HDD', 'NVMe'],
        required: true
      },
      readSpeed: {
        type: Number,
        min: 1
      },
      writeSpeed: {
        type: Number,
        min: 1
      }
    },
    network: {
      downloadSpeed: {
        type: Number,
        required: true,
        min: 1
      },
      uploadSpeed: {
        type: Number,
        required: true,
        min: 1
      },
      latency: {
        type: Number,
        required: true,
        min: 1
      }
    }
  },
  
  // Pricing & Economics
  pricing: {
    hourlyRate: {
      type: Number,
      required: true,
      min: 0.01
    },
    currency: {
      type: String,
      default: 'USD'
    },
    minimumJobDuration: {
      type: Number,
      default: 60,
      min: 15
    },
    setupFee: {
      type: Number,
      default: 0,
      min: 0
    },
    discounts: [{
      duration: {
        type: Number,
        required: true,
        min: 1
      },
      discountPercentage: {
        type: Number,
        required: true,
        min: 0,
        max: 50
      }
    }]
  },
  
  // Availability & Scheduling
  availability: {
    isOnline: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['available', 'busy', 'maintenance', 'offline'],
      default: 'offline'
    },
    schedules: [{
      dayOfWeek: {
        type: Number,
        required: true,
        min: 0,
        max: 6
      },
      startTime: {
        type: String,
        required: true,
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      },
      endTime: {
        type: String,
        required: true,
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      },
      timezone: {
        type: String,
        required: true
      }
    }],
    maintenanceWindows: [{
      startDate: {
        type: Date,
        required: true
      },
      endDate: {
        type: Date,
        required: true
      },
      reason: {
        type: String,
        required: true
      }
    }],
    lastPing: Date,
    uptimePercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  
  // Performance & Reliability
  performance: {
    averageJobCompletionTime: {
      type: Number,
      default: 0,
      min: 0
    },
    successfulJobs: {
      type: Number,
      default: 0,
      min: 0
    },
    failedJobs: {
      type: Number,
      default: 0,
      min: 0
    },
    totalJobsCompleted: {
      type: Number,
      default: 0,
      min: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalRatings: {
      type: Number,
      default: 0,
      min: 0
    },
    reliabilityScore: {
      type: Number,
      default: 1000,
      min: 0,
      max: 10000
    },
    benchmarks: {
      tensorflow: Number,
      pytorch: Number,
      cuda: Number,
      hashrate: Number
    }
  },
  
  // Security & Compliance
  security: {
    encryptionEnabled: {
      type: Boolean,
      default: true
    },
    vpnRequired: {
      type: Boolean,
      default: false
    },
    whitelistedIPs: [String],
    securityCertifications: [String],
    dataRetentionPolicy: String,
    isKYCCompliant: {
      type: Boolean,
      default: false
    }
  },
  
  // Software & Environment
  software: {
    operatingSystem: {
      type: String,
      required: true
    },
    dockerSupport: {
      type: Boolean,
      default: true
    },
    supportedFrameworks: [String],
    pythonVersions: [String],
    cudaVersions: [String],
    customImages: [{
      name: {
        type: String,
        required: true
      },
      description: String,
      dockerImage: {
        type: String,
        required: true
      },
      size: {
        type: Number,
        min: 1
      }
    }]
  },
  
  // Financial & Earnings
  earnings: {
    totalEarned: {
      type: Number,
      default: 0,
      min: 0
    },
    pendingPayouts: {
      type: Number,
      default: 0,
      min: 0
    },
    lastPayoutDate: Date,
    averageMonthlyEarnings: {
      type: Number,
      default: 0,
      min: 0
    },
    totalJobHours: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  
  // Verification & Trust
  verification: {
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationLevel: {
      type: String,
      enum: ['basic', 'advanced', 'enterprise'],
      default: 'basic'
    },
    verifiedAt: Date,
    verificationDocuments: [{
      type: {
        type: String,
        required: true
      },
      url: {
        type: String,
        required: true
      },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      }
    }],
    auditReports: [{
      date: {
        type: Date,
        required: true
      },
      auditor: {
        type: String,
        required: true
      },
      score: {
        type: Number,
        required: true,
        min: 0,
        max: 100
      },
      reportUrl: String
    }]
  },
  
  // Provider Settings
  settings: {
    autoAcceptJobs: {
      type: Boolean,
      default: false
    },
    maxConcurrentJobs: {
      type: Number,
      default: 1,
      min: 1
    },
    jobTypesAllowed: [String],
    minimumJobValue: {
      type: Number,
      default: 0,
      min: 0
    },
    requireDeposit: {
      type: Boolean,
      default: true
    },
    allowSpotInstances: {
      type: Boolean,
      default: false
    },
    notificationPreferences: {
      newJobs: {
        type: Boolean,
        default: true
      },
      jobUpdates: {
        type: Boolean,
        default: true
      },
      payments: {
        type: Boolean,
        default: true
      },
      maintenance: {
        type: Boolean,
        default: true
      }
    }
  },
  
  // Timestamps
  lastActiveAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
gpuProviderSchema.index({ userId: 1 });
gpuProviderSchema.index({ walletAddress: 1 });
gpuProviderSchema.index({ 'availability.status': 1 });
gpuProviderSchema.index({ 'availability.isOnline': 1 });
gpuProviderSchema.index({ 'pricing.hourlyRate': 1 });
gpuProviderSchema.index({ 'performance.reliabilityScore': -1 });
gpuProviderSchema.index({ 'performance.averageRating': -1 });
gpuProviderSchema.index({ 'verification.isVerified': 1 });
gpuProviderSchema.index({ 'location.country': 1 });
gpuProviderSchema.index({ lastActiveAt: -1 });
gpuProviderSchema.index({ createdAt: -1 });

// Compound indexes
gpuProviderSchema.index({ 'availability.status': 1, 'pricing.hourlyRate': 1 });
gpuProviderSchema.index({ 'verification.isVerified': 1, 'performance.averageRating': -1 });

// Instance Methods
gpuProviderSchema.methods.calculateHourlyRate = function(): number {
  // Calculate dynamic pricing based on demand, performance, etc.
  let baseRate = this.pricing.hourlyRate;
  
  // Performance bonus/penalty
  if (this.performance.averageRating > 4.0) {
    baseRate *= 1.1; // 10% bonus for high ratings
  } else if (this.performance.averageRating < 3.0) {
    baseRate *= 0.9; // 10% penalty for low ratings
  }
  
  // Verification bonus
  if (this.verification.isVerified) {
    baseRate *= 1.05; // 5% bonus for verified providers
  }
  
  return Math.round(baseRate * 100) / 100;
};

gpuProviderSchema.methods.updatePerformanceMetrics = async function(jobData: any): Promise<void> {
  // Update performance metrics based on job completion
  if (jobData.successful) {
    this.performance.successfulJobs += 1;
  } else {
    this.performance.failedJobs += 1;
  }
  
  this.performance.totalJobsCompleted += 1;
  
  if (jobData.duration) {
    const totalTime = this.performance.averageJobCompletionTime * (this.performance.totalJobsCompleted - 1);
    this.performance.averageJobCompletionTime = (totalTime + jobData.duration) / this.performance.totalJobsCompleted;
  }
  
  if (jobData.rating) {
    const totalRatingPoints = this.performance.averageRating * this.performance.totalRatings;
    this.performance.totalRatings += 1;
    this.performance.averageRating = (totalRatingPoints + jobData.rating) / this.performance.totalRatings;
  }
  
  if (jobData.earnings) {
    this.earnings.totalEarned += jobData.earnings;
    this.earnings.totalJobHours += jobData.duration || 0;
  }
  
  // Update reliability score
  const successRate = (this.performance.successfulJobs / this.performance.totalJobsCompleted) * 100;
  const baseScore = 1000;
  const successBonus = (successRate / 100) * 300;
  const ratingBonus = this.performance.averageRating * 200;
  const volumeBonus = Math.min(this.performance.totalJobsCompleted * 5, 500);
  
  this.performance.reliabilityScore = Math.min(baseScore + successBonus + ratingBonus + volumeBonus, 10000);
  
  await this.save();
};

gpuProviderSchema.methods.checkAvailability = function(): boolean {
  if (!this.availability.isOnline || this.availability.status !== 'available') {
    return false;
  }
  
  // Check if within scheduled hours
  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  const todaySchedule = this.availability.schedules.find((s: any) => s.dayOfWeek === currentDay);
  if (todaySchedule) {
    return currentTime >= todaySchedule.startTime && currentTime <= todaySchedule.endTime;
  }
  
  return false;
};

gpuProviderSchema.methods.toPublicJSON = function(): object {
  const provider = this.toObject();
  
  // Remove sensitive information
  delete provider.earnings.pendingPayouts;
  delete provider.settings.notificationPreferences;
  delete provider.verification.verificationDocuments;
  delete provider.__v;
  
  return provider;
};

// Virtuals
gpuProviderSchema.virtual('totalGPUs').get(function() {
  return this.hardware.gpus.length;
});

gpuProviderSchema.virtual('availableGPUs').get(function() {
  return this.hardware.gpus.filter(gpu => gpu.isAvailable).length;
});

gpuProviderSchema.virtual('successRate').get(function() {
  const total = this.performance.totalJobsCompleted;
  return total > 0 ? (this.performance.successfulJobs / total) * 100 : 0;
});

// Create and export model
export const GPUProvider: Model<IGPUProvider> = mongoose.model<IGPUProvider>('GPUProvider', gpuProviderSchema);
export default GPUProvider;
